// Ported 1:1 from the legacy dashboard (Dash Comercial Scale/index.html).

export const MONDAY_BOARD_ID = 9613941689;

// Monday.com column IDs (board 9613941689)
export const MONDAY_COL = {
  etapa: "color_mksyb52r",
  mrr: "numeric_mksykxx",
  dtFecha: "date_mksyxsgr",
  dtEntrada: "data",
  dtAgenda: "date_mkt23t3n",
  closer: "dropdown_mkt2ehgd",
  sdr: "dropdown_mkt2jm28",
  modelo: "color_mm5gmp1",
  origem: "color_mksy15sp",
  criativo: "text_mkv5psxz",
  direcao: "color_mkta1n92",
} as const;

export const ORIGEM_META_ADS = "Meta Ads";

// Inscrito em live (a /scale-class do site) — FORA do dashboard, em todo
// lugar. Não é uma linha do funil comercial: é volume de campanha paga, e
// contá-lo junto infla "Leads Totais" e afunda toda taxa de conversão da
// página com gente que se inscreveu para assistir a uma aula, não para
// comprar. Esses leads existem só no CRM (a /scale-class não passa pelo
// Make, então nunca chegaram ao board) — quer dizer que eles só apareceriam
// aqui agora, junto com a sincronização do CRM, e a exclusão nasce com ela.
// Ver a seção "Lead de site" do AGENTS.md do CRM.
export const ORIGEM_LIVE = "Site — Live";

// Entrada espontânea pelo site. Conta COMO QUALQUER OUTRO LEAD — no total,
// no agendamento, na reunião realizada, no fechamento e nos dois pódios. A
// única coisa que esta lista faz é alimentar a faixa de
// components/organic-summary.tsx, que mostra quanto do mês veio do site.
//
// Já foi um corte de verdade (o orgânico saía dos números principais) e o
// usuário desfez: o lead chegou pelo site em vez de por anúncio, mas o SDR
// marcou a reunião igual e o closer fechou igual. Tirá-lo dos totais apaga
// trabalho que aconteceu. Só "Filter" e "Site — Live" ficam de fora do
// dashboard — mais nada.
//
// Lista exata, não prefixo "Site — ": "Site — Live" também começa assim e
// está justamente do outro lado da regra. É a mesma lista do Quadro
// Orgânico do CRM (ORIGEM_ORGANICO, em components/crm/leads-workspace.tsx)
// — origem nova no site precisa entrar nos dois lugares.
export const ORIGEM_ORGANICO = ["Site — Blog", "Site — Cases", "Site — Contato"] as const;

export function isOrigemOrganica(origem: string | null | undefined): boolean {
  return !!origem && (ORIGEM_ORGANICO as readonly string[]).includes(origem);
}

// "Direção" marks junk/test/duplicate leads — excluded everywhere in the
// dashboard (leads, agenda, closings), not just from fechamentos.
export const DIRECAO_FILTER = "Filter";

// Meetings that actually happened (vs. still open / cancelled before the call)
export const ETAPA_REALIZADA = new Set([
  "R1 Realizada",
  "R2 Agendado",
  "Follow Up",
  "Proposta em Análise",
  "Fechado",
  "Perdido Closer",
  "Contato Futuro",
  "Desqualificado",
]);

// Excluded from the "agendadas" (scheduled meetings) funnel stage
export const ETAPA_EXCLUIDA_AGENDA = new Set(["Em Aberto", "Perdido SDR"]);

export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export interface PersonPhoto {
  src: string;
  /** CSS object-position — lets a headshot be nudged so the face isn't cropped in the circular avatar. */
  position?: string;
}

// Person first-name (lowercase) -> photo in /public. One shared map for
// every podium (SDR, closer, ...) — a person's headshot doesn't depend on
// which role they're being ranked under, and someone can show up in both
// (e.g. moving from closer to SDR) without losing their photo.
export const PERSON_PHOTOS: Record<string, PersonPhoto> = {
  josé: { src: "/jose-novo.jpeg", position: "center 25%" },
  jose: { src: "/jose-novo.jpeg", position: "center 25%" },
  henrique: { src: "/henrique-novo.jpg", position: "center 25%" },
  gabriel: { src: "/gabriel-dias.jpeg" },
  pedro: { src: "/pedro-clarck.jpeg", position: "center 25%" },
  samuel: { src: "/samuel.jpeg", position: "center 25%" },
  yakin: { src: "/yakin.jpeg" },
};

export const FIRST_DATA_MONTH = "2025-11"; // earliest month with a configured goal / Meta Ads backfill

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function monthKeyOf(year: number, month: number) {
  return `${year}-${pad(month)}`;
}

export function monthRange(year: number, month: number): [string, string] {
  const from = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${pad(month)}-${pad(lastDay)}`;
  return [from, to];
}

export function dateMonth(s: string | null | undefined) {
  if (!s) return null;
  const d = new Date(`${s}T12:00:00Z`);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTHS[month - 1].slice(0, 3)}/${String(year).slice(2)}`;
}

// Inclusive list of 'YYYY-MM' keys from `from` to `to`.
export function monthKeysBetween(from: string, to: string): string[] {
  const [fromYear, fromMonth] = from.split("-").map(Number);
  const [toYear, toMonth] = to.split("-").map(Number);
  const keys: string[] = [];
  let y = fromYear;
  let m = fromMonth;
  while (y < toYear || (y === toYear && m <= toMonth)) {
    keys.push(monthKeyOf(y, m));
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return keys;
}

export function fmtBRL(v: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);
}

