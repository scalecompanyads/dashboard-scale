import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MetaAdsAccountInsight } from "@/lib/types/database.types";

type DB = SupabaseClient<Database>;

const EMPTY_ACCOUNT_INSIGHT: Pick<MetaAdsAccountInsight, "spend" | "leads_count"> = {
  spend: 0,
  leads_count: 0,
};

export async function getMetaAdsAccountInsight(
  supabase: DB,
  monthKey: string
): Promise<Pick<MetaAdsAccountInsight, "spend" | "leads_count">> {
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
}

export async function getMetaAdsCreativeSpend(supabase: DB, monthKey: string): Promise<Map<string, CreativeSpendInfo>> {
  const { data, error } = await supabase
    .from("meta_ads_creative_insights")
    .select("ad_name, ad_id, spend")
    .eq("month", `${monthKey}-01`);
  if (error) throw error;

  const map = new Map<string, CreativeSpendInfo>();
  for (const row of data ?? []) {
    const existing = map.get(row.ad_name);
    if (existing) existing.spend += row.spend;
    else map.set(row.ad_name, { spend: row.spend, adId: row.ad_id });
  }
  return map;
}

const GRAPH_API_VERSION = "v21.0";
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
