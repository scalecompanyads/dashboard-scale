export interface MondayColumnValue {
  id: string;
  text: string | null;
}

export interface MondayItem {
  id: string;
  name: string;
  // Última alteração do item NO BOARD. É metade do desempate entre as duas
  // fontes de lead (a outra metade vem do CRM) — ver a view leads_effective
  // em supabase/migrations/0004_crm_as_second_source.sql.
  updated_at: string | null;
  column_values: MondayColumnValue[];
}

export interface MondayItemsPage {
  cursor: string | null;
  items: MondayItem[];
}

export interface MondayGqlResponse {
  next_items_page?: MondayItemsPage;
  boards?: { items_page: MondayItemsPage }[];
}

export interface MetaAdsAction {
  action_type: string;
  value: string;
}

export interface MetaAdsAccountRow {
  spend?: string;
  impressions?: string;
  clicks?: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  actions?: MetaAdsAction[];
}

export interface MetaAdsAdRow extends MetaAdsAccountRow {
  ad_id: string;
  ad_name: string;
  // A campanha não tem coluna própria em meta_ads_creative_insights — vem
  // junto no `raw` (que guarda a linha crua da Graph API) e é lida de lá
  // por getMetaAdsCreativeSpend. Mesmo ad_name aparece em campanhas
  // diferentes, então é campaign_id que separa de verdade.
  campaign_id?: string;
  campaign_name?: string;
}
