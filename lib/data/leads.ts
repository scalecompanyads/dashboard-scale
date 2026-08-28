import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DIRECAO_FILTER,
  dateMonth,
  ETAPA_EXCLUIDA_AGENDA,
  isOrigemOrganica,
  monthKeyOf,
  monthRangeOf,
  ORIGEM_LIVE,
  type DateRange,
} from "@/lib/constants";
import type { Database, Lead } from "@/lib/types/database.types";

type DB = SupabaseClient<Database>;

export type ClosingFilter = "all" | "mesmo_mes" | "outros_meses";

// leads / agendadas / fechamentos are just different date-column filters
// over the same lead set — mirrors fetchLeads/fetchAgendadas/
// fetchClosingsFiltered in the legacy dashboard.
//
// A leitura é da VIEW `leads_effective`, nunca da tabela `leads`: desde que
// o CRM entrou como segunda fonte, a tabela guarda as duas origens
// empilhadas e cada um dos ~7.700 leads migrados do Monday tem uma linha de
// cada lado. Ler a tabela crua dobraria todo número desta página. A view
// resolve o par pelo carimbo de alteração da origem — ver
// supabase/migrations/0004_crm_as_second_source.sql.
const LEADS = "leads_effective" as const;

// As duas exclusões que valem para TODA leitura desta página — nenhuma
// consulta daqui deve escapar delas.
//
// 1. "Direção" (color_mkta1n92 no Monday) marca lead de lixo/teste/duplicado
//    com o valor "Filter".
// 2. Origem "Site — Live": inscrito em live não é lead do funil comercial
//    (ver ORIGEM_LIVE em lib/constants.ts).
//
// As duas são null-safe: `.neq` sozinho também derrubaria linha com o campo
// vazio, porque em SQL `!=` nunca casa com NULL — e a maioria dos leads não
// tem direção nenhuma. Dois `.or()` encadeados viram um E entre dois grupos
// OU, que é exatamente a leitura desejada.
function excludeNaoComercial<Q extends { or: (filters: string) => Q }>(query: Q): Q {
  return query
    .or(`direcao.is.null,direcao.neq.${DIRECAO_FILTER}`)
    .or(`origem.is.null,origem.neq."${ORIGEM_LIVE}"`);
}

/**
 * O recorte do que entrou espontaneamente pelo site.
 *
 * É uma LEITURA, não um corte: o orgânico conta normalmente em tudo — nos
 * KPIs, no funil, nos pódios, no agendamento e no fechamento. Chegou pelo
 * site e não por anúncio, mas é lead igual, o SDR trabalhou igual e o
 * closer fechou igual; tirá-lo dos totais some com trabalho que aconteceu.
 *
 * Isto aqui existe só para a faixa de components/organic-summary.tsx poder
 * dizer quanto do total veio do site — os mesmos leads, contados de novo
 * num recorte, nunca subtraídos dos números de cima.
 */
export function onlyOrganico<T extends Pick<Lead, "origem">>(rows: T[]): T[] {
  return rows.filter((row) => isOrigemOrganica(row.origem));
}

// As funções *ByDateRange abaixo são a forma primitiva — o filtro do
// Marketing aceita qualquer intervalo. As variantes por (ano, mês) que a
// aba Comercial usa são só um wrapper em cima delas.

export async function getLeadsByEntryDateRange(supabase: DB, range: DateRange): Promise<Lead[]> {
  const { data, error } = await excludeNaoComercial(
    supabase.from(LEADS).select("*").gte("dt_entrada", range.from).lte("dt_entrada", range.to)
  );
  if (error) throw error;
  return data ?? [];
}

export async function getAgendaByDateRange(supabase: DB, range: DateRange): Promise<Lead[]> {
  const { data, error } = await excludeNaoComercial(
    supabase.from(LEADS).select("*").gte("dt_agenda", range.from).lte("dt_agenda", range.to)
  );
  if (error) throw error;
  return (data ?? []).filter((i) => !ETAPA_EXCLUIDA_AGENDA.has(i.etapa ?? ""));
}

