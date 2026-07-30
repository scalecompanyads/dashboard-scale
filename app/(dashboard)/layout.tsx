import { createClient } from "@/lib/supabase/server";
import { getSyncStates, overallSyncHealth } from "@/lib/data/sync-status";
import { TopBar } from "@/components/top-bar";
import { SyncButton } from "@/components/sync-button";
import { LastSyncedBadge } from "@/components/last-synced-badge";
import { StaleDataBanner } from "@/components/stale-data-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const [{ data: { user } }, syncStates] = await Promise.all([
    supabase.auth.getUser(),
    // Falls back to "never synced" instead of crashing the whole layout —
    // the most common cause is the Supabase migrations not being applied
    // yet (supabase/migrations/*.sql), which would otherwise take down
    // every page under (dashboard) with a raw Postgrest error.
    getSyncStates(supabase).catch(() => []),
  ]);

  const health = overallSyncHealth(syncStates);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[2200px] flex-col gap-5 p-4 md:p-5 2xl:p-8">
      <TopBar userEmail={user?.email ?? null}>
        <LastSyncedBadge lastSuccessAt={health.lastSuccessAt} hasError={health.hasError} />
        <SyncButton />
      </TopBar>

      <StaleDataBanner
        lastSuccessAt={health.lastSuccessAt}
        hasError={health.hasError}
        errorMessage={health.errorMessage}
      />

      {children}
    </div>
  );
}
