const MP_API = "https://api.mercadopago.com";
const PAYPAL_API = "https://api-m.sandbox.paypal.com";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Sandbox bloqueado: ${name} não está configurada.`);
  return value;
}

function validateSandboxConfiguration() {
  if (required("MERCADO_PAGO_ENVIRONMENT") !== "test") {
    throw new Error("Sandbox bloqueado: MERCADO_PAGO_ENVIRONMENT deve ser test; produção nunca é usada neste teste.");
  }
  if (required("PAYPAL_ENVIRONMENT") !== "sandbox") {
    throw new Error("Sandbox bloqueado: PAYPAL_ENVIRONMENT deve ser sandbox; live nunca é usado neste teste.");
  }

  const payerEmail = required("MERCADO_PAGO_TEST_PAYER_EMAIL");
  if (!/^[^\s@]+@testuser\.com$/iu.test(payerEmail)) {
    throw new Error("Sandbox bloqueado: MERCADO_PAGO_TEST_PAYER_EMAIL deve ser um usuário de teste do Mercado Pago.");
  }

  const appUrl = new URL(required("PAYMENTS_APP_URL"));
  if (appUrl.protocol !== "https:" || appUrl.pathname !== "/" || appUrl.search || appUrl.hash) {
    throw new Error("Sandbox bloqueado: PAYMENTS_APP_URL deve ser a raiz HTTPS do ambiente de teste.");
  }

  return {
    mercadoPagoToken: required("MERCADO_PAGO_ACCESS_TOKEN"),
    mercadoPagoWebhookSecret: required("MERCADO_PAGO_WEBHOOK_SECRET"),
    payPalClientId: required("PAYPAL_CLIENT_ID"),
    payPalClientSecret: required("PAYPAL_CLIENT_SECRET"),
    payPalPlanId: required("PAYPAL_PLAN_ID"),
    payPalWebhookId: required("PAYPAL_WEBHOOK_ID"),
  };
}

async function providerJson(response, provider) {
  if (!response.ok) throw new Error(`${provider}: credencial sandbox recusada (HTTP ${response.status}).`);
  return response.json();
}

async function probeProviders(config) {
  const mercadoPago = await fetch(`${MP_API}/users/me`, {
    headers: { Authorization: `Bearer ${config.mercadoPagoToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  await providerJson(mercadoPago, "Mercado Pago");

  const basic = Buffer.from(`${config.payPalClientId}:${config.payPalClientSecret}`).toString("base64");
  const payPal = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10_000),
  });
  await providerJson(payPal, "PayPal");
}

async function main() {
  const config = validateSandboxConfiguration();
  if (process.argv.includes("--probe")) await probeProviders(config);
  console.log(JSON.stringify({
    sandbox: true,
    configuration: "valid",
    credentials: process.argv.includes("--probe") ? "accepted" : "not-probed",
    secrets_exposed: false,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
