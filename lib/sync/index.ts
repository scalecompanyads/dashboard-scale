import { monthKeyOf } from "@/lib/constants";
import { formatSyncError, logSyncError, logSyncStart, logSyncSuccess } from "@/lib/sync/log";
import { syncMetaAdsAccount, syncMetaAdsCreative } from "@/lib/sync/meta-ads";
import { syncMondayBoard } from "@/lib/sync/monday";
import { syncCrmLeads } from "@/lib/sync/crm";
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
//
// Run concurrently (not one after another) — the Monday board fetch alone
// (7000+ items, paged 500 at a time) was already taking 43-63s on its own
// depending on Monday's API latency, and running it sequentially before the
// Meta Ads calls pushed some manual triggers right past the route's serverless
// timeout, killing the sync mid-upsert. Running all 3 in parallel means the
// total wall-clock time is roughly the SLOWEST source, not the sum of all 3.
export async function runFullSync(opts: {
  triggeredBy: TriggeredBy;
  triggeredByUser?: string;
}): Promise<SyncResult[]> {
  const monthKeys = trailingMonthKeys(META_SYNC_TRAILING_MONTHS);

  const tasks: { source: SyncSource; run: () => Promise<number> }[] = [
    { source: "monday", run: () => syncMondayBoard() },
    // Segunda fonte de leads, ao lado do board. As duas gravam na MESMA
    // tabela sem se atropelar (cada uma tem a sua chave de conflito) e é a
    // view leads_effective que escolhe uma das duas por lead, pelo carimbo
    // de alteração da origem. Por isso podem continuar em paralelo: o
    // resultado não depende de qual terminar primeiro.
    { source: "crm", run: () => syncCrmLeads() },
    { source: "meta_ads_account", run: () => syncMetaAdsAccount(monthKeys) },
    { source: "meta_ads_creative", run: () => syncMetaAdsCreative(monthKeys) },
  ];

  return Promise.all(
    tasks.map(async (task): Promise<SyncResult> => {
      // runId itself can fail to obtain (e.g. admin client misconfigured) —
      // guard the logSyncError call below so that failure doesn't also throw
      // and take down the whole Promise.all with an unhandled rejection.
      let runId: string | undefined;
      try {
        runId = await logSyncStart(task.source, opts.triggeredBy, opts.triggeredByUser);
        const rows = await task.run();
        await logSyncSuccess(runId, task.source, rows);
        return { source: task.source, ok: true, rows };
      } catch (err) {
        if (runId) await logSyncError(runId, task.source, err);
        return { source: task.source, ok: false, error: formatSyncError(err) };
      }
    })
  );
}
