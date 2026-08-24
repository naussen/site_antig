import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EntitlementStatus } from "./core.mjs";

type PaymentProvider = "mercado_pago" | "paypal";

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
