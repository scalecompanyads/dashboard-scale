import { ETAPA_REALIZADA } from "@/lib/constants";
import type { Lead } from "@/lib/types/database.types";

export interface ComercialKPIs {
  mrr: number;
  closingCount: number;
  tcvTotal: number;
  tcvCount: number;
  mrrTotal: number;
  mrrCount: number;
  ticketMedioTCV: number;
  ticketMedioMRR: number;
  ticketMedio: number;
  total: number;
  agendadas: number;
  realizadas: number;
  fechados: number;
}

// Ported from calcKPIs() in the legacy dashboard — same shape, same rules,
// just reading Supabase rows (leads/agenda/closings) instead of raw Monday
// API items.
export function calcKPIs(leads: Lead[], agendaItems: Lead[], closings: Lead[]): ComercialKPIs {
  let mrr = 0;
  let closingCount = 0;
  let tcvTotal = 0;
  let tcvCount = 0;
  let mrrTotal = 0;
  let mrrCount = 0;

  for (const item of closings) {
    const v = item.mrr_value ?? 0;
    if (v > 0) {
      mrr += v;
      closingCount++;
      if (item.modelo === "TCV") {
        tcvTotal += v;
        tcvCount++;
      } else if (item.modelo === "MRR") {
        mrrTotal += v;
        mrrCount++;
      }
      // sem "Modelo" definido: não entra em nenhum dos dois totais
    }
  }

  const total = leads.length;
  const agendadas = agendaItems.length;
  const realizadas = agendaItems.filter((i) => !!i.etapa && ETAPA_REALIZADA.has(i.etapa)).length;
  const fechados = closings.length;

  return {
    mrr,
    closingCount,
    tcvTotal,
    tcvCount,
    mrrTotal,
    mrrCount,
    ticketMedioTCV: tcvCount ? tcvTotal / tcvCount : 0,
    ticketMedioMRR: mrrCount ? mrrTotal / mrrCount : 0,
    ticketMedio: closingCount ? mrr / closingCount : 0,
    total,
    agendadas,
    realizadas,
    fechados,
  };
}
