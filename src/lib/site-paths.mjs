export const SITE_BASE_PATH = "/resumos";

const NON_STUDY_ROOT_SEGMENTS = new Set([
  "admin",
  "api",
  "auth",
  "contato",
  "dashboard",
  "landing",
  "legis",
  "login",
  "privacidade",
  "suporte",
  "termos",
]);

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

/**
 * Identifica a rota dinâmica de tópico, tanto antes quanto depois de o Next.js
 * remover o basePath. Rotas públicas, administrativas e aninhadas não são
 * classificadas como páginas de estudo.
 *
 * @param {string} pathname
 */
export function isStudyPath(pathname) {
  if (typeof pathname !== "string" || !pathname.startsWith("/")) {
    return false;
  }

  if (pathname === SITE_BASE_PATH || pathname === `${SITE_BASE_PATH}/`) {
    return false;
  }

  const localPath = pathname.startsWith(`${SITE_BASE_PATH}/`)
    ? pathname.slice(SITE_BASE_PATH.length)
    : pathname;
  const segments = localPath.split("/").filter(Boolean);

  if (segments.length !== 1) {
    return false;
  }

  const [segment] = segments;
  return (
    !segment.includes(".") &&
    !NON_STUDY_ROOT_SEGMENTS.has(segment.toLowerCase())
  );
}
