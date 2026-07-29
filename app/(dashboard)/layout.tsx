import { createClient } from "@/lib/supabase/server";
import { getSyncStates, overallSyncHealth } from "@/lib/data/sync-status";
import { TopBar } from "@/components/top-bar";
import { SyncButton } from "@/components/sync-button";
import { LastSyncedBadge } from "@/components/last-synced-badge";
import { StaleDataBanner } from "@/components/stale-data-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const [{ data: { user } }, syncStates] = await Promise.all([supabase.auth.getUser(), getSyncStates(supabase)]);

  const health = overallSyncHealth(syncStates);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 p-4">
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
