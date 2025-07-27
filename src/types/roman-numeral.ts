// Roman Numeral 相关类型声明
export interface RomanConversion {
  id: string
  arabicNumber: number
  romanNumeral: string
  conversionType: 'arabic-to-roman' | 'roman-to-arabic'
  metadata: ConversionMetadata
  analysis: RomanAnalysis
  timestamp: Date
}

export interface ConversionMetadata {
  conversionTime: number
  complexity: number
  romanLength: number
  digitCount: number
  isValid: boolean
  hasSubtractiveCases: boolean
  romanSymbols: RomanSymbol[]
}

export interface RomanAnalysis {
  breakdown: RomanBreakdown[]
  historicalContext: HistoricalContext
  mathematicalProperties: MathematicalProperty[]
  educationalNotes: string[]
  commonUsages: string[]
}

export interface RomanBreakdown {
  symbol: string
  value: number
  count: number
  position: number
  type: 'additive' | 'subtractive'
  explanation: string
}

export interface HistoricalContext {
  period: string
  usage: string
  significance: string
  modernApplications: string[]
}

export interface MathematicalProperty {
  name: string
  value: boolean | number | string
  description: string
  category: 'number-theory' | 'arithmetic' | 'representation'
}

export interface RomanSymbol {
  symbol: string
  value: number
  name: string
  origin: string
  modernUsage: string[]
}

export interface RomanTemplate {
  id: string
  name: string
  description: string
  category: string
  numbers: number[]
  useCase: string[]
  difficulty: 'simple' | 'medium' | 'complex'
  historicalSignificance?: string
}

export interface ConversionValidation {
  isValid: boolean
  errors: ConversionError[]
  warnings: string[]
  suggestions: string[]
  qualityScore: number
}

export interface ConversionError {
  message: string
  type: 'format' | 'range' | 'syntax' | 'historical'
  severity: 'error' | 'warning' | 'info'
  position?: number
}

// Enums
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'yaml' | 'html'
