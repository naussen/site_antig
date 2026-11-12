import { createClient } from "@supabase/supabase-js";
import { rotateSharedFriendAccount } from "../../scripts/lib/shared-friend-account.mjs";

export default async function rotateFriendPassword() {
  const env = process.env;
  if (env.CONTEXT !== "production") return new Response(null, { status: 204 });
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    await rotateSharedFriendAccount(supabase, env);
    return new Response(null, { status: 204 });
  } catch {
    // Não registrar erro bruto: provedores podem incluir credenciais/payloads.
    console.error("Falha na rotação da conta Amigos. Verificar configuração e estado de entrega.");
    return new Response(null, { status: 500 });
  }
}

// Verificação horária; o banco só libera rotação após 15 dias ou entrega pendente.
export const config = { schedule: "0 * * * *" };
