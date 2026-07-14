"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Server Action para forçar a criação de um usuário JÁ VERIFICADO 
 * e escapar das limitações de Rate Limit de envio de e-mails em testes.
 */
export async function forceCreateConfirmedUser(email: string, password: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Tenta criar o usuário pelo painel de admin, o que não dispara o rate limit 
  // de envio de emails e já marca o email_confirm como true.
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    // Pode falhar caso o usuário já exista, o que é seguro ignorar para o teste
    console.error("Admin Create User Erro:", error.message);
    return { error: error.message };
  }

  return { success: true };
}
