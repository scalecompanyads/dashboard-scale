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

// SDR first-name (lowercase) -> photo in /public
export const SDR_PHOTOS: Record<string, PersonPhoto> = {
  josé: { src: "/jose-novo.jpeg", position: "center 25%" },
  jose: { src: "/jose-novo.jpeg", position: "center 25%" },
  henrique: { src: "/henrique-novo.jpg", position: "center 25%" },
};

// Closer first-name (lowercase) -> photo in /public
export const CLOSER_PHOTOS: Record<string, PersonPhoto> = {
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
