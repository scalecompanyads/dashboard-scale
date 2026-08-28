import { monthRange } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MetaAdsAccountRow, MetaAdsAdRow } from "@/lib/sync/types";

const GRAPH_API_VERSION = "v21.0";
const LEAD_ACTION_TYPES = ["lead", "onsite_conversion.lead_grouped"];

function monthRangeFromKey(monthKey: string): [string, string] {
  const [year, month] = monthKey.split("-").map(Number);
  return monthRange(year, month);
}

function actionValue(actions: MetaAdsAccountRow["actions"], type: string): number {
  const a = (actions ?? []).find((x) => x.action_type === type);
  return a ? parseFloat(a.value) || 0 : 0;
}

function leadsFromActions(actions: MetaAdsAccountRow["actions"]): number {
  return LEAD_ACTION_TYPES.reduce((sum, type) => sum + actionValue(actions, type), 0);
}

async function fetchInsights(since: string, until: string, level?: "ad") {
  const token = process.env.META_ADS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountId) throw new Error("META_ADS_TOKEN / META_AD_ACCOUNT_ID não configurados.");

  const baseFields = ["spend", "impressions", "clicks", "cpc", "cpm", "ctr", "actions", "action_values"];
  const fields = level === "ad" ? ["ad_id", "ad_name", "campaign_id", "campaign_name", ...baseFields] : baseFields;
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const levelParam = level === "ad" ? "&level=ad&limit=500" : "";
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/act_${accountId}/insights?fields=${fields.join(",")}&time_range=${timeRange}${levelParam}&access_token=${token}`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? "Erro na Graph API do Meta Ads.");
  return data.data ?? [];
}

export async function syncMetaAdsAccount(monthKeys: string[]): Promise<number> {
  const supabase = createAdminClient();
  const rows = [];

  for (const monthKey of monthKeys) {
    const [since, until] = monthRangeFromKey(monthKey);
    const data: MetaAdsAccountRow[] = await fetchInsights(since, until);
    const row = data[0];

    rows.push({
      month: `${monthKey}-01`,
      spend: row ? parseFloat(row.spend ?? "0") || 0 : 0,
      impressions: row ? parseInt(row.impressions ?? "0") || 0 : 0,
      clicks: row ? parseInt(row.clicks ?? "0") || 0 : 0,
      cpc: row?.cpc ? parseFloat(row.cpc) || null : null,
      cpm: row?.cpm ? parseFloat(row.cpm) || null : null,
      ctr: row?.ctr ? parseFloat(row.ctr) || null : null,
      leads_count: row ? leadsFromActions(row.actions) : 0,
      raw: (row ?? null) as unknown as Record<string, unknown> | null,
      synced_at: new Date().toISOString(),
    });
  }

  const { error } = await supabase.from("meta_ads_account_insights").upsert(rows, { onConflict: "month" });
  if (error) throw error;
  return rows.length;
}

export async function syncMetaAdsCreative(monthKeys: string[]): Promise<number> {
  const supabase = createAdminClient();
  const rows = [];

  for (const monthKey of monthKeys) {
    const [since, until] = monthRangeFromKey(monthKey);
    const data: MetaAdsAdRow[] = await fetchInsights(since, until, "ad");

    for (const row of data) {
      const adName = (row.ad_name || "").trim();
      if (!adName) continue;
      rows.push({
        month: `${monthKey}-01`,
        ad_id: row.ad_id,
        ad_name: adName,
        spend: parseFloat(row.spend ?? "0") || 0,
        impressions: parseInt(row.impressions ?? "0") || 0,
        clicks: parseInt(row.clicks ?? "0") || 0,
        cpc: row.cpc ? parseFloat(row.cpc) || null : null,
        cpm: row.cpm ? parseFloat(row.cpm) || null : null,
        ctr: row.ctr ? parseFloat(row.ctr) || null : null,
        leads_count: leadsFromActions(row.actions),
        raw: row as unknown as Record<string, unknown>,
        synced_at: new Date().toISOString(),
      });
    }
  }

  if (rows.length === 0) return 0;
  const { error } = await supabase.from("meta_ads_creative_insights").upsert(rows, { onConflict: "month,ad_id" });
  if (error) throw error;
  return rows.length;
}
