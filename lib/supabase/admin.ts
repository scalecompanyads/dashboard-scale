import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Service-role client — bypasses RLS entirely. Used ONLY inside lib/sync/*
// (and the standalone scripts/backfill-meta-ads.ts) to write to leads /
// meta_ads_* / sync_runs / sync_state, which have no insert/update policy
// for anon or authenticated roles. Never import this from a component,
// page, or any client-reachable code path.
//
// Note: deliberately NOT using the `server-only` package here — its plain
// Node/CJS fallback throws unconditionally outside Next's bundler, which
// would break `npm run backfill:meta-ads` (a standalone tsx script). None
// of these modules are ever imported from a Client Component (verified —
// grep for it before reintroducing the import).
let cachedAdmin: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createAdminClient() {
  if (cachedAdmin) return cachedAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be set to run the sync job."
    );
  }

  cachedAdmin = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAdmin;
}
