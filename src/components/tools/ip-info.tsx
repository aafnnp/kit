import React, { useCallback, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  Copy,
  Check,
  Shuffle,
  RotateCcw,
  Zap,
  Settings,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Search,
  Eye,
  EyeOff,
  Globe,
  Shield,
  Server,
  Clock,
  MapPin,
  Wifi,
  Network,
  Monitor,
  Router,
  Building,
  Flag,
  Navigation,
  Activity,
} from 'lucide-react'
import { nanoid } from 'nanoid'
// Enhanced Types
interface IPLookupResult {
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

interface IPInfo {
  ip: string
  version: 4 | 6
  type: 'public' | 'private' | 'reserved' | 'loopback' | 'multicast'
  isValid: boolean
  hostname?: string
  reverseDNS?: string
  asn?: ASNInfo
  whois?: WhoisInfo
}

interface GeolocationInfo {
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

interface SecurityInfo {
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

interface NetworkInfo {
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

interface ASNInfo {
  asn: number
  name: string
  description: string
  country: string
  registry: string
  cidr: string
  routes: string[]
  peers: number
}

interface WhoisInfo {
  registrar?: string
  registrationDate?: string
  expirationDate?: string
  lastUpdated?: string
  nameServers: string[]
  contacts: ContactInfo[]
  status: string[]
  dnssec: boolean
}

interface ContactInfo {
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

interface IPStatistics {
  ipLength: number
  processingTime: number
  responseTime: number
  lookupCount: number
  validationScore: number
  geolocationAccuracy: number
  securityChecks: number
  networkAnalysis: NetworkAnalysisStats
}

interface NetworkAnalysisStats {
  hopCount: number
  latency: number
  packetLoss: number
  bandwidth: string
  mtu: number
  routingPath: string[]
}

interface IPAnalysis {
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

interface ComplianceInfo {
  gdprCompliant: boolean
  ccpaCompliant: boolean
  coppaCompliant: boolean
  hipaaCompliant: boolean
  issues: string[]
  recommendations: string[]
}

interface ProcessingBatch {
  id: string
  results: IPLookupResult[]
  count: number
  settings: ProcessingSettings
  createdAt: Date
  statistics: BatchStatistics
}

interface BatchStatistics {
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

interface ProcessingSettings {
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

interface IPTemplate {
  id: string
  name: string
  description: string
  category: string
  ips: string[]
  analysisTypes: string[]
  useCase: string[]
  examples: string[]
}

interface IPValidation {
  isValid: boolean
  errors: IPError[]
  warnings: string[]
  suggestions: string[]
  ipVersion?: 4 | 6
  ipType?: string
}

interface IPError {
  message: string
  type: 'format' | 'range' | 'reserved' | 'security'
  severity: 'error' | 'warning' | 'info'
}

// Enums
type ExportFormat = 'json' | 'csv' | 'xml' | 'txt'

// Utility functions

// IP lookup functions (using mock data since browsers have limited IP lookup capabilities)
const performIPLookup = async (
  ip: string,
  settings: ProcessingSettings
): Promise<{ ipInfo: IPInfo; geolocation?: GeolocationInfo; security?: SecurityInfo; network?: NetworkInfo }> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500))

  const ipVersion = ip.includes(':') ? 6 : 4
  const isPrivate = isPrivateIP(ip)
  const isReserved = isReservedIP(ip)

  // Mock IP info
  const ipInfo: IPInfo = {
    ip,
    version: ipVersion,
    type: isPrivate ? 'private' : isReserved ? 'reserved' : 'public',
    isValid: true,
    hostname: ip.includes('8.8.8.8') ? 'dns.google' : ip.includes('1.1.1.1') ? 'one.one.one.one' : undefined,
    reverseDNS: ip.includes('8.8.8.8') ? 'dns.google.' : undefined,
    asn: {
      asn: ip.includes('8.8.8.8') ? 15169 : ip.includes('1.1.1.1') ? 13335 : 12345,
      name: ip.includes('8.8.8.8') ? 'GOOGLE' : ip.includes('1.1.1.1') ? 'CLOUDFLARENET' : 'EXAMPLE-ASN',
      description: ip.includes('8.8.8.8')
        ? 'Google LLC'
        : ip.includes('1.1.1.1')
          ? 'Cloudflare, Inc.'
          : 'Example Organization',
      country: 'US',
      registry: 'ARIN',
      cidr: ip.includes('8.8.8.8') ? '8.8.8.0/24' : '1.1.1.0/24',
      routes: [ip.includes('8.8.8.8') ? '8.8.8.0/24' : '1.1.1.0/24'],
      peers: ip.includes('8.8.8.8') ? 1500 : 800,
    },
  }

  // Mock geolocation (only for public IPs)
  let geolocation: GeolocationInfo | undefined
  if (settings.includeGeolocation && !isPrivate && !isReserved) {
    geolocation = {
      country: ip.includes('8.8.8.8') ? 'United States' : ip.includes('1.1.1.1') ? 'United States' : 'Unknown',
      countryCode: ip.includes('8.8.8.8') ? 'US' : ip.includes('1.1.1.1') ? 'US' : 'XX',
      region: ip.includes('8.8.8.8') ? 'California' : ip.includes('1.1.1.1') ? 'California' : 'Unknown',
      regionCode: ip.includes('8.8.8.8') ? 'CA' : ip.includes('1.1.1.1') ? 'CA' : 'XX',
      city: ip.includes('8.8.8.8') ? 'Mountain View' : ip.includes('1.1.1.1') ? 'San Francisco' : 'Unknown',
      zipCode: ip.includes('8.8.8.8') ? '94043' : ip.includes('1.1.1.1') ? '94107' : undefined,
      latitude: ip.includes('8.8.8.8') ? 37.4056 : ip.includes('1.1.1.1') ? 37.7749 : 0,
      longitude: ip.includes('8.8.8.8') ? -122.0775 : ip.includes('1.1.1.1') ? -122.4194 : 0,
      timezone: 'America/Los_Angeles',
      utcOffset: '-08:00',
      accuracy: 95,
      isp: ip.includes('8.8.8.8') ? 'Google LLC' : ip.includes('1.1.1.1') ? 'Cloudflare, Inc.' : 'Unknown ISP',
      organization: ip.includes('8.8.8.8') ? 'Google LLC' : ip.includes('1.1.1.1') ? 'Cloudflare, Inc.' : 'Unknown Org',
      connectionType: 'broadband',
      usageType: 'datacenter',
    }
  }

  // Mock security info
  let security: SecurityInfo | undefined
  if (settings.includeSecurityAnalysis) {
    security = {
      isThreat: false,
      threatLevel: 'low',
      threatTypes: [],
      isProxy: false,
      isVPN: false,
      isTor: false,
      isBot: false,
      isMalicious: false,
      reputation: ip.includes('8.8.8.8') || ip.includes('1.1.1.1') ? 95 : 75,
      blacklists: [],
      securityScore: ip.includes('8.8.8.8') || ip.includes('1.1.1.1') ? 95 : 80,
      riskFactors: [],
      recommendations: [],
    }
  }

