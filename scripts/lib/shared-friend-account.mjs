import { createHmac, randomUUID } from "node:crypto";
import { SHARED_ACCOUNT_EMAIL, isSharedAccount } from "../../src/lib/auth/shared-account.mjs";

export function passwordForRotation(secret, rotationId) {
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("Segredo de rotação ausente ou curto.");
  return `Aa1!${createHmac("sha256", secret).update(`shared-friend:${rotationId}`).digest("base64url")}`;
}

function checked(result) {
  if (result.error) throw new Error("Falha na operação da conta compartilhada.");
  return result.data;
}

export async function rotateSharedFriendAccount(supabase, env, send = fetch) {
  const secret = env.SHARED_ACCOUNT_ROTATION_SECRET;
  // Falhar antes de modificar a conta se a entrega não estiver configurada.
  passwordForRotation(secret, "validation");
  if (!env.RESEND_API_KEY || !env.SHARED_ACCOUNT_MAIL_FROM) throw new Error("Envio de e-mail não configurado.");
  const rows = checked(await supabase.rpc("claim_shared_friend_rotation"));
  if (!rows?.length) return "not_due";
  const state = rows[0];
  const password = passwordForRotation(secret, state.rotation_id);
  const metadata = { shared_account: true, rotation_nonce: randomUUID() };
  try {
    let user;
    if (state.user_id) {
      user = checked(await supabase.auth.admin.getUserById(state.user_id)).user;
    } else {
      // Email fixo + índice único tornam a criação idempotente mesmo após timeout.
      for (let page = 1; ; page++) {
        const data = checked(await supabase.auth.admin.listUsers({ page, perPage: 100 }));
        user = data.users.find((candidate) => candidate.email === SHARED_ACCOUNT_EMAIL);
        if (user || data.users.length < 100) break;
      }
      if (!user) {
        user = checked(await supabase.auth.admin.createUser({
          email: SHARED_ACCOUNT_EMAIL, password, email_confirm: true,
          app_metadata: metadata, user_metadata: { full_name: "Amigos" },
        })).user;
      }
      if (!isSharedAccount(user)) throw new Error("Identidade existente incompatível.");
      checked(await supabase.from("shared_friend_account").update({ user_id: user.id }).eq("singleton", true));
    }
    if (!isSharedAccount(user)) throw new Error("Identidade compartilhada inválida.");
    if (user.factors?.some((factor) => factor.status === "verified")) throw new Error("Conta compartilhada possui MFA; revisão necessária.");
    if (!state.rotated_at) {
      checked(await supabase.auth.admin.updateUserById(user.id, {
        password, app_metadata: { ...user.app_metadata, ...metadata, rotation_nonce: randomUUID() },
      }));
      state.rotated_at = new Date().toISOString();
      checked(await supabase.from("shared_friend_account").update({ rotated_at: state.rotated_at }).eq("singleton", true));
    }
    checked(await supabase.from("user_entitlements").upsert({
      user_id: user.id, provider: "shared_friends", status: "active", access_until: null,
      provider_subscription_id: null,
    }, { onConflict: "user_id" }));
    const response = await send("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `shared-friend-${state.rotation_id}` },
      body: JSON.stringify({
        from: env.SHARED_ACCOUNT_MAIL_FROM, to: ["nvpezat@gmail.com"],
        subject: "PRO Concursos — senha da conta Amigos",
        text: `Conta: Amigos\nAcesso: https://proconcursos.com.br/resumos/login/amigos\nSenha: ${password}\n\nSenha renovada a cada 15 dias. Sem segundo fator. Notas e progresso são compartilhados. Não há acesso administrativo.`,
      }),
    });
    if (!response.ok) throw new Error("Falha ao entregar a senha; envio será repetido.");
    checked(await supabase.from("shared_friend_account").update({ delivered_at: new Date().toISOString() }).eq("singleton", true));
    return "delivered";
  } finally {
    checked(await supabase.from("shared_friend_account").update({ lease_until: null }).eq("singleton", true));
  }
}
