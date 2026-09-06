import { supabase } from '@/lib/supabase';
import { SearchQuota, Profile, PriceResult, SearchType } from '@/types/database';
import { FREE_MONTHLY_SEARCH_LIMIT, getCurrentMonthYear } from '@/constants/config';

// ⚠️ URL del tuo backend Render (Node/Express + Tavily + Groq)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://truth1.onrender.com';

export async function getOrCreateQuota(userId: string): Promise<SearchQuota | null> {
  const monthYear = getCurrentMonthYear();

  const { data: existing } = await supabase
    .from('search_quotas')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', monthYear)
    .maybeSingle();

  if (existing) {
    return existing as SearchQuota;
  }

  const { data: created, error } = await supabase
    .from('search_quotas')
    .insert({
      user_id: userId,
      month_year: monthYear,
      search_count: 0,
      max_searches: FREE_MONTHLY_SEARCH_LIMIT,
    })
    .select('*')
    .maybeSingle();

  if (error) return null;
  return created as SearchQuota;
}

export async function canUserSearch(
  userId: string,
  isPremium: boolean
): Promise<{ allowed: boolean; remaining: number; quota: SearchQuota | null }> {
  if (isPremium) {
    return { allowed: true, remaining: -1, quota: null };
  }

  const quota = await getOrCreateQuota(userId);
  if (!quota) {
    return { allowed: false, remaining: 0, quota: null };
  }

  const remaining = Math.max(0, quota.max_searches - quota.search_count);
  return { allowed: remaining > 0, remaining, quota };
}

export async function incrementSearchCount(userId: string): Promise<void> {
  const quota = await getOrCreateQuota(userId);
  if (!quota) return;

  await supabase
    .from('search_quotas')
    .update({ search_count: quota.search_count + 1 })
    .eq('id', quota.id);
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) return null;
  return data as Profile;
}

export function buildAffiliateUrl(
  baseUrl: string,
  productPath: string,
  tagParam: string,
  tagValue: string
): string {
  if (!tagValue) {
    return `${baseUrl}${productPath}`;
  }
  const separator = productPath.includes('?') ? '&' : '?';
  return `${baseUrl}${productPath}${separator}${tagParam}=${tagValue}`;
}

// ─────────────────────────────────────────────────────────────
// RICERCA PRODOTTO REALE (sostituisce i mockResults)
// ─────────────────────────────────────────────────────────────

export interface ProductSearchResult {
  name: string;
  bestPrice: number;
  averagePrice: number;
  currency: string;
  results: PriceResult[];
  verdict?: string;
  score?: number;
}

/**
 * Chiama il backend TRUTH (Render → Tavily → Groq) per fare
 * un'analisi reale del prodotto cercato, invece di dati finti.
 */
export async function searchProduct(
  query: string,
  searchType: SearchType = 'text'
): Promise<ProductSearchResult> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, type: searchType }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Errore backend (${response.status}): ${errorText || 'analisi fallita'}`
    );
  }

  const data = await response.json();

  // ⚠️ Adatta questi nomi di campo se il tuo backend (prompts.js /
  // ANALYSIS_SYSTEM_PROMPT) usa nomi diversi per l'array delle offerte.
  const rawOffers: any[] = Array.isArray(data.offers) ? data.offers : [];

  const results: PriceResult[] = rawOffers.map((offer) => ({
    merchant: (offer.store || offer.merchant || 'shop').toLowerCase(),
    merchant_name: offer.store || offer.merchant_name || offer.merchant || 'Negozio',
    price: Number(offer.price) || 0,
    currency: offer.currency || 'EUR',
    url: offer.url || offer.link || '',
    in_stock: offer.in_stock !== false,
    shipping_cost:
      offer.shipping_cost !== undefined ? Number(offer.shipping_cost) : 0,
  }));

  // Scarta eventuali offerte senza link reale o senza prezzo valido
  const validResults = results.filter((r) => r.url && r.price > 0);

  const prices = validResults.map((r) => r.price + (r.shipping_cost ?? 0));
  const bestPrice = prices.length ? Math.min(...prices) : Number(data.currentPrice) || 0;
  const averagePrice = prices.length
    ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
    : Number(data.currentPrice) || 0;

  return {
    name: data.name || query,
    bestPrice,
    averagePrice,
    currency: validResults[0]?.currency || 'EUR',
    results: validResults.sort((a, b) => a.price - b.price),
    verdict: data.verdict,
    score: data.score,
  };
}
