import { createAdminClient } from "@/lib/supabase/admin";
import { createCrmClient, crmOrgId } from "@/lib/supabase/crm";
import { CRM_SOLO_DESDE, MONDAY_COL } from "@/lib/constants";
import type { LeadInsert } from "@/lib/types/database.types";

// Leitura completa do CRM a cada execução, igual à do board: um lead pode
// mudar de etapa, de dono ou de valor sem que nenhuma coluna de data se mexa,
// então não existe recorte "o que mudou desde X" que não perca linha. São
// ~7.800 leads e ~3.400 negócios — ordens de grandeza menores que os 7.000+
// itens paginados do Monday, que a mesma rotina já busca em 43-63s.
const PAGE_SIZE = 1000;
const UPSERT_CHUNK = 500;
// Passando disso, um único `.in()` monta uma URL que estoura o limite de
// cabeçalho (~16KB) e volta 400 — é o mesmo teto, pelo mesmo motivo, que o
// IN_CHUNK_SIZE do lib/data/leads.ts do CRM documenta.
const IN_CHUNK = 150;

// ---------------------------------------------------------------------------
// Formato das linhas lidas do CRM (projeto Supabase ovpsvndkugcqzunlndja).
// Declarado aqui, e não importado de lá, porque são dois repositórios
// separados — o que este arquivo precisa é este recorte, e só ele.
// ---------------------------------------------------------------------------
interface CrmLead {
  id: string;
  monday_item_id: number | null;
  nome: string;
  origem: string | null;
  direcao: string | null;
  criado_em: string | null;
  ultima_entrada_em: string;
  entradas: number;
  updated_at: string;
  owner_sdr_id: string | null;
  sdr_txt: string | null;
  closer_txt: string | null;
  funnel_stage_id: string | null;
}

interface CrmDeal {
  id: string;
  lead_id: string;
  closer_id: string | null;
  valor_bruto: number | null;
  modelo: string | null;
  data_agendamento: string | null;
  data_fechamento: string | null;
  updated_at: string;
}

interface CrmMeeting {
  referencia_tipo: "lead" | "deal" | "client";
  referencia_id: string;
  data: string | null;
  responsavel_id: string | null;
  cancelada_em: string | null;
}

interface CrmUser {
  id: string;
  nome: string;
}

interface CrmFunnelStage {
  id: string;
  nome: string;
  system_key: string | null;
}

interface CrmAttribution {
  id: string;
  lead_id: string;
  utm_content: string | null;
  capturado_em: string;
}

interface CrmLeadOwner {
  lead_id: string;
  user_id: string;
  papel: "sdr" | "closer";
  ordem: number;
}

interface CrmRawMonday {
  id: string;
  raw_monday: { column_values?: { id: string; text: string | null }[] } | null;
}

