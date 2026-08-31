import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMonthlyGoals,
  getPeriodGoals,
  upsertGoal,
  upsertPeriodGoal,
  clearPeriodGoal,
  isGoalMetric,
  isPeriodMetric,
  type GoalMetric,
} from "@/lib/data/goals";
import { parseISODate, toISODate, weekdayOf } from "@/lib/constants";

// Três metas, duas granularidades, um endpoint.
//
//   { month: '2026-08', goalValue: 180000 }                          -> meta de TCV (metric padrão)
//   { month: '2026-08', metric: 'agendamentos', goalValue: 120 }
//   { month: '2026-08', metric: 'comparecimento', goalValue: 70 }    -> taxa 0–100
//   { periodType: 'week', periodKey: '2026-08-10', goalValue: 25000 }
//   { periodType: 'week', periodKey: '2026-08-10', metric: 'agendamentos', goalValue: 30 }
//   { ...periodo, goalValue: null }                                  -> apaga o override
//
// `metric` ausente = 'tcv', então o corpo antigo continua valendo sem mudança.
//
// A taxa de comparecimento não aceita período: taxa não se rateia, 70% é 70%
// em qualquer recorte. E o DIA não aceita override em métrica nenhuma — quem
// planeja, planeja a semana.

const MONTH_KEY = /^\d{4}-\d{2}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A regex sozinha aceita 2026-02-31. O round-trip pelo parseISODate não. */
function isRealDate(s: unknown): s is string {
  return typeof s === "string" && ISO_DATE.test(s) && toISODate(parseISODate(s)) === s;
}

/**
 * Semana só pode ser chaveada pelo primeiro dia da janela: a segunda-feira,
 * ou o dia 1º quando a semana atravessa a virada do mês e foi recortada.
 *
 * A UI nunca manda outra coisa — mas este endpoint é a única superfície
 * gravável que usuário autenticado tem, e uma chave torta aqui viraria uma
 * meta órfã que nenhuma tela consegue ler nem apagar depois.
 */
function isWeekStart(s: string) {
  return weekdayOf(s) === 1 || parseISODate(s).getUTCDate() === 1;
}

/** Teto por métrica: taxa é 0–100, as outras só não podem ser negativas. */
function isValidValue(metric: GoalMetric, value: number) {
  if (Number.isNaN(value) || value < 0) return false;
  return metric !== "comparecimento" || value <= 100;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const periodType = params.get("periodType");
  const periodKey = params.get("periodKey");

  // Ramifica no período PRIMEIRO, igual ao POST — um payload com os dois
  // campos tem que falar do override, nunca do mês em silêncio.
  if (periodType !== null || periodKey !== null) {
    if (periodType !== "week" || !isRealDate(periodKey)) {
      return NextResponse.json({ error: "Parâmetros de período inválidos." }, { status: 400 });
    }
    return NextResponse.json({ periodType, periodKey, goals: await getPeriodGoals(supabase, "week", periodKey) });
  }

  const monthKey = params.get("month");
  if (!monthKey) {
    return NextResponse.json({ error: "Parâmetro 'month' obrigatório." }, { status: 400 });
  }

  return NextResponse.json({ month: monthKey, goals: await getMonthlyGoals(supabase, monthKey) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json();
  const metric: unknown = body?.metric ?? "tcv";
  if (!isGoalMetric(metric)) {
    return NextResponse.json({ error: "Métrica desconhecida." }, { status: 400 });
  }

  if (body?.periodType !== undefined || body?.periodKey !== undefined) {
    const { periodType, periodKey } = body;
    // Só semana: o dia não recebe meta manual.
    if (periodType !== "week" || !isRealDate(periodKey) || !isWeekStart(periodKey)) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }
    if (!isPeriodMetric(metric)) {
      return NextResponse.json(
        { error: "A meta de comparecimento é uma taxa e só existe no mês." },
        { status: 400 }
      );
    }

    // null (ou string vazia, que é o que um input limpo manda) apaga o
    // override em vez de gravar zero.
    if (body.goalValue === null || body.goalValue === "") {
      await clearPeriodGoal(supabase, "week", periodKey);
      return NextResponse.json({ ok: true, cleared: true });
    }

    const value = Number(body.goalValue);
    if (!isValidValue(metric, value)) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    await upsertPeriodGoal(supabase, "week", periodKey, metric, value, user.id);
    return NextResponse.json({ ok: true });
  }

  const monthKey = body?.month;
  if (typeof monthKey !== "string" || !MONTH_KEY.test(monthKey)) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  // Apagar a meta mensal de agendamento/comparecimento devolve o "sem meta".
  if (body.goalValue === null || body.goalValue === "") {
    if (metric === "tcv") {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }
    await upsertGoal(supabase, monthKey, metric, null, user.id);
    return NextResponse.json({ ok: true, cleared: true });
  }

  const value = Number(body.goalValue);
  if (!isValidValue(metric, value)) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  await upsertGoal(supabase, monthKey, metric, value, user.id);
  return NextResponse.json({ ok: true });
}
