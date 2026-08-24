import { z } from "zod";
import { NextResponse } from "next/server";
import { applyEntitlement, beginWebhookEvent, finishWebhookEvent } from "@/lib/payments/entitlements";
import { calculateAccessUntil, resolvePayPalStatus } from "@/lib/payments/core.mjs";
import { getPayPalSubscription, isExpectedPayPalSubscription, verifyPayPalWebhook } from "@/lib/payments/providers";

const eventSchema = z.object({
  id: z.string().min(1).max(100),
  event_type: z.string().min(1).max(150),
  create_time: z.string().datetime({ offset: true }),
  resource: z.record(z.string(), z.unknown()),
});
const uuidSchema = z.string().uuid();
const supportedEvents = new Set([
  "BILLING.SUBSCRIPTION.CREATED", "BILLING.SUBSCRIPTION.ACTIVATED", "BILLING.SUBSCRIPTION.UPDATED",
  "BILLING.SUBSCRIPTION.EXPIRED", "BILLING.SUBSCRIPTION.CANCELLED", "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.PAYMENT.FAILED", "PAYMENT.SALE.COMPLETED", "PAYMENT.SALE.REFUNDED", "PAYMENT.SALE.REVERSED",
]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (rawBody.length > 262_144) return NextResponse.json({ error: "Payload excessivo." }, { status: 413 });
  let unknownBody: unknown;
  try { unknownBody = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  const parsed = eventSchema.safeParse(unknownBody);
  if (!parsed.success) return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  if (!await verifyPayPalWebhook(request.headers, unknownBody)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }
  if (!supportedEvents.has(parsed.data.event_type)) return new NextResponse(null, { status: 204 });

  const resource = parsed.data.resource;
  const subscriptionId = typeof resource.billing_agreement_id === "string"
    ? resource.billing_agreement_id
    : typeof resource.id === "string" ? resource.id : "";
  if (!subscriptionId) return NextResponse.json({ error: "Recurso inválido." }, { status: 400 });

  const claim = await beginWebhookEvent({
    provider: "paypal", eventId: parsed.data.id, eventType: parsed.data.event_type,
    resourceId: subscriptionId, eventCreatedAt: parsed.data.create_time,
  });
  if (claim.duplicate) return new NextResponse(null, { status: 204 });

  try {
    const subscription = await getPayPalSubscription(subscriptionId);
    const userId = uuidSchema.parse(subscription.custom_id);
    if (!isExpectedPayPalSubscription(subscription)) throw new Error("unexpected_plan");
    const status = resolvePayPalStatus(subscription.status, subscription.billing_info?.failed_payments_count, parsed.data.event_type);
    const providerUpdatedAt = subscription.status_update_time && new Date(subscription.status_update_time) > new Date(parsed.data.create_time)
      ? subscription.status_update_time
      : parsed.data.create_time;
    await applyEntitlement({
      userId, provider: "paypal", subscriptionId: subscription.id, status,
      accessUntil: calculateAccessUntil(status, subscription.billing_info?.next_billing_time, providerUpdatedAt),
      eventCreatedAt: providerUpdatedAt,
    });
    await finishWebhookEvent("paypal", parsed.data.id);
    return new NextResponse(null, { status: 204 });
  } catch {
    await finishWebhookEvent("paypal", parsed.data.id, "processing_failed");
    return NextResponse.json({ error: "Falha temporária." }, { status: 500 });
  }
}
