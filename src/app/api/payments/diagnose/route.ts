import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMercadoPagoConfig,
  getPaymentsAppUrl,
} from "@/lib/payments/providers";
import {
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
    steps.accessTokenPrefix = config.accessToken.slice(0, 20) + "...";

    const appUrl = getPaymentsAppUrl();
    steps.appUrl = appUrl;

    const payerEmail = resolveMercadoPagoPayerEmail({
      environment: config.environment,
      userEmail: user.email ?? "",
      testPayerEmail: config.testPayerEmail,
    });
    steps.resolvedPayerEmail = payerEmail;

    // Step 1: Verify token — who does this token belong to?
    const meResponse = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${config.accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    const meBody = await meResponse.text();
    try {
      const meData = JSON.parse(meBody);
      steps.tokenOwner = {
        status: meResponse.status,
        id: meData.id,
        email: meData.email,
        nickname: meData.nickname,
        site_id: meData.site_id,
      };
    } catch {
      steps.tokenOwner = { status: meResponse.status, raw: meBody.slice(0, 500) };
    }

    // Step 2: Try preapproval WITHOUT status field
    const payload = {
      reason: "PRO Concursos - assinatura mensal",
      external_reference: user.id,
      payer_email: payerEmail,
      back_url: `${appUrl}/dashboard/assinatura`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: config.amount,
        currency_id: "BRL",
      },
    };
    steps.payloadSent = { ...payload, payer_email: payerEmail.slice(0, 15) + "..." };

    const preapprovalResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    const preapprovalBody = await preapprovalResponse.text();
    try {
      steps.preapprovalResult = {
        status: preapprovalResponse.status,
        body: JSON.parse(preapprovalBody),
      };
    } catch {
      steps.preapprovalResult = {
        status: preapprovalResponse.status,
        raw: preapprovalBody.slice(0, 2000),
      };
    }
  } catch (err) {
    steps.error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(steps, { status: 200 });
}
