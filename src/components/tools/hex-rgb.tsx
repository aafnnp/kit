import React, { useCallback, useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Palette,
  Code,
  Upload,
  FileImage,
  Trash2,
  Target,
  Copy,
  Check,
  BarChart3,
  Eye,
  Shuffle,
  Accessibility,
  ArrowLeftRight,
} from 'lucide-react'

// Types
interface ColorConversionFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  conversionData?: ConversionData
}

interface ConversionData {
  conversions: ColorConversion[]
  statistics: ConversionStatistics
  settings: ConversionSettings
}

interface ColorConversion {
  original: string
  originalFormat: ColorFormat
  converted: ConvertedColor
  isValid: boolean
  error?: string
}

interface ConvertedColor {
  hex: string
  rgb: RGB
  hsl: HSL
  hsv: HSV
  cmyk: CMYK
  lab: LAB
  accessibility: AccessibilityInfo
}

interface RGB {
  r: number
  g: number
  b: number
}

interface HSL {
  h: number
  s: number
  l: number
}

interface HSV {
  h: number
  s: number
  v: number
}

interface CMYK {
  c: number
  m: number
  y: number
  k: number
}

interface LAB {
  l: number
  a: number
  b: number
}

interface AccessibilityInfo {
  contrastRatios: {
    white: number
    black: number
  }
  wcagAA: {
    normal: boolean
    large: boolean
  }
  wcagAAA: {
    normal: boolean
    large: boolean
  }
  colorBlindSafe: boolean
}

interface ConversionStatistics {
  totalConversions: number
  successfulConversions: number
  failedConversions: number
  formatDistribution: Record<ColorFormat, number>
  averageAccessibilityScore: number
  processingTime: number
}

interface ConversionSettings {
  inputFormat: ColorFormat
  outputFormat: ColorFormat
  includeAccessibility: boolean
  validateColors: boolean
  preserveCase: boolean
  batchMode: boolean
}

interface ConversionTemplate {
  id: string
  name: string
  description: string
  inputFormat: ColorFormat
  outputFormat: ColorFormat
  examples: {
    input: string
    output: string
  }[]
}

// Enums
type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk' | 'lab'

// Utility functions
const generateId = (): string => Math.random().toString(36).substring(2, 11)

const validateColorFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['.json', '.css', '.scss', '.txt', '.csv']

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' }
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: 'Only JSON, CSS, SCSS, TXT, and CSV files are supported' }
  }

  return { isValid: true }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Enhanced color conversion functions
const hexToRgb = (hex: string): RGB | null => {
  // Remove # if present and validate
  const cleanHex = hex.replace('#', '')

  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    const expandedHex = cleanHex
      .split('')
      .map((char) => char + char)
      .join('')
    return hexToRgb('#' + expandedHex)
  }

  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }

  return null
}

