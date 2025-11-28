import { z } from "zod"

// ==================== DNS Lookup Schemas ====================

/**
 * DNS Record Type schema
 */
export const dnsRecordTypeSchema = z.enum([
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "TXT",
  "SOA",
  "PTR",
  "SRV",
  "CAA",
  "DNSKEY",
  "DS",
  "RRSIG",
  "NSEC",
  "NSEC3",
  "SPF",
  "DMARC",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "xml", "txt"])

/**
 * DNS Record schema
 */
export const dnsRecordSchema = z.object({
  type: dnsRecordTypeSchema,
  name: z.string(),
  value: z.string(),
  ttl: z.number().optional(),
  priority: z.number().optional(),
  weight: z.number().optional(),
  port: z.number().optional(),
  target: z.string().optional(),
  class: z.string().optional(),
  flags: z.string().optional(),
})

/**
 * TTL Analysis schema
 */
export const ttlAnalysisSchema = z.object({
  minTTL: z.number(),
  maxTTL: z.number(),
  averageTTL: z.number(),
  commonTTL: z.number(),
  ttlDistribution: z.record(z.string(), z.number()),
})

/**
 * Security Metrics schema
 */
export const securityMetricsSchema = z.object({
  hasDNSSEC: z.boolean(),
  hasCAA: z.boolean(),
  hasSPF: z.boolean(),
  hasDMARC: z.boolean(),
  hasDKIM: z.boolean(),
  securityScore: z.number(),
  vulnerabilities: z.array(z.string()),
  recommendations: z.array(z.string()),
})

/**
 * DNS Statistics schema
 */
export const dnsStatisticsSchema = z.object({
  domainLength: z.number(),
  recordCount: z.number(),
  processingTime: z.number(),
  responseTime: z.number(),
  recordTypeDistribution: z.record(z.string(), z.number()),
  ttlAnalysis: ttlAnalysisSchema,
  securityMetrics: securityMetricsSchema,
})

/**
 * DNS Analysis schema
 */
export const dnsAnalysisSchema = z.object({
  isValidDomain: z.boolean(),
  hasIPv4: z.boolean(),
  hasIPv6: z.boolean(),
  hasMailServers: z.boolean(),
  hasNameServers: z.boolean(),
  hasSecurityRecords: z.boolean(),
  domainAge: z.number().optional(),
  registrar: z.string().optional(),
  nameServers: z.array(z.string()),
  mailServers: z.array(z.string()),
  ipAddresses: z.array(z.string()),
  suggestedImprovements: z.array(z.string()),
  dnsIssues: z.array(z.string()),
  qualityScore: z.number(),
  performanceIssues: z.array(z.string()),
  securityIssues: z.array(z.string()),
})

/**
 * DNS Lookup Result schema
 */
export const dnsLookupResultSchema = z.object({
  id: z.string(),
  domain: z.string(),
  recordType: dnsRecordTypeSchema,
  isValid: z.boolean(),
  error: z.string().optional(),
  records: z.array(dnsRecordSchema),
  statistics: dnsStatisticsSchema,
  analysis: dnsAnalysisSchema.optional(),
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
  totalRecords: z.number(),
  successRate: z.number(),
  recordTypeDistribution: z.record(z.string(), z.number()),
  securityDistribution: z.record(z.string(), z.number()),
})

/**
 * Processing Settings schema
 */
export const processingSettingsSchema = z.object({
  recordTypes: z.array(dnsRecordTypeSchema),
  includeSecurityAnalysis: z.boolean(),
  includePerformanceAnalysis: z.boolean(),
  includeDomainAnalysis: z.boolean(),
  timeout: z.number(),
  retryAttempts: z.number(),
  usePublicDNS: z.boolean(),
  dnsServer: z.string(),
  exportFormat: exportFormatSchema,
  realTimeLookup: z.boolean(),
  maxResults: z.number(),
})

/**
 * Processing Batch schema
 */
export const processingBatchSchema = z.object({
  id: z.string(),
  results: z.array(dnsLookupResultSchema),
  count: z.number(),
  settings: processingSettingsSchema,
  createdAt: z.date(),
  statistics: batchStatisticsSchema,
})

/**
 * DNS Template schema
 */
export const dnsTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  domains: z.array(z.string()),
  recordTypes: z.array(dnsRecordTypeSchema),
  useCase: z.array(z.string()),
  examples: z.array(z.string()),
})

/**
 * DNS Error schema
 */
export const dnsErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["format", "syntax", "network", "security"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * DNS Validation schema
 */
export const dnsValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(dnsErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// ==================== Type Exports ====================

export type DNSRecordType = z.infer<typeof dnsRecordTypeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type DNSRecord = z.infer<typeof dnsRecordSchema>
export type TTLAnalysis = z.infer<typeof ttlAnalysisSchema>
export type SecurityMetrics = z.infer<typeof securityMetricsSchema>
export type DNSStatistics = z.infer<typeof dnsStatisticsSchema>
export type DNSAnalysis = z.infer<typeof dnsAnalysisSchema>
export type DNSLookupResult = z.infer<typeof dnsLookupResultSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type ProcessingSettings = z.infer<typeof processingSettingsSchema>
export type ProcessingBatch = z.infer<typeof processingBatchSchema>
export type DNSTemplate = z.infer<typeof dnsTemplateSchema>
export type DNSError = z.infer<typeof dnsErrorSchema>
export type DNSValidation = z.infer<typeof dnsValidationSchema>
