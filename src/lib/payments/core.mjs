import { createHmac, timingSafeEqual } from "node:crypto";

const ACTIVE_ACCESS_FALLBACK_DAYS = 35;
const BILLING_GRACE_DAYS = 3;

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
