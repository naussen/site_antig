import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMercadoPagoConfig,
  getPaymentsAppUrl,
} from "@/lib/payments/providers";

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
    steps.accessTokenPrefix = config.accessToken.slice(0, 20) + "...";
    steps.currentTestPayerEmail = config.testPayerEmail ?? "(not set)";

    const appUrl = getPaymentsAppUrl();

    // Step 1: Identify token owner (Seller Test User)
    const meResponse = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${config.accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    const meData = await meResponse.json();
    steps.sellerTestUser = {
      id: meData.id,
      email: meData.email,
      nickname: meData.nickname,
    };

    // Step 2: List test users to find the Buyer
    const testUsersResponse = await fetch("https://api.mercadopago.com/users/test", {
      headers: { Authorization: `Bearer ${config.accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    const testUsersBody = await testUsersResponse.text();
    try {
      steps.testUsersLookup = { status: testUsersResponse.status, body: JSON.parse(testUsersBody) };
    } catch {
      steps.testUsersLookup = { status: testUsersResponse.status, raw: testUsersBody.slice(0, 1000) };
    }

    // Step 3: Try preapproval with the SELLER's own email format to confirm format works
    // (This should fail with "payer = collector" but confirms the email format)
    const sellerEmail = meData.email as string;
    // Derive buyer email by replacing seller's number with buyer's pattern
    // For now, show what we know
    steps.emailFormatNote = {
      correctFormat: "test_user_XXXX@testuser.com (lowercase with underscore)",
      wrongFormat: "TESTUSER_XXXX@testuser.com (this is the NICKNAME, not email)",
      sellerEmail: sellerEmail,
    };

    // Step 4: Try preapproval with seller email (expect payer=collector error, but validates format)
    const testPayload = {
      reason: "PRO Concursos - assinatura mensal",
      external_reference: user.id,
      payer_email: sellerEmail,
      back_url: `${appUrl}/dashboard/assinatura`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: config.amount,
        currency_id: "BRL",
      },
    };

    const testResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10_000),
    });
    const testBody = await testResponse.text();
    try {
      steps.withSellerEmail = { status: testResponse.status, body: JSON.parse(testBody) };
    } catch {
      steps.withSellerEmail = { status: testResponse.status, raw: testBody.slice(0, 1000) };
    }

  } catch (err) {
    steps.error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(steps, { status: 200 });
}
