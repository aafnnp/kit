import { useCallback, useState } from "react"
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
  RotateCcw,
  Settings,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Eye,
  Layers,
  QrCode,
  Image,
} from "lucide-react"
import { nanoid } from "nanoid"

// Dynamic import for qrcode to reduce initial bundle size
let qrcodeModule: typeof import("qrcode") | null = null
const loadQRCode = async (): Promise<typeof import("qrcode")> => {
  if (!qrcodeModule) {
    qrcodeModule = await import("qrcode")
  }
  return qrcodeModule
}

import type {
  QRCodeResult,
  QRMetadata,
  QRCapacity,
  QRAnalysis,
  QRReadability,
  QROptimization,
  QRCompatibility,
  QRSecurity,
  QRSettings,
  QRBatch,
  BatchSettings,
  BatchStatistics,
  QRTemplate,
  QRValidation,
  QRContentType,
  ErrorCorrectionLevel,
  ExportFormat,
} from "@/components/tools/qr-generator/schema"

// Utility functions

// QR Code generation functions (using standard 'qrcode' library)
const generateQRCode = async (settings: QRSettings): Promise<QRCodeResult> => {
  try {
    const QRCode = await loadQRCode()
    // Create a canvas and draw QR using 'qrcode' to ensure standards compliance
    const canvas = document.createElement("canvas")
    const marginModules = Math.max(0, Math.round(settings.margin / 8))

    await QRCode.toCanvas(canvas, settings.content, {
      errorCorrectionLevel: settings.errorCorrection,
      width: settings.size,
      margin: marginModules,
      color: {
        dark: settings.foregroundColor,
        light: settings.backgroundColor,
      },
    })

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas context not available")

    // Add logo overlay if requested
    if (settings.logoUrl && settings.logoSize) {
      await addLogo(ctx, settings.logoUrl, canvas.width, settings.logoSize)
    }

    const mime = settings.format === "svg" ? "image/png" : `image/${settings.format}`
    const dataUrl = canvas.toDataURL(mime, 0.92)

    // Generate SVG version using 'qrcode'
    const svgString = await generateSVGQRCode(settings)

    // Calculate metadata
    const metadata = calculateQRMetadata(settings)

    // Perform analysis
    const analysis = analyzeQRCode(settings, metadata)

    return {
      id: nanoid(),
      content: settings.content,
      type: settings.type,
      format: settings.format,
      size: settings.size,
      errorCorrection: settings.errorCorrection,
      dataUrl,
      svgString,
      isValid: true,
      metadata,
      analysis,
      settings,
      createdAt: new Date(),
    }
  } catch (error) {
    return {
      id: nanoid(),
      content: settings.content,
      type: settings.type,
      format: settings.format,
      size: settings.size,
      errorCorrection: settings.errorCorrection,
      isValid: false,
      error: error instanceof Error ? error.message : "QR generation failed",
      settings,
      createdAt: new Date(),
    }
  }
}

const addLogo = async (
  ctx: CanvasRenderingContext2D,
  logoUrl: string,
  qrSize: number,
  logoSize: number
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const logoPosition = (qrSize - logoSize) / 2
      ctx.drawImage(img, logoPosition, logoPosition, logoSize, logoSize)
      resolve()
    }
    img.onerror = () => reject(new Error("Failed to load logo"))
    img.src = logoUrl
  })
}

const generateSVGQRCode = async (settings: QRSettings): Promise<string> => {
  const QRCode = await loadQRCode()
  const marginModules = Math.max(0, Math.round(settings.margin / 8))
  const svg = await QRCode.toString(settings.content, {
    type: "svg",
    errorCorrectionLevel: settings.errorCorrection,
    width: settings.size,
    margin: marginModules,
    color: {
      dark: settings.foregroundColor,
      light: settings.backgroundColor,
    },
  })
  return svg
}

// QR Code analysis functions
const calculateQRMetadata = (settings: QRSettings): QRMetadata => {
  const contentLength = settings.content.length

  // Estimate QR version based on content length and error correction
  let version = 1
  if (contentLength > 25) version = 2
  if (contentLength > 47) version = 3
  if (contentLength > 77) version = 4
  if (contentLength > 114) version = 5

  const modules = 17 + (version - 1) * 4

  // Calculate capacities for different data types
  const capacity: QRCapacity = {
    numeric: getCapacity(version, "numeric", settings.errorCorrection),
    alphanumeric: getCapacity(version, "alphanumeric", settings.errorCorrection),
    binary: getCapacity(version, "binary", settings.errorCorrection),
    kanji: getCapacity(version, "kanji", settings.errorCorrection),
  }

  const errorCorrectionPercentages = { L: 7, M: 15, Q: 25, H: 30 }

  return {
    version,
    modules,
    capacity,
    actualSize: settings.size,
    errorCorrectionPercentage: errorCorrectionPercentages[settings.errorCorrection],
    dataType: detectDataType(settings.content),
    encoding: "UTF-8",
    compressionRatio: contentLength / (modules * modules),
    qualityScore: calculateQualityScore(settings, version, contentLength),
  }
}

