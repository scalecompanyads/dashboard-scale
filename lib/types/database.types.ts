// Hand-authored to match supabase/migrations/*.sql. If the schema changes,
// update this file in the same commit (or regenerate with
// `npx supabase gen types typescript --linked` once the project is linked).

export type SyncSource = "monday" | "meta_ads_account" | "meta_ads_creative";
export type SyncStatus = "running" | "success" | "error";
export type TriggeredBy = "manual" | "cron";

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          monday_item_id: number;
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
          raw: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & {
          monday_item_id: number;
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
          goal_value: number;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["monthly_goals"]["Row"]> & {
          month: string;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_goals"]["Row"]>;
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
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type MetaAdsAccountInsight = Database["public"]["Tables"]["meta_ads_account_insights"]["Row"];
export type MetaAdsCreativeInsight = Database["public"]["Tables"]["meta_ads_creative_insights"]["Row"];
export type MonthlyGoal = Database["public"]["Tables"]["monthly_goals"]["Row"];
export type SyncRun = Database["public"]["Tables"]["sync_runs"]["Row"];
export type SyncStateRow = Database["public"]["Tables"]["sync_state"]["Row"];
