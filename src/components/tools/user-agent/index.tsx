import { useCallback, useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  FileText,
  BookOpen,
  Search,
  ArrowRight,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Shield,
  Cpu,
  HardDrive,
  Info,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  UserAgentProcessingResult,
  UserAgentMetrics,
  DeviceMetrics,
  BrowserMetrics,
  HardwareInfo,
  BrowserCapability,
  OperatingSystem,
  UserAgentAnalysis,
  ProcessingBatch,
  BatchStatistics,
  ProcessingSettings,
  UserAgentTemplate,
  UserAgentValidation,
  DeviceType,
  ExportFormat,
} from "@/schemas/user-agent.schema"
import { formatFileSize } from "@/lib/utils"
// Utility functions

// User Agent parsing functions
const parseUserAgent = (userAgent: string): UserAgentMetrics => {
  const length = userAgent.length
  const tokens = userAgent.split(/[\s\/\(\);,]+/).filter((token) => token.length > 0)
  const tokenCount = tokens.length

  // Check for valid structure (should contain browser info)
  const hasValidStructure = /Mozilla|Chrome|Safari|Firefox|Edge|Opera/i.test(userAgent)

  // Detect components
  const detectedComponents: string[] = []
  if (/Mozilla/i.test(userAgent)) detectedComponents.push("Mozilla")
  if (/WebKit/i.test(userAgent)) detectedComponents.push("WebKit")
  if (/Gecko/i.test(userAgent)) detectedComponents.push("Gecko")
  if (/Blink/i.test(userAgent)) detectedComponents.push("Blink")
  if (/Trident/i.test(userAgent)) detectedComponents.push("Trident")

  // Security features
  const securityFeatures: string[] = []
  if (/Secure/i.test(userAgent)) securityFeatures.push("Secure Context")
  if (/HTTPS/i.test(userAgent)) securityFeatures.push("HTTPS Support")

  // Privacy features
  const privacyFeatures: string[] = []
  if (/DoNotTrack/i.test(userAgent)) privacyFeatures.push("Do Not Track")
  if (/Privacy/i.test(userAgent)) privacyFeatures.push("Privacy Mode")

  return {
    length,
    tokenCount,
    hasValidStructure,
    detectedComponents,
    securityFeatures,
    privacyFeatures,
  }
}

const detectDevice = (userAgent: string): DeviceMetrics => {
  let deviceType: DeviceType = "unknown"
  let touchSupport = false
  const mobileFeatures: string[] = []

  // Device type detection
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(userAgent)) {
    if (/iPad|Tablet/i.test(userAgent)) {
      deviceType = "tablet"
    } else {
      deviceType = "mobile"
    }
    touchSupport = true
  } else if (/TV|Television|SmartTV|BRAVIA/i.test(userAgent)) {
    deviceType = "tv"
  } else if (/PlayStation|Xbox|Nintendo/i.test(userAgent)) {
    deviceType = "console"
  } else if (/bot|crawler|spider|scraper/i.test(userAgent)) {
    deviceType = "bot"
  } else {
    deviceType = "desktop"
  }

  // Mobile features
  if (deviceType === "mobile" || deviceType === "tablet") {
    if (/Touch/i.test(userAgent)) mobileFeatures.push("Touch Support")
    if (/GPS/i.test(userAgent)) mobileFeatures.push("GPS")
    if (/Camera/i.test(userAgent)) mobileFeatures.push("Camera")
    if (/Accelerometer/i.test(userAgent)) mobileFeatures.push("Accelerometer")
  }

  // Operating system detection
  const operatingSystem = detectOperatingSystem(userAgent)

  // Architecture detection
  let architecture = "unknown"
  if (/x64|x86_64|amd64/i.test(userAgent)) architecture = "x64"
  else if (/x86|i386|i686/i.test(userAgent)) architecture = "x86"
  else if (/arm64|aarch64/i.test(userAgent)) architecture = "ARM64"
  else if (/arm/i.test(userAgent)) architecture = "ARM"

  // Hardware info
  const hardwareInfo = detectHardwareInfo(userAgent)

  return {
    deviceType,
    operatingSystem,
    architecture,
    touchSupport,
    mobileFeatures,
    hardwareInfo,
  }
}

const detectOperatingSystem = (userAgent: string): OperatingSystem => {
  let name = "Unknown"
  let version = "Unknown"
  let family = "Unknown"
  let architecture: string | undefined

  // Windows
  if (/Windows NT/i.test(userAgent)) {
    name = "Windows"
    family = "Windows"
    const winMatch = userAgent.match(/Windows NT ([\d.]+)/i)
    if (winMatch) {
      const ntVersion = winMatch[1]
      switch (ntVersion) {
        case "10.0":
          version = "10/11"
          break
        case "6.3":
          version = "8.1"
          break
        case "6.2":
          version = "8"
          break
        case "6.1":
          version = "7"
          break
        case "6.0":
          version = "Vista"
          break
        default:
          version = ntVersion
      }
    }
    if (/WOW64|Win64|x64/i.test(userAgent)) architecture = "x64"
    else architecture = "x86"
  }
  // macOS
  else if (/Mac OS X|macOS/i.test(userAgent)) {
    name = "macOS"
    family = "macOS"
    const macMatch = userAgent.match(/Mac OS X ([\d_]+)/i)
    if (macMatch) {
      version = macMatch[1].replace(/_/g, ".")
    }
    architecture = /Intel/i.test(userAgent) ? "Intel" : "Apple Silicon"
  }
  // Linux
  else if (/Linux/i.test(userAgent)) {
    name = "Linux"
    family = "Linux"
    if (/Ubuntu/i.test(userAgent)) name = "Ubuntu"
    else if (/Debian/i.test(userAgent)) name = "Debian"
    else if (/Red Hat|RHEL/i.test(userAgent)) name = "Red Hat"
    else if (/CentOS/i.test(userAgent)) name = "CentOS"

    if (/x86_64/i.test(userAgent)) architecture = "x64"
    else if (/i686/i.test(userAgent)) architecture = "x86"
    else if (/armv/i.test(userAgent)) architecture = "ARM"
  }
  // Android
  else if (/Android/i.test(userAgent)) {
    name = "Android"
    family = "Android"
    const androidMatch = userAgent.match(/Android ([\d.]+)/i)
    if (androidMatch) version = androidMatch[1]
    architecture = /arm64|aarch64/i.test(userAgent) ? "ARM64" : "ARM"
  }
  // iOS
  else if (/iPhone OS|iOS/i.test(userAgent)) {
    name = "iOS"
    family = "iOS"
    const iosMatch = userAgent.match(/OS ([\d_]+)/i)
    if (iosMatch) version = iosMatch[1].replace(/_/g, ".")
    architecture = "ARM64"
  }

  return { name, version, family, architecture }
}

