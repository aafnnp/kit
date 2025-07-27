// Prime Checker 相关类型声明
export interface PrimeAnalysis {
  id: string
  number: number
  isPrime: boolean
  algorithm: PrimeAlgorithm
  factors: number[]
  primeFactorization: PrimeFactor[]
  metadata: PrimeMetadata
  timestamp: Date
}

export interface PrimeFactor {
  prime: number
  exponent: number
}

export interface PrimeMetadata {
  testTime: number
  complexity: number
  digitCount: number
  numberType: NumberType
  mathematicalProperties: MathematicalProperty[]
  relatedPrimes: RelatedPrime[]
  primeGaps: number[]
}

export interface MathematicalProperty {
  name: string
  value: boolean | number | string
  description: string
}

export interface RelatedPrime {
  type: 'twin' | 'cousin' | 'sexy' | 'safe' | 'sophie_germain' | 'mersenne' | 'fermat'
  prime: number
  relationship: string
}

export interface PrimeValidation {
  isValid: boolean
  errors: PrimeError[]
  warnings: string[]
  suggestions: string[]
  qualityScore: number
}

export interface PrimeError {
  message: string
  type: 'input' | 'range' | 'performance' | 'algorithm'
  severity: 'error' | 'warning' | 'info'
}

export interface PrimeTemplate {
  id: string
  name: string
  description: string
  category: string
  numbers: number[]
  expectedResults: boolean[]
  useCase: string[]
  difficulty: 'simple' | 'medium' | 'complex'
}

export type PrimeAlgorithm =
  | 'trial_division'
  | 'sieve_of_eratosthenes'
  | 'miller_rabin'
  | 'fermat'
  | 'solovay_strassen'
  | 'aks'
export type GenerationAlgorithm = 'sieve' | 'incremental' | 'wheel' | 'segmented_sieve'
export type NumberType = 'small' | 'medium' | 'large' | 'very_large'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'yaml'
