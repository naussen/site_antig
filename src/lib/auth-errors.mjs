const AUTH_ERROR_MESSAGES = {
  oauth_provider_not_supported:
    "O provedor Google não está disponível no momento. Tente novamente mais tarde.",
  bad_oauth_state:
    "A validação do login expirou. Inicie o acesso pelo Google novamente.",
  mfa_challenge_expired:
    "O desafio TOTP expirou. Solicite uma nova validação.",
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
    return "Muitas tentativas de autenticação. Aguarde alguns minutos e tente novamente.";
  }

  return originalMessage || "Não foi possível concluir a autenticação. Tente novamente.";
}
