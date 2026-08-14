import Link from "next/link";
import { ArrowLeft, Check, CreditCard, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const accountName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
    user.email ||
    "Sua conta";

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 md:px-10 md:py-10" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--accent)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={17} />
          Voltar ao Dashboard
        </Link>

        <header className="rounded-3xl border p-6 sm:p-8" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            <CreditCard size={24} />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
            Conta e cobrança
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Gerenciamento da assinatura
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            Consulte o plano associado à conta de {accountName} e acompanhe os próximos recursos de cobrança.
          </p>
        </header>

        <section className="mt-6 grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-3xl border p-6 sm:p-8" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-secondary)" }}>
                  Plano atual
                </p>
                <h2 className="mt-2 text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                  Gratuito
                </h2>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                Ativo
              </span>
            </div>
            <p className="mt-5 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              Você já pode utilizar os recursos disponíveis para sua conta. A contratação de planos pagos será liberada nesta área quando a cobrança estiver disponível.
            </p>
            <ul className="mt-6 space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              {["Acesso à sua biblioteca de estudos", "Acompanhamento do progresso", "Notas pessoais de estudo"].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check size={17} style={{ color: "var(--callout-tip-border)" }} />
                  {feature}
                </li>
              ))}
            </ul>
          </article>

          <aside className="rounded-3xl border p-6 sm:p-8" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <ShieldCheck size={25} style={{ color: "var(--accent)" }} />
            <h2 className="mt-4 text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
              Cobrança segura
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              Nenhum dado de cartão é solicitado nesta versão. As informações de assinatura serão exibidas aqui após a integração oficial do provedor de pagamentos.
            </p>
            <p className="mt-5 rounded-2xl border p-4 text-xs leading-5" style={{ background: "var(--accent-soft)", borderColor: "var(--border)", color: "var(--text-secondary)" }} role="status">
              Próximo passo: conectar planos, pagamentos, cancelamento e histórico de cobranças ao backend.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
