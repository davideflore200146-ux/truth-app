export type SearchType = 'text' | 'url' | 'image';

export type SupportedLanguage = 'it' | 'en' | 'es' | 'pt' | 'fr' | 'de' | 'sc';

export interface Profile {
  id: string;
  language: SupportedLanguage;
  is_premium: boolean;
  premium_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchRecord {
  id: string;
  user_id: string;
  search_type: SearchType;
  query: string;
  image_url: string | null;
  best_price: number | null;
  average_price: number | null;
  currency: string;
  results: PriceResult[] | null;
  created_at: string;
}

export interface PriceResult {
  merchant: string;
  merchant_name: string;
  price: number;
  currency: string;
  url: string;
  in_stock: boolean;
  shipping_cost: number | null;
}

export interface Favorite {
  id: string;
  user_id: string;
  query: string;
  search_type: SearchType;
  target_price: number | null;
  last_best_price: number | null;
  last_checked_at: string | null;
  created_at: string;
}

export interface SearchQuota {
  id: string;
  user_id: string;
  month_year: string;
  search_count: number;
  max_searches: number;
  created_at: string;
}

export interface AffiliateMerchant {
  id: string;
  name: string;
  base_url: string;
  affiliate_tag_param: string;
  affiliate_tag_value: string;
  affiliate_percentage: number;
  logo_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}
