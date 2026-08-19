import "server-only";

import { redirect } from "next/navigation";
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
