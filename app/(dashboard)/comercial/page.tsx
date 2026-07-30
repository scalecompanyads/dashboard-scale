import { createClient } from "@/lib/supabase/server";
import { getAgendaByRange, getClosingsFiltered, getLeadsByEntryRange, type ClosingFilter } from "@/lib/data/leads";
import { getGoal } from "@/lib/data/goals";
import { getRevenueTrend } from "@/lib/data/trend";
import { calcKPIs } from "@/lib/metrics/kpis";
import { calcClosers } from "@/lib/metrics/closers";
import { calcSDRs } from "@/lib/metrics/sdrs";
import { buildFunnel } from "@/lib/metrics/funnel";
import { FIRST_DATA_MONTH, monthKeyOf, monthKeysBetween, MONTHS } from "@/lib/constants";
import { MonthYearSelect } from "@/components/month-year-select";
import { ClosingFilterTabs } from "@/components/closing-filter-tabs";
import { KpiRow } from "@/components/kpi-row";
import { KpiCard } from "@/components/kpi-card";
import { GoalCard } from "@/components/goal-card";
import { AnimatedNumber } from "@/components/animated-number";
import { TrendBadge } from "@/components/trend-badge";
import { ProgressIndicator } from "@/components/progress-indicator";
import { FunnelChart } from "@/components/funnel-chart";
import { RevenueTrendChart } from "@/components/revenue-trend-chart";
import { ClosedDealsTable } from "@/components/closed-deals-table";
import { ClosersPodium } from "@/components/closers-podium";
import { SdrPodium } from "@/components/sdr-podium";

const TREND_MONTHS = 12;

export default async function ComercialPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;
  const filter = ((Array.isArray(params.filter) ? params.filter[0] : params.filter) ?? "all") as ClosingFilter;
  const dateFrom = Array.isArray(params.dateFrom) ? params.dateFrom[0] : params.dateFrom;
  const dateTo = Array.isArray(params.dateTo) ? params.dateTo[0] : params.dateTo;

  const supabase = await createClient();
  const monthKey = monthKeyOf(year, month);

  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const [leads, agendaItems, closings, goal, prevClosings] = await Promise.all([
    getLeadsByEntryRange(supabase, year, month),
    getAgendaByRange(supabase, year, month),
    getClosingsFiltered(supabase, year, month, filter, { from: dateFrom, to: dateTo }),
    getGoal(supabase, monthKey),
    getClosingsFiltered(supabase, prevYear, prevMonth, "all"),
  ]);

  const kpis = calcKPIs(leads, agendaItems, closings);
  const prevKpis = calcKPIs([], [], prevClosings);
  const closers = calcClosers(agendaItems, closings);
  const sdrs = calcSDRs(agendaItems);
  const funnel = buildFunnel(kpis);

  let trendFromYear = year;
  let trendFromMonth = month - (TREND_MONTHS - 1);
  while (trendFromMonth < 1) {
    trendFromMonth += 12;
    trendFromYear -= 1;
  }
  const trendFromKey = monthKeyOf(trendFromYear, trendFromMonth);
  const trendMonthKeys = monthKeysBetween(trendFromKey > FIRST_DATA_MONTH ? trendFromKey : FIRST_DATA_MONTH, monthKey);
  const trend = await getRevenueTrend(supabase, trendMonthKeys);

  const label = `${MONTHS[month - 1]} ${year}`;
  const metaPct = goal > 0 ? (kpis.tcvTotal / goal) * 100 : 0;
  const metaColor = !goal ? "muted" : metaPct >= 100 ? "good" : metaPct >= 70 ? "warning" : "primary";
  const metaProgressTone = metaColor === "good" || metaColor === "warning" ? metaColor : "accent";

  const gap = goal - kpis.tcvTotal;
  const gapAtingida = goal > 0 && gap <= 0;
  const gapColor = !goal ? "muted" : gapAtingida ? "good" : kpis.tcvTotal / goal >= 0.7 ? "warning" : "critical";
  const gapDisplayValue = goal ? Math.abs(gap) : null;
  const gapSubTxt = !goal ? "sem meta definida" : gapAtingida ? "✓ meta superada" : "faltam para bater a meta";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ClosingFilterTabs filter={filter} dateFrom={dateFrom} dateTo={dateTo} />
        <MonthYearSelect year={year} month={month} />
      </div>

      <KpiRow cols={7}>
        <KpiCard
          featured
          label={`TCV Fechado — ${label}`}
          value={<AnimatedNumber value={kpis.tcvTotal} format={{ type: "currency" }} />}
          sub={`${kpis.tcvCount} contratos fechados`}
        >
          {prevKpis.tcvTotal > 0 && (
            <div className="flex justify-center">
              <TrendBadge current={kpis.tcvTotal} previous={prevKpis.tcvTotal} />
            </div>
          )}
        </KpiCard>
        <KpiCard
          label={`MRR Fechado — ${label}`}
          accent="primary"
          value={<AnimatedNumber value={kpis.mrrTotal} format={{ type: "currency" }} />}
          sub={`${kpis.mrrCount} contratos fechados`}
        >
          {prevKpis.mrrTotal > 0 && (
            <div className="flex justify-center">
              <TrendBadge current={kpis.mrrTotal} previous={prevKpis.mrrTotal} />
            </div>
          )}
        </KpiCard>
        <GoalCard monthKey={monthKey} goalValue={goal} />
        <KpiCard
          featured
          label="Gap para Meta do Mês"
          accent={gapColor}
          value={<AnimatedNumber value={gapDisplayValue} format={{ type: "currency", sign: gapAtingida }} />}
          sub={gapSubTxt}
        >
          {gapColor === "critical" && (
            <span className="relative mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-status-critical/12 px-2 py-0.5 text-[10.5px] font-bold text-status-critical">
              ⚠ atenção
            </span>
          )}
        </KpiCard>
        <KpiCard
          featured
          label="% da Meta Realizada"
          accent={metaColor}
          value={<AnimatedNumber value={goal ? metaPct : null} format={{ type: "percent" }} />}
          sub={metaPct >= 100 ? "✓ Meta batida!" : goal ? "em andamento" : "sem meta definida"}
        >
          {goal > 0 && (
            <div className="relative mt-3">
              <ProgressIndicator pct={metaPct} tone={metaProgressTone} />
            </div>
          )}
        </KpiCard>
        <KpiCard
          label="Ticket Médio TCV"
          value={<AnimatedNumber value={kpis.ticketMedioTCV} format={{ type: "currency" }} />}
          sub="por contrato TCV"
        />
        <KpiCard
          label="Ticket Médio MRR"
          value={<AnimatedNumber value={kpis.ticketMedioMRR} format={{ type: "currency" }} />}
          sub="por contrato MRR"
        />
      </KpiRow>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelChart data={funnel} />
        <ClosersPodium closers={closers} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:h-[440px] lg:grid-cols-2">
        <SdrPodium sdrs={sdrs} />
        <ClosedDealsTable closings={closings} />
      </div>

      <div className="h-72">
        <RevenueTrendChart points={trend} />
      </div>
    </div>
  );
}