const getCapacity = (version: number, dataType: string, errorCorrection: ErrorCorrectionLevel): number => {
  // Simplified capacity calculation
  const baseCapacities = {
    1: { numeric: 41, alphanumeric: 25, binary: 17, kanji: 10 },
    2: { numeric: 77, alphanumeric: 47, binary: 32, kanji: 20 },
    3: { numeric: 127, alphanumeric: 77, binary: 53, kanji: 32 },
    4: { numeric: 187, alphanumeric: 114, binary: 78, kanji: 48 },
    5: { numeric: 255, alphanumeric: 154, binary: 106, kanji: 65 },
  }

  const reductions = { L: 1, M: 0.85, Q: 0.75, H: 0.7 }
  const versionData = baseCapacities[version as keyof typeof baseCapacities]
  const base = versionData?.[dataType as keyof typeof versionData] || 100

  return Math.floor(base * reductions[errorCorrection])
}

const detectDataType = (content: string): string => {
  if (/^\d+$/.test(content)) return "numeric"
  if (/^[A-Z0-9 $%*+\-./:]+$/.test(content)) return "alphanumeric"
  if (/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/.test(content)) return "kanji"
  return "binary"
}

const calculateQualityScore = (settings: QRSettings, _version: number, contentLength: number): number => {
  let score = 100

  // Penalize for high density
  const density = contentLength / (settings.size * settings.size)
  if (density > 0.001) score -= 20

  // Reward appropriate error correction
  if (settings.errorCorrection === "M" || settings.errorCorrection === "Q") score += 10

  // Penalize very small or very large sizes
  if (settings.size < 100) score -= 15
  if (settings.size > 1000) score -= 10

  // Reward good contrast
  const contrast = calculateContrast(settings.foregroundColor, settings.backgroundColor)
  if (contrast > 7) score += 15
  else if (contrast < 3) score -= 25

  return Math.max(0, Math.min(100, score))
}

