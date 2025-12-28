import { useCallback, useState } from "react"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import {
  BarcodeResult,
  BarcodeSettings,
  BarcodeFormat,
  BarcodeMetadata,
  BarcodeCapacity,
  BarcodeAnalysis,
  BarcodeBatch,
  BatchSettings,
  BatchStatistics,
  BarcodeTemplate,
  BarcodeValidation,
  BarcodeReadability,
  BarcodeOptimization,
  BarcodeCompatibility,
  BarcodeSecurity,
  DataExposure,
  ExportFormat,
} from "@/components/tools/barcode-generator/schema"

// Dynamic import for jsbarcode to reduce initial bundle size
let jsbarcodeModule: typeof import("jsbarcode") | null = null
const loadJsBarcode = async (): Promise<typeof import("jsbarcode")> => {
  if (!jsbarcodeModule) {
    jsbarcodeModule = (await import("jsbarcode")).default
  }
  return jsbarcodeModule
}

// Barcode generation functions (using JsBarcode)
const generateBarcode = async (settings: BarcodeSettings): Promise<BarcodeResult> => {
  try {
    const JsBarcode = await loadJsBarcode()
    // Generate PNG via canvas
    const canvas = document.createElement("canvas")
    JsBarcode(canvas, settings.content, {
      format: settings.format,
      width: settings.width,
      height: settings.height,
      displayValue: settings.displayValue,
      background: settings.backgroundColor,
      lineColor: settings.lineColor,
      font: settings.fontFamily,
      fontOptions: settings.customization.fontWeight === "bold" ? "bold" : undefined,
      fontSize: settings.fontSize,
      textAlign: settings.textAlign,
      textPosition: settings.textPosition,
      textMargin: settings.textMargin,
      margin: settings.margin,
      ean128: false,
    })
    const dataUrl = canvas.toDataURL("image/png", 0.9)

    // Generate SVG version
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    JsBarcode(svg as unknown as SVGElement, settings.content, {
      format: settings.format,
      width: settings.width,
      height: settings.height,
      displayValue: settings.displayValue,
      background: settings.backgroundColor,
      lineColor: settings.lineColor,
      font: settings.fontFamily,
      fontOptions: settings.customization.fontWeight === "bold" ? "bold" : undefined,
      fontSize: settings.fontSize,
      textAlign: settings.textAlign,
      textPosition: settings.textPosition,
      textMargin: settings.textMargin,
      margin: settings.margin,
      ean128: false,
    })
    const svgString = new XMLSerializer().serializeToString(svg)

    // Calculate metadata
    const metadata = calculateBarcodeMetadata(settings)

    // Perform analysis
    const analysis = analyzeBarcode(settings, metadata)

    return {
      id: nanoid(),
      content: settings.content,
      format: settings.format,
      width: settings.width,
      height: settings.height,
      displayValue: settings.displayValue,
      backgroundColor: settings.backgroundColor,
      lineColor: settings.lineColor,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      textAlign: settings.textAlign,
      textPosition: settings.textPosition,
      textMargin: settings.textMargin,
      margin: settings.margin,
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
      format: settings.format,
      width: settings.width,
      height: settings.height,
      displayValue: settings.displayValue,
      backgroundColor: settings.backgroundColor,
      lineColor: settings.lineColor,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      textAlign: settings.textAlign,
      textPosition: settings.textPosition,
      textMargin: settings.textMargin,
      margin: settings.margin,
      isValid: false,
      error: error instanceof Error ? error.message : "Barcode generation failed",
      settings,
      createdAt: new Date(),
    }
  }
}

// Barcode analysis functions
const calculateBarcodeMetadata = (settings: BarcodeSettings): BarcodeMetadata => {
  const contentLength = settings.content.length
  const capacity = getBarcodeCapacity(settings.format)

  const actualWidth = settings.width * contentLength + settings.margin * 2
  const actualHeight =
    settings.height + settings.margin * 2 + (settings.displayValue ? settings.fontSize + settings.textMargin : 0)

  return {
    format: settings.format,
    capacity,
    actualSize: { width: actualWidth, height: actualHeight },
    dataLength: contentLength,
    checksum: calculateChecksum(settings.content, settings.format),
    encoding: "ASCII",
    compressionRatio: contentLength / (actualWidth * actualHeight),
    qualityScore: calculateQualityScore(settings, contentLength),
    readabilityScore: calculateReadabilityScore(settings),
  }
}

