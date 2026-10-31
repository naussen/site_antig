import assert from "node:assert/strict";
import test from "node:test";
import { validateExplanationQuality, ArithmeticParser } from "../scripts/questions-workflow/explanation_validator.mjs";

test("reprova comentário vazio", () => {
  const question = {
    statement_markdown: "Calcule 2 + 2.",
    explanation: { body_markdown: "   " },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "matematica" });
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => e.code === "explanation_empty"));
});

test("reprova template genérico de compatibilidade com noções teóricas", () => {
  const question = {
    statement_markdown: "Devido às oscilações de receita... boleto de R$ 25.000,00 com 12 dias de atraso...",
    explanation: {
      body_markdown: "O conteúdo cobrado no item desenvolve o tema de juros simples e compostos, sendo a opção (C) compatível com as noções teóricas e técnicas exigidas no edital.",
    },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "matematica-financeira" });
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => e.code === "generic_template_explanation"));
});

test("reprova solução que reside exclusivamente em imagem sem memória textual", () => {
  const question = {
    statement_markdown: "Calcule o montante acumulado de R$ 10.000,00 a juros simples de 10% em 2 anos.",
    explanation: {
      body_markdown: "![Memória de cálculo](/resumos/questions/calculations/pdf_teste_001.png)",
    },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "matematica" });
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => e.code === "solution_only_in_image"));
});

test("reprova fórmula teórica sem substituição de valores e sem operações", () => {
  const question = {
    statement_markdown: "Calcule a probabilidade binomial de 1 acerto em 4 ensaios com p = 0,25.",
    explanation: {
      body_markdown: "### Memória de cálculo — passo a passo\n\nAplica-se a fórmula da distribuição binomial:\n$$P(X = k) = \\binom{n}{k} \\cdot p^k \\cdot q^{n - k}$$\nEfetuando os cálculos, obtém-se o resultado da assertiva.",
    },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "estatistica" });
  assert.equal(res.valid, false);
  assert.ok(
    res.errors.some((e) => e.code === "formula_without_substitution" || e.code === "intermediate_operations_omitted")
  );
});

// ============================================================================
// CONTRAEXEMPLOS DO PARECER DE ENTRADA (REGRESSÕES OBRIGATÓRIAS)
// ============================================================================

test("REGRESSÃO PARECER 1.a: reprova conta manifestamente falsa com zero (2 + 2 = 0)", () => {
  const question = {
    statement_markdown: "Devido às oscilações de receita... boleto de R$ 25.000,00 com 12 dias de atraso e juros de 2%...",
    explanation: {
      body_markdown: "Memória de cálculo — passo a passo: 2 + 2 = 0",
    },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "matematica-financeira" });
  assert.equal(res.valid, false, "Deve rejeitar 2 + 2 = 0");
  assert.ok(
    res.errors.some((e) => e.code === "arithmetic_error_or_calculation_mismatch"),
    "Deve apontar erro aritmético no validador determinístico"
  );
});

test("REGRESSÃO PARECER 1.b: reprova conta desconectada sem correspondência com dados do problema (900 + 900 = 1800)", () => {
  const question = {
    statement_markdown: "Devido às oscilações de receita... boleto de R$ 25.000,00 com 12 dias de atraso e juros de 2%...",
    explanation: {
      body_markdown: "Memória de cálculo — passo a passo: 900 + 900 = 1800. Portanto o boleto de 25000 será de 1800.",
    },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "matematica-financeira" });
  assert.equal(res.valid, false, "Deve rejeitar resolução sem relação com os dados reais");
  assert.ok(
    res.errors.some((e) => e.code === "unrelated_data_or_unsupported_model"),
    "Deve acusar falta de relacionamento com os dados e hipóteses do enunciado"
  );
});

// ============================================================================
// PARSER ARITMÉTICO DETERMINÍSTICO E CASOS DE BORDA (ZERO, NEGATIVOS, PT-BR)
// ============================================================================

test("parser aritmético: trata zero e negativos corretamente", () => {
  const evalZero = ArithmeticParser.evaluate("5 - 5");
  assert.equal(evalZero.valid, true);
  assert.equal(evalZero.value, 0);

  const evalNeg = ArithmeticParser.evaluate("5 - 10");
  assert.equal(evalNeg.valid, true);
  assert.equal(evalNeg.value, -5);

  const evalUnary = ArithmeticParser.evaluate("-(2 + 3)");
  assert.equal(evalUnary.valid, true);
  assert.equal(evalUnary.value, -5);
});

test("parser aritmético: trata decimais brasileiros (vírgula) e milhares (ponto)", () => {
  const evalMilhar = ArithmeticParser.evaluate("25.000 * 0,02");
  assert.equal(evalMilhar.valid, true);
  assert.equal(evalMilhar.value, 500);

  const evalDec = ArithmeticParser.evaluate("25.000,50 + 10,50");
  assert.equal(evalDec.valid, true);
  assert.equal(evalDec.value, 25011);

  const evalPct = ArithmeticParser.evaluate("25.000 * 2%");
  assert.equal(evalPct.valid, true);
  assert.equal(evalPct.value, 500);
});

