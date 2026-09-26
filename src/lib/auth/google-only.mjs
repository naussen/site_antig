/**
 * Confirma que a sessão foi emitida a partir de uma identidade Google vinculada.
 * O e-mail do usuário não é suficiente para provar o provedor de autenticação.
 *
 * @param {unknown} user
 */
export function hasGoogleIdentity(user) {
  if (!user || typeof user !== "object" || !("app_metadata" in user)) {
    return false;
  }

  const providers = user.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes("google");
}

/**
 * Confirma pelo JWT verificado que a sessão atual nasceu de OAuth, e não de
 * senha, OTP ou recuperação de uma conta que apenas tenha Google vinculado.
 *
 * @param {unknown} claims
 */
export function hasOAuthAuthentication(claims) {
  if (!claims || typeof claims !== "object" || !("amr" in claims)) {
    return false;
  }

  const methods = Array.isArray(claims.amr) ? claims.amr : [];
  return methods.some((entry) => {
    const method = typeof entry === "string" ? entry : entry?.method;
    return method === "oauth" || method === "oauth_provider/authorization_code";
  });
}

export function hasGoogleSession(user, claims) {
  return hasGoogleIdentity(user) && hasOAuthAuthentication(claims);
}
