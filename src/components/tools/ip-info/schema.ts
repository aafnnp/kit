import { z } from "zod"

// ==================== IP Info Schemas ====================

/**
 * ASN Info schema
 */
export const asnInfoSchema = z.object({
  asn: z.number(),
  name: z.string(),
  description: z.string(),
  country: z.string(),
  registry: z.string(),
  cidr: z.string(),
  routes: z.array(z.string()),
  peers: z.number(),
})

/**
 * Contact Info schema
 */
export const contactInfoSchema = z.object({
  type: z.enum(["registrant", "admin", "tech", "billing"]),
  name: z.string().optional(),
  organization: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
})

/**
 * Whois Info schema
 */
export const whoisInfoSchema = z.object({
  registrar: z.string().optional(),
  registrationDate: z.string().optional(),
  expirationDate: z.string().optional(),
  lastUpdated: z.string().optional(),
  nameServers: z.array(z.string()),
  contacts: z.array(contactInfoSchema),
  status: z.array(z.string()),
  dnssec: z.boolean(),
})

/**
 * IP Info schema
 */
export const ipInfoSchema = z.object({
  ip: z.string(),
  version: z.union([z.literal(4), z.literal(6)]),
  type: z.enum(["public", "private", "reserved", "loopback", "multicast"]),
  isValid: z.boolean(),
  hostname: z.string().optional(),
  reverseDNS: z.string().optional(),
  asn: asnInfoSchema.optional(),
  whois: whoisInfoSchema.optional(),
})

/**
 * Geolocation Info schema
 */
export const geolocationInfoSchema = z.object({
  country: z.string(),
  countryCode: z.string(),
  region: z.string(),
  regionCode: z.string(),
  city: z.string(),
  zipCode: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  utcOffset: z.string(),
  accuracy: z.number(),
  isp: z.string(),
  organization: z.string(),
  connectionType: z.string(),
  usageType: z.string(),
})

/**
 * Security Info schema
 */
export const securityInfoSchema = z.object({
  isThreat: z.boolean(),
  threatLevel: z.enum(["low", "medium", "high"]),
  threatTypes: z.array(z.string()),
  isProxy: z.boolean(),
  isVPN: z.boolean(),
  isTor: z.boolean(),
  isBot: z.boolean(),
  isMalicious: z.boolean(),
  reputation: z.number(),
  blacklists: z.array(z.string()),
  securityScore: z.number(),
  riskFactors: z.array(z.string()),
  recommendations: z.array(z.string()),
})

/**
 * Network Info schema
 */
export const networkInfoSchema = z.object({
  asn: z.number(),
  asnOrg: z.string(),
  isp: z.string(),
  carrier: z.string().optional(),
  connectionType: z.string(),
  speed: z.string(),
  domain: z.string().optional(),
  routes: z.array(z.string()),
  peers: z.number(),
  prefixes: z.array(z.string()),
  registeredCountry: z.string(),
  allocatedDate: z.string(),
})

/**
 * Network Analysis Stats schema
 */
export const networkAnalysisStatsSchema = z.object({
  hopCount: z.number(),
  latency: z.number(),
  packetLoss: z.number(),
  bandwidth: z.string(),
  mtu: z.number(),
  routingPath: z.array(z.string()),
})

/**
 * IP Statistics schema
 */
export const ipStatisticsSchema = z.object({
  ipLength: z.number(),
  processingTime: z.number(),
  responseTime: z.number(),
  lookupCount: z.number(),
  validationScore: z.number(),
  geolocationAccuracy: z.number(),
  securityChecks: z.number(),
  networkAnalysis: networkAnalysisStatsSchema,
})

/**
 * Compliance Info schema
 */
export const complianceInfoSchema = z.object({
  gdprCompliant: z.boolean(),
  ccpaCompliant: z.boolean(),
  coppaCompliant: z.boolean(),
  hipaaCompliant: z.boolean(),
  issues: z.array(z.string()),
  recommendations: z.array(z.string()),
})

/**
 * IP Analysis schema
 */
