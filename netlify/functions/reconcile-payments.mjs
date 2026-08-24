async function reconcilePayments() {
  const appUrl = process.env.PAYMENTS_APP_URL?.replace(/\/$/, "");
  const token = process.env.PAYMENTS_RECONCILIATION_TOKEN;
  if (!appUrl || !token) throw new Error("Reconciliação de pagamentos sem configuração.");

  const response = await fetch(`${appUrl}/api/payments/reconcile`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`Reconciliação de pagamentos falhou com HTTP ${response.status}.`);

  const result = await response.json();
  console.log("Reconciliação de pagamentos concluída.", result);
}

export default reconcilePayments;

export const config = { schedule: "0 6 * * *" };
