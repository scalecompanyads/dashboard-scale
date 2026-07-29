import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoal, upsertGoal } from "@/lib/data/goals";

export async function GET(request: NextRequest) {
  const monthKey = request.nextUrl.searchParams.get("month");
  if (!monthKey) {
    return NextResponse.json({ error: "Parâmetro 'month' obrigatório." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const goalValue = await getGoal(supabase, monthKey);
  return NextResponse.json({ month: monthKey, goalValue });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json();
  const monthKey = body?.month;
  const value = Number(body?.goalValue);

  if (typeof monthKey !== "string" || !/^\d{4}-\d{2}$/.test(monthKey) || Number.isNaN(value) || value < 0) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  await upsertGoal(supabase, monthKey, value, user.id);
  return NextResponse.json({ ok: true });
}
