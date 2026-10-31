import assert from "node:assert/strict";
import test from "node:test";
import { validateExplanationQuality } from "../scripts/questions-workflow/explanation_validator.mjs";

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

test("reprova erro aritmético em operação intermediária explícita", () => {
  const question = {
    statement_markdown: "Boleto de R$ 25.000,00 com multa de 2%.",
    explanation: {
      body_markdown: "### Memória de cálculo — passo a passo\n\n1. Multa:\n25000 * 0.02 = 600\nO valor da multa é 600.",
    },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "matematica-financeira" });
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

test("aprova resolução quantitativa com memória de cálculo completa e passos para iniciantes", () => {
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
   - Multa: 25000 * 0.02 = 500
   - Juros diários: 25000 * 0.002 = 50
   - Juros totais: 50 * 12 = 600
   - Total: 25000 + 500 + 600 = 26100
6. **Resultado e interpretação:** O total devido é R\\$ 26.100,00, correspondente à alternativa (C).`,
    },
  };
  const res = validateExplanationQuality(question, { disciplineSlug: "matematica-financeira" });
  assert.equal(res.valid, true);
  assert.equal(res.errors.length, 0);
});
