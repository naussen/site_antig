import Image from "next/image";
import Link from "next/link";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

const LOGO_SRC = withSiteBasePath("/brand/pro-concursos-logo.png");

export default function InstitutionalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-card)] px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/landing" aria-label="Voltar à página inicial do PRO Concursos">
            <Image src={LOGO_SRC} alt="PRO Concursos" width={170} height={68} className="h-auto w-[145px] rounded-xl bg-white px-2 py-1 sm:w-[170px]" />
          </Link>
          <Link href="/login" className="rounded-xl bg-[var(--action)] px-4 py-2.5 text-sm font-bold text-[var(--action-foreground)] transition-opacity hover:opacity-90">Entrar</Link>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-[var(--border)] bg-[var(--bg-card)] px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PRO Concursos · proconcursos.com.br</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Links institucionais">
            <Link href="/termos" className="hover:text-[var(--accent)]">Termos</Link>
            <Link href="/privacidade" className="hover:text-[var(--accent)]">Privacidade</Link>
            <Link href="/suporte" className="hover:text-[var(--accent)]">Suporte</Link>
            <Link href="/contato" className="hover:text-[var(--accent)]">Contato</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
