// Password Generator 相关类型声明
export interface PasswordItem {
  id: string
  password: string
  type: PasswordType
  strength: PasswordStrength
  entropy: number
  createdAt: Date
  settings: PasswordSettings
}

export interface PasswordStrength {
  score: number
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
  feedback: string[]
  requirements: PasswordRequirement[]
  entropy: number
  timeToCrack: string
}

export interface PasswordRequirement {
  name: string
  met: boolean
  description: string
  weight: number
}

export interface PasswordSettings {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeSimilar: boolean
  excludeAmbiguous: boolean
  customCharacters: string
  pattern: string
  wordCount: number
  separator: string
  minLength: number
  maxLength: number
}

export interface PasswordTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<PasswordSettings>
  type: PasswordType
  securityLevel: SecurityLevel
}

export interface PasswordBatch {
  id: string
  passwords: PasswordItem[]
  count: number
  type: PasswordType
  settings: PasswordSettings
  createdAt: Date
  statistics: PasswordStatistics
}

export interface PasswordStatistics {
  totalGenerated: number
  averageStrength: number
  averageEntropy: number
  strengthDistribution: Record<string, number>
  typeDistribution: Record<string, number>
  characterDistribution: Record<string, number>
  patternAnalysis: PatternAnalysis
}

export interface PatternAnalysis {
  commonPatterns: string[]
  uniqueCharacters: number
  repetitionScore: number
  sequenceScore: number
  dictionaryScore: number
}

export interface PasswordHistory {
  id: string
  password: string
  type: PasswordType
  strength: PasswordStrength
  createdAt: Date
  used: boolean
}

export type PasswordType = 'random' | 'memorable' | 'pin' | 'passphrase' | 'custom' | 'pronounceable'
export type SecurityLevel = 'low' | 'medium' | 'high' | 'very-high' | 'maximum'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
