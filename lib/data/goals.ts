import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type DB = SupabaseClient<Database>;

// Replaces the legacy dashboard's localStorage "metas_override" — shared
// across the whole team instead of living in one browser.

export async function getGoal(supabase: DB, monthKey: string): Promise<number> {
  const { data, error } = await supabase
    .from("monthly_goals")
    .select("goal_value")
    .eq("month", monthKey)
    .maybeSingle();
  if (error) throw error;
  return data?.goal_value ?? 0;
}

export async function getGoalsForMonths(supabase: DB, monthKeys: string[]): Promise<Record<string, number>> {
  if (monthKeys.length === 0) return {};
  const { data, error } = await supabase.from("monthly_goals").select("month, goal_value").in("month", monthKeys);
  if (error) throw error;
  const map: Record<string, number> = {};
  for (const row of data ?? []) map[row.month] = row.goal_value;
  return map;
}

export async function upsertGoal(supabase: DB, monthKey: string, value: number, userId: string) {
  const { error } = await supabase.from("monthly_goals").upsert({
    month: monthKey,
    goal_value: value,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
