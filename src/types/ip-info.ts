// IP Info 相关类型声明
export interface IPLookupResult {
  id: string
  ip: string
  isValid: boolean
  error?: string
  ipInfo?: IPInfo
  geolocation?: GeolocationInfo
  security?: SecurityInfo
  network?: NetworkInfo
  statistics: IPStatistics
  analysis?: IPAnalysis
  createdAt: Date
}

export interface IPInfo {
  ip: string
  version: 4 | 6
  type: 'public' | 'private' | 'reserved' | 'loopback' | 'multicast'
  isValid: boolean
  hostname?: string
  reverseDNS?: string
  asn?: ASNInfo
  whois?: WhoisInfo
}

export interface GeolocationInfo {
  country: string
  countryCode: string
  region: string
  regionCode: string
  city: string
  zipCode?: string
  latitude: number
  longitude: number
  timezone: string
  utcOffset: string
  accuracy: number
  isp: string
  organization: string
  connectionType: string
  usageType: string
}

export interface SecurityInfo {
  isThreat: boolean
  threatLevel: 'low' | 'medium' | 'high'
  threatTypes: string[]
  isProxy: boolean
  isVPN: boolean
  isTor: boolean
  isBot: boolean
  isMalicious: boolean
  reputation: number
  blacklists: string[]
  securityScore: number
  riskFactors: string[]
  recommendations: string[]
}

export interface NetworkInfo {
  asn: number
  asnOrg: string
  isp: string
  carrier?: string
  connectionType: string
  speed: string
  domain?: string
  routes: string[]
  peers: number
  prefixes: string[]
  registeredCountry: string
  allocatedDate: string
}

export interface ASNInfo {
  asn: number
  name: string
  description: string
  country: string
  registry: string
  cidr: string
  routes: string[]
  peers: number
}

export interface WhoisInfo {
  registrar?: string
  registrationDate?: string
  expirationDate?: string
  lastUpdated?: string
  nameServers: string[]
  contacts: ContactInfo[]
  status: string[]
  dnssec: boolean
}

export interface ContactInfo {
  type: 'registrant' | 'admin' | 'tech' | 'billing'
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

export interface IPStatistics {
  ipLength: number
  processingTime: number
  responseTime: number
  lookupCount: number
  validationScore: number
  geolocationAccuracy: number
  securityChecks: number
  networkAnalysis: NetworkAnalysisStats
}

export interface NetworkAnalysisStats {
  hopCount: number
  latency: number
  packetLoss: number
  bandwidth: string
  mtu: number
  routingPath: string[]
}

export interface IPAnalysis {
  isValidIP: boolean
  ipVersion: 4 | 6
  isPublic: boolean
  isPrivate: boolean
  isReserved: boolean
  hasGeolocation: boolean
  hasSecurityInfo: boolean
  hasNetworkInfo: boolean
  qualityScore: number
  reliabilityScore: number
  privacyScore: number
  securityIssues: string[]
  performanceIssues: string[]
  suggestedActions: string[]
  complianceStatus: ComplianceInfo
}

export interface ComplianceInfo {
  gdprCompliant: boolean
  ccpaCompliant: boolean
  coppaCompliant: boolean
  hipaaCompliant: boolean
  issues: string[]
  recommendations: string[]
}

export interface ProcessingBatch {
  id: string
  results: IPLookupResult[]
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
  averageSecurity: number
  successRate: number
  geolocationDistribution: Record<string, number>
  securityDistribution: Record<string, number>
  networkDistribution: Record<string, number>
}

export interface ProcessingSettings {
  includeGeolocation: boolean
  includeSecurityAnalysis: boolean
  includeNetworkAnalysis: boolean
  includeWhoisData: boolean
  timeout: number
  retryAttempts: number
  useCache: boolean
  exportFormat: ExportFormat
  realTimeLookup: boolean
  maxResults: number
  privacyMode: boolean
}

export interface IPTemplate {
  id: string
  name: string
  description: string
  category: string
  ips: string[]
  analysisTypes: string[]
  useCase: string[]
  examples: string[]
}

export interface IPValidation {
  isValid: boolean
  errors: IPError[]
  warnings: string[]
  suggestions: string[]
  ipVersion?: 4 | 6
  ipType?: string
}

export interface IPError {
  message: string
  type: 'format' | 'range' | 'reserved' | 'security'
  severity: 'error' | 'warning' | 'info'
}

// Enums
export type ExportFormat = 'json' | 'csv' | 'xml' | 'txt'
