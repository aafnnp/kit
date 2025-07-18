// 所有类型声明均从 url-parser.tsx 迁移
export interface URLParseResult {
  id: string
  url: string
  isValid: boolean
  error?: string
  components?: URLComponents
  analysis?: URLAnalysis
  security?: URLSecurity
  seo?: URLSEOAnalysis
  statistics: URLStatistics
  createdAt: Date
}

export interface URLComponents {
  protocol: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  origin: string
  host: string
  username?: string
  password?: string
  searchParams: URLSearchParam[]
  pathSegments: string[]
  subdomain?: string
  domain: string
  tld: string
  isSecure: boolean
  defaultPort: boolean
  hasCredentials: boolean
}

export interface URLSearchParam {
  key: string
  value: string
  encoded: boolean
}

export interface URLAnalysis {
  isValidURL: boolean
  urlType: 'absolute' | 'relative' | 'protocol-relative' | 'invalid'
  hasCredentials: boolean
  hasQuery: boolean
  hasFragment: boolean
  hasPort: boolean
  isLocalhost: boolean
  isIP: boolean
  isDomain: boolean
  pathDepth: number
  queryParamCount: number
  urlLength: number
  qualityScore: number
  usabilityScore: number
  securityScore: number
  seoScore: number
  issues: string[]
  recommendations: string[]
  compliance: URLCompliance
}

export interface URLCompliance {
  rfc3986Compliant: boolean
  w3cCompliant: boolean
  seoFriendly: boolean
  accessibilityFriendly: boolean
  issues: string[]
  recommendations: string[]
}

export interface URLSecurity {
  isSecure: boolean
  hasCredentials: boolean
  credentialExposure: boolean
  suspiciousPatterns: string[]
  securityIssues: string[]
  riskLevel: 'low' | 'medium' | 'high'
  securityScore: number
  recommendations: string[]
  phishingIndicators: string[]
  malwareIndicators: string[]
}

export interface URLSEOAnalysis {
  isSearchEngineFriendly: boolean
  hasReadableStructure: boolean
  hasKeywords: boolean
  pathStructureScore: number
  readabilityScore: number
  lengthScore: number
  issues: string[]
  recommendations: string[]
  keywords: string[]
  stopWords: string[]
}

export interface URLStatistics {
  urlLength: number
  pathLength: number
  queryLength: number
  fragmentLength: number
  parameterCount: number
  pathSegmentCount: number
  processingTime: number
  complexityScore: number
  readabilityIndex: number
}

export interface ProcessingBatch {
  id: string
  results: URLParseResult[]
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
  averageSEO: number
  successRate: number
  protocolDistribution: Record<string, number>
  domainDistribution: Record<string, number>
  securityDistribution: Record<string, number>
}

export interface ProcessingSettings {
  includeSecurityAnalysis: boolean
  includeSEOAnalysis: boolean
  includeCompliance: boolean
  validateDomains: boolean
  checkSuspiciousPatterns: boolean
  exportFormat: ExportFormat
  realTimeValidation: boolean
  maxResults: number
  strictMode: boolean
}

export interface URLTemplate {
  id: string
  name: string
  description: string
  category: string
  urls: string[]
  analysisTypes: string[]
  useCase: string[]
  examples: string[]
}

export interface URLValidation {
  isValid: boolean
  errors: URLError[]
  warnings: string[]
  suggestions: string[]
  urlType?: string
}

export interface URLError {
  message: string
  type: 'format' | 'protocol' | 'domain' | 'security' | 'compliance'
  severity: 'error' | 'warning' | 'info'
}

export type ExportFormat = 'json' | 'csv' | 'xml' | 'txt'
