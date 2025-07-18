// 货币兑换相关类型声明
export interface CurrencyConversion {
  id: string
  fromCurrency: Currency
  toCurrency: Currency
  amount: number
  convertedAmount: number
  exchangeRate: number
  metadata: ConversionMetadata
  timestamp: Date
}

export interface Currency {
  code: string
  name: string
  symbol: string
  flag: string
  country: string
  region: string
  isActive: boolean
  isCrypto: boolean
  decimals: number
}

export interface ConversionMetadata {
  rateSource: string
  rateTimestamp: Date
  spread: number
  volatility: number
  confidence: number
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours'
}

export interface ExchangeRate {
  base: string
  target: string
  rate: number
  timestamp: Date
  source: string
  bid?: number
  ask?: number
  high24h?: number
  low24h?: number
  change24h?: number
  changePercent24h?: number
}

export interface ConversionTemplate {
  id: string
  name: string
  description: string
  category: string
  fromCurrency: string
  toCurrency: string
  amount: number
  useCase: string[]
  difficulty: 'simple' | 'medium' | 'complex'
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
  type: 'amount' | 'currency' | 'rate' | 'network'
  severity: 'error' | 'warning' | 'info'
}

export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'yaml' | 'excel'