const getBarcodeCapacity = (format: BarcodeFormat): BarcodeCapacity => {
  const capacities: Record<BarcodeFormat, BarcodeCapacity> = {
    CODE128: { numeric: 20, alphanumeric: 20, binary: 20, maxLength: 80, minLength: 1 },
    EAN13: { numeric: 13, alphanumeric: 0, binary: 0, maxLength: 13, minLength: 13 },
    EAN8: { numeric: 8, alphanumeric: 0, binary: 0, maxLength: 8, minLength: 8 },
    UPC: { numeric: 12, alphanumeric: 0, binary: 0, maxLength: 12, minLength: 12 },
    CODE39: { numeric: 43, alphanumeric: 43, binary: 0, maxLength: 80, minLength: 1 },
    ITF14: { numeric: 14, alphanumeric: 0, binary: 0, maxLength: 14, minLength: 14 },
    MSI: { numeric: 15, alphanumeric: 0, binary: 0, maxLength: 15, minLength: 1 },
    pharmacode: { numeric: 6, alphanumeric: 0, binary: 0, maxLength: 6, minLength: 1 },
    codabar: { numeric: 16, alphanumeric: 4, binary: 0, maxLength: 16, minLength: 1 },
    CODE93: { numeric: 47, alphanumeric: 47, binary: 47, maxLength: 80, minLength: 1 },
  }

  return capacities[format] || capacities["CODE128"]
}

const calculateChecksum = (content: string, format: BarcodeFormat): string => {
  // Simplified checksum calculation
  switch (format) {
    case "EAN13":
    case "EAN8":
    case "UPC":
      return calculateEANChecksum(content)
    case "CODE128":
      return calculateCode128Checksum(content)
    default:
      return ""
  }
}

const calculateEANChecksum = (content: string): string => {
  const digits = content.replace(/\D/g, "")
  let sum = 0

  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }

  const checksum = (10 - (sum % 10)) % 10
  return checksum.toString()
}

const calculateCode128Checksum = (content: string): string => {
  let sum = 104 // Start B value

  for (let i = 0; i < content.length; i++) {
    const charCode = content.charCodeAt(i)
    const value = charCode - 32
    sum += value * (i + 1)
  }

  const checksum = sum % 103
  return checksum.toString()
}

const calculateQualityScore = (settings: BarcodeSettings, contentLength: number): number => {
  let score = 100

  // Penalize for poor contrast
  const contrast = calculateContrast(settings.lineColor, settings.backgroundColor)
  if (contrast < 3) score -= 30
  else if (contrast < 7) score -= 10

  // Penalize for very small or very large bars
  if (settings.width < 1) score -= 20
  if (settings.width > 5) score -= 10

  // Penalize for inappropriate height
  if (settings.height < 30) score -= 15
  if (settings.height > 200) score -= 10

  // Reward appropriate content length
  const capacity = getBarcodeCapacity(settings.format)
  if (contentLength > capacity.maxLength) score -= 25
  if (contentLength < capacity.minLength) score -= 15

  // Reward good margins
  if (settings.margin >= 10) score += 5

  return Math.max(0, Math.min(100, score))
}

