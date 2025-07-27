// 所有类型声明均从 user-agent.tsx 迁移
export interface UserAgentProcessingResult {
  id: string
  input: string
  isValid: boolean
  error?: string
  statistics: UserAgentStatistics
  analysis?: UserAgentAnalysis
  createdAt: Date
}

export interface UserAgentStatistics {
  inputSize: number
  processingTime: number
  userAgentMetrics: UserAgentMetrics
  deviceMetrics: DeviceMetrics
  browserMetrics: BrowserMetrics
}

export interface UserAgentMetrics {
  length: number
  tokenCount: number
  hasValidStructure: boolean
  detectedComponents: string[]
  securityFeatures: string[]
  privacyFeatures: string[]
}

export interface DeviceMetrics {
  deviceType: DeviceType
  operatingSystem: OperatingSystem
  architecture: string
  screenResolution?: string
  touchSupport: boolean
  mobileFeatures: string[]
  hardwareInfo: HardwareInfo
}

export interface BrowserMetrics {
  browserName: string
  browserVersion: string
  engineName: string
  engineVersion: string
  features: string[]
  capabilities: BrowserCapability[]
  securityFeatures: string[]
  modernFeatures: string[]
}

export interface HardwareInfo {
  cpuCores?: number
  memory?: number
  platform: string
  vendor?: string
  model?: string
}

export interface BrowserCapability {
  name: string
  supported: boolean
  version?: string
  description: string
}

export interface OperatingSystem {
  name: string
  version: string
  family: string
  architecture?: string
}

export interface UserAgentAnalysis {
  isValidUserAgent: boolean
  hasModernStructure: boolean
  isBot: boolean
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  privacyLevel: PrivacyLevel
  securityRisk: SecurityRisk
  suggestedImprovements: string[]
  userAgentIssues: string[]
  qualityScore: number
  compatibilityIssues: string[]
  modernityScore: number
}

export interface ProcessingBatch {
  id: string
  results: UserAgentProcessingResult[]
  count: number
  settings: ProcessingSettings
  createdAt: Date
  statistics: BatchStatistics
}

export interface BatchStatistics {
  totalProcessed: number
  validCount: number
  invalidCount: number
  averageQuality: number
  totalInputSize: number
  successRate: number
  deviceTypeDistribution: Record<string, number>
  browserDistribution: Record<string, number>
  osDistribution: Record<string, number>
}

export interface ProcessingSettings {
  includeDeviceInfo: boolean
  includeBrowserInfo: boolean
  includeSecurityAnalysis: boolean
  includePrivacyAnalysis: boolean
  detectBots: boolean
  analyzeCapabilities: boolean
  exportFormat: ExportFormat
  realTimeProcessing: boolean
  showDetailedAnalysis: boolean
}

export interface UserAgentTemplate {
  id: string
  name: string
  description: string
  category: string
  userAgent: string
  deviceType: DeviceType
  browserName: string
  osName: string
  features: string[]
  useCase: string[]
}

export interface UserAgentValidation {
  isValid: boolean
  errors: UserAgentError[]
  warnings: string[]
  suggestions: string[]
}

export interface UserAgentError {
  message: string
  type: 'format' | 'structure' | 'security' | 'compatibility'
  severity: 'error' | 'warning' | 'info'
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'tv' | 'console' | 'bot' | 'unknown'
export type PrivacyLevel = 'high' | 'medium' | 'low' | 'minimal'
export type SecurityRisk = 'high' | 'medium' | 'low' | 'minimal'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
