type MarkdownAstNode = {
  type: string;
  value?: string;
  children?: MarkdownAstNode[];
};

function normalizeLatexExpression(expression: string) {
  return expression
    .replace(/\\(?:text|operatorname)\{([^{}]*)\}/g, "$1")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\\(?:left|right)\b/g, "")
    .replace(/\\(?:Longrightarrow|Rightarrow|implies)\b/g, "⇒")
    .replace(/\\(?:longrightarrow|rightarrow|to)\b/g, "→")
    .replace(/\\(?:geqslant|geq)\b/g, "≥")
    .replace(/\\(?:leqslant|leq)\b/g, "≤")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\times\b/g, "×")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\div\b/g, "÷")
    .replace(/\\pm\b/g, "±")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\%/g, "%")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Torna a notação matemática legível sem habilitar um interpretador LaTeX.
 * Blocos $$ continuam identificáveis pelo MarkdownViewer; fórmulas inline
 * perdem apenas os delimitadores que o renderizador atual não interpreta.
 */
export function normalizeMarkdownMathNotation(markdown: string) {
  return String(markdown || "")
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, expression: string) => (
      `$$${normalizeLatexExpression(expression)}$$`
    ))
    .replace(/(^|[^\\$])\$([^$\n]+)\$/g, (_, prefix: string, expression: string) => (
      `${prefix}${normalizeLatexExpression(expression)}`
    ));
}

/**
 * Converte somente HTML <br> em quebra semântica da AST Markdown.
 * Qualquer outra tag HTML permanece bloqueada pelo react-markdown.
 */
export function remarkSafeBreaks() {
  return (tree: MarkdownAstNode) => {
    const visit = (node: MarkdownAstNode) => {
      if (!node.children) return;

      node.children = node.children.map((child) => {
        if (child.type === "html" && /^<br\s*\/?\s*>$/i.test(child.value || "")) {
          return { type: "break" };
        }

        visit(child);
        return child;
      });
    };

    visit(tree);
  };
}