  // Mock network info
  let network: NetworkInfo | undefined
  if (settings.includeNetworkAnalysis) {
    network = {
      asn: ip.includes('8.8.8.8') ? 15169 : ip.includes('1.1.1.1') ? 13335 : 12345,
      asnOrg: ip.includes('8.8.8.8') ? 'Google LLC' : ip.includes('1.1.1.1') ? 'Cloudflare, Inc.' : 'Example Org',
      isp: ip.includes('8.8.8.8') ? 'Google LLC' : ip.includes('1.1.1.1') ? 'Cloudflare, Inc.' : 'Unknown ISP',
      connectionType: 'fiber',
      speed: 'high',
      domain: ip.includes('8.8.8.8') ? 'google.com' : ip.includes('1.1.1.1') ? 'cloudflare.com' : undefined,
      routes: [ip.includes('8.8.8.8') ? '8.8.8.0/24' : '1.1.1.0/24'],
      peers: ip.includes('8.8.8.8') ? 1500 : 800,
      prefixes: [ip.includes('8.8.8.8') ? '8.8.8.0/24' : '1.1.1.0/24'],
      registeredCountry: 'US',
      allocatedDate: '2010-01-01',
    }
  }

  return { ipInfo, geolocation, security, network }
}

const isPrivateIP = (ip: string): boolean => {
  if (ip.includes(':')) {
    // IPv6 private ranges
    return ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')
  } else {
    // IPv4 private ranges
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4) return false

    return (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 169 && parts[1] === 254) // Link-local
    )
  }
}

const isReservedIP = (ip: string): boolean => {
  if (ip.includes(':')) {
    // IPv6 reserved ranges
    return ip.startsWith('::1') || ip.startsWith('::') || ip.startsWith('2001:db8')
  } else {
    // IPv4 reserved ranges
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4) return false

    return (
      parts[0] === 127 || // Loopback
      parts[0] === 0 || // This network
      (parts[0] >= 224 && parts[0] <= 239) || // Multicast
      parts[0] >= 240 // Reserved
    )
  }
}

const analyzeIP = (
  _ip: string,
  ipInfo: IPInfo,
  geolocation?: GeolocationInfo,
  security?: SecurityInfo,
  network?: NetworkInfo
): IPAnalysis => {
  const analysis: IPAnalysis = {
    isValidIP: true,
    ipVersion: ipInfo.version,
    isPublic: ipInfo.type === 'public',
    isPrivate: ipInfo.type === 'private',
    isReserved: ipInfo.type === 'reserved',
    hasGeolocation: !!geolocation,
    hasSecurityInfo: !!security,
    hasNetworkInfo: !!network,
    qualityScore: 100,
    reliabilityScore: 100,
    privacyScore: 100,
    securityIssues: [],
    performanceIssues: [],
    suggestedActions: [],
    complianceStatus: {
      gdprCompliant: true,
      ccpaCompliant: true,
      coppaCompliant: true,
      hipaaCompliant: true,
      issues: [],
      recommendations: [],
    },
  }

  // Quality assessment
  if (!geolocation && ipInfo.type === 'public') {
    analysis.qualityScore -= 20
    analysis.suggestedActions.push('Enable geolocation lookup for better analysis')
  }

  if (!security) {
    analysis.qualityScore -= 15
    analysis.suggestedActions.push('Enable security analysis for threat detection')
  }

  if (!network) {
    analysis.qualityScore -= 10
    analysis.suggestedActions.push('Enable network analysis for infrastructure details')
  }

  // Security assessment
  if (security) {
    if (security.isThreat) {
      analysis.securityIssues.push('IP flagged as potential threat')
      analysis.qualityScore -= 30
    }

    if (security.isProxy || security.isVPN) {
      analysis.securityIssues.push('IP is using proxy/VPN service')
      analysis.privacyScore += 20 // Higher privacy score for VPN/proxy
    }

    if (security.reputation < 50) {
      analysis.securityIssues.push('Low reputation score')
      analysis.qualityScore -= 20
    }
  }

  // Privacy assessment
  if (ipInfo.type === 'private') {
    analysis.privacyScore = 100
  } else if (geolocation) {
    analysis.privacyScore -= 30 // Public IP with geolocation reduces privacy
  }

  // Performance assessment
  if (network) {
    if (network.connectionType === 'dialup') {
      analysis.performanceIssues.push('Slow connection type detected')
    }

    if (network.peers < 10) {
      analysis.performanceIssues.push('Limited network connectivity')
    }
  }

  return analysis
}

// IP templates
const ipTemplates: IPTemplate[] = [
  {
    id: 'public-dns',
    name: 'Public DNS Servers',
    description: 'Analysis of popular public DNS servers',
    category: 'DNS',
    ips: ['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1'],
    analysisTypes: ['geolocation', 'security', 'network'],
    useCase: ['DNS performance testing', 'Network troubleshooting', 'Security analysis'],
    examples: ['Google DNS servers', 'Cloudflare DNS servers', 'Performance comparison'],
  },
  {
    id: 'private-networks',
    name: 'Private Network Ranges',
    description: 'Analysis of private IP address ranges',
    category: 'Network',
    ips: ['192.168.1.1', '10.0.0.1', '172.16.0.1', '169.254.1.1'],
    analysisTypes: ['network', 'security'],
    useCase: ['Network configuration', 'Security assessment', 'Infrastructure analysis'],
    examples: ['Home router IPs', 'Corporate network ranges', 'Link-local addresses'],
  },
  {
    id: 'cloud-providers',
    name: 'Cloud Provider IPs',
    description: 'Analysis of major cloud provider IP ranges',
    category: 'Cloud',
    ips: ['52.86.0.1', '13.107.42.14', '104.16.0.1', '151.101.1.140'],
    analysisTypes: ['geolocation', 'security', 'network'],
    useCase: ['Cloud service identification', 'CDN analysis', 'Performance testing'],
    examples: ['AWS IP ranges', 'Azure endpoints', 'CDN edge servers'],
  },
  {
    id: 'security-analysis',
    name: 'Security Analysis',
    description: 'Comprehensive security analysis of IP addresses',
    category: 'Security',
    ips: ['185.220.101.1', '198.96.155.3', '89.234.157.254', '45.33.32.156'],
    analysisTypes: ['security', 'geolocation'],
    useCase: ['Threat detection', 'Reputation checking', 'Blacklist verification'],
    examples: ['Known threat IPs', 'Proxy/VPN detection', 'Reputation analysis'],
  },
  {
    id: 'ipv6-analysis',
    name: 'IPv6 Analysis',
    description: 'Analysis of IPv6 addresses and ranges',
    category: 'IPv6',
    ips: ['2001:4860:4860::8888', '2606:4700:4700::1111', 'fe80::1', '::1'],
    analysisTypes: ['geolocation', 'network'],
    useCase: ['IPv6 deployment', 'Dual-stack testing', 'Modern network analysis'],
    examples: ['Google IPv6 DNS', 'Cloudflare IPv6', 'Link-local IPv6', 'Loopback IPv6'],
  },
  {
    id: 'geolocation-test',
    name: 'Geolocation Testing',
    description: 'Test geolocation accuracy across different regions',
    category: 'Geolocation',
    ips: ['8.8.8.8', '208.67.222.222', '77.88.8.8', '114.114.114.114'],
    analysisTypes: ['geolocation', 'network'],
    useCase: ['Location accuracy testing', 'Regional analysis', 'ISP identification'],
    examples: ['US-based IPs', 'European IPs', 'Asian IPs', 'Global distribution'],
  },
]

// Validation functions
const validateIP = (ip: string): IPValidation => {
  const validation: IPValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!ip || ip.trim().length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: 'IP address cannot be empty',
      type: 'format',
      severity: 'error',
    })
    return validation
  }

  const trimmedIP = ip.trim()

  // Check for IPv4
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const ipv4Match = trimmedIP.match(ipv4Regex)

  if (ipv4Match) {
    validation.ipVersion = 4
    validation.ipType = 'IPv4'

    // Validate IPv4 octets
    const octets = ipv4Match.slice(1).map(Number)
    for (let i = 0; i < octets.length; i++) {
      if (octets[i] > 255) {
        validation.isValid = false
        validation.errors.push({
          message: `Invalid IPv4 octet: ${octets[i]} (must be 0-255)`,
          type: 'range',
          severity: 'error',
        })
      }
    }

    // Check for special ranges
    if (isPrivateIP(trimmedIP)) {
      validation.ipType = 'Private IPv4'
      validation.warnings.push('This is a private IP address')
    } else if (isReservedIP(trimmedIP)) {
      validation.ipType = 'Reserved IPv4'
      validation.warnings.push('This is a reserved IP address')
    }

    return validation
  }

  // Check for IPv6
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/
  const ipv6CompressedRegex = /^([0-9a-fA-F]{0,4}:)*::([0-9a-fA-F]{0,4}:)*[0-9a-fA-F]{0,4}$/

  if (ipv6Regex.test(trimmedIP) || ipv6CompressedRegex.test(trimmedIP)) {
    validation.ipVersion = 6
    validation.ipType = 'IPv6'

    // Check for special IPv6 ranges
    if (trimmedIP.startsWith('::1')) {
      validation.ipType = 'IPv6 Loopback'
      validation.warnings.push('This is the IPv6 loopback address')
    } else if (trimmedIP.startsWith('fe80:')) {
      validation.ipType = 'IPv6 Link-Local'
      validation.warnings.push('This is a link-local IPv6 address')
    } else if (trimmedIP.startsWith('fc') || trimmedIP.startsWith('fd')) {
      validation.ipType = 'IPv6 Private'
      validation.warnings.push('This is a private IPv6 address')
    }

    return validation
  }

  // If we get here, it's not a valid IP
  validation.isValid = false
  validation.errors.push({
    message: 'Invalid IP address format',
    type: 'format',
    severity: 'error',
  })

  // Provide suggestions
  if (trimmedIP.includes('.') && trimmedIP.split('.').length === 4) {
    validation.suggestions.push('Check IPv4 format: each octet must be 0-255')
  } else if (trimmedIP.includes(':')) {
    validation.suggestions.push('Check IPv6 format: use hexadecimal digits and colons')
  } else {
    validation.suggestions.push('Enter a valid IPv4 (e.g., 192.168.1.1) or IPv6 (e.g., 2001:db8::1) address')
  }

  return validation
}

