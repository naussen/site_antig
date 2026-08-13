const AUTH_ERROR_MESSAGES = {
  email_not_confirmed:
    "Seu e-mail ainda não foi confirmado. Verifique também a pasta de spam.",
  invalid_credentials: "E-mail ou senha inválidos.",
  over_email_send_rate_limit:
    "O limite temporário de envio de e-mails foi atingido. Aguarde alguns minutos antes de tentar novamente.",
};

/**
 * Converte erros públicos do Supabase Auth em mensagens úteis sem expor
 * detalhes internos da configuração do projeto.
 *
 * @param {unknown} error
 */
export function getAuthErrorMessage(error) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code).toLowerCase()
      : "";
  const originalMessage =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "";
  const normalizedMessage = originalMessage.toLowerCase();

  if (code in AUTH_ERROR_MESSAGES) {
    return AUTH_ERROR_MESSAGES[code];
  }

  if (normalizedMessage.includes("rate limit")) {
    return AUTH_ERROR_MESSAGES.over_email_send_rate_limit;
  }

  return originalMessage || "Não foi possível concluir a autenticação. Tente novamente.";
}
