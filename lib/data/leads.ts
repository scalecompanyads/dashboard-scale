import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DIRECAO_FILTER,
  dateMonth,
  ETAPA_EXCLUIDA_AGENDA,
  isOrigemOrganica,
  monthKeyOf,
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
// cada lado. Ler a tabela crua dobraria todo número desta página.
//
// A view devolve o BOARD inteiro, mais o que só existe no CRM. O Monday é a
// verdade absoluta — é ele que está em produção — e o CRM entra com lead
// nascido lá ou cujo item sumiu do board. Ver
// supabase/migrations/0005_board_vence.sql.
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
// Marketing aceita qualquer intervalo, e a aba Comercial agora também lê
// semana e dia por aqui. As variantes por (ano, mês) são só um wrapper.
//
// O PostgREST corta a resposta em 1000 linhas e NÃO avisa — vem uma página
// curta, sem erro, e o total simplesmente para de crescer. Falha silenciosa,
// impossível de perceber olhando a tela.
//
// `.limit(n)` não resolve: o teto de 1000 é configuração do SERVIDOR
// (db-max-rows), e um limit maior que ele é ignorado — medido neste projeto,
// `.limit(5000)` numa view de 7.934 linhas devolveu 1000. O único jeito é
// paginar com .range() até vir uma página incompleta.
//
// A margem hoje é menor do que parece: agosto/2026 já tem ~592 leads em
// dt_entrada, e um dia de campanha sozinho passou de 90.
const PAGE_SIZE = 1000;

/**
 * Lê todas as páginas de uma consulta.
 *
 * A ordenação por `row_id` não é estética: sem ORDER BY, o Postgres não
 * garante ordem estável entre as páginas, e o offset passaria a repetir uma
 * linha e pular outra.
 */
async function fetchAllPages(
  build: () => {
    order: (column: string) => {
      range: (from: number, to: number) => PromiseLike<{ data: Lead[] | null; error: unknown }>;
    };
  }
): Promise<Lead[]> {
  const out: Lead[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await build()
      .order("row_id")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return out;
}

export function getLeadsByEntryDateRange(supabase: DB, range: DateRange): Promise<Lead[]> {
  return fetchAllPages(() =>
    excludeNaoComercial(supabase.from(LEADS).select("*").gte("dt_entrada", range.from).lte("dt_entrada", range.to))
  );
}

export async function getAgendaByDateRange(supabase: DB, range: DateRange): Promise<Lead[]> {
  const rows = await fetchAllPages(() =>
    excludeNaoComercial(supabase.from(LEADS).select("*").gte("dt_agenda", range.from).lte("dt_agenda", range.to))
  );
  return rows.filter((i) => !ETAPA_EXCLUIDA_AGENDA.has(i.etapa ?? ""));
}

function getClosingsRawByDateRange(supabase: DB, range: DateRange): Promise<Lead[]> {
  return fetchAllPages(() =>
    excludeNaoComercial(
      supabase.from(LEADS).select("*").gte("dt_fecha", range.from).lte("dt_fecha", range.to).eq("etapa", "Fechado")
    )
  );
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
//
// A coorte é MENSAL em qualquer modo de visualização, inclusive quando a
// janela de leitura é uma semana ou um dia: "Leads do mês" tem que continuar
// significando "o lead entrou neste mês", e não "entrou hoje". Reinterpretar
// a pergunta como "mesma janela" não sobraria quase nada num dia — fechar no
// mesmo dia em que entrou é raro — e isso leria como página quebrada, não
// como filtro. Quem chama passa o mês DONO da janela.
export function filterByEntryCohort<T extends Pick<Lead, "dt_entrada">>(
  items: T[],
  year: number,
  month: number,
  filter: ClosingFilter,
  customRange?: { from?: string; to?: string }
): T[] {
  const key = monthKeyOf(year, month);

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
