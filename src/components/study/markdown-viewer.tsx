import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewerProps {
  content: string;
}

/**
 * Renderizador de Markdown com suporte a GFM (tabelas, strikethrough, etc).
 * Aplica os estilos definidos em globals.css via classe .markdown-content.
 */
export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="markdown-content animate-fade-in-up">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
