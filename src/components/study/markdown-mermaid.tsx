"use client";

import dynamic from "next/dynamic";
import { useId } from "react";
import { getMermaidSecurityIssue } from "@/lib/mermaid/security.mjs";

const MermaidViewer = dynamic(
  () => import("@/components/study/mermaid-viewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-40 items-center justify-center text-sm text-[var(--text-secondary)]">
        Carregando diagrama...
      </div>
    ),
  },
);

interface MarkdownMermaidProps {
  source: string;
}

export function MarkdownMermaid({ source }: MarkdownMermaidProps) {
  const sourceId = useId();
  const securityIssue = getMermaidSecurityIssue(source);

  return (
    <figure
      className="my-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
      aria-label="Diagrama do conteúdo"
    >
      {securityIssue ? (
        <p
          className="px-4 pt-4 text-sm text-[var(--text-secondary)]"
          role="status"
        >
          Este diagrama não pôde ser exibido com segurança.
        </p>
      ) : (
        <MermaidViewer chart={source} />
      )}

      <details className="border-t border-[var(--border)] px-4 py-3 text-sm">
        <summary
          className="cursor-pointer text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          aria-controls={sourceId}
        >
          Ver código do diagrama
        </summary>
        <pre
          id={sourceId}
          className="mt-3 max-w-full overflow-x-auto whitespace-pre p-3 text-xs"
        >
          <code className="language-mermaid">{source}</code>
        </pre>
      </details>
    </figure>
  );
}