const detectHardwareInfo = (userAgent: string): HardwareInfo => {
  let platform = "Unknown"
  let vendor: string | undefined
  let model: string | undefined

  // Platform detection
  if (/Win/i.test(userAgent)) platform = "Windows"
  else if (/Mac/i.test(userAgent)) platform = "Macintosh"
  else if (/Linux/i.test(userAgent)) platform = "Linux"
  else if (/Android/i.test(userAgent)) platform = "Android"
  else if (/iPhone|iPad/i.test(userAgent)) platform = "iOS"

  // Vendor detection
  if (/Apple/i.test(userAgent)) vendor = "Apple"
  else if (/Samsung/i.test(userAgent)) vendor = "Samsung"
  else if (/Google/i.test(userAgent)) vendor = "Google"
  else if (/Microsoft/i.test(userAgent)) vendor = "Microsoft"

  // Model detection (for mobile devices)
  const modelMatch = userAgent.match(/(iPhone|iPad|iPod|Galaxy|Pixel|Nexus)\s*([^;)]+)/i)
  if (modelMatch) {
    model = modelMatch[0].trim()
  }

  return { platform, vendor, model }
}

const detectBrowser = (userAgent: string): BrowserMetrics => {
  let browserName = "Unknown"
  let browserVersion = "Unknown"
  let engineName = "Unknown"
  let engineVersion = "Unknown"
  const features: string[] = []
  const capabilities: BrowserCapability[] = []
  const securityFeatures: string[] = []
  const modernFeatures: string[] = []

  // Browser detection
  if (/Chrome/i.test(userAgent) && !/Edge|Edg/i.test(userAgent)) {
    browserName = "Chrome"
    const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/i)
    if (chromeMatch) browserVersion = chromeMatch[1]
    engineName = "Blink"
  } else if (/Firefox/i.test(userAgent)) {
    browserName = "Firefox"
    const firefoxMatch = userAgent.match(/Firefox\/([\d.]+)/i)
    if (firefoxMatch) browserVersion = firefoxMatch[1]
    engineName = "Gecko"
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    browserName = "Safari"
    const safariMatch = userAgent.match(/Version\/([\d.]+)/i)
    if (safariMatch) browserVersion = safariMatch[1]
    engineName = "WebKit"
  } else if (/Edge|Edg/i.test(userAgent)) {
    browserName = "Edge"
    const edgeMatch = userAgent.match(/Edg?\/([\d.]+)/i)
    if (edgeMatch) browserVersion = edgeMatch[1]
    engineName = "Blink"
  } else if (/Opera|OPR/i.test(userAgent)) {
    browserName = "Opera"
    const operaMatch = userAgent.match(/(?:Opera|OPR)\/([\d.]+)/i)
    if (operaMatch) browserVersion = operaMatch[1]
    engineName = "Blink"
  }

  // Engine version detection
  if (engineName === "Blink" || engineName === "WebKit") {
    const webkitMatch = userAgent.match(/WebKit\/([\d.]+)/i)
    if (webkitMatch) engineVersion = webkitMatch[1]
  } else if (engineName === "Gecko") {
    const geckoMatch = userAgent.match(/Gecko\/([\d]+)/i)
    if (geckoMatch) engineVersion = geckoMatch[1]
  }

  // Features detection
  if (/Mobile/i.test(userAgent)) features.push("Mobile")
  if (/Tablet/i.test(userAgent)) features.push("Tablet")
  if (/WebGL/i.test(userAgent)) features.push("WebGL")
  if (/WebRTC/i.test(userAgent)) features.push("WebRTC")

  // Security features
  if (/Secure/i.test(userAgent)) securityFeatures.push("Secure Context")
  if (browserName === "Chrome" || browserName === "Firefox" || browserName === "Edge") {
    securityFeatures.push("Content Security Policy")
    securityFeatures.push("HTTPS Enforcement")
  }

  // Modern features (based on browser and version)
  const majorVersion = parseInt(browserVersion.split(".")[0])
  if (browserName === "Chrome" && majorVersion >= 80) {
    modernFeatures.push("ES2020 Support", "WebAssembly", "Service Workers")
  } else if (browserName === "Firefox" && majorVersion >= 75) {
    modernFeatures.push("ES2020 Support", "WebAssembly", "Service Workers")
  } else if (browserName === "Safari" && majorVersion >= 13) {
    modernFeatures.push("ES2019 Support", "WebAssembly")
  }

  return {
    browserName,
    browserVersion,
    engineName,
    engineVersion,
    features,
    capabilities,
    securityFeatures,
    modernFeatures,
  }
}