test("parser aritmético: respeita precedência de operadores e parênteses", () => {
  const precedence = ArithmeticParser.evaluate("2 + 3 * 4");
  assert.equal(precedence.valid, true);
  assert.equal(precedence.value, 14);

  const parens = ArithmeticParser.evaluate("(2 + 3) * 4");
  assert.equal(parens.valid, true);
  assert.equal(parens.value, 20);

  const pow = ArithmeticParser.evaluate("2 ^ 3 + 1");
  assert.equal(pow.valid, true);
  assert.equal(pow.value, 9);
});

test("parser aritmético: rejeita expressões malformadas e divisão por zero", () => {
  const malformed = ArithmeticParser.evaluate("2 + * 3");
  assert.equal(malformed.valid, false);
  assert.equal(malformed.malformed, true);

  const divZero = ArithmeticParser.evaluate("10 / 0");
  assert.equal(divZero.valid, false);
  assert.match(divZero.error, /Divisão por zero/iu);
});

test("validador: aceita igualdade válida com zero e com resultado negativo", () => {
  const question = {
    statement_markdown: "Um investidor com R$ 1.000 aplicados teve lucro de R$ 500 e prejuízo de R$ 500. Calcule o resultado líquido.",
    explanation: {
      body_markdown: `### Memória de cálculo — passo a passo
1. Dados: R$ 1.000, lucro 500, prejuízo 500.
2. Contas:
   - 500 - 500 = 0
   - Resultado líquido: 0
3. Alternativa (A).`,
    },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "matematica-financeira" });
  assert.equal(res.valid, true, "500 - 500 = 0 deve ser aceito sem erro");
});

test("validador: reprova precedência errada (2 + 3 * 4 = 20)", () => {
  const question = {
    statement_markdown: "Considere os valores 2, 3 e 4 com taxa de 10%...",
    explanation: {
      body_markdown: `### Memória de cálculo — passo a passo
1. Dados do enunciado: 2, 3, 4.
2. Cálculo: 2 + 3 * 4 = 20
3. Alternativa (B).`,
    },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "matematica" });
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => e.code === "arithmetic_error_or_calculation_mismatch"));
});

test("reprova cálculo artificial / fórmula de inclusão-exclusão em questão conceitual sem dados numéricos", () => {
  const question = {
    statement_markdown: "Questão 12\n\n## Enunciado\n\nSe todo verdureiro é apicultor, existe apicultor que é vaqueiro e nenhum vaqueiro é produtor de soja, assinale a opção correta.",
    explanation: {
      body_markdown: "Pelo princípio da inclusão-exclusão para três conjuntos finitos:\nN(A U B U C) = n(A) + n(B) + n(C) - [n(A n B) + n(A n C) + n(B n C)] + n(A n B n C).\nSubstituindo os valores apresentados no enunciado, determina-se que a opção (E) é correta.",
    },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "raciocinio-logico" });
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => e.code === "artificial_calculation_on_conceptual_item"));
});

test("aprova questão conceitual com demonstração dedutiva passo a passo", () => {
  const question = {
    statement_markdown: "Questão 12\n\n## Enunciado\n\nSe todo verdureiro é apicultor, existe apicultor que é vaqueiro e nenhum vaqueiro é produtor de soja, assinale a opção correta.",
    explanation: {
      body_markdown: "### Demonstração passo a passo\n\n1. **Objetivo:** Analisar a validade da dedução lógica entre as categorias dadas.\n2. **Premissas:**\n   - Todo verdureiro é apicultor: $V \\subseteq A$.\n   - Existe apicultor que é vaqueiro: $A \\cap Q \\ne \\emptyset$.\n   - Nenhum vaqueiro é produtor de soja: $Q \\cap S = \\emptyset$.\n3. **Dedução:** Se todo apicultor for vaqueiro ($A \\subseteq Q$), como $V \\subseteq A$, segue que $V \\subseteq Q$. Como $Q \\cap S = \\emptyset$, nenhum verdureiro pode ser produtor de soja ($V \\cap S = \\emptyset$).\n4. **Conclusão:** Alternativa (E).",
    },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "raciocinio-logico" });
  assert.equal(res.valid, true);
});

test("aprova resolução quantitativa legítima com memória de cálculo completa e passos para iniciantes", () => {
  const question = {
    statement_markdown: "Devido às oscilações de receita... boleto de R$ 25.000,00 com 12 dias de atraso, multa de 2% e juros de 0,2% ao dia.",
    explanation: {
      body_markdown: `Análise didática da Questão 28 do Banco do Brasil:

### Memória de cálculo — passo a passo

1. **O que a questão quer descobrir:** O valor total devido no boleto com juros e multa.
2. **Dados do enunciado:** Principal R\\$ 25.000,00; atraso de 12 dias; multa de 2%; juros de 0,2% ao dia.
3. **Conversões:** 2% = 0,02; 0,2% = 0,002.
4. **Fórmula:** Total = Principal + Multa + Juros.
5. **Substituição e operações intermediárias:**
   - Multa: 25.000 * 0,02 = 500
   - Juros diários: 25.000 * 0,002 = 50
   - Juros totais: 50 * 12 = 600
   - Total: 25.000 + 500 + 600 = 26.100
6. **Resultado e interpretação:** O total devido é R\\$ 26.100,00, correspondente à alternativa (C).`,
    },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "matematica-financeira" });
  assert.equal(res.valid, true);
  assert.equal(res.errors.length, 0);
});
