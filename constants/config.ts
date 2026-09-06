export const FREE_MONTHLY_SEARCH_LIMIT = 10;

export const PREMIUM_PRICE_MONTHLY = 4.99;
export const PREMIUM_CURRENCY = 'EUR';

export function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
