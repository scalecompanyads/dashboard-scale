import { businessDaysElapsed, businessDaysIn, businessDaysInMonth, type DateRange } from "@/lib/constants";

// Meta do período: rateio da meta mensal, progresso contra ela, e ritmo.
//
// A meta nasce MENSAL — é ela que o time negocia, é ela que fica em
// monthly_goals. Dia e semana são um rateio dela por DIAS ÚTEIS (seg–sex):
//
//   meta do dia    = meta do mês / dias úteis do mês
//   meta da semana = meta do dia * dias úteis da semana DENTRO do mês
//
// Rateio por dia útil, e não por dia corrido, porque dia corrido criaria uma
// meta impossível de sábado e faria toda segunda-feira nascer atrasada. Não
// "simplifique" isto para (dias do range / dias do mês).
//
// O QUE CONTA COMO REALIZADO é sempre `kpis.tcvTotal`. A meta é negociada em
// TCV; MRR tem card próprio e não entra. Esta é a única linha que muda se um
// dia essa decisão mudar.
//
// A separação que sustenta o resto: **meta = período inteiro, ritmo =
// decorrido**. A meta da semana corrente é a da semana INTEIRA, nunca
// truncada em hoje — truncar faria segunda de manhã exibir um percentual
// lisonjeiro contra uma meta de um dia só. O quanto já se viveu do período
// vive em paceOf(), separado.
//
// Módulo puro: sem Supabase, sem React. As uniões abaixo são estruturalmente
// idênticas a KpiAccent/StatusTone dos componentes, mas declaradas aqui de
// propósito — nada em lib/ importa de components/.

export type GoalAccent = "muted" | "good" | "primary" | "critical";
export type GoalTone = "good" | "accent";

/** De onde veio o número: digitado à mão, rateado, ou inexistente. */
export type GoalSource = "manual" | "derivada" | "ausente";

export interface PeriodGoal {
  value: number;
  source: GoalSource;
  /** Dias úteis da janela — 0 num sábado ou domingo isolado. */
  businessDays: number;
  monthBusinessDays: number;
  /** Sempre presente, para a faixa de contexto poder dizer "· mês: X%". */
  monthlyGoal: number;
}

/**
 * A meta efetiva de um período: o override manual, ou o rateio da mensal.
 *
 * `range` já vem RECORTADO ao mês (weekRangeClippedToMonth) — é esse recorte
 * que garante que a soma das metas semanais de um mês dê exatamente a meta
 * mensal.
 */
export function deriveGoal({
  monthlyGoal,
  monthKey,
  range,
  override,
}: {
  monthlyGoal: number;
  monthKey: string;
  range: DateRange;
  override?: number | null;
}): PeriodGoal {
  const businessDays = businessDaysIn(range);
  const monthBusinessDays = businessDaysInMonth(monthKey);

  // A ordem destas três checagens importa.

  // 1. O override ganha SEMPRE — inclusive num sábado (onde o rateio seria 0)
  //    e inclusive num mês sem meta cadastrada. Quem digitou um número quis
  //    aquele número.
  if (override != null && override >= 0) {
    return { value: override, source: "manual", businessDays, monthBusinessDays, monthlyGoal };
  }

  // 2. Sem dia útil na janela, ou sem meta no mês, não há o que ratear.
  //    "Sem meta" não é "0% da meta": quem consome isto tem que mostrar "—",
  //    não um zero vermelho.
  if (businessDays === 0 || monthlyGoal <= 0) {
    return { value: 0, source: "ausente", businessDays, monthBusinessDays, monthlyGoal };
  }

  // 3. Janela = mês inteiro: a meta É a mensal, sem rateio nenhum. O produto
  //    abaixo daria o mesmo número, mas passar por ele deixaria o modo Mensal
  //    à mercê de um arredondamento de ponto flutuante — e ele precisa
  //    continuar idêntico ao que já está em produção. `manual` porque é
  //    exatamente isto: o número que alguém digitou.
  if (businessDays === monthBusinessDays) {
    return { value: monthlyGoal, source: "manual", businessDays, monthBusinessDays, monthlyGoal };
  }

  return {
    value: (monthlyGoal * businessDays) / monthBusinessDays,
    source: "derivada",
    businessDays,
    monthBusinessDays,
    monthlyGoal,
  };
}

export interface GoalProgress {
  goal: number;
  achieved: number;
  pct: number;
  gap: number;
  reached: boolean;
  /** Card "% da Meta". */
  metaAccent: GoalAccent;
  metaTone: GoalTone;
  /** Card "Gap". */
  gapAccent: GoalAccent;
  /** null => o AnimatedNumber cai no "—" em vez de animar até zero. */
  gapValue: number | null;
  gapSub: string;
}

