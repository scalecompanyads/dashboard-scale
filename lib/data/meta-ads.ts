import type { SupabaseClient } from "@supabase/supabase-js";
import { fullMonthKey, type DateRange } from "@/lib/constants";
import type { Database, MetaAdsAccountInsight } from "@/lib/types/database.types";
import type { MetaAdsAction, MetaAdsAdRow } from "@/lib/sync/types";

type DB = SupabaseClient<Database>;

export type AccountInsight = Pick<MetaAdsAccountInsight, "spend" | "leads_count">;

const EMPTY_ACCOUNT_INSIGHT: AccountInsight = {
  spend: 0,
  leads_count: 0,
};

export async function getMetaAdsAccountInsight(supabase: DB, monthKey: string): Promise<AccountInsight> {
  const { data, error } = await supabase
    .from("meta_ads_account_insights")
    .select("spend, leads_count")
    .eq("month", `${monthKey}-01`)
    .maybeSingle();
  if (error) throw error;
  return data ?? EMPTY_ACCOUNT_INSIGHT;
}

export interface CreativeSpendInfo {
  spend: number;
  adId: string;
  /** Campanha do anúncio, quando conhecida — alimenta a tabela "Por Campanha". */
  campaignName: string | null;
}

/**
 * ad_name -> spend agregado + ad_id + campanha, para o mês.
 *
 * O mesmo ad_name aparece em várias linhas (um ad_id por adset/campanha),
 * por isso o spend é somado por nome. Quando um criativo roda em mais de
 * uma campanha ele fica registrado na campanha onde gastou mais: a
 * atribuição de leads é por NOME de criativo (é só isso que o Monday
 * grava), então não há como dividir um lead entre campanhas.
 */
export async function getMetaAdsCreativeSpend(supabase: DB, monthKey: string): Promise<Map<string, CreativeSpendInfo>> {
  const { data, error } = await supabase
    .from("meta_ads_creative_insights")
    .select("ad_name, ad_id, spend, raw")
    .eq("month", `${monthKey}-01`);
  if (error) throw error;

  return buildCreativeSpendMap(
    (data ?? []).map((row) => ({
      adName: row.ad_name,
      adId: row.ad_id,
      spend: row.spend,
      campaignName: campaignNameOf(row.raw),
    }))
  );
}

interface AdSpendRow {
  adName: string;
  adId: string;
  spend: number;
  campaignName: string | null;
}

