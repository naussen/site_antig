export type EntitlementStatus = "active" | "trialing" | "pending" | "past_due" | "canceled" | "expired";

export function classifyProviderErrorDetail(values: unknown[]): string | null;
export function resolveMercadoPagoPayerEmail(input: {
  environment: string;
  userEmail: string;
  testPayerEmail?: string;
}): string;
export function resolvePayPalEnvironment(environment: string | undefined): "sandbox" | "live";
export type PayPalCheckoutPlan = {
  id?: string;
  status?: string;
  billing_cycles?: Array<{
    tenure_type?: string;
    total_cycles?: number;
    frequency?: { interval_unit?: string; interval_count?: number };
    pricing_scheme?: { fixed_price?: { currency_code?: string; value?: string } };
  }>;
  payment_preferences?: { setup_fee?: { value?: string } };
  taxes?: { inclusive?: boolean; percentage?: string };
};
export function isExpectedPayPalCheckoutPlan(plan: PayPalCheckoutPlan, amount: number): boolean;
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
export function shouldBlockNewCheckout(entitlement: {
  status: EntitlementStatus;
  access_until: string | null;
  provider_subscription_id: string | null;
} | null): boolean;
export function verifyMercadoPagoSignature(input: { dataId: string; requestId: string; signature: string; secret: string }): boolean;
export function isAllowedCheckoutUrl(value: string, provider: "mercado_pago" | "paypal"): boolean;
