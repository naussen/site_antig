async function reconcilePayments() {
  const appUrl = process.env.PAYMENTS_APP_URL?.replace(/\/$/, "");
  const token = process.env.PAYMENTS_RECONCILIATION_TOKEN;
  if (!appUrl || !token) throw new Error("Reconciliação de pagamentos sem configuração.");

  const response = await fetch(`${appUrl}/resumos/api/payments/reconcile`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`Reconciliação de pagamentos falhou com HTTP ${response.status}.`);

  const result = await response.json();
  console.log("Reconciliação de pagamentos concluída.", result);
}

async function notifyFailure(message) {
  const webhookUrl = process.env.OPS_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    const url = new URL(webhookUrl);
    if (url.protocol !== "https:") throw new Error("invalid_alert_url");
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: message }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    console.error("Falha ao enviar alerta operacional.");
  }
}

export default async function scheduledReconciliation() {
  try {
    await reconcilePayments();
  } catch (error) {
    await notifyFailure("PRO Concursos: a reconciliação de pagamentos falhou.");
    throw error;
  }
}

export const config = { schedule: "0 */6 * * *" };
