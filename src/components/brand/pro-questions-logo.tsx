import { Check, CircleHelp } from "lucide-react";

interface ProQuestionsLogoProps {
  compact?: boolean;
  tone?: "auto" | "dark" | "landing";
  className?: string;
}

/** Wordmark leve do módulo, alinhado à identidade visual do ecossistema PRO. */
export function ProQuestionsLogo({
  compact = false,
  tone = "auto",
  className = "",
}: ProQuestionsLogoProps) {
  const primaryColor = tone === "dark"
    ? "text-white"
    : tone === "landing"
      ? "text-[#1a1a2e]"
      : "text-[var(--text-primary)]";

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}
      aria-label="PROQuestões"
    >
      <span
        className="pro-questions-mark relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[0.85rem] text-white"
        aria-hidden="true"
      >
        <CircleHelp size={22} strokeWidth={2.4} />
        <span className="absolute bottom-0.5 right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-[var(--questions-signal,#22d3ee)] text-[var(--questions-ink,#17172b)] ring-2 ring-white/80">
          <Check size={9} strokeWidth={3.2} />
        </span>
      </span>
      {!compact && (
        <span className={`text-xl font-black tracking-[-0.035em] ${primaryColor}`}>
          <span className="pro-questions-wordmark">PRO</span>
          <span>Questões</span>
        </span>
      )}
    </span>
  );
}
