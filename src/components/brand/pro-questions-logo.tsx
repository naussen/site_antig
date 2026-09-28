import { CircleHelp } from "lucide-react";

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
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] text-white shadow-lg shadow-[#7c3aed]/20"
        aria-hidden="true"
      >
        <CircleHelp size={22} strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className={`text-xl font-black tracking-[-0.035em] ${primaryColor}`}>
          <span className="text-[#a78bfa]">PRO</span>
          <span>Questões</span>
        </span>
      )}
    </span>
  );
}