// Analysis functions
const performUserAgentAnalysis = (
  userAgent: string,
  metrics: UserAgentMetrics,
  device: DeviceMetrics,
  browser: BrowserMetrics
): UserAgentAnalysis => {
  const analysis: UserAgentAnalysis = {
    isValidUserAgent: true,
    hasModernStructure: false,
    isBot: false,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    privacyLevel: "medium",
    securityRisk: "low",
    suggestedImprovements: [],
    userAgentIssues: [],
    qualityScore: 100,
    compatibilityIssues: [],
    modernityScore: 50,
  }

  // Basic validation
  if (!userAgent || userAgent.length < 10) {
    analysis.isValidUserAgent = false
    analysis.userAgentIssues.push("User agent string is too short or empty")
    analysis.qualityScore -= 50
  }

  if (!metrics.hasValidStructure) {
    analysis.userAgentIssues.push("User agent lacks standard browser identification")
    analysis.qualityScore -= 30
  }

  // Device type analysis
  analysis.isMobile = device.deviceType === "mobile"
  analysis.isTablet = device.deviceType === "tablet"
  analysis.isDesktop = device.deviceType === "desktop"
  analysis.isBot = device.deviceType === "bot"

  // Modern structure check
  analysis.hasModernStructure =
    metrics.detectedComponents.length > 2 &&
    (metrics.detectedComponents.includes("WebKit") || metrics.detectedComponents.includes("Gecko"))

  if (!analysis.hasModernStructure) {
    analysis.suggestedImprovements.push("Consider using a modern browser engine (WebKit/Gecko)")
    analysis.qualityScore -= 20
  }

  // Privacy level assessment
  if (metrics.privacyFeatures.length > 1) {
    analysis.privacyLevel = "high"
  } else if (metrics.privacyFeatures.length === 1) {
    analysis.privacyLevel = "medium"
  } else {
    analysis.privacyLevel = "low"
    analysis.suggestedImprovements.push("Enable privacy features like Do Not Track")
  }

  // Security risk assessment
  if (browser.securityFeatures.length > 2) {
    analysis.securityRisk = "minimal"
  } else if (browser.securityFeatures.length > 0) {
    analysis.securityRisk = "low"
  } else {
    analysis.securityRisk = "medium"
    analysis.suggestedImprovements.push("Update to a browser with modern security features")
  }

  // Modernity score calculation
  let modernityScore = 0
  if (browser.modernFeatures.length > 0) modernityScore += 40
  if (browser.securityFeatures.length > 0) modernityScore += 30
  if (analysis.hasModernStructure) modernityScore += 20
  if (device.touchSupport && (analysis.isMobile || analysis.isTablet)) modernityScore += 10

  analysis.modernityScore = Math.min(100, modernityScore)

  // Compatibility issues
  const browserVersion = parseInt(browser.browserVersion.split(".")[0])
  if (browser.browserName === "Internet Explorer") {
    analysis.compatibilityIssues.push("Internet Explorer is deprecated and unsupported")
    analysis.qualityScore -= 40
  } else if (browser.browserName === "Chrome" && browserVersion < 70) {
    analysis.compatibilityIssues.push("Chrome version is outdated")
    analysis.qualityScore -= 20
  } else if (browser.browserName === "Firefox" && browserVersion < 65) {
    analysis.compatibilityIssues.push("Firefox version is outdated")
    analysis.qualityScore -= 20
  }

  // Bot detection
  if (analysis.isBot) {
    analysis.suggestedImprovements.push("Bot detected - ensure proper bot identification")
  }

  return analysis
}

// User Agent templates
const userAgentTemplates: UserAgentTemplate[] = [
  {
    id: "chrome-desktop",
    name: "Chrome Desktop (Windows)",
    description: "Latest Chrome browser on Windows desktop",
    category: "Desktop",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    deviceType: "desktop",
    browserName: "Chrome",
    osName: "Windows",
    features: ["Modern Engine", "Security Features", "ES2020 Support"],
    useCase: ["Web Development", "Testing", "General Browsing"],
  },
  {
    id: "firefox-desktop",
    name: "Firefox Desktop (macOS)",
    description: "Latest Firefox browser on macOS",
    category: "Desktop",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/120.0",
    deviceType: "desktop",
    browserName: "Firefox",
    osName: "macOS",
    features: ["Gecko Engine", "Privacy Features", "Open Source"],
    useCase: ["Privacy-focused Browsing", "Development", "Testing"],
  },
  {
    id: "safari-desktop",
    name: "Safari Desktop (macOS)",
    description: "Safari browser on macOS",
    category: "Desktop",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    deviceType: "desktop",
    browserName: "Safari",
    osName: "macOS",
    features: ["WebKit Engine", "Apple Integration", "Energy Efficient"],
    useCase: ["macOS Users", "Apple Ecosystem", "Testing"],
  },
  {
    id: "chrome-mobile",
    name: "Chrome Mobile (Android)",
    description: "Chrome browser on Android mobile device",
    category: "Mobile",
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    deviceType: "mobile",
    browserName: "Chrome",
    osName: "Android",
    features: ["Mobile Optimized", "Touch Support", "Modern Features"],
    useCase: ["Mobile Testing", "Responsive Design", "Mobile Development"],
  },
  {
    id: "safari-mobile",
    name: "Safari Mobile (iOS)",
    description: "Safari browser on iPhone",
    category: "Mobile",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    deviceType: "mobile",
    browserName: "Safari",
    osName: "iOS",
    features: ["iOS Integration", "Touch Optimized", "Apple Features"],
    useCase: ["iOS Testing", "Mobile Development", "Apple Devices"],
  },
  {
    id: "edge-desktop",
    name: "Edge Desktop (Windows)",
    description: "Microsoft Edge browser on Windows",
    category: "Desktop",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    deviceType: "desktop",
    browserName: "Edge",
    osName: "Windows",
    features: ["Chromium Based", "Microsoft Integration", "Enterprise Features"],
    useCase: ["Windows Users", "Enterprise", "Microsoft Ecosystem"],
  },
  {
    id: "googlebot",
    name: "Googlebot",
    description: "Google search engine crawler",
    category: "Bot",
    userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    deviceType: "bot",
    browserName: "Googlebot",
    osName: "Unknown",
    features: ["Web Crawler", "SEO Indexing", "Google Services"],
    useCase: ["SEO Testing", "Bot Detection", "Search Engine Optimization"],
  },
  {
    id: "ipad-safari",
    name: "Safari Tablet (iPad)",
    description: "Safari browser on iPad tablet",
    category: "Tablet",
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    deviceType: "tablet",
    browserName: "Safari",
    osName: "iOS",
    features: ["Tablet Optimized", "Large Screen", "Touch Interface"],
    useCase: ["Tablet Testing", "Responsive Design", "iPad Development"],
  },
]

