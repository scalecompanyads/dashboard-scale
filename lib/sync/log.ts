import { createAdminClient } from "@/lib/supabase/admin";
import type { SyncSource, TriggeredBy } from "@/lib/types/database.types";

// Supabase/Postgrest errors are plain objects ({ message, code, details,
// hint }), not Error instances — String(err) on one of those just yields
// the useless literal "[object Object]" (this was happening for real: a
// failed sync run had exactly that as its logged error_message, hiding
// whatever actually went wrong). JSON.stringify captures the real fields
// instead.
export function formatSyncError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    const json = JSON.stringify(err);
    // Error-like objects can stringify to "{}" if their fields aren't
    // enumerable (some fetch/AbortError shapes) — fall back rather than
    // log something even less useful than the object itself.
    return json && json !== "{}" ? json : String(err);
  } catch {
    return String(err);
  }
}

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
  const message = formatSyncError(err);

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
