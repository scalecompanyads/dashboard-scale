import { ETAPA_REALIZADA } from "@/lib/constants";
import type { Lead } from "@/lib/types/database.types";

export interface CloserStats {
  name: string;
  reunioes: number;
  fechados: number;
  mrr: number;
}

const EXCLUDED_CLOSER_NAMES = new Set(["Nenhum", "CS", "Yakin"]);

// Ported from calcClosers() in the legacy dashboard.
export function calcClosers(agendaItems: Lead[], closings: Lead[]): CloserStats[] {
  const map = new Map<string, CloserStats>();

  for (const item of agendaItems) {
    const name = item.closer;
    if (!name || EXCLUDED_CLOSER_NAMES.has(name)) continue;
    if (!item.etapa || !ETAPA_REALIZADA.has(item.etapa)) continue;
    if (!map.has(name)) map.set(name, { name, reunioes: 0, fechados: 0, mrr: 0 });
    map.get(name)!.reunioes++;
  }

  for (const item of closings) {
    const name = item.closer;
    if (!name || EXCLUDED_CLOSER_NAMES.has(name)) continue;
    if (!map.has(name)) map.set(name, { name, reunioes: 0, fechados: 0, mrr: 0 });
    const stats = map.get(name)!;
    stats.fechados++;
    stats.mrr += item.mrr_value ?? 0;
  }

  return [...map.values()].sort((a, b) => b.mrr - a.mrr);
}