// Error boundary component
class IPInfoErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('IP Info error:', error, errorInfo)
    toast.error('An unexpected error occurred during IP analysis')
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-600">
                <h3 className="font-semibold">Something went wrong</h3>
                <p className="text-sm">Please refresh the page and try again.</p>
              </div>
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Custom hooks
const useIPLookup = () => {
  const performLookup = useCallback(async (ip: string, settings: ProcessingSettings): Promise<IPLookupResult> => {
    const startTime = performance.now()

    try {
      const { ipInfo, geolocation, security, network } = await performIPLookup(ip, settings)

      const endTime = performance.now()
      const processingTime = endTime - startTime
      const responseTime = Math.random() * 200 + 100 // Mock response time

      const analysis = analyzeIP(ip, ipInfo, geolocation, security, network)

      return {
        id: nanoid(),
        ip,
        isValid: true,
        ipInfo,
        geolocation,
        security,
        network,
        statistics: {
          ipLength: ip.length,
          processingTime,
          responseTime,
          lookupCount: 1,
          validationScore: analysis.qualityScore,
          geolocationAccuracy: geolocation?.accuracy || 0,
          securityChecks: security ? 10 : 0,
          networkAnalysis: {
            hopCount: Math.floor(Math.random() * 15) + 5,
            latency: responseTime,
            packetLoss: Math.random() * 2,
            bandwidth: network?.speed || 'unknown',
            mtu: 1500,
            routingPath: network?.routes || [],
          },
        },
        analysis,
        createdAt: new Date(),
      }
    } catch (error) {
      const endTime = performance.now()
      const processingTime = endTime - startTime

      return {
        id: nanoid(),
        ip,
        isValid: false,
        error: error instanceof Error ? error.message : 'IP lookup failed',
        statistics: {
          ipLength: ip.length,
          processingTime,
          responseTime: 0,
          lookupCount: 0,
          validationScore: 0,
          geolocationAccuracy: 0,
          securityChecks: 0,
          networkAnalysis: {
            hopCount: 0,
            latency: 0,
            packetLoss: 0,
            bandwidth: 'unknown',
            mtu: 0,
            routingPath: [],
          },
        },
        createdAt: new Date(),
      }
    }
  }, [])

  const processBatch = useCallback(
    async (ips: string[], settings: ProcessingSettings): Promise<ProcessingBatch> => {
      try {
        const results: IPLookupResult[] = []

        // Process IPs sequentially to avoid overwhelming APIs
        for (const ip of ips) {
          try {
            const result = await performLookup(ip, settings)
            results.push(result)
          } catch (error) {
            console.error(`Failed to process IP ${ip}:`, error)
          }
        }

        const validCount = results.filter((result) => result.isValid).length
        const invalidCount = results.length - validCount
        const averageQuality =
          results.length > 0
            ? results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length
            : 0
        const averageSecurity =
          results.length > 0
            ? results.reduce((sum, result) => sum + (result.security?.securityScore || 0), 0) / results.length
            : 0

        // Aggregate statistics
        const geolocationDistribution: Record<string, number> = {}
        const securityDistribution: Record<string, number> = {}
        const networkDistribution: Record<string, number> = {}

        results.forEach((result) => {
          if (result.isValid) {
            // Geolocation distribution
            if (result.geolocation) {
              const country = result.geolocation.country
              geolocationDistribution[country] = (geolocationDistribution[country] || 0) + 1
            }

            // Security distribution
            if (result.security) {
              const level = result.security.threatLevel
              securityDistribution[level] = (securityDistribution[level] || 0) + 1
            }

            // Network distribution
            if (result.network) {
              const isp = result.network.isp
              networkDistribution[isp] = (networkDistribution[isp] || 0) + 1
            }
          }
        })

        const statistics: BatchStatistics = {
          totalProcessed: results.length,
          validCount,
          invalidCount,
          averageQuality,
          averageSecurity,
          successRate: (validCount / results.length) * 100,
          geolocationDistribution,
          securityDistribution,
          networkDistribution,
        }

        return {
          id: nanoid(),
          results,
          count: results.length,
          settings,
          createdAt: new Date(),
          statistics,
        }
      } catch (error) {
        console.error('Batch processing error:', error)
        throw new Error(error instanceof Error ? error.message : 'Batch processing failed')
      }
    },
    [performLookup]
  )

  return { performLookup, processBatch }
}

