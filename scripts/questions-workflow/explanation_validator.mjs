/**
 * Validador semântico de qualidade editorial de comentários para o PRO Questões.
 *
 * Implementa controle editorial rigoroso e determinístico sobre resoluções e memórias de cálculo:
 * 1. Análise aritmética determinística (sem eval/Function), tratando zero, negativos, decimais PT-BR,
 *    milhares, porcentagens, parênteses, precedência e divisão por zero.
 * 2. Correspondência semântica: conferência de que as grandezas e hipóteses do enunciado
 *    estão presentes e fundamentam as operações.
 * 3. Suficiência didática e coerência da conclusão com o comando e as alternativas cadastradas.
 */

const GENERIC_TEMPLATE_PATTERNS = [
  /compat[ií]vel com as no[çc][õo]es te[óo]ricas e t[ée]cnicas/iu,
  /compat[ií]vel com as no[çc][õo]es te[óo]ricas/iu,
  /compat[ií]vel com a teoria/iu,
  /em conson[âa]ncia com as normas aplic[áa]veis/iu,
  /sendo a op[çc][ãa]o \([A-E]\) compat[ií]vel/iu,
  /estando a alternativa \([A-E]\) em conson[âa]ncia/iu,
];

const QUANTITATIVE_DISCIPLINES = new Set([
  "matematica",
  "matematica-financeira",
  "estatistica",
  "fisica",
  "contabilidade-geral-e-avancada",
  "contabilidade-publica",
]);

/**
 * Normaliza e extrai números de um texto.
 * Reconhece formatos brasileiros ("25.000,00", "2%", "0,2") e internacionais ("25000.00").
 */
export function extractNumbers(text) {
  if (!text) return [];
  // Remover referências a datas (ex: 2021) ou títulos que possam poluir
  const clean = text.replace(/https?:\/\/\S+/g, "").replace(/\b(?:19|20)\d\d\b/g, " ");
  const matches = clean.match(/\b\d{1,3}(?:\.\d{3})+(?:,\d+)?%?|\b\d+(?:[.,]\d+)?%?\b/gu) || [];
  
  return matches.map((m) => {
    let raw = m.trim();
    const isPct = raw.endsWith("%");
    if (isPct) raw = raw.slice(0, -1);
    
    // Se tem ponto e vírgula (ex: 25.000,50), remove pontos de milhar e substitui vírgula por ponto
    if (raw.includes(".") && raw.includes(",")) {
      raw = raw.replace(/\./g, "").replace(",", ".");
    } else if (raw.includes(".") && /^\d{1,3}(?:\.\d{3})+$/.test(raw)) {
      // Milhar brasileiro com ponto puro (ex: 25.000)
      raw = raw.replace(/\./g, "");
    } else if (raw.includes(",")) {
      raw = raw.replace(",", ".");
    }
    const val = parseFloat(raw);
    return {
      raw: m,
      val: Number.isFinite(val) ? val : null,
      isPercentage: isPct,
    };
  }).filter((n) => n.val !== null);
}

/**
 * Tokenizador e Parser Aritmético Determinístico (Recursive Descent / Shunting-Yard).
 * Suporta: +, -, *, /, ×, ÷, %, ^, parênteses e números decimais/negativos.
 * NÃO utiliza eval() ou new Function().
 */
export class ArithmeticParser {
  static tokenize(exprStr) {
    const s = exprStr
      .replace(/×/g, "*")
      .replace(/·/g, "*")
      .replace(/÷/g, "/")
      .replace(/\s+/g, "");

    const tokens = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];

