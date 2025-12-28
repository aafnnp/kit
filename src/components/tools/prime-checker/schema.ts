// ==================== Prime Checker Types ====================

/**
 * Prime Algorithm type
 */
export type primeAlgorithm = "trial_division" | "sieve_of_eratosthenes" | "miller_rabin" | "fermat" | "solovay_strassen" | "aks"

/**
 * Generation Algorithm type
 */
export type generationAlgorithm = "sieve" | "incremental" | "wheel" | "segmented_sieve"

/**
 * Number Type type
 */
export type numberType = "small" | "medium" | "large" | "very_large"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml" | "yaml"

/**
 * Prime Factor type
 */
export interface primeFactor {
  prime: number,
  exponent: number,
}

/**
 * Mathematical Property type
 */
export interface mathematicalProperty {
  name: string,
  value: boolean | number | string,
  description: string,
}

/**
 * Related Prime type
 */
export interface relatedPrime {
  type: "twin"| "cousin" | "sexy" | "safe" | "sophie_germain" | "mersenne" | "fermat",
  prime: number,
  relationship: string,
}

/**
 * Prime Metadata type
 */
export interface primeMetadata {
  testTime: number,
  complexity: number,
  digitCount: number,
  numberType: numberType,
  mathematicalProperties: mathematicalProperty[],
  relatedPrimes: relatedPrime[],
  primeGaps: number[],
}

/**
 * Prime Analysis type
 */
export interface primeAnalysis {
  id: string,
  number: number,
  isPrime: boolean,
  algorithm: primeAlgorithm,
  factors: number[],
  primeFactorization: primeFactor[],
  metadata: primeMetadata,
  timestamp: Date,
}

/**
 * Prime Error type
 */
export interface primeError {
  message: string,
  type: "input"| "range" | "performance" | "algorithm",
  severity: "error"| "warning" | "info",
}

/**
 * Prime Validation type
 */
export interface primeValidation {
  isValid: boolean,
  errors: primeError[],
  warnings: string[],
  suggestions: string[],
  qualityScore: number,
}

/**
 * Prime Template type
 */
export interface primeTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  numbers: number[],
  expectedResults: boolean[],
  useCase: string[],
  difficulty: "simple"| "medium" | "complex",
}

// ==================== Type Exports ====================

export type PrimeAlgorithm = primeAlgorithm
export type GenerationAlgorithm = generationAlgorithm
export type NumberType = numberType
export type ExportFormat = exportFormat
export type PrimeFactor = primeFactor
export type MathematicalProperty = mathematicalProperty
export type RelatedPrime = relatedPrime
export type PrimeMetadata = primeMetadata
export type PrimeAnalysis = primeAnalysis
export type PrimeError = primeError
export type PrimeValidation = primeValidation
export type PrimeTemplate = primeTemplate