// A campanha não tem coluna própria na tabela — ela chega junto no `raw`
// (linha crua da Graph API), desde o momento em que o sync passou a pedir
// campaign_name. Meses sincronizados antes disso ficam sem, e caem em
// "Sem campanha" até o próximo backfill.
function campaignNameOf(raw: unknown): string | null {
  const name = (raw as { campaign_name?: unknown } | null)?.campaign_name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

function buildCreativeSpendMap(rows: AdSpendRow[]): Map<string, CreativeSpendInfo> {
  // spend por (ad_name, campanha) serve só para eleger a campanha dominante
  // do criativo — o valor que sai no mapa é o spend total do nome.
  const byCampaign = new Map<string, Map<string, number>>();
  const map = new Map<string, CreativeSpendInfo>();

  for (const row of rows) {
    const existing = map.get(row.adName);
    if (existing) existing.spend += row.spend;
    else map.set(row.adName, { spend: row.spend, adId: row.adId, campaignName: null });

    if (row.campaignName) {
      const tally = byCampaign.get(row.adName) ?? new Map<string, number>();
      tally.set(row.campaignName, (tally.get(row.campaignName) ?? 0) + row.spend);
      byCampaign.set(row.adName, tally);
    }
  }

  for (const [adName, tally] of byCampaign) {
    const dominant = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    if (dominant) map.get(adName)!.campaignName = dominant[0];
  }
  return map;
}

// ---------------------------------------------------------------------------
// Intervalos livres
//
// meta_ads_*_insights só guarda totais MENSAIS, então um recorte como
// "10/08 a 20/08" simplesmente não existe no banco. Nesses casos o spend vem
// direto da Graph API com o time_range exato; mês fechado continua saindo do
// banco (rápido, e não depende do token no momento do request).
// ---------------------------------------------------------------------------

const GRAPH_API_VERSION = "v21.0";
const LEAD_ACTION_TYPES = ["lead", "onsite_conversion.lead_grouped"];
const RANGE_INSIGHTS_TTL = 600; // s — recorte livre bate na Graph API; 10 min de cache evita refetch a cada troca de aba

function leadsFromActions(actions: MetaAdsAction[] | undefined): number {
  return LEAD_ACTION_TYPES.reduce((sum, type) => {
    const a = (actions ?? []).find((x) => x.action_type === type);
    return sum + (a ? parseFloat(a.value) || 0 : 0);
  }, 0);
}

async function fetchRangeInsights(range: DateRange, level?: "ad"): Promise<MetaAdsAdRow[]> {
  const token = process.env.META_ADS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) throw new Error("META_ADS_TOKEN / META_AD_ACCOUNT_ID não configurados.");

  const baseFields = ["spend", "impressions", "clicks", "actions"];
  const fields = level === "ad" ? ["ad_id", "ad_name", "campaign_id", "campaign_name", ...baseFields] : baseFields;
  const timeRange = encodeURIComponent(JSON.stringify({ since: range.from, until: range.to }));
  const levelParam = level === "ad" ? "&level=ad&limit=500" : "";
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/act_${accountId}/insights?fields=${fields.join(",")}&time_range=${timeRange}${levelParam}&access_token=${token}`;

  const res = await fetch(url, { next: { revalidate: RANGE_INSIGHTS_TTL } });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? "Erro na Graph API do Meta Ads.");
  return data.data ?? [];
}

export interface RangeInsights {
  account: AccountInsight;
  creatives: Map<string, CreativeSpendInfo>;
  /** true quando o spend veio da Graph API ao vivo (recorte que não é mês fechado). */
  live: boolean;
}

export async function getMetaAdsRangeInsights(supabase: DB, range: DateRange): Promise<RangeInsights> {
  const monthKey = fullMonthKey(range);
  if (monthKey) {
    const [account, creatives] = await Promise.all([
      getMetaAdsAccountInsight(supabase, monthKey),
      getMetaAdsCreativeSpend(supabase, monthKey),
    ]);
    return { account, creatives, live: false };
  }

  try {
    const [accountRows, adRows] = await Promise.all([fetchRangeInsights(range), fetchRangeInsights(range, "ad")]);
    const acc = accountRows[0];
    return {
      account: {
        spend: acc ? parseFloat(acc.spend ?? "0") || 0 : 0,
        leads_count: acc ? leadsFromActions(acc.actions) : 0,
      },
      creatives: buildCreativeSpendMap(
        adRows
          .filter((row) => (row.ad_name || "").trim())
          .map((row) => ({
            adName: row.ad_name.trim(),
            adId: row.ad_id,
            spend: parseFloat(row.spend ?? "0") || 0,
            campaignName: (row.campaign_name || "").trim() || null,
          }))
      ),
      live: true,
    };
  } catch (err) {
    // Sem spend a página ainda vale: leads/agendamentos/fechamentos vêm do
    // Supabase e continuam corretos — só os custos ficam zerados.
    console.error("getMetaAdsRangeInsights: falha ao buscar insights do intervalo", range, err);
    return { account: { spend: 0, leads_count: 0 }, creatives: new Map(), live: true };
  }
}

const THUMBNAIL_BATCH_SIZE = 50; // Graph API batch request cap

/** ad_id -> creative thumbnail URL, fetched straight from Meta (not stored — creatives don't carry an image column yet). One batch request per 50 ads instead of one round-trip each. */
export async function getCreativeThumbnails(adIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const token = process.env.META_ADS_TOKEN;
  const ids = [...new Set(adIds)].filter(Boolean);
  if (!token || ids.length === 0) return map;

  try {
    for (let i = 0; i < ids.length; i += THUMBNAIL_BATCH_SIZE) {
      const chunk = ids.slice(i, i + THUMBNAIL_BATCH_SIZE);
      const batch = chunk.map((id) => ({ method: "GET", relative_url: `${id}?fields=creative{thumbnail_url}` }));

      const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ access_token: token, batch: JSON.stringify(batch) }),
      });
      const results = await res.json();
      if (!Array.isArray(results)) {
        // Graph API returns a single {error: {...}} object (not an array)
        // when the whole batch call itself is rejected — e.g. bad/expired
        // token, missing permission. Silently falling back to initials
        // everywhere made this invisible; log it so it shows up in Vercel's
        // function logs instead of looking like "thumbnails just don't work".
        console.error("getCreativeThumbnails: unexpected batch response", results);
        continue;
      }

      results.forEach((r: { code: number; body: string }, idx: number) => {
        if (r.code !== 200) {
          console.error(`getCreativeThumbnails: ad ${chunk[idx]} returned ${r.code}`, r.body);
          return;
        }
        try {
          const url = JSON.parse(r.body)?.creative?.thumbnail_url;
          if (url) map.set(chunk[idx], url);
        } catch (err) {
          console.error(`getCreativeThumbnails: couldn't parse body for ad ${chunk[idx]}`, err);
        }
      });
    }
  } catch (err) {
    // network hiccup — thumbnails are a nice-to-have, never worth failing the page for
    console.error("getCreativeThumbnails: fetch failed", err);
  }

  return map;
}
