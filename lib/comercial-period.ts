import {
  addDays,
  FIRST_DATA_MONTH,
  MONTHS,
  monthKeyOf,
  monthRangeOf,
  parseISODate,
  previousBusinessDay,
  previousRange,
  rangeLabel,
  toISODate,
  weekRangeClippedToMonth,
  weekRangeOf,
  type DateRange,
} from "@/lib/constants";

// Resolve os parâmetros de URL do Comercial numa janela de leitura.
//
// A página nasceu presa a (ano, mês). Agora ela também sabe olhar uma SEMANA
// ou um DIA, para o time acompanhar o ritmo DURANTE o mês em vez de só no
// fechamento. Dois parâmetros novos, os cinco antigos intactos:
//
//   view=semana|dia   ausente => 'mes', o padrão de sempre
//   date=YYYY-MM-DD   o dia âncora: o dia selecionado, ou qualquer dia
//                     dentro da semana selecionada
//
// Quem manda em quê:
//
//   view=mes  -> `year`/`month` são a fonte da verdade, exatamente como
//                antes. `date` é ignorado. Todo link salvo continua valendo.
//   senão     -> `date` manda, e o mês sai da PRÓPRIA âncora. Assim uma URL
//                contraditória (year=2026&month=7&view=dia&date=2026-08-14)
//                resolve coerentemente para agosto em vez de misturar os dois.
//
// `date` em vez de `week=YYYY-Www` porque um parâmetro só serve aos dois
// modos não-mensais (alternar Semanal/Diário mantém o lugar), e porque o
// número ISO da semana é o MESMO dos dois lados da virada do mês — as duas
// metades recortadas colidiriam na mesma chave.
//
// NADA AQUI LANÇA. Isto roda num Server Component: um throw cairia no
// error.tsx e apagaria a página inteira por causa de um parâmetro torto.

export type ViewMode = "mes" | "semana" | "dia";

export const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: "mes", label: "Mensal" },
  { value: "semana", label: "Semanal" },
  { value: "dia", label: "Diário" },
];

/** Primeiro dia com dado no banco — o piso de qualquer navegação. */
export const FIRST_DATA_DAY = `${FIRST_DATA_MONTH}-01`;

export interface ComercialPeriod {
  view: ViewMode;
  /** O dia de referência. No modo mês, um dia qualquer dentro dele. */
  anchor: string;
  /** A janela que a PÁGINA INTEIRA lê. */
  range: DateRange;
  /** O mês-calendário dono da janela — o escopo da coorte e da meta mensal. */
  monthRange: DateRange;
  monthKey: string;
  year: number;
  month: number;
  /**
   * A janela a que as METAS se referem — que nem sempre é a janela de
   * leitura da página.
   *
   * Não existe meta de dia: quem planeja, planeja a semana. Então no modo
   * Diário a página mostra a produção do DIA (TCV, funil, pódios, tabela)
   * enquanto os cards de meta falam da SEMANA daquele dia. No Semanal e no
   * Mensal as duas janelas coincidem.
   */
  goalRange: DateRange;
  /** A chave do override em period_goals — null quando a meta é a do mês. */
  goalPeriodKey: string | null;
  /** Janela de comparação dos TrendBadges. */
  previous: DateRange;
  previousLabel: string;
  /** true quando a semana foi cortada pela virada do mês. */
  clipped: boolean;
  /** "Agosto 2026" · "Semana de 10 ago a 16 ago" · "Quinta-feira, 14 de agosto" */
  label: string;
  /** Rótulo do card de meta editável. */
  goalLabel: string;
  /** Rótulo do card de percentual. */
  pctLabel: string;
  /** Rótulo do card de gap. */
  gapLabel: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A regex sozinha aceita 2026-02-31. O round-trip pelo parseISODate não. */
export function isRealISODate(s: unknown): s is string {
  return typeof s === "string" && ISO_DATE.test(s) && toISODate(parseISODate(s)) === s;
}

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * A âncora quando a URL não traz `date`: hoje, se hoje cai no mês escolhido;
 * senão a última data possível do mês (passado) ou a primeira (futuro).
 *
 * É o que faz "estou vendo julho, quero o Diário" cair no último dia de
 * julho em vez de pular para hoje, em agosto.
 */
export function defaultAnchor(year: number, month: number, today: string): string {
  const { from, to } = monthRangeOf(year, month);
  if (today < from) return from;
  if (today > to) return to;
  return today;
}

const WEEKDAY_FULL = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: "UTC",
});
const WEEKDAY_SHORT = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

