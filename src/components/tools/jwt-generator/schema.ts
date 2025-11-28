import { z } from "zod"

// ==================== JWT Generator Schemas ====================

/**
 * JWT Algorithm schema
 */
export const jwtAlgorithmSchema = z.enum([
  "HS256",
  "HS384",
  "HS512",
  "RS256",
  "RS384",
  "RS512",
  "ES256",
  "ES384",
  "ES512",
  "PS256",
  "PS384",
  "PS512",
  "none",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml", "yaml"])

/**
 * JWT Header schema
 */
export const jwtHeaderSchema = z
  .object({
    alg: jwtAlgorithmSchema,
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
 * JWT Options schema
 */
export const jwtOptionsSchema = z.object({
  includeIssuedAt: z.boolean(),
  includeJwtId: z.boolean(),
  includeKeyId: z.boolean(),
  validateClaims: z.boolean(),
  allowInsecureAlgorithms: z.boolean(),
  customHeaderClaims: z.boolean(),
  timestampPrecision: z.enum(["seconds", "milliseconds"]),
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
 * JWT Error schema
 */
export const jwtErrorSchema = z.object({
  message: z.string(),
  type: z.enum([
    "header",
    "payload",
    "signature",
    "algorithm",
    "claims",
    "security",
  ]),
  severity: z.enum(["error", "warning", "info"]),
  field: z.string().optional(),
})

/**
 * JWT Analysis schema
 */
export const jwtAnalysisSchema = z.object({
  isValid: z.boolean(),
  securityLevel: z.enum(["high", "medium", "low", "critical"]),
  riskScore: z.number(),
  compliance: jwtComplianceSchema,
  recommendations: z.array(z.string()),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
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

/**
 * JWT Metadata schema
 */
export const jwtMetadataSchema = z.object({
  size: z.number(),
  headerSize: z.number(),
  payloadSize: z.number(),
  signatureSize: z.number(),
  entropy: z.number(),
  uniqueClaims: z.number(),
  estimatedStrength: z.number(),
})

/**
 * JWT Generator Config schema
 */
export const jwtGeneratorConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  header: jwtHeaderSchema,
  payload: jwtPayloadSchema,
  secret: z.string(),
  algorithm: jwtAlgorithmSchema,
  expiresIn: z.string(),
  notBefore: z.string().optional(),
  audience: z.string().optional(),
  issuer: z.string().optional(),
  subject: z.string().optional(),
  jwtId: z.string().optional(),
  customClaims: z.record(z.string(), z.any()),
  options: jwtOptionsSchema,
  createdAt: z.date(),
})

/**
 * Generated JWT schema
 */
export const generatedJWTSchema = z.object({
  id: z.string(),
  token: z.string(),
  config: jwtGeneratorConfigSchema,
  header: jwtHeaderSchema,
  payload: jwtPayloadSchema,
  signature: z.string(),
  analysis: jwtAnalysisSchema,
  validation: jwtValidationSchema,
  metadata: jwtMetadataSchema,
  createdAt: z.date(),
})

/**
 * JWT Template schema
 */
export const jwtTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  config: jwtGeneratorConfigSchema.partial(),
  useCase: z.array(z.string()),
  features: z.array(z.string()),
  securityLevel: z.enum(["high", "medium", "low"]),
  example: z.string().optional(),
})

/**
 * Batch Settings schema
 */
export const batchSettingsSchema = z.object({
  baseConfig: jwtGeneratorConfigSchema,
  count: z.number(),
  namingPattern: z.string(),
  exportFormat: exportFormatSchema,
  includeAnalysis: z.boolean(),
  varyPayload: z.boolean(),
  varyExpiration: z.boolean(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalGenerated: z.number(),
  successfulGenerated: z.number(),
  failedGenerated: z.number(),
  averageSize: z.number(),
  averageSecurityScore: z.number(),
  algorithmDistribution: z.record(z.string(), z.number()),
  totalProcessingTime: z.number(),
  averageProcessingTime: z.number(),
})

/**
 * JWT Batch schema
 */
export const jwtBatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  tokens: z.array(generatedJWTSchema),
  settings: batchSettingsSchema,
  status: z.enum(["pending", "processing", "completed", "failed"]),
  progress: z.number(),
  statistics: batchStatisticsSchema,
  createdAt: z.date(),
  completedAt: z.date().optional(),
})

// ==================== Type Exports ====================

export type JWTAlgorithm = z.infer<typeof jwtAlgorithmSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type JWTHeader = z.infer<typeof jwtHeaderSchema>
export type JWTPayload = z.infer<typeof jwtPayloadSchema>
export type JWTOptions = z.infer<typeof jwtOptionsSchema>
export type JWTCompliance = z.infer<typeof jwtComplianceSchema>
export type JWTError = z.infer<typeof jwtErrorSchema>
export type JWTAnalysis = z.infer<typeof jwtAnalysisSchema>
export type JWTValidation = z.infer<typeof jwtValidationSchema>
export type JWTMetadata = z.infer<typeof jwtMetadataSchema>
export type JWTGeneratorConfig = z.infer<typeof jwtGeneratorConfigSchema>
export type GeneratedJWT = z.infer<typeof generatedJWTSchema>
export type JWTTemplate = z.infer<typeof jwtTemplateSchema>
export type BatchSettings = z.infer<typeof batchSettingsSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type JWTBatch = z.infer<typeof jwtBatchSchema>

