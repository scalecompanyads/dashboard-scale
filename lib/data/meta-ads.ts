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

export async function getMetaAdsCreativeSpend(supabase: DB, monthKey: string): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("meta_ads_creative_insights")
    .select("ad_name, spend")
    .eq("month", `${monthKey}-01`);
  if (error) throw error;

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.ad_name, (map.get(row.ad_name) ?? 0) + row.spend);
  }
  return map;
}
