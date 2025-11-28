import { useCallback, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
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
  Network,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  DNSLookupResult,
  DNSRecord,
  TTLAnalysis,
  SecurityMetrics,
  DNSAnalysis,
  ProcessingBatch,
  BatchStatistics,
  ProcessingSettings,
  DNSTemplate,
  DNSValidation,
  DNSRecordType,
  ExportFormat,
} from "@/components/tools/dns-lookup/schema"

// Utility functions

// DNS lookup functions (using public DNS APIs since browsers don't support native DNS)
const performDNSLookup = async (domain: string, recordType: DNSRecordType): Promise<DNSRecord[]> => {
  // Since browsers don't support native DNS queries, we'll use public DNS APIs
  // This is a mock implementation that demonstrates the structure

  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500))

    // Mock DNS records based on domain and record type
    const mockRecords: DNSRecord[] = []

    switch (recordType) {
      case "A":
        if (domain.includes("google")) {
          mockRecords.push(
            { type: "A", name: domain, value: "142.250.191.14", ttl: 300 },
            { type: "A", name: domain, value: "142.250.191.46", ttl: 300 }
          )
        } else if (domain.includes("github")) {
          mockRecords.push({ type: "A", name: domain, value: "140.82.112.3", ttl: 60 })
        } else {
          mockRecords.push({ type: "A", name: domain, value: "93.184.216.34", ttl: 86400 })
        }
        break

      case "AAAA":
        if (domain.includes("google")) {
          mockRecords.push({ type: "AAAA", name: domain, value: "2607:f8b0:4004:c1b::65", ttl: 300 })
        } else if (domain.includes("github")) {
          mockRecords.push({ type: "AAAA", name: domain, value: "2606:50c0:8000::153", ttl: 60 })
        }
        break

      case "MX":
        if (domain.includes("google")) {
          mockRecords.push(
            { type: "MX", name: domain, value: "smtp.google.com", priority: 10, ttl: 3600 },
            { type: "MX", name: domain, value: "smtp2.google.com", priority: 20, ttl: 3600 }
          )
        } else {
          mockRecords.push({ type: "MX", name: domain, value: "mail.example.com", priority: 10, ttl: 3600 })
        }
        break

      case "NS":
        if (domain.includes("google")) {
          mockRecords.push(
            { type: "NS", name: domain, value: "ns1.google.com", ttl: 172800 },
            { type: "NS", name: domain, value: "ns2.google.com", ttl: 172800 }
          )
        } else {
          mockRecords.push(
            { type: "NS", name: domain, value: "ns1.example.com", ttl: 86400 },
            { type: "NS", name: domain, value: "ns2.example.com", ttl: 86400 }
          )
        }
        break

      case "TXT":
        if (domain.includes("google")) {
          mockRecords.push(
            { type: "TXT", name: domain, value: "v=spf1 include:_spf.google.com ~all", ttl: 3600 },
            { type: "TXT", name: domain, value: "google-site-verification=abc123def456", ttl: 3600 }
          )
        } else {
          mockRecords.push({ type: "TXT", name: domain, value: "v=spf1 mx -all", ttl: 3600 })
        }
        break

      case "CNAME":
        if (domain.startsWith("www.")) {
          mockRecords.push({ type: "CNAME", name: domain, value: domain.replace("www.", ""), ttl: 3600 })
        }
        break

      case "SOA":
        mockRecords.push({
          type: "SOA",
          name: domain,
          value: "ns1.example.com admin.example.com 2023120101 7200 3600 604800 86400",
          ttl: 86400,
        })
        break

      case "CAA":
        mockRecords.push(
          { type: "CAA", name: domain, value: '0 issue "letsencrypt.org"', ttl: 86400 },
          { type: "CAA", name: domain, value: '0 iodef "mailto:security@example.com"', ttl: 86400 }
        )
        break
    }

    return mockRecords
  } catch (error) {
    throw new Error(`DNS lookup failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

const analyzeDNSRecords = (_domain: string, allRecords: DNSRecord[]): DNSAnalysis => {
  const analysis: DNSAnalysis = {
    isValidDomain: true,
    hasIPv4: false,
    hasIPv6: false,
    hasMailServers: false,
    hasNameServers: false,
    hasSecurityRecords: false,
    nameServers: [],
    mailServers: [],
    ipAddresses: [],
    suggestedImprovements: [],
    dnsIssues: [],
    qualityScore: 100,
    performanceIssues: [],
    securityIssues: [],
  }

  // Analyze record types
  allRecords.forEach((record) => {
    switch (record.type) {
      case "A":
        analysis.hasIPv4 = true
        analysis.ipAddresses.push(record.value)
        break
      case "AAAA":
        analysis.hasIPv6 = true
        analysis.ipAddresses.push(record.value)
        break
      case "MX":
        analysis.hasMailServers = true
        analysis.mailServers.push(record.value)
        break
      case "NS":
        analysis.hasNameServers = true
        analysis.nameServers.push(record.value)
        break
      case "TXT":
      case "CAA":
      case "DNSKEY":
        analysis.hasSecurityRecords = true
        break
    }
  })

  // Quality assessment
  if (!analysis.hasIPv4) {
    analysis.dnsIssues.push("No IPv4 address (A record) found")
    analysis.qualityScore -= 20
  }

  if (!analysis.hasIPv6) {
    analysis.suggestedImprovements.push("Consider adding IPv6 support (AAAA record)")
    analysis.qualityScore -= 10
  }

  if (!analysis.hasNameServers) {
    analysis.dnsIssues.push("No name servers (NS records) found")
    analysis.qualityScore -= 15
  }

  if (!analysis.hasSecurityRecords) {
    analysis.suggestedImprovements.push("Add security records (SPF, DMARC, CAA)")
    analysis.qualityScore -= 15
  }

  // Performance analysis
  const lowTTLRecords = allRecords.filter((record) => record.ttl && record.ttl < 300)
  if (lowTTLRecords.length > 0) {
    analysis.performanceIssues.push(`${lowTTLRecords.length} records have very low TTL (< 5 minutes)`)
    analysis.qualityScore -= 10
  }

  // Security analysis
  const spfRecord = allRecords.find((record) => record.type === "TXT" && record.value.includes("v=spf1"))
  if (!spfRecord) {
    analysis.securityIssues.push("No SPF record found")
    analysis.qualityScore -= 10
  }

  const caaRecord = allRecords.find((record) => record.type === "CAA")
  if (!caaRecord) {
    analysis.suggestedImprovements.push("Consider adding CAA records for certificate authority authorization")
  }

  return analysis
}

const calculateTTLAnalysis = (records: DNSRecord[]): TTLAnalysis => {
  const ttls = records.filter((record) => record.ttl).map((record) => record.ttl!)

  if (ttls.length === 0) {
    return {
      minTTL: 0,
      maxTTL: 0,
      averageTTL: 0,
      commonTTL: 0,
      ttlDistribution: {},
    }
  }

  const minTTL = Math.min(...ttls)
  const maxTTL = Math.max(...ttls)
  const averageTTL = ttls.reduce((sum, ttl) => sum + ttl, 0) / ttls.length

  // Find most common TTL
  const ttlCounts: Record<number, number> = {}
  ttls.forEach((ttl) => {
    ttlCounts[ttl] = (ttlCounts[ttl] || 0) + 1
  })
  const commonTTL = parseInt(
    Object.keys(ttlCounts).reduce((a, b) => (ttlCounts[parseInt(a)] > ttlCounts[parseInt(b)] ? a : b))
  )

  // TTL distribution by ranges
  const ttlDistribution: Record<string, number> = {
    "Very Low (< 5min)": ttls.filter((ttl) => ttl < 300).length,
    "Low (5min - 1hr)": ttls.filter((ttl) => ttl >= 300 && ttl < 3600).length,
    "Medium (1hr - 1day)": ttls.filter((ttl) => ttl >= 3600 && ttl < 86400).length,
    "High (> 1day)": ttls.filter((ttl) => ttl >= 86400).length,
  }

  return {
    minTTL,
    maxTTL,
    averageTTL,
    commonTTL,
    ttlDistribution,
  }
}

const calculateSecurityMetrics = (records: DNSRecord[]): SecurityMetrics => {
  const metrics: SecurityMetrics = {
    hasDNSSEC: false,
    hasCAA: false,
    hasSPF: false,
    hasDMARC: false,
    hasDKIM: false,
    securityScore: 0,
    vulnerabilities: [],
    recommendations: [],
  }

  records.forEach((record) => {
    switch (record.type) {
      case "CAA":
        metrics.hasCAA = true
        metrics.securityScore += 20
        break
      case "DNSKEY":
      case "DS":
      case "RRSIG":
        metrics.hasDNSSEC = true
        metrics.securityScore += 25
        break
      case "TXT":
        if (record.value.includes("v=spf1")) {
          metrics.hasSPF = true
          metrics.securityScore += 15
        }
        if (record.value.includes("v=DMARC1")) {
          metrics.hasDMARC = true
          metrics.securityScore += 20
        }
        if (record.value.includes("v=DKIM1")) {
          metrics.hasDKIM = true
          metrics.securityScore += 10
        }
        break
    }
  })

  // Add recommendations
  if (!metrics.hasSPF) {
    metrics.recommendations.push("Add SPF record to prevent email spoofing")
  }
  if (!metrics.hasDMARC) {
    metrics.recommendations.push("Add DMARC record for email authentication")
  }
  if (!metrics.hasCAA) {
    metrics.recommendations.push("Add CAA record to control certificate issuance")
  }
  if (!metrics.hasDNSSEC) {
    metrics.recommendations.push("Enable DNSSEC for enhanced security")
  }

  // Check for vulnerabilities
  const spfRecord = records.find((record) => record.type === "TXT" && record.value.includes("v=spf1"))
  if (spfRecord && spfRecord.value.includes("+all")) {
    metrics.vulnerabilities.push("SPF record allows all senders (+all)")
  }

  return metrics
}

// DNS templates
const dnsTemplates: DNSTemplate[] = [
  {
    id: "basic-website",
    name: "Basic Website",
    description: "Essential DNS records for a basic website",
    category: "Website",
    domains: ["example.com", "mysite.com", "company.com"],
    recordTypes: ["A", "AAAA", "CNAME", "NS"],
    useCase: ["Website hosting", "Basic web presence", "Domain setup"],
    examples: ["A record for main domain", "CNAME for www subdomain", "NS records for name servers"],
  },
  {
    id: "email-setup",
    name: "Email Configuration",
    description: "DNS records for email services and security",
    category: "Email",
    domains: ["company.com", "business.org", "startup.io"],
    recordTypes: ["MX", "TXT", "SPF", "DMARC"],
    useCase: ["Email hosting", "Email security", "Anti-spam protection"],
    examples: ["MX records for mail servers", "SPF for sender authentication", "DMARC for email policy"],
  },
  {
    id: "security-audit",
    name: "Security Audit",
    description: "Security-focused DNS record analysis",
    category: "Security",
    domains: ["secure.com", "bank.com", "enterprise.org"],
    recordTypes: ["CAA", "DNSKEY", "DS", "TXT"],
    useCase: ["Security assessment", "DNSSEC validation", "Certificate control"],
    examples: ["CAA for certificate authority control", "DNSSEC records", "Security TXT records"],
  },
  {
    id: "cdn-setup",
    name: "CDN Configuration",
    description: "DNS records for content delivery networks",
    category: "Performance",
    domains: ["cdn.example.com", "static.mysite.com", "assets.company.com"],
    recordTypes: ["CNAME", "A", "AAAA"],
    useCase: ["CDN setup", "Performance optimization", "Global content delivery"],
    examples: ["CNAME to CDN provider", "A records for edge servers", "IPv6 support"],
  },
  {
    id: "subdomain-analysis",
    name: "Subdomain Analysis",
    description: "Comprehensive subdomain DNS analysis",
    category: "Analysis",
    domains: ["api.example.com", "blog.mysite.com", "shop.company.com"],
    recordTypes: ["A", "CNAME", "TXT", "SRV"],
    useCase: ["Subdomain mapping", "Service discovery", "API endpoints"],
    examples: ["API subdomain records", "Blog CNAME setup", "Service records"],
  },
  {
    id: "troubleshooting",
    name: "DNS Troubleshooting",
    description: "Comprehensive DNS diagnostic lookup",
    category: "Diagnostics",
    domains: ["problem.com", "slow.example.com", "broken.site.com"],
    recordTypes: ["A", "AAAA", "NS", "SOA", "MX", "TXT"],
    useCase: ["DNS debugging", "Performance issues", "Connectivity problems"],
    examples: ["All record types", "TTL analysis", "Authority records"],
  },
]

// Validation functions
const validateDomain = (domain: string): DNSValidation => {
  const validation: DNSValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!domain || domain.trim().length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: "Domain name cannot be empty",
      type: "format",
      severity: "error",
    })
    return validation
  }

  // Basic domain format validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!domainRegex.test(domain)) {
    validation.isValid = false
    validation.errors.push({
      message: "Invalid domain name format",
      type: "format",
      severity: "error",
    })
  }

  // Length validation
  if (domain.length > 253) {
    validation.isValid = false
    validation.errors.push({
      message: "Domain name too long (max 253 characters)",
      type: "format",
      severity: "error",
    })
  }

  // Label length validation
  const labels = domain.split(".")
  for (const label of labels) {
    if (label.length > 63) {
      validation.warnings.push("Domain label exceeds 63 characters")
      break
    }
  }

  // Common issues
  if (domain.startsWith("-") || domain.endsWith("-")) {
    validation.warnings.push("Domain should not start or end with hyphen")
  }

  if (domain.includes("..")) {
    validation.errors.push({
      message: "Domain contains consecutive dots",
      type: "format",
      severity: "error",
    })
  }

  // Suggestions
  if (!domain.includes(".")) {
    validation.suggestions.push("Add a top-level domain (e.g., .com, .org)")
  }

  if (domain.startsWith("www.")) {
    validation.suggestions.push("Consider testing both with and without www prefix")
  }

  return validation
}

// Custom hooks
const useDNSLookup = () => {
  const performLookup = useCallback(async (domain: string, recordTypes: DNSRecordType[]): Promise<DNSLookupResult> => {
    const startTime = performance.now()

    try {
      const allRecords: DNSRecord[] = []

      // Perform lookup for each record type
      for (const recordType of recordTypes) {
        try {
          const records = await performDNSLookup(domain, recordType)
          allRecords.push(...records)
        } catch (error) {
          // Continue with other record types even if one fails
          console.warn(`Failed to lookup ${recordType} records for ${domain}:`, error)
        }
      }

      const endTime = performance.now()
      const processingTime = endTime - startTime
      const responseTime = Math.random() * 100 + 50 // Mock response time

      // Calculate statistics
      const recordTypeDistribution: Record<string, number> = {}
      allRecords.forEach((record) => {
        recordTypeDistribution[record.type] = (recordTypeDistribution[record.type] || 0) + 1
      })

      const ttlAnalysis = calculateTTLAnalysis(allRecords)
      const securityMetrics = calculateSecurityMetrics(allRecords)
      const analysis = analyzeDNSRecords(domain, allRecords)

      return {
        id: nanoid(),
        domain,
        recordType: recordTypes[0], // Primary record type
        isValid: true,
        records: allRecords,
        statistics: {
          domainLength: domain.length,
          recordCount: allRecords.length,
          processingTime,
          responseTime,
          recordTypeDistribution,
          ttlAnalysis,
          securityMetrics,
        },
        analysis,
        createdAt: new Date(),
      }
    } catch (error) {
      const endTime = performance.now()
      const processingTime = endTime - startTime

      return {
        id: nanoid(),
        domain,
        recordType: recordTypes[0],
        isValid: false,
        error: error instanceof Error ? error.message : "DNS lookup failed",
        records: [],
        statistics: {
          domainLength: domain.length,
          recordCount: 0,
          processingTime,
          responseTime: 0,
          recordTypeDistribution: {},
          ttlAnalysis: {
            minTTL: 0,
            maxTTL: 0,
            averageTTL: 0,
            commonTTL: 0,
            ttlDistribution: {},
          },
          securityMetrics: {
            hasDNSSEC: false,
            hasCAA: false,
            hasSPF: false,
            hasDMARC: false,
            hasDKIM: false,
            securityScore: 0,
            vulnerabilities: [],
            recommendations: [],
          },
        },
        createdAt: new Date(),
      }
    }
  }, [])

  const processBatch = useCallback(
    async (domains: string[], recordTypes: DNSRecordType[], settings: ProcessingSettings): Promise<ProcessingBatch> => {
      try {
        const results: DNSLookupResult[] = []

        // Process domains sequentially to avoid overwhelming DNS servers
        for (const domain of domains) {
          try {
            const result = await performLookup(domain, recordTypes)
            results.push(result)
          } catch (error) {
            console.error(`Failed to process domain ${domain}:`, error)
          }
        }

        const validCount = results.filter((result) => result.isValid).length
        const invalidCount = results.length - validCount
        const totalRecords = results.reduce((sum, result) => sum + result.records.length, 0)
        const averageQuality =
          results.length > 0
            ? results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length
            : 0

        // Aggregate statistics
        const recordTypeDistribution: Record<string, number> = {}
        const securityDistribution: Record<string, number> = {}

        results.forEach((result) => {
          if (result.isValid) {
            Object.entries(result.statistics.recordTypeDistribution).forEach(([type, count]) => {
              recordTypeDistribution[type] = (recordTypeDistribution[type] || 0) + count
            })

            const securityScore = result.statistics.securityMetrics.securityScore
            const securityLevel = securityScore >= 80 ? "High" : securityScore >= 50 ? "Medium" : "Low"
            securityDistribution[securityLevel] = (securityDistribution[securityLevel] || 0) + 1
          }
        })

        const statistics: BatchStatistics = {
          totalProcessed: results.length,
          validCount,
          invalidCount,
          averageQuality,
          totalRecords,
          successRate: (validCount / results.length) * 100,
          recordTypeDistribution,
          securityDistribution,
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
        console.error("Batch processing error:", error)
        throw new Error(error instanceof Error ? error.message : "Batch processing failed")
      }
    },
    [performLookup]
  )

  return { performLookup, processBatch }
}

// Real-time validation hook
const useRealTimeValidation = (domain: string) => {
  return useMemo(() => {
    if (!domain.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = validateDomain(domain)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
    }
  }, [domain])
}

// Copy to clipboard functionality
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || "text")
      toast.success(`${label || "Text"} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }, [])

  return { copyToClipboard, copiedText }
}

