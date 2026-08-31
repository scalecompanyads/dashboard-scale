import { createClient } from "@/lib/supabase/server";
import {
  getAgendaByDateRange,
  getClosingsByDateRange,
  getLeadsByEntryDateRange,
  filterByEntryCohort,
  onlyOrganico,
  type ClosingFilter,
} from "@/lib/data/leads";
import { getMonthlyGoals, getPeriodGoals } from "@/lib/data/goals";
import { calcKPIs } from "@/lib/metrics/kpis";
import { calcClosers } from "@/lib/metrics/closers";
import { calcSDRs } from "@/lib/metrics/sdrs";
import { buildFunnel } from "@/lib/metrics/funnel";
import { deriveGoal, goalProgress, paceOf, rateProgress } from "@/lib/metrics/goal-pacing";
import { fmtBRL, fmtBRLCompact, META_PADRAO, todayInSaoPaulo } from "@/lib/constants";
import { resolveComercialPeriod } from "@/lib/comercial-period";
import { MonthYearSelect } from "@/components/month-year-select";
import { PeriodViewTabs } from "@/components/period-view-tabs";
import { ClosingFilterTabs } from "@/components/closing-filter-tabs";
import { KpiRow } from "@/components/kpi-row";
import { KpiCard } from "@/components/kpi-card";
import { GoalSummaryCard } from "@/components/goal-summary-card";
import { RateGoalCard } from "@/components/rate-goal-card";
import { AnimatedNumber } from "@/components/animated-number";
import { TrendBadge } from "@/components/trend-badge";
import { ProgressIndicator } from "@/components/progress-indicator";
import { FunnelChart } from "@/components/funnel-chart";
import { ClosedDealsTable } from "@/components/closed-deals-table";
import { ClosersPodium } from "@/components/closers-podium";
import { SdrPodium } from "@/components/sdr-podium";
import { OrganicSummary } from "@/components/organic-summary";

