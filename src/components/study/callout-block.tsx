import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Callout } from "@/types/database";

const CALLOUT_CONFIG = {
  warning: {
    icon: AlertTriangle,
    bgVar: "--callout-highlight-bg",
    borderVar: "--callout-highlight-border",
    textVar: "--callout-highlight-text",
  },
  info: {
    icon: Info,
    bgVar: "--callout-info-bg",
    borderVar: "--callout-info-border",
    textVar: "--callout-info-text",
  },
  tip: {
    icon: Lightbulb,
    bgVar: "--callout-tip-bg",
    borderVar: "--callout-tip-border",
    textVar: "--callout-tip-text",
  },
} as const;

interface CalloutBlockProps {
  callout: Callout;
}

/**
 * Componente visual de alerta com cores adaptativas ao tema.
 * Renderiza ícone, título e texto baseados no callout.type.
 */
export function CalloutBlock({ callout }: CalloutBlockProps) {
  const config = CALLOUT_CONFIG[callout.type] ?? CALLOUT_CONFIG.info;
  const Icon = config.icon;
  const isProminent = callout.type === "warning";

  return (
    <div
      className={`flex overflow-hidden animate-fade-in-up ${
        isProminent
          ? "my-6 gap-3 rounded-xl px-4 py-4 sm:px-5"
          : "my-5 gap-4 rounded-r-xl px-4 py-4 sm:px-5"
      }`}
      style={{
        background: `var(${config.bgVar})`,
        border: `1px solid var(${config.borderVar})`,
        borderLeftWidth: isProminent ? "4px" : "5px",
      }}
      role="alert"
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
        style={{
          background: isProminent
            ? "color-mix(in srgb, var(--bg-card) 88%, transparent)"
            : "color-mix(in srgb, var(--bg-card) 72%, transparent)",
          color: `var(${config.borderVar})`,
          border: isProminent
            ? `1px solid color-mix(in srgb, var(${config.borderVar}) 42%, transparent)`
            : undefined,
        }}
        aria-hidden="true"
      >
        <Icon size={19} strokeWidth={2} />
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="mb-1 text-xs font-extrabold uppercase tracking-[0.12em]"
          style={{ color: `var(${config.textVar})` }}
        >
          {callout.title}
        </p>
        <div
          className="text-sm leading-relaxed"
          style={{ color: `var(${config.textVar})`, opacity: isProminent ? 1 : 0.9 }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            allowedElements={["p", "strong", "em", "code", "del", "br"]}
            unwrapDisallowed
            components={{
              p: ({ children }) => <p>{children}</p>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            }}
          >
            {callout.text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

interface CalloutListProps {
  callouts: Callout[];
}

/** Renderiza uma lista de callouts em sequência. */
export function CalloutList({ callouts }: CalloutListProps) {
  if (callouts.length === 0) return null;

  return (
    <div className="space-y-3">
      {callouts.map((callout, index) => (
        <CalloutBlock key={`${callout.type}-${index}`} callout={callout} />
      ))}
    </div>
  );
}
