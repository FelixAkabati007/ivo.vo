/**
 * Currency Configuration Module
 * 
 * Provides explicit, configurable currency support.
 * Default: Ghana Cedi (GHS / GH₵)
 * 
 * This module ensures currency is NEVER hardcoded in financial logic.
 * All monetary operations reference this configuration.
 */

export interface CurrencyConfig {
  code: string;           // ISO 4217 code (e.g., 'GHS', 'USD')
  symbol: string;         // Display symbol (e.g., 'GH₵', '$')
  symbolPosition: 'before' | 'after';  // Where to place symbol
  decimalPlaces: number;  // Number of decimal places
  decimalSeparator: string;  // '.' or ','
  thousandsSeparator: string;  // ',' or '.'
  locale: string;         // BCP 47 locale tag
}

// Supported currencies
export const CURRENCIES: Record<string, CurrencyConfig> = {
  GHS: {
    code: 'GHS',
    symbol: 'GH₵',
    symbolPosition: 'before',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    locale: 'en-GH',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    symbolPosition: 'after',
    decimalPlaces: 2,
    decimalSeparator: ',',
    thousandsSeparator: '.',
    locale: 'de-DE',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    symbolPosition: 'before',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    locale: 'en-GB',
  },
};

// Default currency (Ghana Cedi)
const DEFAULT_CURRENCY_CODE = 'GHS';

// Current active currency (can be changed at runtime)
let activeCurrencyCode: string = DEFAULT_CURRENCY_CODE;

/**
 * Set the active currency
 */
export function setCurrency(currencyCode: string): void {
  if (!CURRENCIES[currencyCode]) {
    console.warn(`Currency ${currencyCode} not supported, falling back to ${DEFAULT_CURRENCY_CODE}`);
    activeCurrencyCode = DEFAULT_CURRENCY_CODE;
    return;
  }
  activeCurrencyCode = currencyCode;
}

/**
 * Get the active currency configuration
 */
export function getCurrency(): CurrencyConfig {
  return CURRENCIES[activeCurrencyCode] || CURRENCIES[DEFAULT_CURRENCY_CODE];
}

/**
 * Get the active currency code
 */
export function getCurrencyCode(): string {
  return activeCurrencyCode;
}

/**
 * Format a monetary amount according to the active currency
 * 
 * @param amount - The amount in the smallest currency unit (e.g., pesewas for GHS, cents for USD)
 *                 OR as a decimal number (e.g., 10.50 for GH₵10.50)
 * @param options - Formatting options
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(10.50) // "GH₵10.50"
 * formatCurrency(1000, { fromSmallestUnit: true }) // "GH₵10.00" (1000 pesewas = GH₵10.00)
 */
export function formatCurrency(
  amount: number,
  options: { fromSmallestUnit?: boolean; showCode?: boolean } = {}
): string {
  const currency = getCurrency();
  
  // Convert from smallest unit if needed
  let value = amount;
  if (options.fromSmallestUnit) {
    value = amount / Math.pow(10, currency.decimalPlaces);
  }
  
  // Format the number
  const formatted = value.toFixed(currency.decimalPlaces);
  const [integerPart, decimalPart] = formatted.split('.');
  
  // Add thousands separator
  const withThousands = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    currency.thousandsSeparator
  );
  
  // Combine with decimal part
  const formattedNumber = decimalPart
    ? `${withThousands}${currency.decimalSeparator}${decimalPart}`
    : withThousands;
  
  // Add symbol
  const withSymbol = currency.symbolPosition === 'before'
    ? `${currency.symbol}${formattedNumber}`
    : `${formattedNumber}${currency.symbol}`;
  
  // Add currency code if requested
  return options.showCode ? `${withSymbol} ${currency.code}` : withSymbol;
}

/**
 * Parse a currency string back to a number
 * 
 * @param currencyString - Formatted currency string (e.g., "GH₵10.50")
 * @returns Numeric value
 * 
 * @example
 * parseCurrency("GH₵10.50") // 10.50
 */
export function parseCurrency(currencyString: string): number {
  const currency = getCurrency();
  
  // Remove symbol and code
  let cleaned = currencyString
    .replace(currency.symbol, '')
    .replace(currency.code, '')
    .trim();
  
  // Remove thousands separator
  cleaned = cleaned.replace(new RegExp(`\\${currency.thousandsSeparator}`, 'g'), '');
  
  // Replace decimal separator with '.'
  cleaned = cleaned.replace(currency.decimalSeparator, '.');
  
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

/**
 * Convert amount to smallest currency unit (for storage/API)
 * 
 * @param amount - Decimal amount (e.g., 10.50)
 * @returns Amount in smallest unit (e.g., 1050 pesewas)
 */
export function toSmallestUnit(amount: number): number {
  const currency = getCurrency();
  return Math.round(amount * Math.pow(10, currency.decimalPlaces));
}

/**
 * Convert from smallest currency unit to decimal
 * 
 * @param amount - Amount in smallest unit (e.g., 1050 pesewas)
 * @returns Decimal amount (e.g., 10.50)
 */
export function fromSmallestUnit(amount: number): number {
  const currency = getCurrency();
  return amount / Math.pow(10, currency.decimalPlaces);
}

/**
 * Validate that an amount is valid for the current currency
 */
export function isValidAmount(amount: number): boolean {
  return typeof amount === 'number' && !isNaN(amount) && amount >= 0;
}

/**
 * Get all supported currency codes
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(CURRENCIES);
}
