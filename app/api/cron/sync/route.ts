import { NextResponse, type NextRequest } from "next/server";
import { runFullSync } from "@/lib/sync";

// See app/api/sync/trigger/route.ts for why this was raised from 60.
export const maxDuration = 300;

// Hit once a day by Vercel Cron (see vercel.json). Protected by a shared
// secret rather than a user session — cron requests never carry a Supabase
// auth cookie. Vercel auto-attaches `Authorization: Bearer $CRON_SECRET` to
// its own cron invocations IF an env var literally named CRON_SECRET is set
// on the project — that's why this isn't a custom-named var.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runFullSync({ triggeredBy: "cron" });
  const hasError = results.some((r) => !r.ok);

  return NextResponse.json({ results }, { status: hasError ? 207 : 200 });
}
