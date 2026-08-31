import { ETAPA_REALIZADA, isSdrDoTime } from "@/lib/constants";
import type { Lead } from "@/lib/types/database.types";

export interface SdrStats {
  name: string;
  agendadas: number;
  feitas: number;
  contratos: number;
}

// Ported from calcSDRs() in the legacy dashboard, extended with a contratos
// count (closings attributed to the SDR that originated the lead — same
// `closings` list already fed to calcClosers, just grouped by `sdr` instead
// of `closer`).
//
// Só o time de hoje entra (SDR_ROSTER, em lib/constants.ts). A coluna `sdr`
// tem dez meses de gente que já saiu, valores que não são pessoa e células
// com dois nomes; contar tudo aquilo como SDR faria o pódio ranquear "IA" e
// "Recomendação", e dividiria a meta do time por um número que não é o
// tamanho do time. Consequência a saber: num mês antigo, quem já saiu não
// aparece mais no pódio daquele mês.
export function calcSDRs(agendaItems: Lead[], closings: Lead[]): SdrStats[] {
  const map = new Map<string, SdrStats>();

  for (const item of agendaItems) {
    const name = item.sdr;
    if (!isSdrDoTime(name)) continue;
    if (!map.has(name!)) map.set(name!, { name: name!, agendadas: 0, feitas: 0, contratos: 0 });
    const stats = map.get(name!)!;
    stats.agendadas++;
    if (item.etapa && ETAPA_REALIZADA.has(item.etapa)) stats.feitas++;
  }

  for (const item of closings) {
    const name = item.sdr;
    if (!isSdrDoTime(name)) continue;
    if (!map.has(name!)) map.set(name!, { name: name!, agendadas: 0, feitas: 0, contratos: 0 });
    map.get(name!)!.contratos++;
  }

  return [...map.values()]
    .filter((s) => s.agendadas > 0 || s.contratos > 0)
    .sort((a, b) => b.agendadas - a.agendadas);
}

// Top-3 podium ranking, same tie-break as the legacy buildPodium(): sorted by
// (agendadas + feitas) desc.
export function podiumTop3(sdrs: SdrStats[]): (SdrStats | undefined)[] {
  const sorted = [...sdrs].sort((a, b) => b.agendadas + b.feitas - (a.agendadas + a.feitas));
  return [sorted[0], sorted[1], sorted[2]];
}
