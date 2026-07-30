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
          ? "my-8 gap-5 rounded-xl px-5 py-6 sm:px-7 sm:py-7"
          : "my-5 gap-4 rounded-r-xl px-4 py-4 sm:px-5"
      }`}
      style={{
        background: `var(${config.bgVar})`,
        border: `1px solid var(${config.borderVar})`,
        borderLeftWidth: isProminent ? "8px" : "5px",
        boxShadow: isProminent
          ? "0 12px 28px color-mix(in srgb, var(--callout-highlight-border) 18%, transparent)"
          : undefined,
      }}
      role="alert"
    >
      <span
        className={`grid shrink-0 place-items-center rounded-xl ${
          isProminent ? "h-12 w-12" : "h-9 w-9"
        }`}
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
        <Icon size={isProminent ? 25 : 19} strokeWidth={isProminent ? 2.4 : 2} />
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={`font-extrabold uppercase ${
            isProminent
              ? "mb-2 text-sm tracking-[0.15em] sm:text-base"
              : "mb-1 text-xs tracking-[0.12em]"
          }`}
          style={{ color: `var(${config.textVar})` }}
        >
          {callout.title}
        </p>
        <div
          className={isProminent ? "text-base font-medium leading-7 sm:text-[1.05rem]" : "text-sm leading-relaxed"}
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
