// ==================== JWT Generator Types ====================

/**
 * JWT Algorithm type
 */
export type jwtAlgorithm = "HS256" | "HS384" | "HS512" | "RS256" | "RS384" | "RS512" | "ES256" | "ES384" | "ES512" | "PS256" | "PS384" | "PS512" | "none"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml" | "yaml"

/**
 * JWT Header type
 */
export interface jwtHeader {
  alg: string,
  typ?: string,
  kid?: string,
  [key: string]: any,
}

/**
 * JWT Payload type
 */
export interface jwtPayload {
  iss?: string,
  sub?: string,
  aud?: string | string[],
  exp?: number,
  nbf?: number,
  iat?: number,
  jti?: string,
  [key: string]: any,
}

/**
 * JWT Generator Options type
 */
export interface jwtGeneratorOptions {
  includeIssuedAt: boolean,
  includeJwtId: boolean,
  includeKeyId: boolean,
  validateClaims: boolean,
  allowInsecureAlgorithms: boolean,
  customHeaderClaims: boolean,
  timestampPrecision: "seconds" | "milliseconds",
}

/**
 * JWT Generator Config type
 */
export interface jwtGeneratorConfig {
  id: string,
  name: string,
  header: jwtHeader,
  payload: jwtPayload,
  secret: string,
  algorithm: jwtAlgorithm,
  expiresIn?: string,
  issuer?: string,
  subject?: string,
  audience?: string,
  notBefore?: string,
  jwtId?: string,
  customClaims: Record<string, any>,
  options: jwtGeneratorOptions,
  createdAt: Date,
}

/**
 * JWT Structure type
 */
export interface jwtStructure {
  hasHeader: boolean,
  hasPayload: boolean,
  hasSignature: boolean,
  headerValid: boolean,
  payloadValid: boolean,
  signaturePresent: boolean,
  partsCount: number,
  encoding: string,
}

/**
 * JWT Claims type
 */
export interface jwtClaims {
  standardClaims: string[],
  customClaims: string[],
  missingRecommendedClaims: string[],
  claimTypes: Record<string, string>,
  claimSizes: Record<string, number>,
}

/**
 * JWT Timing type
 */
export interface jwtTiming {
  issuedAt?: Date,
  expiresAt?: Date,
  notBefore?: Date,
  timeToExpiry?: number,
  isExpired: boolean,
  isNotYetValid: boolean,
  lifetime?: number,
  age?: number,
}

/**
 * JWT Compliance type
 */
export interface jwtCompliance {
  rfc7519Compliant: boolean,
  hasRequiredClaims: boolean,
  hasRecommendedClaims: boolean,
  algorithmSupported: boolean,
  structureValid: boolean,
  complianceScore: number,
}

/**
 * JWT Analysis type
 */
export interface jwtAnalysis {
  isValid: boolean,
  securityLevel: "high" | "medium" | "low" | "critical",
  riskScore: number,
  compliance: jwtCompliance,
  recommendations: string[],
  warnings: string[],
  errors: string[],
}

/**
 * JWT Validation Error type
 */
export interface jwtValidationError {
  message: string,
  type: "header" | "payload" | "security" | "structure" | "algorithm",
  severity: "error" | "warning" | "info",
  field?: string,
}

/**
 * JWT Validation type
 */
export interface jwtValidation {
  isValid: boolean,
  errors: jwtValidationError[],
  warnings: string[],
  suggestions: string[],
  qualityScore: number,
}

/**
 * JWT Metadata type
 */
export interface jwtMetadata {
  size: number,
  headerSize: number,
  payloadSize: number,
  signatureSize: number,
  entropy: number,
  uniqueClaims: number,
  estimatedStrength: number,
}

/**
 * Generated JWT type
 */
export interface generatedJWT {
  id: string,
  token: string,
  config: jwtGeneratorConfig,
  header: jwtHeader,
  payload: jwtPayload,
  signature: string,
  analysis: jwtAnalysis,
  validation: jwtValidation,
  metadata: jwtMetadata,
  createdAt: Date,
}

/**
 * Batch Settings type
 */
export interface batchSettings {
  includeAnalysis: boolean,
  includeValidation: boolean,
  exportFormat: exportFormat,
  realTimeProcessing: boolean,
  namingPattern?: string,
  count?: number,
  baseConfig?: Partial<jwtGeneratorConfig>,
  varyPayload?: boolean,
  varyExpiration?: boolean,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalGenerated: number,
  successfulGenerated?: number,
  failedGenerated?: number,
  validCount: number,
  invalidCount: number,
  averageQualityScore?: number,
  averageSecurityScore?: number,
  algorithmDistribution: Record<string, number>,
  processingTime: number,
  totalProcessingTime?: number,
  averageProcessingTime?: number,
}

/**
 * JWT Batch type
 */
export interface jwtBatch {
  id: string,
  name?: string,
  tokens: generatedJWT[],
  count: number,
  settings: batchSettings,
  statistics: batchStatistics,
  status?: "pending" | "processing" | "completed" | "failed",
  progress?: number,
  createdAt: Date,
  completedAt?: Date,
}

/**
 * JWT Template type
 */
export interface jwtTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  config: Partial<jwtGeneratorConfig>,
  useCase: string[],
  features?: string[],
  securityLevel: "high" | "medium" | "low",
}

// ==================== Type Exports ====================

export type JWTAlgorithm = jwtAlgorithm
export type ExportFormat = exportFormat
export type JWTHeader = jwtHeader
export type JWTPayload = jwtPayload
export type JWTGeneratorOptions = jwtGeneratorOptions
export type JWTGeneratorConfig = jwtGeneratorConfig
export type JWTStructure = jwtStructure
export type JWTClaims = jwtClaims
export type JWTTiming = jwtTiming
export type JWTCompliance = jwtCompliance
export type JWTAnalysis = jwtAnalysis
export type JWTValidationError = jwtValidationError
export type JWTValidation = jwtValidation
export type JWTMetadata = jwtMetadata
export type GeneratedJWT = generatedJWT
export type BatchSettings = batchSettings
export type BatchStatistics = batchStatistics
export type JWTBatch = jwtBatch
export type JWTTemplate = jwtTemplate