/** "14/08" — mais curto e mais legível que o "14 de ago." do Intl. */
function dayMonth(s: string) {
  return `${s.slice(8, 10)}/${s.slice(5, 7)}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * "Semana de 10 a 16 de agosto".
 *
 * A janela recortada está sempre DENTRO de um mês só (é isso que
 * weekRangeClippedToMonth garante), então o nome do mês aparece uma vez, no
 * fim — e não repetido em cada ponta como o Intl faria.
 */
function weekLabel(range: DateRange, month: number, clipped: boolean): string {
  const from = Number(range.from.slice(8, 10));
  const to = Number(range.to.slice(8, 10));
  const span = from === to ? `${from}` : `${from} a ${to}`;
  const base = `Semana de ${span} de ${MONTHS[month - 1].toLowerCase()}`;
  // Sem o aviso, uma meta de 1/21 na semana que atravessa a virada do mês
  // parece bug em vez de recorte.
  return clipped ? `${base} · recorte do mês` : base;
}

/**
 * Como a faixa de contexto se refere ao período — "hoje", "esta semana", ou
 * a data.
 *
 * "hoje" SÓ quando a âncora é mesmo hoje. Cravar "hoje" numa página que está
 * mostrando terça passada é exatamente o tipo de coisa que destrói a
 * confiança num dashboard.
 */
export function periodWord(view: ViewMode, range: DateRange, today: string): string {
  if (view === "dia") {
    if (range.from === today) return "hoje";
    const weekday = WEEKDAY_SHORT.format(parseISODate(range.from)).replace(".", "");
    return `${weekday}, ${dayMonth(range.from)}`;
  }
  if (view === "semana") {
    if (today >= range.from && today <= range.to) return "esta semana";
    return `semana de ${dayMonth(range.from)}`;
  }
  return "no mês";
}

export function resolveComercialPeriod(
  params: Record<string, string | string[] | undefined>,
  today: string
): ComercialPeriod {
  const rawView = one(params.view);
  const view: ViewMode = rawView === "semana" || rawView === "dia" ? rawView : "mes";

  const now = parseISODate(today);
  const paramYear = Number(one(params.year)) || now.getUTCFullYear();
  const rawMonth = Number(one(params.month)) || now.getUTCMonth() + 1;
  // Um mês fora de 1–12 chegaria a monthRangeOf e viraria um intervalo de
  // outro ano sem ninguém perceber.
  const paramMonth = Math.min(12, Math.max(1, rawMonth));

  if (view === "mes") {
    const range = monthRangeOf(paramYear, paramMonth);
    const monthKey = monthKeyOf(paramYear, paramMonth);
    return {
      view,
      anchor: defaultAnchor(paramYear, paramMonth, today),
      range,
      monthRange: range,
      monthKey,
      year: paramYear,
      month: paramMonth,
      goalRange: range,
      goalPeriodKey: null,
      previous: previousRange(range),
      previousLabel: "vs mês anterior",
      clipped: false,
      label: rangeLabel(range),
      goalLabel: "Meta do Mês",
      pctLabel: "% da Meta Realizada",
      gapLabel: "Gap para Meta",
    };
  }

  const rawDate = one(params.date);
  const requested = isRealISODate(rawDate) ? rawDate : defaultAnchor(paramYear, paramMonth, today);
  // Piso no primeiro dia com dado. Sem teto: uma data futura é alcançável
  // editando a URL, e o certo é dizer "período ainda não começou" em vez de
  // fingir que o usuário pediu outra coisa.
  const anchor = requested < FIRST_DATA_DAY ? FIRST_DATA_DAY : requested;

  // O mês sai da âncora, não dos params — é o que resolve URLs contraditórias.
  const year = parseISODate(anchor).getUTCFullYear();
  const month = parseISODate(anchor).getUTCMonth() + 1;
  const monthKey = monthKeyOf(year, month);
  const monthRange = monthRangeOf(year, month);

  // Rótulos das metas fora do modo Mensal. São os mesmos no Diário e no
  // Semanal porque a meta é a MESMA coisa nos dois: a da semana.
  const WEEK_GOAL_LABELS = {
    goalLabel: "Meta da Semana",
    pctLabel: "% da Meta da Semana",
    gapLabel: "Gap da Semana",
  };

  if (view === "dia") {
    const range = { from: anchor, to: anchor };
    const prev = previousBusinessDay(anchor);
    // A produção é do dia, mas a meta é a da semana dele.
    const goalRange = weekRangeClippedToMonth(anchor, monthKey);
    return {
      view,
      anchor,
      range,
      monthRange,
      monthKey,
      year,
      month,
      goalRange,
      goalPeriodKey: goalRange.from,
      // Dia ÚTIL anterior: comparar segunda com domingo é comparar com zero, e
      // o TrendBadge some quando o anterior é <= 0 — toda segunda-feira
      // perderia os indicadores de variação em silêncio.
      previous: { from: prev, to: prev },
      previousLabel: "vs dia útil anterior",
      clipped: false,
      label: capitalize(WEEKDAY_FULL.format(parseISODate(anchor))),
      ...WEEK_GOAL_LABELS,
    };
  }

  const fullWeek = weekRangeOf(anchor);
  const range = weekRangeClippedToMonth(anchor, monthKey);
  const clipped = range.from !== fullWeek.from || range.to !== fullWeek.to;
  // A semana anterior fica INTEIRA, sem recorte: recortá-la também faria a
  // primeira semana do mês comparar uma lasca de um dia contra uma semana
  // cheia, o que só produz variações sem sentido.
  const previous = weekRangeOf(addDays(fullWeek.from, -7));

  return {
    view,
    anchor,
    range,
    monthRange,
    monthKey,
    year,
    month,
    // Aqui as duas janelas coincidem: a meta da semana é a da semana na tela.
    goalRange: range,
    // A chave é o primeiro dia da JANELA RECORTADA — cada metade de uma
    // semana que atravessa a virada do mês tem override próprio.
    goalPeriodKey: range.from,
    previous,
    previousLabel: "vs semana anterior",
    clipped,
    label: weekLabel(range, month, clipped),
    ...WEEK_GOAL_LABELS,
  };
}
