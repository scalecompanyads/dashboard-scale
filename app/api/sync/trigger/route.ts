import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runFullSync } from "@/lib/sync";

export const maxDuration = 60;

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
