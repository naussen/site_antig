import Link from "next/link";

export const metadata = {
  title: "Contato",
  description: "Canais de contato do PRO Concursos.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Atendimento</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Contato</h1>
      <p className="mt-4 max-w-2xl leading-7 text-[var(--text-secondary)]">Os caminhos de atendimento são organizados pelo tipo de solicitação para evitar exposição de dados pessoais e de cobrança.</p>
      <div className="mt-10 space-y-5">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)]">
          <h2 className="text-xl font-extrabold">Já possui conta?</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Entre na plataforma para consultar acesso, assinatura, cobrança e orientações de cancelamento vinculadas à sua conta.</p>
          <Link href="/dashboard/assinatura" className="mt-5 inline-flex rounded-xl bg-[var(--action)] px-4 py-3 text-sm font-bold text-[var(--action-foreground)]">Acessar conta e assinatura</Link>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)]">
          <h2 className="text-xl font-extrabold">Dúvidas sobre o serviço</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Consulte a central de suporte, os Termos de uso e as informações de Privacidade antes de contratar.</p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold text-[var(--accent)]"><Link href="/suporte">Suporte</Link><Link href="/termos">Termos</Link><Link href="/privacidade">Privacidade</Link></div>
        </section>
      </div>
    </main>
  );
}
