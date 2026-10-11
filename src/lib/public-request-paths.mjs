const SAFE_PUBLIC_METHODS = new Set(["GET", "HEAD"]);

export const SESSION_AWARE_REQUEST_HEADER = "x-pro-session-aware";

const PUBLIC_PAGE_PATHS = new Set([
  "/landing",
  "/sobre",
  "/metodologia-editorial",
  "/politica-de-ia",
  "/correcoes",
  "/termos",
  "/privacidade",
  "/suporte",
  "/contato",
]);

export function isPublicPageRequest(method, pathname) {
  if (!SAFE_PUBLIC_METHODS.has(method.toUpperCase())) return false;

  const normalizedPath =
    pathname.length > 1 ? pathname.replace(/\/+$/u, "") : pathname;

  return PUBLIC_PAGE_PATHS.has(normalizedPath);
}