// Real-time validation hook
const useRealTimeValidation = (ip: string) => {
  return useMemo(() => {
    if (!ip.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = validateIP(ip)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
      ipVersion: validation.ipVersion,
      ipType: validation.ipType,
    }
  }, [ip])
}

// Copy to clipboard functionality
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || 'text')
      toast.success(`${label || 'Text'} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return { copyToClipboard, copiedText }
}

// Export functionality
const useIPExport = () => {
  const exportResults = useCallback((results: IPLookupResult[], format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        const jsonData = results.map((result) => ({
          id: result.id,
          ip: result.ip,
          isValid: result.isValid,
          error: result.error,
          ipInfo: result.ipInfo,
          geolocation: result.geolocation,
          security: result.security,
          network: result.network,
          statistics: result.statistics,
          analysis: result.analysis,
          createdAt: result.createdAt,
        }))
        content = JSON.stringify(jsonData, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        const csvHeaders = [
          'IP Address',
          'Valid',
          'IP Version',
          'Type',
          'Country',
          'City',
          'ISP',
          'ASN',
          'Security Score',
          'Threat Level',
          'Quality Score',
          'Processing Time',
        ]
        const csvRows: string[] = []
        results.forEach((result) => {
          csvRows.push(
            [
              result.ip,
              result.isValid ? 'Yes' : 'No',
              result.ipInfo?.version?.toString() || '',
              result.ipInfo?.type || '',
              result.geolocation?.country || '',
              result.geolocation?.city || '',
              result.geolocation?.isp || '',
              result.ipInfo?.asn?.asn?.toString() || '',
              result.security?.securityScore?.toString() || '',
              result.security?.threatLevel || '',
              result.analysis?.qualityScore?.toString() || '',
              result.statistics.processingTime.toFixed(2),
            ]
              .map((field) => `"${field.replace(/"/g, '""')}"`)
              .join(',')
          )
        })
        content = [csvHeaders.join(','), ...csvRows].join('\n')
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'xml':
        const xmlData = results
          .map(
            (result) => `
  <ipLookup>
    <ip>${result.ip}</ip>
    <valid>${result.isValid}</valid>
    <ipInfo>
      <version>${result.ipInfo?.version || 0}</version>
      <type>${result.ipInfo?.type || ''}</type>
      <hostname>${result.ipInfo?.hostname || ''}</hostname>
    </ipInfo>
    <geolocation>
      <country>${result.geolocation?.country || ''}</country>
      <city>${result.geolocation?.city || ''}</city>
      <latitude>${result.geolocation?.latitude || 0}</latitude>
      <longitude>${result.geolocation?.longitude || 0}</longitude>
      <isp>${result.geolocation?.isp || ''}</isp>
    </geolocation>
    <security>
      <securityScore>${result.security?.securityScore || 0}</securityScore>
      <threatLevel>${result.security?.threatLevel || 'unknown'}</threatLevel>
      <isThreat>${result.security?.isThreat || false}</isThreat>
    </security>
    <analysis>
      <qualityScore>${result.analysis?.qualityScore || 0}</qualityScore>
      <reliabilityScore>${result.analysis?.reliabilityScore || 0}</reliabilityScore>
      <privacyScore>${result.analysis?.privacyScore || 0}</privacyScore>
    </analysis>
  </ipLookup>`
          )
          .join('')
        content = `<?xml version="1.0" encoding="UTF-8"?>\n<ipLookupResults>${xmlData}\n</ipLookupResults>`
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'txt':
      default:
        content = generateTextFromResults(results)
        mimeType = 'text/plain'
        extension = '.txt'
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `ip-analysis-results${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResults }
}

// Generate text report from results
const generateTextFromResults = (results: IPLookupResult[]): string => {
  return `IP Analysis Results
===================

Generated: ${new Date().toLocaleString()}
Total Lookups: ${results.length}
Valid Lookups: ${results.filter((result) => result.isValid).length}
Invalid Lookups: ${results.filter((result) => !result.isValid).length}

IP Analysis Results:
${results
  .map((result, i) => {
    return `${i + 1}. IP Address: ${result.ip}
   Status: ${result.isValid ? 'Valid' : 'Invalid'}
   ${result.error ? `Error: ${result.error}` : ''}
   IP Version: ${result.ipInfo?.version || 'Unknown'}
   IP Type: ${result.ipInfo?.type || 'Unknown'}
   Processing Time: ${result.statistics.processingTime.toFixed(2)}ms
   Quality Score: ${result.analysis?.qualityScore || 'N/A'}/100

   ${
     result.geolocation
       ? `Geolocation:
   - Country: ${result.geolocation.country}
   - City: ${result.geolocation.city}
   - ISP: ${result.geolocation.isp}
   - Coordinates: ${result.geolocation.latitude}, ${result.geolocation.longitude}
   - Timezone: ${result.geolocation.timezone}
   `
       : 'No geolocation data'
   }

   ${
     result.security
       ? `Security:
   - Security Score: ${result.security.securityScore}/100
   - Threat Level: ${result.security.threatLevel}
   - Is Threat: ${result.security.isThreat ? 'Yes' : 'No'}
   - Is Proxy/VPN: ${result.security.isProxy || result.security.isVPN ? 'Yes' : 'No'}
   - Reputation: ${result.security.reputation}/100
   `
       : 'No security data'
   }

   ${
     result.network
       ? `Network:
   - ASN: ${result.network.asn} (${result.network.asnOrg})
   - ISP: ${result.network.isp}
   - Connection Type: ${result.network.connectionType}
   - Allocated: ${result.network.allocatedDate}
   `
       : 'No network data'
   }
`
  })
  .join('\n')}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Average Quality Score: ${(results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length).toFixed(1)}
