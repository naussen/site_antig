const OAUTH_CALLBACK_KEYS = Object.freeze([
  "code",
  "state",
  "next",
  "error",
  "error_code",
  "error_description",
]);

const OAUTH_CALLBACK_SIGNALS = Object.freeze([
  "code",
  "error_code",
  "error_description",
]);

/**
 * Remove artefatos transitórios de OAuth somente quando a URL apresenta um
 * sinal inequívoco de callback. Queries comuns da aplicação permanecem intactas.
 *
 * @param {string | URL | { toString(): string }} input
 * @returns {URL}
 */
export function sanitizeOAuthCallbackUrl(input) {
  const url = new URL(input.toString());
  const isOAuthCallback = OAUTH_CALLBACK_SIGNALS.some((key) =>
    url.searchParams.has(key)
  );

  if (!isOAuthCallback) return url;

  for (const key of OAUTH_CALLBACK_KEYS) {
    url.searchParams.delete(key);
  }

  return url;
}

