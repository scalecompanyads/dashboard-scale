import { createClient } from "@/lib/supabase/server";
import { getAgendaByRange, getClosingsFiltered, getLeadsByEntryRange } from "@/lib/data/leads";
import { getMetaAdsAccountInsight, getMetaAdsCreativeSpend } from "@/lib/data/meta-ads";
import { calcMarketingKPIs, aggregateByCreative } from "@/lib/metrics/marketing";
import { fmtBRL, monthKeyOf, ORIGEM_META_ADS, MONTHS } from "@/lib/constants";
import { MonthYearSelect } from "@/components/month-year-select";
import { KpiRow } from "@/components/kpi-row";
import { KpiCard } from "@/components/kpi-card";
import { CreativeTable } from "@/components/creative-table";
import type { Lead } from "@/lib/types/database.types";

const isMetaAds = (item: Lead) => item.origem === ORIGEM_META_ADS;

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  const supabase = await createClient();
  const monthKey = monthKeyOf(year, month);

  const [leads, agendaItems, closings, adAccount, adCreativeSpend] = await Promise.all([
    getLeadsByEntryRange(supabase, year, month),
    getAgendaByRange(supabase, year, month),
    getClosingsFiltered(supabase, year, month, "all"),
    getMetaAdsAccountInsight(supabase, monthKey),
    getMetaAdsCreativeSpend(supabase, monthKey),
  ]);

  const leadsMeta = leads.filter(isMetaAds);
  const agendaMeta = agendaItems.filter(isMetaAds);
  const closingsMeta = closings.filter(isMetaAds);

  const k = calcMarketingKPIs(adAccount, leadsMeta, agendaMeta, closingsMeta);
  const creatives = aggregateByCreative(leadsMeta, agendaMeta, closingsMeta, adCreativeSpend);

  const label = `${MONTHS[month - 1]} ${year}`;
  const roasColor = k.roas >= 3 ? "good" : k.roas >= 1 ? "warning" : "critical";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-card border border-hairline bg-surface-1 px-4 py-3">
        <MonthYearSelect year={year} month={month} />
      </div>

      <KpiRow cols={5}>
        <KpiCard featured label="Faturamento" accent="good" value={fmtBRL(k.valorFechado)} sub="fechado (MRR+TCV) origem Meta Ads" />
        <KpiCard label={`Investimento — ${label}`} value={fmtBRL(k.spend)} sub="gasto em Meta Ads" />
        <KpiCard label="Leads" value={Math.round(k.leadsMeta)} sub="reportados pelo Meta Ads" />
        <KpiCard label="Leads no Monday" value={k.leadsMonday} sub="origem Meta Ads" />
        <KpiCard label="CPL" value={k.cpl ? fmtBRL(k.cpl) : "—"} sub="investimento / leads no Monday" />
      </KpiRow>

      <KpiRow cols={4}>
        <KpiCard featured label="ROAS" accent={roasColor} value={k.roas ? `${k.roas.toFixed(2)}x` : "—"} sub="fechado (MRR+TCV) / investimento" />
        <KpiCard
          label="Custo / Agendamento"
          value={k.custoAgendamento ? fmtBRL(k.custoAgendamento) : "—"}
          sub={`${k.agendamentos} reuniões agendadas`}
        />
        <KpiCard
          label="Custo / Comparecimento"
          value={k.custoComparecimento ? fmtBRL(k.custoComparecimento) : "—"}
          sub={`${k.comparecimentos} reuniões realizadas`}
        />
        <KpiCard label="CAC" value={k.cac ? fmtBRL(k.cac) : "—"} sub={`${k.fechamentos} fechamentos`} />
      </KpiRow>

      <div className="min-h-[420px] flex-1">
        <CreativeTable creatives={creatives} />
      </div>
    </div>
  );
}
