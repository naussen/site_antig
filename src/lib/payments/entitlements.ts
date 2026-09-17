import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EntitlementStatus } from "./core.mjs";

type PaymentProvider = "mercado_pago" | "paypal";

export type ProviderTransaction = {
  provider: PaymentProvider;
  transaction_id: string;
  provider_subscription_id: string;
  user_id: string;
  status: string;
  amount: number | null;
  currency: string | null;
  provider_updated_at: string;
};

export async function beginWebhookEvent(input: {
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  resourceId: string;
  eventCreatedAt: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("payment_webhook_events").insert({
    provider: input.provider,
    event_id: input.eventId,
    event_type: input.eventType,
    resource_id: input.resourceId,
    provider_created_at: input.eventCreatedAt,
    processing_status: "processing",
  });

  if (!error) return { duplicate: false };
  if (error.code !== "23505") throw new Error("Não foi possível registrar o evento de pagamento.");

  const { data, error: readError } = await supabase
    .from("payment_webhook_events")
    .select("processing_status")
    .eq("provider", input.provider)
    .eq("event_id", input.eventId)
    .single();
  if (readError) throw new Error("Não foi possível consultar o evento duplicado.");
  return { duplicate: data.processing_status === "processed" };
}

export async function applyEntitlement(input: {
  userId: string;
  provider: PaymentProvider;
  subscriptionId: string;
  status: EntitlementStatus;
  accessUntil: string | null;
  eventCreatedAt: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("apply_payment_entitlement", {
    p_user_id: input.userId,
    p_provider: input.provider,
    p_provider_subscription_id: input.subscriptionId,
    p_status: input.status,
    p_access_until: input.accessUntil,
    p_provider_updated_at: input.eventCreatedAt,
  });
  if (error) throw new Error("Não foi possível atualizar o direito de acesso.");
  return data === true;
}

export async function finishWebhookEvent(provider: PaymentProvider, eventId: string, errorCode?: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("payment_webhook_events")
    .update({
      processing_status: errorCode ? "failed" : "processed",
      processed_at: errorCode ? null : new Date().toISOString(),
      error_code: errorCode ?? null,
    })
    .eq("provider", provider)
    .eq("event_id", eventId);
  if (error) throw new Error("Não foi possível finalizar o evento de pagamento.");
}

export async function recordProviderTransaction(input: {
  provider: PaymentProvider;
  transactionId: string;
  subscriptionId: string;
  userId: string;
  status: string;
  amount: number | null;
  currency: string | null;
  providerUpdatedAt: string;
}) {
  const supabase = createAdminClient();
  const { data: existing, error: readError } = await supabase
    .from("payment_provider_transactions")
    .select("provider_subscription_id, user_id, provider_updated_at")
    .eq("provider", input.provider)
    .eq("transaction_id", input.transactionId)
    .maybeSingle();
  if (readError) throw new Error("Não foi possível consultar a transação do provedor.");

  if (existing && (
    existing.provider_subscription_id !== input.subscriptionId || existing.user_id !== input.userId
  )) {
    throw new Error("Vínculo divergente para a transação do provedor.");
  }

  if (existing && new Date(existing.provider_updated_at) >= new Date(input.providerUpdatedAt)) return false;

  const { error } = await supabase.from("payment_provider_transactions").upsert({
    provider: input.provider,
    transaction_id: input.transactionId,
    provider_subscription_id: input.subscriptionId,
    user_id: input.userId,
    status: input.status,
    amount: input.amount,
    currency: input.currency,
    provider_updated_at: input.providerUpdatedAt,
  }, { onConflict: "provider,transaction_id" });
  if (error) throw new Error("Não foi possível registrar a transação do provedor.");
  return true;
}

export async function getProviderTransaction(provider: PaymentProvider, transactionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_provider_transactions")
    .select("provider, transaction_id, provider_subscription_id, user_id, status, amount, currency, provider_updated_at")
    .eq("provider", provider)
    .eq("transaction_id", transactionId)
    .maybeSingle();
  if (error) throw new Error("Não foi possível consultar o vínculo da transação.");
  return data as ProviderTransaction | null;
}

export async function blockPaymentAccess(input: {
  userId: string;
  provider: PaymentProvider;
  subscriptionId: string;
  resourceId: string;
  reason: "refund" | "chargeback" | "reversal";
  providerUpdatedAt: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("payment_access_blocks").upsert({
    user_id: input.userId,
    provider: input.provider,
    provider_subscription_id: input.subscriptionId,
    resource_id: input.resourceId,
    reason: input.reason,
    provider_updated_at: input.providerUpdatedAt,
    active: true,
    resolved_at: null,
    resolved_by: null,
    resolution_note: null,
  }, { onConflict: "provider,resource_id,reason" });
  if (error) throw new Error("Não foi possível bloquear o acesso após evento financeiro adverso.");
}
