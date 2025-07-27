// JWT Decode 相关类型声明
export interface JWTToken {
  id: string
  raw: string
  header: JWTHeader
  payload: JWTPayload
  signature: string
  isValid: boolean
  isExpired: boolean
  timeToExpiry?: number
  algorithm: string
  keyId?: string
  analysis: JWTAnalysis
  security: JWTSecurity
  metadata: JWTMetadata
  createdAt: Date
}

export interface JWTHeader {
  alg: string
  typ: string
  kid?: string
  cty?: string
  crit?: string[]
  x5c?: string[]
  x5t?: string
  x5u?: string
  jku?: string
  jwk?: any
  [key: string]: any
}

export interface JWTPayload {
  iss?: string
  sub?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
  scope?: string
  roles?: string[]
  permissions?: string[]
  [key: string]: any
}

export interface JWTAnalysis {
  structure: JWTStructure
  claims: JWTClaims
  timing: JWTTiming
  compliance: JWTCompliance
  recommendations: string[]
  warnings: string[]
  errors: string[]
}

export interface JWTStructure {
  hasHeader: boolean
  hasPayload: boolean
  hasSignature: boolean
  headerValid: boolean
  payloadValid: boolean
  signaturePresent: boolean
  partsCount: number
  encoding: 'base64url' | 'base64' | 'invalid'
}

export interface JWTClaims {
  standardClaims: string[]
  customClaims: string[]
  missingRecommendedClaims: string[]
  claimTypes: Record<string, string>
  claimSizes: Record<string, number>
}

export interface JWTTiming {
  issuedAt?: Date
  expiresAt?: Date
  notBefore?: Date
  timeToExpiry?: number
  isExpired: boolean
  isNotYetValid: boolean
  lifetime?: number
  age?: number
}

export interface JWTCompliance {
  rfc7519Compliant: boolean
  hasRequiredClaims: boolean
  hasRecommendedClaims: boolean
  algorithmSupported: boolean
  structureValid: boolean
  complianceScore: number
}

export interface JWTSecurity {
  algorithm: string
  algorithmType: 'symmetric' | 'asymmetric' | 'none' | 'unknown'
  securityLevel: 'high' | 'medium' | 'low' | 'critical'
  vulnerabilities: JWTVulnerability[]
  recommendations: string[]
  riskScore: number
  signatureVerifiable: boolean
}

export interface JWTVulnerability {
  type: 'algorithm' | 'timing' | 'claims' | 'structure' | 'signature'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  recommendation: string
}

export interface JWTMetadata {
  size: number
  headerSize: number
  payloadSize: number
  signatureSize: number
  compressionRatio: number
  entropy: number
  uniqueClaims: number
  nestedLevels: number
}

export interface JWTBatch {
  id: string
  name: string
  tokens: JWTToken[]
  settings: BatchSettings
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  statistics: BatchStatistics
  createdAt: Date
  completedAt?: Date
}

export interface BatchSettings {
  includeAnalysis: boolean
  includeSecurityCheck: boolean
  exportFormat: ExportFormat
  namingPattern: string
  validateSignatures: boolean
}

export interface BatchStatistics {
  totalTokens: number
  validTokens: number
  expiredTokens: number
  invalidTokens: number
  averageSecurityScore: number
  averageComplianceScore: number
  algorithmDistribution: Record<string, number>
  issuerDistribution: Record<string, number>
  totalProcessingTime: number
  averageProcessingTime: number
}

export interface JWTTemplate {
  id: string
  name: string
  description: string
  category: string
  example: string
  useCase: string[]
  features: string[]
  securityLevel: 'high' | 'medium' | 'low'
}

export interface JWTValidation {
  isValid: boolean
  errors: JWTError[]
  warnings: string[]
  suggestions: string[]
  qualityScore: number
}

export interface JWTError {
  message: string
  type: 'structure' | 'header' | 'payload' | 'signature' | 'timing' | 'security'
  severity: 'error' | 'warning' | 'info'
  location?: string
}

export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'yaml'