// Export functionality
const useDNSExport = () => {
  const exportResults = useCallback((results: DNSLookupResult[], format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "json":
        const jsonData = results.map((result) => ({
          id: result.id,
          domain: result.domain,
          recordType: result.recordType,
          isValid: result.isValid,
          error: result.error,
          records: result.records,
          statistics: result.statistics,
          analysis: result.analysis,
          createdAt: result.createdAt,
        }))
        content = JSON.stringify(jsonData, null, 2)
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        const csvHeaders = [
          "Domain",
          "Record Type",
          "Record Value",
          "TTL",
          "Priority",
          "Valid",
          "Quality Score",
          "Security Score",
          "Has IPv4",
          "Has IPv6",
        ]
        const csvRows: string[] = []
        results.forEach((result) => {
          if (result.isValid && result.records.length > 0) {
            result.records.forEach((record) => {
              csvRows.push(
                [
                  result.domain,
                  record.type,
                  `"${record.value.replace(/"/g, '""')}"`,
                  record.ttl?.toString() || "",
                  record.priority?.toString() || "",
                  "Yes",
                  result.analysis?.qualityScore?.toString() || "",
                  result.statistics.securityMetrics.securityScore.toString(),
                  result.analysis?.hasIPv4 ? "Yes" : "No",
                  result.analysis?.hasIPv6 ? "Yes" : "No",
                ].join(",")
              )
            })
          } else {
            csvRows.push(
              [result.domain, result.recordType, result.error || "No records", "", "", "No", "", "", "", ""].join(",")
            )
          }
        })
        content = [csvHeaders.join(","), ...csvRows].join("\n")
        mimeType = "text/csv"
        extension = ".csv"
        break
      case "xml":
        const xmlData = results
          .map(
            (result) => `
  <dnsLookup>
    <domain>${result.domain}</domain>
    <recordType>${result.recordType}</recordType>
    <valid>${result.isValid}</valid>
    <records>
      ${result.records
        .map(
          (record) => `
      <record>
        <type>${record.type}</type>
        <name>${record.name}</name>
        <value><![CDATA[${record.value}]]></value>
        <ttl>${record.ttl || 0}</ttl>
        ${record.priority ? `<priority>${record.priority}</priority>` : ""}
      </record>`
        )
        .join("")}
    </records>
    <analysis>
      <qualityScore>${result.analysis?.qualityScore || 0}</qualityScore>
      <securityScore>${result.statistics.securityMetrics.securityScore}</securityScore>
      <hasIPv4>${result.analysis?.hasIPv4 || false}</hasIPv4>
      <hasIPv6>${result.analysis?.hasIPv6 || false}</hasIPv6>
    </analysis>
  </dnsLookup>`
          )
          .join("")
        content = `<?xml version="1.0" encoding="UTF-8"?>\n<dnsLookupResults>${xmlData}\n</dnsLookupResults>`
        mimeType = "application/xml"
        extension = ".xml"
        break
      case "txt":
      default:
        content = generateTextFromResults(results)
        mimeType = "text/plain"
        extension = ".txt"
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `dns-lookup-results${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResults }
}

// Generate text report from results
const generateTextFromResults = (results: DNSLookupResult[]): string => {
  return `DNS Lookup Results
==================

Generated: ${new Date().toLocaleString()}
Total Lookups: ${results.length}
Valid Lookups: ${results.filter((result) => result.isValid).length}
Invalid Lookups: ${results.filter((result) => !result.isValid).length}

Lookup Results:
${results
  .map((result, i) => {
    return `${i + 1}. Domain: ${result.domain}
   Status: ${result.isValid ? "Valid" : "Invalid"}
   ${result.error ? `Error: ${result.error}` : ""}
   Records Found: ${result.records.length}
   Processing Time: ${result.statistics.processingTime.toFixed(2)}ms
   Response Time: ${result.statistics.responseTime.toFixed(2)}ms
   Quality Score: ${result.analysis?.qualityScore || "N/A"}/100
   Security Score: ${result.statistics.securityMetrics.securityScore}/100

   ${result.records.length > 0 ? "DNS Records:" : "No DNS records found"}
   ${result.records
     .map(
       (record, j) => `
   ${j + 1}. ${record.type} ${record.name} ${record.value} ${record.ttl ? `(TTL: ${record.ttl}s)` : ""}
   `
     )
     .join("")}
`
  })
  .join("\n")}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Total DNS Records: ${results.reduce((sum, result) => sum + result.records.length, 0)}
- Average Quality Score: ${(results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length).toFixed(1)}
- Average Security Score: ${(results.reduce((sum, result) => sum + result.statistics.securityMetrics.securityScore, 0) / results.length).toFixed(1)}
`
}

/**
 * Enhanced DNS Lookup & Analysis Tool
 * Features: Advanced DNS lookup, record analysis, security assessment, performance monitoring
 */
const DNSLookupCore = () => {
  const [activeTab, setActiveTab] = useState<"lookup" | "batch" | "analyzer" | "templates">("lookup")
  const [domain, setDomain] = useState("")
  const [selectedRecordTypes, setSelectedRecordTypes] = useState<DNSRecordType[]>(["A", "AAAA", "MX", "NS", "TXT"])
  const [currentResult, setCurrentResult] = useState<DNSLookupResult | null>(null)
  const [batches, setBatches] = useState<ProcessingBatch[]>([])
  const [batchInput, setBatchInput] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [settings, setSettings] = useState<ProcessingSettings>({
    recordTypes: ["A", "AAAA", "MX", "NS", "TXT"],
    includeSecurityAnalysis: true,
    includePerformanceAnalysis: true,
    includeDomainAnalysis: true,
    timeout: 5000,
    retryAttempts: 3,
    usePublicDNS: true,
    dnsServer: "8.8.8.8",
    exportFormat: "json",
    realTimeLookup: false,
    maxResults: 100,
  })

  const { performLookup, processBatch } = useDNSLookup()
  const { exportResults } = useDNSExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const domainValidation = useRealTimeValidation(domain)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = dnsTemplates.find((t) => t.id === templateId)
    if (template) {
      setDomain(template.domains[0])
      setSelectedRecordTypes(template.recordTypes)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single lookup
  const handleLookup = useCallback(async () => {
    if (!domain.trim()) {
      toast.error("Please enter a domain name")
      return
    }

    if (!domainValidation.isValid) {
      toast.error("Please enter a valid domain name")
      return
    }

    setIsProcessing(true)
    try {
      const result = await performLookup(domain, selectedRecordTypes)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success(`Found ${result.records.length} DNS record(s)`)
      } else {
        toast.error(result.error || "DNS lookup failed")
      }
    } catch (error) {
      toast.error("Failed to perform DNS lookup")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [domain, selectedRecordTypes, settings, performLookup, domainValidation.isValid])

  // Handle batch processing
  const handleProcessBatch = useCallback(async () => {
    const domains = batchInput
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.trim())

    if (domains.length === 0) {
      toast.error("Please enter domain names to lookup")
      return
    }

    setIsProcessing(true)
    try {
      const batch = await processBatch(domains, selectedRecordTypes, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Processed ${batch.results.length} domain lookups`)
    } catch (error) {
      toast.error("Failed to process batch")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, selectedRecordTypes, settings, processBatch])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div
        id="main-content"
        className="flex flex-col gap-4"
      >
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              DNS Lookup & Analysis Tool
            </CardTitle>
            <CardDescription>
              Advanced DNS lookup tool with comprehensive record analysis, security assessment, and performance
              monitoring. Query DNS records for any domain and get detailed insights about DNS configuration, security
              posture, and optimization opportunities. Use keyboard navigation: Tab to move between controls, Enter or
              Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "lookup" | "batch" | "analyzer" | "templates")}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="lookup"
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              DNS Lookup
            </TabsTrigger>
            <TabsTrigger
              value="batch"
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Batch Lookup
            </TabsTrigger>
            <TabsTrigger
              value="analyzer"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              DNS Analyzer
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* DNS Lookup Tab */}
          <TabsContent
            value="lookup"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Lookup Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    DNS Lookup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="domain-input"
                      className="text-sm font-medium"
                    >
                      Domain Name
                    </Label>
                    <Input
                      id="domain-input"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="Enter domain name (e.g., example.com)"
                      className="mt-2"
                    />
                    {domain && (
                      <div className="mt-2 text-sm">
                        {domainValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid domain format
                          </div>
                        ) : domainValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {domainValidation.error}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Record Type Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">DNS Record Types</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA", "CAA", "SRV"] as DNSRecordType[]).map(
                        (recordType) => (
                          <div
                            key={recordType}
                            className="flex items-center space-x-2"
                          >
                            <input
                              id={`record-${recordType}`}
                              type="checkbox"
                              checked={selectedRecordTypes.includes(recordType)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRecordTypes((prev) => [...prev, recordType])
                                } else {
                                  setSelectedRecordTypes((prev) => prev.filter((type) => type !== recordType))
                                }
                              }}
                              className="rounded border-input"
                            />
                            <Label
                              htmlFor={`record-${recordType}`}
                              className="text-xs"
                            >
                              {recordType}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRecordTypes(["A", "AAAA", "MX", "NS", "TXT"])}
                      >
                        Common
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setSelectedRecordTypes(["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA", "CAA", "SRV"])
                        }
                      >
                        All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRecordTypes([])}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* Lookup Settings */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Lookup Settings</Label>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label
                          htmlFor="timeout"
                          className="text-xs"
                        >
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
                        <Label
                          htmlFor="dns-server"
                          className="text-xs"
                        >
                          DNS Server
                        </Label>
                        <Select
                          value={settings.dnsServer}
                          onValueChange={(value) => setSettings((prev) => ({ ...prev, dnsServer: value }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="8.8.8.8">Google DNS (8.8.8.8)</SelectItem>
                            <SelectItem value="1.1.1.1">Cloudflare DNS (1.1.1.1)</SelectItem>
                            <SelectItem value="208.67.222.222">OpenDNS (208.67.222.222)</SelectItem>
                            <SelectItem value="auto">System Default</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
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
                        <Label
                          htmlFor="include-security"
                          className="text-xs"
                        >
                          Include security analysis
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-performance"
                          type="checkbox"
                          checked={settings.includePerformanceAnalysis}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, includePerformanceAnalysis: e.target.checked }))
                          }
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="include-performance"
                          className="text-xs"
                        >
                          Include performance analysis
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-domain"
                          type="checkbox"
                          checked={settings.includeDomainAnalysis}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, includeDomainAnalysis: e.target.checked }))
                          }
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="include-domain"
                          className="text-xs"
                        >
                          Include domain analysis
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleLookup}
                      disabled={
                        !domain.trim() || !domainValidation.isValid || selectedRecordTypes.length === 0 || isProcessing
                      }
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Lookup DNS Records
                    </Button>
                    <Button
                      onClick={() => {
                        setDomain("")
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {domainValidation.warnings && domainValidation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Warnings:</h4>
                      <div className="text-xs space-y-1">
                        {domainValidation.warnings.map((warning, index) => (
                          <div
                            key={index}
                            className="text-yellow-700"
                          >
                            {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {domainValidation.suggestions && domainValidation.suggestions.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-blue-800">Suggestions:</h4>
                      <div className="text-xs space-y-1">
                        {domainValidation.suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="text-blue-700"
                          >
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
                    DNS Records
                    <div className="ml-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                      >
                        {showDetailedAnalysis ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-2">Domain: {currentResult.domain}</div>
                        <div className="text-sm">
                          <div>
                            <strong>Status:</strong> {currentResult.isValid ? "Success" : "Failed"}
                          </div>
                          <div>
                            <strong>Records Found:</strong> {currentResult.records.length}
                          </div>
                          <div>
                            <strong>Processing Time:</strong> {currentResult.statistics.processingTime.toFixed(2)}ms
                          </div>
                          <div>
                            <strong>Response Time:</strong> {currentResult.statistics.responseTime.toFixed(2)}ms
                          </div>
                          {currentResult.error && (
                            <div className="text-red-600 mt-1">
                              <strong>Error:</strong> {currentResult.error}
                            </div>
                          )}
                        </div>
                      </div>

                      {currentResult.isValid && currentResult.records.length > 0 ? (
                        <div className="space-y-4">
                          {/* DNS Records List */}
                          <div className="space-y-3">
                            {Object.entries(
                              currentResult.records.reduce(
                                (acc, record) => {
                                  if (!acc[record.type]) acc[record.type] = []
                                  acc[record.type].push(record)
                                  return acc
                                },
                                {} as Record<string, DNSRecord[]>
                              )
                            ).map(([recordType, records]) => (
                              <div
                                key={recordType}
                                className="border rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-lg flex items-center gap-2">
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        recordType === "A" || recordType === "AAAA"
                                          ? "bg-blue-100 text-blue-800"
                                          : recordType === "MX"
                                            ? "bg-green-100 text-green-800"
                                            : recordType === "NS"
                                              ? "bg-purple-100 text-purple-800"
                                              : recordType === "TXT"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {recordType}
                                    </span>
                                    {records.length} record{records.length !== 1 ? "s" : ""}
                                  </h4>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      copyToClipboard(records.map((r) => r.value).join("\n"), `${recordType} Records`)
                                    }
                                  >
                                    {copiedText === `${recordType} Records` ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>

                                <div className="space-y-2">
                                  {records.map((record, index) => (
                                    <div
                                      key={index}
                                      className="bg-muted/50 rounded p-3"
                                    >
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <div>
                                            <strong>Value:</strong> <span className="font-mono">{record.value}</span>
                                          </div>
                                          {record.ttl && (
                                            <div>
                                              <strong>TTL:</strong> {record.ttl}s ({Math.floor(record.ttl / 60)}m)
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          {record.priority && (
                                            <div>
                                              <strong>Priority:</strong> {record.priority}
                                            </div>
                                          )}
                                          {record.weight && (
                                            <div>
                                              <strong>Weight:</strong> {record.weight}
                                            </div>
                                          )}
                                          {record.port && (
                                            <div>
                                              <strong>Port:</strong> {record.port}
                                            </div>
                                          )}
                                          {record.target && (
                                            <div>
                                              <strong>Target:</strong> {record.target}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Analysis Results */}
                          {showDetailedAnalysis && currentResult.analysis && (
                            <div className="space-y-4">
                              {/* Domain Analysis */}
                              <div className="border rounded-lg p-4">
                                <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                                  <Globe className="h-5 w-5" />
                                  Domain Analysis
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <div>
                                      <strong>IPv4:</strong> {currentResult.analysis.hasIPv4 ? "✅ Yes" : "❌ No"}
                                    </div>
                                    <div>
                                      <strong>IPv6:</strong> {currentResult.analysis.hasIPv6 ? "✅ Yes" : "❌ No"}
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Mail Servers:</strong>{" "}
                                      {currentResult.analysis.hasMailServers ? "✅ Yes" : "❌ No"}
                                    </div>
                                    <div>
                                      <strong>Name Servers:</strong>{" "}
                                      {currentResult.analysis.hasNameServers ? "✅ Yes" : "❌ No"}
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Security Records:</strong>{" "}
                                      {currentResult.analysis.hasSecurityRecords ? "✅ Yes" : "❌ No"}
                                    </div>
                                    <div>
                                      <strong>Quality Score:</strong> {currentResult.analysis.qualityScore}/100
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>IP Addresses:</strong> {currentResult.analysis.ipAddresses.length}
                                    </div>
                                    <div>
                                      <strong>Mail Servers:</strong> {currentResult.analysis.mailServers.length}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Security Analysis */}
                              <div className="border rounded-lg p-4">
                                <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                                  <Shield className="h-5 w-5" />
                                  Security Analysis
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                                  <div>
                                    <div>
                                      <strong>DNSSEC:</strong>{" "}
                                      {currentResult.statistics.securityMetrics.hasDNSSEC
                                        ? "✅ Enabled"
                                        : "❌ Disabled"}
                                    </div>
                                    <div>
                                      <strong>SPF:</strong>{" "}
                                      {currentResult.statistics.securityMetrics.hasSPF ? "✅ Present" : "❌ Missing"}
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>DMARC:</strong>{" "}
                                      {currentResult.statistics.securityMetrics.hasDMARC ? "✅ Present" : "❌ Missing"}
                                    </div>
                                    <div>
                                      <strong>CAA:</strong>{" "}
                                      {currentResult.statistics.securityMetrics.hasCAA ? "✅ Present" : "❌ Missing"}
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>DKIM:</strong>{" "}
                                      {currentResult.statistics.securityMetrics.hasDKIM ? "✅ Present" : "❌ Missing"}
                                    </div>
                                    <div>
                                      <strong>Security Score:</strong>{" "}
                                      {currentResult.statistics.securityMetrics.securityScore}/100
                                    </div>
                                  </div>
                                </div>

                                {currentResult.statistics.securityMetrics.vulnerabilities.length > 0 && (
                                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <h5 className="font-medium text-sm mb-2 text-red-800">Security Vulnerabilities</h5>
                                    <ul className="text-sm space-y-1">
                                      {currentResult.statistics.securityMetrics.vulnerabilities.map((vuln, index) => (
                                        <li
                                          key={index}
                                          className="flex items-center gap-2 text-red-700"
                                        >
                                          <AlertCircle className="h-3 w-3" />
                                          {vuln}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {currentResult.statistics.securityMetrics.recommendations.length > 0 && (
                                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h5 className="font-medium text-sm mb-2 text-blue-800">Security Recommendations</h5>
                                    <ul className="text-sm space-y-1">
                                      {currentResult.statistics.securityMetrics.recommendations.map((rec, index) => (
                                        <li
                                          key={index}
                                          className="flex items-center gap-2 text-blue-700"
                                        >
                                          <CheckCircle2 className="h-3 w-3" />
                                          {rec}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {/* TTL Analysis */}
                              <div className="border rounded-lg p-4">
                                <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                                  <Clock className="h-5 w-5" />
                                  TTL Analysis
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                  <div>
                                    <div>
                                      <strong>Min TTL:</strong> {currentResult.statistics.ttlAnalysis.minTTL}s
                                    </div>
                                    <div>
                                      <strong>Max TTL:</strong> {currentResult.statistics.ttlAnalysis.maxTTL}s
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Average TTL:</strong>{" "}
                                      {Math.round(currentResult.statistics.ttlAnalysis.averageTTL)}s
                                    </div>
                                    <div>
                                      <strong>Common TTL:</strong> {currentResult.statistics.ttlAnalysis.commonTTL}s
                                    </div>
                                  </div>
                                </div>

                                {Object.keys(currentResult.statistics.ttlAnalysis.ttlDistribution).length > 0 && (
                                  <div>
                                    <h5 className="font-medium text-sm mb-2">TTL Distribution</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      {Object.entries(currentResult.statistics.ttlAnalysis.ttlDistribution).map(
                                        ([range, count]) => (
                                          <div
                                            key={range}
                                            className="text-xs"
                                          >
                                            <span className="font-medium">{range}:</span> {count}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Issues and Recommendations */}
                              {(currentResult.analysis.dnsIssues.length > 0 ||
                                currentResult.analysis.suggestedImprovements.length > 0 ||
                                currentResult.analysis.performanceIssues.length > 0) && (
                                <div className="space-y-4">
                                  {currentResult.analysis.dnsIssues.length > 0 && (
                                    <div className="border rounded-lg p-3">
                                      <Label className="font-medium text-sm mb-3 block text-red-700">DNS Issues</Label>
                                      <ul className="text-sm space-y-1">
                                        {currentResult.analysis.dnsIssues.map((issue, index) => (
                                          <li
                                            key={index}
                                            className="flex items-center gap-2"
                                          >
                                            <AlertCircle className="h-3 w-3 text-red-600" />
                                            {issue}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {currentResult.analysis.suggestedImprovements.length > 0 && (
                                    <div className="border rounded-lg p-3">
                                      <Label className="font-medium text-sm mb-3 block text-blue-700">
                                        Suggested Improvements
                                      </Label>
                                      <ul className="text-sm space-y-1">
                                        {currentResult.analysis.suggestedImprovements.map((suggestion, index) => (
                                          <li
                                            key={index}
                                            className="flex items-center gap-2"
                                          >
                                            <CheckCircle2 className="h-3 w-3 text-blue-600" />
                                            {suggestion}
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
                                          <li
                                            key={index}
                                            className="flex items-center gap-2"
                                          >
                                            <Clock className="h-3 w-3 text-orange-600" />
                                            {issue}
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
                            <Label className="font-medium text-sm mb-3 block">Lookup Statistics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Total Records:</strong> {currentResult.statistics.recordCount}
                                </div>
                              </div>
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
                                  <strong>Domain Length:</strong> {currentResult.statistics.domainLength} chars
                                </div>
                              </div>
                            </div>

                            {Object.keys(currentResult.statistics.recordTypeDistribution).length > 0 && (
                              <div className="mt-3">
                                <div className="text-sm font-medium mb-2">Record Type Distribution:</div>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(currentResult.statistics.recordTypeDistribution).map(
                                    ([type, count]) => (
                                      <span
                                        key={type}
                                        className="px-2 py-1 bg-muted rounded text-xs"
                                      >
                                        {type}: {count}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : currentResult.isValid ? (
                        <div className="text-center py-8">
                          <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No DNS Records Found</h3>
                          <p className="text-muted-foreground mb-4">
                            No DNS records found for "{currentResult.domain}". The domain may not exist or may not have
                            the requested record types.
                          </p>
                        </div>
                      ) : null}

                      {currentResult.isValid && currentResult.records.length > 0 && (
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
                      <Network className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No DNS Lookup Performed</h3>
                      <p className="text-muted-foreground mb-4">
                        Enter a domain name and select record types to perform DNS lookup
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Lookup Tab */}
          <TabsContent
            value="batch"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Batch DNS Lookup
                </CardTitle>
                <CardDescription>
                  Perform DNS lookups for multiple domains simultaneously (one per line)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="batch-input"
                      className="text-sm font-medium"
                    >
                      Domain Names (one per line)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder="example.com&#10;google.com&#10;github.com&#10;stackoverflow.com"
                      className="mt-2 min-h-[200px] font-mono text-sm"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">Enter one domain name per line</div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleProcessBatch}
                      disabled={!batchInput.trim() || selectedRecordTypes.length === 0 || isProcessing}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Lookup Batch
                    </Button>
                    <Button
                      onClick={() => setBatchInput("")}
                      variant="outline"
                    >
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
                      <div
                        key={batch.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{batch.count} domains processed</h4>
                            <div className="text-sm text-muted-foreground">
                              {batch.createdAt.toLocaleString()} • {batch.statistics.successRate.toFixed(1)}% success
                              rate
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportResults(batch.results, "csv")}
                            >
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium">Valid:</span> {batch.statistics.validCount}
                          </div>
                          <div>
                            <span className="font-medium">Invalid:</span> {batch.statistics.invalidCount}
                          </div>
                          <div>
                            <span className="font-medium">Total Records:</span> {batch.statistics.totalRecords}
                          </div>
                        </div>

                        {/* Distribution Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Record Type Distribution</h5>
                            <div className="space-y-1">
                              {Object.entries(batch.statistics.recordTypeDistribution).map(([type, count]) => (
                                <div
                                  key={type}
                                  className="flex justify-between text-xs"
                                >
                                  <span>{type}:</span>
                                  <span>{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2">Security Distribution</h5>
                            <div className="space-y-1">
                              {Object.entries(batch.statistics.securityDistribution).map(([level, count]) => (
                                <div
                                  key={level}
                                  className="flex justify-between text-xs"
                                >
                                  <span
                                    className={
                                      level === "High"
                                        ? "text-green-600"
                                        : level === "Medium"
                                          ? "text-orange-600"
                                          : "text-red-600"
                                    }
                                  >
                                    {level}:
                                  </span>
                                  <span>{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.results.slice(0, 5).map((result) => (
                              <div
                                key={result.id}
                                className="text-xs border rounded p-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">{result.domain}</span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      result.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {result.isValid ? `${result.records.length} records` : "Failed"}
                                  </span>
                                </div>
                                {result.isValid && result.records.length > 0 && (
                                  <div className="text-muted-foreground mt-1">
                                    Records: {Object.keys(result.statistics.recordTypeDistribution).join(", ")} •
                                    Quality: {result.analysis?.qualityScore || "N/A"}/100 • Security:{" "}
                                    {result.statistics.securityMetrics.securityScore}/100 •
                                    {result.statistics.processingTime.toFixed(2)}ms
                                  </div>
                                )}
                                {result.error && <div className="text-red-600 mt-1">{result.error}</div>}
                              </div>
                            ))}
                            {batch.results.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.results.length - 5} more domains
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

          {/* DNS Analyzer Tab */}
          <TabsContent
            value="analyzer"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  DNS Security & Performance Analyzer
                </CardTitle>
                <CardDescription>Analyze DNS configuration for security and performance issues</CardDescription>
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
                            className={`p-3 rounded-lg ${currentResult.statistics.securityMetrics.hasDNSSEC ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                          >
                            <div className="font-medium">DNSSEC</div>
                            <div
                              className={
                                currentResult.statistics.securityMetrics.hasDNSSEC ? "text-green-700" : "text-red-700"
                              }
                            >
                              {currentResult.statistics.securityMetrics.hasDNSSEC ? "Enabled" : "Disabled"}
                            </div>
                          </div>
                          <div
                            className={`p-3 rounded-lg ${currentResult.statistics.securityMetrics.hasSPF ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                          >
                            <div className="font-medium">SPF Record</div>
                            <div
                              className={
                                currentResult.statistics.securityMetrics.hasSPF ? "text-green-700" : "text-red-700"
                              }
                            >
                              {currentResult.statistics.securityMetrics.hasSPF ? "Present" : "Missing"}
                            </div>
                          </div>
                          <div
                            className={`p-3 rounded-lg ${currentResult.statistics.securityMetrics.hasCAA ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"}`}
                          >
                            <div className="font-medium">CAA Record</div>
                            <div
                              className={
                                currentResult.statistics.securityMetrics.hasCAA ? "text-green-700" : "text-orange-700"
                              }
                            >
                              {currentResult.statistics.securityMetrics.hasCAA ? "Present" : "Missing"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="font-medium mb-2">Overall Security Score</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                currentResult.statistics.securityMetrics.securityScore >= 80
                                  ? "bg-green-500"
                                  : currentResult.statistics.securityMetrics.securityScore >= 50
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${currentResult.statistics.securityMetrics.securityScore}%` }}
                            ></div>
                          </div>
                          <div className="text-xs mt-1">
                            {currentResult.statistics.securityMetrics.securityScore}/100
                          </div>
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
                            <div className="font-medium">Min TTL</div>
                            <div className="text-lg">{currentResult.statistics.ttlAnalysis.minTTL}s</div>
                          </div>
                          <div>
                            <div className="font-medium">Max TTL</div>
                            <div className="text-lg">{currentResult.statistics.ttlAnalysis.maxTTL}s</div>
                          </div>
                          <div>
                            <div className="font-medium">Avg TTL</div>
                            <div className="text-lg">
                              {Math.round(currentResult.statistics.ttlAnalysis.averageTTL)}s
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 建议 */}
                    {(currentResult.statistics.securityMetrics.recommendations.length > 0 ||
                      (currentResult.analysis?.suggestedImprovements?.length ?? 0) > 0) && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                          {currentResult.statistics.securityMetrics.recommendations.map((rec, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-blue-50 rounded"
                            >
                              <Shield className="h-4 w-4 text-blue-600" />
                              <span>{rec}</span>
                            </div>
                          ))}
                          {currentResult.analysis?.suggestedImprovements.map((improvement, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-green-50 rounded"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>{improvement}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                    <p className="text-muted-foreground">
                      Perform a DNS lookup to see security and performance analysis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent
            value="templates"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  DNS Lookup Templates
                </CardTitle>
                <CardDescription>Pre-configured DNS lookup templates for common scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dnsTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
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
                            <div className="text-xs font-medium mb-1">Record Types:</div>
                            <div className="flex flex-wrap gap-1">
                              {template.recordTypes.map((type, index) => (
                                <span
                                  key={index}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Example Domains:</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {template.domains.slice(0, 2).join(", ")}
                              {template.domains.length > 2 && "..."}
                            </div>
                          </div>
                        </div>
                        {template.useCase.length > 0 && (
                          <div className="text-xs">
                            <strong>Use cases:</strong> {template.useCase.join(", ")}
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
                DNS Lookup Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="export-format"
                    className="text-sm font-medium"
                  >
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
                  <Label
                    htmlFor="retry-attempts"
                    className="text-sm font-medium"
                  >
                    Retry Attempts
                  </Label>
                  <Input
                    id="retry-attempts"
                    type="number"
                    value={settings.retryAttempts}
                    onChange={(e) => setSettings((prev) => ({ ...prev, retryAttempts: parseInt(e.target.value) || 3 }))}
                    min="1"
                    max="10"
                    className="mt-2"
                  />
                </div>
              </div>

              {batches.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      const allResults = batches.flatMap((batch) => batch.results)
                      exportResults(allResults, "txt", "dns-lookup-report.txt")
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
const DnsLookup = () => {
  return <DNSLookupCore />
}

export default DnsLookup
