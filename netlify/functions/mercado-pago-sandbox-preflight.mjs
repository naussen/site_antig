export default async function handler() {
  const environmentTest = process.env.MERCADO_PAGO_ENVIRONMENT === "test";
  const payerValid = /^[^\s@]+@testuser\.com$/iu.test(
    process.env.MERCADO_PAGO_TEST_PAYER_EMAIL?.trim() ?? ""
  );
  const webhookSecretPresent = Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim());
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  const appUrlValid = process.env.PAYMENTS_APP_URL === "https://sandbox-financeiro--proresumos.netlify.app";

  let credentialStatus = null;
  if (environmentTest && token && appUrlValid) {
    const response = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    credentialStatus = response.status;
  }

  return Response.json({
    environment_test: environmentTest,
    payer_valid: payerValid,
    webhook_secret_present: webhookSecretPresent,
    app_url_valid: appUrlValid,
    credential_status: credentialStatus,
    credential_accepted: credentialStatus === 200,
    secrets_exposed: false,
  }, { headers: { "Cache-Control": "no-store" } });
}
