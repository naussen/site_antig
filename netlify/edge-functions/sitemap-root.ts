/**
 * Expõe a metadata gerada pelo Next.js na URL canônica do domínio.
 */
export default function sitemapRoot(request: Request) {
  return new URL("/resumos/sitemap.xml", request.url);
}

export const config = {
  path: "/sitemap.xml",
};
