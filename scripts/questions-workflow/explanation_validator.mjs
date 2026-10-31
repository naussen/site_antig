/**
 * Validador semântico de qualidade editorial de comentários para o PRO Questões.
 *
 * Implementa controle editorial rigoroso sobre resoluções e memórias de cálculo,
 * impedindo a publicação de templates genéricos, fórmulas sem substituição,
 * contas erradas, números alheios ao enunciado ou soluções puramente em imagem.
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
]);

/**
 * Extrai números explícitos de um texto para conferência de consistência.
 */
function extractNumbers(text) {
  if (!text) return [];
  const matches = text.match(/\b\d+(?:[.,]\d+)?%?\b/gu) || [];
  return matches.map((m) => m.replace("%", "").replace(/\./g, "").replace(",", "."));
}

/**
 * Avalia de forma segura uma expressão aritmética básica simples (somente números e +, -, *, ×, /)
 */
function evaluateArithmeticLhs(exprStr) {
  const sanitized = exprStr
    .replace(/×/g, "*")
    .replace(/\s+/g, "")
    .replace(/,/g, ".");
  if (!/^[\d\.\+\-\*\/]+$/.test(sanitized)) return null;
  // Tokens
  const tokens = sanitized.match(/(?:\d+(?:\.\d+)?|[\+\-\*\/])/g);
  if (!tokens) return null;

  // Avaliação sequencial respeitando ordem básica de operações simples
  try {
    // Parser simples determinístico sem eval
    const numbers = [];
    const ops = [];
    let i = 0;
    while (i < tokens.length) {
      const tok = tokens[i];
      if (/^[\+\-\*\/]$/.test(tok)) {
        ops.push(tok);
        i++;
      } else {
        let val = parseFloat(tok);
        // Multiplicação e divisão imediatas
        if (ops.length > 0 && (ops[ops.length - 1] === "*" || ops[ops.length - 1] === "/")) {
          const prevOp = ops.pop();
          const prevVal = numbers.pop();
          val = prevOp === "*" ? prevVal * val : prevVal / val;
        }
        numbers.push(val);
        i++;
      }
    }
    // Soma e subtração finais
    let result = numbers[0];
    for (let j = 0; j < ops.length; j++) {
      const op = ops[j];
      const nextVal = numbers[j + 1];
      if (op === "+") result += nextVal;
      else if (op === "-") result -= nextVal;
    }
    return result;
  } catch {
    return null;
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
    if (/\b(?:probabilidade|porcentagem|combinatória|arranjo|permutação|quantos modos|quantas maneiras)\b/iu.test(statement)) {
      return true;
    }
    if (/\d+%\b|R\$\s*\d|\b\d+\s*(?:dias|anos|meses|litros|metros|clientes|pessoas)\b/iu.test(statement)) {
      return true;
    }
  }

  if (/R\$\s*\d+[\.,\d]*|\b(?:juros simples|juros compostos|sistema price|sistema sac)\b/iu.test(statement)) {
    return true;
  }

  return false;
}

/**
 * Detecta se a questão é estritamente conceitual (sem dados numéricos).
 */
export function isStrictlyConceptual(question, disciplineSlug = "") {
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
 * Valida a qualidade semântica da explicação de uma questão.
 *
 * @param {object} question - Questão a ser validada
 * @param {object} [options] - Opções adicionais (ex: disciplineSlug)
 * @returns {{ valid: boolean, errors: Array<{ code: string, message: string }> }}
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

  // 5. Exigência de Memória de Cálculo Passo a Passo para itens com cálculo
  if (needsCalc) {
    const hasMemoriaHeader = /Mem[oó]ria de c[áa]lculo|Passo a passo/iu.test(explanation);
    if (!hasMemoriaHeader) {
      errors.push({
        code: "calculation_memory_header_missing",
        message: "Questão com cálculo exige a seção textual 'Memória de cálculo — passo a passo'.",
      });
    }

    // 5.1 Fórmula sem substituição
    const hasFormula = /\b(?:P\(X\s*=\s*k\)|a_n\s*=\s*a_1|\binom\{n\}\{k\}|PMT\s*=|J\s*=\s*P\s*\*\s*i)\b/iu.test(explanation) ||
                       /\$\$.*?=.+?\$\$/su.test(explanation);
    const hasValuesSubstituted = /\d+\s*[\+\-\*×÷\/]\s*\d+|\d+\s*=\s*\d+/u.test(explanation);
    if (hasFormula && !hasValuesSubstituted && !hasImage) {
      errors.push({
        code: "formula_without_substitution",
        message: "A fórmula foi apresentada sem a substituição dos dados reais do problema e operações intermediárias.",
      });
    }

    // 5.2 Validação de números alheios ao enunciado
    const statementNumbers = extractNumbers(statement);
    const explanationNumbers = extractNumbers(explanation);
    if (statementNumbers.length > 0 && explanationNumbers.length === 0 && !hasImage) {
      errors.push({
        code: "incomplete_calculation_memory",
        message: "A resolução qualitativa não apresenta os números e grandezas informados no enunciado.",
      });
    }

    // 5.3 Validação de consistência aritmética direta
    // Varredura de linhas com expressões do tipo LHS = RHS
    // Ex: "25000 * 0.02 = 500" ou "25000 + 500 + 600 = 26100"
    const lines = explanation.split("\n");
    for (const line of lines) {
      const eqMatch = line.match(/(?:^|[^\w\.\+\-\*\/])([\d\.,\s\+\-\*×\/]+)=\s*(?:R\$\s*)?([\d\.,]+)/u);
      if (eqMatch) {
        const lhsRaw = eqMatch[1].trim();
        const rhsRaw = eqMatch[2].trim().replace(/\./g, "").replace(",", ".");
        // Deve conter ao menos uma operação matemática no LHS
        if (/[\+\-\*×\/]/.test(lhsRaw)) {
          const expected = evaluateArithmeticLhs(lhsRaw);
          const actual = parseFloat(rhsRaw);
          if (expected !== null && Number.isFinite(actual) && actual > 0) {
            // Tolerância proporcional (1%) ou absoluta (0.05) para arredondamentos
            const diff = Math.abs(expected - actual);
            if (diff > 0.05 && diff / actual > 0.01) {
              errors.push({
                code: "arithmetic_error_or_calculation_mismatch",
                message: `Erro aritmético detectado na operação: ${lhsRaw} = ${rhsRaw} (resultado real esperado: ${expected}).`,
              });
            }
          }
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
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