const rgbToHex = (rgb: RGB): string => {
  const toHex = (c: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

const rgbToHsl = (rgb: RGB): HSL => {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

const rgbToHsv = (rgb: RGB): HSV => {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  const s = max === 0 ? 0 : diff / max
  const v = max

  if (diff !== 0) {
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / diff + 2
        break
      case b:
        h = (r - g) / diff + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  }
}

const rgbToCmyk = (rgb: RGB): CMYK => {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const k = 1 - Math.max(r, g, b)
  const c = k === 1 ? 0 : (1 - r - k) / (1 - k)
  const m = k === 1 ? 0 : (1 - g - k) / (1 - k)
  const y = k === 1 ? 0 : (1 - b - k) / (1 - k)

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  }
}

const rgbToLab = (rgb: RGB): LAB => {
  // Convert RGB to XYZ
  let r = rgb.r / 255
  let g = rgb.g / 255
  let b = rgb.b / 255

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116

  return {
    l: Math.round(116 * y - 16),
    a: Math.round(500 * (x - y)),
    b: Math.round(200 * (y - z)),
  }
}

// Parse color from string based on format
const parseColorFromString = (colorStr: string, format: ColorFormat): RGB | null => {
  const trimmed = colorStr.trim()

  switch (format) {
    case 'hex':
      return hexToRgb(trimmed)

    case 'rgb':
      const rgbMatch = trimmed.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
      if (rgbMatch) {
        return {
          r: parseInt(rgbMatch[1]),
          g: parseInt(rgbMatch[2]),
          b: parseInt(rgbMatch[3]),
        }
      }
      // Also try comma-separated values
      const csvMatch = trimmed.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/)
      if (csvMatch) {
        return {
          r: parseInt(csvMatch[1]),
          g: parseInt(csvMatch[2]),
          b: parseInt(csvMatch[3]),
        }
      }
      return null

    default:
      // Try to auto-detect
      if (trimmed.startsWith('#')) {
        return hexToRgb(trimmed)
      } else if (trimmed.includes('rgb')) {
        return parseColorFromString(trimmed, 'rgb')
      }
      return null
  }
}

// Accessibility functions
const calculateContrastRatio = (color1: RGB, color2: RGB): number => {
  const getLuminance = (rgb: RGB): number => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

const getAccessibilityInfo = (rgb: RGB): AccessibilityInfo => {
  const white = { r: 255, g: 255, b: 255 }
  const black = { r: 0, g: 0, b: 0 }

  const contrastWhite = calculateContrastRatio(rgb, white)
  const contrastBlack = calculateContrastRatio(rgb, black)

  return {
    contrastRatios: {
      white: Math.round(contrastWhite * 100) / 100,
      black: Math.round(contrastBlack * 100) / 100,
    },
    wcagAA: {
      normal: Math.max(contrastWhite, contrastBlack) >= 4.5,
      large: Math.max(contrastWhite, contrastBlack) >= 3,
    },
    wcagAAA: {
      normal: Math.max(contrastWhite, contrastBlack) >= 7,
      large: Math.max(contrastWhite, contrastBlack) >= 4.5,
    },
    colorBlindSafe: isColorBlindSafe(rgb),
  }
}

const isColorBlindSafe = (rgb: RGB): boolean => {
  // Simplified color blind safety check
  const { r, g, b } = rgb
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  const rg_diff = Math.abs(r - g)
  const rb_diff = Math.abs(r - b)
  const gb_diff = Math.abs(g - b)

  return brightness > 125 && rg_diff + rb_diff + gb_diff > 500
}

// Format color to string
const formatColorToString = (color: ConvertedColor, format: ColorFormat, preserveCase: boolean = false): string => {
  switch (format) {
    case 'hex':
      return preserveCase ? color.hex : color.hex.toUpperCase()
    case 'rgb':
      return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
    case 'hsl':
      return `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`
    case 'hsv':
      return `hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)`
    case 'cmyk':
      return `cmyk(${color.cmyk.c}%, ${color.cmyk.m}%, ${color.cmyk.y}%, ${color.cmyk.k}%)`
    case 'lab':
      return `lab(${color.lab.l}, ${color.lab.a}, ${color.lab.b})`
    default:
      return color.hex
  }
}

// Create complete color conversion
const createColorConversion = (input: string, inputFormat: ColorFormat): ColorConversion => {
  const rgb = parseColorFromString(input, inputFormat)

  if (!rgb) {
    return {
      original: input,
      originalFormat: inputFormat,
      converted: {} as ConvertedColor,
      isValid: false,
      error: 'Invalid color format',
    }
  }

  const converted: ConvertedColor = {
    hex: rgbToHex(rgb),
    rgb,
    hsl: rgbToHsl(rgb),
    hsv: rgbToHsv(rgb),
    cmyk: rgbToCmyk(rgb),
    lab: rgbToLab(rgb),
    accessibility: getAccessibilityInfo(rgb),
  }

  return {
    original: input,
    originalFormat: inputFormat,
    converted,
    isValid: true,
  }
}

// Conversion templates
const conversionTemplates: ConversionTemplate[] = [
  {
    id: 'hex-to-rgb',
    name: 'HEX to RGB',
    description: 'Convert hexadecimal colors to RGB format',
    inputFormat: 'hex',
    outputFormat: 'rgb',
    examples: [
      { input: '#FF0000', output: 'rgb(255, 0, 0)' },
      { input: '#00FF00', output: 'rgb(0, 255, 0)' },
      { input: '#0000FF', output: 'rgb(0, 0, 255)' },
    ],
  },
  {
    id: 'rgb-to-hex',
    name: 'RGB to HEX',
    description: 'Convert RGB colors to hexadecimal format',
    inputFormat: 'rgb',
    outputFormat: 'hex',
    examples: [
      { input: 'rgb(255, 0, 0)', output: '#FF0000' },
      { input: 'rgb(0, 255, 0)', output: '#00FF00' },
      { input: 'rgb(0, 0, 255)', output: '#0000FF' },
    ],
  },
  {
    id: 'hex-to-hsl',
    name: 'HEX to HSL',
    description: 'Convert hexadecimal colors to HSL format',
    inputFormat: 'hex',
    outputFormat: 'hsl',
    examples: [
      { input: '#FF0000', output: 'hsl(0, 100%, 50%)' },
      { input: '#00FF00', output: 'hsl(120, 100%, 50%)' },
      { input: '#0000FF', output: 'hsl(240, 100%, 50%)' },
    ],
  },
  {
    id: 'rgb-to-cmyk',
    name: 'RGB to CMYK',
    description: 'Convert RGB colors to CMYK format for printing',
    inputFormat: 'rgb',
    outputFormat: 'cmyk',
    examples: [
      { input: 'rgb(255, 0, 0)', output: 'cmyk(0%, 100%, 100%, 0%)' },
      { input: 'rgb(0, 255, 0)', output: 'cmyk(100%, 0%, 100%, 0%)' },
      { input: 'rgb(0, 0, 255)', output: 'cmyk(100%, 100%, 0%, 0%)' },
    ],
  },
]

// Process color conversions
const processColorConversions = (colors: string[], settings: ConversionSettings): ConversionData => {
  const startTime = performance.now()

  try {
    const conversions = colors.map((color) => createColorConversion(color, settings.inputFormat))

    const successfulConversions = conversions.filter((c) => c.isValid).length
    const failedConversions = conversions.length - successfulConversions

    const formatDistribution: Record<ColorFormat, number> = {
      hex: 0,
      rgb: 0,
      hsl: 0,
      hsv: 0,
      cmyk: 0,
      lab: 0,
    }

    conversions.forEach((conversion) => {
      if (conversion.isValid) {
        formatDistribution[conversion.originalFormat]++
      }
    })

    const averageAccessibilityScore =
      (conversions
        .filter((c) => c.isValid)
        .reduce((sum, c) => {
          const score =
            (c.converted.accessibility.wcagAA.normal ? 2 : 0) +
            (c.converted.accessibility.wcagAAA.normal ? 2 : 0) +
            (c.converted.accessibility.colorBlindSafe ? 1 : 0)
          return sum + score
        }, 0) /
        (successfulConversions * 5)) *
      100

    const statistics: ConversionStatistics = {
      totalConversions: conversions.length,
      successfulConversions,
      failedConversions,
      formatDistribution,
      averageAccessibilityScore,
      processingTime: performance.now() - startTime,
    }

    return {
      conversions,
      statistics,
      settings,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Color conversion failed')
  }
}

// Error boundary component
class HexRgbErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('HEX-RGB Converter error:', error, errorInfo)
    toast.error('An unexpected error occurred during color conversion')
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
const useColorConversion = () => {
  const convertColor = useCallback((input: string, inputFormat: ColorFormat): ColorConversion => {
    try {
      return createColorConversion(input, inputFormat)
    } catch (error) {
      console.error('Color conversion error:', error)
      throw new Error(error instanceof Error ? error.message : 'Color conversion failed')
    }
  }, [])

  const convertBatch = useCallback((colors: string[], settings: ConversionSettings): ConversionData => {
    try {
      return processColorConversions(colors, settings)
    } catch (error) {
      console.error('Batch conversion error:', error)
      throw new Error(error instanceof Error ? error.message : 'Batch conversion failed')
    }
  }, [])

  const processBatch = useCallback(
    async (files: ColorConversionFile[], settings: ConversionSettings): Promise<ColorConversionFile[]> => {
      return Promise.all(
        files.map(async (file) => {
          if (file.status !== 'pending') return file

          try {
            // Parse colors from file content
            const colors = parseColorsFromContent(file.content, file.type)
            const conversionData = convertBatch(colors, settings)

            return {
              ...file,
              status: 'completed' as const,
              conversionData,
              processedAt: new Date(),
            }
          } catch (error) {
            return {
              ...file,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Processing failed',
            }
          }
        })
      )
    },
    [convertBatch]
  )

  return { convertColor, convertBatch, processBatch }
}

// Parse colors from file content
const parseColorsFromContent = (content: string, fileType: string): string[] => {
  const colors: string[] = []

  if (fileType.includes('json')) {
    try {
      const data = JSON.parse(content)
      if (Array.isArray(data)) {
        colors.push(...data.filter((item) => typeof item === 'string'))
      } else if (data.colors && Array.isArray(data.colors)) {
        colors.push(...data.colors.filter((item: any) => typeof item === 'string'))
      }
    } catch (error) {
      throw new Error('Invalid JSON format')
    }
  } else if (fileType.includes('css') || fileType.includes('scss')) {
    // Extract colors from CSS
    const hexMatches = content.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/g)
    const rgbMatches = content.match(/rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g)

    if (hexMatches) {
      colors.push(
        ...hexMatches.map((hex) => (hex.length === 4 ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex))
      )
    }
    if (rgbMatches) {
      colors.push(...rgbMatches)
    }
  } else if (fileType.includes('csv')) {
    // Parse CSV format
    const lines = content.split('\n').filter((line) => line.trim())
    lines.forEach((line) => {
      const values = line.split(',').map((v) => v.trim())
      colors.push(...values.filter((v) => v.startsWith('#') || v.includes('rgb')))
    })
  } else {
    // Extract colors from plain text
    const hexMatches = content.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/g)
    const rgbMatches = content.match(/rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g)

    if (hexMatches) {
      colors.push(
        ...hexMatches.map((hex) => (hex.length === 4 ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex))
      )
    }
    if (rgbMatches) {
      colors.push(...rgbMatches)
    }
  }

  if (colors.length === 0) {
    throw new Error('No valid colors found in file')
  }

  return [...new Set(colors)] // Remove duplicates
}

// Real-time color conversion hook
const useRealTimeConversion = (input: string, inputFormat: ColorFormat, outputFormat: ColorFormat) => {
  return useMemo(() => {
    if (!input.trim()) {
      return {
        conversion: null,
        error: null,
        isEmpty: true,
      }
    }

    try {
      const conversion = createColorConversion(input, inputFormat)
      return {
        conversion,
        error: conversion.isValid ? null : conversion.error,
        isEmpty: false,
      }
    } catch (error) {
      return {
        conversion: null,
        error: error instanceof Error ? error.message : 'Conversion failed',
        isEmpty: false,
      }
    }
  }, [input, inputFormat, outputFormat])
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<ColorConversionFile> => {
    const validation = validateColorFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const colorFile: ColorConversionFile = {
            id: generateId(),
            name: file.name,
            content,
            size: file.size,
            type: file.type || 'text/plain',
            status: 'pending',
          }

          resolve(colorFile)
        } catch (error) {
          reject(new Error('Failed to process file'))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<ColorConversionFile[]> => {
      const results = await Promise.allSettled(files.map((file) => processFile(file)))

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            id: generateId(),
            name: files[index].name,
            content: '',
            size: files[index].size,
            type: files[index].type || 'text/plain',
            status: 'error' as const,
            error: result.reason.message || 'Processing failed',
          }
        }
      })
    },
    [processFile]
  )

  return { processFile, processBatch }
}

