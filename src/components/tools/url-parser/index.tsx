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
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  Shield,
  Server,
  Building,
  Navigation,
  Activity,
  Link,
  Hash,
  Key,
  Lock,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  URLParseResult,
  URLComponents,
  URLSearchParam,
  URLAnalysis,
  URLSecurity,
  URLSEOAnalysis,
  URLStatistics,
  ProcessingBatch,
  BatchStatistics,
  ProcessingSettings,
  URLTemplate,
  URLValidation,
  ExportFormat,
} from "@/schemas/url-parser.schema"

// Utility functions

// URL parsing and analysis functions
const parseURL = (
  urlString: string
): { components: URLComponents; analysis: URLAnalysis; security: URLSecurity; seo: URLSEOAnalysis } => {
  try {
    const url = new URL(urlString)

    // Extract components
    const searchParams: URLSearchParam[] = []
    url.searchParams.forEach((value, key) => {
      searchParams.push({
        key,
        value,
        encoded: key !== decodeURIComponent(key) || value !== decodeURIComponent(value),
      })
    })

    const pathSegments = url.pathname.split("/").filter((segment) => segment.length > 0)
    const domainParts = url.hostname.split(".")
    const tld = domainParts[domainParts.length - 1]
    const domain = domainParts.length > 1 ? domainParts[domainParts.length - 2] + "." + tld : url.hostname
    const subdomain = domainParts.length > 2 ? domainParts.slice(0, -2).join(".") : undefined

    const components: URLComponents = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
      host: url.host,
      username: url.username || undefined,
      password: url.password || undefined,
      searchParams,
      pathSegments,
      subdomain,
      domain,
      tld,
      isSecure: url.protocol === "https:",
      defaultPort:
        !url.port ||
        (url.protocol === "http:" && url.port === "80") ||
        (url.protocol === "https:" && url.port === "443"),
      hasCredentials: !!(url.username || url.password),
    }

    // Perform analysis
    const analysis = analyzeURL(url, components)
    const security = analyzeURLSecurity(url, components)
    const seo = analyzeURLSEO(url, components)

    return { components, analysis, security, seo }
  } catch (error) {
    throw new Error(`Invalid URL: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

const analyzeURL = (url: URL, components: URLComponents): URLAnalysis => {
  const analysis: URLAnalysis = {
    isValidURL: true,
    urlType: "absolute",
    hasCredentials: !!(components.username || components.password),
    hasQuery: components.search.length > 0,
    hasFragment: components.hash.length > 0,
    hasPort: !components.defaultPort,
    isLocalhost: components.hostname === "localhost" || components.hostname === "127.0.0.1",
    isIP: /^\d+\.\d+\.\d+\.\d+$/.test(components.hostname),
    isDomain: !/^\d+\.\d+\.\d+\.\d+$/.test(components.hostname) && components.hostname !== "localhost",
    pathDepth: components.pathSegments.length,
    queryParamCount: components.searchParams.length,
    urlLength: url.toString().length,
    qualityScore: 100,
    usabilityScore: 100,
    securityScore: 100,
    seoScore: 100,
    issues: [],
    recommendations: [],
    compliance: {
      rfc3986Compliant: true,
      w3cCompliant: true,
      seoFriendly: true,
      accessibilityFriendly: true,
      issues: [],
      recommendations: [],
    },
  }

  // Quality assessment
  if (analysis.urlLength > 2000) {
    analysis.qualityScore -= 20
    analysis.issues.push("URL is very long (>2000 characters)")
    analysis.recommendations.push("Consider shortening the URL for better usability")
  }

  if (analysis.pathDepth > 5) {
    analysis.qualityScore -= 10
    analysis.usabilityScore -= 15
    analysis.issues.push("URL has deep path structure")
    analysis.recommendations.push("Consider flattening the URL structure")
  }

  if (analysis.queryParamCount > 10) {
    analysis.qualityScore -= 15
    analysis.issues.push("URL has many query parameters")
    analysis.recommendations.push("Consider reducing the number of query parameters")
  }

  // Usability assessment
  if (components.pathname.includes("_")) {
    analysis.usabilityScore -= 5
    analysis.recommendations.push("Consider using hyphens instead of underscores in paths")
  }

  if (!/^[a-z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/i.test(url.toString())) {
    analysis.usabilityScore -= 10
    analysis.issues.push("URL contains non-standard characters")
  }

  return analysis
}

const analyzeURLSecurity = (url: URL, components: URLComponents): URLSecurity => {
  const security: URLSecurity = {
    isSecure: components.isSecure,
    hasCredentials: components.hasCredentials,
    credentialExposure: false,
    suspiciousPatterns: [],
    securityIssues: [],
    riskLevel: "low",
    securityScore: 100,
    recommendations: [],
    phishingIndicators: [],
    malwareIndicators: [],
  }

  // Security assessment
  if (!components.isSecure) {
    security.securityScore -= 30
    security.securityIssues.push("URL uses insecure HTTP protocol")
    security.recommendations.push("Use HTTPS for secure communication")
    security.riskLevel = "medium"
  }

  if (components.hasCredentials) {
    security.securityScore -= 40
    security.credentialExposure = true
    security.securityIssues.push("URL contains credentials in plain text")
    security.recommendations.push("Never include credentials in URLs")
    security.riskLevel = "high"
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    "bit.ly",
    "tinyurl.com",
    "goo.gl",
    "t.co", // URL shorteners
    "phishing",
    "malware",
    "virus",
    "hack",
    "free-download",
    "click-here",
    "urgent",
  ]

  suspiciousPatterns.forEach((pattern) => {
    if (url.toString().toLowerCase().includes(pattern)) {
      security.suspiciousPatterns.push(pattern)
      security.securityScore -= 15
    }
  })

  // Check for phishing indicators
  const phishingPatterns = [
    /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/, // IP addresses
    /[a-z]+-[a-z]+-[a-z]+\.(com|net|org)/, // Suspicious domain patterns
    /secure.*update/,
    /verify.*account/,
    /suspended.*account/,
  ]

  phishingPatterns.forEach((pattern) => {
    if (pattern.test(url.toString().toLowerCase())) {
      security.phishingIndicators.push(pattern.toString())
      security.securityScore -= 25
      security.riskLevel = "high"
    }
  })

  if (security.suspiciousPatterns.length > 0) {
    security.riskLevel = security.riskLevel === "high" ? "high" : "medium"
  }

  return security
}

const analyzeURLSEO = (url: URL, components: URLComponents): URLSEOAnalysis => {
  const seo: URLSEOAnalysis = {
    isSearchEngineFriendly: true,
    hasReadableStructure: true,
    hasKeywords: false,
    pathStructureScore: 100,
    readabilityScore: 100,
    lengthScore: 100,
    issues: [],
    recommendations: [],
    keywords: [],
    stopWords: [],
  }

  // Length assessment
  if (url.toString().length > 100) {
    seo.lengthScore -= 20
    seo.issues.push("URL is longer than recommended for SEO (>100 characters)")
    seo.recommendations.push("Keep URLs under 100 characters for better SEO")
  }

  // Path structure assessment
  if (components.pathSegments.some((segment) => segment.includes("_"))) {
    seo.pathStructureScore -= 15
    seo.issues.push("URL uses underscores instead of hyphens")
    seo.recommendations.push("Use hyphens instead of underscores for better SEO")
  }

  if (components.pathSegments.some((segment) => /[A-Z]/.test(segment))) {
    seo.pathStructureScore -= 10
    seo.issues.push("URL contains uppercase characters")
    seo.recommendations.push("Use lowercase URLs for consistency")
  }

  // Readability assessment
  const pathText = components.pathSegments.join(" ")
  const words = pathText.split(/[-_\s]+/).filter((word) => word.length > 0)

  if (words.length === 0) {
    seo.readabilityScore -= 30
    seo.issues.push("URL path is not descriptive")
    seo.recommendations.push("Use descriptive words in URL paths")
  }

  // Extract potential keywords
  const commonWords = ["the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"]
  words.forEach((word) => {
    if (word.length > 2 && !commonWords.includes(word.toLowerCase())) {
      seo.keywords.push(word.toLowerCase())
    } else if (commonWords.includes(word.toLowerCase())) {
      seo.stopWords.push(word.toLowerCase())
    }
  })

  seo.hasKeywords = seo.keywords.length > 0

  if (!seo.hasKeywords) {
    seo.readabilityScore -= 20
    seo.recommendations.push("Include relevant keywords in the URL path")
  }

  return seo
}

// URL templates
const urlTemplates: URLTemplate[] = [
  {
    id: "basic-websites",
    name: "Basic Websites",
    description: "Analysis of common website URL structures",
    category: "Website",
    urls: ["https://example.com", "https://www.google.com", "https://github.com/user/repo"],
    analysisTypes: ["structure", "security", "seo"],
    useCase: ["Website analysis", "URL structure review", "SEO optimization"],
    examples: ["Homepage URLs", "Subdomain structures", "Path hierarchies"],
  },
  {
    id: "api-endpoints",
    name: "API Endpoints",
    description: "Analysis of REST API URL patterns",
    category: "API",
    urls: [
      "https://api.example.com/v1/users",
      "https://jsonplaceholder.typicode.com/posts/1",
      "https://api.github.com/repos/owner/repo",
    ],
    analysisTypes: ["structure", "security"],
    useCase: ["API design review", "Endpoint analysis", "Version management"],
    examples: ["RESTful endpoints", "Versioned APIs", "Resource paths"],
  },
  {
    id: "ecommerce-urls",
    name: "E-commerce URLs",
    description: "Analysis of e-commerce URL structures",
    category: "E-commerce",
    urls: [
      "https://shop.example.com/products/category/item-name",
      "https://amazon.com/dp/B08N5WRWNW",
      "https://store.com/cart?item=123&qty=2",
    ],
    analysisTypes: ["structure", "seo", "usability"],
    useCase: ["Product page optimization", "Category structure", "Shopping cart analysis"],
    examples: ["Product URLs", "Category pages", "Shopping cart links"],
  },
  {
    id: "social-media",
    name: "Social Media URLs",
    description: "Analysis of social media platform URLs",
    category: "Social",
    urls: [
      "https://twitter.com/username/status/1234567890",
      "https://facebook.com/page/posts/123",
      "https://linkedin.com/in/username",
    ],
    analysisTypes: ["structure", "security"],
    useCase: ["Social media analysis", "Profile verification", "Content linking"],
    examples: ["Profile URLs", "Post links", "Share URLs"],
  },
  {
    id: "security-analysis",
    name: "Security Analysis",
    description: "URLs with potential security concerns",
    category: "Security",
    urls: ["http://insecure.example.com", "https://user:pass@example.com/login", "https://bit.ly/suspicious-link"],
    analysisTypes: ["security", "compliance"],
    useCase: ["Security assessment", "Vulnerability detection", "Risk analysis"],
    examples: ["Insecure protocols", "Credential exposure", "Suspicious patterns"],
  },
  {
    id: "seo-optimization",
    name: "SEO Optimization",
    description: "URLs optimized for search engines",
    category: "SEO",
    urls: [
      "https://blog.example.com/how-to-optimize-urls-for-seo",
      "https://site.com/products/blue-widgets",
      "https://news.com/2023/12/breaking-news-title",
    ],
    analysisTypes: ["seo", "structure"],
    useCase: ["SEO analysis", "Content optimization", "Search ranking"],
    examples: ["SEO-friendly URLs", "Keyword-rich paths", "Date-based structures"],
  },
]

// Validation functions
const validateURL = (urlString: string): URLValidation => {
  const validation: URLValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!urlString || urlString.trim().length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: "URL cannot be empty",
      type: "format",
      severity: "error",
    })
    return validation
  }

  const trimmedUrl = urlString.trim()

  // Check for basic URL format
  try {
    const url = new URL(trimmedUrl)
    validation.urlType = "absolute"

    // Protocol validation
    if (!["http:", "https:", "ftp:", "ftps:"].includes(url.protocol)) {
      validation.warnings.push(`Uncommon protocol: ${url.protocol}`)
    }

    // Security warnings
    if (url.protocol === "http:") {
      validation.warnings.push("URL uses insecure HTTP protocol")
      validation.suggestions.push("Consider using HTTPS for better security")
    }

    if (url.username || url.password) {
      validation.errors.push({
        message: "URL contains credentials",
        type: "security",
        severity: "error",
      })
      validation.suggestions.push("Remove credentials from URL for security")
    }

    // Length validation
    if (trimmedUrl.length > 2000) {
      validation.warnings.push("URL is very long (>2000 characters)")
      validation.suggestions.push("Consider shortening the URL")
    }

    return validation
  } catch (error) {
    // Try relative URL patterns
    if (trimmedUrl.startsWith("/")) {
      validation.urlType = "relative"
      validation.warnings.push("Relative URL detected")
      validation.suggestions.push("Add protocol and domain for complete URL")
      return validation
    }

    if (trimmedUrl.startsWith("//")) {
      validation.urlType = "protocol-relative"
      validation.warnings.push("Protocol-relative URL detected")
      validation.suggestions.push("Add protocol (http:// or https://) for complete URL")
      return validation
    }

    // Invalid URL
    validation.isValid = false
    validation.urlType = "invalid"
    validation.errors.push({
      message: "Invalid URL format",
      type: "format",
      severity: "error",
    })

    // Provide suggestions
    if (!trimmedUrl.includes("://")) {
      validation.suggestions.push("Add protocol (e.g., https://) to the beginning")
    }

    if (trimmedUrl.includes(" ")) {
      validation.suggestions.push("Remove spaces from URL")
    }

    validation.suggestions.push("Check URL format: protocol://domain/path?query#fragment")

    return validation
  }
}

// Custom hooks
const useURLParser = () => {
  const parseURLString = useCallback(async (urlString: string): Promise<URLParseResult> => {
    const startTime = window.performance.now()

    try {
      const { components, analysis, security, seo } = parseURL(urlString)

      const endTime = window.performance.now()
      const processingTime = endTime - startTime

      // Calculate statistics
      const statistics: URLStatistics = {
        urlLength: urlString.length,
        pathLength: components.pathname.length,
        queryLength: components.search.length,
        fragmentLength: components.hash.length,
        parameterCount: components.searchParams.length,
        pathSegmentCount: components.pathSegments.length,
        processingTime,
        complexityScore: calculateComplexityScore(components),
        readabilityIndex: calculateReadabilityIndex(components),
      }

      return {
        id: nanoid(),
        url: urlString,
        isValid: true,
        components,
        analysis,
        security,
        seo,
        statistics,
        createdAt: new Date(),
      }
    } catch (error) {
      const endTime = performance.now()
      const processingTime = endTime - startTime

      return {
        id: nanoid(),
        url: urlString,
        isValid: false,
        error: error instanceof Error ? error.message : "URL parsing failed",
        statistics: {
          urlLength: urlString.length,
          pathLength: 0,
          queryLength: 0,
          fragmentLength: 0,
          parameterCount: 0,
          pathSegmentCount: 0,
          processingTime,
          complexityScore: 0,
          readabilityIndex: 0,
        },
        createdAt: new Date(),
      }
    }
  }, [])

  const processBatch = useCallback(
    async (urls: string[], settings: ProcessingSettings): Promise<ProcessingBatch> => {
      try {
        const results: URLParseResult[] = []

        // Process URLs sequentially
        for (const url of urls) {
          try {
            const result = await parseURLString(url)
            results.push(result)
          } catch (error) {
            console.error(`Failed to process URL ${url}:`, error)
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
        const averageSEO =
          results.length > 0
            ? results.reduce((sum, result) => sum + (result.seo?.lengthScore || 0), 0) / results.length
            : 0

        // Aggregate statistics
        const protocolDistribution: Record<string, number> = {}
        const domainDistribution: Record<string, number> = {}
        const securityDistribution: Record<string, number> = {}

        results.forEach((result) => {
          if (result.isValid && result.components) {
            // Protocol distribution
            const protocol = result.components.protocol
            protocolDistribution[protocol] = (protocolDistribution[protocol] || 0) + 1

            // Domain distribution
            const domain = result.components.domain
            domainDistribution[domain] = (domainDistribution[domain] || 0) + 1

            // Security distribution
            if (result.security) {
              const level = result.security.riskLevel
              securityDistribution[level] = (securityDistribution[level] || 0) + 1
            }
          }
        })

        const statistics: BatchStatistics = {
          totalProcessed: results.length,
          validCount,
          invalidCount,
          averageQuality,
          averageSecurity,
          averageSEO,
          successRate: (validCount / results.length) * 100,
          protocolDistribution,
          domainDistribution,
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
    [parseURLString]
  )

  return { parseURLString, processBatch }
}

// Helper functions for statistics
const calculateComplexityScore = (components: URLComponents): number => {
  let score = 0
  score += components.pathSegments.length * 10
  score += components.searchParams.length * 5
  score += components.hash ? 5 : 0
  score += components.hasCredentials ? 20 : 0
  return Math.min(score, 100)
}

const calculateReadabilityIndex = (components: URLComponents): number => {
  const pathText = components.pathSegments.join(" ")
  const words = pathText.split(/[-_\s]+/).filter((word) => word.length > 0)
  const avgWordLength = words.length > 0 ? words.reduce((sum, word) => sum + word.length, 0) / words.length : 0

  // Higher score for shorter, more readable words
  return Math.max(0, 100 - avgWordLength * 10 - components.pathSegments.length * 5)
}

// Real-time validation hook
const useRealTimeValidation = (url: string) => {
  return useMemo(() => {
    if (!url.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = validateURL(url)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
      urlType: validation.urlType,
    }
  }, [url])
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
const useURLExport = () => {
  const exportResults = useCallback((results: URLParseResult[], format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "json":
        const jsonData = results.map((result) => ({
          id: result.id,
          url: result.url,
          isValid: result.isValid,
          error: result.error,
          components: result.components,
          analysis: result.analysis,
          security: result.security,
          seo: result.seo,
          statistics: result.statistics,
          createdAt: result.createdAt,
        }))
        content = JSON.stringify(jsonData, null, 2)
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        const csvHeaders = [
          "URL",
          "Valid",
          "Protocol",
          "Domain",
          "Path",
          "Query Params",
          "Security Score",
          "SEO Score",
          "Quality Score",
          "Processing Time",
        ]
        const csvRows: string[] = []
        results.forEach((result) => {
          csvRows.push(
            [
              result.url,
              result.isValid ? "Yes" : "No",
              result.components?.protocol || "",
              result.components?.domain || "",
              result.components?.pathname || "",
              result.components?.searchParams.length.toString() || "0",
              result.security?.securityScore?.toString() || "",
              result.seo?.lengthScore?.toString() || "",
              result.analysis?.qualityScore?.toString() || "",
              result.statistics.processingTime.toFixed(2),
            ]
              .map((field) => `"${field.replace(/"/g, '""')}"`)
              .join(",")
          )
        })
        content = [csvHeaders.join(","), ...csvRows].join("\n")
        mimeType = "text/csv"
        extension = ".csv"
        break
      case "xml":
        const xmlData = results
          .map(
            (result) => `
  <urlParse>
    <url><![CDATA[${result.url}]]></url>
    <valid>${result.isValid}</valid>
    <components>
      <protocol>${result.components?.protocol || ""}</protocol>
      <hostname>${result.components?.hostname || ""}</hostname>
      <pathname>${result.components?.pathname || ""}</pathname>
      <search>${result.components?.search || ""}</search>
      <hash>${result.components?.hash || ""}</hash>
    </components>
    <analysis>
      <qualityScore>${result.analysis?.qualityScore || 0}</qualityScore>
      <securityScore>${result.security?.securityScore || 0}</securityScore>
      <seoScore>${result.seo?.lengthScore || 0}</seoScore>
    </analysis>
  </urlParse>`
          )
          .join("")
        content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlParseResults>${xmlData}\n</urlParseResults>`
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
    link.download = filename || `url-parse-results${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResults }
}

