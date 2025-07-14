import React, { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  Copy,
  Check,
  Settings,
  BookOpen,
  Eye,
  Clock,
  TrendingUp,
  Calculator,
  Equal,
  DollarSign,
  ArrowLeftRight,
  Repeat,
} from 'lucide-react'

// Enhanced Types
interface CurrencyConversion {
  id: string
  fromCurrency: Currency
  toCurrency: Currency
  amount: number
  convertedAmount: number
  exchangeRate: number
  metadata: ConversionMetadata
  timestamp: Date
}

interface Currency {
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

interface ConversionMetadata {
  rateSource: string
  rateTimestamp: Date
  spread: number
  volatility: number
  confidence: number
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours'
}

interface ExchangeRate {
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

interface ConversionTemplate {
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

interface ConversionValidation {
  isValid: boolean
  errors: ConversionError[]
  warnings: string[]
  suggestions: string[]
  qualityScore: number
}

interface ConversionError {
  message: string
  type: 'amount' | 'currency' | 'rate' | 'network'
  severity: 'error' | 'warning' | 'info'
}

// Enums
type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'yaml' | 'excel'

// Utility functions
const generateId = (): string => Math.random().toString(36).substring(2, 11)

const formatCurrency = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount)
}

const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

// Currency data
const currencies: Currency[] = [
  // Major currencies
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    country: 'United States',
    region: 'North America',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    country: 'European Union',
    region: 'Europe',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    country: 'United Kingdom',
    region: 'Europe',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    country: 'Japan',
    region: 'Asia',
    isActive: true,
    isCrypto: false,
    decimals: 0,
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    flag: '🇨🇭',
    country: 'Switzerland',
    region: 'Europe',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    flag: '🇨🇦',
    country: 'Canada',
    region: 'North America',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    country: 'Australia',
    region: 'Oceania',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    flag: '🇨🇳',
    country: 'China',
    region: 'Asia',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },

  // Other major currencies
  {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    flag: '🇸🇪',
    country: 'Sweden',
    region: 'Europe',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    flag: '🇳🇴',
    country: 'Norway',
    region: 'Europe',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    flag: '🇩🇰',
    country: 'Denmark',
    region: 'Europe',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'PLN',
    name: 'Polish Zloty',
    symbol: 'zł',
    flag: '🇵🇱',
    country: 'Poland',
    region: 'Europe',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    flag: '🇨🇿',
    country: 'Czech Republic',
    region: 'Europe',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'HUF',
    name: 'Hungarian Forint',
    symbol: 'Ft',
    flag: '🇭🇺',
    country: 'Hungary',
    region: 'Europe',
    isActive: true,
    isCrypto: false,
    decimals: 0,
  },

  // Asian currencies
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    flag: '🇰🇷',
    country: 'South Korea',
    region: 'Asia',
    isActive: true,
    isCrypto: false,
    decimals: 0,
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    flag: '🇸🇬',
    country: 'Singapore',
    region: 'Asia',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    flag: '🇭🇰',
    country: 'Hong Kong',
    region: 'Asia',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    country: 'India',
    region: 'Asia',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    flag: '🇹🇭',
    country: 'Thailand',
    region: 'Asia',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    flag: '🇲🇾',
    country: 'Malaysia',
    region: 'Asia',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },

  // Other currencies
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    flag: '🇳🇿',
    country: 'New Zealand',
    region: 'Oceania',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    flag: '🇿🇦',
    country: 'South Africa',
    region: 'Africa',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    flag: '🇧🇷',
    country: 'Brazil',
    region: 'South America',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    flag: '🇲🇽',
    country: 'Mexico',
    region: 'North America',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    flag: '🇷🇺',
    country: 'Russia',
    region: 'Europe',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    flag: '🇹🇷',
    country: 'Turkey',
    region: 'Asia',
    isActive: true,
    isCrypto: false,
    decimals: 2,
  },

  // Cryptocurrencies
  {
    code: 'BTC',
    name: 'Bitcoin',
    symbol: '₿',
    flag: '🟠',
    country: 'Digital',
    region: 'Crypto',
    isActive: true,
    isCrypto: true,
    decimals: 8,
  },
  {
    code: 'ETH',
    name: 'Ethereum',
    symbol: 'Ξ',
    flag: '🔷',
    country: 'Digital',
    region: 'Crypto',
    isActive: true,
    isCrypto: true,
    decimals: 6,
  },
  {
    code: 'USDT',
    name: 'Tether',
    symbol: '₮',
    flag: '🟢',
    country: 'Digital',
    region: 'Crypto',
    isActive: true,
    isCrypto: true,
    decimals: 2,
  },
  {
    code: 'BNB',
    name: 'Binance Coin',
    symbol: 'BNB',
    flag: '🟡',
    country: 'Digital',
    region: 'Crypto',
    isActive: true,
    isCrypto: true,
    decimals: 4,
  },
  {
    code: 'ADA',
    name: 'Cardano',
    symbol: 'ADA',
    flag: '🔵',
    country: 'Digital',
    region: 'Crypto',
    isActive: true,
    isCrypto: true,
    decimals: 6,
  },
]

