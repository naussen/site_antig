import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function authorizeNoteImageRequest() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { response: NextResponse.json({ error: "Não autorizado." }, { status: 401 }) } as const;
  }

  if (user.app_metadata?.role === "admin") {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || data?.currentLevel !== "aal2") {
      return { response: NextResponse.json({ error: "MFA necessário." }, { status: 403 }) } as const;
    }
  }

  const { data: hasAccess, error: accessError } = await supabase.rpc("has_active_content_access");
  if (accessError) {
    return { response: NextResponse.json({ error: "Serviço temporariamente indisponível." }, { status: 503 }) } as const;
  }
  if (hasAccess !== true) {
    return { response: NextResponse.json({ error: "Acesso ao acervo necessário." }, { status: 403 }) } as const;
  }

  return { supabase, user } as const;
}