// Export functionality
const useColorExport = () => {
  const exportConversions = useCallback((conversionData: ConversionData, format: string, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'css':
        content = generateCSSExport(conversionData.conversions)
        mimeType = 'text/css'
        extension = '.css'
        break
      case 'scss':
        content = generateSCSSExport(conversionData.conversions)
        mimeType = 'text/scss'
        extension = '.scss'
        break
      case 'json':
        content = JSON.stringify(
          {
            conversions: conversionData.conversions.map((c) => ({
              original: c.original,
              originalFormat: c.originalFormat,
              converted: c.isValid
                ? {
                    hex: c.converted.hex,
                    rgb: c.converted.rgb,
                    hsl: c.converted.hsl,
                    hsv: c.converted.hsv,
                    cmyk: c.converted.cmyk,
                    lab: c.converted.lab,
                    accessibility: c.converted.accessibility,
                  }
                : null,
              isValid: c.isValid,
              error: c.error,
            })),
            statistics: conversionData.statistics,
            settings: conversionData.settings,
          },
          null,
          2
        )
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVExport(conversionData.conversions)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      default:
        content = conversionData.conversions
          .filter((c) => c.isValid)
          .map((c) => formatColorToString(c.converted, conversionData.settings.outputFormat))
          .join('\n')
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `color-conversions${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: ColorConversionFile[]) => {
      const completedFiles = files.filter((f) => f.conversionData)

      if (completedFiles.length === 0) {
        toast.error('No color conversions to export')
        return
      }

      completedFiles.forEach((file) => {
        if (file.conversionData) {
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          exportConversions(file.conversionData, 'json', `${baseName}-conversions.json`)
        }
      })

      toast.success(`Exported ${completedFiles.length} color conversion(s)`)
    },
    [exportConversions]
  )

  const exportStatistics = useCallback((files: ColorConversionFile[]) => {
    const stats = files
      .filter((f) => f.conversionData)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.size),
        totalConversions: file.conversionData!.statistics.totalConversions,
        successfulConversions: file.conversionData!.statistics.successfulConversions,
        failedConversions: file.conversionData!.statistics.failedConversions,
        averageAccessibilityScore: file.conversionData!.statistics.averageAccessibilityScore.toFixed(1),
        processingTime: `${file.conversionData!.statistics.processingTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      [
        'Filename',
        'Original Size',
        'Total Conversions',
        'Successful',
        'Failed',
        'Avg Accessibility Score',
        'Processing Time',
        'Status',
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.totalConversions.toString(),
        stat.successfulConversions.toString(),
        stat.failedConversions.toString(),
        stat.averageAccessibilityScore,
        stat.processingTime,
        stat.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'color-conversion-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportConversions, exportBatch, exportStatistics }
}

// Generate export formats
const generateCSSExport = (conversions: ColorConversion[]): string => {
  const validConversions = conversions.filter((c) => c.isValid)
  return `:root {\n${validConversions
    .map((conversion, index) => `  --color-${index + 1}: ${conversion.converted.hex};`)
    .join('\n')}\n}`
}

const generateSCSSExport = (conversions: ColorConversion[]): string => {
  const validConversions = conversions.filter((c) => c.isValid)
  return validConversions.map((conversion, index) => `$color-${index + 1}: ${conversion.converted.hex};`).join('\n')
}

const generateCSVExport = (conversions: ColorConversion[]): string => {
  const headers = ['Original', 'Original Format', 'HEX', 'RGB', 'HSL', 'HSV', 'CMYK', 'LAB', 'Valid', 'Error']
  const rows = conversions.map((c) => [
    c.original,
    c.originalFormat,
    c.isValid ? c.converted.hex : '',
    c.isValid ? `rgb(${c.converted.rgb.r}, ${c.converted.rgb.g}, ${c.converted.rgb.b})` : '',
    c.isValid ? `hsl(${c.converted.hsl.h}, ${c.converted.hsl.s}%, ${c.converted.hsl.l}%)` : '',
    c.isValid ? `hsv(${c.converted.hsv.h}, ${c.converted.hsv.s}%, ${c.converted.hsv.v}%)` : '',
    c.isValid
      ? `cmyk(${c.converted.cmyk.c}%, ${c.converted.cmyk.m}%, ${c.converted.cmyk.y}%, ${c.converted.cmyk.k}%)`
      : '',
    c.isValid ? `lab(${c.converted.lab.l}, ${c.converted.lab.a}, ${c.converted.lab.b})` : '',
    c.isValid ? 'Yes' : 'No',
    c.error || '',
  ])

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
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

  const copyColorValue = useCallback(
    async (color: ConvertedColor, format: ColorFormat, label?: string) => {
      const value = formatColorToString(color, format)
      await copyToClipboard(value, label || `${format.toUpperCase()} color`)
    },
    [copyToClipboard]
  )

  return { copyToClipboard, copyColorValue, copiedText }
}

// File drag and drop functionality
const useDragAndDrop = (onFilesDropped: (files: File[]) => void) => {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files).filter((file) => file.name.match(/\.(json|css|scss|txt|csv)$/i))

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error('Please drop only JSON, CSS, SCSS, TXT, or CSV files')
      }
    },
    [onFilesDropped]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        onFilesDropped(files)
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [onFilesDropped]
  )

  return {
    dragActive,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileInput,
  }
}