// Generate text report from results
const generateTextFromResults = (results: URLParseResult[]): string => {
  return `URL Parse Results
================

Generated: ${new Date().toLocaleString()}
Total URLs: ${results.length}
Valid URLs: ${results.filter((result) => result.isValid).length}
Invalid URLs: ${results.filter((result) => !result.isValid).length}

URL Analysis Results:
${results
  .map((result, i) => {
    return `${i + 1}. URL: ${result.url}
   Status: ${result.isValid ? "Valid" : "Invalid"}
   ${result.error ? `Error: ${result.error}` : ""}
   Processing Time: ${result.statistics.processingTime.toFixed(2)}ms

   ${
     result.components
       ? `Components:
   - Protocol: ${result.components.protocol}
   - Hostname: ${result.components.hostname}
   - Port: ${result.components.port || "default"}
   - Path: ${result.components.pathname}
   - Query: ${result.components.search}
   - Fragment: ${result.components.hash}
   - Parameters: ${result.components.searchParams.length}
   `
       : "No component data"
   }

   ${
     result.analysis
       ? `Analysis:
   - Quality Score: ${result.analysis.qualityScore}/100
   - URL Type: ${result.analysis.urlType}
   - Path Depth: ${result.analysis.pathDepth}
   - Query Params: ${result.analysis.queryParamCount}
   `
       : "No analysis data"
   }

   ${
     result.security
       ? `Security:
   - Security Score: ${result.security.securityScore}/100
   - Risk Level: ${result.security.riskLevel}
   - Is Secure: ${result.security.isSecure ? "Yes" : "No"}
   - Has Credentials: ${result.security.hasCredentials ? "Yes" : "No"}
   `
       : "No security data"
   }

   ${
     result.seo
       ? `SEO:
   - Length Score: ${result.seo.lengthScore}/100
   - Readability Score: ${result.seo.readabilityScore}/100
   - SEO Friendly: ${result.seo.isSearchEngineFriendly ? "Yes" : "No"}
   - Keywords: ${result.seo.keywords.join(", ") || "None"}
   `
       : "No SEO data"
   }
`
  })
  .join("\n")}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Average Quality Score: ${(results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length).toFixed(1)}
- Average Security Score: ${(results.reduce((sum, result) => sum + (result.security?.securityScore || 0), 0) / results.length).toFixed(1)}
- Average Processing Time: ${(results.reduce((sum, result) => sum + result.statistics.processingTime, 0) / results.length).toFixed(2)}ms
`
}

