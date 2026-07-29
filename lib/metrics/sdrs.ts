import { ETAPA_REALIZADA } from "@/lib/constants";
import type { Lead } from "@/lib/types/database.types";

export interface SdrStats {
  name: string;
  agendadas: number;
  feitas: number;
}

// Ported from calcSDRs() in the legacy dashboard.
export function calcSDRs(agendaItems: Lead[]): SdrStats[] {
  const map = new Map<string, SdrStats>();

  for (const item of agendaItems) {
    const name = item.sdr;
    if (!name) continue;
    if (!map.has(name)) map.set(name, { name, agendadas: 0, feitas: 0 });
    const stats = map.get(name)!;
    stats.agendadas++;
    if (item.etapa && ETAPA_REALIZADA.has(item.etapa)) stats.feitas++;
  }

  return [...map.values()].filter((s) => s.agendadas > 0).sort((a, b) => b.agendadas - a.agendadas);
}

// Top-3 podium ranking, same tie-break as the legacy buildPodium(): sorted by
// (agendadas + feitas) desc.
export function podiumTop3(sdrs: SdrStats[]): (SdrStats | undefined)[] {
  const sorted = [...sdrs].sort((a, b) => b.agendadas + b.feitas - (a.agendadas + a.feitas));
  return [sorted[0], sorted[1], sorted[2]];
}
