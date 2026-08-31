import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PeriodType } from "@/lib/types/database.types";

type DB = SupabaseClient<Database>;

export type { PeriodType };

// Replaces the legacy dashboard's localStorage "metas_override" — shared
// across the whole team instead of living in one browser.
//
// São QUATRO metas mensais, e só uma delas é quantidade:
//
//   tcv            faturamento em R$   rateado por dia útil, aceita override semanal
//   agendamento    taxa 0–100          leads      -> agendadas
//   comparecimento taxa 0–100          agendadas  -> realizadas
//   conversao      taxa 0–100          realizadas -> fechados
//
// As três taxas NÃO se rateiam — 40% é 40% num dia, numa semana e no mês — e
// por isso vivem só no mês. Uma "meta de taxa da semana" seria a mesma taxa
// escrita duas vezes.
//
// Nas taxas, `null` não é "sem meta": é "vale o padrão do time"
// (META_PADRAO, em lib/constants.ts). Quem lê resolve o padrão; aqui devolve
// cru, para a tela poder dizer se o número foi digitado ou herdado.

export type GoalMetric = "tcv" | "agendamento" | "comparecimento" | "conversao";

/** Só o faturamento existe por período: é a única meta que se divide. */
export type PeriodMetric = "tcv";

type MonthPatch = Database["public"]["Tables"]["monthly_goals"]["Update"];
type PeriodPatch = Database["public"]["Tables"]["period_goals"]["Update"];

// Escrito com `if` em vez de uma chave computada (`{ [coluna]: valor }`) de
// propósito: chave computada alarga o objeto para um index signature, que os
// tipos gerados do Supabase rejeitam. Assim cada ramo continua estreito.
function monthPatch(metric: GoalMetric, value: number | null): MonthPatch {
  // `goal_value` é NOT NULL na tabela — "apagar" a meta de faturamento é
  // zerá-la. Nas taxas, null devolve o mês ao padrão do time.
  if (metric === "tcv") return { goal_value: value ?? 0 };
  if (metric === "agendamento") return { goal_agendamento_pct: value };
  if (metric === "comparecimento") return { goal_comparecimento_pct: value };
  return { goal_conversao_pct: value };
}

function periodPatch(_metric: PeriodMetric, value: number | null): PeriodPatch {
  return { goal_value: value };
}

export function isGoalMetric(v: unknown): v is GoalMetric {
  return v === "tcv" || v === "agendamento" || v === "comparecimento" || v === "conversao";
}

export function isPeriodMetric(v: unknown): v is PeriodMetric {
  return v === "tcv";
}

export interface MonthlyGoals {
  /** 0 quando não definida — é assim que a página trata "sem meta" de faturamento. */
  tcv: number;
  /** null = vale META_PADRAO. Taxa 0–100: dos leads, quantos viraram reunião. */
  agendamentoPct: number | null;
  /** null = vale META_PADRAO. Taxa 0–100: dos agendados, quantos apareceram. */
  comparecimentoPct: number | null;
  /** null = vale META_PADRAO. Taxa 0–100: das realizadas, quantas fecharam. */
  conversaoPct: number | null;
}

export async function getMonthlyGoals(supabase: DB, monthKey: string): Promise<MonthlyGoals> {
  const { data, error } = await supabase
    .from("monthly_goals")
    .select("goal_value, goal_agendamento_pct, goal_comparecimento_pct, goal_conversao_pct")
    .eq("month", monthKey)
    .maybeSingle();
  if (error) throw error;
  return {
    tcv: data?.goal_value ?? 0,
    agendamentoPct: data?.goal_agendamento_pct ?? null,
    comparecimentoPct: data?.goal_comparecimento_pct ?? null,
    conversaoPct: data?.goal_conversao_pct ?? null,
  };
}

export async function getGoal(supabase: DB, monthKey: string): Promise<number> {
  return (await getMonthlyGoals(supabase, monthKey)).tcv;
}

/** `null` apaga a meta (volta a "não definida"). Para tcv, null vira 0: a coluna é NOT NULL. */
export async function upsertGoal(
  supabase: DB,
  monthKey: string,
  metric: GoalMetric,
  value: number | null,
  userId: string
) {
  const { error } = await supabase.from("monthly_goals").upsert({
    month: monthKey,
    ...monthPatch(metric, value),
    updated_by: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Overrides de semana
//
// A meta da semana é, por padrão, um rateio da meta mensal por dias úteis
// (ver deriveGoal em lib/metrics/goal-pacing.ts). A tabela period_goals guarda
// só a exceção — a semana do feriado, a do evento. Coluna nula = vale o
// rateio, e é por isso que a leitura devolve `null` em vez de 0: "sem
// override" e "meta zero" são coisas diferentes.
//
// O DIA não recebe override: quem planeja, planeja a semana. A tabela ainda
// aceita period_type = 'day' (a checagem da 0006 não mudou), mas nenhuma tela
// escreve isso hoje.
// ---------------------------------------------------------------------------

export interface PeriodGoals {
  tcv: number | null;
}

export async function getPeriodGoals(supabase: DB, type: PeriodType, key: string): Promise<PeriodGoals> {
  const { data, error } = await supabase
    .from("period_goals")
    .select("goal_value")
    .eq("period_type", type)
    .eq("period_key", key)
    .maybeSingle();
  if (error) throw error;
  return { tcv: data?.goal_value ?? null };
}

export async function upsertPeriodGoal(
  supabase: DB,
  type: PeriodType,
  key: string,
  metric: PeriodMetric,
  value: number,
  userId: string
) {
  const { error } = await supabase.from("period_goals").upsert(
    {
      period_type: type,
      period_key: key,
      ...periodPatch(metric, value),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
    // onConflict EXPLÍCITO: o supabase-js não infere PK composta, e sem isto
    // o upsert se comporta como insert e estoura na segunda vez que a mesma
    // semana for salva. O upsertGoal acima escapa disso só porque `month` é
    // PK de coluna única.
    //
    // A coluna da OUTRA métrica fica de fora do payload de propósito: o
    // PostgREST só sobrescreve o que recebe, então gravar a meta de
    // agendamento não apaga o override de faturamento da mesma semana.
    { onConflict: "period_type,period_key" }
  );
  if (error) throw error;
}

/** Remove o override e devolve a semana ao rateio da meta mensal. */
export async function clearPeriodGoal(supabase: DB, type: PeriodType, key: string) {
  const { error } = await supabase.from("period_goals").delete().eq("period_type", type).eq("period_key", key);
  if (error) throw error;
}
