import { z } from "zod"

// ==================== JWT Decode Schemas ====================

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml", "yaml"])

/**
 * JWT Header schema
 */
export const jwtHeaderSchema = z
  .object({
    alg: z.string(),
    typ: z.string(),
    kid: z.string().optional(),
    cty: z.string().optional(),
    crit: z.array(z.string()).optional(),
    x5c: z.array(z.string()).optional(),
    x5t: z.string().optional(),
    x5u: z.string().optional(),
    jku: z.string().optional(),
    jwk: z.any().optional(),
  })
  .catchall(z.any())

/**
 * JWT Payload schema
 */
export const jwtPayloadSchema = z
  .object({
    iss: z.string().optional(),
    sub: z.string().optional(),
    aud: z.union([z.string(), z.array(z.string())]).optional(),
    exp: z.number().optional(),
    nbf: z.number().optional(),
    iat: z.number().optional(),
    jti: z.string().optional(),
    scope: z.string().optional(),
    roles: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
  })
  .catchall(z.any())

/**
 * JWT Structure schema
 */
export const jwtStructureSchema = z.object({
  hasHeader: z.boolean(),
  hasPayload: z.boolean(),
  hasSignature: z.boolean(),
  headerValid: z.boolean(),
  payloadValid: z.boolean(),
  signaturePresent: z.boolean(),
  partsCount: z.number(),
  encoding: z.enum(["base64url", "base64", "invalid"]),
})

/**
 * JWT Claims schema
 */
export const jwtClaimsSchema = z.object({
  standardClaims: z.array(z.string()),
  customClaims: z.array(z.string()),
  missingRecommendedClaims: z.array(z.string()),
  claimTypes: z.record(z.string(), z.string()),
  claimSizes: z.record(z.string(), z.number()),
})

/**
 * JWT Timing schema
 */
export const jwtTimingSchema = z.object({
  issuedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  notBefore: z.date().optional(),
  timeToExpiry: z.number().optional(),
  isExpired: z.boolean(),
  isNotYetValid: z.boolean(),
  lifetime: z.number().optional(),
  age: z.number().optional(),
})

/**
 * JWT Compliance schema
 */
export const jwtComplianceSchema = z.object({
  rfc7519Compliant: z.boolean(),
  hasRequiredClaims: z.boolean(),
  hasRecommendedClaims: z.boolean(),
  algorithmSupported: z.boolean(),
  structureValid: z.boolean(),
  complianceScore: z.number(),
})

/**
 * JWT Vulnerability schema
 */
export const jwtVulnerabilitySchema = z.object({
  type: z.enum(["algorithm", "timing", "claims", "structure", "signature"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  description: z.string(),
  recommendation: z.string(),
})

/**
 * JWT Security schema
 */
export const jwtSecuritySchema = z.object({
  algorithm: z.string(),
  algorithmType: z.enum(["symmetric", "asymmetric", "none", "unknown"]),
  securityLevel: z.enum(["high", "medium", "low", "critical"]),
  vulnerabilities: z.array(jwtVulnerabilitySchema),
  recommendations: z.array(z.string()),
  riskScore: z.number(),
  signatureVerifiable: z.boolean(),
})

/**
 * JWT Analysis schema
 */
export const jwtAnalysisSchema = z.object({
  structure: jwtStructureSchema,
  claims: jwtClaimsSchema,
  timing: jwtTimingSchema,
  compliance: jwtComplianceSchema,
  recommendations: z.array(z.string()),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
})

/**
 * JWT Metadata schema
 */
export const jwtMetadataSchema = z.object({
  size: z.number(),
  headerSize: z.number(),
  payloadSize: z.number(),
  signatureSize: z.number(),
  compressionRatio: z.number(),
  entropy: z.number(),
  uniqueClaims: z.number(),
  nestedLevels: z.number(),
})

/**
 * JWT Token schema
 */
export const jwtTokenSchema = z.object({
  id: z.string(),
  raw: z.string(),
  header: jwtHeaderSchema,
  payload: jwtPayloadSchema,
  signature: z.string(),
  isValid: z.boolean(),
  isExpired: z.boolean(),
  timeToExpiry: z.number().optional(),
  algorithm: z.string(),
  keyId: z.string().optional(),
  analysis: jwtAnalysisSchema,
  security: jwtSecuritySchema,
  metadata: jwtMetadataSchema,
  createdAt: z.date(),
})

/**
 * Batch Settings schema
 */
export const batchSettingsSchema = z.object({
  includeAnalysis: z.boolean(),
  includeSecurityCheck: z.boolean(),
  exportFormat: exportFormatSchema,
  namingPattern: z.string(),
  validateSignatures: z.boolean(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalTokens: z.number(),
  validTokens: z.number(),
  expiredTokens: z.number(),
  invalidTokens: z.number(),
  averageSecurityScore: z.number(),
  averageComplianceScore: z.number(),
  algorithmDistribution: z.record(z.string(), z.number()),
  issuerDistribution: z.record(z.string(), z.number()),
  totalProcessingTime: z.number(),
  averageProcessingTime: z.number(),
})

/**
 * JWT Batch schema
 */
export const jwtBatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  tokens: z.array(jwtTokenSchema),
  settings: batchSettingsSchema,
  status: z.enum(["pending", "processing", "completed", "failed"]),
  progress: z.number(),
  statistics: batchStatisticsSchema,
  createdAt: z.date(),
  completedAt: z.date().optional(),
})

/**
 * JWT Template schema
 */
export const jwtTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  example: z.string(),
  useCase: z.array(z.string()),
  features: z.array(z.string()),
  securityLevel: z.enum(["high", "medium", "low"]),
})

/**
 * JWT Error schema
 */
export const jwtErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["structure", "header", "payload", "signature", "timing", "security"]),
  severity: z.enum(["error", "warning", "info"]),
  location: z.string().optional(),
})

/**
 * JWT Validation schema
 */
export const jwtValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(jwtErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  qualityScore: z.number(),
})

// ==================== Type Exports ====================

export type ExportFormat = z.infer<typeof exportFormatSchema>
export type JWTHeader = z.infer<typeof jwtHeaderSchema>
export type JWTPayload = z.infer<typeof jwtPayloadSchema>
export type JWTStructure = z.infer<typeof jwtStructureSchema>
export type JWTClaims = z.infer<typeof jwtClaimsSchema>
export type JWTTiming = z.infer<typeof jwtTimingSchema>
export type JWTCompliance = z.infer<typeof jwtComplianceSchema>
export type JWTVulnerability = z.infer<typeof jwtVulnerabilitySchema>
export type JWTSecurity = z.infer<typeof jwtSecuritySchema>
export type JWTAnalysis = z.infer<typeof jwtAnalysisSchema>
export type JWTMetadata = z.infer<typeof jwtMetadataSchema>
export type JWTToken = z.infer<typeof jwtTokenSchema>
export type BatchSettings = z.infer<typeof batchSettingsSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type JWTBatch = z.infer<typeof jwtBatchSchema>
export type JWTTemplate = z.infer<typeof jwtTemplateSchema>
export type JWTError = z.infer<typeof jwtErrorSchema>
export type JWTValidation = z.infer<typeof jwtValidationSchema>
