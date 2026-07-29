import type { SupabaseClient } from "@supabase/supabase-js";
import { dateMonth, ETAPA_EXCLUIDA_AGENDA, monthKeyOf, monthRange } from "@/lib/constants";
import type { Database, Lead } from "@/lib/types/database.types";

type DB = SupabaseClient<Database>;

export type ClosingFilter = "all" | "mesmo_mes" | "outros_meses";

// leads / agendadas / fechamentos are just different date-column filters
// over the same `leads` table — mirrors fetchLeads/fetchAgendadas/
// fetchClosingsFiltered in the legacy dashboard.

export async function getLeadsByEntryRange(supabase: DB, year: number, month: number): Promise<Lead[]> {
  const [from, to] = monthRange(year, month);
  const { data, error } = await supabase.from("leads").select("*").gte("dt_entrada", from).lte("dt_entrada", to);
  if (error) throw error;
  return data ?? [];
}

export async function getAgendaByRange(supabase: DB, year: number, month: number): Promise<Lead[]> {
  const [from, to] = monthRange(year, month);
  const { data, error } = await supabase.from("leads").select("*").gte("dt_agenda", from).lte("dt_agenda", to);
  if (error) throw error;
  return (data ?? []).filter((i) => !ETAPA_EXCLUIDA_AGENDA.has(i.etapa ?? ""));
}

async function getClosingsRawByRange(supabase: DB, year: number, month: number): Promise<Lead[]> {
  const [from, to] = monthRange(year, month);
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .gte("dt_fecha", from)
    .lte("dt_fecha", to)
    .eq("etapa", "Fechado");
  if (error) throw error;
  return data ?? [];
}

export async function getClosingsFiltered(
  supabase: DB,
  year: number,
  month: number,
  filter: ClosingFilter,
  customRange?: { from?: string; to?: string }
): Promise<Lead[]> {
  const closings = await getClosingsRawByRange(supabase, year, month);
  const key = monthKeyOf(year, month);

  if (filter === "mesmo_mes") {
    return closings.filter((i) => dateMonth(i.dt_entrada) === key);
  }

  if (filter === "outros_meses") {
    const cFrom = customRange?.from;
    const cTo = customRange?.to;
    return closings.filter((i) => {
      if (!i.dt_entrada) return false;
      if (dateMonth(i.dt_entrada) === key) return false; // exclui leads do próprio mês
      if (cFrom && i.dt_entrada < cFrom) return false;
      if (cTo && i.dt_entrada > cTo) return false;
      return true;
    });
  }

  return closings;
}
