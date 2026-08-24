import { createClient } from "@/lib/supabase/server";
import { getAgendaByRange, getClosingsFiltered, getLeadsByEntryRange, filterByEntryCohort, type ClosingFilter } from "@/lib/data/leads";
import { getGoal } from "@/lib/data/goals";
import { calcKPIs } from "@/lib/metrics/kpis";
import { calcClosers } from "@/lib/metrics/closers";
import { calcSDRs } from "@/lib/metrics/sdrs";
import { buildFunnel } from "@/lib/metrics/funnel";
import { monthKeyOf } from "@/lib/constants";
import { MonthYearSelect } from "@/components/month-year-select";
import { ClosingFilterTabs } from "@/components/closing-filter-tabs";
import { KpiRow } from "@/components/kpi-row";
import { KpiCard } from "@/components/kpi-card";
import { GoalCard } from "@/components/goal-card";
import { AnimatedNumber } from "@/components/animated-number";
import { TrendBadge } from "@/components/trend-badge";
import { ProgressIndicator } from "@/components/progress-indicator";
import { FunnelChart } from "@/components/funnel-chart";
import { ClosedDealsTable } from "@/components/closed-deals-table";
import { ClosersPodium } from "@/components/closers-podium";
import { SdrPodium } from "@/components/sdr-podium";

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

  const [leadsRaw, agendaRaw, closings, goal, prevClosings] = await Promise.all([
    getLeadsByEntryRange(supabase, year, month),
    getAgendaByRange(supabase, year, month),
    getClosingsFiltered(supabase, year, month, filter, { from: dateFrom, to: dateTo }),
    getGoal(supabase, monthKey),
    getClosingsFiltered(supabase, prevYear, prevMonth, "all"),
  ]);

  // Same cohort filter as closings ("Todos" / "Leads do mês" / "Outros
  // meses") applied to leads/agenda too, so the funnel and podiums move
  // together with the tab instead of only the closings-derived numbers.
  const leads = filterByEntryCohort(leadsRaw, year, month, filter, { from: dateFrom, to: dateTo });
  const agendaItems = filterByEntryCohort(agendaRaw, year, month, filter, { from: dateFrom, to: dateTo });

  const kpis = calcKPIs(leads, agendaItems, closings);
  const prevKpis = calcKPIs([], [], prevClosings);
  const closers = calcClosers(agendaItems, closings);
  const sdrs = calcSDRs(agendaItems, closings);
  const funnel = buildFunnel(kpis);

  const metaPct = goal > 0 ? (kpis.tcvTotal / goal) * 100 : 0;
  // Só o verde (meta batida) e o vermelho (bem atrás) carregam sentido de
  // status aqui — o intervalo do meio fica no azul neutro da marca em vez
  // de um amarelo de "alerta" que não condiz com estar quase lá.
  const metaColor = !goal ? "muted" : metaPct >= 100 ? "good" : "primary";
  const metaProgressTone = metaColor === "good" ? "good" : "accent";

  const gap = goal - kpis.tcvTotal;
  const gapAtingida = goal > 0 && gap <= 0;
  const gapColor = !goal ? "muted" : gapAtingida ? "good" : kpis.tcvTotal / goal >= 0.7 ? "primary" : "critical";
  const gapDisplayValue = goal ? Math.abs(gap) : null;
  const gapSubTxt = !goal ? "sem meta definida" : gapAtingida ? "✓ meta superada" : `${Math.max(0, Math.round(100 - metaPct))}% restante`;

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-enter flex flex-wrap items-center justify-between gap-3 rounded-none border border-hairline bg-white/[0.02] px-4 py-2.5">
        <ClosingFilterTabs filter={filter} dateFrom={dateFrom} dateTo={dateTo} />
        <MonthYearSelect year={year} month={month} />
      </div>

      <KpiRow cols={7} staggerBase={60}>
        <KpiCard
          featured
          surface="blue"
          label="TCV Fechado"
          value={<AnimatedNumber value={kpis.tcvTotal} format={{ type: "currency" }} />}
          sub={`${kpis.tcvCount} contratos TCV`}
        >
          {prevKpis.tcvTotal > 0 && (
            <div className="flex justify-start">
              <TrendBadge current={kpis.tcvTotal} previous={prevKpis.tcvTotal} surface="blue" />
            </div>
          )}
        </KpiCard>
        <KpiCard
          label="MRR Fechado"
          accent="primary"
          value={<AnimatedNumber value={kpis.mrrTotal} format={{ type: "currency" }} />}
          sub={`${kpis.mrrCount} contratos MRR`}
        >
          {prevKpis.mrrTotal > 0 && (
            <div className="flex justify-start">
              <TrendBadge current={kpis.mrrTotal} previous={prevKpis.mrrTotal} />
            </div>
          )}
        </KpiCard>
        <GoalCard monthKey={monthKey} goalValue={goal} progressPct={goal > 0 ? metaPct : undefined} />
        <KpiCard
          featured
          label="Gap para Meta"
          accent={gapColor}
          value={<AnimatedNumber value={gapDisplayValue} format={{ type: "currency", sign: gapAtingida }} />}
          sub={gapSubTxt}
        >
          {gapColor === "critical" && (
            <span className="relative mt-2 inline-flex w-fit items-center gap-1 rounded-none bg-status-critical/12 px-2 py-0.5 text-[10.5px] font-bold text-status-critical">
              ⚠ atenção
            </span>
          )}
        </KpiCard>
        <KpiCard
          featured
          label="% da Meta Realizada"
          accent={metaColor}
          value={<AnimatedNumber value={goal ? metaPct : null} format={{ type: "percent" }} />}
          sub={metaPct >= 100 ? "✓ Meta batida!" : !goal ? "sem meta definida" : undefined}
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
          sub={`${kpis.tcvCount} contratos`}
        >
          {prevKpis.ticketMedioTCV > 0 && (
            <div className="flex justify-start">
              <TrendBadge current={kpis.ticketMedioTCV} previous={prevKpis.ticketMedioTCV} />
            </div>
          )}
        </KpiCard>
        <KpiCard
          label="Ticket Médio MRR"
          value={<AnimatedNumber value={kpis.ticketMedioMRR} format={{ type: "currency" }} />}
          sub={`${kpis.mrrCount} contratos`}
        >
          {prevKpis.ticketMedioMRR > 0 && (
            <div className="flex justify-start">
              <TrendBadge current={kpis.ticketMedioMRR} previous={prevKpis.ticketMedioMRR} />
            </div>
          )}
        </KpiCard>
      </KpiRow>

      <div className="animate-enter grid grid-cols-1 gap-4 lg:h-[440px] lg:grid-cols-[34fr_32fr_34fr]" style={{ animationDelay: "440ms" }}>
        <FunnelChart data={funnel} />
        <SdrPodium sdrs={sdrs} />
        <ClosersPodium closers={closers} />
      </div>

      <div className="animate-enter min-h-[320px] flex-1" style={{ animationDelay: "520ms" }}>
        <ClosedDealsTable closings={closings} />
      </div>
    </div>
  );
}
