import { NextResponse } from "next/server";
import { isAdminApiRequest } from "@/lib/api-admin-auth.mjs";
import { reconcilePayments } from "@/lib/payments/reconciliation";

export async function POST(request: Request) {
  if (!isAdminApiRequest(request, process.env.PAYMENTS_RECONCILIATION_TOKEN)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    return NextResponse.json(await reconcilePayments());
  } catch {
    return NextResponse.json({ error: "Falha na reconciliação." }, { status: 500 });
  }
}
