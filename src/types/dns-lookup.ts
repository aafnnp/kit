// DNS Lookup 相关类型声明
export interface DNSLookupResult {
  id: string
  domain: string
  recordType: DNSRecordType
  isValid: boolean
  error?: string
  records: DNSRecord[]
  statistics: DNSStatistics
  analysis?: DNSAnalysis
  createdAt: Date
}

export interface DNSRecord {
  type: DNSRecordType
  name: string
  value: string
  ttl?: number
  priority?: number
  weight?: number
  port?: number
  target?: string
  class?: string
  flags?: string
}

export interface DNSStatistics {
  domainLength: number
  recordCount: number
  processingTime: number
  responseTime: number
  recordTypeDistribution: Record<string, number>
  ttlAnalysis: TTLAnalysis
  securityMetrics: SecurityMetrics
}

export interface TTLAnalysis {
  minTTL: number
  maxTTL: number
  averageTTL: number
  commonTTL: number
  ttlDistribution: Record<string, number>
}

export interface SecurityMetrics {
  hasDNSSEC: boolean
  hasCAA: boolean
  hasSPF: boolean
  hasDMARC: boolean
  hasDKIM: boolean
  securityScore: number
  vulnerabilities: string[]
  recommendations: string[]
}

export interface DNSAnalysis {
  isValidDomain: boolean
  hasIPv4: boolean
  hasIPv6: boolean
  hasMailServers: boolean
  hasNameServers: boolean
  hasSecurityRecords: boolean
  domainAge?: number
  registrar?: string
  nameServers: string[]
  mailServers: string[]
  ipAddresses: string[]
  suggestedImprovements: string[]
  dnsIssues: string[]
  qualityScore: number
  performanceIssues: string[]
  securityIssues: string[]
}

export interface ProcessingBatch {
  id: string
  results: DNSLookupResult[]
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
  totalRecords: number
  successRate: number
  recordTypeDistribution: Record<string, number>
  securityDistribution: Record<string, number>
}

export interface ProcessingSettings {
  recordTypes: DNSRecordType[]
  includeSecurityAnalysis: boolean
  includePerformanceAnalysis: boolean
  includeDomainAnalysis: boolean
  timeout: number
  retryAttempts: number
  usePublicDNS: boolean
  dnsServer: string
  exportFormat: ExportFormat
  realTimeLookup: boolean
  maxResults: number
}

export interface DNSTemplate {
  id: string
  name: string
  description: string
  category: string
  domains: string[]
  recordTypes: DNSRecordType[]
  useCase: string[]
  examples: string[]
}

export interface DNSValidation {
  isValid: boolean
  errors: DNSError[]
  warnings: string[]
  suggestions: string[]
}

export interface DNSError {
  message: string
  type: 'format' | 'syntax' | 'network' | 'security'
  severity: 'error' | 'warning' | 'info'
}

export type DNSRecordType =
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'MX'
  | 'NS'
  | 'TXT'
  | 'SOA'
  | 'PTR'
  | 'SRV'
  | 'CAA'
  | 'DNSKEY'
  | 'DS'
  | 'RRSIG'
  | 'NSEC'
  | 'NSEC3'
  | 'SPF'
  | 'DMARC'

export type ExportFormat = 'json' | 'csv' | 'xml' | 'txt'
