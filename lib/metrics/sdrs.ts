import { ETAPA_REALIZADA, isSdrPessoa } from "@/lib/constants";
import type { Lead } from "@/lib/types/database.types";

// Quanto vale cada critério no ranking dos SDRs. Os três SOMAM: uma reunião
// que foi marcada, aconteceu e virou contrato pontua 1 + 2 + 3 = 6. Cada
// critério cumprido paga o ponto dele — o agendamento não deixa de valer
// porque a reunião depois aconteceu; ele é o degrau que fez o resto existir.
export const PONTOS_SDR = { agendamento: 1, comparecimento: 2, contrato: 3 } as const;

export interface SdrStats {
  name: string;
  agendadas: number;
  feitas: number;
  contratos: number;
  /** agendadas×1 + feitas×2 + contratos×3 — é por aqui que o pódio ordena. */
  pontos: number;
}

function pontuacao(s: { agendadas: number; feitas: number; contratos: number }): number {
  return (
    s.agendadas * PONTOS_SDR.agendamento +
    s.feitas * PONTOS_SDR.comparecimento +
    s.contratos * PONTOS_SDR.contrato
  );
}

// Empate em pontos: ganha quem tem mais contrato, depois quem tem mais
// comparecimento. Chegar aos mesmos pontos pelo caminho mais difícil vale
// mais do que chegar por volume de agendamento.
export function comparaSdrs(a: SdrStats, b: SdrStats): number {
  return (
    b.pontos - a.pontos ||
    b.contratos - a.contratos ||
    b.feitas - a.feitas ||
    a.name.localeCompare(b.name)
  );
}

// Ported from calcSDRs() in the legacy dashboard, extended with a contratos
// count (closings attributed to the SDR that originated the lead — same
// `closings` list already fed to calcClosers, just grouped by `sdr` instead
// of `closer`).
//
// Entra quem AGENDOU, e não quem tem o cargo. O Gabriel é closer e de vez
// em quando ajuda no agendamento — o trabalho aconteceu, e o pódio mostra
// trabalho. Pela mesma razão, quem já saiu do time continua no pódio dos
// meses em que estava.
//
// O que fica de fora é o que não é uma pessoa que agendou: "IA",
// "Recomendação" e as células com dois nomes. Ver isSdrPessoa em
// lib/constants.ts.
export function calcSDRs(agendaItems: Lead[], closings: Lead[]): SdrStats[] {
  const map = new Map<string, SdrStats>();

  for (const item of agendaItems) {
    const name = item.sdr;
    if (!isSdrPessoa(name)) continue;
    if (!map.has(name!)) map.set(name!, { name: name!, agendadas: 0, feitas: 0, contratos: 0, pontos: 0 });
    const stats = map.get(name!)!;
    stats.agendadas++;
    if (item.etapa && ETAPA_REALIZADA.has(item.etapa)) stats.feitas++;
  }

  for (const item of closings) {
    const name = item.sdr;
    if (!isSdrPessoa(name)) continue;
    if (!map.has(name!)) map.set(name!, { name: name!, agendadas: 0, feitas: 0, contratos: 0, pontos: 0 });
    map.get(name!)!.contratos++;
  }

  // A lista já sai na ordem do ranking, para quem consome ela (pódio, script
  // de conferência) não ter que reordenar por conta própria.
  return [...map.values()]
    .filter((s) => s.agendadas > 0 || s.contratos > 0)
    .map((s) => ({ ...s, pontos: pontuacao(s) }))
    .sort(comparaSdrs);
}

// Top-3 do pódio. Ordena de novo pelo mesmo critério do calcSDRs em vez de
// confiar na ordem que chegou.
export function podiumTop3(sdrs: SdrStats[]): (SdrStats | undefined)[] {
  const sorted = [...sdrs].sort(comparaSdrs);
  return [sorted[0], sorted[1], sorted[2]];
}
