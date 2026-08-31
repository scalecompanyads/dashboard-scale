import { createClient } from "@/lib/supabase/server";
import { getAgendaByDateRange, getClosingsByDateRange, getLeadsByEntryDateRange } from "@/lib/data/leads";
import { getMetaAdsRangeInsights, getCreativeThumbnails } from "@/lib/data/meta-ads";
import { calcMarketingKPIs, aggregateByCreative, aggregateByCampaign } from "@/lib/metrics/marketing";
import {
  META_CPL,
  META_TAXA_CONVERSAO,
  monthRangeOf,
  ORIGEM_META_ADS,
  previousRange,
  rangeLabel,
  statusHigherIsBetter,
  statusLowerIsBetter,
  todayInSaoPaulo,
  type DateRange,
} from "@/lib/constants";
import { DateRangeSelect } from "@/components/date-range-select";
import { KpiRow } from "@/components/kpi-row";
import { KpiCard } from "@/components/kpi-card";
import { AnimatedNumber } from "@/components/animated-number";
import { TrendBadge } from "@/components/trend-badge";
import { CampaignTable } from "@/components/campaign-table";
import { CreativeTable } from "@/components/creative-table";
import {
  IconCalendarCheck,
  IconCheckCircle,
  IconCurrency,
  IconGauge,
  IconHandshake,
  IconReceipt,
  IconTarget,
  IconUsers,
} from "@/components/kpi-icons";
import type { Lead } from "@/lib/types/database.types";

const isMetaAds = (item: Lead) => item.origem === ORIGEM_META_ADS;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Período selecionado, a partir da URL.
 *
 * 'from'/'to' é o filtro atual (intervalo livre). 'year'/'month' é o filtro
 * antigo e continua sendo aceito para não quebrar link salvo — só que agora
 * como um intervalo qualquer, o do mês inteiro.
 */