      if (ch === "(" || ch === ")") {
        tokens.push({ type: "paren", val: ch });
        i++;
      } else if (ch === "+" || ch === "*" || ch === "/" || ch === "^") {
        tokens.push({ type: "op", val: ch });
        i++;
      } else if (ch === "-") {
        // Distinguir operador binário de menos unário
        const prev = tokens[tokens.length - 1];
        if (!prev || prev.type === "op" || (prev.type === "paren" && prev.val === "(")) {
          tokens.push({ type: "unary", val: "-" });
        } else {
          tokens.push({ type: "op", val: "-" });
        }
        i++;
      } else if (/\d/.test(ch) || (ch === "," && /\d/.test(s[i + 1])) || (ch === "." && /\d/.test(s[i + 1]))) {
        let numStr = "";
        let dotCount = 0;
        let commaCount = 0;
        while (i < s.length && /[\d\.,]/.test(s[i])) {
          if (s[i] === ".") dotCount++;
          if (s[i] === ",") commaCount++;
          numStr += s[i];
          i++;
        }
        // Tratar porcentagem logo após o número (ex: 2%)
        let isPct = false;
        if (i < s.length && s[i] === "%") {
          isPct = true;
          i++;
        }

        // Normalização numérica
        let normalized = numStr;
        if (dotCount > 0 && commaCount > 0) {
          normalized = normalized.replace(/\./g, "").replace(",", ".");
        } else if (dotCount > 0 && /^\d{1,3}(?:\.\d{3})+$/.test(normalized)) {
          normalized = normalized.replace(/\./g, "");
        } else if (commaCount > 0) {
          normalized = normalized.replace(",", ".");
        }

        let val = parseFloat(normalized);
        if (isPct) val = val / 100;
        tokens.push({ type: "num", val });
      } else {
        // Caractere não aritmético (variável ou símbolo não suportado)
        return { ok: false, error: `Caractere não suportado na expressão: '${ch}'` };
      }
    }
    return { ok: true, tokens };
  }

  static parse(tokens) {
    let pos = 0;

    function peek() {
      return tokens[pos];
    }

    function consume(expectedVal) {
      const tok = tokens[pos];
      if (!tok || (expectedVal && tok.val !== expectedVal)) {
        throw new Error(`Esperado '${expectedVal}', encontrado '${tok?.val}'`);
      }
      pos++;
      return tok;
    }

    // Grammar:
    // Expr   := AddExpr
    // AddExpr:= MulExpr (('+' | '-') MulExpr)*
    // MulExpr:= ExpExpr (('*' | '/') ExpExpr)*
    // ExpExpr:= UnaryExpr ('^' ExpExpr)*
    // UnaryExpr := ('-' UnaryExpr) | Primary
    // Primary:= NUM | '(' Expr ')'

    function parsePrimary() {
      const tok = peek();
      if (!tok) throw new Error("Expressão malformada: término inesperado");
      if (tok.type === "num") {
        consume();
        return tok.val;
      }
      if (tok.type === "paren" && tok.val === "(") {
        consume("(");
        const val = parseAdd();
        consume(")");
        return val;
      }
      throw new Error(`Token inesperado: ${tok.val}`);
    }

    function parseUnary() {
      const tok = peek();
      if (tok && tok.type === "unary" && tok.val === "-") {
        consume();
        const operand = parseUnary();
        return -operand;
      }
      return parsePrimary();
    }

    function parseExp() {
      let left = parseUnary();
      while (pos < tokens.length && peek()?.type === "op" && peek()?.val === "^") {
        consume("^");
        const right = parseExp(); // associatividade à direita
        left = Math.pow(left, right);
      }
      return left;
    }

    function parseMul() {
      let left = parseExp();
      while (pos < tokens.length && peek()?.type === "op" && (peek()?.val === "*" || peek()?.val === "/")) {
        const op = consume().val;
        const right = parseExp();
        if (op === "*") {
          left = left * right;
        } else {
          if (right === 0) throw new Error("Divisão por zero");
          left = left / right;
        }
      }
      return left;
    }

    function parseAdd() {
      let left = parseMul();
      while (pos < tokens.length && peek()?.type === "op" && (peek()?.val === "+" || peek()?.val === "-")) {
        const op = consume().val;
        const right = parseMul();
        if (op === "+") {
          left = left + right;
        } else {
          left = left - right;
        }
      }
      return left;
    }

    const result = parseAdd();
    if (pos < tokens.length) {
      throw new Error(`Token residual inesperado: ${tokens[pos].val}`);
    }
    return result;
  }

  static evaluate(exprStr) {
    try {
      const tokRes = this.tokenize(exprStr);
      if (!tokRes.ok) return { valid: false, error: tokRes.error, unsupported: true };
      const val = this.parse(tokRes.tokens);
      if (!Number.isFinite(val)) return { valid: false, error: "Resultado não finito (NaN ou infinito)" };
      return { valid: true, value: val };
    } catch (err) {
      return { valid: false, error: err.message, malformed: true };
    }
  }
}

