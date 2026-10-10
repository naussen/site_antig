import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest } from "@/lib/same-origin.mjs";
import {
  createMercadoPagoSubscription,
  createPayPalSubscription,
  getPaymentsInternalUrl,
  PaymentProviderError,
} from "@/lib/payments/providers";
import { recordPaymentAudit } from "@/lib/payments/audit";
import { shouldBlockNewCheckout } from "@/lib/payments/core.mjs";

const providers = new Set(["mercado-pago", "paypal"]);

function subscriptionPage(params: Record<string, string>) {
  const url = new URL(getPaymentsInternalUrl("/dashboard/assinatura"));
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

function checkoutFailure(provider: string, error: unknown) {
  const prefix = provider === "mercado-pago" ? "mp" : "paypal";
  if (!(error instanceof PaymentProviderError)) {
    return { checkout: `${prefix}-indisponivel`, category: "network", status: null, providerCode: null, providerDetail: null };
  }
  if (error.status === 401 || error.status === 403) {
    return { checkout: `${prefix}-credenciais`, category: "credentials", status: error.status, providerCode: error.providerCode, providerDetail: error.providerDetail };
  }
  if (error.status === 400 || error.status === 422) {
    return { checkout: `${prefix}-dados`, category: "request", status: error.status, providerCode: error.providerCode, providerDetail: error.providerDetail };
  }
  return { checkout: `${prefix}-indisponivel`, category: "provider", status: error.status, providerCode: error.providerCode, providerDetail: error.providerDetail };
}

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  if (!providers.has(provider)) return NextResponse.json({ error: "Provedor inválido." }, { status: 404 });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(getPaymentsInternalUrl("/login")), 303);

  const { data: entitlement, error } = await supabase
    .from("user_entitlements")
    .select("status, access_until, provider_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.redirect(subscriptionPage({ checkout: "erro" }), 303);

  if (shouldBlockNewCheckout(entitlement)) {
    await recordPaymentAudit({
      action: "checkout_blocked",
      outcome: "failure",
      provider: provider === "mercado-pago" ? "mercado_pago" : "paypal",
      userId: user.id,
      subscriptionId: entitlement?.provider_subscription_id,
      reasonCode: entitlement?.status === "pending" || entitlement?.status === "past_due"
        ? "subscription_unresolved"
        : "subscription_active",
    });
    const checkout = entitlement?.status === "pending" || entitlement?.status === "past_due"
      ? "assinatura-pendente"
      : "ja-ativo";
    return NextResponse.redirect(subscriptionPage({ checkout }), 303);
  }

  try {
    const checkoutUrl = provider === "mercado-pago"
      ? await createMercadoPagoSubscription(user.id, user.email ?? "")
      : await createPayPalSubscription(user.id);
    await recordPaymentAudit({
      action: "checkout_created",
      outcome: "success",
      provider: provider === "mercado-pago" ? "mercado_pago" : "paypal",
      userId: user.id,
    });
    return NextResponse.redirect(checkoutUrl, 303);
  } catch (error) {
    const failure = checkoutFailure(provider, error);
    await recordPaymentAudit({
      action: "checkout_failed",
      outcome: "failure",
      provider: provider === "mercado-pago" ? "mercado_pago" : "paypal",
      userId: user.id,
      reasonCode: failure.category,
    });
    console.error("Falha ao iniciar checkout.", {
      provider,
      category: failure.category,
      status: failure.status,
      providerCode: failure.providerCode,
      providerDetail: failure.providerDetail,
    });
    return NextResponse.redirect(subscriptionPage({ checkout: failure.checkout }), 303);
  }
}