// Validation functions
const validateUserAgent = (userAgent: string): UserAgentValidation => {
  const validation: UserAgentValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!userAgent || userAgent.trim().length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: "User agent string cannot be empty",
      type: "format",
      severity: "error",
    })
    return validation
  }

  if (userAgent.length < 10) {
    validation.warnings.push("User agent string is unusually short")
    validation.suggestions.push("Ensure the user agent contains proper browser identification")
  }

  if (userAgent.length > 1000) {
    validation.warnings.push("User agent string is unusually long")
    validation.suggestions.push("Consider if all information in the user agent is necessary")
  }

  // Check for basic structure
  if (!/Mozilla/i.test(userAgent)) {
    validation.warnings.push("User agent does not start with Mozilla identifier")
    validation.suggestions.push("Most browsers include Mozilla in their user agent string")
  }

  // Check for suspicious patterns
  if (/script|javascript|eval|alert/i.test(userAgent)) {
    validation.errors.push({
      message: "User agent contains potentially malicious content",
      type: "security",
      severity: "error",
    })
  }

  // Check for common bot patterns
  if (/bot|crawler|spider|scraper/i.test(userAgent)) {
    validation.warnings.push("User agent appears to be from a bot or crawler")
    validation.suggestions.push("Ensure proper bot identification if this is intentional")
  }

  return validation
}

