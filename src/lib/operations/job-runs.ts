import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const SAFE_CODE = /^[a-z0-9_.-]{1,100}$/;

export async function startJobRun(jobName: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ops_job_runs")
      .insert({ job_name: jobName, status: "running" })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  } catch {
    console.error("Falha ao iniciar registro de job operacional.", { jobName });
    return null;
  }
}

export async function finishJobRun(
  runId: string | null,
  status: "succeeded" | "failed",
  metrics: Record<string, number | boolean> = {},
  errorCode?: string
) {
  if (!runId) return false;
  try {
    const supabase = createAdminClient();
    const normalizedError = errorCode && SAFE_CODE.test(errorCode) ? errorCode : null;
    const { error } = await supabase
      .from("ops_job_runs")
      .update({
        status,
        finished_at: new Date().toISOString(),
        metrics,
        error_code: normalizedError,
      })
      .eq("id", runId)
      .eq("status", "running");
    if (error) throw error;
    return true;
  } catch {
    console.error("Falha ao finalizar registro de job operacional.", { status });
    return false;
  }
}
