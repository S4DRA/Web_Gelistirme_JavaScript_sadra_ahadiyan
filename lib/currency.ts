export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "TRY",
  "GBP",
  "IRR",
  "AED",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
  "SAR",
  "CNY",
  "INR",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

type RatesResponse = {
  base_code?: string;
  rates?: Record<string, number>;
  result?: string;
  time_last_update_utc?: string;
};

const rateCache = new Map<string, { expiresAt: number; rates: Record<string, number> }>();
const CACHE_TTL_MS = 1000 * 60 * 30;

export function normalizeCurrency(value: unknown, fallback = "USD") {
  if (typeof value !== "string") {
    return fallback;
  }

  const currency = value.trim().toUpperCase();
  return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)
    ? currency
    : fallback;
}

export function isSupportedCurrency(value: unknown) {
  return (
    typeof value === "string" &&
    SUPPORTED_CURRENCIES.includes(value.trim().toUpperCase() as SupportedCurrency)
  );
}

export function formatCurrencyValue(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    currency: normalizeCurrency(currency),
    maximumFractionDigits: 2,
    style: "currency",
  }).format(amount);
}

export async function getExchangeRates(baseCurrency: string) {
  const base = normalizeCurrency(baseCurrency);
  const cached = rateCache.get(base);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.rates;
  }

  const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Exchange rate service is unavailable.");
  }

  const data = (await response.json()) as RatesResponse;

  if (data.result && data.result !== "success") {
    throw new Error("Exchange rate service returned an invalid response.");
  }

  const rates = data.rates ?? {};

  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency !== base && typeof rates[currency] !== "number") {
      throw new Error(`Exchange rate for ${currency} is unavailable.`);
    }
  }

  const normalizedRates = {
    ...rates,
    [base]: 1,
  };

  rateCache.set(base, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    rates: normalizedRates,
  });

  return normalizedRates;
}

export async function convertCurrencyAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
) {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);

  if (from === to) {
    return {
      amount,
      exchangeRate: 1,
      fromCurrency: from,
      toCurrency: to,
    };
  }

  const rates = await getExchangeRates(from);
  const exchangeRate = rates[to];

  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    throw new Error(`Exchange rate from ${from} to ${to} is unavailable.`);
  }

  return {
    amount: roundMoney(amount * exchangeRate),
    exchangeRate,
    fromCurrency: from,
    toCurrency: to,
  };
}

export function roundMoney(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