function resolveRange(params: Record<string, string | string[] | undefined>, today: string): DateRange {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const from = one(params.from);
  const to = one(params.to);
  if (from && to && ISO_DATE.test(from) && ISO_DATE.test(to)) {
    return from <= to ? { from, to } : { from: to, to: from };
  }
  const year = Number(one(params.year)) || Number(today.slice(0, 4));
  const month = Number(one(params.month)) || Number(today.slice(5, 7));
  return monthRangeOf(year, month);
}

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // Hoje no fuso de BRASÍLIA, e não o do servidor — a base dos atalhos do
  // filtro. Na Vercel o servidor roda em UTC, 3h à frente, então das 21h à
  // meia-noite "Hoje" apontaria para amanhã.
  const today = todayInSaoPaulo();
  const range = resolveRange(params, today);
  const prev = previousRange(range);

  const supabase = await createClient();

  const [leads, agendaItems, closings, cacClosings, adInsights, prevClosings] = await Promise.all([
    getLeadsByEntryDateRange(supabase, range),
    getAgendaByDateRange(supabase, range),
    getClosingsByDateRange(supabase, range),
    // CAC only counts closings whose lead ALSO entered in this same window —
    // mixing in conversions from other cohorts understates the cost of the
    // one this period's spend actually produced. See calcMarketingKPIs.
    getClosingsByDateRange(supabase, range, { sameCohort: true }),
    getMetaAdsRangeInsights(supabase, range),
    getClosingsByDateRange(supabase, prev),
  ]);

  const leadsMeta = leads.filter(isMetaAds);
  const agendaMeta = agendaItems.filter(isMetaAds);
  const closingsMeta = closings.filter(isMetaAds);
  const cacClosingsMeta = cacClosings.filter(isMetaAds);
  const prevClosingsMeta = prevClosings.filter(isMetaAds);
  const prevValorFechado = prevClosingsMeta.reduce((sum, i) => sum + (i.mrr_value ?? 0), 0);

  const k = calcMarketingKPIs(adInsights.account, leadsMeta, agendaMeta, closingsMeta, cacClosingsMeta);
  const campaigns = aggregateByCampaign(leadsMeta, agendaMeta, closingsMeta, adInsights.creatives);
  const creatives = aggregateByCreative(leadsMeta, agendaMeta, closingsMeta, adInsights.creatives);
  // Fetched after the creatives are known — needs their ad_ids first, so it
  // can't join the initial Promise.all above.
  const thumbnails = await getCreativeThumbnails(creatives.map((c) => c.adId).filter((id): id is string => !!id));

  const label = rangeLabel(range);
  const roasColor = k.roas >= 3 ? "good" : k.roas >= 1 ? "warning" : "critical";
  const cplColor = statusLowerIsBetter(k.cpl, META_CPL);
  const conversaoColor = statusHigherIsBetter(k.taxaConversao, META_TAXA_CONVERSAO);

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-enter flex flex-wrap items-center justify-end gap-3">
        <DateRangeSelect range={range} today={today} />
      </div>

      <KpiRow cols={5} staggerBase={60}>
        <KpiCard
          featured
          icon={<IconCurrency />}
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
        <KpiCard
          icon={<IconReceipt />}
          label={`Investimento — ${label}`}
          value={<AnimatedNumber value={k.spend} format={{ type: "currency" }} />}
          sub="gasto em Meta Ads"
        />
        <KpiCard
          icon={<IconUsers />}
          label="Leads"
          value={<AnimatedNumber value={k.leadsMeta} format={{ type: "integer" }} />}
          sub="reportados pelo Meta Ads"
        />
        <KpiCard
          icon={<IconUsers />}
          label="Leads no Monday"
          value={<AnimatedNumber value={k.leadsMonday} format={{ type: "integer" }} />}
          sub="origem Meta Ads"
        />
        <KpiCard
          icon={<IconTarget />}
          label="CPL"
          accent={cplColor === "neutral" ? "primary" : cplColor}
          valueColor={cplColor === "neutral" ? "primary" : cplColor}
          value={<AnimatedNumber value={k.cpl || null} format={{ type: "currency" }} />}
          sub={`meta: até R$ ${META_CPL}`}
        />
      </KpiRow>

      <KpiRow cols={5} staggerBase={310}>
        <KpiCard
          featured
          icon={<IconGauge />}
          label="ROAS"
          accent={roasColor}
          value={<AnimatedNumber value={k.roas || null} format={{ type: "multiplier" }} />}
          sub="fechado (MRR+TCV) / investimento"
        />
        <KpiCard
          featured
          icon={<IconCheckCircle />}
          label="Taxa de Conversão"
          accent={conversaoColor === "neutral" ? "primary" : conversaoColor}
          value={<AnimatedNumber value={k.taxaConversao || null} format={{ type: "percent" }} />}
          sub={`comparecimentos / leads — meta: ${META_TAXA_CONVERSAO}%`}
        />
        <KpiCard
          icon={<IconCalendarCheck />}
          label="Custo / Agendamento"
          value={<AnimatedNumber value={k.custoAgendamento || null} format={{ type: "currency" }} />}
          sub={`${k.agendamentos} reuniões agendadas`}
        />
        <KpiCard
          icon={<IconCheckCircle />}
          label="Custo / Comparecimento"
          value={<AnimatedNumber value={k.custoComparecimento || null} format={{ type: "currency" }} />}
          sub={`${k.comparecimentos} reuniões realizadas`}
        />
        <KpiCard
          icon={<IconHandshake />}
          label="CAC"
          value={<AnimatedNumber value={k.cac || null} format={{ type: "currency" }} />}
          sub={`${k.cacFechamentos} fechamentos (mesma janela)`}
        />
      </KpiRow>

      {/* Campanha primeiro: é o nível em que a verba é realocada. O criativo
          logo abaixo explica QUAL peça dentro da campanha puxou o resultado. */}
      <div className="animate-enter min-h-[320px]" style={{ animationDelay: "560ms" }}>
        <CampaignTable campaigns={campaigns} />
      </div>

      <div className="animate-enter min-h-[420px] flex-1" style={{ animationDelay: "640ms" }}>
        <CreativeTable creatives={creatives} thumbnails={thumbnails} />
      </div>
    </div>
  );
}