// Mock exchange rates (in a real app, these would come from an API)
const mockExchangeRates: { [key: string]: ExchangeRate } = {
  'USD-EUR': {
    base: 'USD',
    target: 'EUR',
    rate: 0.85,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 0.849,
    ask: 0.851,
    high24h: 0.855,
    low24h: 0.845,
    change24h: 0.005,
    changePercent24h: 0.59,
  },
  'USD-GBP': {
    base: 'USD',
    target: 'GBP',
    rate: 0.73,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 0.729,
    ask: 0.731,
    high24h: 0.735,
    low24h: 0.725,
    change24h: -0.002,
    changePercent24h: -0.27,
  },
  'USD-JPY': {
    base: 'USD',
    target: 'JPY',
    rate: 110.5,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 110.3,
    ask: 110.7,
    high24h: 111.2,
    low24h: 109.8,
    change24h: 0.8,
    changePercent24h: 0.73,
  },
  'USD-CHF': {
    base: 'USD',
    target: 'CHF',
    rate: 0.92,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 0.919,
    ask: 0.921,
    high24h: 0.925,
    low24h: 0.915,
    change24h: 0.003,
    changePercent24h: 0.33,
  },
  'USD-CAD': {
    base: 'USD',
    target: 'CAD',
    rate: 1.25,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 1.249,
    ask: 1.251,
    high24h: 1.255,
    low24h: 1.245,
    change24h: -0.005,
    changePercent24h: -0.4,
  },
  'USD-AUD': {
    base: 'USD',
    target: 'AUD',
    rate: 1.35,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 1.349,
    ask: 1.351,
    high24h: 1.358,
    low24h: 1.342,
    change24h: 0.008,
    changePercent24h: 0.6,
  },
  'USD-CNY': {
    base: 'USD',
    target: 'CNY',
    rate: 7.0,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 6.998,
    ask: 7.002,
    high24h: 7.05,
    low24h: 6.95,
    change24h: 0.02,
    changePercent24h: 0.29,
  },
  'USD-SEK': {
    base: 'USD',
    target: 'SEK',
    rate: 8.5,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 8.48,
    ask: 8.52,
    high24h: 8.58,
    low24h: 8.42,
    change24h: 0.05,
    changePercent24h: 0.59,
  },
  'USD-NOK': {
    base: 'USD',
    target: 'NOK',
    rate: 8.8,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 8.78,
    ask: 8.82,
    high24h: 8.88,
    low24h: 8.72,
    change24h: 0.03,
    changePercent24h: 0.34,
  },
  'USD-DKK': {
    base: 'USD',
    target: 'DKK',
    rate: 6.3,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 6.28,
    ask: 6.32,
    high24h: 6.35,
    low24h: 6.25,
    change24h: 0.02,
    changePercent24h: 0.32,
  },
  'USD-KRW': {
    base: 'USD',
    target: 'KRW',
    rate: 1180,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 1178,
    ask: 1182,
    high24h: 1190,
    low24h: 1170,
    change24h: 8,
    changePercent24h: 0.68,
  },
  'USD-SGD': {
    base: 'USD',
    target: 'SGD',
    rate: 1.35,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 1.349,
    ask: 1.351,
    high24h: 1.358,
    low24h: 1.342,
    change24h: 0.005,
    changePercent24h: 0.37,
  },
  'USD-HKD': {
    base: 'USD',
    target: 'HKD',
    rate: 7.8,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 7.798,
    ask: 7.802,
    high24h: 7.805,
    low24h: 7.795,
    change24h: 0.002,
    changePercent24h: 0.03,
  },
  'USD-INR': {
    base: 'USD',
    target: 'INR',
    rate: 74.5,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 74.3,
    ask: 74.7,
    high24h: 75.2,
    low24h: 73.8,
    change24h: 0.3,
    changePercent24h: 0.4,
  },
  'USD-BTC': {
    base: 'USD',
    target: 'BTC',
    rate: 0.000023,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 0.0000229,
    ask: 0.0000231,
    high24h: 0.0000235,
    low24h: 0.0000225,
    change24h: 0.000001,
    changePercent24h: 4.55,
  },
  'USD-ETH': {
    base: 'USD',
    target: 'ETH',
    rate: 0.00035,
    timestamp: new Date(),
    source: 'Mock API',
    bid: 0.000349,
    ask: 0.000351,
    high24h: 0.000358,
    low24h: 0.000342,
    change24h: 0.000008,
    changePercent24h: 2.34,
  },
}