/**
 * Detecta se a questão exige resolução quantitativa com cálculo.
 */
export function requiresCalculation(question, disciplineSlug = "") {
  const statement = question.statement_markdown || "";
  const disc = disciplineSlug.toLowerCase();

  if (QUANTITATIVE_DISCIPLINES.has(disc)) {
    if (/R\$\s*\d|\d+[\.,]?\d*\s*%|\bcalcul|calcule|determine|quantos|qual o valor|taxa|montante|probabilidade/iu.test(statement)) {
      return true;
    }
  }

  if (disc === "raciocinio-logico") {
    if (/\b(?:probabilidade|porcentagem|combinat[oó]ria|arranjo|permuta[cç][aã]o|quantos modos|quantas maneiras)\b/iu.test(statement)) {
      return true;
    }
    if (/\d+%\b|R\$\s*\d|\b\d+\s*(?:dias|anos|meses|litros|metros|clientes|pessoas)\b/iu.test(statement)) {
      return true;
    }
  }

  // Apenas se for explicitamente matemática financeira ou comando que exige cálculo
  if (/\b(?:juros simples|juros compostos|sistema price|sistema sac|tabela price|valor presente l[ií]quido|taxa interna de retorno)\b/iu.test(statement)) {
    return true;
  }
  if (/R\$\s*\d+[\.,\d]*/iu.test(statement) && /\b(?:calcule|qual o valor total devido|determine o montante|qual o total devido)\b/iu.test(statement)) {
    return true;
  }

  return false;
}

/**
 * Detecta se a questão é estritamente conceitual (sem dados numéricos).
 */