// ---------------------------------------------------------------------------
// Etapa
// ---------------------------------------------------------------------------
// Traduzida pelo `system_key` da etapa, NUNCA pelo `nome`. São três motivos: o
// CRM deixa renomear etapa pela tela de Configurações, e aqui o dashboard
// compara `etapa` com string literal (ETAPA_REALIZADA, `.eq("etapa",
// "Fechado")`); as 10 etapas genéricas aposentadas em agosto continuam na
// tabela com nome de caixa diferente ("Follow up", "No show") e casariam com
// nada; e a equivalência abaixo é exatamente a que o próprio CRM usa em
// funnel_stage_id_for() (migration 20260825130000_monday_funnel_stages.sql).
//
// Etapa criada à mão no CRM não tem system_key e cai no fallback do nome —
// ela simplesmente não conta como reunião realizada nem como fechamento, que
// é o comportamento honesto: o dashboard não sabe o que ela significa.
const STAGE_KEY_TO_ETAPA: Record<string, string> = {
  monday_em_aberto: "Em Aberto",
  monday_agendadas: "Agendadas",
  monday_no_show: "No-Show",
  monday_follow_up: "Follow Up",
  monday_fechado: "Fechado",
  monday_contato_futuro: "Contato Futuro",
  monday_r1_realizada: "R1 Realizada",
  monday_r2_agendado: "R2 Agendado",
  monday_proposta_em_analise: "Proposta em Análise",
  monday_perdido_sdr: "Perdido SDR",
  monday_perdido_closer: "Perdido Closer",
  monday_desqualificado: "Desqualificado",
  // As genéricas, desativadas mas ainda referenciadas por linhas antigas.
  novo: "Em Aberto",
  em_atendimento: "Em Aberto",
  reuniao_agendada: "Agendadas",
  no_show: "No-Show",
  em_negociacao: "R1 Realizada",
  proposta_enviada: "Proposta em Análise",
  follow_up: "Follow Up",
  convertido: "R1 Realizada",
  fechado: "Fechado",
  perdido: "Perdido SDR",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// PostgREST corta a resposta em 1000 linhas; `range` é o que pagina isso.
// Erro do PostgREST é um objeto simples ({ message, details, hint, code });
// deixá-lo subir cru dá um "Bad Request" sem dizer QUAL leitura falhou.
function fail(what: string, error: unknown): Error {
  const detail = error && typeof error === "object" ? JSON.stringify(error) : String(error);
  return new Error(`Falha lendo ${what} do CRM: ${detail}`);
}

async function fetchAllRows<T>(
  what: string,
  page: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw fail(what, error);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}

// `criado_em` -> `dt_entrada`, e a coluna guarda DUAS coisas diferentes.
//
// Ela nasceu `date` ("Data de Entrada", vinda do board) e virou timestamptz
// em 07/08/2026 (migration 20260807185848 do CRM, para permitir a análise de
// horário de pico). O cast rodou com a sessão em UTC, então as ~7.700 linhas
// migradas ficaram todas em meia-noite UTC exata: elas são DIA DE CALENDÁRIO
// disfarçado de instante. As criadas depois, pelo CRM ou pelos webhooks do
// site, são instante de verdade (createLead grava new Date().toISOString()).
// Conferido contra o banco: 7.691 linhas em 00:00:00Z cravado, 75 com hora
// real, nenhuma no meio-termo.
//
// Tratar as duas igual quebra metade da base de um jeito ou de outro:
// deslocar -03:00 em cima do dia de calendário empurra os 7.691 migrados um
// dia para trás (e todo lead de dia 1º muda de mês); não deslocar joga o lead
// nativo das últimas 3h do dia — 21h em diante, horário de Brasília — para o
// dia seguinte, que é a armadilha que o lib/data/leads.ts do CRM documenta
// nos filtros de data.
//
// Então: meia-noite UTC cravada é dia de calendário, e sai como está. O resto
// é instante e vira o dia brasileiro correspondente (-03:00 fixo; o Brasil
// não tem horário de verão desde 2019).
const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000;
const DIA_DE_CALENDARIO = /T00:00:00(\.0+)?(\+00:00|Z)$/;

function brazilDay(timestamp: string | null): string | null {
  if (!timestamp) return null;
  if (DIA_DE_CALENDARIO.test(timestamp)) return timestamp.slice(0, 10);
  const ms = new Date(timestamp).getTime();
  if (Number.isNaN(ms)) return null;
  return new Date(ms - BRAZIL_OFFSET_MS).toISOString().slice(0, 10);
}

function crmEntryDay(lead: Pick<CrmLead, "criado_em" | "ultima_entrada_em">): string | null {
  const firstEntry = brazilDay(lead.criado_em);
  const latestEntry = brazilDay(lead.ultima_entrada_em);
  // A coluna nova foi retropreenchida em massa durante agosto e não descreve
  // com fidelidade a entrada histórica anterior ao corte. Sua semântica passa
  // a valer junto com o CRM como fonte única, em setembro.
  return latestEntry && latestEntry >= CRM_SOLO_DESDE ? latestEntry : firstEntry;
}

function latest(...timestamps: (string | null | undefined)[]): string | null {
  const valid = timestamps.filter((t): t is string => !!t);
  return valid.length ? valid.reduce((a, b) => (a > b ? a : b)) : null;
}

// Um lead tem no máximo um negócio hoje (conferido contra o banco), mas o
// schema permite vários. Escolha determinística: o que fechou vem primeiro,
// depois o alterado mais recentemente — nunca "o que a página devolveu antes".
function pickDeal(deals: CrmDeal[]): CrmDeal | undefined {
  if (deals.length <= 1) return deals[0];
  return [...deals].sort((a, b) => {
    const closed = Number(!!b.data_fechamento) - Number(!!a.data_fechamento);
    return closed !== 0 ? closed : b.updated_at.localeCompare(a.updated_at);
  })[0];
}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

// Leitura + tradução, separada da escrita: é o que permite conferir o
// resultado ("os números batem com o board?") sem gravar nada — ver
// scripts/dry-run-crm.ts.
export async function buildCrmLeadRows(syncedAt: string): Promise<LeadInsert[]> {
  const crm = createCrmClient();
  const orgId = crmOrgId();

  const [leads, deals, stages, attributions, meetings, leadOwners] = await Promise.all([
    fetchAllRows<CrmLead>("leads", (from, to) =>
      crm
        .from("leads")
        .select(
          "id, monday_item_id, nome, origem, direcao, criado_em, ultima_entrada_em, entradas, updated_at, owner_sdr_id, sdr_txt, closer_txt, funnel_stage_id"
        )
        // A lixeira do CRM não é dado: lead excluído lá tem que sumir daqui
        // também. Para quem já tinha sido sincronizado antes de ir para a
        // lixeira, quem resolve é a limpeza no fim desta função.
        .is("deleted_at", null)
        .eq("org_id", orgId)
        .order("id", { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<CrmDeal>("deals", (from, to) =>
      crm
        .from("deals")
        .select("id, lead_id, closer_id, valor_bruto, modelo, data_agendamento, data_fechamento, updated_at")
        .eq("org_id", orgId)
        .order("id", { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<CrmFunnelStage>("funnel_stages", (from, to) =>
      crm
        .from("funnel_stages")
        .select("id, nome, system_key")
        .eq("org_id", orgId)
        .order("id", { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<CrmAttribution>("lead_attribution", (from, to) =>
      crm
        .from("lead_attribution")
        .select("id, lead_id, utm_content, capturado_em")
        .eq("org_id", orgId)
        .order("id", { ascending: true })
        .range(from, to)
    ),
    // A Agenda agora aceita referência direta ao lead, além do negócio.
    // Reunião cancelada é lixeira e reunião de acompanhamento não pertence ao
    // funil comercial. Para o histórico anterior à Agenda, o fallback continua
    // sendo deals.data_agendamento.
    fetchAllRows<CrmMeeting>("meetings", (from, to) =>
      crm
        .from("meetings")
        .select("referencia_tipo, referencia_id, data, responsavel_id, cancelada_em")
        .eq("org_id", orgId)
        .eq("tipo", "venda")
        .order("referencia_id", { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<CrmLeadOwner>("lead_owners", (from, to) =>
      crm
        .from("lead_owners")
        .select("lead_id, user_id, papel, ordem")
        .eq("org_id", orgId)
        .order("lead_id", { ascending: true })
        .order("papel", { ascending: true })
        .order("ordem", { ascending: true })
        .order("user_id", { ascending: true })
        .range(from, to)
    ),
  ]);

  // users é global no CRM e não possui org_id. A service role não pode ler o
  // diretório inteiro: buscamos apenas os UUIDs já referenciados por registros
  // da organização acima.
  const relevantUserIds = [
    ...leads.map((lead) => lead.owner_sdr_id),
    ...deals.map((deal) => deal.closer_id),
    ...meetings.filter((meeting) => !meeting.cancelada_em).map((meeting) => meeting.responsavel_id),
    ...leadOwners.map((owner) => owner.user_id),
  ].filter((id): id is string => !!id);
  const userIds = [...new Set(relevantUserIds)];
  const users: CrmUser[] = [];
  for (let i = 0; i < userIds.length; i += IN_CHUNK) {
    const { data, error } = await crm
      .from("users")
      .select("id, nome")
      .in("id", userIds.slice(i, i + IN_CHUNK));
    if (error) throw fail("users referenciados", error);
    users.push(...((data ?? []) as CrmUser[]));
  }

  const dealsByLead = new Map<string, CrmDeal[]>();
  const dealById = new Map<string, CrmDeal>();
  for (const deal of deals) {
    dealById.set(deal.id, deal);
    const list = dealsByLead.get(deal.lead_id);
    if (list) list.push(deal);
    else dealsByLead.set(deal.lead_id, [deal]);
  }

  const meetingByLead = new Map<
    string,
    { data: string; responsavelId: string | null; dealId: string | null }
  >();
  const leadIdsWithMeetingHistory = new Set<string>();
  for (const meeting of meetings) {
    const leadId =
      meeting.referencia_tipo === "lead"
        ? meeting.referencia_id
        : meeting.referencia_tipo === "deal"
          ? dealById.get(meeting.referencia_id)?.lead_id
          : undefined;
    if (!leadId) continue;
    leadIdsWithMeetingHistory.add(leadId);
    if (!meeting.data || meeting.cancelada_em) continue;
    const current = meetingByLead.get(leadId);
    // Várias rodadas (R1, R2…) no mesmo lead: vale a primeira, que é o que a
    // coluna histórica "Data Agendamento" representava.
    if (!current || meeting.data < current.data) {
      meetingByLead.set(leadId, {
        data: meeting.data,
        responsavelId: meeting.responsavel_id,
        dealId: meeting.referencia_tipo === "deal" ? meeting.referencia_id : null,
      });
    }
  }

  const userNameById = new Map(users.map((u) => [u.id, u.nome]));
  const ownerNamesByLead = new Map<string, { sdr: string[]; closer: string[] }>();
  for (const owner of leadOwners) {
    const name = userNameById.get(owner.user_id);
    if (!name || (owner.papel !== "sdr" && owner.papel !== "closer")) continue;
    const names = ownerNamesByLead.get(owner.lead_id) ?? { sdr: [], closer: [] };
    names[owner.papel].push(name);
    ownerNamesByLead.set(owner.lead_id, names);
  }
  const etapaByStageId = new Map(
    stages.map((s) => [s.id, (s.system_key && STAGE_KEY_TO_ETAPA[s.system_key]) || s.nome])
  );
  const attributionByLead = new Map<string, CrmAttribution>();
  for (const attribution of attributions) {
    const current = attributionByLead.get(attribution.lead_id);
    if (
      !current ||
      attribution.capturado_em > current.capturado_em ||
      (attribution.capturado_em === current.capturado_em && attribution.id > current.id)
    ) {
      attributionByLead.set(attribution.lead_id, attribution);
    }
  }

  // SDR/Closer que a migração do Monday não conseguiu virar FK nem preservar
  // nas novas colunas literais sdr_txt/closer_txt.
  //
  // resolveUserByName() (no repo do CRM) só casa nome que já existe em
  // public.users. Para linhas antigas que também não receberam sdr_txt ou
  // closer_txt, o texto original ainda existe dentro de raw_monday. Sem este
  // último resgate, o lead sairia do pódio sem que ninguém tivesse mexido nele.
  //
  // Busca dirigida: só os leads onde falta o nome, e não a base inteira
  // (`raw_monday` é o item cru do Monday, ~1,3 KB por linha — puxá-lo para as
  // ~7.800 linhas seria ~10 MB por sincronização).
  const needsRawMonday = leads
    .filter((lead) => {
      if (lead.monday_item_id === null) return false;
      const owners = ownerNamesByLead.get(lead.id);
      const deal = pickDeal(dealsByLead.get(lead.id) ?? []);
      const meeting = meetingByLead.get(lead.id);
      const hasSdr =
        !!owners?.sdr.length ||
        !!(lead.owner_sdr_id && userNameById.get(lead.owner_sdr_id)) ||
        !!lead.sdr_txt;
      const hasCloser =
        !!owners?.closer.length ||
        !!(deal?.closer_id && userNameById.get(deal.closer_id)) ||
        !!(meeting?.responsavelId && userNameById.get(meeting.responsavelId)) ||
        !!lead.closer_txt;
      return !hasSdr || (!!deal && !hasCloser);
    })
    .map((l) => l.id);

  const rawByLead = new Map<string, Map<string, string>>();
  for (let i = 0; i < needsRawMonday.length; i += IN_CHUNK) {
    const { data, error } = await crm
      .from("leads")
      .select("id, raw_monday")
      .eq("org_id", orgId)
      .in("id", needsRawMonday.slice(i, i + IN_CHUNK));
    if (error) throw fail("leads.raw_monday", error);
    for (const row of (data ?? []) as CrmRawMonday[]) {
      const columns = new Map<string, string>();
      for (const column of row.raw_monday?.column_values ?? []) {
        if (column.text && column.text.trim()) columns.set(column.id, column.text.trim());
      }
      rawByLead.set(row.id, columns);
    }
  }

  return leads.map((lead) => {
    const deal = pickDeal(dealsByLead.get(lead.id) ?? []);
    const meeting = meetingByLead.get(lead.id);
    const owners = ownerNamesByLead.get(lead.id);
    const raw = rawByLead.get(lead.id);
    const modelo = deal?.modelo === "TCV" || deal?.modelo === "MRR" ? deal.modelo : null;

    return {
      source: "crm",
      crm_lead_id: lead.id,
      crm_monday_item_id: lead.monday_item_id,
      // O que o CRM considera "última alteração deste lead": a linha do lead E
      // a do negócio, porque etapa, valor, closer e as duas datas vêm de lá —
      // editar só o valor do negócio não toca em leads.updated_at.
      source_updated_at: latest(lead.updated_at, deal?.updated_at),
      item_name: lead.nome ?? "",
      etapa: (lead.funnel_stage_id && etapaByStageId.get(lead.funnel_stage_id)) || null,
      modelo,
      mrr_value: deal?.valor_bruto ?? null,
      // O CRM passou a consolidar reentradas da mesma pessoa numa única linha:
      // criado_em é a primeira entrada e ultima_entrada_em é a entrada que o
      // quadro atual representa. Setembro precisa seguir a segunda.
      dt_entrada: crmEntryDay(lead),
      // No contrato atual, a data do negócio é a referência da R1. A tabela
      // meetings continua necessária para reuniões ligadas direto ao lead e
      // para saber que uma reunião foi cancelada. Quando as duas linhas do
      // mesmo negócio divergem, como no caso 31/08 x 01/09, vale o deal.
      dt_agenda:
        (meeting?.dealId === deal?.id && deal?.data_agendamento
          ? deal.data_agendamento
          : meeting?.data) ||
        (!leadIdsWithMeetingHistory.has(lead.id) ? deal?.data_agendamento : null) ||
        null,
      dt_fecha: deal?.data_fechamento ?? null,
      closer:
        owners?.closer.join(", ") ||
        (deal?.closer_id && userNameById.get(deal.closer_id)) ||
        (meeting?.responsavelId && userNameById.get(meeting.responsavelId)) ||
        lead.closer_txt ||
        raw?.get(MONDAY_COL.closer) ||
        null,
      sdr:
        owners?.sdr.join(", ") ||
        (lead.owner_sdr_id && userNameById.get(lead.owner_sdr_id)) ||
        lead.sdr_txt ||
        raw?.get(MONDAY_COL.sdr) ||
        null,
      origem: lead.origem,
      criativo: attributionByLead.get(lead.id)?.utm_content ?? null,
      direcao: lead.direcao,
      raw: {
        crm_lead_id: lead.id,
        crm_deal_id: deal?.id ?? null,
        crm_org_id: orgId,
        monday_item_id: lead.monday_item_id,
        entradas: lead.entradas,
      },
      created_at: syncedAt,
      updated_at: syncedAt,
    };
  });
}

export async function syncCrmLeads(): Promise<number> {
  // Carimbo único da execução: é ele que marca quais linhas esta rodada
  // tocou, e portanto quais sobraram para apagar no fim.
  const syncedAt = new Date().toISOString();
  const rows = await buildCrmLeadRows(syncedAt);
  const supabase = createAdminClient();

  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const { error } = await supabase
      .from("leads")
      .upsert(rows.slice(i, i + UPSERT_CHUNK), { onConflict: "crm_lead_id" });
    if (error) throw error;
  }

  // Lead que foi para a lixeira do CRM (ou sumiu de vez) não aparece mais na
  // leitura acima, então não recebeu o carimbo `syncedAt` — e sai daqui
  // também. Restrito a source = 'crm': as linhas do Monday são de outra
  // sincronização e não têm nada a ver com esta limpeza.
  //
  // Só roda se a leitura trouxe alguma coisa. Um CRM que respondesse vazio por
  // erro de permissão apagaria todas as linhas dele em silêncio.
  if (rows.length > 0) {
    const { error } = await supabase.from("leads").delete().eq("source", "crm").lt("updated_at", syncedAt);
    if (error) throw error;
  }

  return rows.length;
}
