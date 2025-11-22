import { z } from "zod"

// ==================== User Agent Schemas ====================

/**
 * Device Type schema
 */
export const deviceTypeSchema = z.enum([
  "desktop",
  "mobile",
  "tablet",
  "tv",
  "console",
  "bot",
  "unknown",
])

/**
 * Privacy Level schema
 */
export const privacyLevelSchema = z.enum(["high", "medium", "low", "minimal"])

/**
 * Security Risk schema
 */
export const securityRiskSchema = z.enum(["high", "medium", "low", "minimal"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml"])

/**
 * Hardware Info schema
 */
export const hardwareInfoSchema = z.object({
  cpuCores: z.number().optional(),
  memory: z.number().optional(),
  platform: z.string(),
  vendor: z.string().optional(),
  model: z.string().optional(),
})

/**
 * Browser Capability schema
 */
export const browserCapabilitySchema = z.object({
  name: z.string(),
  supported: z.boolean(),
  version: z.string().optional(),
  description: z.string(),
})

/**
 * Operating System schema
 */
export const operatingSystemSchema = z.object({
  name: z.string(),
  version: z.string(),
  family: z.string(),
  architecture: z.string().optional(),
})

/**
 * User Agent Metrics schema
 */
export const userAgentMetricsSchema = z.object({
  length: z.number(),
  tokenCount: z.number(),
  hasValidStructure: z.boolean(),
  detectedComponents: z.array(z.string()),
  securityFeatures: z.array(z.string()),
  privacyFeatures: z.array(z.string()),
})

/**
 * Device Metrics schema
 */
export const deviceMetricsSchema = z.object({
  deviceType: deviceTypeSchema,
  operatingSystem: operatingSystemSchema,
  architecture: z.string(),
  screenResolution: z.string().optional(),
  touchSupport: z.boolean(),
  mobileFeatures: z.array(z.string()),
  hardwareInfo: hardwareInfoSchema,
})

/**
 * Browser Metrics schema
 */
export const browserMetricsSchema = z.object({
  browserName: z.string(),
  browserVersion: z.string(),
  engineName: z.string(),
  engineVersion: z.string(),
  features: z.array(z.string()),
  capabilities: z.array(browserCapabilitySchema),
  securityFeatures: z.array(z.string()),
  modernFeatures: z.array(z.string()),
})

/**
 * User Agent Statistics schema
 */
export const userAgentStatisticsSchema = z.object({
  inputSize: z.number(),
  processingTime: z.number(),
  userAgentMetrics: userAgentMetricsSchema,
  deviceMetrics: deviceMetricsSchema,
  browserMetrics: browserMetricsSchema,
})

/**
 * User Agent Analysis schema
 */
export const userAgentAnalysisSchema = z.object({
  isValidUserAgent: z.boolean(),
  hasModernStructure: z.boolean(),
  isBot: z.boolean(),
  isMobile: z.boolean(),
  isTablet: z.boolean(),
  isDesktop: z.boolean(),
  privacyLevel: privacyLevelSchema,
  securityRisk: securityRiskSchema,
  suggestedImprovements: z.array(z.string()),
  userAgentIssues: z.array(z.string()),
  qualityScore: z.number(),
  compatibilityIssues: z.array(z.string()),
  modernityScore: z.number(),
})

/**
 * User Agent Processing Result schema
 */
export const userAgentProcessingResultSchema = z.object({
  id: z.string(),
  input: z.string(),
  isValid: z.boolean(),
  error: z.string().optional(),
  statistics: userAgentStatisticsSchema,
  analysis: userAgentAnalysisSchema.optional(),
  createdAt: z.date(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalProcessed: z.number(),
  validCount: z.number(),
  invalidCount: z.number(),
  averageQuality: z.number(),
  totalInputSize: z.number(),
  successRate: z.number(),
  deviceTypeDistribution: z.record(z.string(), z.number()),
  browserDistribution: z.record(z.string(), z.number()),
  osDistribution: z.record(z.string(), z.number()),
})

/**
 * Processing Settings schema
 */
export const processingSettingsSchema = z.object({
  includeDeviceInfo: z.boolean(),
  includeBrowserInfo: z.boolean(),
  includeSecurityAnalysis: z.boolean(),
  includePrivacyAnalysis: z.boolean(),
  detectBots: z.boolean(),
  analyzeCapabilities: z.boolean(),
  exportFormat: exportFormatSchema,
  realTimeProcessing: z.boolean(),
  showDetailedAnalysis: z.boolean(),
})

/**
 * Processing Batch schema
 */
export const processingBatchSchema = z.object({
  id: z.string(),
  results: z.array(userAgentProcessingResultSchema),
  count: z.number(),
  settings: processingSettingsSchema,
  createdAt: z.date(),
  statistics: batchStatisticsSchema,
})

/**
 * User Agent Error schema
 */
export const userAgentErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["format", "structure", "security", "compatibility"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * User Agent Validation schema
 */
export const userAgentValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(userAgentErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

/**
 * User Agent Template schema
 */
export const userAgentTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  userAgent: z.string(),
  deviceType: deviceTypeSchema,
  browserName: z.string(),
  osName: z.string(),
  features: z.array(z.string()),
  useCase: z.array(z.string()),
})

// ==================== Type Exports ====================

/**
 * Type inference from zod schemas
 */
export type DeviceType = z.infer<typeof deviceTypeSchema>
export type PrivacyLevel = z.infer<typeof privacyLevelSchema>
export type SecurityRisk = z.infer<typeof securityRiskSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type HardwareInfo = z.infer<typeof hardwareInfoSchema>
export type BrowserCapability = z.infer<typeof browserCapabilitySchema>
export type OperatingSystem = z.infer<typeof operatingSystemSchema>
export type UserAgentMetrics = z.infer<typeof userAgentMetricsSchema>
export type DeviceMetrics = z.infer<typeof deviceMetricsSchema>
export type BrowserMetrics = z.infer<typeof browserMetricsSchema>
export type UserAgentStatistics = z.infer<typeof userAgentStatisticsSchema>
export type UserAgentAnalysis = z.infer<typeof userAgentAnalysisSchema>
export type UserAgentProcessingResult = z.infer<
  typeof userAgentProcessingResultSchema
>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type ProcessingSettings = z.infer<typeof processingSettingsSchema>
export type ProcessingBatch = z.infer<typeof processingBatchSchema>
export type UserAgentError = z.infer<typeof userAgentErrorSchema>
export type UserAgentValidation = z.infer<typeof userAgentValidationSchema>
export type UserAgentTemplate = z.infer<typeof userAgentTemplateSchema>

