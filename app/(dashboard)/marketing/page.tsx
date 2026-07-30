import { createClient } from "@/lib/supabase/server";
import { getAgendaByRange, getClosingsFiltered, getLeadsByEntryRange } from "@/lib/data/leads";
import { getMetaAdsAccountInsight, getMetaAdsCreativeSpend } from "@/lib/data/meta-ads";
import { calcMarketingKPIs, aggregateByCreative } from "@/lib/metrics/marketing";
import { monthKeyOf, ORIGEM_META_ADS, MONTHS } from "@/lib/constants";
import { MonthYearSelect } from "@/components/month-year-select";
import { KpiRow } from "@/components/kpi-row";
import { KpiCard } from "@/components/kpi-card";
import { AnimatedNumber } from "@/components/animated-number";
import { TrendBadge } from "@/components/trend-badge";
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

  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const [leads, agendaItems, closings, adAccount, adCreativeSpend, prevClosings] = await Promise.all([
    getLeadsByEntryRange(supabase, year, month),
    getAgendaByRange(supabase, year, month),
    getClosingsFiltered(supabase, year, month, "all"),
    getMetaAdsAccountInsight(supabase, monthKey),
    getMetaAdsCreativeSpend(supabase, monthKey),
    getClosingsFiltered(supabase, prevYear, prevMonth, "all"),
  ]);

  const leadsMeta = leads.filter(isMetaAds);
  const agendaMeta = agendaItems.filter(isMetaAds);
  const closingsMeta = closings.filter(isMetaAds);
  const prevClosingsMeta = prevClosings.filter(isMetaAds);
  const prevValorFechado = prevClosingsMeta.reduce((sum, i) => sum + (i.mrr_value ?? 0), 0);

  const k = calcMarketingKPIs(adAccount, leadsMeta, agendaMeta, closingsMeta);
  const creatives = aggregateByCreative(leadsMeta, agendaMeta, closingsMeta, adCreativeSpend);

  const label = `${MONTHS[month - 1]} ${year}`;
  const roasColor = k.roas >= 3 ? "good" : k.roas >= 1 ? "warning" : "critical";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <MonthYearSelect year={year} month={month} />
      </div>

      <KpiRow cols={5}>
        <KpiCard
          featured
          label="Faturamento"
          accent="good"
          value={<AnimatedNumber value={k.valorFechado} format={{ type: "currency" }} />}
          sub="fechado (MRR+TCV) origem Meta Ads"
        >
          {prevValorFechado > 0 && (
            <div className="flex justify-center">
              <TrendBadge current={k.valorFechado} previous={prevValorFechado} />
            </div>
          )}
        </KpiCard>
        <KpiCard label={`Investimento — ${label}`} value={<AnimatedNumber value={k.spend} format={{ type: "currency" }} />} sub="gasto em Meta Ads" />
        <KpiCard label="Leads" value={<AnimatedNumber value={k.leadsMeta} format={{ type: "integer" }} />} sub="reportados pelo Meta Ads" />
        <KpiCard label="Leads no Monday" value={<AnimatedNumber value={k.leadsMonday} format={{ type: "integer" }} />} sub="origem Meta Ads" />
        <KpiCard label="CPL" value={<AnimatedNumber value={k.cpl || null} format={{ type: "currency" }} />} sub="investimento / leads no Monday" />
      </KpiRow>

      <KpiRow cols={4}>
        <KpiCard
          featured
          label="ROAS"
          accent={roasColor}
          value={<AnimatedNumber value={k.roas || null} format={{ type: "multiplier" }} />}
          sub="fechado (MRR+TCV) / investimento"
        />
        <KpiCard
          label="Custo / Agendamento"
          value={<AnimatedNumber value={k.custoAgendamento || null} format={{ type: "currency" }} />}
          sub={`${k.agendamentos} reuniões agendadas`}
        />
        <KpiCard
          label="Custo / Comparecimento"
          value={<AnimatedNumber value={k.custoComparecimento || null} format={{ type: "currency" }} />}
          sub={`${k.comparecimentos} reuniões realizadas`}
        />
        <KpiCard label="CAC" value={<AnimatedNumber value={k.cac || null} format={{ type: "currency" }} />} sub={`${k.fechamentos} fechamentos`} />
      </KpiRow>

      <div className="min-h-[420px] flex-1">
        <CreativeTable creatives={creatives} />
      </div>
    </div>
  );
}
