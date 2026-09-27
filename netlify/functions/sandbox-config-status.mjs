export default async function handler() {
  return new Response(JSON.stringify({
    mercado_pago_test: process.env.MERCADO_PAGO_ENVIRONMENT === "test",
    mercado_pago_credentials: Boolean(
      process.env.MERCADO_PAGO_ACCESS_TOKEN
      && process.env.MERCADO_PAGO_WEBHOOK_SECRET
      && process.env.MERCADO_PAGO_TEST_PAYER_EMAIL
    ),
    paypal_sandbox: process.env.PAYPAL_ENVIRONMENT === "sandbox",
    paypal_credentials: Boolean(
      process.env.PAYPAL_CLIENT_ID
      && process.env.PAYPAL_CLIENT_SECRET
      && process.env.PAYPAL_PLAN_ID
      && process.env.PAYPAL_WEBHOOK_ID
    ),
    payments_app_url_matches: process.env.PAYMENTS_APP_URL === "https://sandbox-financeiro--proresumos.netlify.app",
    service_role_present: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
