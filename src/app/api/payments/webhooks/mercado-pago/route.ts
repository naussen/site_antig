import { z } from "zod";
import { NextResponse } from "next/server";
import {
  applyEntitlement,
  beginWebhookEvent,
  blockPaymentAccess,
  finishWebhookEvent,
  getProviderTransaction,
  recordProviderTransaction,
} from "@/lib/payments/entitlements";
import { calculateAccessUntil, resolveMercadoPagoStatus, verifyMercadoPagoSignature } from "@/lib/payments/core.mjs";
import {
  getMercadoPagoChargeback,
  getMercadoPagoConfig,
  getMercadoPagoInvoice,
  getMercadoPagoPayment,
  getMercadoPagoSubscription,
  isExpectedMercadoPagoInvoice,
  isExpectedMercadoPagoSubscription,
} from "@/lib/payments/providers";
import { readWebhookJson, RequestBodyError } from "@/lib/payments/webhook-request.mjs";

const eventSchema = z.object({
  type: z.string().max(100),
  data: z.object({ id: z.union([z.string(), z.number()]) }),
});
const uuidSchema = z.string().uuid();
const supportedEvents = new Set([
  "subscription_preapproval",
  "subscription_authorized_payment",
  "payment",
  "topic_chargebacks_wh",
]);
const revokingPaymentStatuses = new Set(["refunded", "charged_back"]);

function latestTrustedTimestamp(fallback: string, ...values: Array<string | undefined>) {
  let latest = fallback;
  for (const value of values) {
    if (!value) continue;
    const candidate = new Date(value);
    if (!Number.isNaN(candidate.getTime()) && candidate > new Date(latest)) latest = candidate.toISOString();
  }
  return latest;
}

async function assertExpectedSubscription(subscriptionId: string, expectedUserId?: string) {
  const subscription = await getMercadoPagoSubscription(subscriptionId);
  const userId = uuidSchema.parse(subscription.external_reference);
  if (expectedUserId && userId !== expectedUserId) throw new Error("unexpected_user");
  if (subscription.id !== subscriptionId || !isExpectedMercadoPagoSubscription(subscription)) {
    throw new Error("unexpected_subscription");
  }
  return { subscription, userId };
}

async function processSubscriptionEvent(type: string, resourceId: string, receivedAt: string) {
  const invoice = type === "subscription_authorized_payment"
    ? await getMercadoPagoInvoice(resourceId)
    : null;
  if (invoice && !isExpectedMercadoPagoInvoice(invoice)) throw new Error("unexpected_invoice");

  const subscriptionId = invoice?.preapproval_id ?? resourceId;
  const { subscription, userId } = await assertExpectedSubscription(subscriptionId);
  if (invoice?.payment?.id !== undefined) {
    await recordProviderTransaction({
      provider: "mercado_pago",
      transactionId: String(invoice.payment.id),
      subscriptionId,
      userId,
      status: invoice.payment.status ?? "unknown",
      amount: Number.isFinite(Number(invoice.transaction_amount)) ? Number(invoice.transaction_amount) : null,
      currency: invoice.currency_id ?? null,
      providerUpdatedAt: latestTrustedTimestamp(receivedAt, invoice.last_modified),
    });
  }

  const status = resolveMercadoPagoStatus(subscription.status, invoice ? {
    paymentStatus: invoice.payment?.status,
    summarized: invoice.summarized,
  } : null);
  const providerUpdatedAt = latestTrustedTimestamp(receivedAt, subscription.last_modified, invoice?.last_modified);
  await applyEntitlement({
    userId,
    provider: "mercado_pago",
    subscriptionId: subscription.id,
    status,
    accessUntil: calculateAccessUntil(status, subscription.next_payment_date, providerUpdatedAt),
    eventCreatedAt: providerUpdatedAt,
  });
}

