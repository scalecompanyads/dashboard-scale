import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runFullSync } from "@/lib/sync";

// The Monday board alone (7000+ items, paged 500 at a time) has been
// observed taking 43-63s depending on Monday's API latency — right at the
// edge of the previous 60s cap, which was killing some manual syncs
// mid-upsert (that's the "não tá puxando os dados corretamente" bug: the
// request got cut off before the sync finished, so the DB never got the
// new rows). Raised well above the worst observed time; Vercel clamps this
// to your plan's actual max if it's lower, so it's a safe no-op if 300s
// isn't available.
export const maxDuration = 300;

// The "Atualizar" button. Requires a signed-in session (checked here, not by
// the cron secret — the browser never sees SYNC_CRON_SECRET).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const results = await runFullSync({ triggeredBy: "manual", triggeredByUser: user.id });
  const hasError = results.some((r) => !r.ok);

  return NextResponse.json({ results }, { status: hasError ? 207 : 200 });
}