/**
 * Enhanced URL Parser & Analysis Tool
 * Features: Advanced URL parsing, security analysis, SEO optimization, compliance checking
 */
const URLParserCore = () => {
  const [activeTab, setActiveTab] = useState<"parser" | "batch" | "analyzer" | "templates">("parser")
  const [url, setURL] = useState("")
  const [currentResult, setCurrentResult] = useState<URLParseResult | null>(null)
  const [batches, setBatches] = useState<ProcessingBatch[]>([])
  const [batchInput, setBatchInput] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [settings, setSettings] = useState<ProcessingSettings>({
    includeSecurityAnalysis: true,
    includeSEOAnalysis: true,
    includeCompliance: true,
    validateDomains: true,
    checkSuspiciousPatterns: true,
    exportFormat: "json",
    realTimeValidation: true,
    maxResults: 100,
    strictMode: false,
  })

  const { parseURLString, processBatch } = useURLParser()
  const { exportResults } = useURLExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const urlValidation = useRealTimeValidation(url)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = urlTemplates.find((t) => t.id === templateId)
    if (template) {
      setURL(template.urls[0])
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single parse
  const handleParse = useCallback(async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL")
      return
    }

    if (!urlValidation.isValid && settings.strictMode) {
      toast.error("Please enter a valid URL")
      return
    }

    setIsProcessing(true)
    try {
      const result = await parseURLString(url)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success(`URL parsed successfully`)
      } else {
        toast.error(result.error || "URL parsing failed")
      }
    } catch (error) {
      toast.error("Failed to parse URL")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [url, settings, parseURLString, urlValidation.isValid])

  // Handle batch processing
  const handleProcessBatch = useCallback(async () => {
    const urls = batchInput
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.trim())

    if (urls.length === 0) {
      toast.error("Please enter URLs to parse")
      return
    }

    setIsProcessing(true)
    try {
      const batch = await processBatch(urls, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Processed ${batch.results.length} URLs`)
    } catch (error) {
      toast.error("Failed to process batch")
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

      <div
        id="main-content"
        className="flex flex-col gap-4"
      >
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              URL Parser & Analysis Tool
            </CardTitle>
            <CardDescription>
              Advanced URL parsing tool with comprehensive analysis, security assessment, and SEO optimization. Parse
              URLs to extract components, analyze structure, check security, and optimize for search engines. Use
              keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "parser" | "batch" | "analyzer" | "templates")}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="parser"
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              URL Parser
            </TabsTrigger>
            <TabsTrigger
              value="batch"
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Batch Parser
            </TabsTrigger>
            <TabsTrigger
              value="analyzer"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              URL Analyzer
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* URL Parser Tab */}
          <TabsContent
            value="parser"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Parser Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    URL Parser
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="url-input"
                      className="text-sm font-medium"
                    >
                      URL
                    </Label>
                    <Input
                      id="url-input"
                      value={url}
                      onChange={(e) => setURL(e.target.value)}
                      placeholder="Enter URL (e.g., https://example.com/path?param=value#section)"
                      className="mt-2"
                    />
                    {url && (
                      <div className="mt-2 text-sm">
                        {urlValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid {urlValidation.urlType} URL
                          </div>
                        ) : urlValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {urlValidation.error}
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
                          id="include-seo"
                          type="checkbox"
                          checked={settings.includeSEOAnalysis}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeSEOAnalysis: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="include-seo"
                          className="text-xs"
                        >
                          Include SEO analysis
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-compliance"
                          type="checkbox"
                          checked={settings.includeCompliance}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeCompliance: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="include-compliance"
                          className="text-xs"
                        >
                          Include compliance checking
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="strict-mode"
                          type="checkbox"
                          checked={settings.strictMode}
                          onChange={(e) => setSettings((prev) => ({ ...prev, strictMode: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="strict-mode"
                          className="text-xs"
                        >
                          Strict validation mode
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="check-suspicious"
                          type="checkbox"
                          checked={settings.checkSuspiciousPatterns}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, checkSuspiciousPatterns: e.target.checked }))
                          }
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="check-suspicious"
                          className="text-xs"
                        >
                          Check for suspicious patterns
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleParse}
                      disabled={!url.trim() || isProcessing || (settings.strictMode && !urlValidation.isValid)}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Parse URL
                    </Button>
                    <Button
                      onClick={() => {
                        setURL("")
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {urlValidation.warnings && urlValidation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Warnings:</h4>
                      <div className="text-xs space-y-1">
                        {urlValidation.warnings.map((warning, index) => (
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

                  {urlValidation.suggestions && urlValidation.suggestions.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-blue-800">Suggestions:</h4>
                      <div className="text-xs space-y-1">
                        {urlValidation.suggestions.map((suggestion, index) => (
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

              {/* Parser Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    URL Components
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
                        <div className="text-sm font-medium mb-2">URL: {currentResult.url}</div>
                        <div className="text-sm">
                          <div>
                            <strong>Status:</strong> {currentResult.isValid ? "Valid" : "Invalid"}
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

                      {currentResult.isValid && currentResult.components ? (
                        <div className="space-y-4">
                          {/* URL Components */}
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-lg flex items-center gap-2">
                                <Link className="h-5 w-5" />
                                URL Components
                              </h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(currentResult.url, "URL")}
                              >
                                {copiedText === "URL" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Lock className="h-4 w-4" />
                                  <strong>Protocol:</strong>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      currentResult.components.isSecure
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {currentResult.components.protocol}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <strong>Hostname:</strong>{" "}
                                  <span className="font-mono">{currentResult.components.hostname}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Server className="h-4 w-4" />
                                  <strong>Port:</strong> {currentResult.components.port || "default"}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Navigation className="h-4 w-4" />
                                  <strong>Origin:</strong>{" "}
                                  <span className="font-mono">{currentResult.components.origin}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-4 w-4" />
                                  <strong>Path:</strong>{" "}
                                  <span className="font-mono">{currentResult.components.pathname || "/"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Search className="h-4 w-4" />
                                  <strong>Query:</strong>{" "}
                                  <span className="font-mono">{currentResult.components.search || "none"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Hash className="h-4 w-4" />
                                  <strong>Fragment:</strong>{" "}
                                  <span className="font-mono">{currentResult.components.hash || "none"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  <strong>Domain:</strong>{" "}
                                  <span className="font-mono">{currentResult.components.domain}</span>
                                </div>
                              </div>
                            </div>

                            {currentResult.components.username && (
                              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="text-red-800 text-sm">
                                  <strong>⚠️ Security Warning:</strong> URL contains credentials
                                  <div className="mt-1 text-xs">
                                    Username: {currentResult.components.username}
                                    {currentResult.components.password && " • Password: [HIDDEN]"}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Path Segments */}
                          {currentResult.components.pathSegments.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                                <ArrowRight className="h-5 w-5" />
                                Path Segments ({currentResult.components.pathSegments.length})
                              </h4>
                              <div className="space-y-2">
                                {currentResult.components.pathSegments.map((segment, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <span className="text-muted-foreground">{index + 1}.</span>
                                    <span className="font-mono bg-muted px-2 py-1 rounded">{segment}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(segment, `Segment ${index + 1}`)}
                                    >
                                      {copiedText === `Segment ${index + 1}` ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Query Parameters */}
                          {currentResult.components.searchParams.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Query Parameters ({currentResult.components.searchParams.length})
                              </h4>
                              <div className="space-y-2">
                                {currentResult.components.searchParams.map((param, index) => (
                                  <div
                                    key={index}
                                    className="border rounded p-3"
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <strong>Key:</strong>
                                        <span className="font-mono ml-2 bg-muted px-2 py-1 rounded">{param.key}</span>
                                        {param.encoded && (
                                          <span className="ml-2 text-xs text-orange-600">(encoded)</span>
                                        )}
                                      </div>
                                      <div>
                                        <strong>Value:</strong>
                                        <span className="font-mono ml-2 bg-muted px-2 py-1 rounded">{param.value}</span>
                                      </div>
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(param.key, `Key ${index + 1}`)}
                                      >
                                        {copiedText === `Key ${index + 1}` ? (
                                          <Check className="h-3 w-3" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                        Key
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(param.value, `Value ${index + 1}`)}
                                      >
                                        {copiedText === `Value ${index + 1}` ? (
                                          <Check className="h-3 w-3" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                        Value
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Detailed Analysis */}
                          {showDetailedAnalysis && (
                            <div className="space-y-4">
                              {/* Security Analysis */}
                              {currentResult.security && (
                                <div className="border rounded-lg p-4">
                                  <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Security Analysis
                                  </h4>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                    <div>
                                      <div>
                                        <strong>Security Score:</strong> {currentResult.security.securityScore}/100
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                          className={`h-2 rounded-full ${
                                            currentResult.security.securityScore >= 80
                                              ? "bg-green-500"
                                              : currentResult.security.securityScore >= 60
                                                ? "bg-orange-500"
                                                : "bg-red-500"
                                          }`}
                                          style={{ width: `${currentResult.security.securityScore}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div>
                                      <div>
                                        <strong>Risk Level:</strong>
                                        <span
                                          className={`ml-1 px-2 py-1 rounded text-xs ${
                                            currentResult.security.riskLevel === "high"
                                              ? "bg-red-100 text-red-800"
                                              : currentResult.security.riskLevel === "medium"
                                                ? "bg-orange-100 text-orange-800"
                                                : "bg-green-100 text-green-800"
                                          }`}
                                        >
                                          {currentResult.security.riskLevel}
                                        </span>
                                      </div>
                                    </div>
                                    <div>
                                      <div>
                                        <strong>Secure Protocol:</strong>{" "}
                                        {currentResult.security.isSecure ? "✅ Yes" : "❌ No"}
                                      </div>
                                    </div>
                                    <div>
                                      <div>
                                        <strong>Has Credentials:</strong>{" "}
                                        {currentResult.security.hasCredentials ? "⚠️ Yes" : "✅ No"}
                                      </div>
                                    </div>
                                  </div>

                                  {currentResult.security.securityIssues.length > 0 && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                      <h5 className="font-medium text-sm mb-2 text-red-800">Security Issues</h5>
                                      <ul className="text-sm space-y-1">
                                        {currentResult.security.securityIssues.map((issue, index) => (
                                          <li
                                            key={index}
                                            className="flex items-center gap-2 text-red-700"
                                          >
                                            <AlertCircle className="h-3 w-3" />
                                            {issue}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {currentResult.security.recommendations.length > 0 && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <h5 className="font-medium text-sm mb-2 text-blue-800">
                                        Security Recommendations
                                      </h5>
                                      <ul className="text-sm space-y-1">
                                        {currentResult.security.recommendations.map((rec, index) => (
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
                              )}

                              {/* SEO Analysis */}
                              {currentResult.seo && (
                                <div className="border rounded-lg p-4">
                                  <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                                    <Search className="h-5 w-5" />
                                    SEO Analysis
                                  </h4>

                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                                    <div>
                                      <div>
                                        <strong>Length Score:</strong> {currentResult.seo.lengthScore}/100
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                          className={`h-2 rounded-full ${
                                            currentResult.seo.lengthScore >= 80
                                              ? "bg-green-500"
                                              : currentResult.seo.lengthScore >= 60
                                                ? "bg-orange-500"
                                                : "bg-red-500"
                                          }`}
                                          style={{ width: `${currentResult.seo.lengthScore}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div>
                                      <div>
                                        <strong>Readability Score:</strong> {currentResult.seo.readabilityScore}/100
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                          className={`h-2 rounded-full ${
                                            currentResult.seo.readabilityScore >= 80
                                              ? "bg-green-500"
                                              : currentResult.seo.readabilityScore >= 60
                                                ? "bg-orange-500"
                                                : "bg-red-500"
                                          }`}
                                          style={{ width: `${currentResult.seo.readabilityScore}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div>
                                      <div>
                                        <strong>SEO Friendly:</strong>{" "}
                                        {currentResult.seo.isSearchEngineFriendly ? "✅ Yes" : "❌ No"}
                                      </div>
                                    </div>
                                  </div>

                                  {currentResult.seo.keywords.length > 0 && (
                                    <div className="mb-4">
                                      <h5 className="font-medium text-sm mb-2">Keywords Found</h5>
                                      <div className="flex flex-wrap gap-2">
                                        {currentResult.seo.keywords.map((keyword, index) => (
                                          <span
                                            key={index}
                                            className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                                          >
                                            {keyword}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {currentResult.seo.issues.length > 0 && (
                                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                      <h5 className="font-medium text-sm mb-2 text-orange-800">SEO Issues</h5>
                                      <ul className="text-sm space-y-1">
                                        {currentResult.seo.issues.map((issue, index) => (
                                          <li
                                            key={index}
                                            className="flex items-center gap-2 text-orange-700"
                                          >
                                            <AlertCircle className="h-3 w-3" />
                                            {issue}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {currentResult.seo.recommendations.length > 0 && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <h5 className="font-medium text-sm mb-2 text-blue-800">SEO Recommendations</h5>
                                      <ul className="text-sm space-y-1">
                                        {currentResult.seo.recommendations.map((rec, index) => (
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
                              )}

                              {/* Quality Analysis */}
                              {currentResult.analysis && (
                                <div className="border rounded-lg p-4">
                                  <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Quality Analysis
                                  </h4>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                    <div>
                                      <div>
                                        <strong>Quality Score:</strong> {currentResult.analysis.qualityScore}/100
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                          className={`h-2 rounded-full ${
                                            currentResult.analysis.qualityScore >= 80
                                              ? "bg-green-500"
                                              : currentResult.analysis.qualityScore >= 60
                                                ? "bg-orange-500"
                                                : "bg-red-500"
                                          }`}
                                          style={{ width: `${currentResult.analysis.qualityScore}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div>
                                      <div>
                                        <strong>Usability Score:</strong> {currentResult.analysis.usabilityScore}/100
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                          className={`h-2 rounded-full ${
                                            currentResult.analysis.usabilityScore >= 80
                                              ? "bg-green-500"
                                              : currentResult.analysis.usabilityScore >= 60
                                                ? "bg-orange-500"
                                                : "bg-red-500"
                                          }`}
                                          style={{ width: `${currentResult.analysis.usabilityScore}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div>
                                      <div>
                                        <strong>URL Length:</strong> {currentResult.analysis.urlLength} chars
                                      </div>
                                    </div>
                                    <div>
                                      <div>
                                        <strong>Path Depth:</strong> {currentResult.analysis.pathDepth}
                                      </div>
                                    </div>
                                  </div>

                                  {(currentResult.analysis.issues.length > 0 ||
                                    currentResult.analysis.recommendations.length > 0) && (
                                    <div className="space-y-4">
                                      {currentResult.analysis.issues.length > 0 && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                          <h5 className="font-medium text-sm mb-2 text-red-800">Quality Issues</h5>
                                          <ul className="text-sm space-y-1">
                                            {currentResult.analysis.issues.map((issue, index) => (
                                              <li
                                                key={index}
                                                className="flex items-center gap-2 text-red-700"
                                              >
                                                <AlertCircle className="h-3 w-3" />
                                                {issue}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {currentResult.analysis.recommendations.length > 0 && (
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                          <h5 className="font-medium text-sm mb-2 text-blue-800">
                                            Quality Recommendations
                                          </h5>
                                          <ul className="text-sm space-y-1">
                                            {currentResult.analysis.recommendations.map((rec, index) => (
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
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Statistics */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Parse Statistics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>URL Length:</strong> {currentResult.statistics.urlLength} chars
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Path Segments:</strong> {currentResult.statistics.pathSegmentCount}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Parameters:</strong> {currentResult.statistics.parameterCount}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Processing Time:</strong> {currentResult.statistics.processingTime.toFixed(2)}
                                  ms
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Complexity Score:</strong> {currentResult.statistics.complexityScore}/100
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Readability Index:</strong> {currentResult.statistics.readabilityIndex}/100
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : currentResult.isValid ? (
                        <div className="text-center py-8">
                          <Link className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Components Available</h3>
                          <p className="text-muted-foreground mb-4">URL is valid but component extraction failed.</p>
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
                      <Link className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No URL Parsed</h3>
                      <p className="text-muted-foreground mb-4">Enter a URL to parse and analyze its components</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Parser Tab */}
          <TabsContent
            value="batch"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Batch URL Parser
                </CardTitle>
                <CardDescription>Parse multiple URLs simultaneously (one per line)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="batch-input"
                      className="text-sm font-medium"
                    >
                      URLs (one per line)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder="https://example.com&#10;https://api.example.com/v1/users&#10;https://shop.example.com/products/item?id=123"
                      className="mt-2 min-h-[200px] font-mono text-sm"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">Enter one URL per line</div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleProcessBatch}
                      disabled={!batchInput.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Parse Batch
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
                            <h4 className="font-medium">{batch.count} URLs processed</h4>
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

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium">Valid:</span> {batch.statistics.validCount}
                          </div>
                          <div>
                            <span className="font-medium">Invalid:</span> {batch.statistics.invalidCount}
                          </div>
                          <div>
                            <span className="font-medium">Avg Quality:</span>{" "}
                            {batch.statistics.averageQuality.toFixed(1)}
                          </div>
                          <div>
                            <span className="font-medium">Avg Security:</span>{" "}
                            {batch.statistics.averageSecurity.toFixed(1)}
                          </div>
                        </div>

                        {/* Distribution Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Protocol Distribution</h5>
                            <div className="space-y-1">
                              {Object.entries(batch.statistics.protocolDistribution).map(([protocol, count]) => (
                                <div
                                  key={protocol}
                                  className="flex justify-between text-xs"
                                >
                                  <span>{protocol}:</span>
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
                                      level === "low"
                                        ? "text-green-600"
                                        : level === "medium"
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
                          <div>
                            <h5 className="font-medium text-sm mb-2">Domain Distribution</h5>
                            <div className="space-y-1">
                              {Object.entries(batch.statistics.domainDistribution)
                                .slice(0, 5)
                                .map(([domain, count]) => (
                                  <div
                                    key={domain}
                                    className="flex justify-between text-xs"
                                  >
                                    <span className="truncate">{domain}:</span>
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
                                  <span className="font-mono truncate flex-1 mr-2">{result.url}</span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      result.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {result.isValid ? "Valid" : "Invalid"}
                                  </span>
                                </div>
                                {result.isValid && result.components && (
                                  <div className="text-muted-foreground mt-1">
                                    {result.components.protocol} • {result.components.domain} •
                                    {result.components.pathSegments.length} segments •
                                    {result.components.searchParams.length} params • Quality:{" "}
                                    {result.analysis?.qualityScore || "N/A"}/100 •
                                    {result.statistics.processingTime.toFixed(2)}ms
                                  </div>
                                )}
                                {result.error && <div className="text-red-600 mt-1">{result.error}</div>}
                              </div>
                            ))}
                            {batch.results.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.results.length - 5} more URLs
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

          {/* URL Analyzer Tab */}
          <TabsContent
            value="analyzer"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  URL Security & SEO Analyzer
                </CardTitle>
                <CardDescription>Analyze URL for security and SEO optimization</CardDescription>
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
                            className={`p-3 rounded-lg ${currentResult.security?.isSecure ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                          >
                            <div className="font-medium">Protocol Security</div>
                            <div className={currentResult.security?.isSecure ? "text-green-700" : "text-red-700"}>
                              {currentResult.security?.isSecure ? "Secure (HTTPS)" : "Insecure (HTTP)"}
                            </div>
                          </div>
                          <div
                            className={`p-3 rounded-lg ${currentResult.security?.hasCredentials ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}
                          >
                            <div className="font-medium">Credentials</div>
                            <div className={currentResult.security?.hasCredentials ? "text-red-700" : "text-green-700"}>
                              {currentResult.security?.hasCredentials ? "Exposed" : "Safe"}
                            </div>
                          </div>
                          <div
                            className={`p-3 rounded-lg ${
                              currentResult.security?.riskLevel === "high"
                                ? "bg-red-50 border border-red-200"
                                : currentResult.security?.riskLevel === "medium"
                                  ? "bg-orange-50 border border-orange-200"
                                  : "bg-green-50 border border-green-200"
                            }`}
                          >
                            <div className="font-medium">Risk Level</div>
                            <div
                              className={
                                currentResult.security?.riskLevel === "high"
                                  ? "text-red-700"
                                  : currentResult.security?.riskLevel === "medium"
                                    ? "text-orange-700"
                                    : "text-green-700"
                              }
                            >
                              {currentResult.security?.riskLevel || "Unknown"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="font-medium mb-2">Overall Security Score</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (currentResult.security?.securityScore || 0) >= 80
                                  ? "bg-green-500"
                                  : (currentResult.security?.securityScore || 0) >= 60
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${currentResult.security?.securityScore || 0}%` }}
                            ></div>
                          </div>
                          <div className="text-xs mt-1">{currentResult.security?.securityScore || 0}/100</div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* SEO Overview */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">SEO Overview</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="font-medium">Length Score</div>
                            <div className="text-lg">{currentResult.seo?.lengthScore || 0}/100</div>
                          </div>
                          <div>
                            <div className="font-medium">Readability Score</div>
                            <div className="text-lg">{currentResult.seo?.readabilityScore || 0}/100</div>
                          </div>
                          <div>
                            <div className="font-medium">Keywords Found</div>
                            <div className="text-lg">{currentResult.seo?.keywords.length || 0}</div>
                          </div>
                          <div>
                            <div className="font-medium">SEO Friendly</div>
                            <div className="text-lg">{currentResult.seo?.isSearchEngineFriendly ? "✅" : "❌"}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    {((currentResult.security?.recommendations.length || 0) > 0 ||
                      (currentResult.seo?.recommendations.length || 0) > 0) && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                          {currentResult.security?.recommendations.map((rec, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-blue-50 rounded"
                            >
                              <Shield className="h-4 w-4 text-blue-600" />
                              <span>{rec}</span>
                            </div>
                          ))}
                          {currentResult.seo?.recommendations.map((rec, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-green-50 rounded"
                            >
                              <Search className="h-4 w-4 text-green-600" />
                              <span>{rec}</span>
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
                    <p className="text-muted-foreground">Parse a URL to see security and SEO analysis</p>
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
                  URL Parser Templates
                </CardTitle>
                <CardDescription>Pre-configured URL parsing templates for common scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {urlTemplates.map((template) => (
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
                            <div className="text-xs font-medium mb-1">Analysis Types:</div>
                            <div className="flex flex-wrap gap-1">
                              {template.analysisTypes.map((type, index) => (
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
                            <div className="text-xs font-medium mb-1">Example URLs:</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {template.urls
                                .slice(0, 2)
                                .map((url) => (url.length > 40 ? url.substring(0, 40) + "..." : url))
                                .join(", ")}
                              {template.urls.length > 2 && "..."}
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
                URL Parser Settings
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
                    htmlFor="max-results"
                    className="text-sm font-medium"
                  >
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
                      exportResults(allResults, "txt", "url-parse-report.txt")
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
const UrlParser = () => {
  return <URLParserCore />
}

export default UrlParser