export default async function ComercialPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const today = todayInSaoPaulo();
  const period = resolveComercialPeriod(params, today);
  const filter = ((Array.isArray(params.filter) ? params.filter[0] : params.filter) ?? "all") as ClosingFilter;
  const dateFrom = Array.isArray(params.dateFrom) ? params.dateFrom[0] : params.dateFrom;
  const dateTo = Array.isArray(params.dateTo) ? params.dateTo[0] : params.dateTo;
  const cohort = { from: dateFrom, to: dateTo };

  const supabase = await createClient();

  // As duas últimas só existem fora do modo Mensal — nele a página continua
  // fazendo exatamente as cinco consultas de sempre.
  // No Diário a meta é a da SEMANA do dia (não existe meta de dia), então os
  // cards de meta precisam dos números da semana além dos do dia. Nos outros
  // dois modos as duas janelas coincidem e essas consultas não acontecem.
  const goalWindowDiffers = period.goalRange.from !== period.range.from || period.goalRange.to !== period.range.to;

  const [
    leadsRaw,
    agendaRaw,
    closingsRaw,
    goals,
    overrides,
    prevClosings,
    monthClosings,
    goalLeadsRaw,
    goalAgendaRaw,
    goalClosingsRaw,
  ] = await Promise.all([
    getLeadsByEntryDateRange(supabase, period.range),
    getAgendaByDateRange(supabase, period.range),
    getClosingsByDateRange(supabase, period.range),
    getMonthlyGoals(supabase, period.monthKey),
    period.goalPeriodKey ? getPeriodGoals(supabase, "week", period.goalPeriodKey) : Promise.resolve({ tcv: null }),
    getClosingsByDateRange(supabase, period.previous),
    period.view === "mes" ? Promise.resolve(null) : getClosingsByDateRange(supabase, period.monthRange),
    goalWindowDiffers ? getLeadsByEntryDateRange(supabase, period.goalRange) : Promise.resolve(null),
    goalWindowDiffers ? getAgendaByDateRange(supabase, period.goalRange) : Promise.resolve(null),
    goalWindowDiffers ? getClosingsByDateRange(supabase, period.goalRange) : Promise.resolve(null),
  ]);

  // Same cohort filter as closings ("Todos" / "Leads do mês" / "Outros
  // meses") applied to leads/agenda too, so the funnel and podiums move
  // together with the tab instead of only the closings-derived numbers.
  // A coorte é sempre do MÊS dono da janela, mesmo quando a janela é uma
  // semana ou um dia — ver filterByEntryCohort.
  const leads = filterByEntryCohort(leadsRaw, period.year, period.month, filter, cohort);
  const agendaItems = filterByEntryCohort(agendaRaw, period.year, period.month, filter, cohort);
  const closings = filterByEntryCohort(closingsRaw, period.year, period.month, filter, cohort);

  // Tudo junto: os únicos leads que a página não considera são os que já
  // saíram na consulta (Direção "Filter" e origem "Site — Live"). Orgânico
  // conta como qualquer outro — no total, no agendamento, na reunião
  // realizada, no fechamento e nos dois pódios. Ele chegou pelo site em vez
  // de por anúncio, mas o SDR marcou a reunião igual e o closer fechou
  // igual; tirá-lo dos totais apagaria trabalho que aconteceu.
  const kpis = calcKPIs(leads, agendaItems, closings);
  const prevKpis = calcKPIs([], [], prevClosings);
  const closers = calcClosers(agendaItems, closings);
  const sdrs = calcSDRs(agendaItems, closings);
  const funnel = buildFunnel(kpis);

  // A faixa do Orgânico é um RECORTE dos mesmos números acima, não uma
  // parcela subtraída deles: quanto do mês veio do site. O recorte vem
  // depois do filtro de coorte para acompanhar a aba selecionada.
  const kpisOrganico = calcKPIs(onlyOrganico(leads), onlyOrganico(agendaItems), onlyOrganico(closings));

  // Os KPIs que as METAS enxergam. Iguais aos de cima no Mensal e no Semanal;
  // no Diário são os da semana, porque é ela que carrega as metas enquanto o
  // resto da página fala do dia — num único dia, "1 de 2 reuniões" viraria
  // 50% e a taxa não diria nada.
  const goalKpis = goalWindowDiffers
    ? calcKPIs(
        filterByEntryCohort(goalLeadsRaw ?? [], period.year, period.month, filter, cohort),
        filterByEntryCohort(goalAgendaRaw ?? [], period.year, period.month, filter, cohort),
        filterByEntryCohort(goalClosingsRaw ?? [], period.year, period.month, filter, cohort)
      )
    : kpis;

  // A meta do período: no modo Mensal é a própria meta do mês; na semana (e no
  // dia, que herda a da sua semana) o rateio dela por dias úteis — ou o
  // override manual, se houver.
  const goal = goals.tcv;
  const periodGoal = deriveGoal({
    monthlyGoal: goal,
    monthKey: period.monthKey,
    range: period.goalRange,
    override: overrides.tcv,
  });
  const progress = goalProgress(periodGoal.value, goalKpis.tcvTotal);
  const pace = paceOf({ goal: periodGoal.value, achieved: goalKpis.tcvTotal, range: period.goalRange, today });

  // As metas das três passagens do funil. Nenhuma se rateia: taxa é taxa em
  // qualquer recorte, então o alvo é o mesmo no dia, na semana e no mês — o
  // que muda é só a janela em que a taxa realizada é medida. Sem valor
  // gravado no mês, vale o padrão do time (META_PADRAO).
  const alvoAgendamento = goals.agendamentoPct ?? META_PADRAO.agendamentoPct;
  const alvoComparecimento = goals.comparecimentoPct ?? META_PADRAO.comparecimentoPct;
  const alvoConversao = goals.conversaoPct ?? META_PADRAO.conversaoPct;

  const agendamento = rateProgress(alvoAgendamento, goalKpis.agendadas, goalKpis.total);
  const comparecimento = rateProgress(alvoComparecimento, goalKpis.realizadas, goalKpis.agendadas);
  const conversao = rateProgress(alvoConversao, goalKpis.fechados, goalKpis.realizadas);

  const mensal = period.view === "mes";

  // O acumulado do mês NÃO passa pelo filtro de coorte: a meta mensal não é
  // escopada por coorte, então "mês: 41%" não pode se mexer quando alguém
  // clica numa aba de Fechamentos. A contradição com o card de % — que É
  // filtrado — nunca aparece na tela, porque a faixa só existe fora do modo
  // Mensal, onde os dois falam de granularidades diferentes de qualquer jeito.
  const monthProgress = monthClosings ? goalProgress(goal, calcKPIs([], [], monthClosings).tcvTotal) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-enter flex flex-wrap items-center justify-between gap-3 rounded-none border border-hairline bg-white/[0.02] px-4 py-2.5">
        {/* Os dois grupos de aba andam juntos à esquerda e quebram linha
            juntos, para o seletor de mês continuar ancorado à direita. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <PeriodViewTabs view={period.view} anchor={period.anchor} label={period.label} today={today} />
          <ClosingFilterTabs filter={filter} dateFrom={dateFrom} dateTo={dateTo} showCohortCaveat={!mensal} />
        </div>
        <MonthYearSelect year={period.year} month={period.month} today={today} />
      </div>

      {/* Tudo numa fileira só: 8 cards no mensal, 7 no semanal/diário.
          `cols` só define a largura MÍNIMA de cada card — com 8, ela cai para
          120px, e a fileira só quebra abaixo de ~1070px de largura útil. Numa
          tela de trabalho normal (1440+) os oito entram lado a lado, que é o
          ponto: a leitura do funil inteiro numa varredura de olho. */}
      <KpiRow cols={mensal ? 8 : 7} staggerBase={60}>
        {/* Um card só para a meta de faturamento: o % é o herói, e o valor, a
            meta, o que falta e o ritmo entram como apoio. Eram quatro cards
            ("% da Meta", "Meta", "Gap") mais metade da faixa de contexto
            dizendo os mesmos três números. */}
        <GoalSummaryCard
          label={period.goalLabel}
          target={
            period.goalPeriodKey
              ? { kind: "period", periodKey: period.goalPeriodKey }
              : { kind: "month", monthKey: period.monthKey }
          }
          periodGoal={periodGoal}
          progress={progress}
          pace={pace}
        />

        <KpiCard
          featured
          surface="blue"
          label="TCV Fechado"
          value={<AnimatedNumber value={kpis.tcvTotal} format={{ type: "currency" }} />}
          sub={`${kpis.tcvCount} contratos TCV`}
        >
          {prevKpis.tcvTotal > 0 && (
            <div className="flex justify-start">
              <TrendBadge
                current={kpis.tcvTotal}
                previous={prevKpis.tcvTotal}
                label={period.previousLabel}
                surface="blue"
              />
            </div>
          )}
        </KpiCard>

        {/* MRR Fechado e os dois Ticket Médio só fazem sentido no mês: num dia
            o MRR é quase sempre zero, e com um contrato fechado o "ticket
            médio" É aquele contrato — card repetindo card ao lado. */}
        {mensal && (
          <KpiCard
            label="MRR Fechado"
            accent="primary"
            value={<AnimatedNumber value={kpis.mrrTotal} format={{ type: "currency" }} />}
            sub={`${kpis.mrrCount} contratos MRR`}
          >
            {prevKpis.mrrTotal > 0 && (
              <div className="flex justify-start">
                <TrendBadge current={kpis.mrrTotal} previous={prevKpis.mrrTotal} label={period.previousLabel} />
              </div>
            )}
          </KpiCard>
        )}

        {!mensal && (
          <KpiCard
            label="Fechamentos"
            accent={kpis.fechados > 0 ? "good" : "muted"}
            value={<AnimatedNumber value={kpis.fechados} format={{ type: "integer" }} />}
            sub={`${kpis.realizadas} ${kpis.realizadas === 1 ? "reunião realizada" : "reuniões realizadas"}`}
          />
        )}

        {/* As três conversões do funil no meio da fileira: dinheiro nas duas
            pontas, o caminho até ele no centro. Cada uma traz a meta editável
            e a linha do que falta para batê-la. */}
        <RateGoalCard
          label={goalWindowDiffers ? "Agendamento (semana)" : "Taxa de Agendamento"}
          monthKey={period.monthKey}
          metric="agendamento"
          progress={agendamento}
          isDefault={goals.agendamentoPct == null}
          done={goalKpis.agendadas}
          of={goalKpis.total}
          ofLabel="leads"
          neededLabel="agendamentos"
        />
        <RateGoalCard
          label={goalWindowDiffers ? "Comparecimento (semana)" : "Taxa de Comparecimento"}
          monthKey={period.monthKey}
          metric="comparecimento"
          progress={comparecimento}
          isDefault={goals.comparecimentoPct == null}
          done={goalKpis.realizadas}
          of={goalKpis.agendadas}
          ofLabel="agendadas"
          neededLabel="comparecimentos"
        />
        <RateGoalCard
          label={goalWindowDiffers ? "Conversão (semana)" : "Taxa de Conversão"}
          monthKey={period.monthKey}
          metric="conversao"
          progress={conversao}
          isDefault={goals.conversaoPct == null}
          done={goalKpis.fechados}
          of={goalKpis.realizadas}
          ofLabel="realizadas"
          neededLabel="fechamentos"
        />

        {mensal ? (
          <>
            <KpiCard
              label="Ticket Médio TCV"
              value={<AnimatedNumber value={kpis.ticketMedioTCV} format={{ type: "currency" }} />}
              sub={`${kpis.tcvCount} contratos`}
            >
              {prevKpis.ticketMedioTCV > 0 && (
                <div className="flex justify-start">
                  <TrendBadge
                    current={kpis.ticketMedioTCV}
                    previous={prevKpis.ticketMedioTCV}
                    label={period.previousLabel}
                  />
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
                  <TrendBadge
                    current={kpis.ticketMedioMRR}
                    previous={prevKpis.ticketMedioMRR}
                    label={period.previousLabel}
                  />
                </div>
              )}
            </KpiCard>
          </>
        ) : (
          /* O acumulado do mês, que era uma faixa inteira embaixo. Vira um
             card: ele responde uma pergunta só ("e o mês, como está?") e não
             precisava de uma faixa da largura da página para isso. */
          monthProgress && (
            <KpiCard
              label="Acumulado do Mês"
              accent={monthProgress.metaAccent}
              value={
                <AnimatedNumber value={monthProgress.goal ? monthProgress.pct : null} format={{ type: "percent" }} />
              }
              sub={
                monthProgress.goal
                  ? `${fmtBRL(monthProgress.achieved)} de ${fmtBRLCompact(monthProgress.goal)}`
                  : "sem meta do mês definida"
              }
            >
              {monthProgress.goal > 0 && (
                <div className="relative mt-3">
                  <ProgressIndicator pct={monthProgress.pct} tone={monthProgress.metaTone} />
                </div>
              )}
            </KpiCard>
          )
        )}
      </KpiRow>

      <div className="animate-enter grid grid-cols-1 gap-4 lg:h-[440px] lg:grid-cols-[34fr_32fr_34fr]" style={{ animationDelay: "440ms" }}>
        <FunnelChart data={funnel} />
        <SdrPodium sdrs={sdrs} meta={alvoComparecimento} />
        <ClosersPodium closers={closers} />
      </div>

      {/* Respiro bem maior em cima do que embaixo, de propósito. O `gap-5`
          da página serve para blocos de peso parecido, e aqui ele encontra a
          fileira de 440px cujos pedestais e feixe de luz encostam no rodapé
          do card: com 20px — e mesmo com 32 — aquele fundo cheio e mais um
          painel escuro igual leem como um bloco só, e a faixa parece a
          quarta coluna do pódio. 52px no total é o que separa de verdade;
          não é sobra, é a quebra de seção. Embaixo fica o gap normal: a
          faixa e a tabela de fechamentos são, as duas, o rodapé da página. */}
      <div className="animate-enter mt-8" style={{ animationDelay: "500ms" }}>
        <OrganicSummary kpis={kpisOrganico} />
      </div>

      <div className="animate-enter min-h-[320px] flex-1" style={{ animationDelay: "560ms" }}>
        <ClosedDealsTable closings={closings} />
      </div>
    </div>
  );
}
