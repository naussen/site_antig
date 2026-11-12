import { createClient } from "@supabase/supabase-js";
import { rotateSharedFriendAccount } from "./lib/shared-friend-account.mjs";

try {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  console.log(await rotateSharedFriendAccount(client, process.env));
} catch {
  console.error("Falha na conta Amigos. Verifique migration, segredos e serviço de e-mail.");
  process.exitCode = 1;
}
