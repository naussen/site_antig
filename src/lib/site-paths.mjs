export const SITE_BASE_PATH = "/resumos";

/**
 * Adiciona o prefixo público do site a um caminho interno absoluto.
 * A função é idempotente para evitar duplicar o prefixo em callbacks.
 *
 * @param {string} path
 */
export function withSiteBasePath(path) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new TypeError("O caminho do site deve ser interno e começar com uma barra.");
  }

  if (path === SITE_BASE_PATH || path.startsWith(`${SITE_BASE_PATH}/`)) {
    return path;
  }

  return path === "/" ? SITE_BASE_PATH : `${SITE_BASE_PATH}${path}`;
}
