import { z } from "zod"

// ==================== Roman Numeral Schemas ====================

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml", "yaml", "html"])

/**
 * Roman Symbol schema
 */
export const romanSymbolSchema = z.object({
  symbol: z.string(),
  value: z.number(),
  name: z.string(),
  origin: z.string(),
  modernUsage: z.array(z.string()),
})

/**
 * Roman Breakdown schema
 */
export const romanBreakdownSchema = z.object({
  symbol: z.string(),
  value: z.number(),
  count: z.number(),
  position: z.number(),
  type: z.enum(["additive", "subtractive"]),
  explanation: z.string(),
})

/**
 * Historical Context schema
 */
export const historicalContextSchema = z.object({
  period: z.string(),
  usage: z.string(),
  significance: z.string(),
  modernApplications: z.array(z.string()),
})

/**
 * Mathematical Property schema
 */
export const mathematicalPropertySchema = z.object({
  name: z.string(),
  value: z.union([z.boolean(), z.number(), z.string()]),
  description: z.string(),
  category: z.enum(["number-theory", "arithmetic", "representation"]),
})

/**
 * Roman Analysis schema
 */
export const romanAnalysisSchema = z.object({
  breakdown: z.array(romanBreakdownSchema),
  historicalContext: historicalContextSchema,
  mathematicalProperties: z.array(mathematicalPropertySchema),
  educationalNotes: z.array(z.string()),
  commonUsages: z.array(z.string()),
})

/**
 * Conversion Metadata schema
 */
export const conversionMetadataSchema = z.object({
  conversionTime: z.number(),
  complexity: z.number(),
  romanLength: z.number(),
  digitCount: z.number(),
  isValid: z.boolean(),
  hasSubtractiveCases: z.boolean(),
  romanSymbols: z.array(romanSymbolSchema),
})

/**
 * Roman Conversion schema
 */
export const romanConversionSchema = z.object({
  id: z.string(),
  arabicNumber: z.number(),
  romanNumeral: z.string(),
  conversionType: z.enum(["arabic-to-roman", "roman-to-arabic"]),
  metadata: conversionMetadataSchema,
  analysis: romanAnalysisSchema,
  timestamp: z.date(),
})

/**
 * Roman Template schema
 */
export const romanTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  numbers: z.array(z.number()),
  useCase: z.array(z.string()),
  difficulty: z.enum(["simple", "medium", "complex"]),
  historicalSignificance: z.string().optional(),
})

/**
 * Conversion Error schema
 */
export const conversionErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["format", "range", "syntax", "historical"]),
  severity: z.enum(["error", "warning", "info"]),
  position: z.number().optional(),
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
export type RomanSymbol = z.infer<typeof romanSymbolSchema>
export type RomanBreakdown = z.infer<typeof romanBreakdownSchema>
export type HistoricalContext = z.infer<typeof historicalContextSchema>
export type MathematicalProperty = z.infer<typeof mathematicalPropertySchema>
export type RomanAnalysis = z.infer<typeof romanAnalysisSchema>
export type ConversionMetadata = z.infer<typeof conversionMetadataSchema>
export type RomanConversion = z.infer<typeof romanConversionSchema>
export type RomanTemplate = z.infer<typeof romanTemplateSchema>
export type ConversionError = z.infer<typeof conversionErrorSchema>
export type ConversionValidation = z.infer<typeof conversionValidationSchema>
