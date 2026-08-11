import type { ComercialKPIs } from "@/lib/metrics/kpis";

export interface FunnelMilestone {
  targetPct: number;
  needed: number;
}

export interface FunnelStage {
  key: "leads" | "agendadas" | "realizadas" | "fechados";
  label: string;
  value: number;
  /** Conversion % from the previous stage (null for the first stage). */
  conversionFromPrevious: number | null;
  /** Next 5-point milestone above the current conversion %, and how many
   *  more (of `value`) are needed to reach it — null when there's no
   *  previous-stage ratio to milestone against, or it's already >=100%. */
  nextMilestone: FunnelMilestone | null;
}

export interface FunnelData {
  stages: FunnelStage[];
  /** Overall conversion: fechados / leads totais, as a percentage. */
  totalConversionPct: number;
}

// Next multiple-of-5 percentage point above the current numerator/denominator
// ratio, and how many more of the numerator are needed to reach it. Always
// steps to the NEXT tier even when currentPct is already an exact multiple
// of 5 (floor+1), so `needed` is always >= 1 by construction.
function nextMilestone(numerator: number, denominator: number): FunnelMilestone | null {
  if (!denominator) return null;
  const currentPct = (numerator / denominator) * 100;
  if (currentPct >= 100) return null;
  const targetPct = (Math.floor(currentPct / 5) + 1) * 5;
  const needed = Math.ceil((denominator * targetPct) / 100) - numerator;
  return { targetPct, needed };
}

// Ported from the inline funnel math in renderDash() in the legacy dashboard.
export function buildFunnel(kpis: ComercialKPIs): FunnelData {
  const c2ag = kpis.total ? (kpis.agendadas / kpis.total) * 100 : 0;
  const c2real = kpis.agendadas ? (kpis.realizadas / kpis.agendadas) * 100 : 0;
  const c2fech = kpis.realizadas ? (kpis.fechados / kpis.realizadas) * 100 : 0;
  const totalConversionPct = kpis.total ? (kpis.fechados / kpis.total) * 100 : 0;

  return {
    stages: [
      { key: "leads", label: "Leads Totais", value: kpis.total, conversionFromPrevious: null, nextMilestone: null },
      {
        key: "agendadas",
        label: "Reuniões Agendadas",
        value: kpis.agendadas,
        conversionFromPrevious: c2ag,
        nextMilestone: nextMilestone(kpis.agendadas, kpis.total),
      },
      {
        key: "realizadas",
        label: "Reuniões Realizadas",
        value: kpis.realizadas,
        conversionFromPrevious: c2real,
        nextMilestone: nextMilestone(kpis.realizadas, kpis.agendadas),
      },
      { key: "fechados", label: "Fechamentos", value: kpis.fechados, conversionFromPrevious: c2fech, nextMilestone: null },
    ],
    totalConversionPct,
  };
}
