// ==================== DNS Lookup Types ====================

/**
 * DNS Record Type type
 */
export type dnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "NS" | "TXT" | "SOA" | "PTR" | "SRV" | "CAA" | "DNSKEY" | "DS" | "RRSIG" | "NSEC" | "NSEC3" | "SPF" | "DMARC"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "xml" | "txt"

/**
 * DNS Record type
 */
export interface dnsRecord {
  type: dnsRecordType,
  name: string,
  value: string
  ttl?: number
  priority?: number
  weight?: number
  port?: number
  target?: string
  class?: string
  flags?: string
}

/**
 * TTL Analysis type
 */
export interface ttlAnalysis {
  minTTL: number,
  maxTTL: number,
  averageTTL: number,
  commonTTL: number,
  ttlDistribution: Record<string, number>,
}

/**
 * Security Metrics type
 */
export interface securityMetrics {
  hasDNSSEC: boolean,
  hasCAA: boolean,
  hasSPF: boolean,
  hasDMARC: boolean,
  hasDKIM: boolean,
  securityScore: number,
  vulnerabilities: string[],
  recommendations: string[],
}

/**
 * DNS Statistics type
 */
export interface dnsStatistics {
  domainLength: number,
  recordCount: number,
  processingTime: number,
  responseTime: number,
  recordTypeDistribution: Record<string, number>,
  ttlAnalysis: ttlAnalysis,
  securityMetrics: securityMetrics,
}

/**
 * DNS Analysis type
 */
export interface dnsAnalysis {
  isValidDomain: boolean,
  hasIPv4: boolean,
  hasIPv6: boolean,
  hasMailServers: boolean,
  hasNameServers: boolean,
  hasSecurityRecords: boolean
  domainAge?: number
  registrar?: string
  nameServers: string[],
  mailServers: string[],
  ipAddresses: string[],
  suggestedImprovements: string[],
  dnsIssues: string[],
  qualityScore: number,
  performanceIssues: string[],
  securityIssues: string[],
}

/**
 * DNS Lookup Result type
 */
export interface dnsLookupResult {
  id: string,
  domain: string,
  recordType: dnsRecordType,
  isValid: boolean
  error?: string
  records: dnsRecord[],
  statistics: dnsStatistics
  analysis?: dnsAnalysis
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
  totalRecords: number,
  successRate: number,
  recordTypeDistribution: Record<string, number>,
  securityDistribution: Record<string, number>,
}

/**
 * Processing Settings type
 */
export interface processingSettings {
  recordTypes: dnsRecordType[],
  includeSecurityAnalysis: boolean,
  includePerformanceAnalysis: boolean,
  includeDomainAnalysis: boolean,
  timeout: number,
  retryAttempts: number,
  usePublicDNS: boolean,
  dnsServer: string,
  exportFormat: exportFormat,
  realTimeLookup: boolean,
  maxResults: number,
}

/**
 * Processing Batch type
 */
export interface processingBatch {
  id: string,
  results: dnsLookupResult[],
  count: number,
  settings: processingSettings,
  createdAt: Date,
  statistics: batchStatistics,
}

/**
 * DNS Template type
 */
export interface dnsTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  domains: string[],
  recordTypes: dnsRecordType[],
  useCase: string[],
  examples: string[],
}

/**
 * DNS Error type
 */
export interface dnsError {
  message: string,
  type: "format"| "syntax" | "network" | "security",
  severity: "error"| "warning" | "info",
}

/**
 * DNS Validation type
 */
export interface dnsValidation {
  isValid: boolean,
  errors: dnsError[],
  warnings: string[],
  suggestions: string[],
}

// ==================== Type Exports ====================

export type DNSRecordType = dnsRecordType
export type ExportFormat = exportFormat
export type DNSRecord = dnsRecord
export type TTLAnalysis = ttlAnalysis
export type SecurityMetrics = securityMetrics
export type DNSStatistics = dnsStatistics
export type DNSAnalysis = dnsAnalysis
export type DNSLookupResult = dnsLookupResult
export type BatchStatistics = batchStatistics
export type ProcessingSettings = processingSettings
export type ProcessingBatch = processingBatch
export type DNSTemplate = dnsTemplate
export type DNSError = dnsError
export type DNSValidation = dnsValidation
export type DnsRecordType = dnsRecordType
export type DnsRecord = dnsRecord
export type TtlAnalysis = ttlAnalysis
export type DnsStatistics = dnsStatistics
export type DnsAnalysis = dnsAnalysis
export type DnsLookupResult = dnsLookupResult
export type DnsTemplate = dnsTemplate
export type DnsError = dnsError
export type DnsValidation = dnsValidation
