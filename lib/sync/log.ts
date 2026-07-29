import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SyncSource, TriggeredBy } from "@/lib/types/database.types";

export async function logSyncStart(source: SyncSource, triggeredBy: TriggeredBy, triggeredByUser?: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sync_runs")
    .insert({
      source,
      status: "running",
      triggered_by: triggeredBy,
      triggered_by_user: triggeredByUser ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function logSyncSuccess(runId: string, source: SyncSource, rowsUpserted: number) {
  const supabase = createAdminClient();
  const finishedAt = new Date().toISOString();

  await Promise.all([
    supabase
      .from("sync_runs")
      .update({ status: "success", finished_at: finishedAt, rows_upserted: rowsUpserted })
      .eq("id", runId),
    supabase.from("sync_state").upsert({
      source,
      last_success_at: finishedAt,
      last_status: "success",
      updated_at: finishedAt,
    }),
  ]);
}

export async function logSyncError(runId: string, source: SyncSource, err: unknown) {
  const supabase = createAdminClient();
  const finishedAt = new Date().toISOString();
  const message = err instanceof Error ? err.message : String(err);

  // A failed sync never touches leads/meta_ads_* — whatever rows were
  // upserted before the failure stay; the run is just logged as an error so
  // the UI can show a "dado desatualizado" banner instead of breaking.
  await Promise.all([
    supabase
      .from("sync_runs")
      .update({ status: "error", finished_at: finishedAt, error_message: message })
      .eq("id", runId),
    supabase.from("sync_state").upsert({
      source,
      last_error_at: finishedAt,
      last_error_message: message,
      last_status: "error",
      updated_at: finishedAt,
    }),
  ]);
}
