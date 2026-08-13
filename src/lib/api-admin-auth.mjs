/**
 * Valida chamadas administrativas sem expor a Service Role ao cliente.
 * Sem chave configurada no servidor, as rotas privilegiadas permanecem fechadas.
 *
 * @param {Request} request
 * @param {string | undefined} serviceRoleKey
 */
export function isServiceRoleRequest(
  request,
  serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  if (!serviceRoleKey) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${serviceRoleKey}`;
}