async function revokeMappedPayment(paymentId: string, receivedAt: string) {
  const payment = await getMercadoPagoPayment(paymentId);
  if (String(payment.id) !== paymentId) throw new Error("unexpected_payment");
  if (!revokingPaymentStatuses.has(payment.status ?? "")) return;

  const mapping = await getProviderTransaction("mercado_pago", paymentId);
  if (!mapping) throw new Error("unmapped_payment");
  if (payment.external_reference && payment.external_reference !== mapping.user_id) throw new Error("unexpected_payment_user");
  if (mapping.currency && payment.currency_id !== mapping.currency) throw new Error("unexpected_payment_currency");
  if (mapping.amount !== null && Number(payment.transaction_amount) !== Number(mapping.amount)) {
    throw new Error("unexpected_payment_amount");
  }

  const { subscription } = await assertExpectedSubscription(mapping.provider_subscription_id, mapping.user_id);
  const providerUpdatedAt = latestTrustedTimestamp(receivedAt, payment.date_last_updated);
  await recordProviderTransaction({
    provider: "mercado_pago",
    transactionId: paymentId,
    subscriptionId: mapping.provider_subscription_id,
    userId: mapping.user_id,
    status: payment.status ?? "unknown",
    amount: payment.transaction_amount ?? mapping.amount,
    currency: payment.currency_id ?? mapping.currency,
    providerUpdatedAt,
  });
  await blockPaymentAccess({
    userId: mapping.user_id,
    provider: "mercado_pago",
    subscriptionId: mapping.provider_subscription_id,
    resourceId: paymentId,
    reason: payment.status === "charged_back" ? "chargeback" : "refund",
    providerUpdatedAt,
  });
  await applyEntitlement({
    userId: mapping.user_id,
    provider: "mercado_pago",
    subscriptionId: subscription.id,
    status: "past_due",
    accessUntil: null,
    eventCreatedAt: providerUpdatedAt,
  });
}

async function processChargeback(chargebackId: string, receivedAt: string) {
  const chargeback = await getMercadoPagoChargeback(chargebackId);
  if (String(chargeback.id) !== chargebackId) throw new Error("unexpected_chargeback");
  const rawPayments = Array.isArray(chargeback.payments) ? chargeback.payments : [chargeback.payments];
  const paymentIds = rawPayments.filter((value): value is string | number => value !== undefined).map(String);
  if (paymentIds.length === 0) throw new Error("chargeback_without_payment");

  for (const paymentId of paymentIds) {
    const mapping = await getProviderTransaction("mercado_pago", paymentId);
    if (!mapping) throw new Error("unmapped_chargeback");
    const { subscription } = await assertExpectedSubscription(mapping.provider_subscription_id, mapping.user_id);
    const providerUpdatedAt = latestTrustedTimestamp(receivedAt, chargeback.date_last_updated);
    await blockPaymentAccess({
      userId: mapping.user_id,
      provider: "mercado_pago",
      subscriptionId: mapping.provider_subscription_id,
      resourceId: chargebackId,
      reason: "chargeback",
      providerUpdatedAt,
    });
    await applyEntitlement({
      userId: mapping.user_id,
      provider: "mercado_pago",
      subscriptionId: subscription.id,
      status: "past_due",
      accessUntil: null,
      eventCreatedAt: providerUpdatedAt,
    });
  }
}

export async function POST(request: Request) {
  let unknownBody: unknown;
  try {
    unknownBody = await readWebhookJson(request);
  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Não foi possível ler o evento." }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(unknownBody);
  if (!parsed.success) return NextResponse.json({ error: "Evento inválido." }, { status: 400 });

  const resourceId = String(parsed.data.data.id);
  const queryDataId = new URL(request.url).searchParams.get("data.id");
  if (!queryDataId || queryDataId !== resourceId) {
    return NextResponse.json({ error: "Identificador divergente." }, { status: 400 });
  }
  const requestId = request.headers.get("x-request-id") ?? "";
  const validSignature = verifyMercadoPagoSignature({
    dataId: queryDataId,
    requestId,
    signature: request.headers.get("x-signature") ?? "",
    secret: getMercadoPagoConfig().webhookSecret,
  });
  if (!validSignature) return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  if (!supportedEvents.has(parsed.data.type)) return new NextResponse(null, { status: 200 });

  // x-request-id and data.id are covered by the provider signature. Body IDs and
  // body timestamps are intentionally never used for idempotency or ordering.
  const receivedAt = new Date().toISOString();
  const claim = await beginWebhookEvent({
    provider: "mercado_pago",
    eventId: requestId,
    eventType: parsed.data.type,
    resourceId,
    eventCreatedAt: receivedAt,
  });
  if (claim.duplicate) return new NextResponse(null, { status: 200 });

  try {
    if (parsed.data.type === "payment") await revokeMappedPayment(resourceId, receivedAt);
    else if (parsed.data.type === "topic_chargebacks_wh") await processChargeback(resourceId, receivedAt);
    else await processSubscriptionEvent(parsed.data.type, resourceId, receivedAt);

    await finishWebhookEvent("mercado_pago", requestId);
    return new NextResponse(null, { status: 200 });
  } catch {
    await finishWebhookEvent("mercado_pago", requestId, "processing_failed");
    return NextResponse.json({ error: "Falha temporária." }, { status: 500 });
  }
}
