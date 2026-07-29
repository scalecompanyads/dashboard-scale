import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SyncStateRow } from "@/lib/types/database.types";

type DB = SupabaseClient<Database>;

export async function getSyncStates(supabase: DB): Promise<SyncStateRow[]> {
  const { data, error } = await supabase.from("sync_state").select("*");
  if (error) throw error;
  return data ?? [];
}

export function overallSyncHealth(states: SyncStateRow[]) {
  const lastSuccessAt = states
    .map((s) => s.last_success_at)
    .filter((v): v is string => !!v)
    .sort()
    .at(-1);
  const hasError = states.some((s) => s.last_status === "error");
  const errorMessage = states.find((s) => s.last_status === "error")?.last_error_message ?? null;

  return { lastSuccessAt: lastSuccessAt ?? null, hasError, errorMessage };
}
