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
  cac: number;
  valorFechado: number;
  roas: number;
}

// Ported from calcMarketingKPIs() in the legacy dashboard.
export function calcMarketingKPIs(
  ads: Pick<MetaAdsAccountInsight, "spend" | "leads_count">,
  leadsMeta: Lead[],
  agendaMeta: Lead[],
  closingsMeta: Lead[]
): MarketingKPIs {
  const leadsMonday = leadsMeta.length;
  const agendamentos = agendaMeta.length;
  const comparecimentos = agendaMeta.filter((i) => !!i.etapa && ETAPA_REALIZADA.has(i.etapa)).length;
  const fechamentos = closingsMeta.length;
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
    cac: fechamentos ? ads.spend / fechamentos : 0,
    valorFechado,
    roas: ads.spend > 0 ? valorFechado / ads.spend : 0,
  };
}

export interface CreativeRow {
  name: string;
  spend: number;
  leads: number;
  agendamentos: number;
  comparecimentos: number;
  fechamentos: number;
  valorFechado: number;
  cpl: number;
  custoAgendamento: number;
  custoComparecimento: number;
  cac: number;
  roas: number;
}

// Ported from aggregateByCreative() in the legacy dashboard. `adSpendByName`
// comes from meta_ads_creative_insights for the selected month (ad_name -> spend).
export function aggregateByCreative(
  leadsMeta: Lead[],
  agendaMeta: Lead[],
  closingsMeta: Lead[],
  adSpendByName: Map<string, number>
): CreativeRow[] {
  const rows = new Map<string, Omit<CreativeRow, "cpl" | "custoAgendamento" | "custoComparecimento" | "cac" | "roas">>();
  const norm = (s: string | null | undefined) => (s ?? "").trim() || "Sem criativo";
  const keyOf = (s: string | null | undefined) => norm(s).toLowerCase();
  const ensure = (name: string | null | undefined) => {
    const k = keyOf(name);
    if (!rows.has(k)) {
      rows.set(k, { name: norm(name), spend: 0, leads: 0, agendamentos: 0, comparecimentos: 0, fechamentos: 0, valorFechado: 0 });
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

  for (const [adName, spend] of adSpendByName) ensure(adName).spend += spend;

  return [...rows.values()]
    .map((r) => ({
      ...r,
      cpl: r.leads ? r.spend / r.leads : 0,
      custoAgendamento: r.agendamentos ? r.spend / r.agendamentos : 0,
      custoComparecimento: r.comparecimentos ? r.spend / r.comparecimentos : 0,
      cac: r.fechamentos ? r.spend / r.fechamentos : 0,
      roas: r.spend > 0 ? r.valorFechado / r.spend : 0,
    }))
    .sort((a, b) => b.spend - a.spend);
}
