// Bcrypt Hash 工具类型声明

export interface BcryptFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  bcryptData?: BcryptData
}

export interface BcryptData {
  original: BcryptContent
  hashes: BcryptResult[]
  statistics: BcryptStatistics
  settings: BcryptSettings
}

export interface BcryptContent {
  content: string
  size: number
  type: 'password' | 'text'
  strength?: PasswordStrength
}

export interface BcryptResult {
  saltRounds: number
  hash: string
  salt: string
  processingTime: number
  verified?: boolean
  securityLevel: SecurityLevel
}

export interface BcryptStatistics {
  totalHashes: number
  saltRoundDistribution: Record<string, number>
  averageProcessingTime: number
  totalProcessingTime: number
  verificationCount: number
  successRate: number
  securityScore: number
}

export interface BcryptSettings {
  saltRounds: number[]
  includeTimestamp: boolean
  enableVerification: boolean
  batchProcessing: boolean
  realTimeHashing: boolean
  exportFormat: ExportFormat
  showPasswords: boolean
  passwordStrengthCheck: boolean
}

export interface BcryptTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<BcryptSettings>
  saltRounds: number[]
  securityLevel: SecurityLevel
}

export interface PasswordStrength {
  score: number
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
  feedback: string[]
  requirements: PasswordRequirement[]
}

export interface PasswordRequirement {
  name: string
  met: boolean
  description: string
}

export interface BcryptVerification {
  id: string
  password: string
  hash: string
  isValid: boolean
  processingTime: number
}

// 枚举与类型别名
export type SecurityLevel = 'low' | 'medium' | 'high' | 'very-high'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
