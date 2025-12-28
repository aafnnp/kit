// ==================== Currency Convert Types ====================

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml" | "yaml" | "excel"

/**
 * Market Status type
 */
export type marketStatus = "open" | "closed" | "pre-market" | "after-hours"

/**
 * Currency type
 */
export interface currency {
  code: string,
  name: string,
  symbol: string,
  flag: string,
  country: string,
  region: string,
  isActive: boolean,
  isCrypto: boolean,
  decimals: number,
}

/**
 * Conversion Metadata type
 */
export interface conversionMetadata {
  rateSource: string,
  rateTimestamp: Date,
  spread: number,
  volatility: number,
  confidence: number,
  marketStatus: marketStatus,
}

/**
 * Currency Conversion type
 */
export interface currencyConversion {
  id: string,
  fromCurrency: currency,
  toCurrency: currency,
  amount: number,
  convertedAmount: number,
  exchangeRate: number,
  metadata: conversionMetadata,
  timestamp: Date,
}

/**
 * Exchange Rate type
 */
export interface exchangeRate {
  base: string,
  target: string,
  rate: number,
  timestamp: Date,
  source: string
  bid?: number
  ask?: number
  high24h?: number
  low24h?: number
  change24h?: number
  changePercent24h?: number
}

/**
 * Conversion Template type
 */
export interface conversionTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  fromCurrency: string,
  toCurrency: string,
  amount: number,
  useCase: string[],
  difficulty: "simple"| "medium" | "complex",
}

/**
 * Conversion Error type
 */
export interface conversionError {
  message: string,
  type: "amount"| "currency" | "rate" | "network",
  severity: "error"| "warning" | "info",
}

/**
 * Conversion Validation type
 */
export interface conversionValidation {
  isValid: boolean,
  errors: conversionError[],
  warnings: string[],
  suggestions: string[],
  qualityScore: number,
}

// ==================== Type Exports ====================

export type ExportFormat = exportFormat
export type MarketStatus = marketStatus
export type Currency = currency
export type ConversionMetadata = conversionMetadata
export type CurrencyConversion = currencyConversion
export type ExchangeRate = exchangeRate
export type ConversionTemplate = conversionTemplate
export type ConversionError = conversionError
export type ConversionValidation = conversionValidation
