// ==================== Roman Numeral Types ====================

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml" | "yaml" | "html"

/**
 * Roman Symbol type
 */
export interface romanSymbol {
  symbol: string,
  value: number,
  name: string,
  origin: string,
  modernUsage: string[],
}

/**
 * Roman Breakdown type
 */
export interface romanBreakdown {
  symbol: string,
  value: number,
  count: number,
  position: number,
  type: "additive"| "subtractive",
  explanation: string,
}

/**
 * Historical Context type
 */
export interface historicalContext {
  period: string,
  usage: string,
  significance: string,
  modernApplications: string[],
}

/**
 * Mathematical Property type
 */
export interface mathematicalProperty {
  name: string,
  value: boolean | number | string,
  description: string,
  category: "number-theory" | "arithmetic" | "representation",
}

/**
 * Roman Analysis type
 */
export interface romanAnalysis {
  breakdown: romanBreakdown[],
  historicalContext: historicalContext,
  mathematicalProperties: mathematicalProperty[],
  educationalNotes: string[],
  commonUsages: string[],
}

/**
 * Conversion Metadata type
 */
export interface conversionMetadata {
  conversionTime: number,
  complexity: number,
  romanLength: number,
  digitCount: number,
  isValid: boolean,
  hasSubtractiveCases: boolean,
  romanSymbols: romanSymbol[],
}

/**
 * Roman Conversion type
 */
export interface romanConversion {
  id: string,
  arabicNumber: number,
  romanNumeral: string,
  conversionType: "arabic-to-roman" | "roman-to-arabic",
  metadata: conversionMetadata,
  analysis: romanAnalysis,
  timestamp: Date,
}

/**
 * Roman Template type
 */
export interface romanTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  numbers: number[],
  useCase: string[],
  difficulty: "simple"| "medium" | "complex"
  historicalSignificance?: string
}

/**
 * Conversion Error type
 */
export interface conversionError {
  message: string,
  type: "format"| "range" | "syntax" | "historical",
  severity: "error"| "warning" | "info"
  position?: number
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
export type RomanSymbol = romanSymbol
export type RomanBreakdown = romanBreakdown
export type HistoricalContext = historicalContext
export type MathematicalProperty = mathematicalProperty
export type RomanAnalysis = romanAnalysis
export type ConversionMetadata = conversionMetadata
export type RomanConversion = romanConversion
export type RomanTemplate = romanTemplate
export type ConversionError = conversionError
export type ConversionValidation = conversionValidation