const calculateReadabilityScore = (settings: BarcodeSettings): number => {
  let score = 100

  const contrast = calculateContrast(settings.lineColor, settings.backgroundColor)
  if (contrast < 4.5) score -= 25

  const aspectRatio = settings.height / settings.width
  if (aspectRatio < 10) score -= 15 // Too short
  if (aspectRatio > 100) score -= 10 // Too tall

  if (settings.margin < 5) score -= 10

  if (settings.displayValue && settings.fontSize < 8) score -= 10

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

const analyzeBarcode = (settings: BarcodeSettings, metadata: BarcodeMetadata): BarcodeAnalysis => {
  const readability = analyzeReadability(settings, metadata)
  const optimization = analyzeOptimization(settings, metadata)
  const compatibility = analyzeCompatibility(settings)
  const security = analyzeSecurity(settings)

  const recommendations: string[] = []
  const warnings: string[] = []

  // Generate recommendations
  if (readability.contrastRatio < 4.5) {
    recommendations.push("Increase contrast between bars and background")
  }

  if (settings.width < 2) {
    recommendations.push("Consider increasing bar width for better scanning")
  }

  if (settings.height < 50) {
    recommendations.push("Increase barcode height for better readability")
  }

  if (metadata.dataLength > metadata.capacity.maxLength) {
    warnings.push("Content exceeds maximum length for this format")
  }

  if (settings.margin < 10) {
    warnings.push("Small quiet zone may affect scanning reliability")
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

const analyzeReadability = (settings: BarcodeSettings, _metadata: BarcodeMetadata): BarcodeReadability => {
  const contrastRatio = calculateContrast(settings.lineColor, settings.backgroundColor)
  const barWidth = settings.width
  const quietZone = settings.margin
  const aspectRatio = settings.height / settings.width

  let readabilityScore = 100
  if (contrastRatio < 4.5) readabilityScore -= 30
  if (barWidth < 2) readabilityScore -= 20
  if (quietZone < 10) readabilityScore -= 15
  if (aspectRatio < 15) readabilityScore -= 10

  const scanDistance = barWidth >= 3 ? "Close (< 15cm)" : barWidth >= 2 ? "Medium (15-30cm)" : "Far (> 30cm)"

  const printQuality: "low" | "medium" | "high" =
    contrastRatio >= 7 && barWidth >= 2 ? "high" : contrastRatio >= 4.5 && barWidth >= 1.5 ? "medium" : "low"

  return {
    contrastRatio,
    barWidth,
    quietZone,
    aspectRatio,
    readabilityScore: Math.max(0, readabilityScore),
    scanDistance,
    lightingConditions: contrastRatio > 7 ? ["Bright", "Normal", "Dim"] : ["Bright", "Normal"],
    printQuality,
  }
}

const analyzeOptimization = (settings: BarcodeSettings, metadata: BarcodeMetadata): BarcodeOptimization => {
  const contentLength = settings.content.length
  const capacity = metadata.capacity.maxLength

  const dataEfficiency = Math.min(100, (contentLength / capacity) * 100)
  const sizeOptimization =
    settings.width <= 3 && settings.height <= 100
      ? 100
      : Math.max(0, 100 - ((settings.width - 3) * 10 + (settings.height - 100) * 0.5))
  const printOptimization =
    settings.width >= 2 && settings.height >= 50
      ? 100
      : Math.max(0, 100 - (settings.width < 2 ? 20 : 0) - (settings.height < 50 ? 15 : 0))
  const scanOptimization = metadata.readabilityScore

  const overallOptimization = (dataEfficiency + sizeOptimization + printOptimization + scanOptimization) / 4

  return {
    dataEfficiency,
    sizeOptimization,
    printOptimization,
    scanOptimization,
    overallOptimization,
  }
}

const analyzeCompatibility = (settings: BarcodeSettings): BarcodeCompatibility => {
  const scannerCompatibility = ["Laser scanners", "CCD scanners", "Image scanners"]
  const industryStandards = getIndustryStandards(settings.format)
  const printCompatibility = ["Thermal printers", "Inkjet printers", "Laser printers"]
  const softwareCompatibility = ["POS systems", "Inventory management", "Mobile apps"]
  const limitations: string[] = []

  if (settings.width < 2) {
    limitations.push("May not scan well with older laser scanners")
  }

  if (settings.height < 30) {
    limitations.push("May have issues with handheld scanners")
  }

  if (calculateContrast(settings.lineColor, settings.backgroundColor) < 3) {
    limitations.push("Poor contrast may cause scanning failures")
  }

  return {
    scannerCompatibility,
    industryStandards,
    printCompatibility,
    softwareCompatibility,
    limitations,
  }
}

const getIndustryStandards = (format: BarcodeFormat): string[] => {
  const standards: Record<BarcodeFormat, string[]> = {
    CODE128: ["GS1-128", "ISBT 128", "USS Code 128"],
    EAN13: ["GS1", "ISO/IEC 15420"],
    EAN8: ["GS1", "ISO/IEC 15420"],
    UPC: ["GS1", "UCC-12"],
    CODE39: ["ANSI MH10.8M", "ISO/IEC 16388"],
    ITF14: ["GS1", "ITF-14"],
    MSI: ["MSI Plessey"],
    pharmacode: ["Pharmaceutical Binary Code"],
    codabar: ["NW-7", "USD-4"],
    CODE93: ["USS-93"],
  }

  return standards[format] || ["Custom format"]
}

const analyzeSecurity = (settings: BarcodeSettings): BarcodeSecurity => {
  let dataExposure: DataExposure = "medium" // Barcodes are generally readable
  let privacy_level: DataExposure = "low" // Data is visible
  const vulnerabilities: string[] = []
  const recommendations: string[] = []

  // Analyze content for sensitive data
  if (settings.content.includes("password") || settings.content.includes("secret")) {
    dataExposure = "high"
    vulnerabilities.push("Contains potentially sensitive information")
    recommendations.push("Avoid including passwords or secrets in barcodes")
  }

  if (/\d{13,19}/.test(settings.content)) {
    dataExposure = "high"
    vulnerabilities.push("May contain credit card or sensitive numeric data")
  }

  if (settings.content.length > 20) {
    dataExposure = "medium"
    vulnerabilities.push("Long content may contain sensitive information")
  }

  // Barcodes are inherently not secure for sensitive data
  vulnerabilities.push("Barcode data is easily readable by anyone with a scanner")
  recommendations.push("Use encryption or encoding for sensitive data")
  recommendations.push("Consider using 2D codes like QR codes for better data capacity")

  let securityScore: number
  switch (dataExposure as DataExposure) {
    case "low":
      securityScore = 60
      break
    case "medium":
      securityScore = 40
      break
    case "high":
    default:
      securityScore = 20
      break
  }

  return {
    dataExposure,
    tampering_resistance: "low", // Barcodes are easy to reproduce
    privacy_level,
    security_score: securityScore,
    vulnerabilities,
    recommendations,
  }
}

// Barcode Templates
export const barcodeTemplates: BarcodeTemplate[] = [
  {
    id: "product-code128",
    name: "Product Code (CODE128)",
    description: "Standard product barcode with CODE128 format",
    category: "Retail",
    format: "CODE128",
    settings: {
      content: "PROD123456789",
      format: "CODE128",
      width: 2,
      height: 80,
      displayValue: true,
      backgroundColor: "#ffffff",
      lineColor: "#000000",
      fontSize: 12,
      fontFamily: "Arial",
      textAlign: "center",
      textPosition: "bottom",
      textMargin: 5,
      margin: 15,
      customization: {
        showBorder: false,
        borderWidth: 1,
        borderColor: "#000000",
        showQuietZone: true,
        quietZoneSize: 10,
        customFont: false,
        fontWeight: "normal",
        textCase: "none",
      },
    },
    useCase: ["Product identification", "Inventory management", "Point of sale", "Warehouse tracking"],
    examples: ["SKU codes", "Product IDs", "Serial numbers", "Batch numbers"],
    preview: "Standard black and white barcode with text below",
  },
  {
    id: "ean13-retail",
    name: "EAN-13 Retail",
    description: "International retail barcode standard",
    category: "Retail",
    format: "EAN13",
    settings: {
      content: "1234567890123",
      format: "EAN13",
      width: 1.5,
      height: 60,
      displayValue: true,
      backgroundColor: "#ffffff",
      lineColor: "#000000",
      fontSize: 10,
      fontFamily: "Arial",
      textAlign: "center",
      textPosition: "bottom",
      textMargin: 3,
      margin: 10,
      customization: {
        showBorder: false,
        borderWidth: 1,
        borderColor: "#000000",
        showQuietZone: true,
        quietZoneSize: 8,
        customFont: false,
        fontWeight: "normal",
        textCase: "none",
      },
    },
    useCase: ["Retail products", "Grocery items", "Consumer goods", "International trade"],
    examples: ["Product barcodes", "ISBN numbers", "GTIN codes", "UPC codes"],
    preview: "Compact retail barcode with standard dimensions",
  },
  {
    id: "shipping-code39",
    name: "Shipping Label (CODE39)",
    description: "Alphanumeric shipping and logistics barcode",
    category: "Logistics",
    format: "CODE39",
    settings: {
      content: "SHIP123ABC",
      format: "CODE39",
      width: 2.5,
      height: 100,
      displayValue: true,
      backgroundColor: "#ffffff",
      lineColor: "#000000",
      fontSize: 14,
      fontFamily: "Arial",
      textAlign: "center",
      textPosition: "bottom",
      textMargin: 8,
      margin: 20,
      customization: {
        showBorder: true,
        borderWidth: 2,
        borderColor: "#000000",
        showQuietZone: true,
        quietZoneSize: 15,
        customFont: false,
        fontWeight: "bold",
        textCase: "uppercase",
      },
    },
    useCase: ["Shipping labels", "Package tracking", "Logistics", "Warehouse management"],
    examples: ["Tracking numbers", "Package IDs", "Route codes", "Delivery references"],
    preview: "Bold barcode with border for shipping applications",
  },
  {
    id: "pharmaceutical",
    name: "Pharmaceutical Code",
    description: "Specialized barcode for pharmaceutical products",
    category: "Healthcare",
    format: "pharmacode",
    settings: {
      content: "12345",
      format: "pharmacode",
      width: 1,
      height: 40,
      displayValue: true,
      backgroundColor: "#ffffff",
      lineColor: "#000000",
      fontSize: 8,
      fontFamily: "Arial",
      textAlign: "center",
      textPosition: "bottom",
      textMargin: 3,
      margin: 5,
      customization: {
        showBorder: false,
        borderWidth: 1,
        borderColor: "#000000",
        showQuietZone: true,
        quietZoneSize: 5,
        customFont: false,
        fontWeight: "normal",
        textCase: "none",
      },
    },
    useCase: ["Pharmaceutical packaging", "Drug identification", "Medical supplies", "Healthcare tracking"],
    examples: ["Drug codes", "Batch numbers", "Expiry tracking", "Medical device IDs"],
    preview: "Compact pharmaceutical barcode for small packages",
  },
  {
    id: "library-codabar",
    name: "Library Book (Codabar)",
    description: "Traditional library and blood bank barcode",
    category: "Library",
    format: "codabar",
    settings: {
      content: "A123456B",
      format: "codabar",
      width: 2,
      height: 70,
      displayValue: true,
      backgroundColor: "#ffffff",
      lineColor: "#000000",
      fontSize: 11,
      fontFamily: "Arial",
      textAlign: "center",
      textPosition: "bottom",
      textMargin: 5,
      margin: 12,
      customization: {
        showBorder: false,
        borderWidth: 1,
        borderColor: "#000000",
        showQuietZone: true,
        quietZoneSize: 10,
        customFont: false,
        fontWeight: "normal",
        textCase: "uppercase",
      },
    },
    useCase: ["Library books", "Blood banks", "Photo labs", "Membership cards"],
    examples: ["Book IDs", "Member numbers", "Blood bag tracking", "Photo order numbers"],
    preview: "Classic library-style barcode with start/stop characters",
  },
  {
    id: "high-density",
    name: "High Density (CODE93)",
    description: "Compact barcode for space-constrained applications",
    category: "Industrial",
    format: "CODE93",
    settings: {
      content: "HD123ABC",
      format: "CODE93",
      width: 1,
      height: 50,
      displayValue: true,
      backgroundColor: "#ffffff",
      lineColor: "#000000",
      fontSize: 9,
      fontFamily: "Arial",
      textAlign: "center",
      textPosition: "bottom",
      textMargin: 3,
      margin: 8,
      customization: {
        showBorder: false,
        borderWidth: 1,
        borderColor: "#000000",
        showQuietZone: true,
        quietZoneSize: 6,
        customFont: false,
        fontWeight: "normal",
        textCase: "uppercase",
      },
    },
    useCase: ["Small labels", "Component marking", "Industrial tracking", "Space-limited applications"],
    examples: ["Component IDs", "Small part numbers", "Circuit board labels", "Tool tracking"],
    preview: "Compact high-density barcode for small spaces",
  },
]

// Validation functions
export const validateBarcodeSettings = (settings: BarcodeSettings): BarcodeValidation => {
  // Estimate barcode size first
  const estimatedWidth = settings.width * settings.content.length + settings.margin * 2
  const estimatedHeight =
    settings.height + settings.margin * 2 + (settings.displayValue ? settings.fontSize + settings.textMargin : 0)
  
  const validation: BarcodeValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    estimatedSize: estimatedWidth * estimatedHeight,
    width: estimatedWidth,
    height: estimatedHeight,
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

  // Format-specific content validation
  const capacity = getBarcodeCapacity(settings.format)

  if (settings.content.length > capacity.maxLength) {
    validation.isValid = false
    validation.errors.push({
      message: `Content exceeds maximum length of ${capacity.maxLength} for ${settings.format}`,
      type: "content",
      severity: "error",
    })
  }

  if (settings.content.length < capacity.minLength) {
    validation.isValid = false
    validation.errors.push({
      message: `Content must be at least ${capacity.minLength} characters for ${settings.format}`,
      type: "content",
      severity: "error",
    })
  }

  // Format-specific character validation
  if (!validateFormatContent(settings.content, settings.format)) {
    validation.isValid = false
    validation.errors.push({
      message: `Content contains invalid characters for ${settings.format} format`,
      type: "content",
      severity: "error",
    })
  }

  // Size validation
  if (settings.width < 0.5) {
    validation.isValid = false
    validation.errors.push({
      message: "Bar width must be at least 0.5",
      type: "size",
      severity: "error",
    })
  }

  if (settings.width > 10) {
    validation.warnings.push("Very wide bars may cause scanning issues")
    validation.suggestions.push("Consider reducing bar width for better compatibility")
  }

  if (settings.height < 20) {
    validation.isValid = false
    validation.errors.push({
      message: "Height must be at least 20 pixels",
      type: "size",
      severity: "error",
    })
  }

  if (settings.height > 500) {
    validation.warnings.push("Very tall barcodes may have printing issues")
    validation.suggestions.push("Consider reducing height for better printability")
  }

  // Color validation
  const contrast = calculateContrast(settings.lineColor, settings.backgroundColor)
  if (contrast < 3) {
    validation.errors.push({
      message: "Insufficient contrast between bars and background",
      type: "settings",
      severity: "error",
    })
    validation.isValid = false
  } else if (contrast < 4.5) {
    validation.warnings.push("Low contrast may affect scanning reliability")
    validation.suggestions.push("Increase contrast for better readability")
  }

  // Margin validation
  if (settings.margin < 5) {
    validation.warnings.push("Small quiet zone may affect scanning")
    validation.suggestions.push("Increase margin to at least 10 pixels")
  }

  // Font size validation
  if (settings.displayValue && settings.fontSize < 6) {
    validation.warnings.push("Very small font may be difficult to read")
    validation.suggestions.push("Increase font size for better readability")
  }

  // Recommend optimal settings
  validation.recommendedSettings = {
    ...settings,
    width: Math.max(1.5, Math.min(3, settings.width)),
    height: Math.max(50, Math.min(100, settings.height)),
    margin: Math.max(10, settings.margin),
    fontSize: settings.displayValue ? Math.max(8, settings.fontSize) : settings.fontSize,
  }

  return validation
}

const validateFormatContent = (content: string, format: BarcodeFormat): boolean => {
  switch (format) {
    case "EAN13":
    case "EAN8":
    case "UPC":
    case "ITF14":
    case "MSI":
    case "pharmacode":
      return /^\d+$/.test(content) // Numeric only
    case "CODE39":
      return /^[A-Z0-9\-. $/+%]+$/.test(content) // CODE39 character set
    case "CODE128":
    case "CODE93":
      return /^[^\x00-\x1F\x7F]+$/.test(content) // ASCII printable characters
    case "codabar":
      return /^[A-D][0-9\-$:/.+]+[A-D]$/.test(content) // Codabar format
    default:
      return true
  }
}

// Custom hooks
export const useBarcodeGenerator = () => {
  const [barcodes, setBarcodes] = useState<BarcodeResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // 修正递归调用，重命名为 generateBarcodeInternal
  const generateBarcodeInternal = useCallback(async (settings: BarcodeSettings): Promise<BarcodeResult> => {
    setIsGenerating(true)
    try {
      const result = await generateBarcode(settings) // 这里调用外部的 generateBarcode 工具函数
      setBarcodes((prev) => [result, ...prev])
      return result
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const generateBatch = useCallback(
    async (batchSettings: BatchSettings): Promise<BarcodeBatch> => {
      setIsGenerating(true)
      const startTime = performance.now()

      try {
        const batch: BarcodeBatch = {
          id: nanoid(),
          name: batchSettings.namingPattern || "Barcode Batch",
          barcodes: [],
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
            formatDistribution: {},
          },
          createdAt: new Date(),
        }

        const results: BarcodeResult[] = []

        for (let i = 0; i < batchSettings.contentList.length; i++) {
          const content = batchSettings.contentList[i]
          const settings: BarcodeSettings = {
            ...batchSettings.baseSettings,
            content,
          }

          try {
            const result = await generateBarcodeInternal(settings)
            results.push(result)

            // Update progress
            const progress = ((i + 1) / batchSettings.contentList.length) * 100
            batch.progress = progress
          } catch (error) {
            const failedResult: BarcodeResult = {
              id: nanoid(),
              content,
              format: settings.format,
              width: settings.width,
              height: settings.height,
              displayValue: settings.displayValue,
              backgroundColor: settings.backgroundColor,
              lineColor: settings.lineColor,
              fontSize: settings.fontSize,
              fontFamily: settings.fontFamily,
              textAlign: settings.textAlign,
              textPosition: settings.textPosition,
              textMargin: settings.textMargin,
              margin: settings.margin,
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
          averageSize:
            successful.reduce((sum, r) => sum + (r.metadata?.actualSize.width || 0), 0) / successful.length || 0,
          averageQuality:
            successful.reduce((sum, r) => sum + (r.metadata?.qualityScore || 0), 0) / successful.length || 0,
          totalProcessingTime,
          averageProcessingTime: totalProcessingTime / results.length,
          sizeDistribution: {},
          formatDistribution: {},
        }

        // Calculate distributions
        successful.forEach((result) => {
          const sizeRange = `${Math.floor((result.metadata?.actualSize.width || 0) / 100) * 100}-${Math.floor((result.metadata?.actualSize.width || 0) / 100) * 100 + 99}`
          statistics.sizeDistribution[sizeRange] = (statistics.sizeDistribution[sizeRange] || 0) + 1
          statistics.formatDistribution[result.format] = (statistics.formatDistribution[result.format] || 0) + 1
        })

        batch.barcodes = results
        batch.status = "completed"
        batch.progress = 100
        batch.statistics = statistics
        batch.completedAt = new Date()

        setBarcodes((prev) => [...results, ...prev])
        return batch
      } finally {
        setIsGenerating(false)
      }
    },
    [generateBarcodeInternal]
  )

  const removeBarcode = useCallback((id: string) => {
    setBarcodes((prev) => prev.filter((barcode) => barcode.id !== id))
  }, [])

  const clearBarcodes = useCallback(() => {
    setBarcodes([])
  }, [])

  return {
    barcodes,
    isGenerating,
    generateBarcode: generateBarcodeInternal, // 返回修正后的 generateBarcode
    generateBatch,
    removeBarcode,
    clearBarcodes,
  }
}

// Copy to clipboard functionality
export const useCopyToClipboard = () => {
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
export const useBarcodeExport = () => {
  const downloadBarcode = useCallback((barcode: BarcodeResult, filename?: string) => {
    if (!barcode.dataUrl) return

    const link = document.createElement("a")
    link.href = barcode.dataUrl
    link.download = filename || `barcode-${barcode.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const downloadSVG = useCallback((barcode: BarcodeResult, filename?: string) => {
    if (!barcode.svgString) return

    const blob = new Blob([barcode.svgString], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `barcode-${barcode.id}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (batch: BarcodeBatch, _format: ExportFormat) => {
      // Implementation would depend on the format
      // For now, just download individual files
      batch.barcodes.forEach((barcode, index) => {
        if (barcode.isValid && barcode.dataUrl) {
          setTimeout(() => {
            downloadBarcode(barcode, `${batch.name}-${index + 1}.png`)
          }, index * 100) // Stagger downloads
        }
      })
    },
    [downloadBarcode]
  )

  return { downloadBarcode, downloadSVG, exportBatch }
}
