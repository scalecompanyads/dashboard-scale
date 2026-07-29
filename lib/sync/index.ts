import "server-only";
import { monthKeyOf } from "@/lib/constants";
import { logSyncError, logSyncStart, logSyncSuccess } from "@/lib/sync/log";
import { syncMetaAdsAccount, syncMetaAdsCreative } from "@/lib/sync/meta-ads";
import { syncMondayBoard } from "@/lib/sync/monday";
import type { SyncSource, TriggeredBy } from "@/lib/types/database.types";

// Mês atual + 2 anteriores — cobre atualizações de atribuição tardia do
// Meta Ads. Histórico mais antigo é populado uma única vez pelo
// scripts/backfill-meta-ads.ts, não pela rotina diária.
const META_SYNC_TRAILING_MONTHS = 3;

function trailingMonthKeys(count: number, from = new Date()): string[] {
  const keys: string[] = [];
  let y = from.getFullYear();
  let m = from.getMonth() + 1;
  for (let i = 0; i < count; i++) {
    keys.push(monthKeyOf(y, m));
    m--;
    if (m < 1) {
      m = 12;
      y--;
    }
  }
  return keys.reverse();
}

export interface SyncResult {
  source: SyncSource;
  ok: boolean;
  rows?: number;
  error?: string;
}

// Orchestrates the 3 sync sources independently: a failure in one (say, the
// Meta Ads token expired) is logged and surfaced in sync_state, but never
// blocks the others and never touches previously-synced rows in that table.
export async function runFullSync(opts: {
  triggeredBy: TriggeredBy;
  triggeredByUser?: string;
}): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  const monthKeys = trailingMonthKeys(META_SYNC_TRAILING_MONTHS);

  const tasks: { source: SyncSource; run: () => Promise<number> }[] = [
    { source: "monday", run: () => syncMondayBoard() },
    { source: "meta_ads_account", run: () => syncMetaAdsAccount(monthKeys) },
    { source: "meta_ads_creative", run: () => syncMetaAdsCreative(monthKeys) },
  ];

  for (const task of tasks) {
    const runId = await logSyncStart(task.source, opts.triggeredBy, opts.triggeredByUser);
    try {
      const rows = await task.run();
      await logSyncSuccess(runId, task.source, rows);
      results.push({ source: task.source, ok: true, rows });
    } catch (err) {
      await logSyncError(runId, task.source, err);
      results.push({ source: task.source, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return results;
}
