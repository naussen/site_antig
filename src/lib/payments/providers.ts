import "server-only";
import { createHash } from "node:crypto";
import {
  buildMercadoPagoSubscriptionPayload,
  classifyProviderErrorDetail,
  isAllowedCheckoutUrl,
  resolveMercadoPagoPayerEmail,
} from "./core.mjs";

const MERCADO_PAGO_API = "https://api.mercadopago.com";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Configuração de pagamento ausente: ${name}.`);
  return value;
}

function checkoutIdempotencyKey(userId: string, provider: string) {
  const tenMinuteBucket = Math.floor(Date.now() / 600_000);
  const hex = createHash("sha256").update(`${provider}:${userId}:${tenMinuteBucket}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getPaymentsAppUrl() {
  const value = requiredEnv("PAYMENTS_APP_URL");
  const url = new URL(value);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
    throw new Error("PAYMENTS_APP_URL deve usar HTTPS fora do ambiente local.");
  }
  if (url.search || url.hash) throw new Error("PAYMENTS_APP_URL não pode conter query ou fragmento.");
  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return `${url.origin}${pathname}`;
}

export function getMercadoPagoConfig() {
  const amount = Number(requiredEnv("PAYMENTS_MONTHLY_PRICE_BRL"));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Preço mensal do Mercado Pago inválido.");
  return {
    accessToken: requiredEnv("MERCADO_PAGO_ACCESS_TOKEN"),
    webhookSecret: requiredEnv("MERCADO_PAGO_WEBHOOK_SECRET"),
    environment: requiredEnv("MERCADO_PAGO_ENVIRONMENT"),
    testPayerEmail: process.env.MERCADO_PAGO_TEST_PAYER_EMAIL,
    amount,
  };
}

function getPayPalConfig() {
  const environment = process.env.PAYPAL_ENVIRONMENT === "live" ? "live" : "sandbox";
  return {
    clientId: requiredEnv("PAYPAL_CLIENT_ID"),
    clientSecret: requiredEnv("PAYPAL_CLIENT_SECRET"),
    planId: requiredEnv("PAYPAL_PLAN_ID"),
    webhookId: requiredEnv("PAYPAL_WEBHOOK_ID"),
    apiBase: environment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
  };
}

export class PaymentProviderError extends Error {
  constructor(
    provider: string,
    readonly status: number,
    readonly providerCode: string | null,
    readonly providerDetail: string | null,
  ) {
    super(`${provider} respondeu com HTTP ${status}.`);
    this.name = "PaymentProviderError";
  }
}

function normalizedProviderCode(value: unknown) {
  const code = typeof value === "number" ? String(value) : value;
  return typeof code === "string" && /^[a-z0-9_.-]{1,100}$/i.test(code) ? code : null;
}

async function providerJson<T>(response: Response, provider: string): Promise<T> {
  const body = await response.text();
  let data: unknown = null;
  try {
    data = body ? JSON.parse(body) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    // Diagnostic log — remove after resolving integration issue
    console.error(`[${provider}] HTTP ${response.status} response:`, body.slice(0, 2000));
    const record = data && typeof data === "object" ? data as Record<string, unknown> : null;
    const cause = Array.isArray(record?.cause) && record.cause[0] && typeof record.cause[0] === "object"
      ? record.cause[0] as Record<string, unknown>
      : null;
    throw new PaymentProviderError(
      provider,
      response.status,
      normalizedProviderCode(cause?.code) ?? normalizedProviderCode(record?.error),
      classifyProviderErrorDetail([
        record?.error,
        record?.message,
        cause?.code,
        cause?.description,
      ]),
    );
  }

  return data as T;
}

