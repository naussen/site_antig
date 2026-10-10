import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type PaymentProvider = "mercado_pago" | "paypal";
type PaymentAuditAction =
  | "checkout_created"
  | "checkout_failed"
  | "checkout_blocked"
  | "cancellation_confirmed"
  | "cancellation_failed";

type PaymentAuditInput = {
  action: PaymentAuditAction;
  outcome: "success" | "failure";
  provider: PaymentProvider;
  userId: string;
  subscriptionId?: string | null;
  reasonCode?: string | null;
};

const SAFE_REASON_CODE = /^[a-z0-9_.-]{1,100}$/;

export async function recordPaymentAudit(input: PaymentAuditInput) {
  try {
    const reasonCode = input.reasonCode && SAFE_REASON_CODE.test(input.reasonCode)
      ? input.reasonCode
      : null;
    const supabase = createAdminClient();
    const { error } = await supabase.from("payment_audit_events").insert({
      action: input.action,
      outcome: input.outcome,
      provider: input.provider,
      user_id: input.userId,
      provider_subscription_id: input.subscriptionId ?? null,
      reason_code: reasonCode,
    });
    if (error) throw new Error("payment_audit_insert_failed");
    return true;
  } catch {
    console.error("Falha ao registrar auditoria financeira.", {
      action: input.action,
      provider: input.provider,
    });
    return false;
  }
}
