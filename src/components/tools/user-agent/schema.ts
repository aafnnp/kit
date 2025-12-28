// ==================== User Agent Types ====================

/**
 * Device Type type
 */
export type deviceType = "desktop" | "mobile" | "tablet" | "tv" | "console" | "bot" | "unknown"

/**
 * Privacy Level type
 */
export type privacyLevel = "high" | "medium" | "low" | "minimal"

/**
 * Security Risk type
 */
export type securityRisk = "high" | "medium" | "low" | "minimal"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml"

/**
 * Hardware Info type
 */
export interface hardwareInfo {
  cpuCores?: number
  memory?: number
  platform: string
  vendor?: string
  model?: string
}

/**
 * Browser Capability type
 */
export interface browserCapability {
  name: string,
  supported: boolean
  version?: string
  description: string,
}

/**
 * Operating System type
 */
export interface operatingSystem {
  name: string,
  version: string,
  family: string
  architecture?: string
}

/**
 * User Agent Metrics type
 */
export interface userAgentMetrics {
  length: number,
  tokenCount: number,
  hasValidStructure: boolean,
  detectedComponents: string[],
  securityFeatures: string[],
  privacyFeatures: string[],
}

/**
 * Device Metrics type
 */
export interface deviceMetrics {
  deviceType: deviceType,
  operatingSystem: operatingSystem,
  architecture: string
  screenResolution?: string
  touchSupport: boolean,
  mobileFeatures: string[],
  hardwareInfo: hardwareInfo,
}

/**
 * Browser Metrics type
 */
export interface browserMetrics {
  browserName: string,
  browserVersion: string,
  engineName: string,
  engineVersion: string,
  features: string[],
  capabilities: browserCapability[],
  securityFeatures: string[],
  modernFeatures: string[],
}

/**
 * User Agent Statistics type
 */
export interface userAgentStatistics {
  inputSize: number,
  processingTime: number,
  userAgentMetrics: userAgentMetrics,
  deviceMetrics: deviceMetrics,
  browserMetrics: browserMetrics,
}

/**
 * User Agent Analysis type
 */
export interface userAgentAnalysis {
  isValidUserAgent: boolean,
  hasModernStructure: boolean,
  isBot: boolean,
  isMobile: boolean,
  isTablet: boolean,
  isDesktop: boolean,
  privacyLevel: privacyLevel,
  securityRisk: securityRisk,
  suggestedImprovements: string[],
  userAgentIssues: string[],
  qualityScore: number,
  compatibilityIssues: string[],
  modernityScore: number,
}

/**
 * User Agent Processing Result type
 */
export interface userAgentProcessingResult {
  id: string,
  input: string,
  isValid: boolean
  error?: string
  statistics: userAgentStatistics
  analysis?: userAgentAnalysis
  createdAt: Date,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalProcessed: number,
  validCount: number,
  invalidCount: number,
  averageQuality: number,
  totalInputSize: number,
  successRate: number,
  deviceTypeDistribution: Record<string, number>,
  browserDistribution: Record<string, number>,
  osDistribution: Record<string, number>,
}

/**
 * Processing Settings type
 */
export interface processingSettings {
  includeDeviceInfo: boolean,
  includeBrowserInfo: boolean,
  includeSecurityAnalysis: boolean,
  includePrivacyAnalysis: boolean,
  detectBots: boolean,
  analyzeCapabilities: boolean,
  exportFormat: exportFormat,
  realTimeProcessing: boolean,
  showDetailedAnalysis: boolean,
}

/**
 * Processing Batch type
 */
export interface processingBatch {
  id: string,
  results: userAgentProcessingResult[],
  count: number,
  settings: processingSettings,
  createdAt: Date,
  statistics: batchStatistics,
}

/**
 * User Agent Error type
 */
export interface userAgentError {
  message: string,
  type: "format"| "structure" | "security" | "compatibility",
  severity: "error"| "warning" | "info",
}

/**
 * User Agent Validation type
 */
export interface userAgentValidation {
  isValid: boolean,
  errors: userAgentError[],
  warnings: string[],
  suggestions: string[],
}

/**
 * User Agent Template type
 */
export interface userAgentTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  userAgent: string,
  deviceType: deviceType,
  browserName: string,
  osName: string,
  features: string[],
  useCase: string[],
}

// ==================== Type Exports ====================

/**
 * Type definitions
 */
export type DeviceType = deviceType
export type PrivacyLevel = privacyLevel
export type SecurityRisk = securityRisk
export type ExportFormat = exportFormat
export type HardwareInfo = hardwareInfo
export type BrowserCapability = browserCapability
export type OperatingSystem = operatingSystem
export type UserAgentMetrics = userAgentMetrics
export type DeviceMetrics = deviceMetrics
export type BrowserMetrics = browserMetrics
export type UserAgentStatistics = userAgentStatistics
export type UserAgentAnalysis = userAgentAnalysis
export type UserAgentProcessingResult = userAgentProcessingResult
export type BatchStatistics = batchStatistics
export type ProcessingSettings = processingSettings
export type ProcessingBatch = processingBatch
export type UserAgentError = userAgentError
export type UserAgentValidation = userAgentValidation
export type UserAgentTemplate = userAgentTemplate
