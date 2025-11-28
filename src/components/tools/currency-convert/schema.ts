import { z } from "zod"

// ==================== Currency Convert Schemas ====================

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml", "yaml", "excel"])

/**
 * Market Status schema
 */
export const marketStatusSchema = z.enum(["open", "closed", "pre-market", "after-hours"])

/**
 * Currency schema
 */
export const currencySchema = z.object({
  code: z.string(),
  name: z.string(),
  symbol: z.string(),
  flag: z.string(),
  country: z.string(),
  region: z.string(),
  isActive: z.boolean(),
  isCrypto: z.boolean(),
  decimals: z.number(),
})

/**
 * Conversion Metadata schema
 */
export const conversionMetadataSchema = z.object({
  rateSource: z.string(),
  rateTimestamp: z.date(),
  spread: z.number(),
  volatility: z.number(),
  confidence: z.number(),
  marketStatus: marketStatusSchema,
})

/**
 * Currency Conversion schema
 */
export const currencyConversionSchema = z.object({
  id: z.string(),
  fromCurrency: currencySchema,
  toCurrency: currencySchema,
  amount: z.number(),
  convertedAmount: z.number(),
  exchangeRate: z.number(),
  metadata: conversionMetadataSchema,
  timestamp: z.date(),
})

/**
 * Exchange Rate schema
 */
export const exchangeRateSchema = z.object({
  base: z.string(),
  target: z.string(),
  rate: z.number(),
  timestamp: z.date(),
  source: z.string(),
  bid: z.number().optional(),
  ask: z.number().optional(),
  high24h: z.number().optional(),
  low24h: z.number().optional(),
  change24h: z.number().optional(),
  changePercent24h: z.number().optional(),
})

/**
 * Conversion Template schema
 */
export const conversionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  fromCurrency: z.string(),
  toCurrency: z.string(),
  amount: z.number(),
  useCase: z.array(z.string()),
  difficulty: z.enum(["simple", "medium", "complex"]),
})

/**
 * Conversion Error schema
 */
export const conversionErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["amount", "currency", "rate", "network"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * Conversion Validation schema
 */
export const conversionValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(conversionErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  qualityScore: z.number(),
})

// ==================== Type Exports ====================

export type ExportFormat = z.infer<typeof exportFormatSchema>
export type MarketStatus = z.infer<typeof marketStatusSchema>
export type Currency = z.infer<typeof currencySchema>
export type ConversionMetadata = z.infer<typeof conversionMetadataSchema>
export type CurrencyConversion = z.infer<typeof currencyConversionSchema>
export type ExchangeRate = z.infer<typeof exchangeRateSchema>
export type ConversionTemplate = z.infer<typeof conversionTemplateSchema>
export type ConversionError = z.infer<typeof conversionErrorSchema>
export type ConversionValidation = z.infer<typeof conversionValidationSchema>
