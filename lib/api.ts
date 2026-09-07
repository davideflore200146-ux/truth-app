import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL =
process.env.EXPO_PUBLIC_API_BASE_URL || 'https://truth1.onrender.com';

export type SearchType = 'product' | 'hotel' | 'restaurant' | 'flight';

export interface PriceResult {
merchant: string;
merchant_name: string;
price: number;
currency: string;
url: string;
in_stock: boolean;
shipping_cost?: number;
}

export interface SearchResponse {
bestPrice: number;
averagePrice: number;
results: PriceResult[];
}

export async function searchProduct(
query: string,
searchType: SearchType = 'product'
): Promise<SearchResponse> {
try {
console.log('[TRUTH API] Ricerca:', query);
console.log('[TRUTH API] Tipo:', searchType);
console.log('[TRUTH API] URL:', `${API_BASE_URL}/api/analyze`);


const response = await fetch(`${API_BASE_URL}/api/analyze`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({
    query: query.trim(),
    type: searchType,
  }),
});

console.log('[TRUTH API] Status HTTP:', response.status);

const responseText = await response.text();

console.log('[TRUTH API] RISPOSTA TESTO:', responseText);

if (!response.ok) {
  throw new Error(
    `Errore API ${response.status}: ${responseText || 'Risposta vuota'}`
  );
}

let data: any;

try {
  data = JSON.parse(responseText);
} catch (parseError) {
  console.error('[TRUTH API] Errore parsing JSON:', parseError);
  throw new Error('La risposta del server non è un JSON valido.');
}

console.log(
  '[TRUTH API] RISPOSTA COMPLETA:',
  JSON.stringify(data, null, 2)
);

console.log('[TRUTH API] offers:', data?.offers);
console.log('[TRUTH API] results:', data?.results);
console.log('[TRUTH API] products:', data?.products);

let rawOffers: any[] = [];

if (Array.isArray(data?.offers)) {
  rawOffers = data.offers;
} else if (Array.isArray(data?.results)) {
  rawOffers = data.results;
} else if (Array.isArray(data?.products)) {
  rawOffers = data.products;
}

console.log(
  '[TRUTH API] ELEMENTI TROVATI:',
  rawOffers.length
);

const results: PriceResult[] = rawOffers
  .map((offer: any) => {
    const merchant =
      offer?.store ||
      offer?.merchant ||
      offer?.merchant_name ||
      offer?.shop ||
      offer?.seller ||
      'Negozio';

    const merchantName =
      offer?.store ||
      offer?.merchant_name ||
      offer?.merchant ||
      offer?.shop ||
      offer?.seller ||
      'Negozio';

    let priceValue =
      offer?.price ??
      offer?.currentPrice ??
      offer?.current_price ??
      offer?.amount ??
      offer?.sale_price ??
      offer?.salePrice;

    if (typeof priceValue === 'string') {
      priceValue = priceValue
        .replace(/[^\d,.-]/g, '')
        .replace(/\.(?=\d{3}(?:\D|$))/g, '')
        .replace(',', '.');
    }

    const price = Number(priceValue);

    const currency =
      offer?.currency ||
      offer?.currency_code ||
      offer?.currencyCode ||
      'EUR';

    const url =
      offer?.url ||
      offer?.link ||
      offer?.product_url ||
      offer?.productUrl ||
      offer?.href ||
      '';

    const inStock =
      offer?.in_stock !== false &&
      offer?.inStock !== false;

    let shippingCost: number | undefined;

    const shippingValue =
      offer?.shipping_cost ??
      offer?.shippingCost ??
      offer?.shipping;

    if (shippingValue !== undefined && shippingValue !== null) {
      if (typeof shippingValue === 'string') {
        const cleanedShipping = shippingValue
          .replace(/[^\d,.-]/g, '')
          .replace(/\.(?=\d{3}(?:\D|$))/g, '')
          .replace(',', '.');

        const parsedShipping = Number(cleanedShipping);

        if (!Number.isNaN(parsedShipping)) {
          shippingCost = parsedShipping;
        }
      } else {
        const parsedShipping = Number(shippingValue);

        if (!Number.isNaN(parsedShipping)) {
          shippingCost = parsedShipping;
        }
      }
    }

    return {
      merchant: String(merchant),
      merchant_name: String(merchantName),
      price,
      currency: String(currency),
      url: String(url),
      in_stock: inStock,
      ...(shippingCost !== undefined
        ? { shipping_cost: shippingCost }
        : {}),
    };
  })
  .filter((result: PriceResult) => {
    return Number.isFinite(result.price) && result.price > 0;
  });

console.log(
  '[TRUTH API] RISULTATI FINALI:',
  JSON.stringify(results, null, 2)
);

if (results.length === 0) {
  console.warn(
    '[TRUTH API] Nessun risultato con prezzo valido.'
  );
}

const prices = results
  .map((result) => result.price)
  .filter((price) => Number.isFinite(price) && price > 0);

const bestPrice =
  prices.length > 0 ? Math.min(...prices) : 0;

const averagePrice =
  prices.length > 0
    ? prices.reduce((sum, price) => sum + price, 0) /
      prices.length
    : 0;

return {
  bestPrice,
  averagePrice,
  results,
};


} catch (error: any) {
console.error('[TRUTH API] ERRORE:', error);


throw new Error(
  error?.message ||
    'Impossibile ottenere i risultati dal server.'
);


}
}
