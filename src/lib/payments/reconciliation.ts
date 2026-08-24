import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyEntitlement } from "./entitlements";
import { calculateAccessUntil, resolveMercadoPagoStatus, resolvePayPalStatus } from "./core.mjs";
import {
  getLatestMercadoPagoInvoice,
  getMercadoPagoSubscription,
  getPayPalSubscription,
  isExpectedMercadoPagoInvoice,
  isExpectedMercadoPagoSubscription,
  isExpectedPayPalSubscription,
} from "./providers";

const RECONCILIATION_LIMIT = 10;

type ReconciliationRow = {
  user_id: string;
  provider: "mercado_pago" | "paypal";
  provider_subscription_id: string;
};

async function reconcileRow(row: ReconciliationRow, checkedAt: string) {
  if (row.provider === "mercado_pago") {
    const [subscription, invoice] = await Promise.all([
      getMercadoPagoSubscription(row.provider_subscription_id),
      getLatestMercadoPagoInvoice(row.provider_subscription_id),
    ]);
    if (subscription.id !== row.provider_subscription_id || !isExpectedMercadoPagoSubscription(subscription)) {
      throw new Error("unexpected_mercado_pago_subscription");
    }
    if (invoice && (
      invoice.preapproval_id !== row.provider_subscription_id || !isExpectedMercadoPagoInvoice(invoice)
    )) throw new Error("unexpected_mercado_pago_invoice");

    const status = resolveMercadoPagoStatus(subscription.status, invoice ? {
      paymentStatus: invoice.payment?.status,
      summarized: invoice.summarized,
    } : null);
    return applyEntitlement({
      userId: row.user_id,
      provider: row.provider,
      subscriptionId: subscription.id,
      status,
      accessUntil: calculateAccessUntil(status, subscription.next_payment_date, checkedAt),
      eventCreatedAt: checkedAt,
    });
  }

  const subscription = await getPayPalSubscription(row.provider_subscription_id);
  if (subscription.id !== row.provider_subscription_id || !isExpectedPayPalSubscription(subscription)) {
    throw new Error("unexpected_paypal_subscription");
  }
  const status = resolvePayPalStatus(subscription.status, subscription.billing_info?.failed_payments_count);
  return applyEntitlement({
    userId: row.user_id,
    provider: row.provider,
    subscriptionId: subscription.id,
    status,
    accessUntil: calculateAccessUntil(status, subscription.billing_info?.next_billing_time, checkedAt),
    eventCreatedAt: checkedAt,
  });
}

export async function reconcilePayments() {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("user_entitlements")
    .select("user_id, provider, provider_subscription_id")
    .in("provider", ["mercado_pago", "paypal"])
    .in("status", ["active", "trialing", "pending", "past_due"])
    .or(`access_until.is.null,access_until.lte.${cutoff}`)
    .not("provider_subscription_id", "is", null)
    .order("updated_at", { ascending: true })
    .limit(RECONCILIATION_LIMIT);
  if (error) throw new Error("Não foi possível listar assinaturas para reconciliação.");

  const rows = (data ?? []) as ReconciliationRow[];
  const checkedAt = new Date().toISOString();
  const results = await Promise.allSettled(rows.map((row) => reconcileRow(row, checkedAt)));
  return {
    examined: rows.length,
    updated: results.filter((result) => result.status === "fulfilled" && result.value).length,
    unchanged: results.filter((result) => result.status === "fulfilled" && !result.value).length,
    failed: results.filter((result) => result.status === "rejected").length,
    limitReached: rows.length === RECONCILIATION_LIMIT,
  };
}
