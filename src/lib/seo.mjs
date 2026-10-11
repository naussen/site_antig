import { withSiteBasePath } from "./site-paths.mjs";

export const SITE_ORIGIN = "https://proconcursos.com.br";
export const SITE_HOME_URL = `${SITE_ORIGIN}/`;

export const INDEXABLE_PUBLIC_PATHS = [
  "/termos",
  "/privacidade",
  "/suporte",
  "/contato",
];

export function getPublicUrl(path) {
  if (path === "/") return SITE_HOME_URL;

  return new URL(withSiteBasePath(path), SITE_ORIGIN).toString();
}
