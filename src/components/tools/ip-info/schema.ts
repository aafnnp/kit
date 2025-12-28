// ==================== IP Info Types ====================

/**
 * ASN Info type
 */
export interface asnInfo {
  asn: number,
  name: string,
  description: string,
  country: string,
  registry: string,
  cidr: string,
  routes: string[],
  peers: number,
}

/**
 * Contact Info type
 */
export interface contactInfo {
  type: "registrant"| "admin" | "tech" | "billing"
  name?: string
  organization?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

/**
 * Whois Info type
 */
export interface whoisInfo {
  registrar?: string
  registrationDate?: string
  expirationDate?: string
  lastUpdated?: string
  nameServers: string[],
  contacts: contactInfo[],
  status: string[],
  dnssec: boolean,
}

/**
 * IP Info type
 */
export interface ipInfo {
  ip: string,
  version: "4" | "6",
  type: "public"| "private" | "reserved" | "loopback" | "multicast",
  isValid: boolean
  hostname?: string
  reverseDNS?: string
  asn?: asnInfo
  whois?: whoisInfo
}

/**
 * Geolocation Info type
 */
export interface geolocationInfo {
  country: string,
  countryCode: string,
  region: string,
  regionCode: string,
  city: string
  zipCode?: string
  latitude: number,
  longitude: number,
  timezone: string,
  utcOffset: string,
  accuracy: number,
  isp: string,
  organization: string,
  connectionType: string,
  usageType: string,
}

/**
 * Security Info type
 */
export interface securityInfo {
  isThreat: boolean,
  threatLevel: "low"| "medium" | "high",
  threatTypes: string[],
  isProxy: boolean,
  isVPN: boolean,
  isTor: boolean,
  isBot: boolean,
  isMalicious: boolean,
  reputation: number,
  blacklists: string[],
  securityScore: number,
  riskFactors: string[],
  recommendations: string[],
}

/**
 * Network Info type
 */
export interface networkInfo {
  asn: number,
  asnOrg: string,
  isp: string
  carrier?: string
  connectionType: string,
  speed: string
  domain?: string
  routes: string[],
  peers: number,
  prefixes: string[],
  registeredCountry: string,
  allocatedDate: string,
}

/**
 * Network Analysis Stats type
 */
export interface networkAnalysisStats {
  hopCount: number,
  latency: number,
  packetLoss: number,
  bandwidth: string,
  mtu: number,
  routingPath: string[],
}

/**
 * IP Statistics type
 */
export interface ipStatistics {
  ipLength: number,
  processingTime: number,
  responseTime: number,
  lookupCount: number,
  validationScore: number,
  geolocationAccuracy: number,
  securityChecks: number,
  networkAnalysis: networkAnalysisStats,
}

/**
 * Compliance Info type
 */
export interface complianceInfo {
  gdprCompliant: boolean,
  ccpaCompliant: boolean,
  coppaCompliant: boolean,
  hipaaCompliant: boolean,
  issues: string[],
  recommendations: string[],
}

/**
 * IP Analysis type
 */
export interface ipAnalysis {
  isValidIP: boolean,
  ipVersion: "4" | "6",
  isPublic: boolean,
  isPrivate: boolean,
  isReserved: boolean,
  hasGeolocation: boolean,
  hasSecurityInfo: boolean,
  hasNetworkInfo: boolean,
  qualityScore: number,
  reliabilityScore: number,
  privacyScore: number,
  securityIssues: string[],
  performanceIssues: string[],
  suggestedActions: string[],
  complianceStatus: complianceInfo,
}

/**
 * IP Lookup Result type
 */
export interface ipLookupResult {
  id: string,
  ip: string,
  isValid: boolean
  error?: string
  ipInfo?: ipInfo
  geolocation?: geolocationInfo
  security?: securityInfo
  network?: networkInfo
  statistics: ipStatistics
  analysis?: ipAnalysis
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
  averageSecurity: number,
  successRate: number,
  geolocationDistribution: Record<string, number>,
  securityDistribution: Record<string, number>,
  networkDistribution: Record<string, number>,
}

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "xml" | "txt"

/**
 * Processing Settings type
 */
export interface processingSettings {
  includeGeolocation: boolean,
  includeSecurityAnalysis: boolean,
  includeNetworkAnalysis: boolean,
  includeWhoisData: boolean,
  timeout: number,
  retryAttempts: number,
  useCache: boolean,
  exportFormat: exportFormat,
  realTimeLookup: boolean,
  maxResults: number,
  privacyMode: boolean,
}

/**
 * Processing Batch type
 */
export interface processingBatch {
  id: string,
  results: ipLookupResult[],
  count: number,
  settings: processingSettings,
  createdAt: Date,
  statistics: batchStatistics,
}

/**
 * IP Error type
 */
export interface ipError {
  message: string,
  type: "format"| "range" | "reserved" | "security",
  severity: "error"| "warning" | "info",
}

/**
 * IP Validation type
 */
export interface ipValidation {
  isValid: boolean,
  errors: ipError[],
  warnings: string[],
  suggestions: string[]
  ipVersion?: "4" | "6"
  ipType?: string
}

/**
 * IP Template type
 */
export interface ipTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  ips: string[],
  analysisTypes: string[],
  useCase: string[],
  examples: string[],
}

// ==================== Type Exports ====================

/**
 * Type definitions
 */
export type ASNInfo = asnInfo
export type ContactInfo = contactInfo
export type WhoisInfo = whoisInfo
export type IPInfo = ipInfo
export type GeolocationInfo = geolocationInfo
export type SecurityInfo = securityInfo
export type NetworkInfo = networkInfo
export type NetworkAnalysisStats = networkAnalysisStats
export type IPStatistics = ipStatistics
export type ComplianceInfo = complianceInfo
export type IPAnalysis = ipAnalysis
export type IPLookupResult = ipLookupResult
export type BatchStatistics = batchStatistics
export type ExportFormat = exportFormat
export type ProcessingSettings = processingSettings
export type ProcessingBatch = processingBatch
export type IPError = ipError
export type IPValidation = ipValidation
export type IPTemplate = ipTemplate
export type AsnInfo = asnInfo
export type IpInfo = ipInfo
export type IpStatistics = ipStatistics
export type IpAnalysis = ipAnalysis
export type IpLookupResult = ipLookupResult
export type IpError = ipError
export type IpValidation = ipValidation
export type IpTemplate = ipTemplate
