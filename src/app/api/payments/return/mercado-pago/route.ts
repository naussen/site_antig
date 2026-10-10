import { NextResponse } from "next/server";
import { getPaymentsInternalUrl } from "@/lib/payments/providers";

export function GET() {
  const destination = new URL(getPaymentsInternalUrl("/dashboard/assinatura"));
  destination.searchParams.set("checkout", "retorno");
  return NextResponse.redirect(destination);
}
