// ==================== JWT Decode Types ====================

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
 * JWT Vulnerability type
 */
export interface jwtVulnerability {
  type: string,
  severity: "critical" | "high" | "medium" | "low",
  description: string,
  recommendation: string,
}

/**
 * JWT Security type
 */
export interface jwtSecurity {
  algorithm: string,
  algorithmType: "symmetric" | "asymmetric" | "none" | "unknown",
  securityLevel: "high" | "medium" | "low" | "critical",
  riskScore: number,
  vulnerabilities: jwtVulnerability[],
  recommendations: string[],
  signatureVerifiable?: boolean,
}

/**
 * JWT Metadata type
 */
export interface jwtMetadata {
  size: number,
  headerSize: number,
  payloadSize: number,
  signatureSize: number,
  compressionRatio: number,
  entropy: number,
  uniqueClaims: number,
  nestedLevels: number,
}

/**
 * JWT Analysis type
 */
export interface jwtAnalysis {
  structure: jwtStructure,
  claims: jwtClaims,
  timing: jwtTiming,
  compliance: jwtCompliance,
  recommendations: string[],
  warnings: string[],
  errors: string[],
}

/**
 * JWT Token type
 */
export interface jwtToken {
  id: string,
  raw: string,
  header: jwtHeader,
  payload: jwtPayload,
  signature: string,
  isValid: boolean,
  isExpired: boolean,
  timeToExpiry: number | undefined,
  algorithm: string,
  keyId?: string,
  analysis: jwtAnalysis,
  security: jwtSecurity,
  metadata: jwtMetadata,
  createdAt: Date,
}

/**
 * JWT Validation Error type
 */
export interface jwtValidationError {
  message: string,
  type: "structure" | "header" | "payload" | "signature" | "security",
  severity: "error" | "warning" | "info",
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
 * Batch Settings type
 */
export interface batchSettings {
  includeAnalysis: boolean,
  includeSecurity: boolean,
  validateTokens: boolean,
  exportFormat: exportFormat,
  realTimeProcessing: boolean,
  namingPattern?: string,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalProcessed: number,
  totalTokens?: number,
  validCount: number,
  validTokens?: number,
  invalidCount: number,
  invalidTokens?: number,
  expiredCount: number,
  expiredTokens?: number,
  averageQualityScore?: number,
  averageSecurityScore?: number,
  averageComplianceScore?: number,
  securityDistribution?: Record<string, number>,
  algorithmDistribution: Record<string, number>,
  issuerDistribution?: Record<string, number>,
  processingTime: number,
  averageProcessingTime?: number,
}

/**
 * JWT Batch type
 */
export interface jwtBatch {
  id: string,
  name?: string,
  tokens: jwtToken[],
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
  example: string,
  useCase: string[],
  features?: string[],
  securityLevel: "high" | "medium" | "low",
}

// ==================== Type Exports ====================

export type ExportFormat = exportFormat
export type JWTHeader = jwtHeader
export type JWTPayload = jwtPayload
export type JWTStructure = jwtStructure
export type JWTClaims = jwtClaims
export type JWTTiming = jwtTiming
export type JWTCompliance = jwtCompliance
export type JWTVulnerability = jwtVulnerability
export type JWTSecurity = jwtSecurity
export type JWTMetadata = jwtMetadata
export type JWTAnalysis = jwtAnalysis
export type JWTToken = jwtToken
export type JWTValidationError = jwtValidationError
export type JWTValidation = jwtValidation
export type BatchSettings = batchSettings
export type BatchStatistics = batchStatistics
export type JWTBatch = jwtBatch
export type JWTTemplate = jwtTemplate
