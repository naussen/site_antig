import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest } from "@/lib/same-origin.mjs";
import { applyEntitlement } from "@/lib/payments/entitlements";
import { calculateAccessUntil, mapPayPalStatus } from "@/lib/payments/core.mjs";
import {
  cancelMercadoPagoSubscription,
  cancelPayPalSubscription,
  getPaymentsInternalUrl,
  isExpectedMercadoPagoSubscription,
  isExpectedPayPalSubscription,
} from "@/lib/payments/providers";

function subscriptionPage(result: string) {
  const url = new URL(getPaymentsInternalUrl("/dashboard/assinatura"));
  url.searchParams.set("checkout", result);
  return url;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });

  const formData = await request.formData();
  if (formData.get("confirmation") !== "cancelar-renovacao") {
    return NextResponse.redirect(subscriptionPage("cancelamento-confirmacao"), 303);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(getPaymentsInternalUrl("/login")), 303);

  const { data: entitlement, error } = await supabase
    .from("user_entitlements")
    .select("provider, provider_subscription_id, status, access_until")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !entitlement?.provider_subscription_id) {
    return NextResponse.redirect(subscriptionPage("cancelamento-indisponivel"), 303);
  }
  if (entitlement.status === "canceled") {
    return NextResponse.redirect(subscriptionPage("cancelamento-concluido"), 303);
  }

  try {
    const canceledAt = new Date().toISOString();
    let accessUntil = entitlement.access_until as string | null;

    if (entitlement.provider === "mercado_pago") {
      const subscription = await cancelMercadoPagoSubscription(entitlement.provider_subscription_id);
      if (
        subscription.id !== entitlement.provider_subscription_id
        || subscription.external_reference !== user.id
        || subscription.status !== "cancelled" && subscription.status !== "canceled"
        || !isExpectedMercadoPagoSubscription(subscription)
      ) throw new Error("unexpected_mercado_pago_cancellation");
      accessUntil ??= calculateAccessUntil("active", subscription.next_payment_date, canceledAt);
    } else if (entitlement.provider === "paypal") {
      const subscription = await cancelPayPalSubscription(entitlement.provider_subscription_id);
      if (
        subscription.id !== entitlement.provider_subscription_id
        || subscription.custom_id !== user.id
        || mapPayPalStatus(subscription.status) !== "canceled"
        || !isExpectedPayPalSubscription(subscription)
      ) throw new Error("unexpected_paypal_cancellation");
      accessUntil ??= calculateAccessUntil("active", subscription.billing_info?.next_billing_time, canceledAt);
    } else {
      throw new Error("unsupported_provider");
    }

    await applyEntitlement({
      userId: user.id,
      provider: entitlement.provider,
      subscriptionId: entitlement.provider_subscription_id,
      status: "canceled",
      accessUntil,
      eventCreatedAt: canceledAt,
    });
    return NextResponse.redirect(subscriptionPage("cancelamento-concluido"), 303);
  } catch (error) {
    console.error("Falha ao cancelar assinatura.", {
      provider: entitlement.provider,
      category: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.redirect(subscriptionPage("cancelamento-erro"), 303);
  }
}
