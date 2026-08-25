"use client";

import { CreditCard, LoaderCircle, WalletCards } from "lucide-react";
import { useFormStatus } from "react-dom";

type PaymentSubmitButtonProps = {
  provider: "mercado-pago" | "paypal";
  prominent?: boolean;
};

export function PaymentSubmitButton({ provider, prominent = false }: PaymentSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isMercadoPago = provider === "mercado-pago";
  const Icon = pending ? LoaderCircle : isMercadoPago ? CreditCard : WalletCards;
  const label = pending
    ? "Abrindo pagamento seguro..."
    : isMercadoPago
      ? "Assinar com Mercado Pago"
      : "Assinar com PayPal";

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        prominent
          ? "flex min-h-16 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[var(--accent)] px-6 py-4 text-base font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70 sm:text-lg"
          : "flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-bold text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-wait disabled:opacity-70"
      }
    >
      <Icon className={pending ? "animate-spin" : ""} size={prominent ? 22 : 18} aria-hidden="true" />
      {label}
    </button>
  );
}
