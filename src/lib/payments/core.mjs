import { createHmac, timingSafeEqual } from "node:crypto";

const ACTIVE_ACCESS_FALLBACK_DAYS = 35;
const BILLING_GRACE_DAYS = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MERCADO_PAGO_TEST_EMAIL_PATTERN = /^[^\s@]+@testuser\.com$/i;

const PROVIDER_ERROR_DETAIL_PATTERNS = [
  [/(invalid users involved|payer.{0,40}collector|collector.{0,40}payer)/i, "payer-collector-environment"],
  [/(invalid test user email|invalid_email_for_sandbox)/i, "test-payer-email"],
  [/payer_email/i, "payer-email"],
  [/back_url/i, "back-url"],
  [/external_reference/i, "external-reference"],
  [/auto_recurring/i, "auto-recurring"],
  [/transaction_amount/i, "transaction-amount"],
  [/currency_id/i, "currency"],
  [/frequency_type/i, "frequency-type"],
  [/\bfrequency\b/i, "frequency"],
  [/idempotency/i, "idempotency"],
  [/(unsupported propert|required propert|minimum propert|property_type)/i, "request-properties"],
  [/\bstatus\b/i, "status"],
  [/\breason\b/i, "reason"],
];

export function classifyProviderErrorDetail(values) {
  const text = values.filter((value) => typeof value === "string").join(" ");
  return PROVIDER_ERROR_DETAIL_PATTERNS.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

export function resolveMercadoPagoPayerEmail({ environment, userEmail, testPayerEmail }) {
  if (environment === "test") {
    const email = testPayerEmail?.trim();
    if (!email || !MERCADO_PAGO_TEST_EMAIL_PATTERN.test(email)) {
      throw new Error("MERCADO_PAGO_TEST_PAYER_EMAIL deve usar o domínio testuser.com.");
    }
    return email;
  }
  if (environment !== "production") {
    throw new Error("MERCADO_PAGO_ENVIRONMENT deve ser test ou production.");
  }
  const email = userEmail.trim();
  if (!EMAIL_PATTERN.test(email)) throw new Error("A conta precisa ter um e-mail válido para assinar.");
  return email;
}

export function buildMercadoPagoSubscriptionPayload({ userId, email, appUrl, amount }) {
  return {
    reason: "PRO Concursos — assinatura mensal",
    external_reference: userId,
    payer_email: email,
    back_url: `${appUrl}/dashboard/assinatura?checkout=retorno`,
    status: "pending",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: amount,
      currency_id: "BRL",
    },
  };
}

export function mapMercadoPagoStatus(status) {
  return ({
    pending: "pending",
    authorized: "active",
    paused: "past_due",
    cancelled: "canceled",
    canceled: "canceled",
  })[status] ?? "pending";
}

export function mapPayPalStatus(status) {
  return ({
    APPROVAL_PENDING: "pending",
    APPROVED: "pending",
    ACTIVE: "active",
    SUSPENDED: "past_due",
    CANCELLED: "canceled",
    CANCELED: "canceled",
    EXPIRED: "expired",
  })[status] ?? "pending";
}

export function resolveMercadoPagoStatus(subscriptionStatus, invoice = null) {
  const status = mapMercadoPagoStatus(subscriptionStatus);
  if (status === "canceled" || status === "expired") return status;
  if (!invoice) return status === "active" ? "pending" : status;
  if (invoice.paymentStatus === "approved") return status === "active" ? "active" : status;
  return invoice.summarized === "pending" ? "pending" : "past_due";
}

export function resolvePayPalStatus(subscriptionStatus, failedPaymentsCount = 0, eventType = "") {
  const status = mapPayPalStatus(subscriptionStatus);
  if (status === "canceled" || status === "expired") return status;
  if (failedPaymentsCount > 0 || [
    "PAYMENT.SALE.REFUNDED",
    "PAYMENT.SALE.REVERSED",
    "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
  ].includes(eventType)) return "past_due";
  return status;
}

export function calculateAccessUntil(status, nextBillingTime, eventTime) {
  if (status !== "active" && status !== "trialing") return null;

  const eventDate = new Date(eventTime);
  if (Number.isNaN(eventDate.getTime())) throw new Error("Data do evento de pagamento inválida.");

  const nextBillingDate = nextBillingTime ? new Date(nextBillingTime) : null;
  const base = nextBillingDate && !Number.isNaN(nextBillingDate.getTime()) && nextBillingDate > eventDate
    ? nextBillingDate
    : new Date(eventDate.getTime() + ACTIVE_ACCESS_FALLBACK_DAYS * 86_400_000);

  return new Date(base.getTime() + BILLING_GRACE_DAYS * 86_400_000).toISOString();
}

export function verifyMercadoPagoSignature({ dataId, requestId, signature, secret }) {
  if (!dataId || !requestId || !signature || !secret) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((part) => part.trim().split("=", 2))
  );
  if (!parts.ts || !parts.v1 || !/^[a-f0-9]{64}$/i.test(parts.v1)) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest();
  const received = Buffer.from(parts.v1, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function isAllowedCheckoutUrl(value, provider) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const allowedHosts = provider === "mercado_pago"
      ? ["www.mercadopago.com.br", "www.mercadopago.com", "sandbox.mercadopago.com.br"]
      : ["www.paypal.com", "www.sandbox.paypal.com"];
    return allowedHosts.includes(url.hostname);
  } catch {
    return false;
  }
}