/**
 * Enhanced HEX-RGB Converter Tool
 * Features: Real-time color conversion, batch processing, multiple formats, accessibility checking
 */
const HexRgbCore = () => {
  const [activeTab, setActiveTab] = useState<'converter' | 'files'>('converter')
  const [inputColor, setInputColor] = useState('#3498db')
  const [files, setFiles] = useState<ColorConversionFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('hex-to-rgb')
  const [settings, setSettings] = useState<ConversionSettings>({
    inputFormat: 'hex',
    outputFormat: 'rgb',
    includeAccessibility: true,
    validateColors: true,
    preserveCase: false,
    batchMode: false,
  })

  const { convertBatch, processBatch } = useColorConversion()
  const { exportConversions, exportBatch, exportStatistics } = useColorExport()
  const { copyToClipboard, copyColorValue, copiedText } = useCopyToClipboard()

  // Real-time color conversion
  const conversionResult = useRealTimeConversion(inputColor, settings.inputFormat, settings.outputFormat)

  // File drag and drop
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    useCallback(async (droppedFiles: File[]) => {
      setIsProcessing(true)
      try {
        const { processBatch } = useFileProcessing()
        const processedFiles = await processBatch(droppedFiles)
        setFiles((prev) => [...processedFiles, ...prev])
        toast.success(`Added ${processedFiles.length} file(s)`)
      } catch (error) {
        toast.error('Failed to process files')
      } finally {
        setIsProcessing(false)
      }
    }, [])
  )

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = conversionTemplates.find((t) => t.id === templateId)
    if (template) {
      setSettings((prev) => ({
        ...prev,
        inputFormat: template.inputFormat,
        outputFormat: template.outputFormat,
      }))
      setSelectedTemplate(templateId)
      if (template.examples.length > 0) {
        setInputColor(template.examples[0].input)
      }
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Process all files
  const processFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) {
      toast.error('No files to process')
      return
    }

    setIsProcessing(true)
    try {
      const updatedFiles = await processBatch(pendingFiles, settings)
      setFiles((prev) =>
        prev.map((file) => {
          const updated = updatedFiles.find((u) => u.id === file.id)
          return updated || file
        })
      )
      toast.success('Files processed successfully!')
    } catch (error) {
      toast.error('Failed to process files')
    } finally {
      setIsProcessing(false)
    }
  }, [files, settings, processBatch])

  // Clear all files
  const clearAll = useCallback(() => {
    setFiles([])
    toast.success('All files cleared')
  }, [])

  // Remove specific file
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }, [])

  // Statistics calculation for all files
  const totalStats = useMemo(() => {
    const completedFiles = files.filter((f) => f.conversionData)
    if (completedFiles.length === 0) return null

    const totalConversions = completedFiles.reduce(
      (sum, f) => sum + (f.conversionData?.statistics.totalConversions || 0),
      0
    )
    const successfulConversions = completedFiles.reduce(
      (sum, f) => sum + (f.conversionData?.statistics.successfulConversions || 0),
      0
    )
    const averageAccessibility =
      completedFiles.length > 0
        ? completedFiles.reduce((sum, f) => sum + (f.conversionData?.statistics.averageAccessibilityScore || 0), 0) /
          completedFiles.length
        : 0
    const averageProcessingTime =
      completedFiles.length > 0
        ? completedFiles.reduce((sum, f) => sum + (f.conversionData?.statistics.processingTime || 0), 0) /
          completedFiles.length
        : 0

    return {
      totalFiles: files.length,
      completedFiles: completedFiles.length,
      failedFiles: files.filter((f) => f.status === 'error').length,
      totalConversions,
      successfulConversions,
      averageAccessibility,
      averageProcessingTime,
    }
  }, [files])

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
              <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
              HEX-RGB Color Converter
            </CardTitle>
            <CardDescription>
              Advanced color format converter with support for HEX, RGB, HSL, HSV, CMYK, LAB formats and accessibility
              analysis. Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'converter' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="converter" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Converter
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Color Converter Tab */}
          <TabsContent value="converter" className="space-y-4">
            {/* Conversion Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Conversion Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {conversionTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? 'default' : 'outline'}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div className="text-xs font-mono mt-2 space-y-1">
                          {template.examples.slice(0, 2).map((example, index) => (
                            <div key={index} className="bg-muted/30 px-2 py-1 rounded">
                              {example.input} → {example.output}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Color Converter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Color Input</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <Input
                        type="color"
                        value={inputColor.startsWith('#') ? inputColor : '#000000'}
                        onChange={(e) => setInputColor(e.target.value)}
                        className="w-32 h-32 border-2 border-gray-300 rounded-lg cursor-pointer"
                        aria-label="Color picker"
                      />
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                        <div className="font-mono text-sm font-medium">{inputColor}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="color-input">Color Value</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color-input"
                          value={inputColor}
                          onChange={(e) => setInputColor(e.target.value)}
                          placeholder="Enter color value..."
                          className="font-mono"
                        />
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(inputColor, 'input color')}>
                          {copiedText === 'input color' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="input-format">Input Format</Label>
                        <Select
                          value={settings.inputFormat}
                          onValueChange={(value: ColorFormat) =>
                            setSettings((prev) => ({ ...prev, inputFormat: value }))
                          }
                        >
                          <SelectTrigger id="input-format">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hex">HEX</SelectItem>
                            <SelectItem value="rgb">RGB</SelectItem>
                            <SelectItem value="hsl">HSL</SelectItem>
                            <SelectItem value="hsv">HSV</SelectItem>
                            <SelectItem value="cmyk">CMYK</SelectItem>
                            <SelectItem value="lab">LAB</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="output-format">Output Format</Label>
                        <Select
                          value={settings.outputFormat}
                          onValueChange={(value: ColorFormat) =>
                            setSettings((prev) => ({ ...prev, outputFormat: value }))
                          }
                        >
                          <SelectTrigger id="output-format">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hex">HEX</SelectItem>
                            <SelectItem value="rgb">RGB</SelectItem>
                            <SelectItem value="hsl">HSL</SelectItem>
                            <SelectItem value="hsv">HSV</SelectItem>
                            <SelectItem value="cmyk">CMYK</SelectItem>
                            <SelectItem value="lab">LAB</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          id="includeAccessibility"
                          type="checkbox"
                          checked={settings.includeAccessibility}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeAccessibility: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="includeAccessibility" className="text-sm">
                          Include Accessibility
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="preserveCase"
                          type="checkbox"
                          checked={settings.preserveCase}
                          onChange={(e) => setSettings((prev) => ({ ...prev, preserveCase: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="preserveCase" className="text-sm">
                          Preserve Case
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Conversion Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {conversionResult.error ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <ArrowLeftRight className="h-4 w-4" />
                        <span className="font-medium">Conversion Error</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{conversionResult.error}</p>
                    </div>
                  ) : conversionResult.conversion?.isValid ? (
                    <div className="space-y-4">
                      {/* Converted Color Display */}
                      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                        <div
                          className="w-16 h-16 rounded-lg border-2 border-gray-300"
                          style={{ backgroundColor: conversionResult.conversion.converted.hex }}
                          title={conversionResult.conversion.converted.hex}
                        />
                        <div className="flex-1">
                          <div className="font-mono text-lg font-medium">
                            {formatColorToString(
                              conversionResult.conversion.converted,
                              settings.outputFormat,
                              settings.preserveCase
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {settings.inputFormat.toUpperCase()} → {settings.outputFormat.toUpperCase()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyColorValue(
                              conversionResult.conversion!.converted,
                              settings.outputFormat,
                              'converted color'
                            )
                          }
                        >
                          {copiedText === 'converted color' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* All Format Conversions */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">All Formats</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries({
                            HEX: conversionResult.conversion.converted.hex,
                            RGB: `rgb(${conversionResult.conversion.converted.rgb.r}, ${conversionResult.conversion.converted.rgb.g}, ${conversionResult.conversion.converted.rgb.b})`,
                            HSL: `hsl(${conversionResult.conversion.converted.hsl.h}, ${conversionResult.conversion.converted.hsl.s}%, ${conversionResult.conversion.converted.hsl.l}%)`,
                            HSV: `hsv(${conversionResult.conversion.converted.hsv.h}, ${conversionResult.conversion.converted.hsv.s}%, ${conversionResult.conversion.converted.hsv.v}%)`,
                            CMYK: `cmyk(${conversionResult.conversion.converted.cmyk.c}%, ${conversionResult.conversion.converted.cmyk.m}%, ${conversionResult.conversion.converted.cmyk.y}%, ${conversionResult.conversion.converted.cmyk.k}%)`,
                            LAB: `lab(${conversionResult.conversion.converted.lab.l}, ${conversionResult.conversion.converted.lab.a}, ${conversionResult.conversion.converted.lab.b})`,
                          }).map(([format, value]) => (
                            <div key={format} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <div>
                                <span className="font-medium text-xs">{format}:</span>
                                <span className="font-mono text-sm ml-2">{value}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  copyColorValue(
                                    conversionResult.conversion!.converted,
                                    format.toLowerCase() as ColorFormat,
                                    `${format} color`
                                  )
                                }
                              >
                                {copiedText === `${format} color` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Enter a color value to see conversion</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Accessibility Analysis */}
            {conversionResult.conversion?.isValid && settings.includeAccessibility && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Accessibility className="h-5 w-5" />
                    Accessibility Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Contrast Ratios</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">vs White:</span>
                            <span className="font-mono text-sm">
                              {conversionResult.conversion.converted.accessibility.contrastRatios.white}:1
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">vs Black:</span>
                            <span className="font-mono text-sm">
                              {conversionResult.conversion.converted.accessibility.contrastRatios.black}:1
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">WCAG Compliance</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">AA Normal:</span>
                            <span
                              className={`text-sm font-medium ${conversionResult.conversion.converted.accessibility.wcagAA.normal ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {conversionResult.conversion.converted.accessibility.wcagAA.normal ? 'Pass' : 'Fail'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">AA Large:</span>
                            <span
                              className={`text-sm font-medium ${conversionResult.conversion.converted.accessibility.wcagAA.large ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {conversionResult.conversion.converted.accessibility.wcagAA.large ? 'Pass' : 'Fail'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">AAA Normal:</span>
                            <span
                              className={`text-sm font-medium ${conversionResult.conversion.converted.accessibility.wcagAAA.normal ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {conversionResult.conversion.converted.accessibility.wcagAAA.normal ? 'Pass' : 'Fail'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">AAA Large:</span>
                            <span
                              className={`text-sm font-medium ${conversionResult.conversion.converted.accessibility.wcagAAA.large ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {conversionResult.conversion.converted.accessibility.wcagAAA.large ? 'Pass' : 'Fail'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Color Blind Safety</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span
                            className={`text-sm font-medium ${conversionResult.conversion.converted.accessibility.colorBlindSafe ? 'text-green-600' : 'text-orange-600'}`}
                          >
                            {conversionResult.conversion.converted.accessibility.colorBlindSafe
                              ? 'Color Blind Safe'
                              : 'May be difficult for color blind users'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Quick Actions</Label>
                        <div className="mt-2 space-y-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const randomColor =
                                '#' +
                                Math.floor(Math.random() * 16777215)
                                  .toString(16)
                                  .padStart(6, '0')
                              setInputColor(randomColor)
                            }}
                          >
                            <Shuffle className="h-4 w-4 mr-2" />
                            Random Color
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              // Swap input and output formats
                              setSettings((prev) => ({
                                ...prev,
                                inputFormat: prev.outputFormat,
                                outputFormat: prev.inputFormat,
                              }))
                            }}
                          >
                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                            Swap Formats
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Actions */}
            {conversionResult.conversion?.isValid && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={() => {
                        const singleConversion = convertBatch([inputColor], settings)
                        exportConversions(singleConversion, 'css')
                      }}
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSS
                    </Button>

                    <Button
                      onClick={() => {
                        const singleConversion = convertBatch([inputColor], settings)
                        exportConversions(singleConversion, 'json')
                      }}
                      variant="outline"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>

                    <Button
                      onClick={() => {
                        const singleConversion = convertBatch([inputColor], settings)
                        exportConversions(singleConversion, 'csv')
                      }}
                      variant="outline"
                    >
                      <Code className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>

                    <Button
                      onClick={() =>
                        copyToClipboard(
                          formatColorToString(
                            conversionResult.conversion!.converted,
                            settings.outputFormat,
                            settings.preserveCase
                          ),
                          'converted color'
                        )
                      }
                      variant="outline"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Result
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Batch Processing Tab */}
          <TabsContent value="files" className="space-y-4">
            {/* File Upload */}
            <Card>
              <CardContent className="pt-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Drag and drop color files here or click to select files"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Color Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your color files here, or click to select files
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports JSON, CSS, SCSS, TXT, and CSV files • Max 10MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".json,.css,.scss,.txt,.csv"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select color files"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Batch Statistics */}
            {totalStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalStats.totalFiles}</div>
                      <div className="text-sm text-muted-foreground">Total Files</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{totalStats.completedFiles}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{totalStats.failedFiles}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalStats.totalConversions}</div>
                      <div className="text-sm text-muted-foreground">Total Conversions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{totalStats.successfulConversions}</div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {totalStats.averageProcessingTime.toFixed(2)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Processing Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {files.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={processFiles}
                      disabled={isProcessing || files.every((f) => f.status !== 'pending')}
                      className="min-w-32"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Convert Colors
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => exportBatch(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.conversionData)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download All
                    </Button>

                    <Button
                      onClick={() => exportStatistics(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.conversionData)}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Export Statistics
                    </Button>

                    <Button onClick={clearAll} variant="destructive" disabled={isProcessing}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File List */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Files ({files.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {files.map((file) => (
                      <div key={file.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>
                                <span className="font-medium">Size:</span> {formatFileSize(file.size)} •
                                <span className="font-medium"> Type:</span> {file.type}
                              </div>

                              {file.status === 'completed' && file.conversionData && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium mb-1">Conversions Processed:</div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div>{file.conversionData.statistics.totalConversions} total</div>
                                    <div>{file.conversionData.statistics.successfulConversions} successful</div>
                                    <div>{file.conversionData.statistics.failedConversions} failed</div>
                                    <div>{file.conversionData.statistics.processingTime.toFixed(2)}ms</div>
                                  </div>

                                  {/* Color Preview */}
                                  <div className="flex gap-1 mt-2">
                                    {file.conversionData.conversions
                                      .filter((c) => c.isValid)
                                      .slice(0, 8)
                                      .map((conversion, index) => (
                                        <div
                                          key={index}
                                          className="w-6 h-6 rounded border border-gray-300"
                                          style={{ backgroundColor: conversion.converted.hex }}
                                          title={conversion.converted.hex}
                                        />
                                      ))}
                                    {file.conversionData.conversions.filter((c) => c.isValid).length > 8 && (
                                      <div className="text-xs text-muted-foreground self-center ml-1">
                                        +{file.conversionData.conversions.filter((c) => c.isValid).length - 8}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {file.status === 'pending' && <div className="text-blue-600">Ready for processing</div>}
                              {file.status === 'processing' && (
                                <div className="text-blue-600 flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Processing...
                                </div>
                              )}
                              {file.error && <div className="text-red-600">Error: {file.error}</div>}
                            </div>
                          </div>

                          <div className="flex-shrink-0 flex items-center gap-2">
                            {file.status === 'completed' && file.conversionData && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    exportConversions(
                                      file.conversionData!,
                                      'json',
                                      file.name.replace(/\.[^/.]+$/, '-conversions.json')
                                    )
                                  }
                                  aria-label={`Export conversions for ${file.name}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const validConversions = file
                                      .conversionData!.conversions.filter((c) => c.isValid)
                                      .map((c) =>
                                        formatColorToString(c.converted, settings.outputFormat, settings.preserveCase)
                                      )
                                      .join(', ')
                                    copyToClipboard(validConversions, file.id)
                                  }}
                                  aria-label={`Copy conversions from ${file.name}`}
                                >
                                  {copiedText === file.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(file.id)}
                              aria-label={`Remove ${file.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const HexRgb = () => {
  return (
    <HexRgbErrorBoundary>
      <HexRgbCore />
    </HexRgbErrorBoundary>
  )
}

export default HexRgb