const calculateContrast = (color1: string, color2: string): number => {
  // Simplified contrast calculation
  const getLuminance = (color: string) => {
    const hex = color.replace("#", "")
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255

    const sRGB = [r, g, b].map((c) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
  }

  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

const analyzeQRCode = (settings: QRSettings, metadata: QRMetadata): QRAnalysis => {
  const readability = analyzeReadability(settings, metadata)
  const optimization = analyzeOptimization(settings, metadata)
  const compatibility = analyzeCompatibility(settings)
  const security = analyzeSecurity(settings)

  const recommendations: string[] = []
  const warnings: string[] = []

  // Generate recommendations
  if (readability.contrastRatio < 4.5) {
    recommendations.push("Increase contrast between foreground and background colors")
  }

  if (settings.size < 200) {
    recommendations.push("Consider increasing QR code size for better readability")
  }

  if (metadata.version > 3) {
    warnings.push("High data density may affect scanning reliability")
  }

  if (settings.logoSize && settings.logoSize > settings.size * 0.3) {
    warnings.push("Logo size may interfere with QR code scanning")
  }

  return {
    readability,
    optimization,
    compatibility,
    security,
    recommendations,
    warnings,
  }
}

const analyzeReadability = (settings: QRSettings, metadata: QRMetadata): QRReadability => {
  const contrastRatio = calculateContrast(settings.foregroundColor, settings.backgroundColor)
  const moduleSize = settings.size / metadata.modules
  const quietZone = settings.margin

  let readabilityScore = 100
  if (contrastRatio < 4.5) readabilityScore -= 30
  if (moduleSize < 3) readabilityScore -= 20
  if (quietZone < moduleSize * 4) readabilityScore -= 15

  const scanDistance = moduleSize > 5 ? "Close (< 30cm)" : moduleSize > 3 ? "Medium (30-60cm)" : "Far (> 60cm)"

  return {
    contrastRatio,
    moduleSize,
    quietZone,
    readabilityScore: Math.max(0, readabilityScore),
    scanDistance,
    lightingConditions: contrastRatio > 7 ? ["Bright", "Normal", "Dim"] : ["Bright", "Normal"],
  }
}

const analyzeOptimization = (settings: QRSettings, metadata: QRMetadata): QROptimization => {
  const contentLength = settings.content.length
  const capacity = metadata.capacity.binary

  const dataEfficiency = (contentLength / capacity) * 100
  const sizeOptimization = settings.size <= 400 ? 100 : Math.max(0, 100 - (settings.size - 400) / 10)
  const errorCorrectionUtilization = metadata.errorCorrectionPercentage
  const versionOptimality = metadata.version <= 3 ? 100 : Math.max(0, 100 - (metadata.version - 3) * 15)

  const overallOptimization = (dataEfficiency + sizeOptimization + errorCorrectionUtilization + versionOptimality) / 4

  return {
    dataEfficiency,
    sizeOptimization,
    errorCorrectionUtilization,
    versionOptimality,
    overallOptimization,
  }
}

const analyzeCompatibility = (settings: QRSettings): QRCompatibility => {
  const readerCompatibility = ["Standard QR Readers", "Mobile Apps"]
  const deviceCompatibility = ["Smartphones", "Tablets"]
  const softwareCompatibility = ["iOS Camera", "Android Camera", "QR Scanner Apps"]
  const standardsCompliance = ["ISO/IEC 18004"]
  const limitations: string[] = []

  if (settings.customization.moduleStyle !== "square") {
    limitations.push("Custom module styles may not be supported by all readers")
  }

  if (settings.logoUrl) {
    limitations.push("Logo may reduce scanning reliability")
  }

  if (settings.customization.gradientEnabled) {
    limitations.push("Gradient colors may affect readability")
  }

  return {
    readerCompatibility,
    deviceCompatibility,
    softwareCompatibility,
    standardsCompliance,
    limitations,
  }
}

const analyzeSecurity = (settings: QRSettings): QRSecurity => {
  let dataExposure: "low" | "medium" | "high" = "low"
  let privacy_level: "low" | "medium" | "high" = "high"
  const vulnerabilities: string[] = []
  const recommendations: string[] = []

  // Analyze content for sensitive data
  if (settings.content.includes("password") || settings.content.includes("token")) {
    dataExposure = "high"
    privacy_level = "low"
    vulnerabilities.push("Contains potentially sensitive information")
    recommendations.push("Avoid including passwords or tokens in QR codes")
  }

  if (settings.type === "wifi") {
    dataExposure = "medium"
    privacy_level = "medium"
    vulnerabilities.push("WiFi credentials are visible to anyone who scans")
  }

  if (settings.type === "email" || settings.type === "phone") {
    dataExposure = "medium"
    vulnerabilities.push("Personal contact information is exposed")
  }

  const securityScore = dataExposure === "low" ? 90 : dataExposure === "medium" ? 60 : 30

  return {
    dataExposure,
    tampering_resistance: "medium",
    privacy_level,
    security_score: securityScore,
    vulnerabilities,
    recommendations,
  }
}

// QR Templates
const qrTemplates: QRTemplate[] = [
  {
    id: "basic-text",
    name: "Basic Text",
    description: "Simple text QR code with standard settings",
    category: "Text",
    type: "text",
    settings: {
      content: "Hello, World!",
      type: "text",
      format: "png",
      size: 300,
      errorCorrection: "M",
      margin: 20,
      foregroundColor: "#000000",
      backgroundColor: "#ffffff",
      customization: {
        cornerStyle: "square",
        moduleStyle: "square",
        gradientEnabled: false,
        patternEnabled: false,
        borderEnabled: false,
      },
    },
    useCase: ["Simple messages", "Basic information", "Text sharing", "Notes"],
    examples: ["Contact info", "Instructions", "Messages", "Quotes"],
    preview: "Simple black and white QR code",
  },
  {
    id: "website-url",
    name: "Website URL",
    description: "QR code for website links with optimized settings",
    category: "Web",
    type: "url",
    settings: {
      content: "https://example.com",
      type: "url",
      format: "png",
      size: 400,
      errorCorrection: "Q",
      margin: 30,
      foregroundColor: "#1a73e8",
      backgroundColor: "#ffffff",
      customization: {
        cornerStyle: "rounded",
        moduleStyle: "rounded",
        gradientEnabled: false,
        patternEnabled: false,
        borderEnabled: true,
        borderWidth: 2,
        borderColor: "#1a73e8",
      },
    },
    useCase: ["Website promotion", "Link sharing", "Marketing", "Business cards"],
    examples: ["Company website", "Portfolio", "Landing page", "Social media"],
    preview: "Blue rounded QR code with border",
  },
  {
    id: "email-contact",
    name: "Email Contact",
    description: "QR code for email addresses with pre-filled subject",
    category: "Contact",
    type: "email",
    settings: {
      content: "mailto:contact@example.com?subject=Hello&body=Hi there!",
      type: "email",
      format: "png",
      size: 350,
      errorCorrection: "M",
      margin: 25,
      foregroundColor: "#34a853",
      backgroundColor: "#ffffff",
      customization: {
        cornerStyle: "square",
        moduleStyle: "circle",
        gradientEnabled: false,
        patternEnabled: false,
        borderEnabled: false,
      },
    },
    useCase: ["Contact forms", "Business cards", "Customer support", "Feedback"],
    examples: ["Support email", "Sales contact", "Feedback form", "Newsletter signup"],
    preview: "Green QR code with circular modules",
  },
  {
    id: "phone-number",
    name: "Phone Number",
    description: "QR code for phone numbers with direct calling",
    category: "Contact",
    type: "phone",
    settings: {
      content: "tel:+1234567890",
      type: "phone",
      format: "png",
      size: 300,
      errorCorrection: "L",
      margin: 20,
      foregroundColor: "#ea4335",
      backgroundColor: "#ffffff",
      customization: {
        cornerStyle: "circle",
        moduleStyle: "square",
        gradientEnabled: false,
        patternEnabled: false,
        borderEnabled: false,
      },
    },
    useCase: ["Business cards", "Contact sharing", "Emergency contacts", "Customer service"],
    examples: ["Business phone", "Support hotline", "Personal contact", "Emergency number"],
    preview: "Red QR code with circular corners",
  },
  {
    id: "wifi-network",
    name: "WiFi Network",
    description: "QR code for WiFi network credentials",
    category: "Network",
    type: "wifi",
    settings: {
      content: "WIFI:T:WPA;S:NetworkName;P:password123;H:false;;",
      type: "wifi",
      format: "png",
      size: 400,
      errorCorrection: "H",
      margin: 30,
      foregroundColor: "#9c27b0",
      backgroundColor: "#ffffff",
      customization: {
        cornerStyle: "rounded",
        moduleStyle: "diamond",
        gradientEnabled: false,
        patternEnabled: false,
        borderEnabled: true,
        borderWidth: 3,
        borderColor: "#9c27b0",
      },
    },
    useCase: ["Guest WiFi", "Office networks", "Public spaces", "Events"],
    examples: ["Guest network", "Office WiFi", "Cafe WiFi", "Conference network"],
    preview: "Purple QR code with diamond modules and border",
  },
  {
    id: "vcard-contact",
    name: "vCard Contact",
    description: "Complete contact information in vCard format",
    category: "Contact",
    type: "vcard",
    settings: {
      content: "BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nORG:Company\nTEL:+1234567890\nEMAIL:john@example.com\nEND:VCARD",
      type: "vcard",
      format: "png",
      size: 450,
      errorCorrection: "Q",
      margin: 35,
      foregroundColor: "#ff9800",
      backgroundColor: "#ffffff",
      customization: {
        cornerStyle: "square",
        moduleStyle: "rounded",
        gradientEnabled: true,
        gradientColors: ["#ff9800", "#f57c00"],
        patternEnabled: false,
        borderEnabled: false,
      },
    },
    useCase: ["Business cards", "Networking", "Contact exchange", "Professional profiles"],
    examples: ["Business contact", "Personal card", "Professional profile", "Network contact"],
    preview: "Orange gradient QR code with rounded modules",
  },
]

// Validation functions
const validateQRSettings = (settings: QRSettings): QRValidation => {
  const validation: QRValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  // Content validation
  if (!settings.content || settings.content.trim().length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: "Content cannot be empty",
      type: "content",
      severity: "error",
    })
  }

  // Content length validation
  if (settings.content.length > 2000) {
    validation.isValid = false
    validation.errors.push({
      message: "Content exceeds maximum length of 2000 characters",
      type: "content",
      severity: "error",
    })
  }

  if (settings.content.length > 1000) {
    validation.warnings.push("Large content may result in dense QR code that is difficult to scan")
    validation.suggestions.push("Consider shortening the content or using a URL shortener")
  }

  // Size validation
  if (settings.size < 50) {
    validation.isValid = false
    validation.errors.push({
      message: "Size must be at least 50 pixels",
      type: "size",
      severity: "error",
    })
  }

  if (settings.size > 2000) {
    validation.warnings.push("Very large QR codes may have performance issues")
    validation.suggestions.push("Consider using a smaller size for better performance")
  }

  // Color validation
  const contrast = calculateContrast(settings.foregroundColor, settings.backgroundColor)
  if (contrast < 3) {
    validation.errors.push({
      message: "Insufficient contrast between foreground and background colors",
      type: "settings",
      severity: "error",
    })
    validation.isValid = false
  } else if (contrast < 4.5) {
    validation.warnings.push("Low contrast may affect readability")
    validation.suggestions.push("Increase contrast for better scanning reliability")
  }

  // Logo size validation
  if (settings.logoSize && settings.logoSize > settings.size * 0.3) {
    validation.warnings.push("Logo size is too large and may interfere with scanning")
    validation.suggestions.push("Reduce logo size to less than 30% of QR code size")
  }

  // Margin validation
  if (settings.margin < 10) {
    validation.warnings.push("Small margin may affect scanning reliability")
    validation.suggestions.push("Increase margin to at least 10 pixels")
  }

  // Estimate QR code size
  const estimatedVersion = Math.ceil(settings.content.length / 100)
  validation.estimatedSize = estimatedVersion

  // Recommend optimal settings
  validation.recommendedSettings = {
    ...settings,
    errorCorrection: settings.content.length > 500 ? "Q" : "M",
    size: Math.max(200, Math.min(500, settings.content.length * 2)),
    margin: Math.max(20, settings.size * 0.05),
  }

  return validation
}

