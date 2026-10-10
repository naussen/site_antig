import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const RECONCILIATION_MAX_AGE_MS = 26 * 60 * 60 * 1000;

export async function GET() {
  const checkedAt = new Date();
  try {
    const supabase = createAdminClient();
    const [{ error: databaseError }, { data: latestRun, error: jobError }] = await Promise.all([
      supabase.from("topics").select("topic_id").limit(1),
      supabase
        .from("ops_job_runs")
        .select("finished_at")
        .eq("job_name", "payment_reconciliation")
        .eq("status", "succeeded")
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (databaseError) throw new Error("database_unavailable");

    const lastSuccessAt = !jobError && latestRun?.finished_at ? new Date(latestRun.finished_at) : null;
    const reconciliationFresh = Boolean(
      lastSuccessAt && checkedAt.getTime() - lastSuccessAt.getTime() <= RECONCILIATION_MAX_AGE_MS
    );
    const status = jobError || !reconciliationFresh ? "degraded" : "ok";
    return NextResponse.json({
      status,
      checked_at: checkedAt.toISOString(),
      checks: {
        database: "ok",
        payment_reconciliation: reconciliationFresh ? "ok" : "stale",
      },
    }, {
      status: status === "ok" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({
      status: "unavailable",
      checked_at: checkedAt.toISOString(),
      checks: { database: "failed", payment_reconciliation: "unknown" },
    }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
