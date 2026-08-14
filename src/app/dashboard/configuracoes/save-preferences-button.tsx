"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type SavePreferencesButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
};

export function SavePreferencesButton({
  children,
  disabled = false,
}: SavePreferencesButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 enabled:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: "var(--action)",
        color: "var(--action-foreground)",
      }}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" size={17} aria-hidden="true" />
          Salvando...
        </>
      ) : (
        children
      )}
    </button>
  );
}
