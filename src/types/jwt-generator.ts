// JWT Generator 相关类型声明
export interface JWTGeneratorConfig {
  id: string
  name: string
  header: JWTHeader
  payload: JWTPayload
  secret: string
  algorithm: JWTAlgorithm
  expiresIn: string
  notBefore?: string
  audience?: string
  issuer?: string
  subject?: string
  jwtId?: string
  customClaims: Record<string, any>
  options: JWTOptions
  createdAt: Date
}

export interface JWTHeader {
  alg: JWTAlgorithm
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

export interface JWTOptions {
  includeIssuedAt: boolean
  includeJwtId: boolean
  includeKeyId: boolean
  validateClaims: boolean
  allowInsecureAlgorithms: boolean
  customHeaderClaims: boolean
  timestampPrecision: 'seconds' | 'milliseconds'
}

export interface GeneratedJWT {
  id: string
  token: string
  config: JWTGeneratorConfig
  header: JWTHeader
  payload: JWTPayload
  signature: string
  analysis: JWTAnalysis
  validation: JWTValidation
  metadata: JWTMetadata
  createdAt: Date
}

export interface JWTAnalysis {
  isValid: boolean
  securityLevel: 'high' | 'medium' | 'low' | 'critical'
  riskScore: number
  compliance: JWTCompliance
  recommendations: string[]
  warnings: string[]
  errors: string[]
}

export interface JWTCompliance {
  rfc7519Compliant: boolean
  hasRequiredClaims: boolean
  hasRecommendedClaims: boolean
  algorithmSupported: boolean
  structureValid: boolean
  complianceScore: number
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
  type: 'header' | 'payload' | 'signature' | 'algorithm' | 'claims' | 'security'
  severity: 'error' | 'warning' | 'info'
  field?: string
}

export interface JWTMetadata {
  size: number
  headerSize: number
  payloadSize: number
  signatureSize: number
  entropy: number
  uniqueClaims: number
  estimatedStrength: number
}

export interface JWTTemplate {
  id: string
  name: string
  description: string
  category: string
  config: Partial<JWTGeneratorConfig>
  useCase: string[]
  features: string[]
  securityLevel: 'high' | 'medium' | 'low'
  example?: string
}

export interface JWTBatch {
  id: string
  name: string
  tokens: GeneratedJWT[]
  settings: BatchSettings
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  statistics: BatchStatistics
  createdAt: Date
  completedAt?: Date
}

export interface BatchSettings {
  baseConfig: JWTGeneratorConfig
  count: number
  namingPattern: string
  exportFormat: ExportFormat
  includeAnalysis: boolean
  varyPayload: boolean
  varyExpiration: boolean
}

export interface BatchStatistics {
  totalGenerated: number
  successfulGenerated: number
  failedGenerated: number
  averageSize: number
  averageSecurityScore: number
  algorithmDistribution: Record<string, number>
  totalProcessingTime: number
  averageProcessingTime: number
}

export type JWTAlgorithm =
  | 'HS256'
  | 'HS384'
  | 'HS512'
  | 'RS256'
  | 'RS384'
  | 'RS512'
  | 'ES256'
  | 'ES384'
  | 'ES512'
  | 'PS256'
  | 'PS384'
  | 'PS512'
  | 'none'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'yaml'
