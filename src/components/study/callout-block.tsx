import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { Callout } from "@/types/database";

const CALLOUT_CONFIG = {
  warning: {
    icon: AlertTriangle,
    bgVar: "--callout-warning-bg",
    borderVar: "--callout-warning-border",
    textVar: "--callout-warning-text",
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

  return (
    <div
      className="flex gap-3 p-4 rounded-xl my-4 animate-fade-in-up"
      style={{
        background: `var(${config.bgVar})`,
        border: `1px solid var(${config.borderVar})`,
      }}
      role="alert"
    >
      <Icon
        size={20}
        className="shrink-0 mt-0.5"
        style={{ color: `var(${config.borderVar})` }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-sm mb-1"
          style={{ color: `var(${config.textVar})` }}
        >
          {callout.title}
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{ color: `var(${config.textVar})`, opacity: 0.9 }}
        >
          {callout.text}
        </p>
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
