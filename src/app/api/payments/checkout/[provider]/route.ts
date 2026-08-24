import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest } from "@/lib/same-origin.mjs";
import { createMercadoPagoSubscription, createPayPalSubscription, getPaymentsAppUrl } from "@/lib/payments/providers";

const providers = new Set(["mercado-pago", "paypal"]);

function subscriptionPage(params: Record<string, string>) {
  const url = new URL(`${getPaymentsAppUrl()}/dashboard/assinatura`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  if (!providers.has(provider)) return NextResponse.json({ error: "Provedor inválido." }, { status: 404 });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`${getPaymentsAppUrl()}/login`), 303);

  const { data: entitlement, error } = await supabase
    .from("user_entitlements")
    .select("status, access_until")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.redirect(subscriptionPage({ checkout: "erro" }), 303);

  const accessIsCurrent = !entitlement?.access_until || new Date(entitlement.access_until) > new Date();
  if (entitlement && ["active", "trialing"].includes(entitlement.status) && accessIsCurrent) {
    return NextResponse.redirect(subscriptionPage({ checkout: "ja-ativo" }), 303);
  }

  try {
    const checkoutUrl = provider === "mercado-pago"
      ? await createMercadoPagoSubscription(user.id, user.email ?? "")
      : await createPayPalSubscription(user.id);
    return NextResponse.redirect(checkoutUrl, 303);
  } catch {
    return NextResponse.redirect(subscriptionPage({ checkout: "erro" }), 303);
  }
}