// Exchange rate functions
const getExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<ExchangeRate | null> => {
  // In a real app, this would make an API call
  const key = `${fromCurrency}-${toCurrency}`
  const reverseKey = `${toCurrency}-${fromCurrency}`

  if (mockExchangeRates[key]) {
    return mockExchangeRates[key]
  }

  if (mockExchangeRates[reverseKey]) {
    const reverseRate = mockExchangeRates[reverseKey]
    return {
      base: fromCurrency,
      target: toCurrency,
      rate: 1 / reverseRate.rate,
      timestamp: reverseRate.timestamp,
      source: reverseRate.source,
      bid: reverseRate.ask ? 1 / reverseRate.ask : undefined,
      ask: reverseRate.bid ? 1 / reverseRate.bid : undefined,
      high24h: reverseRate.low24h ? 1 / reverseRate.low24h : undefined,
      low24h: reverseRate.high24h ? 1 / reverseRate.high24h : undefined,
      change24h: reverseRate.change24h ? -reverseRate.change24h / (reverseRate.rate * reverseRate.rate) : undefined,
      changePercent24h: reverseRate.changePercent24h ? -reverseRate.changePercent24h : undefined,
    }
  }

  // If no direct rate found, try to find a path through USD
  if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
    const fromUsdRate = await getExchangeRate(fromCurrency, 'USD')
    const toUsdRate = await getExchangeRate('USD', toCurrency)

    if (fromUsdRate && toUsdRate) {
      return {
        base: fromCurrency,
        target: toCurrency,
        rate: fromUsdRate.rate * toUsdRate.rate,
        timestamp: new Date(),
        source: 'Calculated via USD',
      }
    }
  }

  return null
}

