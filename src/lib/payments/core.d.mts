export type EntitlementStatus = "active" | "trialing" | "pending" | "past_due" | "canceled" | "expired";

export function mapMercadoPagoStatus(status: string): EntitlementStatus;
export function mapPayPalStatus(status: string): EntitlementStatus;
export function calculateAccessUntil(status: EntitlementStatus, nextBillingTime: string | null | undefined, eventTime: string): string | null;
export function verifyMercadoPagoSignature(input: { dataId: string; requestId: string; signature: string; secret: string }): boolean;
export function isAllowedCheckoutUrl(value: string, provider: "mercado_pago" | "paypal"): boolean;