// Custom hooks
const useQRGenerator = () => {
  const [qrCodes, setQRCodes] = useState<QRCodeResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateQR = useCallback(async (settings: QRSettings): Promise<QRCodeResult> => {
    setIsGenerating(true)
    try {
      const result = await generateQRCode(settings)
      setQRCodes((prev) => [result, ...prev])
      return result
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const generateBatch = useCallback(async (batchSettings: BatchSettings): Promise<QRBatch> => {
    setIsGenerating(true)
    const startTime = performance.now()

    try {
      const batch: QRBatch = {
        id: nanoid(),
        name: batchSettings.namingPattern || "QR Batch",
        qrCodes: [],
        settings: batchSettings,
        status: "processing",
        progress: 0,
        statistics: {
          totalGenerated: 0,
          successfulGenerated: 0,
          failedGenerated: 0,
          averageSize: 0,
          averageQuality: 0,
          totalProcessingTime: 0,
          averageProcessingTime: 0,
          sizeDistribution: {},
          typeDistribution: {},
        },
        createdAt: new Date(),
      }

      const results: QRCodeResult[] = []

      for (let i = 0; i < batchSettings.contentList.length; i++) {
        const content = batchSettings.contentList[i]
        const settings: QRSettings = {
          ...batchSettings.baseSettings,
          content,
        }

        try {
          const result = await generateQRCode(settings)
          results.push(result)

          // Update progress
          const progress = ((i + 1) / batchSettings.contentList.length) * 100
          batch.progress = progress
        } catch (error) {
          const failedResult: QRCodeResult = {
            id: nanoid(),
            content,
            type: settings.type,
            format: settings.format,
            size: settings.size,
            errorCorrection: settings.errorCorrection,
            isValid: false,
            error: error instanceof Error ? error.message : "Generation failed",
            settings,
            createdAt: new Date(),
          }
          results.push(failedResult)
        }
      }

      const endTime = performance.now()
      const totalProcessingTime = endTime - startTime

      // Calculate statistics
      const successful = results.filter((r) => r.isValid)
      const failed = results.filter((r) => !r.isValid)

      const statistics: BatchStatistics = {
        totalGenerated: results.length,
        successfulGenerated: successful.length,
        failedGenerated: failed.length,
        averageSize: successful.reduce((sum, r) => sum + r.size, 0) / successful.length || 0,
        averageQuality:
          successful.reduce((sum, r) => sum + (r.metadata?.qualityScore || 0), 0) / successful.length || 0,
        totalProcessingTime,
        averageProcessingTime: totalProcessingTime / results.length,
        sizeDistribution: {},
        typeDistribution: {},
      }

      // Calculate distributions
      successful.forEach((result) => {
        const sizeRange = `${Math.floor(result.size / 100) * 100}-${Math.floor(result.size / 100) * 100 + 99}`
        statistics.sizeDistribution[sizeRange] = (statistics.sizeDistribution[sizeRange] || 0) + 1
        statistics.typeDistribution[result.type] = (statistics.typeDistribution[result.type] || 0) + 1
      })

      batch.qrCodes = results
      batch.status = "completed"
      batch.progress = 100
      batch.statistics = statistics
      batch.completedAt = new Date()

      setQRCodes((prev) => [...results, ...prev])
      return batch
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const removeQR = useCallback((id: string) => {
    setQRCodes((prev) => prev.filter((qr) => qr.id !== id))
  }, [])

  const clearQRCodes = useCallback(() => {
    setQRCodes([])
  }, [])

  return {
    qrCodes,
    isGenerating,
    generateQR,
    generateBatch,
    removeQR,
    clearQRCodes,
  }
}

// Copy to clipboard functionality
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || "text")
      toast.success(`${label || "Text"} copied to clipboard`)

      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }, [])

  const copyImageToClipboard = useCallback(async (dataUrl?: string, svgString?: string, label?: string) => {
    try {
      let blob: Blob
      if (dataUrl) {
        const res = await fetch(dataUrl)
        blob = await res.blob()
      } else if (svgString) {
        blob = new Blob([svgString], { type: "image/svg+xml" })
      } else {
        throw new Error("No image data to copy")
      }

      const item = new (window as any).ClipboardItem({ [blob.type]: blob })
      await navigator.clipboard.write([item])
      setCopiedText(label || "image")
      toast.success(`${label || "Image"} copied to clipboard`)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error("Failed to copy image to clipboard")
    }
  }, [])

  return { copyToClipboard, copyImageToClipboard, copiedText }
}

// Export functionality
const useQRExport = () => {
  const downloadQR = useCallback((qrCode: QRCodeResult, filename?: string) => {
    if (!qrCode.dataUrl) return

    const link = document.createElement("a")
    link.href = qrCode.dataUrl
    link.download = filename || `qr-code-${qrCode.id}.${qrCode.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const downloadSVG = useCallback((qrCode: QRCodeResult, filename?: string) => {
    if (!qrCode.svgString) return

    const blob = new Blob([qrCode.svgString], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `qr-code-${qrCode.id}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (batch: QRBatch, _format: ExportFormat) => {
      // Implementation would depend on the format
      // For now, just download individual files
      batch.qrCodes.forEach((qr, index) => {
        if (qr.isValid && qr.dataUrl) {
          setTimeout(() => {
            downloadQR(qr, `${batch.name}-${index + 1}.${qr.format}`)
          }, index * 100) // Stagger downloads
        }
      })
    },
    [downloadQR]
  )

  return { downloadQR, downloadSVG, exportBatch }
}

/**
 * Enhanced QR Code Generator & Management Tool
 * Features: Advanced QR generation, customization, analysis, and batch processing
 */
const QRGeneratorCore = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "batch" | "gallery" | "templates">("generator")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [currentQR, setCurrentQR] = useState<QRCodeResult | null>(null)
  const [settings, setSettings] = useState<QRSettings>({
    content: "",
    type: "text",
    format: "png",
    size: 300,
    errorCorrection: "M",
    margin: 20,
    foregroundColor: "#000000",
    backgroundColor: "#ffffff",
    customization: {
      cornerStyle: "square",
      moduleStyle: "square",
      gradientEnabled: false,
      patternEnabled: false,
      borderEnabled: false,
    },
  })

  const { qrCodes, isGenerating, generateQR, removeQR } = useQRGenerator()
  const { downloadQR, downloadSVG } = useQRExport()
  const { copyImageToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = qrTemplates.find((t) => t.id === templateId)
    if (template) {
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Generate QR code
  const handleGenerate = useCallback(async () => {
    const validation = validateQRSettings(settings)
    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        toast.error(error.message)
      })
      return
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        toast.warning(warning)
      })
    }

    try {
      const result = await generateQR(settings)
      setCurrentQR(result)

      if (result.isValid) {
        toast.success("QR code generated successfully")
      } else {
        toast.error(result.error || "QR generation failed")
      }
    } catch (error) {
      toast.error("Failed to generate QR code")
      console.error(error)
    }
  }, [settings, generateQR])

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
              <QrCode className="h-5 w-5" />
              QR Code Generator & Management Tool
            </CardTitle>
            <CardDescription>
              Advanced QR code generation tool with comprehensive customization, analysis, and batch processing. Create
              QR codes for various content types, customize appearance, and export in multiple formats. Use keyboard
              navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "generator" | "batch" | "gallery" | "templates")}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="generator"
              className="flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              Generator
            </TabsTrigger>
            <TabsTrigger
              value="batch"
              className="flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              Batch
            </TabsTrigger>
            <TabsTrigger
              value="gallery"
              className="flex items-center gap-2"
            >
              <Image className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* QR Generator Tab */}
          <TabsContent
            value="generator"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Generator Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    QR Code Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Content Type */}
                  <div>
                    <Label
                      htmlFor="content-type"
                      className="text-sm font-medium"
                    >
                      Content Type
                    </Label>
                    <Select
                      value={settings.type}
                      onValueChange={(value: QRContentType) => setSettings((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="url">Website URL</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone Number</SelectItem>
                        <SelectItem value="sms">SMS Message</SelectItem>
                        <SelectItem value="wifi">WiFi Network</SelectItem>
                        <SelectItem value="vcard">Contact Card</SelectItem>
                        <SelectItem value="event">Calendar Event</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content Input */}
                  <div>
                    <Label
                      htmlFor="content"
                      className="text-sm font-medium"
                    >
                      Content
                    </Label>
                    <Textarea
                      id="content"
                      value={settings.content}
                      onChange={(e) => setSettings((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder={`Enter ${settings.type} content...`}
                      className="mt-2"
                      rows={4}
                    />
                    <div className="text-xs text-muted-foreground mt-1">{settings.content.length}/2000 characters</div>
                  </div>

                  {/* Basic Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="size"
                        className="text-sm font-medium"
                      >
                        Size (px)
                      </Label>
                      <Input
                        id="size"
                        type="number"
                        min="50"
                        max="2000"
                        value={settings.size}
                        onChange={(e) => setSettings((prev) => ({ ...prev, size: parseInt(e.target.value) || 300 }))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="error-correction"
                        className="text-sm font-medium"
                      >
                        Error Correction
                      </Label>
                      <Select
                        value={settings.errorCorrection}
                        onValueChange={(value: ErrorCorrectionLevel) =>
                          setSettings((prev) => ({ ...prev, errorCorrection: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L">Low (7%)</SelectItem>
                          <SelectItem value="M">Medium (15%)</SelectItem>
                          <SelectItem value="Q">Quartile (25%)</SelectItem>
                          <SelectItem value="H">High (30%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="foreground-color"
                        className="text-sm font-medium"
                      >
                        Foreground Color
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="foreground-color"
                          type="color"
                          value={settings.foregroundColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, foregroundColor: e.target.value }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.foregroundColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, foregroundColor: e.target.value }))}
                          className="flex-1"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="background-color"
                        className="text-sm font-medium"
                      >
                        Background Color
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="background-color"
                          type="color"
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="flex-1"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customization */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Customization</Label>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="corner-style"
                          className="text-xs"
                        >
                          Corner Style
                        </Label>
                        <Select
                          value={settings.customization.cornerStyle}
                          onValueChange={(value: "square" | "rounded" | "circle") =>
                            setSettings((prev) => ({
                              ...prev,
                              customization: { ...prev.customization, cornerStyle: value },
                            }))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="rounded">Rounded</SelectItem>
                            <SelectItem value="circle">Circle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label
                          htmlFor="module-style"
                          className="text-xs"
                        >
                          Module Style
                        </Label>
                        <Select
                          value={settings.customization.moduleStyle}
                          onValueChange={(value: "square" | "rounded" | "circle" | "diamond") =>
                            setSettings((prev) => ({
                              ...prev,
                              customization: { ...prev.customization, moduleStyle: value },
                            }))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="rounded">Rounded</SelectItem>
                            <SelectItem value="circle">Circle</SelectItem>
                            <SelectItem value="diamond">Diamond</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="border-enabled"
                          type="checkbox"
                          checked={settings.customization.borderEnabled}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              customization: {
                                ...prev.customization,
                                borderEnabled: e.target.checked,
                                borderWidth: e.target.checked ? 2 : undefined,
                                borderColor: e.target.checked ? settings.foregroundColor : undefined,
                              },
                            }))
                          }
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="border-enabled"
                          className="text-xs"
                        >
                          Add border
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="gradient-enabled"
                          type="checkbox"
                          checked={settings.customization.gradientEnabled}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              customization: {
                                ...prev.customization,
                                gradientEnabled: e.target.checked,
                                gradientColors: e.target.checked ? [settings.foregroundColor, "#666666"] : undefined,
                              },
                            }))
                          }
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="gradient-enabled"
                          className="text-xs"
                        >
                          Enable gradient
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !settings.content.trim()}
                      className="flex-1"
                    >
                      {isGenerating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <QrCode className="mr-2 h-4 w-4" />
                      )}
                      Generate QR Code
                    </Button>
                    <Button
                      onClick={() =>
                        setSettings({
                          content: "",
                          type: "text",
                          format: "png",
                          size: 300,
                          errorCorrection: "M",
                          margin: 20,
                          foregroundColor: "#000000",
                          backgroundColor: "#ffffff",
                          customization: {
                            cornerStyle: "square",
                            moduleStyle: "square",
                            gradientEnabled: false,
                            patternEnabled: false,
                            borderEnabled: false,
                          },
                        })
                      }
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    QR Code Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentQR ? (
                    <div className="space-y-4">
                      {/* QR Code Display */}
                      <div className="flex justify-center">
                        <div className="p-4 border rounded-lg bg-muted/50">
                          {currentQR.dataUrl ? (
                            <img
                              src={currentQR.dataUrl}
                              alt="Generated QR Code"
                              className="max-w-full h-auto"
                              style={{
                                width: "100%",
                                maxWidth: "300px",
                                maxHeight: "300px",
                                imageRendering: "pixelated",
                              }}
                            />
                          ) : (
                            <div className="w-64 h-64 bg-gray-200 rounded flex items-center justify-center">
                              <QrCode className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* QR Code Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div>
                            <strong>Type:</strong> {currentQR.type}
                          </div>
                          <div>
                            <strong>Size:</strong> {currentQR.size}px
                          </div>
                          <div>
                            <strong>Format:</strong> {currentQR.format.toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <div>
                            <strong>Error Correction:</strong> {currentQR.errorCorrection}
                          </div>
                          <div>
                            <strong>Valid:</strong> {currentQR.isValid ? "✅ Yes" : "❌ No"}
                          </div>
                          <div>
                            <strong>Created:</strong> {currentQR.createdAt.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      {currentQR.error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-red-800 text-sm">
                            <strong>Error:</strong> {currentQR.error}
                          </div>
                        </div>
                      )}

                      {/* Quick Analysis */}
                      {currentQR.analysis && (
                        <div className="space-y-3 border-t pt-4">
                          <Label className="text-sm font-medium">Quick Analysis</Label>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="font-medium">Readability</div>
                              <div className="text-lg">
                                {currentQR.analysis.readability.readabilityScore.toFixed(0)}/100
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    currentQR.analysis.readability.readabilityScore >= 80
                                      ? "bg-green-500"
                                      : currentQR.analysis.readability.readabilityScore >= 60
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${currentQR.analysis.readability.readabilityScore}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Optimization</div>
                              <div className="text-lg">
                                {currentQR.analysis.optimization.overallOptimization.toFixed(0)}/100
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    currentQR.analysis.optimization.overallOptimization >= 80
                                      ? "bg-green-500"
                                      : currentQR.analysis.optimization.overallOptimization >= 60
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${currentQR.analysis.optimization.overallOptimization}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Security</div>
                              <div className="text-lg">{currentQR.analysis.security.security_score}/100</div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    currentQR.analysis.security.security_score >= 80
                                      ? "bg-green-500"
                                      : currentQR.analysis.security.security_score >= 60
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${currentQR.analysis.security.security_score}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Quality</div>
                              <div className="text-lg">{currentQR.metadata?.qualityScore?.toFixed(0) || 0}/100</div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    (currentQR.metadata?.qualityScore || 0) >= 80
                                      ? "bg-green-500"
                                      : (currentQR.metadata?.qualityScore || 0) >= 60
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${currentQR.metadata?.qualityScore || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {currentQR.analysis.recommendations.length > 0 && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <h5 className="font-medium text-sm mb-2 text-blue-800">Recommendations</h5>
                              <ul className="text-sm space-y-1">
                                {currentQR.analysis.recommendations.map((rec, index) => (
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

                          {currentQR.analysis.warnings.length > 0 && (
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <h5 className="font-medium text-sm mb-2 text-orange-800">Warnings</h5>
                              <ul className="text-sm space-y-1">
                                {currentQR.analysis.warnings.map((warning, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center gap-2 text-orange-700"
                                  >
                                    <AlertCircle className="h-3 w-3" />
                                    {warning}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Download Options */}
                      {currentQR.isValid && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => downloadQR(currentQR)}
                            variant="outline"
                            className="flex-1"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download PNG
                          </Button>
                          <Button
                            onClick={() => downloadSVG(currentQR)}
                            variant="outline"
                            className="flex-1"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download SVG
                          </Button>
                          <Button
                            onClick={() => copyImageToClipboard(currentQR.dataUrl, currentQR.svgString, "QR Image")}
                            variant="outline"
                          >
                            {copiedText === "QR Image" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <QrCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No QR Code Generated</h3>
                      <p className="text-muted-foreground mb-4">
                        Enter content and click "Generate QR Code" to create your QR code
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Placeholder for other tabs */}
          <TabsContent
            value="batch"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Batch QR Generation</CardTitle>
                <CardDescription>Generate multiple QR codes at once</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
                  <p className="text-muted-foreground">Batch QR generation functionality coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="gallery"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">QR Code Gallery</CardTitle>
                <CardDescription>View and manage your generated QR codes</CardDescription>
              </CardHeader>
              <CardContent>
                {qrCodes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {qrCodes.slice(0, 12).map((qr) => (
                      <div
                        key={qr.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-center mb-3">
                          {qr.dataUrl ? (
                            <img
                              src={qr.dataUrl}
                              alt="QR Code"
                              className="w-24 h-24 object-contain"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                              <QrCode className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <strong>Type:</strong> {qr.type}
                          </div>
                          <div>
                            <strong>Size:</strong> {qr.size}px
                          </div>
                          <div className="truncate">
                            <strong>Content:</strong> {qr.content}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadQR(qr)}
                            className="flex-1"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeQR(qr.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No QR Codes</h3>
                    <p className="text-muted-foreground">Generate some QR codes to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="templates"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">QR Code Templates</CardTitle>
                <CardDescription>Pre-configured QR code templates for common use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {qrTemplates.map((template) => (
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
                            <div className="text-xs font-medium mb-1">Use Cases:</div>
                            <div className="text-xs text-muted-foreground">{template.useCase.join(", ")}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Examples:</div>
                            <div className="text-xs text-muted-foreground">{template.examples.join(", ")}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const QrGenerator = () => {
  return <QRGeneratorCore />
}

export default QrGenerator
