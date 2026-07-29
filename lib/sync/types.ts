export interface MondayColumnValue {
  id: string;
  text: string | null;
}

export interface MondayItem {
  id: string;
  name: string;
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
}
