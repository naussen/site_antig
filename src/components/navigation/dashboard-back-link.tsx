import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function DashboardBackLink() {
  return (
    <Link
      href="/dashboard"
      className="-ml-3 mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <ArrowLeft size={17} aria-hidden="true" />
      Voltar ao Dashboard
    </Link>
  );
}
