/**
 * Mantém o domínio principal na barra do navegador enquanto serve a landing
 * hospedada na zona estável do PRO Resumos.
 */
export default function landingRoot(request: Request) {
  return new URL("/resumos/landing", request.url);
}

export const config = {
  path: "/",
};