export const ipAnalysisSchema = z.object({
  isValidIP: z.boolean(),
  ipVersion: z.union([z.literal(4), z.literal(6)]),
  isPublic: z.boolean(),
  isPrivate: z.boolean(),
  isReserved: z.boolean(),
  hasGeolocation: z.boolean(),
  hasSecurityInfo: z.boolean(),
  hasNetworkInfo: z.boolean(),
  qualityScore: z.number(),
  reliabilityScore: z.number(),
  privacyScore: z.number(),
  securityIssues: z.array(z.string()),
  performanceIssues: z.array(z.string()),
  suggestedActions: z.array(z.string()),
  complianceStatus: complianceInfoSchema,
})

/**
 * IP Lookup Result schema
 */
export const ipLookupResultSchema = z.object({
  id: z.string(),
  ip: z.string(),
  isValid: z.boolean(),
  error: z.string().optional(),
  ipInfo: ipInfoSchema.optional(),
  geolocation: geolocationInfoSchema.optional(),
  security: securityInfoSchema.optional(),
  network: networkInfoSchema.optional(),
  statistics: ipStatisticsSchema,
  analysis: ipAnalysisSchema.optional(),
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
  averageSecurity: z.number(),
  successRate: z.number(),
  geolocationDistribution: z.record(z.string(), z.number()),
  securityDistribution: z.record(z.string(), z.number()),
  networkDistribution: z.record(z.string(), z.number()),
})

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "xml", "txt"])

/**
 * Processing Settings schema
 */
export const processingSettingsSchema = z.object({
  includeGeolocation: z.boolean(),
  includeSecurityAnalysis: z.boolean(),
  includeNetworkAnalysis: z.boolean(),
  includeWhoisData: z.boolean(),
  timeout: z.number(),
  retryAttempts: z.number(),
  useCache: z.boolean(),
  exportFormat: exportFormatSchema,
  realTimeLookup: z.boolean(),
  maxResults: z.number(),
  privacyMode: z.boolean(),
})

/**
 * Processing Batch schema
 */
export const processingBatchSchema = z.object({
  id: z.string(),
  results: z.array(ipLookupResultSchema),
  count: z.number(),
  settings: processingSettingsSchema,
  createdAt: z.date(),
  statistics: batchStatisticsSchema,
})

/**
 * IP Error schema
 */
export const ipErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["format", "range", "reserved", "security"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * IP Validation schema
 */
export const ipValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(ipErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  ipVersion: z.union([z.literal(4), z.literal(6)]).optional(),
  ipType: z.string().optional(),
})

/**
 * IP Template schema
 */
export const ipTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  ips: z.array(z.string()),
  analysisTypes: z.array(z.string()),
  useCase: z.array(z.string()),
  examples: z.array(z.string()),
})

// ==================== Type Exports ====================

/**
 * Type inference from zod schemas
 */
export type ASNInfo = z.infer<typeof asnInfoSchema>
export type ContactInfo = z.infer<typeof contactInfoSchema>
export type WhoisInfo = z.infer<typeof whoisInfoSchema>
export type IPInfo = z.infer<typeof ipInfoSchema>
export type GeolocationInfo = z.infer<typeof geolocationInfoSchema>
export type SecurityInfo = z.infer<typeof securityInfoSchema>
export type NetworkInfo = z.infer<typeof networkInfoSchema>
export type NetworkAnalysisStats = z.infer<typeof networkAnalysisStatsSchema>
export type IPStatistics = z.infer<typeof ipStatisticsSchema>
export type ComplianceInfo = z.infer<typeof complianceInfoSchema>
export type IPAnalysis = z.infer<typeof ipAnalysisSchema>
export type IPLookupResult = z.infer<typeof ipLookupResultSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ProcessingSettings = z.infer<typeof processingSettingsSchema>
export type ProcessingBatch = z.infer<typeof processingBatchSchema>
export type IPError = z.infer<typeof ipErrorSchema>
export type IPValidation = z.infer<typeof ipValidationSchema>
export type IPTemplate = z.infer<typeof ipTemplateSchema>

