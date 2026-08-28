import { MONDAY_BOARD_ID, MONDAY_COL } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LeadInsert } from "@/lib/types/database.types";
import type { MondayGqlResponse, MondayItem, MondayItemsPage } from "@/lib/sync/types";

const MONDAY_API_URL = "https://api.monday.com/v2";
const PAGE_SIZE = 500;

const COLS_LIST = Object.values(MONDAY_COL)
  .map((c) => `"${c}"`)
  .join(",");

async function mondayGql(query: string): Promise<MondayGqlResponse> {
  const token = process.env.MONDAY_TOKEN;
  if (!token) throw new Error("MONDAY_TOKEN não configurado.");

  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      "API-Version": "2024-10",
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`Monday API HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "Erro desconhecido na API do Monday.");
  return json.data;
}

// Full board re-fetch every run (see supabase/migrations + lib/sync/index.ts
// for the rationale: a lead's etapa can change independent of any date
// column, so there is no clean "updated since X" filter to page against).
async function fetchAllItems(): Promise<MondayItem[]> {
  const items: MondayItem[] = [];
  let cursor: string | null = null;

  do {
    const query: string = cursor
      ? `query {
          next_items_page(limit: ${PAGE_SIZE}, cursor: "${cursor}") {
            cursor
            items { id name updated_at column_values(ids: [${COLS_LIST}]) { id text } }
          }
        }`
      : `query {
          boards(ids: [${MONDAY_BOARD_ID}]) {
            items_page(limit: ${PAGE_SIZE}) {
              cursor
              items { id name updated_at column_values(ids: [${COLS_LIST}]) { id text } }
            }
          }
        }`;

    const data = await mondayGql(query);
    const page: MondayItemsPage | undefined = cursor ? data.next_items_page : data.boards?.[0]?.items_page;
    if (!page) throw new Error("Resposta inesperada da API do Monday (items_page ausente).");
    items.push(...page.items);
    cursor = page.cursor;
  } while (cursor);

  return items;
}

function colText(item: MondayItem, colId: string): string | null {
  return item.column_values.find((c) => c.id === colId)?.text || null;
}

function mapItemToRow(item: MondayItem): LeadInsert {
  const modeloText = colText(item, MONDAY_COL.modelo);
  const mrrText = colText(item, MONDAY_COL.mrr);
  const now = new Date().toISOString();

  return {
    source: "monday",
    monday_item_id: Number(item.id),
    // Carimbo do board, não desta tabela. Já foi o critério de desempate
    // entre as duas fontes; hoje é diagnóstico ("de quando é esta cópia?"),
    // porque o board vence sempre (0005_board_vence.sql).
    source_updated_at: item.updated_at,
    item_name: item.name ?? "",
    etapa: colText(item, MONDAY_COL.etapa),
    modelo: modeloText === "TCV" || modeloText === "MRR" ? modeloText : null,
    mrr_value: mrrText ? parseFloat(mrrText) || null : null,
    dt_entrada: colText(item, MONDAY_COL.dtEntrada),
    dt_agenda: colText(item, MONDAY_COL.dtAgenda),
    dt_fecha: colText(item, MONDAY_COL.dtFecha),
    closer: colText(item, MONDAY_COL.closer),
    sdr: colText(item, MONDAY_COL.sdr),
    origem: colText(item, MONDAY_COL.origem),
    criativo: colText(item, MONDAY_COL.criativo),
    direcao: colText(item, MONDAY_COL.direcao),
    raw: item as unknown as Record<string, unknown>,
    created_at: now,
    updated_at: now,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function syncMondayBoard(): Promise<number> {
  const items = await fetchAllItems();
  const rows = items.map(mapItemToRow);
  const supabase = createAdminClient();

  for (const batch of chunk(rows, 500)) {
    const { error } = await supabase.from("leads").upsert(batch, { onConflict: "monday_item_id" });
    if (error) throw error;
  }

  return rows.length;
}
