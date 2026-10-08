const required = (name) => Boolean(process.env[name]?.trim());

const checks = {
  supabase_public: required("NEXT_PUBLIC_SUPABASE_URL")
    && (required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") || required("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
  supabase_admin: required("SUPABASE_SERVICE_ROLE_KEY"),
  content_admin: required("CONTENT_ADMIN_TOKEN"),
  payments_base: required("PAYMENTS_APP_URL") && required("PAYMENTS_MONTHLY_PRICE_BRL"),
  reconciliation: required("PAYMENTS_RECONCILIATION_TOKEN"),
  mercado_pago_live: process.env.MERCADO_PAGO_ENVIRONMENT === "production"
    && required("MERCADO_PAGO_ACCESS_TOKEN")
    && required("MERCADO_PAGO_WEBHOOK_SECRET"),
  paypal_live: process.env.PAYPAL_ENVIRONMENT === "live"
    && required("PAYPAL_CLIENT_ID")
    && required("PAYPAL_CLIENT_SECRET")
    && required("PAYPAL_PLAN_ID")
    && required("PAYPAL_WEBHOOK_ID"),
  operations_alert: required("OPS_ALERT_WEBHOOK_URL"),
  portable_backup: required("PRO_BACKUP_RECOVERY_PASSPHRASE")
    && required("PRO_BACKUP_OFFSITE_DIRECTORY"),
};

const result = {
  ready: Object.values(checks).every(Boolean),
  checks,
};

console.log(JSON.stringify(result));
if (!result.ready) process.exitCode = 1;
