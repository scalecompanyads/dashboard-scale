import { ETAPA_REALIZADA } from "@/lib/constants";
import type { Lead, MetaAdsAccountInsight } from "@/lib/types/database.types";

export interface MarketingKPIs {
  spend: number;
  leadsMeta: number;
  leadsMonday: number;
  cpl: number;
  agendamentos: number;
  custoAgendamento: number;
  comparecimentos: number;
  custoComparecimento: number;
  fechamentos: number;
  cacFechamentos: number;
  cac: number;
  valorFechado: number;
  roas: number;
}

// Ported from calcMarketingKPIs() in the legacy dashboard.
//
// cacFechamentos is a SEPARATE, narrower count from `closingsMeta`/
// `fechamentos`: only closings whose lead also entered in this same month
// (the "mesmo_mes" cohort — see getClosingsFiltered). A closing from a lead
// that entered last month already had its acquisition cost attributed to
// last month's spend; mixing it into this month's CAC understates the real
// cost per acquisition for the cohort THIS month's spend actually produced.
// Faturamento/ROAS/fechamentos elsewhere keep using the full closingsMeta —
// only CAC needs the same-month-only view.
export function calcMarketingKPIs(
  ads: Pick<MetaAdsAccountInsight, "spend" | "leads_count">,
  leadsMeta: Lead[],
  agendaMeta: Lead[],
  closingsMeta: Lead[],
  cacClosingsMeta: Lead[]
): MarketingKPIs {
  const leadsMonday = leadsMeta.length;
  const agendamentos = agendaMeta.length;
  const comparecimentos = agendaMeta.filter((i) => !!i.etapa && ETAPA_REALIZADA.has(i.etapa)).length;
  const fechamentos = closingsMeta.length;
  const cacFechamentos = cacClosingsMeta.length;
  const valorFechado = closingsMeta.reduce((sum, i) => sum + (i.mrr_value ?? 0), 0);

  return {
    spend: ads.spend,
    leadsMeta: ads.leads_count,
    leadsMonday,
    cpl: leadsMonday ? ads.spend / leadsMonday : 0,
    agendamentos,
    custoAgendamento: agendamentos ? ads.spend / agendamentos : 0,
    comparecimentos,
    custoComparecimento: comparecimentos ? ads.spend / comparecimentos : 0,
    fechamentos,
    cacFechamentos,
    cac: cacFechamentos ? ads.spend / cacFechamentos : 0,
    valorFechado,
    roas: ads.spend > 0 ? valorFechado / ads.spend : 0,
  };
}

export interface CreativeRow {
  name: string;
  /** Meta ad_id, when this creative matched a row in meta_ads_creative_insights — used to look up its thumbnail. */
  adId: string | null;
  spend: number;
  leads: number;
  agendamentos: number;
  comparecimentos: number;
  fechamentos: number;
  valorFechado: number;
  cpl: number;
  custoAgendamento: number;
  taxaAgendamento: number;
  custoComparecimento: number;
  taxaComparecimento: number;
  cac: number;
  roas: number;
}

// Ported from aggregateByCreative() in the legacy dashboard. `adSpendByName`
// comes from meta_ads_creative_insights for the selected month (ad_name -> spend + ad_id).
export function aggregateByCreative(
  leadsMeta: Lead[],
  agendaMeta: Lead[],
  closingsMeta: Lead[],
  adSpendByName: Map<string, { spend: number; adId: string }>
): CreativeRow[] {
  const rows = new Map<
    string,
    Omit<CreativeRow, "cpl" | "custoAgendamento" | "taxaAgendamento" | "custoComparecimento" | "taxaComparecimento" | "cac" | "roas">
  >();
  const norm = (s: string | null | undefined) => (s ?? "").trim() || "Sem criativo";
  const keyOf = (s: string | null | undefined) => norm(s).toLowerCase();
  const ensure = (name: string | null | undefined) => {
    const k = keyOf(name);
    if (!rows.has(k)) {
      rows.set(k, { name: norm(name), adId: null, spend: 0, leads: 0, agendamentos: 0, comparecimentos: 0, fechamentos: 0, valorFechado: 0 });
    }
    return rows.get(k)!;
  };

  for (const item of leadsMeta) ensure(item.criativo).leads++;

  for (const item of agendaMeta) {
    const r = ensure(item.criativo);
    r.agendamentos++;
    if (item.etapa && ETAPA_REALIZADA.has(item.etapa)) r.comparecimentos++;
  }

  for (const item of closingsMeta) {
    const r = ensure(item.criativo);
    r.fechamentos++;
    r.valorFechado += item.mrr_value ?? 0;
  }

  for (const [adName, info] of adSpendByName) {
    const r = ensure(adName);
    r.spend += info.spend;
    r.adId = info.adId;
  }

  return [...rows.values()]
    .map((r) => ({
      ...r,
      cpl: r.leads ? r.spend / r.leads : 0,
      custoAgendamento: r.agendamentos ? r.spend / r.agendamentos : 0,
      taxaAgendamento: r.leads ? (r.agendamentos / r.leads) * 100 : 0,
      custoComparecimento: r.comparecimentos ? r.spend / r.comparecimentos : 0,
      taxaComparecimento: r.agendamentos ? (r.comparecimentos / r.agendamentos) * 100 : 0,
      cac: r.fechamentos ? r.spend / r.fechamentos : 0,
      roas: r.spend > 0 ? r.valorFechado / r.spend : 0,
    }))
    .sort((a, b) => b.spend - a.spend);
}