// Compact form for tight spaces (chart labels, KPI cards that would
// otherwise need to shrink below a readable size): "R$ 150k", "R$ 1,4M".
// Full precision stays available via fmtBRL for tooltips/titles.
export function fmtBRLCompact(v: number | null | undefined) {
  const value = v || 0;
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")}M`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
  return fmtBRL(value);
}

// ---------------------------------------------------------------------------
// Intervalos de data (filtro do Marketing)
//
// O dashboard nasceu preso a (ano, mês). O filtro do Marketing agora aceita
// qualquer intervalo ['YYYY-MM-DD', 'YYYY-MM-DD'] para permitir comparar
// recortes específicos (uma semana de teste de criativo, os 10 dias depois
// de subir uma campanha nova, etc.). Um mês inteiro continua sendo só um
// caso particular de intervalo — ver fullMonthKey() abaixo, que é o que
// deixa o caminho rápido (dados já sincronizados no Supabase) continuar
// valendo para a seleção mensal do dia a dia.
// ---------------------------------------------------------------------------

export type DateRange = { from: string; to: string };

export function toISODate(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** 'YYYY-MM-DD' -> Date fixado ao meio-dia UTC (mesma convenção de dateMonth: imune a fuso). */
export function parseISODate(s: string) {
  return new Date(`${s}T12:00:00Z`);
}

export function addDays(s: string, days: number) {
  const d = parseISODate(s);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

/** Nº de dias do intervalo, inclusivo nas duas pontas. */
export function rangeLength(range: DateRange) {
  const ms = parseISODate(range.to).getTime() - parseISODate(range.from).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function monthRangeOf(year: number, month: number): DateRange {
  const [from, to] = monthRange(year, month);
  return { from, to };
}

/**
 * monthKey se o intervalo for exatamente um mês-calendário inteiro, senão null.
 *
 * Os insights do Meta Ads são gravados por mês (meta_ads_*_insights.month),
 * então só dá para servir spend do banco quando o recorte bate com um mês
 * fechado. Para qualquer outro intervalo o spend vem da Graph API na hora
 * (getMetaAdsRangeInsights) — ver lib/data/meta-ads.ts.
 */
export function fullMonthKey(range: DateRange): string | null {
  const from = parseISODate(range.from);
  const to = parseISODate(range.to);
  if (from.getUTCDate() !== 1) return null;
  if (from.getUTCFullYear() !== to.getUTCFullYear() || from.getUTCMonth() !== to.getUTCMonth()) return null;
  const lastDay = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() + 1, 0)).getUTCDate();
  if (to.getUTCDate() !== lastDay) return null;
  return monthKeyOf(from.getUTCFullYear(), from.getUTCMonth() + 1);
}

/**
 * Janela imediatamente anterior, de mesmo tamanho — é contra ela que os
 * TrendBadges comparam. Para um mês inteiro devolve o mês anterior inteiro
 * (e não "os 31 dias anteriores"), que é a comparação que as pessoas
 * esperam ver quando o filtro está em "Agosto".
 */
export function previousRange(range: DateRange): DateRange {
  const monthKey = fullMonthKey(range);
  if (monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    return month === 1 ? monthRangeOf(year - 1, 12) : monthRangeOf(year, month - 1);
  }
  const len = rangeLength(range);
  return { from: addDays(range.from, -len), to: addDays(range.to, -len) };
}

const SHORT_DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });

/** "Agosto 2026" para mês inteiro, "01 ago – 15 ago 2026" para recorte livre. */
export function rangeLabel(range: DateRange): string {
  const monthKey = fullMonthKey(range);
  if (monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    return `${MONTHS[month - 1]} ${year}`;
  }
  const from = parseISODate(range.from);
  const to = parseISODate(range.to);
  const fmt = (d: Date) => SHORT_DATE.format(d).replace(".", "");
  const year = to.getUTCFullYear();
  const suffix = from.getUTCFullYear() === year ? ` ${year}` : "";
  const fromLabel = from.getUTCFullYear() === year ? fmt(from) : `${fmt(from)} ${from.getUTCFullYear()}`;
  return `${fromLabel} – ${fmt(to)}${suffix}`;
}

// ---------------------------------------------------------------------------
// Metas de performance de mídia — os números que o time considera "TOP".
// Usados para colorir CPL e Taxa de Conversão nas tabelas e nos KPIs:
// abaixo/acima da meta = verde, até a margem de tolerância = amarelo,
// pior que isso = vermelho.
// ---------------------------------------------------------------------------
export const META_CPL = 65; // R$ por lead — menor é melhor
export const META_TAXA_CONVERSAO = 25; // % de leads que comparecem à reunião — maior é melhor

/** Quanto o valor pode passar da meta antes de sair do amarelo para o vermelho. */
const TOLERANCIA = 0.3;

export type MetaStatus = "good" | "warning" | "critical" | "neutral";

/** Meta do tipo "menor é melhor" (CPL, CAC, custo por agendamento). */
export function statusLowerIsBetter(value: number, target: number): MetaStatus {
  if (!value) return "neutral";
  if (value <= target) return "good";
  return value <= target * (1 + TOLERANCIA) ? "warning" : "critical";
}

/** Meta do tipo "maior é melhor" (taxa de conversão, ROAS). */
export function statusHigherIsBetter(value: number, target: number): MetaStatus {
  if (!value) return "neutral";
  if (value >= target) return "good";
  return value >= target * (1 - TOLERANCIA) ? "warning" : "critical";
}