export async function createMercadoPagoSubscription(userId: string, email: string) {
  const config = getMercadoPagoConfig();
  const appUrl = getPaymentsAppUrl();
  const payerEmail = resolveMercadoPagoPayerEmail({
    environment: config.environment,
    userEmail: email,
    testPayerEmail: config.testPayerEmail,
  });
  const payload = buildMercadoPagoSubscriptionPayload({ userId, email: payerEmail, appUrl, amount: config.amount });
  // Diagnostic log — remove after resolving integration issue
  console.error("[Mercado Pago] Checkout payload:", JSON.stringify({ ...payload, payer_email: payload.payer_email?.slice(0, 10) + "..." }));
  const response = await fetch(`${MERCADO_PAGO_API}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const data = await providerJson<{ init_point?: string }>(response, "Mercado Pago");
  if (!data.init_point || !isAllowedCheckoutUrl(data.init_point, "mercado_pago")) {
    throw new Error("Mercado Pago não retornou uma URL de checkout válida.");
  }
  return data.init_point;
}

async function getPayPalAccessToken() {
  const config = getPayPalConfig();
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch(`${config.apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const data = await providerJson<{ access_token?: string }>(response, "PayPal");
  if (!data.access_token) throw new Error("PayPal não retornou token de acesso.");
  return { config, accessToken: data.access_token };
}

export async function createPayPalSubscription(userId: string) {
  const { config, accessToken } = await getPayPalAccessToken();
  const appUrl = getPaymentsAppUrl();
  const response = await fetch(`${config.apiBase}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": checkoutIdempotencyKey(userId, "paypal"),
    },
    body: JSON.stringify({
      plan_id: config.planId,
      custom_id: userId,
      application_context: {
        brand_name: "PRO Concursos",
        locale: "pt-BR",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${appUrl}/dashboard/assinatura?checkout=retorno`,
        cancel_url: `${appUrl}/dashboard/assinatura?checkout=cancelado`,
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const data = await providerJson<{ links?: Array<{ rel: string; href: string }> }>(response, "PayPal");
  const approvalUrl = data.links?.find((link) => link.rel === "approve")?.href;
  if (!approvalUrl || !isAllowedCheckoutUrl(approvalUrl, "paypal")) {
    throw new Error("PayPal não retornou uma URL de aprovação válida.");
  }
  return approvalUrl;
}

export async function getMercadoPagoSubscription(subscriptionId: string) {
  const config = getMercadoPagoConfig();
  const response = await fetch(`${MERCADO_PAGO_API}/preapproval/${encodeURIComponent(subscriptionId)}`, {
    headers: { Authorization: `Bearer ${config.accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  return providerJson<{
    id: string; status: string; external_reference?: string;
    next_payment_date?: string; date_created?: string; last_modified?: string;
    auto_recurring?: { transaction_amount?: number; currency_id?: string };
  }>(response, "Mercado Pago");
}

export function isExpectedMercadoPagoSubscription(subscription: {
  auto_recurring?: { transaction_amount?: number; currency_id?: string };
}) {
  const { amount } = getMercadoPagoConfig();
  return subscription.auto_recurring?.currency_id === "BRL"
    && subscription.auto_recurring.transaction_amount === amount;
}

export async function getMercadoPagoInvoice(invoiceId: string) {
  const { accessToken } = getMercadoPagoConfig();
  const response = await fetch(`${MERCADO_PAGO_API}/authorized_payments/${encodeURIComponent(invoiceId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  const data = await providerJson<{
    preapproval_id?: string;
    currency_id?: string;
    transaction_amount?: string | number;
    summarized?: string;
    payment?: { status?: string };
  }>(response, "Mercado Pago");
  if (!data.preapproval_id) throw new Error("Fatura do Mercado Pago sem assinatura associada.");
  return { ...data, preapproval_id: data.preapproval_id };
}

export function isExpectedMercadoPagoInvoice(invoice: { currency_id?: string; transaction_amount?: string | number }) {
  const { amount } = getMercadoPagoConfig();
  return invoice.currency_id === "BRL" && Number(invoice.transaction_amount) === amount;
}

export async function verifyPayPalWebhook(headers: Headers, event: unknown) {
  const { config, accessToken } = await getPayPalAccessToken();
  const header = (name: string) => headers.get(name) ?? "";
  const response = await fetch(`${config.apiBase}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      transmission_id: header("paypal-transmission-id"),
      transmission_time: header("paypal-transmission-time"),
      cert_url: header("paypal-cert-url"),
      auth_algo: header("paypal-auth-algo"),
      transmission_sig: header("paypal-transmission-sig"),
      webhook_id: config.webhookId,
      webhook_event: event,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const data = await providerJson<{ verification_status?: string }>(response, "PayPal");
  return data.verification_status === "SUCCESS";
}

export async function getPayPalSubscription(subscriptionId: string) {
  const { config, accessToken } = await getPayPalAccessToken();
  const response = await fetch(`${config.apiBase}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  return providerJson<{
    id: string; plan_id?: string; status: string; custom_id?: string; status_update_time?: string;
    create_time?: string; billing_info?: { next_billing_time?: string; failed_payments_count?: number };
  }>(response, "PayPal");
}

export async function getLatestMercadoPagoInvoice(subscriptionId: string) {
  const { accessToken } = getMercadoPagoConfig();
  const url = new URL(`${MERCADO_PAGO_API}/authorized_payments/search`);
  url.searchParams.set("preapproval_id", subscriptionId);
  url.searchParams.set("limit", "20");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  const data = await providerJson<{ results?: Array<{
    preapproval_id?: string; currency_id?: string; transaction_amount?: string | number;
    summarized?: string; last_modified?: string; payment?: { status?: string };
  }> }>(response, "Mercado Pago");
  return (data.results ?? []).sort((a, b) =>
    new Date(b.last_modified ?? 0).getTime() - new Date(a.last_modified ?? 0).getTime()
  )[0] ?? null;
}

export function isExpectedPayPalSubscription(subscription: { plan_id?: string }) {
  return subscription.plan_id === getPayPalConfig().planId;
}
