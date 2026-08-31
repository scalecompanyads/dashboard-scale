// Hand-authored to match supabase/migrations/*.sql. If the schema changes,
// update this file in the same commit (or regenerate with
// `npx supabase gen types typescript --linked` once the project is linked).

export type SyncSource = "monday" | "crm" | "meta_ads_account" | "meta_ads_creative";

// De qual sistema esta linha de `leads` veio. As duas fontes descrevem
// majoritariamente os MESMOS leads (o CRM foi migrado do mesmo board), e é a
// view `leads_effective` que escolhe uma das duas por lead: o board vence
// sempre, o CRM entra com o que o board não tem — ver
// supabase/migrations/0005_board_vence.sql.
export type LeadSource = "monday" | "crm";
export type SyncStatus = "running" | "success" | "error";
export type TriggeredBy = "manual" | "cron";

/** Granularidade de um override manual de meta. O mês fica em monthly_goals. */
export type PeriodType = "week" | "day";

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          row_id: string;
          source: LeadSource;
          /** Preenchido só quando source = 'monday'. */
          monday_item_id: number | null;
          /** Preenchido só quando source = 'crm' — é o leads.id de lá. */
          crm_lead_id: string | null;
          /** Numa linha do CRM, o item do board de onde o lead veio: a chave de junção entre as duas fontes. */
          crm_monday_item_id: number | null;
          /** Quando a linha mudou no sistema de ORIGEM. É o critério de desempate de leads_effective. */
          source_updated_at: string | null;
          item_name: string;
          etapa: string | null;
          modelo: "TCV" | "MRR" | null;
          mrr_value: number | null;
          dt_entrada: string | null;
          dt_agenda: string | null;
          dt_fecha: string | null;
          closer: string | null;
          sdr: string | null;
          origem: string | null;
          criativo: string | null;
          direcao: string | null;
          raw: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & {
          source: LeadSource;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
        Relationships: [];
      };
      meta_ads_account_insights: {
        Row: {
          id: string;
          month: string;
          spend: number;
          impressions: number;
          clicks: number;
          cpc: number | null;
          cpm: number | null;
          ctr: number | null;
          leads_count: number;
          raw: Record<string, unknown> | null;
          synced_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["meta_ads_account_insights"]["Row"]> & {
          month: string;
        };
        Update: Partial<Database["public"]["Tables"]["meta_ads_account_insights"]["Row"]>;
        Relationships: [];
      };
      meta_ads_creative_insights: {
        Row: {
          id: string;
          month: string;
          ad_id: string;
          ad_name: string;
          spend: number;
          impressions: number;
          clicks: number;
          cpc: number | null;
          cpm: number | null;
          ctr: number | null;
          leads_count: number;
          raw: Record<string, unknown> | null;
          synced_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["meta_ads_creative_insights"]["Row"]> & {
          month: string;
          ad_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["meta_ads_creative_insights"]["Row"]>;
        Relationships: [];
      };
      monthly_goals: {
        Row: {
          month: string;
          /** Faturamento (TCV) do mês. */
          goal_value: number;
          /** Taxa de agendamento alvo, 0–100: dos leads, quantos viraram reunião. NÃO é rateada. NULL = sem meta. */
          goal_agendamento_pct: number | null;
          /** Taxa de comparecimento alvo, 0–100. NÃO é rateada. NULL = vale META_PADRAO. */
          goal_comparecimento_pct: number | null;
          /** Taxa de conversão alvo, 0–100: das realizadas, quantas fecharam. NULL = vale META_PADRAO. */
          goal_conversao_pct: number | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["monthly_goals"]["Row"]> & {
          month: string;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_goals"]["Row"]>;
        Relationships: [];
      };
      // Só a EXCEÇÃO ao rateio: semana ou dia com meta digitada à mão. Linha
      // ausente = vale o rateio da meta mensal por dias úteis. Ver
      // supabase/migrations/0006_period_goals.sql.
      period_goals: {
        Row: {
          period_type: PeriodType;
          /** Primeiro dia da janela: o próprio dia, ou a segunda-feira da semana (ou o dia 1º, quando a semana foi recortada na virada do mês). */
          period_key: string;
          /** Coluna GERADA no Postgres: left(period_key, 7). */
          month: string;
          // Só faturamento: as outras duas metas são TAXA, e taxa não se
          // rateia — logo não há o que sobrescrever por semana.
          /** Override de faturamento. NULL = vale o rateio da meta mensal. */
          goal_value: number | null;
          updated_by: string | null;
          updated_at: string;
        };
        // `month` fica FORA do Insert/Update: é `generated always`, e mandá-la
        // no payload faz o PostgREST devolver 428.
        Insert: Omit<Partial<Database["public"]["Tables"]["period_goals"]["Row"]>, "month"> & {
          period_type: PeriodType;
          period_key: string;
        };
        Update: Omit<Partial<Database["public"]["Tables"]["period_goals"]["Row"]>, "month">;
        Relationships: [];
      };
      sync_runs: {
        Row: {
          id: string;
          source: SyncSource;
          status: SyncStatus;
          started_at: string;
          finished_at: string | null;
          rows_upserted: number | null;
          error_message: string | null;
          triggered_by: TriggeredBy;
          triggered_by_user: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["sync_runs"]["Row"]> & {
          source: SyncSource;
          status: SyncStatus;
          triggered_by: TriggeredBy;
        };
        Update: Partial<Database["public"]["Tables"]["sync_runs"]["Row"]>;
        Relationships: [];
      };
      sync_state: {
        Row: {
          source: SyncSource;
          last_success_at: string | null;
          last_error_at: string | null;
          last_error_message: string | null;
          last_status: "success" | "error" | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sync_state"]["Row"]> & {
          source: SyncSource;
        };
        Update: Partial<Database["public"]["Tables"]["sync_state"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      // Um lead por linha, já resolvido entre Monday e CRM. É o que
      // lib/data/leads.ts lê — a tabela `leads` crua tem as duas fontes
      // empilhadas e contaria cada lead migrado duas vezes.
      leads_effective: {
        Row: Database["public"]["Tables"]["leads"]["Row"];
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
}

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type MetaAdsAccountInsight = Database["public"]["Tables"]["meta_ads_account_insights"]["Row"];
export type MetaAdsCreativeInsight = Database["public"]["Tables"]["meta_ads_creative_insights"]["Row"];
export type MonthlyGoal = Database["public"]["Tables"]["monthly_goals"]["Row"];
// Sufixo `Row` de propósito: `PeriodGoal` sem sufixo é a meta JÁ RESOLVIDA
// (override ou rateio) de lib/metrics/goal-pacing.ts, que é outra coisa.
export type PeriodGoalRow = Database["public"]["Tables"]["period_goals"]["Row"];
export type SyncRun = Database["public"]["Tables"]["sync_runs"]["Row"];
export type SyncStateRow = Database["public"]["Tables"]["sync_state"]["Row"];
