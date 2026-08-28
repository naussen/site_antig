import Link from "next/link";
import { ArrowLeft, Check, CreditCard, RefreshCw, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserEntitlement } from "@/types/database";
import { withSiteBasePath } from "@/lib/site-paths.mjs";
import { PaymentSubmitButton } from "./payment-submit-button";

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
    (process.env.MERCADO_PAGO_ENVIRONMENT === "production" || (
      process.env.MERCADO_PAGO_ENVIRONMENT === "test" &&
      process.env.MERCADO_PAGO_TEST_PAYER_EMAIL
    )) &&
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
    "mp-dados": "O Mercado Pago recusou os dados desta tentativa. No ambiente de testes, utilize uma conta compradora e um cartão de teste.",
    "mp-credenciais": "O Mercado Pago recusou a credencial configurada. A equipe técnica precisa conferir o Access Token deste ambiente.",
    "mp-indisponivel": "O Mercado Pago está temporariamente indisponível. Aguarde alguns instantes e tente novamente.",
    "paypal-dados": "O PayPal recusou os dados desta tentativa de assinatura.",
    "paypal-credenciais": "O PayPal recusou as credenciais configuradas para este ambiente.",
    "paypal-indisponivel": "O PayPal está temporariamente indisponível. Aguarde alguns instantes e tente novamente.",
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

  if (!hasContentAccess && !isAdmin) {
    const benefits = [
      ["Resumos jurídicos estruturados", "Conteúdo organizado para revisar com clareza e ganhar tempo."],
      ["Flashcards, mnemônicos e mapas", "Ferramentas ativas para fixar os pontos mais cobrados."],
      ["Notas e marca-texto pessoais", "Registre seus comentários e destaque o que precisa revisar."],
      ["Progresso sincronizado", "Continue seus estudos do ponto em que parou em qualquer dispositivo."],
    ];

    return (
      <main className="min-h-screen bg-[var(--bg-primary)] px-4 py-6 sm:px-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-5xl">
          <header className="relative overflow-hidden rounded-3xl border border-[var(--accent)] bg-gradient-to-br from-[var(--accent-soft)] via-[var(--bg-card)] to-[var(--bg-card)] p-6 shadow-xl sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-3xl" />
            <div className="relative grid items-center gap-8 md:grid-cols-[1fr_19rem]">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-white">
                  <Sparkles size={15} aria-hidden="true" /> Oferta especial de lançamento
                </p>
                <h1 className="mt-6 max-w-2xl text-3xl font-black leading-tight tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
                  Prepare-se melhor com todo o ecossistema PRO Concursos
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                  Uma assinatura mensal para estudar com conteúdo organizado, revisão ativa e ferramentas que acompanham sua evolução.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-2"><Check size={18} className="text-[var(--accent)]" /> Acesso liberado após a confirmação</span>
                  <span className="inline-flex items-center gap-2"><ShieldCheck size={18} className="text-[var(--accent)]" /> Pagamento processado pelo provedor</span>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-lg sm:p-7">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">Plano mensal</p>
                <div className="mt-3 flex items-end gap-2 text-[var(--text-primary)]">
                  <strong className="text-5xl font-black tracking-tight">{formattedMonthlyPrice ?? "R$ 0,10"}</strong>
                  <span className="pb-1 text-sm font-semibold text-[var(--text-secondary)]">/mês</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  Renovação automática mensal. Você autoriza o pagamento apenas uma vez.
                </p>
                {checkoutMessage && (
                  <p className="mt-5 rounded-2xl border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] p-4 text-sm leading-6 text-[var(--callout-warning-text)]" role="alert">
                    {checkoutMessage}
                  </p>
                )}
                <div className="mt-6 space-y-3">
                  {mercadoPagoEnabled && (
                    <form action={withSiteBasePath("/api/payments/checkout/mercado-pago")} method="post">
                      <PaymentSubmitButton provider="mercado-pago" prominent />
                    </form>
                  )}
                  {payPalEnabled && (
                    <form action={withSiteBasePath("/api/payments/checkout/paypal")} method="post">
                      <PaymentSubmitButton provider="paypal" />
                    </form>
                  )}
                  {!mercadoPagoEnabled && !payPalEnabled && (
                    <p className="rounded-2xl border border-[var(--border)] bg-[var(--accent-soft)] p-4 text-sm leading-6 text-[var(--text-secondary)]" role="status">
                      Os provedores de pagamento ainda não foram habilitados neste ambiente.
                    </p>
                  )}
                </div>
                <p className="mt-4 text-center text-xs leading-5 text-[var(--text-muted)]">
                  A assinatura será vinculada à conta {accountName}.
                </p>
              </div>
            </div>
          </header>

          <section className="mt-6 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">Vantagens da assinatura</p>
              <h2 className="mt-2 text-2xl font-extrabold text-[var(--text-primary)]">Mais recursos para estudar com constância</h2>
              <ol className="mt-7 grid gap-5 sm:grid-cols-2">
                {benefits.map(([title, description], index) => (
                  <li key={title} className="flex gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-sm font-black text-[var(--accent)]">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)]">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>

            <aside className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8">
              <RefreshCw size={28} className="text-[var(--accent)]" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-extrabold text-[var(--text-primary)]">Renovação realmente automática</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                Depois da primeira autorização, o Mercado Pago agenda a cobrança de {formattedMonthlyPrice ?? "R$ 0,10"} todos os meses no meio de pagamento escolhido.
              </p>
              <p className="mt-4 rounded-2xl bg-[var(--accent-soft)] p-4 text-xs leading-5 text-[var(--text-secondary)]">
                Você não precisará voltar ao site para fazer um novo pagamento a cada mês.
              </p>
            </aside>
          </section>
        </div>
      </main>
    );
  }

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

        <section id="cancelamento" className="mt-6 scroll-mt-6 rounded-3xl border p-6 sm:p-8" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--accent)" }}>
            Cancelamento
          </p>
          <h2 className="mt-2 text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
            Interromper a renovação da assinatura
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            O cancelamento impede novas cobranças recorrentes. A confirmação e a data final de acesso dependem do provedor usado na contratação e devem ser conferidas antes de concluir o procedimento.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {entitlement?.provider === "paypal" && (
              <a href="https://www.paypal.com/br/cshelp/article/o-que-%C3%A9-um-pagamento-autom%C3%A1tico-e-como-o-atualizo-ou-cancelo-help240" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
                Ver cancelamento no PayPal
              </a>
            )}
            {entitlement?.provider === "mercado_pago" && (
              <a href="https://www.mercadopago.com.br/ajuda" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
                Abrir ajuda do Mercado Pago
              </a>
            )}
            <Link href="/contato" className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-bold text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-soft)]">
              Consultar canais de contato
            </Link>
          </div>
          {!entitlement && (
            <p className="mt-4 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
              Esta conta não possui uma assinatura identificada para cancelamento.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