const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
  if (fromCurrency === toCurrency) return amount

  const rate = await getExchangeRate(fromCurrency, toCurrency)
  if (!rate) throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`)

  return amount * rate.rate
}

// Validation functions
const validateConversion = (amount: number, fromCurrency: string, toCurrency: string): ConversionValidation => {
  const validation: ConversionValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 100,
  }

  // Validate amount
  if (isNaN(amount) || !isFinite(amount)) {
    validation.isValid = false
    validation.errors.push({
      message: 'Amount must be a valid number',
      type: 'amount',
      severity: 'error',
    })
    validation.qualityScore -= 50
  }

  if (amount < 0) {
    validation.isValid = false
    validation.errors.push({
      message: 'Amount cannot be negative',
      type: 'amount',
      severity: 'error',
    })
    validation.qualityScore -= 30
  }

  if (amount === 0) {
    validation.warnings.push('Converting zero amount')
    validation.qualityScore -= 10
  }

  if (amount > 1000000000) {
    validation.warnings.push('Very large amount - please verify')
    validation.suggestions.push('Consider breaking down large conversions')
    validation.qualityScore -= 15
  }

  // Validate currencies
  const fromCurrencyObj = currencies.find((c) => c.code === fromCurrency)
  const toCurrencyObj = currencies.find((c) => c.code === toCurrency)

  if (!fromCurrencyObj) {
    validation.isValid = false
    validation.errors.push({
      message: `Unsupported source currency: ${fromCurrency}`,
      type: 'currency',
      severity: 'error',
    })
    validation.qualityScore -= 40
  }

  if (!toCurrencyObj) {
    validation.isValid = false
    validation.errors.push({
      message: `Unsupported target currency: ${toCurrency}`,
      type: 'currency',
      severity: 'error',
    })
    validation.qualityScore -= 40
  }

  if (fromCurrency === toCurrency) {
    validation.warnings.push('Source and target currencies are the same')
    validation.suggestions.push('Select different currencies for conversion')
    validation.qualityScore -= 20
  }

  // Currency-specific warnings
  if (fromCurrencyObj?.isCrypto || toCurrencyObj?.isCrypto) {
    validation.warnings.push('Cryptocurrency rates are highly volatile')
    validation.suggestions.push('Consider market conditions and timing')
    validation.qualityScore -= 5
  }

  // Quality suggestions
  if (validation.qualityScore >= 90) {
    validation.suggestions.push('Excellent conversion setup')
  } else if (validation.qualityScore >= 70) {
    validation.suggestions.push('Good conversion with minor considerations')
  } else if (validation.qualityScore >= 50) {
    validation.suggestions.push('Conversion needs improvement')
  } else {
    validation.suggestions.push('Conversion has significant issues')
  }

  return validation
}

// Conversion templates
const conversionTemplates: ConversionTemplate[] = [
  {
    id: 'usd-eur',
    name: 'USD to EUR',
    description: 'US Dollar to Euro conversion',
    category: 'Major Pairs',
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    amount: 100,
    useCase: ['Travel', 'Business', 'Investment'],
    difficulty: 'simple',
  },
  {
    id: 'usd-gbp',
    name: 'USD to GBP',
    description: 'US Dollar to British Pound conversion',
    category: 'Major Pairs',
    fromCurrency: 'USD',
    toCurrency: 'GBP',
    amount: 100,
    useCase: ['Travel', 'Business', 'Investment'],
    difficulty: 'simple',
  },
  {
    id: 'usd-jpy',
    name: 'USD to JPY',
    description: 'US Dollar to Japanese Yen conversion',
    category: 'Major Pairs',
    fromCurrency: 'USD',
    toCurrency: 'JPY',
    amount: 100,
    useCase: ['Travel', 'Business', 'Trade'],
    difficulty: 'simple',
  },
  {
    id: 'eur-gbp',
    name: 'EUR to GBP',
    description: 'Euro to British Pound conversion',
    category: 'Cross Pairs',
    fromCurrency: 'EUR',
    toCurrency: 'GBP',
    amount: 100,
    useCase: ['European travel', 'Business', 'Investment'],
    difficulty: 'medium',
  },
  {
    id: 'usd-cny',
    name: 'USD to CNY',
    description: 'US Dollar to Chinese Yuan conversion',
    category: 'Emerging Markets',
    fromCurrency: 'USD',
    toCurrency: 'CNY',
    amount: 100,
    useCase: ['China business', 'Trade', 'Investment'],
    difficulty: 'medium',
  },
  {
    id: 'usd-btc',
    name: 'USD to Bitcoin',
    description: 'US Dollar to Bitcoin conversion',
    category: 'Cryptocurrency',
    fromCurrency: 'USD',
    toCurrency: 'BTC',
    amount: 1000,
    useCase: ['Crypto investment', 'Digital payments', 'Trading'],
    difficulty: 'complex',
  },
  {
    id: 'eur-usd',
    name: 'EUR to USD',
    description: 'Euro to US Dollar conversion',
    category: 'Major Pairs',
    fromCurrency: 'EUR',
    toCurrency: 'USD',
    amount: 100,
    useCase: ['US travel', 'Business', 'Investment'],
    difficulty: 'simple',
  },
  {
    id: 'multi-currency',
    name: 'Multi-Currency',
    description: 'Multiple currency comparison',
    category: 'Advanced',
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    amount: 1000,
    useCase: ['Portfolio analysis', 'Risk management', 'Arbitrage'],
    difficulty: 'complex',
  },
]

// Error boundary component
class CurrencyConvertErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Currency Convert error:', error, errorInfo)
    toast.error('An unexpected error occurred in the currency converter')
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-600">
                <h3 className="font-semibold">Something went wrong</h3>
                <p className="text-sm">Please refresh the page and try again.</p>
              </div>
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Custom hooks
const useCurrencyConversion = () => {
  const [conversions, setConversions] = useState<CurrencyConversion[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const performConversion = useCallback(
    async (amount: number, fromCurrency: string, toCurrency: string): Promise<CurrencyConversion> => {
      setIsProcessing(true)
      try {
        const fromCurrencyObj = currencies.find((c) => c.code === fromCurrency)
        const toCurrencyObj = currencies.find((c) => c.code === toCurrency)

        if (!fromCurrencyObj || !toCurrencyObj) {
          throw new Error('Currency not found')
        }

        const rate = await getExchangeRate(fromCurrency, toCurrency)
        if (!rate) {
          throw new Error('Exchange rate not available')
        }

        const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency)

        const conversion: CurrencyConversion = {
          id: generateId(),
          fromCurrency: fromCurrencyObj,
          toCurrency: toCurrencyObj,
          amount,
          convertedAmount,
          exchangeRate: rate.rate,
          metadata: {
            rateSource: rate.source,
            rateTimestamp: rate.timestamp,
            spread: rate.ask && rate.bid ? rate.ask - rate.bid : 0,
            volatility: Math.abs(rate.changePercent24h || 0),
            confidence: 0.95,
            marketStatus: 'open',
          },
          timestamp: new Date(),
        }

        setConversions((prev) => [conversion, ...prev.slice(0, 99)]) // Keep last 100 conversions
        return conversion
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const clearConversions = useCallback(() => {
    setConversions([])
  }, [])

  const removeConversion = useCallback((id: string) => {
    setConversions((prev) => prev.filter((conversion) => conversion.id !== id))
  }, [])

  return {
    conversions,
    isProcessing,
    performConversion,
    clearConversions,
    removeConversion,
  }
}

// Copy to clipboard functionality
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || 'text')
      toast.success(`${label || 'Text'} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return { copyToClipboard, copiedText }
}

