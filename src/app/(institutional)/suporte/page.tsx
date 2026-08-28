import Link from "next/link";

export const metadata = {
  title: "Suporte",
  description: "Central de suporte do PRO Concursos.",
};

const supportItems = [
  ["Conta e acesso", "Entre com senha, link mágico ou Google para acessar sua conta.", "/login", "Acessar conta"],
  ["Assinatura e cobrança", "Consulte plano, provedor, situação do acesso e cobrança recorrente.", "/dashboard/assinatura", "Gerenciar assinatura"],
  ["Cancelamento", "Veja como interromper a renovação conforme o provedor usado na contratação.", "/dashboard/assinatura#cancelamento", "Ver cancelamento"],
] as const;

export default function SupportPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Atendimento</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Suporte</h1>
      <p className="mt-4 max-w-2xl leading-7 text-[var(--text-secondary)]">Acesse diretamente a área relacionada à sua dúvida. Assuntos de conta e cobrança exigem login para proteger os dados do assinante.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {supportItems.map(([title, description, href, label]) => (
          <article key={title} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)]">
            <h2 className="text-lg font-extrabold">{title}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
            <Link href={href} className="mt-6 font-bold text-[var(--accent)]">{label} →</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
