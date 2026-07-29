import type { SupabaseClient } from "@supabase/supabase-js";
import { dateMonth, monthLabel, monthRange } from "@/lib/constants";
import type { Database } from "@/lib/types/database.types";

type DB = SupabaseClient<Database>;

export interface RevenueTrendPoint {
  monthKey: string;
  label: string;
  total: number;
}

// Faturamento fechado (TCV+MRR) mês a mês — só possível agora que o
// histórico de `leads` fica persistido no Supabase em vez de recalculado
// ao vivo a cada carregamento.
export async function getRevenueTrend(supabase: DB, monthKeys: string[]): Promise<RevenueTrendPoint[]> {
  if (monthKeys.length === 0) return [];

  const sorted = [...monthKeys].sort();
  const [firstYear, firstMonth] = sorted[0].split("-").map(Number);
  const [lastYear, lastMonth] = sorted[sorted.length - 1].split("-").map(Number);
  const from = monthRange(firstYear, firstMonth)[0];
  const to = monthRange(lastYear, lastMonth)[1];

  const { data, error } = await supabase
    .from("leads")
    .select("dt_fecha, mrr_value")
    .eq("etapa", "Fechado")
    .gte("dt_fecha", from)
    .lte("dt_fecha", to);
  if (error) throw error;

  const totals = new Map<string, number>(monthKeys.map((k) => [k, 0]));
  for (const row of data ?? []) {
    const key = dateMonth(row.dt_fecha);
    if (!key || !totals.has(key)) continue;
    const v = row.mrr_value ?? 0;
    if (v > 0) totals.set(key, (totals.get(key) ?? 0) + v);
  }

  return monthKeys.map((key) => ({ monthKey: key, label: monthLabel(key), total: totals.get(key) ?? 0 }));
}