async function getClosingsRawByDateRange(supabase: DB, range: DateRange): Promise<Lead[]> {
  const { data, error } = await excludeNaoComercial(
    supabase.from(LEADS).select("*").gte("dt_fecha", range.from).lte("dt_fecha", range.to).eq("etapa", "Fechado")
  );
  if (error) throw error;
  return data ?? [];
}

export function getLeadsByEntryRange(supabase: DB, year: number, month: number): Promise<Lead[]> {
  return getLeadsByEntryDateRange(supabase, monthRangeOf(year, month));
}

export function getAgendaByRange(supabase: DB, year: number, month: number): Promise<Lead[]> {
  return getAgendaByDateRange(supabase, monthRangeOf(year, month));
}

// Shared by getClosingsFiltered below AND filterByEntryCohort — same
// "did this row's lead enter THIS month, or another one" question, just
// applied to different date-column-filtered slices of the leads table
// (closings by dt_fecha, leads/agenda by dt_entrada/dt_agenda).
function applyCohortFilter<T extends Pick<Lead, "dt_entrada">>(
  items: T[],
  key: string,
  filter: ClosingFilter,
  customRange?: { from?: string; to?: string }
): T[] {
  if (filter === "mesmo_mes") {
    return items.filter((i) => dateMonth(i.dt_entrada) === key);
  }

  if (filter === "outros_meses") {
    const cFrom = customRange?.from;
    const cTo = customRange?.to;
    return items.filter((i) => {
      if (!i.dt_entrada) return false;
      if (dateMonth(i.dt_entrada) === key) return false; // exclui leads do próprio mês
      if (cFrom && i.dt_entrada < cFrom) return false;
      if (cTo && i.dt_entrada > cTo) return false;
      return true;
    });
  }

  return items;
}

export async function getClosingsFiltered(
  supabase: DB,
  year: number,
  month: number,
  filter: ClosingFilter,
  customRange?: { from?: string; to?: string }
): Promise<Lead[]> {
  const closings = await getClosingsRawByDateRange(supabase, monthRangeOf(year, month));
  return applyCohortFilter(closings, monthKeyOf(year, month), filter, customRange);
}

/**
 * Fechamentos dentro do intervalo, opcionalmente restritos à coorte que
 * ENTROU no mesmo intervalo (`sameCohort`) — o recorte que o CAC precisa.
 *
 * Com intervalo livre a pergunta "mesmo mês" vira "mesma janela": um lead
 * que entrou fora do recorte teve o custo de aquisição pago por outro
 * período de investimento, então continua fora do CAC daqui.
 */
export async function getClosingsByDateRange(
  supabase: DB,
  range: DateRange,
  opts: { sameCohort?: boolean } = {}
): Promise<Lead[]> {
  const closings = await getClosingsRawByDateRange(supabase, range);
  if (!opts.sameCohort) return closings;
  return closings.filter((i) => !!i.dt_entrada && i.dt_entrada >= range.from && i.dt_entrada <= range.to);
}

// The comercial page's filter tabs ("Todos" / "Leads do mês" / "Outros
// meses") were only ever applied to closings — leads/reuniões stayed on
// the full month regardless of the tab, so switching tabs looked like the
// funnel and podiums "weren't updating" (only the last stage/cards fed by
// closings actually moved). Applying the same cohort filter to leads and
// agenda items keeps the whole page's picture consistent with the
// selected tab, not just the closings-derived numbers.
export function filterByEntryCohort<T extends Pick<Lead, "dt_entrada">>(
  items: T[],
  year: number,
  month: number,
  filter: ClosingFilter,
  customRange?: { from?: string; to?: string }
): T[] {
  return applyCohortFilter(items, monthKeyOf(year, month), filter, customRange);
}
