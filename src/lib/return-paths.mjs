const URL_BASE = "https://proconcursos.com.br";
const ALLOWED_ROOTS = Object.freeze(["/resumos", "/legis"]);

export function isAllowedReturnPath(candidate) {
  if (
    typeof candidate !== "string" ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /%(?:2f|5c)/iu.test(candidate) ||
    /[\u0000-\u001f\u007f]/u.test(candidate)
  ) return false;

  try {
    const parsed = new URL(candidate, URL_BASE);
    return parsed.origin === URL_BASE && ALLOWED_ROOTS.some((root) =>
      parsed.pathname === root || parsed.pathname.startsWith(`${root}/`));
  } catch {
    return false;
  }
}

export function sanitizeReturnPath(candidate, fallback = "/resumos/dashboard") {
  if (!isAllowedReturnPath(fallback)) {
    throw new TypeError("O fallback de retorno precisa pertencer ao ecossistema PRO Concursos.");
  }
  return isAllowedReturnPath(candidate) ? candidate : fallback;
}

export function resolveReturnUrl(path, requestUrl) {
  const safePath = sanitizeReturnPath(path);
  const request = new URL(requestUrl);
  return safePath === "/legis" || safePath.startsWith("/legis/")
    ? new URL(safePath, URL_BASE)
    : new URL(safePath, request.origin);
}