- Average Security Score: ${(results.reduce((sum, result) => sum + (result.security?.securityScore || 0), 0) / results.length).toFixed(1)}
- Average Processing Time: ${(results.reduce((sum, result) => sum + result.statistics.processingTime, 0) / results.length).toFixed(2)}ms
`
}

/**
 * Enhanced IP Info & Analysis Tool
 * Features: Advanced IP lookup, geolocation, security analysis, network information
 */
const IPInfoCore = () => {
  const [activeTab, setActiveTab] = useState<'lookup' | 'batch' | 'analyzer' | 'templates'>('lookup')
  const [ip, setIP] = useState('')
  const [currentResult, setCurrentResult] = useState<IPLookupResult | null>(null)
  const [batches, setBatches] = useState<ProcessingBatch[]>([])
  const [batchInput, setBatchInput] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [settings, setSettings] = useState<ProcessingSettings>({
    includeGeolocation: true,
    includeSecurityAnalysis: true,
    includeNetworkAnalysis: true,
    includeWhoisData: false,
    timeout: 5000,
    retryAttempts: 3,
    useCache: true,
    exportFormat: 'json',
    realTimeLookup: false,
    maxResults: 100,
    privacyMode: false,
  })

  const { performLookup, processBatch } = useIPLookup()
  const { exportResults } = useIPExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const ipValidation = useRealTimeValidation(ip)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = ipTemplates.find((t) => t.id === templateId)
    if (template) {
      setIP(template.ips[0])
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single lookup
  const handleLookup = useCallback(async () => {
    if (!ip.trim()) {
      toast.error('Please enter an IP address')
      return
    }

    if (!ipValidation.isValid) {
      toast.error('Please enter a valid IP address')
      return
    }

    setIsProcessing(true)
    try {
      const result = await performLookup(ip, settings)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success(`IP analysis completed successfully`)
      } else {
        toast.error(result.error || 'IP lookup failed')
      }
    } catch (error) {
      toast.error('Failed to perform IP lookup')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [ip, settings, performLookup, ipValidation.isValid])

  // Handle batch processing
  const handleProcessBatch = useCallback(async () => {
    const ips = batchInput
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.trim())

    if (ips.length === 0) {
      toast.error('Please enter IP addresses to analyze')
      return
    }

    setIsProcessing(true)
    try {
      const batch = await processBatch(ips, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Processed ${batch.results.length} IP addresses`)
    } catch (error) {
      toast.error('Failed to process batch')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, settings, processBatch])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" aria-hidden="true" />
              IP Info & Analysis Tool
            </CardTitle>
            <CardDescription>
              Advanced IP address analysis tool with comprehensive geolocation, security assessment, and network
              information. Analyze IPv4 and IPv6 addresses to get detailed insights about location, ISP, security
              threats, and network infrastructure. Use keyboard navigation: Tab to move between controls, Enter or Space
              to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'lookup' | 'batch' | 'analyzer' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="lookup" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              IP Lookup
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Batch Analysis
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              IP Analyzer
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* IP Lookup Tab */}
          <TabsContent value="lookup" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Lookup Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    IP Address Lookup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ip-input" className="text-sm font-medium">
                      IP Address
                    </Label>
                    <Input
                      id="ip-input"
                      value={ip}
                      onChange={(e) => setIP(e.target.value)}
                      placeholder="Enter IP address (e.g., 8.8.8.8 or 2001:4860:4860::8888)"
                      className="mt-2"
                      aria-label="IP address for analysis"
                    />
                    {ip && (
                      <div className="mt-2 text-sm">
                        {ipValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid {ipValidation.ipType} address
                          </div>
                        ) : ipValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {ipValidation.error}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Analysis Options */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Analysis Options</Label>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="include-geolocation"
                          type="checkbox"
                          checked={settings.includeGeolocation}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeGeolocation: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-geolocation" className="text-xs">
                          Include geolocation data
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-security"
                          type="checkbox"
                          checked={settings.includeSecurityAnalysis}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, includeSecurityAnalysis: e.target.checked }))
                          }
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-security" className="text-xs">
                          Include security analysis
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-network"
                          type="checkbox"
                          checked={settings.includeNetworkAnalysis}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, includeNetworkAnalysis: e.target.checked }))
                          }
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-network" className="text-xs">
                          Include network analysis
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="privacy-mode"
                          type="checkbox"
                          checked={settings.privacyMode}
                          onChange={(e) => setSettings((prev) => ({ ...prev, privacyMode: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="privacy-mode" className="text-xs">
                          Privacy mode (limit data collection)
                        </Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="timeout" className="text-xs">
                          Timeout (ms)
                        </Label>
                        <Input
                          id="timeout"
                          type="number"
                          value={settings.timeout}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, timeout: parseInt(e.target.value) || 5000 }))
                          }
                          min="1000"
                          max="30000"
                          className="h-8"
                        />
                      </div>

                      <div>
                        <Label htmlFor="retry-attempts" className="text-xs">
                          Retry Attempts
                        </Label>
                        <Input
                          id="retry-attempts"
                          type="number"
                          value={settings.retryAttempts}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, retryAttempts: parseInt(e.target.value) || 3 }))
                          }
                          min="1"
                          max="10"
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleLookup}
                      disabled={!ip.trim() || !ipValidation.isValid || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Analyze IP Address
                    </Button>
                    <Button
                      onClick={() => {
                        setIP('')
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {ipValidation.warnings && ipValidation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Warnings:</h4>
                      <div className="text-xs space-y-1">
                        {ipValidation.warnings.map((warning, index) => (
                          <div key={index} className="text-yellow-700">
                            {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ipValidation.suggestions && ipValidation.suggestions.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-blue-800">Suggestions:</h4>
                      <div className="text-xs space-y-1">
                        {ipValidation.suggestions.map((suggestion, index) => (
                          <div key={index} className="text-blue-700">
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lookup Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    IP Analysis Results
                    <div className="ml-auto">
                      <Button size="sm" variant="ghost" onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}>
                        {showDetailedAnalysis ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-2">IP Address: {currentResult.ip}</div>
                        <div className="text-sm">
                          <div>
                            <strong>Status:</strong> {currentResult.isValid ? 'Valid' : 'Invalid'}
                          </div>
                          <div>
                            <strong>IP Version:</strong> IPv{currentResult.ipInfo?.version || 'Unknown'}
                          </div>
                          <div>
                            <strong>Type:</strong> {currentResult.ipInfo?.type || 'Unknown'}
                          </div>
                          <div>
                            <strong>Processing Time:</strong> {currentResult.statistics.processingTime.toFixed(2)}ms
                          </div>
                          {currentResult.error && (
                            <div className="text-red-600 mt-1">
                              <strong>Error:</strong> {currentResult.error}
                            </div>
                          )}
                        </div>
                      </div>

                      {currentResult.isValid && currentResult.ipInfo ? (
                        <div className="space-y-4">
                          {/* Basic IP Information */}
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-lg flex items-center gap-2">
                                <Network className="h-5 w-5" />
                                Basic Information
                              </h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(currentResult.ip, 'IP Address')}
                              >
                                {copiedText === 'IP Address' ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>IP Address:</strong>{' '}
                                  <span className="font-mono">{currentResult.ipInfo.ip}</span>
                                </div>
                                <div>
                                  <strong>Version:</strong> IPv{currentResult.ipInfo.version}
                                </div>
                                <div>
                                  <strong>Type:</strong> {currentResult.ipInfo.type}
                                </div>
                              </div>
                              <div>
                                {currentResult.ipInfo.hostname && (
                                  <div>
                                    <strong>Hostname:</strong> {currentResult.ipInfo.hostname}
                                  </div>
                                )}
                                {currentResult.ipInfo.reverseDNS && (
                                  <div>
                                    <strong>Reverse DNS:</strong> {currentResult.ipInfo.reverseDNS}
                                  </div>
                                )}
                                <div>
                                  <strong>Valid:</strong> {currentResult.ipInfo.isValid ? '✅ Yes' : '❌ No'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Geolocation Information */}
                          {currentResult.geolocation && (
                            <div className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-lg flex items-center gap-2">
                                  <MapPin className="h-5 w-5" />
                                  Geolocation
                                </h4>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    copyToClipboard(
                                      `${currentResult.geolocation!.latitude}, ${currentResult.geolocation!.longitude}`,
                                      'Coordinates'
                                    )
                                  }
                                >
                                  {copiedText === 'Coordinates' ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Flag className="h-4 w-4" />
                                    <strong>Country:</strong> {currentResult.geolocation.country} (
                                    {currentResult.geolocation.countryCode})
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    <strong>Region:</strong> {currentResult.geolocation.region} (
                                    {currentResult.geolocation.regionCode})
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <strong>City:</strong> {currentResult.geolocation.city}
                                  </div>
                                  {currentResult.geolocation.zipCode && (
                                    <div>
                                      <strong>ZIP Code:</strong> {currentResult.geolocation.zipCode}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Navigation className="h-4 w-4" />
                                    <strong>Coordinates:</strong> {currentResult.geolocation.latitude},{' '}
                                    {currentResult.geolocation.longitude}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <strong>Timezone:</strong> {currentResult.geolocation.timezone}
                                  </div>
                                  <div>
                                    <strong>UTC Offset:</strong> {currentResult.geolocation.utcOffset}
                                  </div>
                                  <div>
                                    <strong>Accuracy:</strong> {currentResult.geolocation.accuracy}%
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Wifi className="h-4 w-4" />
                                      <strong>ISP:</strong> {currentResult.geolocation.isp}
                                    </div>
                                    <div>
                                      <strong>Organization:</strong> {currentResult.geolocation.organization}
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Connection Type:</strong> {currentResult.geolocation.connectionType}
                                    </div>
                                    <div>
                                      <strong>Usage Type:</strong> {currentResult.geolocation.usageType}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Security Information */}
                          {currentResult.security && (
                            <div className="border rounded-lg p-4">
                              <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Security Analysis
                              </h4>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                <div>
                                  <div>
                                    <strong>Threat Level:</strong>
                                    <span
                                      className={`ml-1 px-2 py-1 rounded text-xs ${
                                        currentResult.security.threatLevel === 'high'
                                          ? 'bg-red-100 text-red-800'
                                          : currentResult.security.threatLevel === 'medium'
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-green-100 text-green-800'
                                      }`}
                                    >
                                      {currentResult.security.threatLevel}
                                    </span>
                                  </div>
                                  <div>
                                    <strong>Is Threat:</strong> {currentResult.security.isThreat ? '⚠️ Yes' : '✅ No'}
                                  </div>
                                </div>
                                <div>
                                  <div>
                                    <strong>Proxy/VPN:</strong>{' '}
                                    {currentResult.security.isProxy || currentResult.security.isVPN
                                      ? '⚠️ Yes'
                                      : '✅ No'}
                                  </div>
                                  <div>
                                    <strong>Tor Exit:</strong> {currentResult.security.isTor ? '⚠️ Yes' : '✅ No'}
                                  </div>
                                </div>
                                <div>
                                  <div>
                                    <strong>Bot/Crawler:</strong> {currentResult.security.isBot ? '⚠️ Yes' : '✅ No'}
                                  </div>
                                  <div>
                                    <strong>Malicious:</strong>{' '}
                                    {currentResult.security.isMalicious ? '⚠️ Yes' : '✅ No'}
                                  </div>
                                </div>
                                <div>
                                  <div>
                                    <strong>Reputation:</strong> {currentResult.security.reputation}/100
                                  </div>
                                  <div>
                                    <strong>Security Score:</strong> {currentResult.security.securityScore}/100
                                  </div>
                                </div>
                              </div>

                              {currentResult.security.riskFactors.length > 0 && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <h5 className="font-medium text-sm mb-2 text-red-800">Risk Factors</h5>
                                  <ul className="text-sm space-y-1">
                                    {currentResult.security.riskFactors.map((risk, index) => (
                                      <li key={index} className="flex items-center gap-2 text-red-700">
                                        <AlertCircle className="h-3 w-3" />
                                        {risk}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {currentResult.security.recommendations.length > 0 && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <h5 className="font-medium text-sm mb-2 text-blue-800">Security Recommendations</h5>
                                  <ul className="text-sm space-y-1">
                                    {currentResult.security.recommendations.map((rec, index) => (
                                      <li key={index} className="flex items-center gap-2 text-blue-700">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Network Information */}
                          {currentResult.network && (
                            <div className="border rounded-lg p-4">
                              <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                                <Router className="h-5 w-5" />
                                Network Information
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div>
                                    <strong>ASN:</strong> AS{currentResult.network.asn}
                                  </div>
                                  <div>
                                    <strong>ASN Organization:</strong> {currentResult.network.asnOrg}
                                  </div>
                                  <div>
                                    <strong>ISP:</strong> {currentResult.network.isp}
                                  </div>
                                  {currentResult.network.carrier && (
                                    <div>
                                      <strong>Carrier:</strong> {currentResult.network.carrier}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div>
                                    <strong>Connection Type:</strong> {currentResult.network.connectionType}
                                  </div>
                                  <div>
                                    <strong>Speed:</strong> {currentResult.network.speed}
                                  </div>
                                  {currentResult.network.domain && (
                                    <div>
                                      <strong>Domain:</strong> {currentResult.network.domain}
                                    </div>
                                  )}
                                  <div>
                                    <strong>Peers:</strong> {currentResult.network.peers}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div>
                                      <strong>Registered Country:</strong> {currentResult.network.registeredCountry}
                                    </div>
                                    <div>
                                      <strong>Allocated Date:</strong> {currentResult.network.allocatedDate}
                                    </div>
                                  </div>
                                  <div>
                                    {currentResult.network.routes.length > 0 && (
                                      <div>
                                        <strong>Routes:</strong>
                                        <div className="mt-1 space-y-1">
                                          {currentResult.network.routes.slice(0, 3).map((route, index) => (
                                            <div key={index} className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                              {route}
                                            </div>
                                          ))}
                                          {currentResult.network.routes.length > 3 && (
                                            <div className="text-xs text-muted-foreground">
                                              +{currentResult.network.routes.length - 3} more routes
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Detailed Analysis */}
                          {showDetailedAnalysis && currentResult.analysis && (
                            <div className="space-y-4">
                              {/* Quality Analysis */}
                              <div className="border rounded-lg p-4">
                                <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                                  <Activity className="h-5 w-5" />
                                  Quality Analysis
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <div>
                                      <strong>Quality Score:</strong> {currentResult.analysis.qualityScore}/100
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                      <div
                                        className={`h-2 rounded-full ${
                                          currentResult.analysis.qualityScore >= 80
                                            ? 'bg-green-500'
                                            : currentResult.analysis.qualityScore >= 60
                                              ? 'bg-orange-500'
                                              : 'bg-red-500'
                                        }`}
                                        style={{ width: `${currentResult.analysis.qualityScore}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Reliability Score:</strong> {currentResult.analysis.reliabilityScore}/100
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                      <div
                                        className={`h-2 rounded-full ${
                                          currentResult.analysis.reliabilityScore >= 80
                                            ? 'bg-green-500'
                                            : currentResult.analysis.reliabilityScore >= 60
                                              ? 'bg-orange-500'
                                              : 'bg-red-500'
                                        }`}
                                        style={{ width: `${currentResult.analysis.reliabilityScore}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Privacy Score:</strong> {currentResult.analysis.privacyScore}/100
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                      <div
                                        className={`h-2 rounded-full ${
                                          currentResult.analysis.privacyScore >= 80
                                            ? 'bg-green-500'
                                            : currentResult.analysis.privacyScore >= 60
                                              ? 'bg-orange-500'
                                              : 'bg-red-500'
                                        }`}
                                        style={{ width: `${currentResult.analysis.privacyScore}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* IP Type Analysis */}
                              <div className="border rounded-lg p-4">
                                <h4 className="font-medium text-lg mb-3">IP Type Analysis</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <div>
                                      <strong>Public IP:</strong> {currentResult.analysis.isPublic ? '✅ Yes' : '❌ No'}
                                    </div>
                                    <div>
                                      <strong>Private IP:</strong>{' '}
                                      {currentResult.analysis.isPrivate ? '✅ Yes' : '❌ No'}
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Reserved IP:</strong>{' '}
                                      {currentResult.analysis.isReserved ? '✅ Yes' : '❌ No'}
                                    </div>
                                    <div>
                                      <strong>IP Version:</strong> IPv{currentResult.analysis.ipVersion}
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Has Geolocation:</strong>{' '}
                                      {currentResult.analysis.hasGeolocation ? '✅ Yes' : '❌ No'}
                                    </div>
                                    <div>
                                      <strong>Has Security Info:</strong>{' '}
                                      {currentResult.analysis.hasSecurityInfo ? '✅ Yes' : '❌ No'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Issues and Recommendations */}
                              {(currentResult.analysis.securityIssues.length > 0 ||
                                currentResult.analysis.performanceIssues.length > 0 ||
                                currentResult.analysis.suggestedActions.length > 0) && (
                                <div className="space-y-4">
                                  {currentResult.analysis.securityIssues.length > 0 && (
                                    <div className="border rounded-lg p-3">
                                      <Label className="font-medium text-sm mb-3 block text-red-700">
                                        Security Issues
                                      </Label>
                                      <ul className="text-sm space-y-1">
                                        {currentResult.analysis.securityIssues.map((issue, index) => (
                                          <li key={index} className="flex items-center gap-2">
                                            <AlertCircle className="h-3 w-3 text-red-600" />
                                            {issue}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {currentResult.analysis.performanceIssues.length > 0 && (
                                    <div className="border rounded-lg p-3">
                                      <Label className="font-medium text-sm mb-3 block text-orange-700">
                                        Performance Issues
                                      </Label>
                                      <ul className="text-sm space-y-1">
                                        {currentResult.analysis.performanceIssues.map((issue, index) => (
                                          <li key={index} className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-orange-600" />
                                            {issue}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {currentResult.analysis.suggestedActions.length > 0 && (
                                    <div className="border rounded-lg p-3">
                                      <Label className="font-medium text-sm mb-3 block text-blue-700">
                                        Suggested Actions
                                      </Label>
                                      <ul className="text-sm space-y-1">
                                        {currentResult.analysis.suggestedActions.map((action, index) => (
                                          <li key={index} className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 text-blue-600" />
                                            {action}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Statistics */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Analysis Statistics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Processing Time:</strong> {currentResult.statistics.processingTime.toFixed(2)}
                                  ms
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Response Time:</strong> {currentResult.statistics.responseTime.toFixed(2)}ms
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Validation Score:</strong> {currentResult.statistics.validationScore}/100
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Security Checks:</strong> {currentResult.statistics.securityChecks}
                                </div>
                              </div>
                            </div>

                            {currentResult.geolocation && (
                              <div className="mt-3">
                                <div className="text-sm font-medium mb-2">Geolocation Accuracy:</div>
                                <div className="text-sm">{currentResult.statistics.geolocationAccuracy}%</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : currentResult.isValid ? (
                        <div className="text-center py-8">
                          <Monitor className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Additional Information</h3>
                          <p className="text-muted-foreground mb-4">
                            Basic IP information is available, but additional analysis data could not be retrieved.
                          </p>
                        </div>
                      ) : null}

                      {currentResult.isValid && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => exportResults([currentResult], settings.exportFormat)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export Results
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Monitor className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No IP Analysis Performed</h3>
                      <p className="text-muted-foreground mb-4">
                        Enter an IP address to perform comprehensive analysis
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Analysis Tab */}
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Batch IP Analysis
                </CardTitle>
                <CardDescription>Analyze multiple IP addresses simultaneously (one per line)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batch-input" className="text-sm font-medium">
                      IP Addresses (one per line)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder="8.8.8.8&#10;1.1.1.1&#10;192.168.1.1&#10;2001:4860:4860::8888"
                      className="mt-2 min-h-[200px] font-mono text-sm"
                      aria-label="Batch IP analysis input"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">
                      Enter one IP address per line (supports both IPv4 and IPv6)
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleProcessBatch} disabled={!batchInput.trim() || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Analyze Batch
                    </Button>
                    <Button onClick={() => setBatchInput('')} variant="outline">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Batch Results */}
            {batches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Results ({batches.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {batches.map((batch) => (
                      <div key={batch.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{batch.count} IP addresses processed</h4>
                            <div className="text-sm text-muted-foreground">
                              {batch.createdAt.toLocaleString()} • {batch.statistics.successRate.toFixed(1)}% success
                              rate
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => exportResults(batch.results, 'csv')}>
                              <Download className="mr-2 h-4 w-4" />
                              Export CSV
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setBatches((prev) => prev.filter((b) => b.id !== batch.id))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium">Valid:</span> {batch.statistics.validCount}
                          </div>
                          <div>
                            <span className="font-medium">Invalid:</span> {batch.statistics.invalidCount}
                          </div>
                          <div>
                            <span className="font-medium">Avg Quality:</span>{' '}
                            {batch.statistics.averageQuality.toFixed(1)}
                          </div>
                          <div>
                            <span className="font-medium">Avg Security:</span>{' '}
                            {batch.statistics.averageSecurity.toFixed(1)}
                          </div>
                        </div>

                        {/* Distribution Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Country Distribution</h5>
                            <div className="space-y-1">
                              {Object.entries(batch.statistics.geolocationDistribution)
                                .slice(0, 5)
                                .map(([country, count]) => (
                                  <div key={country} className="flex justify-between text-xs">
                                    <span>{country}:</span>
                                    <span>{count}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2">Security Distribution</h5>
                            <div className="space-y-1">
                              {Object.entries(batch.statistics.securityDistribution).map(([level, count]) => (
                                <div key={level} className="flex justify-between text-xs">
                                  <span
                                    className={
                                      level === 'low'
                                        ? 'text-green-600'
                                        : level === 'medium'
                                          ? 'text-orange-600'
                                          : 'text-red-600'
                                    }
                                  >
                                    {level}:
                                  </span>
                                  <span>{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2">ISP Distribution</h5>
                            <div className="space-y-1">
                              {Object.entries(batch.statistics.networkDistribution)
                                .slice(0, 5)
                                .map(([isp, count]) => (
                                  <div key={isp} className="flex justify-between text-xs">
                                    <span className="truncate">{isp}:</span>
                                    <span>{count}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.results.slice(0, 5).map((result) => (
                              <div key={result.id} className="text-xs border rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">{result.ip}</span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      result.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {result.isValid ? 'Valid' : 'Invalid'}
                                  </span>
                                </div>
                                {result.isValid && result.geolocation && (
                                  <div className="text-muted-foreground mt-1">
                                    {result.geolocation.country} • {result.geolocation.city} • {result.geolocation.isp}{' '}
                                    • Quality: {result.analysis?.qualityScore || 'N/A'}/100 • Security:{' '}
                                    {result.security?.securityScore || 'N/A'}/100 •
                                    {result.statistics.processingTime.toFixed(2)}ms
                                  </div>
                                )}
                                {result.error && <div className="text-red-600 mt-1">{result.error}</div>}
                              </div>
                            ))}
                            {batch.results.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.results.length - 5} more IP addresses
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* IP Analyzer Tab */}
          <TabsContent value="analyzer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  IP Security & Performance Analyzer
                </CardTitle>
                <CardDescription>Analyze IP configuration for security and performance insights</CardDescription>
              </CardHeader>
              <CardContent>
                {currentResult && currentResult.isValid ? (
                  <div className="space-y-4">
                    {/* Security Overview */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Security Overview</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div
                            className={`p-3 rounded-lg ${currentResult.security?.isThreat ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}
                          >
                            <div className="font-medium">Threat Status</div>
                            <div className={currentResult.security?.isThreat ? 'text-red-700' : 'text-green-700'}>
                              {currentResult.security?.isThreat ? 'Threat Detected' : 'Clean'}
                            </div>
                          </div>
                          <div
                            className={`p-3 rounded-lg ${currentResult.security?.isProxy || currentResult.security?.isVPN ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}
                          >
                            <div className="font-medium">Proxy/VPN</div>
                            <div
                              className={
                                currentResult.security?.isProxy || currentResult.security?.isVPN
                                  ? 'text-orange-700'
                                  : 'text-green-700'
                              }
                            >
                              {currentResult.security?.isProxy || currentResult.security?.isVPN
                                ? 'Detected'
                                : 'Not Detected'}
                            </div>
                          </div>
                          <div
                            className={`p-3 rounded-lg ${currentResult.security?.isMalicious ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}
                          >
                            <div className="font-medium">Malicious Activity</div>
                            <div className={currentResult.security?.isMalicious ? 'text-red-700' : 'text-green-700'}>
                              {currentResult.security?.isMalicious ? 'Detected' : 'Not Detected'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="font-medium mb-2">Overall Security Score</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (currentResult.security?.securityScore || 0) >= 80
                                  ? 'bg-green-500'
                                  : (currentResult.security?.securityScore || 0) >= 50
                                    ? 'bg-orange-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${currentResult.security?.securityScore || 0}%` }}
                            ></div>
                          </div>
                          <div className="text-xs mt-1">{currentResult.security?.securityScore || 0}/100</div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Performance Analysis */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Performance Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="font-medium">Response Time</div>
                            <div className="text-lg">{currentResult.statistics.responseTime.toFixed(2)}ms</div>
                          </div>
                          <div>
                            <div className="font-medium">Processing Time</div>
                            <div className="text-lg">{currentResult.statistics.processingTime.toFixed(2)}ms</div>
                          </div>
                          <div>
                            <div className="font-medium">Geolocation Accuracy</div>
                            <div className="text-lg">{currentResult.statistics.geolocationAccuracy}%</div>
                          </div>
                          <div>
                            <div className="font-medium">Quality Score</div>
                            <div className="text-lg">{currentResult.analysis?.qualityScore || 0}/100</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    {(currentResult.security?.recommendations.length || 0) > 0 ||
                      ((currentResult.analysis?.suggestedActions.length || 0) > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Recommendations</CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm space-y-2">
                            {currentResult.security?.recommendations.map((rec, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <span>{rec}</span>
                              </div>
                            ))}
                            {currentResult.analysis?.suggestedActions.map((action, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>{action}</span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                    <p className="text-muted-foreground">
                      Perform an IP lookup to see security and performance analysis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  IP Analysis Templates
                </CardTitle>
                <CardDescription>Pre-configured IP analysis templates for common scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ipTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs font-medium mb-1">Analysis Types:</div>
                            <div className="flex flex-wrap gap-1">
                              {template.analysisTypes.map((type, index) => (
                                <span key={index} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Example IPs:</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {template.ips.slice(0, 2).join(', ')}
                              {template.ips.length > 2 && '...'}
                            </div>
                          </div>
                        </div>
                        {template.useCase.length > 0 && (
                          <div className="text-xs">
                            <strong>Use cases:</strong> {template.useCase.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                IP Analysis Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="export-format" className="text-sm font-medium">
                    Export Format
                  </Label>
                  <Select
                    value={settings.exportFormat}
                    onValueChange={(value: ExportFormat) => setSettings((prev) => ({ ...prev, exportFormat: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="txt">Text Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max-results" className="text-sm font-medium">
                    Max Results
                  </Label>
                  <Input
                    id="max-results"
                    type="number"
                    value={settings.maxResults}
                    onChange={(e) => setSettings((prev) => ({ ...prev, maxResults: parseInt(e.target.value) || 100 }))}
                    min="1"
                    max="1000"
                    className="mt-2"
                  />
                </div>
              </div>

              {batches.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      const allResults = batches.flatMap((batch) => batch.results)
                      exportResults(allResults, 'txt', 'ip-analysis-report.txt')
                    }}
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export All Statistics
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const IpInfo = () => {
  return (
    <IPInfoErrorBoundary>
      <IPInfoCore />
    </IPInfoErrorBoundary>
  )
}

export default IpInfo
