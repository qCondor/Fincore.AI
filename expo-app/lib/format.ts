import type { CurrencyCode, DateFormatPref } from '../contexts/PreferencesContext';

// In-memory cache so formatCurrency/formatDate can be called synchronously
// from anywhere (components, non-component modules like NotificationContext)
// without threading the preference through every call site. PreferencesContext
// keeps this in sync whenever the underlying prefs change or hydrate.
// Mirrors the getCachedSessionToken() pattern in lib/session.ts.
let cachedCurrency: CurrencyCode = 'GBP';
let cachedDateFormat: DateFormatPref = 'DD/MM/YYYY';

export function setCurrencyPreference(currency: CurrencyCode): void {
  cachedCurrency = currency;
}

export function setDateFormatPreference(dateFormat: DateFormatPref): void {
  cachedDateFormat = dateFormat;
}

const CURRENCY_LOCALE: Record<CurrencyCode, string> = {
  GBP: 'en-GB',
  USD: 'en-US',
  EUR: 'en-IE',
};

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

/**
 * Formats a plain number as money in the user's chosen currency. Display
 * formatting only -- the underlying number is never converted between
 * currencies, only re-symbolised/re-localised.
 */
export function formatCurrency(amount: number, currency: CurrencyCode = cachedCurrency): string {
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    // Fallback if Intl/currency data is unavailable on the runtime
    return `${CURRENCY_SYMBOL[currency]}${amount.toFixed(2)}`;
  }
}

/**
 * Formats a date according to the user's chosen date format. Does not
 * touch time-of-day formatting (see toLocaleTimeString call sites) and
 * does not replace the relative-bucket grouping in lib/dateUtils.ts.
 */
export function formatDate(date: Date | string, dateFormat: DateFormatPref = cachedDateFormat): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  switch (dateFormat) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`;
  }
}