export function isStrictlyConceptual(question, _disciplineSlug = "") {
  const statement = question.statement_markdown || "";
  if (/todo\s+\w+\s+[ée]|nenhum\s+\w+\s+[ée]|algum\s+\w+\s+[ée]|existe\s+\w+\s+que/iu.test(statement)) {
    const cleanStatement = statement.replace(/^Questão\s+\d+/iu, "").replace(/## Enunciado/iu, "");
    const contentNumbers = extractNumbers(cleanStatement);
    if (contentNumbers.length === 0) {
      return true;
    }
  }
  return false;
}

/**
 * Valida a qualidade semântica da explicação de uma questão em 3 camadas:
 * 1. Rigor e exatidão aritmética determinística.
 * 2. Correspondência semântica com os dados do enunciado.
 * 3. Suficiência didática e correspondência com as opções/gabarito.
 */
export function validateExplanationQuality(question, options = {}) {
  const errors = [];
  const explanation = question.explanation?.body_markdown || "";
  const statement = question.statement_markdown || "";
  const disciplineSlug = options.disciplineSlug || question.source_metadata?.discipline_slug || "";

  // 1. Comentário vazio
  if (!explanation.trim()) {
    errors.push({
      code: "explanation_empty",
      message: "O comentário da questão está vazio.",
    });
    return { valid: false, errors };
  }

  // 2. Comentário genérico de template
  for (const pattern of GENERIC_TEMPLATE_PATTERNS) {
    if (pattern.test(explanation)) {
      errors.push({
        code: "generic_template_explanation",
        message: "O comentário utiliza template genérico sem fundamentação específica da resolução.",
      });
      break;
    }
  }

  // 3. Solução existente apenas em imagem
  const hasImage = /!\[.*?\]\(\/resumos\/questions\/calculations\/.*?\)/u.test(explanation) || /<img\s+[^>]*src=/iu.test(explanation);
  const textWithoutImage = explanation.replace(/!\[.*?\]\(.*?\)/gu, "").replace(/<img[^>]*>/giu, "").trim();
  if (hasImage && textWithoutImage.length < 80) {
    errors.push({
      code: "solution_only_in_image",
      message: "A explicação reside exclusivamente na imagem, sem memória de cálculo textual acessível para o usuário.",
    });
  }

  const needsCalc = requiresCalculation(question, disciplineSlug);
  const isConceptual = isStrictlyConceptual(question, disciplineSlug);

  // 4. Questão conceitual com cálculo fictício inventado
  if (isConceptual) {
    if (/N\(A\s*U\s*B\s*U\s*C\)|princ[íi]pio da inclus[ãa]o-exclus[ãa]o.*substituindo os valores/iu.test(explanation)) {
      errors.push({
        code: "artificial_calculation_on_conceptual_item",
        message: "Fórmula numérica e cálculo artificial aplicados indevidamente a item puramente conceitual de lógica.",
      });
    }
  }

  // 5. Verificações de Memória de Cálculo Quantitativa
  if (needsCalc) {
    const hasMemoriaHeader = /Mem[oó]ria de c[áa]lculo|Passo a passo/iu.test(explanation);
    if (!hasMemoriaHeader) {
      errors.push({
        code: "calculation_memory_header_missing",
        message: "Questão com cálculo exige a seção textual 'Memória de cálculo — passo a passo'.",
      });
    }

    // 5.1 Validação de substituição de fórmulas
    const hasFormula = /\b(?:P\(X\s*=\s*k\)|a_n\s*=\s*a_1|\binom\{n\}\{k\}|PMT\s*=|J\s*=\s*P\s*\*\s*i)\b/iu.test(explanation) ||
                       /\$\$.*?=.+?\$\$/su.test(explanation);
    const hasValuesSubstituted = /\d+\s*[\+\-\*×÷\/]\s*\d+|\d+\s*=\s*\d+/u.test(explanation);
    if (hasFormula && !hasValuesSubstituted && !hasImage) {
      errors.push({
        code: "formula_without_substitution",
        message: "A fórmula foi apresentada sem a substituição dos dados reais do problema e operações intermediárias.",
      });
    }

    // 5.2 Validação de dados do enunciado presentes na resolução (Correspondência de Dados)
    const stmtNumbers = extractNumbers(statement).map((n) => n.val);
    const expNumbers = extractNumbers(explanation).map((n) => n.val);

    if (stmtNumbers.length > 0 && expNumbers.length === 0 && !hasImage) {
      errors.push({
        code: "incomplete_calculation_memory",
        message: "A resolução qualitativa não apresenta os números e grandezas informados no enunciado.",
      });
    }

    // 5.3 Validação Aritmética Determinística com Parser
    // Encontrar todas as igualdades matemáticas: LHS = RHS ou LHS ≈ RHS
    const lines = explanation.split("\n");
    const calculationOperands = new Set();

    for (const rawLine of lines) {
      // Limpeza de markdown de listas e negritos estruturais para isolar expressões
      const cleanLine = rawLine
        .replace(/^\s*(?:[\*\-\+]|\d+\.)\s+/, "")
        .replace(/\*\*[^*]+\*\*:?/g, "")
        .trim();

      const eqMatches = [...cleanLine.matchAll(/(?:^|[^\w\.\+\-\*\/])([0-9\(\)\-\+][0-9\.,\s\+\-\*×·÷\/\(\)\^%]*)\s*(=|≈)\s*(?:R\$\s*)?([\-]?[0-9\.,\/\(\)]+%?)/gu)];
      for (const eqMatch of eqMatches) {
        let lhsRaw = eqMatch[1].trim();
        const isApprox = eqMatch[2] === "≈";
        const rhsRaw = eqMatch[3].trim();

        // Deve conter ao menos um operador no LHS para constituir operação aritmética
        if (/[\+\-\*×·÷\/\^%]/.test(lhsRaw)) {
          // Coletar operandos utilizados na conta
          const operands = extractNumbers(lhsRaw);
          for (const op of operands) {
            if (op.val !== null) calculationOperands.add(op.val);
          }

          // Avaliar LHS
          const lhsEval = ArithmeticParser.evaluate(lhsRaw);
          if (lhsEval.malformed) {
            errors.push({
              code: "malformed_arithmetic_expression",
              message: `Expressão matemática malformada detectada: '${lhsRaw}' (${lhsEval.error}).`,
            });
            continue;
          }

          if (lhsEval.valid) {
            // Avaliar RHS
            const rhsEval = ArithmeticParser.evaluate(rhsRaw);
            if (rhsEval.valid) {
              const expected = lhsEval.value;
              const actual = rhsEval.value;

              const absDiff = Math.abs(expected - actual);
              // Tolerância de aproximação:
              // Se for símbolo '≈', permite até 2% de diferença
              // Se for '=', tolerância estrita de ponto flutuante ou arredondamento de centavos
              const maxTol = isApprox ? Math.max(0.05, Math.abs(actual) * 0.02) : (Math.abs(actual) > 100 ? 0.05 : 0.005);

              if (absDiff > maxTol) {
                errors.push({
                  code: "arithmetic_error_or_calculation_mismatch",
                  message: `Erro aritmético detectado na operação: ${lhsRaw} = ${rhsRaw} (calculado: ${expected}, informado: ${actual}).`,
                });
              }
            }
          }
        }
      }
    }

    // Verificar se ao menos um operando utilizado nas contas decorre do enunciado
    // Evita contas arbitrárias desconectadas (contraexemplo: 900 + 900 = 1800 para boleto de 25000)
    if (stmtNumbers.length > 0 && !hasImage && calculationOperands.size > 0) {
      const significantStmtNumbers = stmtNumbers.filter((n) => n > 2 || n < -2);
      if (significantStmtNumbers.length > 0) {
        const matchesAnyStmtNumber = significantStmtNumbers.some((sNum) =>
          [...calculationOperands].some((cNum) =>
            Math.abs(sNum - cNum) < 0.001 ||
            (sNum > 0 && Math.abs((sNum - cNum) / sNum) < 0.001) ||
            Math.abs(sNum / 100 - cNum) < 0.0001 // conversão de taxa (ex: 2% -> 0.02)
          )
        );
        if (!matchesAnyStmtNumber) {
          errors.push({
            code: "unrelated_data_or_unsupported_model",
            message: "As operações da memória de cálculo não utilizam os dados numéricos fundamentais do enunciado.",
          });
        }
      }
    }

    // 5.4 Rejeição de omissão de contas com frases vagas
    if (/efetuando os c[áa]lculos,? obt[ée]m-se/iu.test(explanation) && !/\d+\s*[\+\-\*×÷\/]\s*\d+/u.test(explanation)) {
      errors.push({
        code: "intermediate_operations_omitted",
        message: "Operações intermediárias foram omitidas com a expressão 'efetuando os cálculos'.",
      });
    }

    // 5.5 Coerência entre conclusão e dados do problema
    // Se a questão possui alternativas cadastradas (question.options) e o comentário conclui um valor
    if (question.options && question.options.length > 0) {
      // Verificar se a opção gabaritada é citada
      const correctLabel = question.correct_option_label;
      if (correctLabel && !hasImage) {
        const mentionsCorrectOption = new RegExp(`(?:alternativa|op[çc][ãa]o|gabarito|letra)\\s*\\(?${correctLabel}\\)?`, "iu").test(explanation);
        if (!mentionsCorrectOption) {
          // Se não menciona explicitamente a letra correta, verificar se ao menos menciona uma das alternativas
          const mentionsAnyOption = /(?:alternativa|op[çc][ãa]o|gabarito|letra)\s*\(?[A-E]\)?/iu.test(explanation);
          if (!mentionsAnyOption && !/item\s+(?:certo|errado)/iu.test(explanation)) {
            errors.push({
              code: "conclusion_option_missing",
              message: "A explicação não conclui qual é a alternativa correta correspondente ao resultado.",
            });
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
