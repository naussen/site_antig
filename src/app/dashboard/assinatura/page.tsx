import Link from "next/link";
import { ArrowLeft, Check, CreditCard, ShieldCheck, WalletCards } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserEntitlement } from "@/types/database";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [accessResult, entitlementResult] = await Promise.all([
    supabase.rpc("has_active_content_access"),
    supabase
      .from("user_entitlements")
      .select("provider, status, access_until")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (accessResult.error || entitlementResult.error) {
    throw new Error("Não foi possível consultar o estado da assinatura.");
  }

  const hasContentAccess = accessResult.data === true;
  const entitlement = entitlementResult.data as Pick<
    UserEntitlement,
    "provider" | "status" | "access_until"
  > | null;
  const isAdmin = user.app_metadata?.role === "admin";
  const mercadoPagoEnabled = Boolean(
    process.env.MERCADO_PAGO_ACCESS_TOKEN &&
    process.env.MERCADO_PAGO_WEBHOOK_SECRET &&
    process.env.PAYMENTS_MONTHLY_PRICE_BRL &&
    process.env.PAYMENTS_APP_URL
  );
  const payPalEnabled = Boolean(
    process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET &&
    process.env.PAYPAL_PLAN_ID &&
    process.env.PAYPAL_WEBHOOK_ID &&
    process.env.PAYMENTS_MONTHLY_PRICE_BRL &&
    process.env.PAYMENTS_APP_URL
  );
  const monthlyPrice = Number(process.env.PAYMENTS_MONTHLY_PRICE_BRL);
  const formattedMonthlyPrice = Number.isFinite(monthlyPrice) && monthlyPrice > 0
    ? monthlyPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : null;
  const checkoutMessage = ({
    retorno: "Recebemos seu retorno do provedor. O acesso será liberado após a confirmação segura do pagamento.",
    cancelado: "O checkout foi cancelado e nenhuma assinatura foi ativada.",
    erro: "Não foi possível iniciar o checkout. Tente novamente ou contate o suporte.",
    "ja-ativo": "Esta conta já possui uma assinatura ativa.",
  } as Record<string, string>)[checkout ?? ""];
  const planName = isAdmin
    ? "Acesso administrativo"
    : hasContentAccess && entitlement?.status === "trialing"
      ? "Período de teste"
      : hasContentAccess
        ? "Assinatura ativa"
        : "Sem assinatura ativa";
  const providerName = entitlement?.provider
    ? entitlement.provider.replaceAll("_", " ")
    : null;

  const accountName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
    user.email ||
    "Sua conta";

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 md:px-10 md:py-10" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-4xl">
        {hasContentAccess && (
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
          >
            <ArrowLeft size={17} />
            Voltar ao Dashboard
          </Link>
        )}

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
                  {planName}
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  hasContentAccess
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "bg-[var(--callout-warning-bg)] text-[var(--callout-warning-text)]"
                }`}
              >
                {hasContentAccess ? "Ativo" : "Inativo"}
              </span>
            </div>
            <p className="mt-5 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              {hasContentAccess
                ? "O backend confirmou o direito de acesso ao acervo para esta conta."
                : "O acervo permanece bloqueado até o backend confirmar uma assinatura paga e vigente."}
            </p>
            {providerName && (
              <p className="mt-3 text-xs capitalize text-[var(--text-muted)]">
                Provedor: {providerName}
                {entitlement?.access_until
                  ? ` · acesso até ${new Date(entitlement.access_until).toLocaleDateString("pt-BR")}`
                  : ""}
              </p>
            )}
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
              Nenhum dado de cartão é armazenado pelo PRO Resumos. A liberação deve ocorrer somente após confirmação segura do provedor de pagamentos.
            </p>
            {checkoutMessage && (
              <p className="mt-5 rounded-2xl border p-4 text-xs leading-5" style={{ background: "var(--accent-soft)", borderColor: "var(--border)", color: "var(--text-secondary)" }} role="status">
                {checkoutMessage}
              </p>
            )}
            {!hasContentAccess && !isAdmin && (
              <div className="mt-5 space-y-3">
                <p className="text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                  {formattedMonthlyPrice ? `${formattedMonthlyPrice}/mês. ` : "Assinatura mensal recorrente. "}
                  A cobrança e os dados de pagamento ficam no ambiente seguro do provedor escolhido.
                </p>
                {mercadoPagoEnabled && (
                  <form action={withSiteBasePath("/api/payments/checkout/mercado-pago")} method="post">
                    <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
                      <CreditCard size={18} /> Assinar com Mercado Pago
                    </button>
                  </form>
                )}
                {payPalEnabled && (
                  <form action={withSiteBasePath("/api/payments/checkout/paypal")} method="post">
                    <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-bold text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
                      <WalletCards size={18} /> Assinar com PayPal
                    </button>
                  </form>
                )}
                {!mercadoPagoEnabled && !payPalEnabled && (
                  <p className="rounded-2xl border p-4 text-xs leading-5" style={{ background: "var(--accent-soft)", borderColor: "var(--border)", color: "var(--text-secondary)" }} role="status">
                    Os provedores de pagamento ainda não foram habilitados neste ambiente.
                  </p>
                )}
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
