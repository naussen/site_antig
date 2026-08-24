import { z } from "zod";
import { NextResponse } from "next/server";
import { applyEntitlement, beginWebhookEvent, finishWebhookEvent } from "@/lib/payments/entitlements";
import { calculateAccessUntil, resolveMercadoPagoStatus, verifyMercadoPagoSignature } from "@/lib/payments/core.mjs";
import {
  getMercadoPagoConfig,
  getMercadoPagoSubscription,
  getMercadoPagoInvoice,
  isExpectedMercadoPagoInvoice,
  isExpectedMercadoPagoSubscription,
} from "@/lib/payments/providers";

const eventSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  type: z.string().max(100),
  action: z.string().max(150).optional(),
  date_created: z.string().datetime({ offset: true }).optional(),
  data: z.object({ id: z.union([z.string(), z.number()]) }),
});
const uuidSchema = z.string().uuid();

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (rawBody.length > 262_144) return NextResponse.json({ error: "Payload excessivo." }, { status: 413 });

  let unknownBody: unknown;
  try { unknownBody = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  const parsed = eventSchema.safeParse(unknownBody);
  if (!parsed.success) return NextResponse.json({ error: "Evento inválido." }, { status: 400 });

  const resourceId = String(parsed.data.data.id);
  const queryDataId = new URL(request.url).searchParams.get("data.id");
  if (queryDataId && queryDataId !== resourceId) {
    return NextResponse.json({ error: "Identificador divergente." }, { status: 400 });
  }
  const dataId = queryDataId ?? resourceId;
  const validSignature = verifyMercadoPagoSignature({
    dataId,
    requestId: request.headers.get("x-request-id") ?? "",
    signature: request.headers.get("x-signature") ?? "",
    secret: getMercadoPagoConfig().webhookSecret,
  });
  if (!validSignature) return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });

  if (!["subscription_preapproval", "subscription_authorized_payment"].includes(parsed.data.type)) {
    return new NextResponse(null, { status: 204 });
  }

  const eventId = String(parsed.data.id ?? request.headers.get("x-request-id") ?? `${parsed.data.type}:${resourceId}`);
  const eventCreatedAt = parsed.data.date_created ?? new Date().toISOString();
  const claim = await beginWebhookEvent({
    provider: "mercado_pago", eventId, eventType: parsed.data.action ?? parsed.data.type,
    resourceId, eventCreatedAt,
  });
  if (claim.duplicate) return new NextResponse(null, { status: 204 });

  try {
    const invoice = parsed.data.type === "subscription_authorized_payment"
      ? await getMercadoPagoInvoice(resourceId)
      : null;
    if (invoice && !isExpectedMercadoPagoInvoice(invoice)) throw new Error("unexpected_invoice");
    const subscriptionId = invoice?.preapproval_id ?? resourceId;
    const subscription = await getMercadoPagoSubscription(subscriptionId);
    const userId = uuidSchema.parse(subscription.external_reference);
    if (!isExpectedMercadoPagoSubscription(subscription)) throw new Error("unexpected_plan");
    const status = resolveMercadoPagoStatus(subscription.status, invoice ? {
      paymentStatus: invoice.payment?.status,
      summarized: invoice.summarized,
    } : null);
    const providerUpdatedAt = subscription.last_modified && new Date(subscription.last_modified) > new Date(eventCreatedAt)
      ? subscription.last_modified
      : eventCreatedAt;
    await applyEntitlement({
      userId, provider: "mercado_pago", subscriptionId: subscription.id, status,
      accessUntil: calculateAccessUntil(status, subscription.next_payment_date, providerUpdatedAt),
      eventCreatedAt: providerUpdatedAt,
    });
    await finishWebhookEvent("mercado_pago", eventId);
    return new NextResponse(null, { status: 204 });
  } catch {
    await finishWebhookEvent("mercado_pago", eventId, "processing_failed");
    return NextResponse.json({ error: "Falha temporária." }, { status: 500 });
  }
}