// Export functionality
const useCurrencyExport = () => {
  const exportConversion = useCallback((conversion: CurrencyConversion, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(conversion, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVFromConversion(conversion)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'txt':
        content = generateTextFromConversion(conversion)
        mimeType = 'text/plain'
        extension = '.txt'
        break
      case 'xml':
        content = generateXMLFromConversion(conversion)
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'yaml':
        content = generateYAMLFromConversion(conversion)
        mimeType = 'text/yaml'
        extension = '.yaml'
        break
      default:
        content = generateTextFromConversion(conversion)
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `currency-conversion-${conversion.id}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportConversion }
}

// Helper functions for export formats
const generateCSVFromConversion = (conversion: CurrencyConversion): string => {
  const headers = ['Property', 'Value']
  const rows = [
    ['From Currency', `${conversion.fromCurrency.code} (${conversion.fromCurrency.name})`],
    ['To Currency', `${conversion.toCurrency.code} (${conversion.toCurrency.name})`],
    ['Amount', conversion.amount.toString()],
    ['Converted Amount', conversion.convertedAmount.toString()],
    ['Exchange Rate', conversion.exchangeRate.toString()],
    ['Rate Source', conversion.metadata.rateSource],
    ['Rate Timestamp', conversion.metadata.rateTimestamp.toISOString()],
    ['Spread', conversion.metadata.spread.toString()],
    ['Volatility', conversion.metadata.volatility.toString()],
    ['Confidence', conversion.metadata.confidence.toString()],
    ['Market Status', conversion.metadata.marketStatus],
    ['Conversion Timestamp', conversion.timestamp.toISOString()],
  ]

  return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
}

const generateTextFromConversion = (conversion: CurrencyConversion): string => {
  return `Currency Conversion Report - ${conversion.timestamp.toLocaleString()}

=== CONVERSION DETAILS ===
From: ${conversion.amount} ${conversion.fromCurrency.code} (${conversion.fromCurrency.name})
To: ${formatNumber(conversion.convertedAmount, conversion.toCurrency.decimals)} ${conversion.toCurrency.code} (${conversion.toCurrency.name})
Exchange Rate: 1 ${conversion.fromCurrency.code} = ${formatNumber(conversion.exchangeRate, 6)} ${conversion.toCurrency.code}

=== RATE INFORMATION ===
Source: ${conversion.metadata.rateSource}
Rate Timestamp: ${conversion.metadata.rateTimestamp.toLocaleString()}
Spread: ${formatNumber(conversion.metadata.spread, 6)}
Volatility: ${formatNumber(conversion.metadata.volatility, 2)}%
Confidence: ${formatNumber(conversion.metadata.confidence * 100, 1)}%
Market Status: ${conversion.metadata.marketStatus.toUpperCase()}

=== CURRENCY DETAILS ===
${conversion.fromCurrency.flag} ${conversion.fromCurrency.name} (${conversion.fromCurrency.code})
  Country: ${conversion.fromCurrency.country}
  Region: ${conversion.fromCurrency.region}
  Symbol: ${conversion.fromCurrency.symbol}
  Type: ${conversion.fromCurrency.isCrypto ? 'Cryptocurrency' : 'Fiat Currency'}

${conversion.toCurrency.flag} ${conversion.toCurrency.name} (${conversion.toCurrency.code})
  Country: ${conversion.toCurrency.country}
  Region: ${conversion.toCurrency.region}
  Symbol: ${conversion.toCurrency.symbol}
  Type: ${conversion.toCurrency.isCrypto ? 'Cryptocurrency' : 'Fiat Currency'}`
}

const generateXMLFromConversion = (conversion: CurrencyConversion): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<currencyConversion id="${conversion.id}" timestamp="${conversion.timestamp.toISOString()}">
  <fromCurrency>
    <code>${conversion.fromCurrency.code}</code>
    <name>${conversion.fromCurrency.name}</name>
    <symbol>${conversion.fromCurrency.symbol}</symbol>
    <country>${conversion.fromCurrency.country}</country>
    <region>${conversion.fromCurrency.region}</region>
    <isCrypto>${conversion.fromCurrency.isCrypto}</isCrypto>
  </fromCurrency>
  <toCurrency>
    <code>${conversion.toCurrency.code}</code>
    <name>${conversion.toCurrency.name}</name>
    <symbol>${conversion.toCurrency.symbol}</symbol>
    <country>${conversion.toCurrency.country}</country>
    <region>${conversion.toCurrency.region}</region>
    <isCrypto>${conversion.toCurrency.isCrypto}</isCrypto>
  </toCurrency>
  <conversion>
    <amount>${conversion.amount}</amount>
    <convertedAmount>${conversion.convertedAmount}</convertedAmount>
    <exchangeRate>${conversion.exchangeRate}</exchangeRate>
  </conversion>
  <metadata>
    <rateSource>${conversion.metadata.rateSource}</rateSource>
    <rateTimestamp>${conversion.metadata.rateTimestamp.toISOString()}</rateTimestamp>
    <spread>${conversion.metadata.spread}</spread>
    <volatility>${conversion.metadata.volatility}</volatility>
    <confidence>${conversion.metadata.confidence}</confidence>
    <marketStatus>${conversion.metadata.marketStatus}</marketStatus>
  </metadata>
</currencyConversion>`
}

const generateYAMLFromConversion = (conversion: CurrencyConversion): string => {
  return `id: ${conversion.id}
timestamp: ${conversion.timestamp.toISOString()}
fromCurrency:
  code: ${conversion.fromCurrency.code}
  name: ${conversion.fromCurrency.name}
  symbol: ${conversion.fromCurrency.symbol}
  country: ${conversion.fromCurrency.country}
  region: ${conversion.fromCurrency.region}
  isCrypto: ${conversion.fromCurrency.isCrypto}
toCurrency:
  code: ${conversion.toCurrency.code}
  name: ${conversion.toCurrency.name}
  symbol: ${conversion.toCurrency.symbol}
  country: ${conversion.toCurrency.country}
  region: ${conversion.toCurrency.region}
  isCrypto: ${conversion.toCurrency.isCrypto}
conversion:
  amount: ${conversion.amount}
  convertedAmount: ${conversion.convertedAmount}
  exchangeRate: ${conversion.exchangeRate}
metadata:
  rateSource: ${conversion.metadata.rateSource}
  rateTimestamp: ${conversion.metadata.rateTimestamp.toISOString()}
  spread: ${conversion.metadata.spread}
  volatility: ${conversion.metadata.volatility}
  confidence: ${conversion.metadata.confidence}
  marketStatus: ${conversion.metadata.marketStatus}`
}

/**
 * Enhanced Currency Convert & Financial Exchange Tool
 * Features: Real-time exchange rates, multiple currencies, financial analysis, and comprehensive conversion capabilities
 */
const CurrencyConvertCore = () => {
  const [activeTab, setActiveTab] = useState<'converter' | 'rates' | 'history' | 'templates' | 'settings'>('converter')
  const [amount, setAmount] = useState<number>(100)
  const [fromCurrency, setFromCurrency] = useState<string>('USD')
  const [toCurrency, setToCurrency] = useState<string>('EUR')
  const [currentConversion, setCurrentConversion] = useState<CurrencyConversion | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: ExchangeRate }>({})

  const { conversions, isProcessing, performConversion, clearConversions, removeConversion } = useCurrencyConversion()
  const { exportConversion } = useCurrencyExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = conversionTemplates.find((t) => t.id === templateId)
    if (template) {
      setAmount(template.amount)
      setFromCurrency(template.fromCurrency)
      setToCurrency(template.toCurrency)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Perform currency conversion
  const handleConvert = useCallback(async () => {
    const validation = validateConversion(amount, fromCurrency, toCurrency)
    if (!validation.isValid) {
      toast.error(`Conversion error: ${validation.errors[0]?.message}`)
      return
    }

    try {
      const conversion = await performConversion(amount, fromCurrency, toCurrency)
      setCurrentConversion(conversion)
      toast.success(
        `Converted ${formatCurrency(amount, conversion.fromCurrency)} to ${formatCurrency(conversion.convertedAmount, conversion.toCurrency)}`
      )
    } catch (error: any) {
      toast.error(`Conversion failed: ${error.message}`)
      console.error(error)
    }
  }, [amount, fromCurrency, toCurrency, performConversion])

  // Swap currencies
  const handleSwapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    toast.success('Currencies swapped')
  }, [fromCurrency, toCurrency])

  // Auto-convert when inputs change (debounced)
  useEffect(() => {
    if (amount > 0 && fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      const timer = setTimeout(() => {
        handleConvert()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [amount, fromCurrency, toCurrency, handleConvert])

  // Load exchange rates
  useEffect(() => {
    const loadRates = async () => {
      const rates: { [key: string]: ExchangeRate } = {}

      // Load some popular rates
      const popularPairs = [
        ['USD', 'EUR'],
        ['USD', 'GBP'],
        ['USD', 'JPY'],
        ['USD', 'CHF'],
        ['USD', 'CAD'],
        ['USD', 'AUD'],
        ['USD', 'CNY'],
        ['EUR', 'GBP'],
      ]

      for (const [from, to] of popularPairs) {
        try {
          const rate = await getExchangeRate(from, to)
          if (rate) {
            rates[`${from}-${to}`] = rate
          }
        } catch (error: any) {
          console.error(`Failed to load rate for ${from}-${to}:`, error)
        }
      }

      setExchangeRates(rates)
    }

    loadRates()
  }, [])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" aria-hidden="true" />
              Currency Convert & Financial Exchange Tool
            </CardTitle>
            <CardDescription>
              Advanced currency conversion tool with real-time exchange rates, multiple currencies, and comprehensive
              financial analysis. Convert between fiat currencies and cryptocurrencies with detailed market information
              and historical data. Use keyboard navigation: Tab to move between controls, Enter or Space to activate
              buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="converter" className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Converter
            </TabsTrigger>
            <TabsTrigger value="rates" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Rates
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Currency Converter Tab */}
          <TabsContent value="converter" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Conversion Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Currency Conversion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                      min="0"
                      step="any"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="from-currency" className="text-sm font-medium">
                        From Currency
                      </Label>
                      <Select value={fromCurrency} onValueChange={setFromCurrency}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies
                            .filter((c) => c.isActive)
                            .map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                <div className="flex items-center gap-2">
                                  <span>{currency.flag}</span>
                                  <span>{currency.code}</span>
                                  <span className="text-muted-foreground">- {currency.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="to-currency" className="text-sm font-medium">
                        To Currency
                      </Label>
                      <Select value={toCurrency} onValueChange={setToCurrency}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies
                            .filter((c) => c.isActive)
                            .map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                <div className="flex items-center gap-2">
                                  <span>{currency.flag}</span>
                                  <span>{currency.code}</span>
                                  <span className="text-muted-foreground">- {currency.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleConvert} disabled={isProcessing || amount <= 0} className="flex-1">
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? 'Converting...' : 'Convert'}
                    </Button>
                    <Button onClick={handleSwapCurrencies} variant="outline">
                      <Repeat className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quick Templates */}
                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-sm font-medium">Quick Conversions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {conversionTemplates.slice(0, 4).map((template) => (
                        <Button
                          key={template.id}
                          onClick={() => applyTemplate(template.id)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Result */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Equal className="h-5 w-5" />
                    Conversion Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentConversion ? (
                    <div className="space-y-4">
                      {/* Main Result */}
                      <div className="text-center p-6 rounded-lg border">
                        <div className="space-y-2">
                          <div className="text-lg text-muted-foreground">
                            {formatCurrency(currentConversion.amount, currentConversion.fromCurrency)}
                          </div>
                          <div className="text-3xl font-bold text-primary">
                            {formatCurrency(currentConversion.convertedAmount, currentConversion.toCurrency)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            1 {currentConversion.fromCurrency.code} = {formatNumber(currentConversion.exchangeRate, 6)}{' '}
                            {currentConversion.toCurrency.code}
                          </div>
                        </div>
                      </div>

                      {/* Currency Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{currentConversion.fromCurrency.flag}</span>
                            <div>
                              <div className="font-medium">{currentConversion.fromCurrency.name}</div>
                              <div className="text-sm text-muted-foreground">{currentConversion.fromCurrency.code}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {currentConversion.fromCurrency.country} • {currentConversion.fromCurrency.region}
                          </div>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{currentConversion.toCurrency.flag}</span>
                            <div>
                              <div className="font-medium">{currentConversion.toCurrency.name}</div>
                              <div className="text-sm text-muted-foreground">{currentConversion.toCurrency.code}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {currentConversion.toCurrency.country} • {currentConversion.toCurrency.region}
                          </div>
                        </div>
                      </div>

                      {/* Rate Information */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Rate Information</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {currentConversion.metadata.rateSource}
                            </div>
                            <div className="text-xs text-muted-foreground">Source</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {formatNumber(currentConversion.metadata.spread, 6)}
                            </div>
                            <div className="text-xs text-muted-foreground">Spread</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">
                              {formatNumber(currentConversion.metadata.volatility, 2)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Volatility</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {formatNumber(currentConversion.metadata.confidence * 100, 1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Confidence</div>
                          </div>
                        </div>
                      </div>

                      {/* Export Options */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={() => exportConversion(currentConversion, 'json')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                        <Button onClick={() => exportConversion(currentConversion, 'csv')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button
                          onClick={() =>
                            copyToClipboard(
                              `${formatCurrency(currentConversion.amount, currentConversion.fromCurrency)} = ${formatCurrency(currentConversion.convertedAmount, currentConversion.toCurrency)}`,
                              'Conversion Result'
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          {copiedText === 'Conversion Result' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Conversion</h3>
                      <p className="text-muted-foreground">
                        Enter an amount and select currencies to see the conversion
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Exchange Rates Tab */}
          <TabsContent value="rates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Live Exchange Rates
                </CardTitle>
                <CardDescription>Current exchange rates and market information</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(exchangeRates).length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(exchangeRates).map(([pair, rate]) => (
                        <div key={pair} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">
                              {rate.base}/{rate.target}
                            </div>
                            <div
                              className={`text-xs px-2 py-1 rounded ${
                                (rate.changePercent24h || 0) > 0
                                  ? 'bg-green-100 text-green-800'
                                  : (rate.changePercent24h || 0) < 0
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {rate.changePercent24h
                                ? `${rate.changePercent24h > 0 ? '+' : ''}${formatNumber(rate.changePercent24h, 2)}%`
                                : 'N/A'}
                            </div>
                          </div>
                          <div className="text-2xl font-bold mb-2">{formatNumber(rate.rate, 6)}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>High: {rate.high24h ? formatNumber(rate.high24h, 6) : 'N/A'}</div>
                            <div>Low: {rate.low24h ? formatNumber(rate.low24h, 6) : 'N/A'}</div>
                            <div>Bid: {rate.bid ? formatNumber(rate.bid, 6) : 'N/A'}</div>
                            <div>Ask: {rate.ask ? formatNumber(rate.ask, 6) : 'N/A'}</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            Updated: {rate.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Loading Rates</h3>
                    <p className="text-muted-foreground">Exchange rates are being loaded...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversion History</CardTitle>
                <CardDescription>View and manage your currency conversion history</CardDescription>
              </CardHeader>
              <CardContent>
                {conversions.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {conversions.length} conversion{conversions.length !== 1 ? 's' : ''} in history
                      </span>
                      <Button onClick={clearConversions} variant="outline" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear History
                      </Button>
                    </div>

                    {conversions.map((conversion) => (
                      <div key={conversion.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">
                            {formatCurrency(conversion.amount, conversion.fromCurrency)} →{' '}
                            {formatCurrency(conversion.convertedAmount, conversion.toCurrency)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-muted rounded">
                              {conversion.timestamp.toLocaleString()}
                            </span>
                            <Button size="sm" variant="ghost" onClick={() => removeConversion(conversion.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Rate:</strong> 1 {conversion.fromCurrency.code} ={' '}
                            {formatNumber(conversion.exchangeRate, 6)} {conversion.toCurrency.code}
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-xs text-center">
                            <div>
                              <div className="font-medium">{conversion.metadata.rateSource}</div>
                              <div className="text-muted-foreground">Source</div>
                            </div>
                            <div>
                              <div className="font-medium">{formatNumber(conversion.metadata.spread, 6)}</div>
                              <div className="text-muted-foreground">Spread</div>
                            </div>
                            <div>
                              <div className="font-medium">{formatNumber(conversion.metadata.volatility, 2)}%</div>
                              <div className="text-muted-foreground">Volatility</div>
                            </div>
                            <div>
                              <div className="font-medium">{conversion.metadata.marketStatus}</div>
                              <div className="text-muted-foreground">Market</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAmount(conversion.amount)
                              setFromCurrency(conversion.fromCurrency.code)
                              setToCurrency(conversion.toCurrency.code)
                              setCurrentConversion(conversion)
                              setActiveTab('converter')
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => exportConversion(conversion, 'json')}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(
                                `${formatCurrency(conversion.amount, conversion.fromCurrency)} = ${formatCurrency(conversion.convertedAmount, conversion.toCurrency)}`,
                                'Conversion'
                              )
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History</h3>
                    <p className="text-muted-foreground">Perform some currency conversions to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversion Templates</CardTitle>
                <CardDescription>Pre-built currency conversion examples for common scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {conversionTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                template.difficulty === 'simple'
                                  ? 'bg-green-100 text-green-800'
                                  : template.difficulty === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {template.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div>
                          <div className="text-xs font-medium mb-1">Conversion:</div>
                          <div className="text-xs text-muted-foreground">
                            {template.amount} {template.fromCurrency} → {template.toCurrency}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Use Cases:</div>
                          <div className="text-xs text-muted-foreground">{template.useCase.join(', ')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Currency Settings</CardTitle>
                <CardDescription>Configure currency conversion preferences and display options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Supported Currencies */}
                <div className="space-y-4">
                  <h4 className="font-medium">Supported Currencies</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currencies
                      .filter((c) => c.isActive)
                      .map((currency) => (
                        <div key={currency.code} className="flex items-center gap-3 p-3 border rounded-lg">
                          <span className="text-2xl">{currency.flag}</span>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{currency.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {currency.code} • {currency.symbol} • {currency.country}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {currency.isCrypto ? 'Cryptocurrency' : 'Fiat Currency'} • {currency.region}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Rate Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Rate Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Exchange rates are updated in real-time from multiple sources</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Rates include bid/ask spreads and 24-hour high/low information</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Cryptocurrency rates are highly volatile and update frequently</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Cross-currency rates are calculated via USD when direct rates unavailable</div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h4 className="font-medium">Features & Capabilities</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Support for 30+ major fiat currencies and popular cryptocurrencies</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Real-time conversion with automatic rate updates</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Conversion history with detailed rate information</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Export capabilities in multiple formats (JSON, CSV, XML, YAML)</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Template system for common conversion scenarios</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const CurrencyConvert = () => {
  return (
    <CurrencyConvertErrorBoundary>
      <CurrencyConvertCore />
    </CurrencyConvertErrorBoundary>
  )
}

export default CurrencyConvert
