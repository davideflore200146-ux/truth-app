import { supabase } from '@/lib/supabase';
import { SearchQuota, Profile } from '@/types/database';
import { FREE_MONTHLY_SEARCH_LIMIT, getCurrentMonthYear } from '@/constants/config';

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

export async function canUserSearch(userId: string, isPremium: boolean): Promise<{ allowed: boolean; remaining: number; quota: SearchQuota | null }> {
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
