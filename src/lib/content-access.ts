import "server-only";

import { redirect } from "next/navigation";
import { hasMemberSession } from "@/lib/auth/member-session.mjs";
import { createClient } from "@/lib/supabase/server";

export async function requireContentAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !hasMemberSession(user, claimsData?.claims)) {
    await supabase.auth.signOut();
    redirect("/login?error=google_required");
  }

  if (user.app_metadata?.role === "admin") {
    const { data, error } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (error || data?.currentLevel !== "aal2") {
      redirect("/admin");
    }
  }

  const { data: hasAccess, error: accessError } = await supabase.rpc(
    "has_active_content_access"
  );

  if (accessError) {
    throw new Error("Nao foi possivel validar o acesso ao acervo.");
  }

  if (hasAccess !== true) {
    redirect("/dashboard/assinatura");
  }

  return { supabase, user };
}
