import { Brain } from "lucide-react";
import type { Mnemonic } from "@/types/database";

interface MnemonicCardProps {
  mnemonic: Mnemonic;
}

/**
 * Card estilizado para mnemônicos com destaque visual na key,
 * significado completo e descrição de uso prático.
 */
export function MnemonicCard({ mnemonic }: MnemonicCardProps) {
  return (
    <div
      className="rounded-xl p-4 animate-fade-in-up"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg shrink-0"
          style={{
            background: `linear-gradient(135deg, var(--mnemonic-gradient-from), var(--mnemonic-gradient-to))`,
          }}
        >
          <Brain size={18} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Key do mnemônico em destaque */}
          <p
            className="font-bold text-lg tracking-widest mb-1"
            style={{
              background: `linear-gradient(90deg, var(--mnemonic-gradient-from), var(--mnemonic-gradient-to))`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {mnemonic.key}
          </p>

          {/* Significado */}
          <p
            className="text-sm font-medium mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {mnemonic.meaning}
          </p>

          {/* Descrição de uso */}
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            {mnemonic.description}
          </p>
        </div>
      </div>
    </div>
  );
}

interface MnemonicListProps {
  mnemonics: Mnemonic[];
}

/** Renderiza uma lista de cards de mnemônicos. */
export function MnemonicList({ mnemonics }: MnemonicListProps) {
  if (mnemonics.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3
        className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2"
        style={{ color: "var(--text-muted)" }}
      >
        <Brain size={14} />
        Mnemônicos
      </h3>
      {mnemonics.map((mnemonic, index) => (
        <MnemonicCard key={`${mnemonic.key}-${index}`} mnemonic={mnemonic} />
      ))}
    </div>
  );
}
