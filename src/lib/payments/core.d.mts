export type EntitlementStatus = "active" | "trialing" | "pending" | "past_due" | "canceled" | "expired";

export function resolveMercadoPagoPayerEmail(input: {
  environment: string;
  userEmail: string;
  testPayerEmail?: string;
}): string;
export function buildMercadoPagoSubscriptionPayload(input: { userId: string; email: string; appUrl: string; amount: number }): {
  reason: string;
  external_reference: string;
  payer_email: string;
  back_url: string;
  status: "pending";
  auto_recurring: { frequency: 1; frequency_type: "months"; transaction_amount: number; currency_id: "BRL" };
};
export function mapMercadoPagoStatus(status: string): EntitlementStatus;
export function mapPayPalStatus(status: string): EntitlementStatus;
export function resolveMercadoPagoStatus(subscriptionStatus: string, invoice?: { paymentStatus?: string; summarized?: string } | null): EntitlementStatus;
export function resolvePayPalStatus(subscriptionStatus: string, failedPaymentsCount?: number, eventType?: string): EntitlementStatus;
export function calculateAccessUntil(status: EntitlementStatus, nextBillingTime: string | null | undefined, eventTime: string): string | null;
export function verifyMercadoPagoSignature(input: { dataId: string; requestId: string; signature: string; secret: string }): boolean;
export function isAllowedCheckoutUrl(value: string, provider: "mercado_pago" | "paypal"): boolean;
