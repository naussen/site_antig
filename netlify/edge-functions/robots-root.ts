/**
 * Expõe a metadata gerada pelo Next.js na URL canônica do domínio.
 */
export default function robotsRoot(request: Request) {
  return new URL("/resumos/robots.txt", request.url);
}

export const config = {
  path: "/robots.txt",
};