/**
 * Progresso contra uma meta qualquer — mensal, semanal ou diária.
 *
 * Extração 1:1 do que era inline na página do Comercial: mesmos limiares,
 * mesmas cores, mesmas strings. O modo Mensal precisa continuar renderizando
 * idêntico ao que já estava em produção.
 */
export function goalProgress(goal: number, achieved: number): GoalProgress {
  const pct = goal > 0 ? (achieved / goal) * 100 : 0;

  // Só o verde (meta batida) e o vermelho (bem atrás) carregam sentido de
  // status aqui — o intervalo do meio fica no azul neutro da marca em vez de
  // um amarelo de "alerta" que não condiz com estar quase lá.
  const metaAccent: GoalAccent = !goal ? "muted" : pct >= 100 ? "good" : "primary";
  const metaTone: GoalTone = metaAccent === "good" ? "good" : "accent";

  const gap = goal - achieved;
  const reached = goal > 0 && gap <= 0;
  const gapAccent: GoalAccent = !goal ? "muted" : reached ? "good" : achieved / goal >= 0.7 ? "primary" : "critical";

  return {
    goal,
    achieved,
    pct,
    gap,
    reached,
    metaAccent,
    metaTone,
    gapAccent,
    gapValue: goal ? Math.abs(gap) : null,
    gapSub: !goal
      ? "sem meta definida"
      : reached
        ? "✓ meta superada"
        : `${Math.max(0, Math.round(100 - pct))}% restante`,
  };
}

export interface RateProgress {
  /** A taxa realizada, 0–100. É ela que vai como número herói do card. */
  rate: number;
  target: number;
  reached: boolean;
  accent: GoalAccent;
  tone: GoalTone;
  /**
   * Quantos a mais no numerador faltam para bater a meta, com o denominador
   * que já existe — "faltam 4 reuniões para 75%". null quando já bateu, ou
   * quando não há meta ou denominador.
   *
   * É a informação acionável da taxa: "66,7%" diz onde se está, isto diz o
   * que fazer. Substitui o marco genérico de 5 em 5 pontos que o funil
   * mostrava, que apontava para um número que ninguém tinha combinado.
   */
  needed: number | null;
}

/**
 * Progresso de uma meta que é TAXA (comparecimento), não quantidade.
 *
 * Diferente de goalProgress em duas coisas, e as duas importam:
 *
 * 1. Taxa não se rateia. 70% é 70% num dia, numa semana e no mês — não existe
 *    "meta de taxa da semana" diferente da do mês.
 * 2. O número que a pessoa quer ver é a TAXA (62%), não o quanto da meta ela
 *    representa (62/70 = 88%). Por isso a barra também plota a taxa crua, e
 *    não a fração da meta: número e barra têm que contar a mesma história.
 *
 * A cor segue a mesma convenção do resto da página (verde bateu, azul quase
 * lá, vermelho bem atrás), e não o amarelo de tolerância do Marketing.
 */
export function rateProgress(target: number, done: number, of: number): RateProgress {
  const rate = of > 0 ? (done / of) * 100 : 0;
  const reached = target > 0 && rate >= target;
  const accent: GoalAccent = !target ? "muted" : reached ? "good" : rate >= target * 0.7 ? "primary" : "critical";

  // Quantos a mais para a meta, mantendo o denominador de hoje. Arredonda
  // para CIMA: com 142 leads e meta de 40%, 56,8 agendamentos não existem —
  // são 57, e é o 57 que a pessoa persegue.
  const needed = target > 0 && of > 0 && !reached ? Math.max(0, Math.ceil((of * target) / 100) - done) : null;

  return { rate, target, reached, accent, tone: reached ? "good" : "accent", needed };
}

export interface Pace {
  elapsedBusinessDays: number;
  totalBusinessDays: number;
  /** Quanto já deveria estar fechado a esta altura do período. */
  expected: number;
  /** Realizado sobre esperado, em %. null quando não há meta ou o período nem começou. */
  pacePct: number | null;
  phase: "futuro" | "em_curso" | "fechado";
}

/** O quanto do período já se viveu — a informação que a meta, sozinha, não dá. */
export function paceOf({
  goal,
  achieved,
  range,
  today,
}: {
  goal: number;
  achieved: number;
  range: DateRange;
  today: string;
}): Pace {
  const totalBusinessDays = businessDaysIn(range);
  const elapsedBusinessDays = businessDaysElapsed(range, today);
  const expected = totalBusinessDays > 0 ? (goal * elapsedBusinessDays) / totalBusinessDays : 0;

  // O último dia do período ainda é "em curso" — só depois dele é que fechou.
  const phase: Pace["phase"] = today < range.from ? "futuro" : today > range.to ? "fechado" : "em_curso";

  return {
    elapsedBusinessDays,
    totalBusinessDays,
    expected,
    pacePct: goal > 0 && expected > 0 ? (achieved / expected) * 100 : null,
    phase,
  };
}
