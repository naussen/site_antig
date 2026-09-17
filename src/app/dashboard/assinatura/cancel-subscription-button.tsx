"use client";

import { LoaderCircle, ShieldAlert } from "lucide-react";
import { useFormStatus } from "react-dom";

export function CancelSubscriptionButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-wait disabled:opacity-60 dark:text-red-300"
    >
      {pending ? <LoaderCircle size={18} className="animate-spin" /> : <ShieldAlert size={18} />}
      {pending ? "Cancelando renovação..." : "Confirmar cancelamento"}
    </button>
  );
}
