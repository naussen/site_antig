import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMercadoPagoConfig,
  getPaymentsAppUrl,
} from "@/lib/payments/providers";
import {
  buildMercadoPagoSubscriptionPayload,
  resolveMercadoPagoPayerEmail,
} from "@/lib/payments/core.mjs";

/**
 * TEMPORARY diagnostic route — DELETE after resolving integration.
 * GET /api/payments/diagnose
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const steps: Record<string, unknown> = {};

  try {
    const config = getMercadoPagoConfig();
    steps.environment = config.environment;
    steps.amount = config.amount;
    steps.testPayerEmail = config.testPayerEmail ?? "(not set)";
    steps.accessTokenPrefix = config.accessToken.slice(0, 12) + "...";

    const appUrl = getPaymentsAppUrl();
    steps.appUrl = appUrl;

    const payerEmail = resolveMercadoPagoPayerEmail({
      environment: config.environment,
      userEmail: user.email ?? "",
      testPayerEmail: config.testPayerEmail,
    });
    steps.resolvedPayerEmail = payerEmail;

    const payload = buildMercadoPagoSubscriptionPayload({
      userId: user.id,
      email: payerEmail,
      appUrl,
      amount: config.amount,
    });
    steps.payload = payload;

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    const body = await response.text();
    steps.httpStatus = response.status;
    try {
      steps.responseBody = JSON.parse(body);
    } catch {
      steps.responseBody = body.slice(0, 2000);
    }
    steps.success = response.ok;
  } catch (err) {
    steps.error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(steps, { status: 200 });
}
