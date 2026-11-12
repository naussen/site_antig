export const SHARED_ACCOUNT_EMAIL = "amigos@acesso.proconcursos.invalid";

export function isSharedAccount(user) {
  return user?.email === SHARED_ACCOUNT_EMAIL
    && user?.app_metadata?.shared_account === true
    && user?.app_metadata?.role !== "admin";
}

export function hasSharedSession(user, claims) {
  return isSharedAccount(user) && claims?.sub === user.id
    && Array.isArray(claims.amr)
    && claims.amr.some((entry) => (typeof entry === "string" ? entry : entry?.method) === "password");
}
