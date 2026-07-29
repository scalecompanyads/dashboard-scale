import type { ComercialKPIs } from "@/lib/metrics/kpis";

export interface FunnelStage {
  key: "leads" | "agendadas" | "realizadas" | "fechados";
  label: string;
  value: number;
  /** Conversion % from the previous stage (null for the first stage). */
  conversionFromPrevious: number | null;
}

export interface FunnelData {
  stages: FunnelStage[];
  /** Overall conversion: fechados / leads totais, as a percentage. */
  totalConversionPct: number;
}

// Ported from the inline funnel math in renderDash() in the legacy dashboard.
export function buildFunnel(kpis: ComercialKPIs): FunnelData {
  const c2ag = kpis.total ? (kpis.agendadas / kpis.total) * 100 : 0;
  const c2real = kpis.agendadas ? (kpis.realizadas / kpis.agendadas) * 100 : 0;
  const c2fech = kpis.realizadas ? (kpis.fechados / kpis.realizadas) * 100 : 0;
  const totalConversionPct = kpis.total ? (kpis.fechados / kpis.total) * 100 : 0;

  return {
    stages: [
      { key: "leads", label: "Leads Totais", value: kpis.total, conversionFromPrevious: null },
      { key: "agendadas", label: "Reuniões Agendadas", value: kpis.agendadas, conversionFromPrevious: c2ag },
      { key: "realizadas", label: "Reuniões Realizadas", value: kpis.realizadas, conversionFromPrevious: c2real },
      { key: "fechados", label: "Fechamentos", value: kpis.fechados, conversionFromPrevious: c2fech },
    ],
    totalConversionPct,
  };
}
