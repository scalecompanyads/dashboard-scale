// One-time script — NOT deployed, NOT part of the routine sync.
//
// The routine sync (lib/sync/index.ts) only keeps a trailing window (current
// month + 2 previous) of Meta Ads data fresh, to catch late attribution
// updates without re-fetching the whole history on every run. This script
// backfills everything from FIRST_DATA_MONTH (when the business/Meta Ads
// history configured in the legacy dashboard starts) to the current month,
// once, so the new dashboard's month selector has real data on day one.
//
// Run with:  npx tsx scripts/backfill-meta-ads.ts
// Requires .env.local to have NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// META_ADS_TOKEN, META_AD_ACCOUNT_ID set.

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { FIRST_DATA_MONTH, monthKeyOf } from "../lib/constants";
import { syncMetaAdsAccount, syncMetaAdsCreative } from "../lib/sync/meta-ads";

function allMonthKeysSince(firstMonthKey: string): string[] {
  const [firstYear, firstMonth] = firstMonthKey.split("-").map(Number);
  const now = new Date();
  const keys: string[] = [];
  let y = firstYear;
  let m = firstMonth;
  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    keys.push(monthKeyOf(y, m));
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return keys;
}

async function main() {
  const monthKeys = allMonthKeysSince(FIRST_DATA_MONTH);
  console.log(`Backfilling Meta Ads for ${monthKeys.length} months: ${monthKeys[0]} → ${monthKeys.at(-1)}`);

  const accountRows = await syncMetaAdsAccount(monthKeys);
  console.log(`✓ meta_ads_account_insights: ${accountRows} rows upserted`);

  const creativeRows = await syncMetaAdsCreative(monthKeys);
  console.log(`✓ meta_ads_creative_insights: ${creativeRows} rows upserted`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
