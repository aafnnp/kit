import { z } from "zod"

// ==================== Prime Checker Schemas ====================

/**
 * Prime Algorithm schema
 */
export const primeAlgorithmSchema = z.enum([
  "trial_division",
  "sieve_of_eratosthenes",
  "miller_rabin",
  "fermat",
  "solovay_strassen",
  "aks",
])

/**
 * Generation Algorithm schema
 */
export const generationAlgorithmSchema = z.enum(["sieve", "incremental", "wheel", "segmented_sieve"])

/**
 * Number Type schema
 */
export const numberTypeSchema = z.enum(["small", "medium", "large", "very_large"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml", "yaml"])

/**
 * Prime Factor schema
 */
export const primeFactorSchema = z.object({
  prime: z.number(),
  exponent: z.number(),
})

/**
 * Mathematical Property schema
 */
export const mathematicalPropertySchema = z.object({
  name: z.string(),
  value: z.union([z.boolean(), z.number(), z.string()]),
  description: z.string(),
})

/**
 * Related Prime schema
 */
export const relatedPrimeSchema = z.object({
  type: z.enum(["twin", "cousin", "sexy", "safe", "sophie_germain", "mersenne", "fermat"]),
  prime: z.number(),
  relationship: z.string(),
})

/**
 * Prime Metadata schema
 */
export const primeMetadataSchema = z.object({
  testTime: z.number(),
  complexity: z.number(),
  digitCount: z.number(),
  numberType: numberTypeSchema,
  mathematicalProperties: z.array(mathematicalPropertySchema),
  relatedPrimes: z.array(relatedPrimeSchema),
  primeGaps: z.array(z.number()),
})

/**
 * Prime Analysis schema
 */
export const primeAnalysisSchema = z.object({
  id: z.string(),
  number: z.number(),
  isPrime: z.boolean(),
  algorithm: primeAlgorithmSchema,
  factors: z.array(z.number()),
  primeFactorization: z.array(primeFactorSchema),
  metadata: primeMetadataSchema,
  timestamp: z.date(),
})

/**
 * Prime Error schema
 */
export const primeErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["input", "range", "performance", "algorithm"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * Prime Validation schema
 */
export const primeValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(primeErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  qualityScore: z.number(),
})

/**
 * Prime Template schema
 */
export const primeTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  numbers: z.array(z.number()),
  expectedResults: z.array(z.boolean()),
  useCase: z.array(z.string()),
  difficulty: z.enum(["simple", "medium", "complex"]),
})

// ==================== Type Exports ====================

export type PrimeAlgorithm = z.infer<typeof primeAlgorithmSchema>
export type GenerationAlgorithm = z.infer<typeof generationAlgorithmSchema>
export type NumberType = z.infer<typeof numberTypeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type PrimeFactor = z.infer<typeof primeFactorSchema>
export type MathematicalProperty = z.infer<typeof mathematicalPropertySchema>
export type RelatedPrime = z.infer<typeof relatedPrimeSchema>
export type PrimeMetadata = z.infer<typeof primeMetadataSchema>
export type PrimeAnalysis = z.infer<typeof primeAnalysisSchema>
export type PrimeError = z.infer<typeof primeErrorSchema>
export type PrimeValidation = z.infer<typeof primeValidationSchema>
export type PrimeTemplate = z.infer<typeof primeTemplateSchema>
