import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewerProps {
  content: string;
}

type MarkdownNode = {
  type?: string;
  value?: string;
  children?: MarkdownNode[];
};

function convertSafeBreakTags(): (tree: MarkdownNode) => void {
  return (tree) => {
    const visit = (node: MarkdownNode) => {
      if (node.type === "html" && /^<br\s*\/?>$/i.test(node.value?.trim() ?? "")) {
        node.type = "break";
        delete node.value;
      }
      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

function getPlainText(children: ReactNode): string | null {
  if (typeof children === "string") return children;

  if (
    Array.isArray(children) &&
    children.every((child) => typeof child === "string")
  ) {
    return children.join("");
  }

  return null;
}

/**
 * Renderizador de Markdown com suporte a GFM (tabelas, strikethrough, etc).
 * Aplica os estilos definidos em globals.css via classe .markdown-content.
 */
export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="markdown-content animate-fade-in-up">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, convertSafeBreakTags]}
        components={{
          p: ({ children }) => {
            const text = getPlainText(children)?.trim();

            if (text?.startsWith("$$") && text.endsWith("$$")) {
              return (
                <div
                  className="markdown-formula"
                  role="group"
                  aria-label="Expressão matemática"
                >
                  {text.slice(2, -2).trim()}
                </div>
              );
            }

            return <p>{children}</p>;
          },
          table: ({ children }) => (
            <div
              className="markdown-table-scroll"
              role="region"
              aria-label="Tabela com rolagem horizontal"
              tabIndex={0}
            >
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
