import { timingSafeEqual } from "node:crypto";

const MIN_ADMIN_TOKEN_BYTES = 32;

/**
 * Valida o segredo exclusivo dos endpoints administrativos.
 * A Service Role nunca deve trafegar como credencial HTTP do consumidor.
 *
 * @param {Request} request
 * @param {string | undefined} adminToken
 */
export function isAdminApiRequest(
  request,
  adminToken = process.env.CONTENT_ADMIN_TOKEN
) {
  if (!adminToken) {
    return false;
  }

  const expected = Buffer.from(adminToken, "utf8");
  const authorization = request.headers.get("authorization");

  if (
    expected.byteLength < MIN_ADMIN_TOKEN_BYTES ||
    !authorization?.startsWith("Bearer ")
  ) {
    return false;
  }

  const provided = Buffer.from(authorization.slice(7), "utf8");

  return (
    provided.byteLength === expected.byteLength &&
    timingSafeEqual(provided, expected)
  );
}