// Custom hooks
const useUserAgentProcessing = () => {
  const processSingle = useCallback((userAgent: string): UserAgentProcessingResult => {
    const startTime = window.performance.now()

    try {
      const userAgentMetrics = parseUserAgent(userAgent)
      const deviceMetrics = detectDevice(userAgent)
      const browserMetrics = detectBrowser(userAgent)
      const analysis = performUserAgentAnalysis(userAgent, userAgentMetrics, deviceMetrics, browserMetrics)

      const endTime = window.performance.now()
      const processingTime = endTime - startTime

      const inputSize = new Blob([userAgent]).size

      return {
        id: nanoid(),
        input: userAgent,
        isValid: true,
        statistics: {
          inputSize,
          processingTime,
          userAgentMetrics,
          deviceMetrics,
          browserMetrics,
        },
        analysis,
        createdAt: new Date(),
      }
    } catch (error) {
      const endTime = performance.now()
      const processingTime = endTime - startTime

      return {
        id: nanoid(),
        input: userAgent,
        isValid: false,
        error: error instanceof Error ? error.message : "Processing failed",
        statistics: {
          inputSize: new Blob([userAgent]).size,
          processingTime,
          userAgentMetrics: {
            length: userAgent.length,
            tokenCount: 0,
            hasValidStructure: false,
            detectedComponents: [],
            securityFeatures: [],
            privacyFeatures: [],
          },
          deviceMetrics: {
            deviceType: "unknown",
            operatingSystem: { name: "Unknown", version: "Unknown", family: "Unknown" },
            architecture: "unknown",
            touchSupport: false,
            mobileFeatures: [],
            hardwareInfo: { platform: "Unknown" },
          },
          browserMetrics: {
            browserName: "Unknown",
            browserVersion: "Unknown",
            engineName: "Unknown",
            engineVersion: "Unknown",
            features: [],
            capabilities: [],
            securityFeatures: [],
            modernFeatures: [],
          },
        },
        createdAt: new Date(),
      }
    }
  }, [])

  const processBatch = useCallback(
    (userAgents: string[], settings: ProcessingSettings): ProcessingBatch => {
      try {
        const results = userAgents.map((ua) => processSingle(ua))

        const validCount = results.filter((result) => result.isValid).length
        const invalidCount = results.length - validCount

        const totalInputSize = results.reduce((sum, result) => sum + result.statistics.inputSize, 0)
        const averageQuality =
          results.length > 0
            ? results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length
            : 0

        // Distribution calculations
        const deviceTypeDistribution: Record<string, number> = {}
        const browserDistribution: Record<string, number> = {}
        const osDistribution: Record<string, number> = {}

        results.forEach((result) => {
          if (result.isValid) {
            const deviceType = result.statistics.deviceMetrics.deviceType
            const browser = result.statistics.browserMetrics.browserName
            const os = result.statistics.deviceMetrics.operatingSystem.name

            deviceTypeDistribution[deviceType] = (deviceTypeDistribution[deviceType] || 0) + 1
            browserDistribution[browser] = (browserDistribution[browser] || 0) + 1
            osDistribution[os] = (osDistribution[os] || 0) + 1
          }
        })

        const statistics: BatchStatistics = {
          totalProcessed: results.length,
          validCount,
          invalidCount,
          averageQuality,
          totalInputSize,
          successRate: (validCount / results.length) * 100,
          deviceTypeDistribution,
          browserDistribution,
          osDistribution,
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
    [processSingle]
  )

  return { processSingle, processBatch }
}

// Real-time validation hook
const useRealTimeValidation = (userAgent: string) => {
  return useMemo(() => {
    if (!userAgent.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = validateUserAgent(userAgent)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
    }
  }, [userAgent])
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
const useUserAgentExport = () => {
  const exportResults = useCallback((results: UserAgentProcessingResult[], format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "json":
        const jsonData = results.map((result) => ({
          id: result.id,
          userAgent: result.input,
          isValid: result.isValid,
          error: result.error,
          device: result.statistics.deviceMetrics,
          browser: result.statistics.browserMetrics,
          analysis: result.analysis,
          createdAt: result.createdAt,
        }))
        content = JSON.stringify(jsonData, null, 2)
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        const csvHeaders = [
          "User Agent",
          "Valid",
          "Device Type",
          "Browser",
          "Browser Version",
          "OS",
          "OS Version",
          "Quality Score",
          "Security Risk",
          "Privacy Level",
        ]
        const csvRows = results.map((result) => [
          `"${result.input.replace(/"/g, '""')}"`,
          result.isValid ? "Yes" : "No",
          result.statistics.deviceMetrics.deviceType,
          result.statistics.browserMetrics.browserName,
          result.statistics.browserMetrics.browserVersion,
          result.statistics.deviceMetrics.operatingSystem.name,
          result.statistics.deviceMetrics.operatingSystem.version,
          result.analysis?.qualityScore?.toFixed(1) || "N/A",
          result.analysis?.securityRisk || "Unknown",
          result.analysis?.privacyLevel || "Unknown",
        ])
        content = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n")
        mimeType = "text/csv"
        extension = ".csv"
        break
      case "xml":
        const xmlData = results
          .map(
            (result) => `
  <userAgent>
    <input><![CDATA[${result.input}]]></input>
    <valid>${result.isValid}</valid>
    <device>
      <type>${result.statistics.deviceMetrics.deviceType}</type>
      <os>${result.statistics.deviceMetrics.operatingSystem.name}</os>
      <osVersion>${result.statistics.deviceMetrics.operatingSystem.version}</osVersion>
    </device>
    <browser>
      <name>${result.statistics.browserMetrics.browserName}</name>
      <version>${result.statistics.browserMetrics.browserVersion}</version>
      <engine>${result.statistics.browserMetrics.engineName}</engine>
    </browser>
    <analysis>
      <qualityScore>${result.analysis?.qualityScore || 0}</qualityScore>
      <securityRisk>${result.analysis?.securityRisk || "unknown"}</securityRisk>
      <privacyLevel>${result.analysis?.privacyLevel || "unknown"}</privacyLevel>
    </analysis>
  </userAgent>`
          )
          .join("")
        content = `<?xml version="1.0" encoding="UTF-8"?>\n<userAgents>${xmlData}\n</userAgents>`
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
    link.download = filename || `user-agent-analysis${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResults }
}

// Generate text report from results
const generateTextFromResults = (results: UserAgentProcessingResult[]): string => {
  return `User Agent Analysis Report
==========================

Generated: ${new Date().toLocaleString()}
Total Results: ${results.length}
Valid Results: ${results.filter((result) => result.isValid).length}
Invalid Results: ${results.filter((result) => !result.isValid).length}

Results:
${results
  .map((result, i) => {
    return `${i + 1}. User Agent Analysis
   Status: ${result.isValid ? "Valid" : "Invalid"}
   ${result.error ? `Error: ${result.error}` : ""}
   User Agent: ${result.input}
   Device Type: ${result.statistics.deviceMetrics.deviceType}
   Browser: ${result.statistics.browserMetrics.browserName} ${result.statistics.browserMetrics.browserVersion}
   Operating System: ${result.statistics.deviceMetrics.operatingSystem.name} ${result.statistics.deviceMetrics.operatingSystem.version}
   Engine: ${result.statistics.browserMetrics.engineName} ${result.statistics.browserMetrics.engineVersion}
   Quality Score: ${result.analysis?.qualityScore?.toFixed(1) || "N/A"}/100
   Security Risk: ${result.analysis?.securityRisk || "Unknown"}
   Privacy Level: ${result.analysis?.privacyLevel || "Unknown"}
   Processing Time: ${result.statistics.processingTime.toFixed(2)}ms
`
  })
  .join("\n")}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Average Quality: ${(results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length).toFixed(1)}
- Total Size: ${formatFileSize(results.reduce((sum, result) => sum + result.statistics.inputSize, 0))}
`
}

/**
 * Enhanced User Agent Analysis Tool
 * Features: Advanced UA parsing, device detection, browser analysis, security assessment
 */
const UserAgentCore = () => {
  const [activeTab, setActiveTab] = useState<"analyzer" | "batch" | "detector" | "templates">("analyzer")
  const [userAgent, setUserAgent] = useState("")
  const [currentResult, setCurrentResult] = useState<UserAgentProcessingResult | null>(null)
  const [batches, setBatches] = useState<ProcessingBatch[]>([])
  const [batchInput, setBatchInput] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [currentUserAgent, setCurrentUserAgent] = useState("")
  const [settings, setSettings] = useState<ProcessingSettings>({
    includeDeviceInfo: true,
    includeBrowserInfo: true,
    includeSecurityAnalysis: true,
    includePrivacyAnalysis: true,
    detectBots: true,
    analyzeCapabilities: true,
    exportFormat: "json",
    realTimeProcessing: true,
    showDetailedAnalysis: false,
  })

  const { processSingle, processBatch } = useUserAgentProcessing()
  const { exportResults } = useUserAgentExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const userAgentValidation = useRealTimeValidation(userAgent)

  // Get current user agent on component mount
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setCurrentUserAgent(navigator.userAgent)
      if (!userAgent) {
        setUserAgent(navigator.userAgent)
      }
    }
  }, [userAgent])

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = userAgentTemplates.find((t) => t.id === templateId)
    if (template) {
      setUserAgent(template.userAgent)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single processing
  const handleProcessSingle = useCallback(async () => {
    if (!userAgent.trim()) {
      toast.error("Please enter a user agent string to analyze")
      return
    }

    setIsProcessing(true)
    try {
      const result = processSingle(userAgent)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success("User agent analyzed successfully")
      } else {
        toast.error(result.error || "Analysis failed")
      }
    } catch (error) {
      toast.error("Failed to analyze user agent")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [userAgent, settings, processSingle])

  // Handle batch processing
  const handleProcessBatch = useCallback(async () => {
    const userAgents = batchInput.split("\n").filter((ua) => ua.trim())

    if (userAgents.length === 0) {
      toast.error("Please enter user agent strings to analyze")
      return
    }

    setIsProcessing(true)
    try {
      const batch = processBatch(userAgents, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Analyzed ${batch.results.length} user agent strings`)
    } catch (error) {
      toast.error("Failed to process batch")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, settings, processBatch])

  // Auto-process when real-time processing is enabled
  useEffect(() => {
    if (settings.realTimeProcessing && userAgent.trim() && userAgentValidation.isValid) {
      const timer = setTimeout(() => {
        handleProcessSingle()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [userAgent, userAgentValidation.isValid, settings.realTimeProcessing, handleProcessSingle])

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
              <Globe className="h-5 w-5" />
              User Agent Analysis Tool
            </CardTitle>
            <CardDescription>
              Advanced user agent string parser and analyzer with device detection, browser identification, security
              assessment, and compatibility analysis. Parse user agent strings to extract detailed information about
              browsers, devices, and operating systems. Use keyboard navigation: Tab to move between controls, Enter or
              Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "analyzer" | "batch" | "detector" | "templates")}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="analyzer"
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              UA Analyzer
            </TabsTrigger>
            <TabsTrigger
              value="batch"
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Batch Analysis
            </TabsTrigger>
            <TabsTrigger
              value="detector"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Device Detector
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              UA Templates
            </TabsTrigger>
          </TabsList>

          {/* User Agent Analyzer Tab */}
          <TabsContent
            value="analyzer"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    User Agent Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="ua-input"
                      className="text-sm font-medium"
                    >
                      User Agent String
                    </Label>
                    <Textarea
                      id="ua-input"
                      value={userAgent}
                      onChange={(e) => setUserAgent(e.target.value)}
                      placeholder="Enter user agent string to analyze..."
                      className="mt-2 min-h-[120px] font-mono text-sm"
                    />
                    {settings.realTimeProcessing && userAgent && (
                      <div className="mt-2 text-sm">
                        {userAgentValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid user agent format
                          </div>
                        ) : userAgentValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {userAgentValidation.error}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Current Browser UA */}
                  {currentUserAgent && (
                    <div className="border rounded-lg p-3 bg-muted/50">
                      <Label className="text-sm font-medium mb-2 block">Your Current User Agent</Label>
                      <div className="font-mono text-xs break-all text-muted-foreground">{currentUserAgent}</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2"
                        onClick={() => setUserAgent(currentUserAgent)}
                      >
                        Use Current UA
                      </Button>
                    </div>
                  )}

                  {/* Analysis Settings */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Analysis Settings</Label>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="include-device"
                          type="checkbox"
                          checked={settings.includeDeviceInfo}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeDeviceInfo: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="include-device"
                          className="text-xs"
                        >
                          Include device information
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-browser"
                          type="checkbox"
                          checked={settings.includeBrowserInfo}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeBrowserInfo: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="include-browser"
                          className="text-xs"
                        >
                          Include browser information
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
                        <Label
                          htmlFor="include-security"
                          className="text-xs"
                        >
                          Include security analysis
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="detect-bots"
                          type="checkbox"
                          checked={settings.detectBots}
                          onChange={(e) => setSettings((prev) => ({ ...prev, detectBots: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="detect-bots"
                          className="text-xs"
                        >
                          Detect bots and crawlers
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="real-time-processing"
                          type="checkbox"
                          checked={settings.realTimeProcessing}
                          onChange={(e) => setSettings((prev) => ({ ...prev, realTimeProcessing: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="real-time-processing"
                          className="text-xs"
                        >
                          Real-time analysis
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleProcessSingle}
                      disabled={!userAgent.trim() || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Analyze User Agent
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(userAgent, "User Agent")}
                      variant="outline"
                      disabled={!userAgent.trim()}
                    >
                      {copiedText === "User Agent" ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      Copy
                    </Button>
                    <Button
                      onClick={() => {
                        setUserAgent("")
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {userAgentValidation.warnings && userAgentValidation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Warnings:</h4>
                      <div className="text-xs space-y-1">
                        {userAgentValidation.warnings.map((warning, index) => (
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

                  {userAgentValidation.suggestions && userAgentValidation.suggestions.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-blue-800">Suggestions:</h4>
                      <div className="text-xs space-y-1">
                        {userAgentValidation.suggestions.map((suggestion, index) => (
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

              {/* Analysis Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Analysis Results
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
                        <div className="text-sm font-medium mb-2">
                          Analysis Status: {currentResult.isValid ? "Success" : "Failed"}
                        </div>
                        {currentResult.error && (
                          <div className="text-red-600 text-sm mt-1">
                            <strong>Error:</strong> {currentResult.error}
                          </div>
                        )}
                      </div>

                      {currentResult.isValid && (
                        <div className="space-y-4">
                          {/* Device Information */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              Device Information
                            </Label>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Device Type:</strong> {currentResult.statistics.deviceMetrics.deviceType}
                                </div>
                                <div>
                                  <strong>Architecture:</strong> {currentResult.statistics.deviceMetrics.architecture}
                                </div>
                                <div>
                                  <strong>Touch Support:</strong>{" "}
                                  {currentResult.statistics.deviceMetrics.touchSupport ? "Yes" : "No"}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Platform:</strong>{" "}
                                  {currentResult.statistics.deviceMetrics.hardwareInfo.platform}
                                </div>
                                {currentResult.statistics.deviceMetrics.hardwareInfo.vendor && (
                                  <div>
                                    <strong>Vendor:</strong>{" "}
                                    {currentResult.statistics.deviceMetrics.hardwareInfo.vendor}
                                  </div>
                                )}
                                {currentResult.statistics.deviceMetrics.hardwareInfo.model && (
                                  <div>
                                    <strong>Model:</strong> {currentResult.statistics.deviceMetrics.hardwareInfo.model}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Operating System */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 flex items-center gap-2">
                              <HardDrive className="h-4 w-4" />
                              Operating System
                            </Label>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>OS Name:</strong>{" "}
                                  {currentResult.statistics.deviceMetrics.operatingSystem.name}
                                </div>
                                <div>
                                  <strong>OS Version:</strong>{" "}
                                  {currentResult.statistics.deviceMetrics.operatingSystem.version}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>OS Family:</strong>{" "}
                                  {currentResult.statistics.deviceMetrics.operatingSystem.family}
                                </div>
                                {currentResult.statistics.deviceMetrics.operatingSystem.architecture && (
                                  <div>
                                    <strong>Architecture:</strong>{" "}
                                    {currentResult.statistics.deviceMetrics.operatingSystem.architecture}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Browser Information */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Browser Information
                            </Label>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Browser:</strong> {currentResult.statistics.browserMetrics.browserName}
                                </div>
                                <div>
                                  <strong>Version:</strong> {currentResult.statistics.browserMetrics.browserVersion}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Engine:</strong> {currentResult.statistics.browserMetrics.engineName}
                                </div>
                                <div>
                                  <strong>Engine Version:</strong>{" "}
                                  {currentResult.statistics.browserMetrics.engineVersion}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quality Scores */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Quality & Security Assessment
                            </Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Quality Score:</strong>{" "}
                                  {currentResult.analysis?.qualityScore?.toFixed(1) || "N/A"}/100
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Modernity Score:</strong>{" "}
                                  {currentResult.analysis?.modernityScore?.toFixed(1) || "N/A"}/100
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Security Risk:</strong> {currentResult.analysis?.securityRisk || "Unknown"}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Privacy Level:</strong> {currentResult.analysis?.privacyLevel || "Unknown"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Device Type Indicators */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Device Type Detection</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                <span>Desktop: {currentResult.analysis?.isDesktop ? "✓" : "✗"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                <span>Mobile: {currentResult.analysis?.isMobile ? "✓" : "✗"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Tablet className="h-4 w-4" />
                                <span>Tablet: {currentResult.analysis?.isTablet ? "✓" : "✗"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Cpu className="h-4 w-4" />
                                <span>Bot: {currentResult.analysis?.isBot ? "✓" : "✗"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Analysis */}
                          {showDetailedAnalysis && (
                            <div className="space-y-4">
                              {/* Browser Features */}
                              {currentResult.statistics.browserMetrics.features.length > 0 && (
                                <div className="border rounded-lg p-3">
                                  <Label className="font-medium text-sm mb-3 block">Browser Features</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {currentResult.statistics.browserMetrics.features.map((feature, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Security Features */}
                              {currentResult.statistics.browserMetrics.securityFeatures.length > 0 && (
                                <div className="border rounded-lg p-3">
                                  <Label className="font-medium text-sm mb-3 block">Security Features</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {currentResult.statistics.browserMetrics.securityFeatures.map((feature, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Modern Features */}
                              {currentResult.statistics.browserMetrics.modernFeatures.length > 0 && (
                                <div className="border rounded-lg p-3">
                                  <Label className="font-medium text-sm mb-3 block">Modern Features</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {currentResult.statistics.browserMetrics.modernFeatures.map((feature, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Mobile Features */}
                              {currentResult.statistics.deviceMetrics.mobileFeatures.length > 0 && (
                                <div className="border rounded-lg p-3">
                                  <Label className="font-medium text-sm mb-3 block">Mobile Features</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {currentResult.statistics.deviceMetrics.mobileFeatures.map((feature, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Issues and Recommendations */}
                              {currentResult.analysis && (
                                <div className="space-y-4">
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

                                  {currentResult.analysis.compatibilityIssues.length > 0 && (
                                    <div className="border rounded-lg p-3">
                                      <Label className="font-medium text-sm mb-3 block text-orange-700">
                                        Compatibility Issues
                                      </Label>
                                      <ul className="text-sm space-y-1">
                                        {currentResult.analysis.compatibilityIssues.map((issue, index) => (
                                          <li
                                            key={index}
                                            className="flex items-center gap-2"
                                          >
                                            <AlertCircle className="h-3 w-3 text-orange-600" />
                                            {issue}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {currentResult.analysis.userAgentIssues.length > 0 && (
                                    <div className="border rounded-lg p-3">
                                      <Label className="font-medium text-sm mb-3 block text-red-700">
                                        User Agent Issues
                                      </Label>
                                      <ul className="text-sm space-y-1">
                                        {currentResult.analysis.userAgentIssues.map((issue, index) => (
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
                                </div>
                              )}
                            </div>
                          )}

                          {/* Statistics */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Processing Statistics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>UA Length:</strong> {currentResult.statistics.userAgentMetrics.length}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Token Count:</strong> {currentResult.statistics.userAgentMetrics.tokenCount}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Components:</strong>{" "}
                                  {currentResult.statistics.userAgentMetrics.detectedComponents.length}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Processing Time:</strong> {currentResult.statistics.processingTime.toFixed(2)}
                                  ms
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentResult.isValid && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => exportResults([currentResult], settings.exportFormat)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export Analysis
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Analysis Results</h3>
                      <p className="text-muted-foreground mb-4">
                        Enter a user agent string and analyze to see detailed results
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Analysis Tab */}
          <TabsContent
            value="batch"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Batch User Agent Analysis
                </CardTitle>
                <CardDescription>Analyze multiple user agent strings simultaneously (one per line)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="batch-input"
                      className="text-sm font-medium"
                    >
                      User Agent Strings (one per line)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36&#10;Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15&#10;Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
                      className="mt-2 min-h-[200px] font-mono text-sm"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">Enter one user agent string per line</div>
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
                      Analyze Batch
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
                            <h4 className="font-medium">{batch.count} user agents analyzed</h4>
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
                            <span className="font-medium">Avg Quality:</span>{" "}
                            {batch.statistics.averageQuality.toFixed(1)}
                          </div>
                        </div>

                        {/* Distribution Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Device Types</h5>
                            <div className="space-y-1">
                              {Object.entries(batch.statistics.deviceTypeDistribution).map(([type, count]) => (
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
                            <h5 className="font-medium text-sm mb-2">Browsers</h5>
                            <div className="space-y-1">
                              {Object.entries(batch.statistics.browserDistribution)
                                .slice(0, 5)
                                .map(([browser, count]) => (
                                  <div
                                    key={browser}
                                    className="flex justify-between text-xs"
                                  >
                                    <span>{browser}:</span>
                                    <span>{count}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2">Operating Systems</h5>
                            <div className="space-y-1">
                              {Object.entries(batch.statistics.osDistribution)
                                .slice(0, 5)
                                .map(([os, count]) => (
                                  <div
                                    key={os}
                                    className="flex justify-between text-xs"
                                  >
                                    <span>{os}:</span>
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
                                  <span className="font-mono truncate flex-1 mr-2">
                                    {result.statistics.browserMetrics.browserName} on{" "}
                                    {result.statistics.deviceMetrics.deviceType}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      result.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {result.isValid ? "Valid" : "Invalid"}
                                  </span>
                                </div>
                                {result.isValid && (
                                  <div className="text-muted-foreground mt-1">
                                    {result.statistics.browserMetrics.browserName}{" "}
                                    {result.statistics.browserMetrics.browserVersion} •
                                    {result.statistics.deviceMetrics.operatingSystem.name} • Quality:{" "}
                                    {result.analysis?.qualityScore?.toFixed(1) || "N/A"}/100 •
                                    {result.statistics.processingTime.toFixed(2)}ms
                                  </div>
                                )}
                                {result.error && <div className="text-red-600 mt-1">{result.error}</div>}
                              </div>
                            ))}
                            {batch.results.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.results.length - 5} more user agents
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

          {/* Device Detector Tab */}
          <TabsContent
            value="detector"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Device & Browser Detector
                </CardTitle>
                <CardDescription>Real-time device and browser detection from your current environment</CardDescription>
              </CardHeader>
              <CardContent>
                {currentUserAgent ? (
                  <div className="space-y-4">
                    {/* Current Environment */}
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h3 className="font-medium mb-3">Your Current Environment</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div>
                            <strong>Browser:</strong>{" "}
                            {typeof navigator !== "undefined"
                              ? /Chrome/i.test(navigator.userAgent)
                                ? "Chrome"
                                : /Firefox/i.test(navigator.userAgent)
                                  ? "Firefox"
                                  : /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent)
                                    ? "Safari"
                                    : /Edge/i.test(navigator.userAgent)
                                      ? "Edge"
                                      : "Unknown"
                              : "Unknown"}
                          </div>
                          <div>
                            <strong>Platform:</strong>{" "}
                            {typeof navigator !== "undefined" ? navigator.platform : "Unknown"}
                          </div>
                          <div>
                            <strong>Language:</strong>{" "}
                            {typeof navigator !== "undefined" ? navigator.language : "Unknown"}
                          </div>
                        </div>
                        <div>
                          <div>
                            <strong>Screen:</strong>{" "}
                            {typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : "Unknown"}
                          </div>
                          <div>
                            <strong>Color Depth:</strong>{" "}
                            {typeof screen !== "undefined" ? `${screen.colorDepth} bits` : "Unknown"}
                          </div>
                          <div>
                            <strong>Timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Feature Detection */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-3">Browser Capabilities</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                          <div>
                            Touch Support: {typeof navigator !== "undefined" && "ontouchstart" in window ? "✓" : "✗"}
                          </div>
                          <div>
                            Geolocation: {typeof navigator !== "undefined" && "geolocation" in navigator ? "✓" : "✗"}
                          </div>
                          <div>Local Storage: {typeof Storage !== "undefined" ? "✓" : "✗"}</div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            WebGL:{" "}
                            {(() => {
                              try {
                                const canvas = document.createElement("canvas")
                                return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
                                  ? "✓"
                                  : "✗"
                              } catch {
                                return "✗"
                              }
                            })()}
                          </div>
                          <div>WebRTC: {typeof RTCPeerConnection !== "undefined" ? "✓" : "✗"}</div>
                          <div>
                            Service Worker:{" "}
                            {typeof navigator !== "undefined" && "serviceWorker" in navigator ? "✓" : "✗"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>WebAssembly: {typeof WebAssembly !== "undefined" ? "✓" : "✗"}</div>
                          <div>
                            Push API:{" "}
                            {typeof navigator !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
                              ? "✓"
                              : "✗"}
                          </div>
                          <div>Notifications: {typeof Notification !== "undefined" ? "✓" : "✗"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Current User Agent */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-3">Your User Agent String</h3>
                      <div className="font-mono text-xs bg-muted p-3 rounded break-all">{currentUserAgent}</div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(currentUserAgent, "Current User Agent")}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy UA
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUserAgent(currentUserAgent)}
                        >
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Analyze This UA
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Environment Detection Unavailable</h3>
                    <p className="text-muted-foreground">Browser environment information is not available</p>
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
                  User Agent Templates
                </CardTitle>
                <CardDescription>Pre-built user agent strings for testing and development</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userAgentTemplates.map((template) => (
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
                            <div className="text-xs font-medium mb-1">Device & Browser:</div>
                            <div className="text-xs">
                              {template.deviceType} • {template.browserName} • {template.osName}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Features:</div>
                            <div className="flex flex-wrap gap-1">
                              {template.features.map((feature, index) => (
                                <span
                                  key={index}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">User Agent Preview:</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded max-h-16 overflow-y-auto">
                              {template.userAgent.substring(0, 100)}...
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
                Analysis Settings
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

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Analysis Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        id="detailed-analysis"
                        type="checkbox"
                        checked={settings.showDetailedAnalysis}
                        onChange={(e) => setSettings((prev) => ({ ...prev, showDetailedAnalysis: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="detailed-analysis"
                        className="text-xs"
                      >
                        Show detailed analysis by default
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {batches.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      const allResults = batches.flatMap((batch) => batch.results)
                      exportResults(allResults, "txt", "user-agent-analysis-report.txt")
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

// Main component
const UserAgent = () => {
  return <UserAgentCore />
}

export default UserAgent
