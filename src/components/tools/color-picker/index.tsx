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
  Pipette,
  Layers,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  RGB,
  HSL,
  HSV,
  HarmonyType,
  AccessibilityInfo,
  ColorPalette,
  Color,
  ColorData,
  ColorFile,
  ColorFormat,
  ColorSettings,
  ColorStatistics,
  ColorTemplate,
  CMYK,
  LAB,
} from '@/types/color-picker'
import { formatFileSize } from '@/lib/utils'

// Utility functions

const validateColorFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['.json', '.ase', '.aco', '.css', '.scss', '.txt']

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' }
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: 'Only JSON, ASE, ACO, CSS, SCSS, and TXT files are supported' }
  }

  return { isValid: true }
}

// Color conversion functions
const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

const rgbToHex = (rgb: RGB): string => {
  const toHex = (c: number) => {
    const hex = Math.round(c).toString(16)
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

const hslToRgb = (hsl: HSL): RGB => {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
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

// Color harmony functions
const generateColorHarmony = (baseColor: string, type: HarmonyType): string[] => {
  const rgb = hexToRgb(baseColor)
  const hsl = rgbToHsl(rgb)

  switch (type) {
    case 'complementary':
      return [baseColor, rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 }))]

    case 'analogous':
      return [
        baseColor,
        rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 30) % 360 })),
        rgbToHex(hslToRgb({ ...hsl, h: (hsl.h - 30 + 360) % 360 })),
      ]

    case 'triadic':
      return [
        baseColor,
        rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 120) % 360 })),
        rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 240) % 360 })),
      ]

    case 'tetradic':
      return [
        baseColor,
        rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 90) % 360 })),
        rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 })),
        rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 270) % 360 })),
      ]

    case 'monochromatic':
      return [
        rgbToHex(hslToRgb({ ...hsl, l: Math.max(10, hsl.l - 40) })),
        rgbToHex(hslToRgb({ ...hsl, l: Math.max(10, hsl.l - 20) })),
        baseColor,
        rgbToHex(hslToRgb({ ...hsl, l: Math.min(90, hsl.l + 20) })),
        rgbToHex(hslToRgb({ ...hsl, l: Math.min(90, hsl.l + 40) })),
      ]

    case 'split-complementary':
      return [
        baseColor,
        rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 150) % 360 })),
        rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 210) % 360 })),
      ]

    default:
      return [baseColor]
  }
}

// Create complete color object
const createColor = (hex: string): Color => {
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb)
  const hsv = rgbToHsv(rgb)
  const cmyk = rgbToCmyk(rgb)
  const lab = rgbToLab(rgb)
  const accessibility = getAccessibilityInfo(rgb)

  return {
    hex,
    rgb,
    hsl,
    hsv,
    cmyk,
    lab,
    accessibility,
  }
}

// Color templates
const colorTemplates: ColorTemplate[] = [
  {
    id: 'material',
    name: 'Material Design',
    description: 'Google Material Design color palette',
    colors: ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4'],
    category: 'Design System',
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap Colors',
    description: 'Bootstrap framework color scheme',
    colors: ['#007bff', '#6c757d', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#e83e8c'],
    category: 'Framework',
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    description: 'Tailwind CSS default palette',
    colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'],
    category: 'Framework',
  },
  {
    id: 'sunset',
    name: 'Sunset Palette',
    description: 'Warm sunset inspired colors',
    colors: ['#FF6B6B', '#FF8E53', '#FF6B9D', '#C44569', '#F8B500', '#FF7675', '#FDCB6E', '#E17055'],
    category: 'Nature',
  },
  {
    id: 'ocean',
    name: 'Ocean Depths',
    description: 'Cool ocean inspired colors',
    colors: ['#0984e3', '#74b9ff', '#00b894', '#00cec9', '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e'],
    category: 'Nature',
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Grayscale color palette',
    colors: ['#000000', '#2d3436', '#636e72', '#b2bec3', '#ddd', '#f1f2f6', '#ffffff'],
    category: 'Neutral',
  },
]

// Process color data
const processColorData = (colors: string[], settings: ColorSettings): ColorData => {
  const startTime = performance.now()

  try {
    const colorObjects = colors.map(createColor)
    const primaryColor = colorObjects[0]

    // Generate palette
    const palette: ColorPalette = {
      primary: primaryColor,
      complementary: generateColorHarmony(primaryColor.hex, 'complementary').map(createColor),
      analogous: generateColorHarmony(primaryColor.hex, 'analogous').map(createColor),
      triadic: generateColorHarmony(primaryColor.hex, 'triadic').map(createColor),
      tetradic: generateColorHarmony(primaryColor.hex, 'tetradic').map(createColor),
      monochromatic: generateColorHarmony(primaryColor.hex, 'monochromatic').map(createColor),
      splitComplementary: generateColorHarmony(primaryColor.hex, 'split-complementary').map(createColor),
    }

    // Calculate statistics
    const totalColors = colorObjects.length
    const averageBrightness = colorObjects.reduce((sum, color) => sum + color.hsl.l, 0) / totalColors
    const averageSaturation = colorObjects.reduce((sum, color) => sum + color.hsl.s, 0) / totalColors
    const accessibilityScore =
      (colorObjects.reduce((sum, color) => {
        const score =
          (color.accessibility.wcagAA.normal ? 2 : 0) +
          (color.accessibility.wcagAAA.normal ? 2 : 0) +
          (color.accessibility.colorBlindSafe ? 1 : 0)
        return sum + score
      }, 0) /
        (totalColors * 5)) *
      100

    const colorDistribution: Record<string, number> = {}
    colorObjects.forEach((color) => {
      const hue = Math.floor(color.hsl.h / 30) * 30 // Group by 30-degree segments
      const key = `${hue}-${hue + 30}`
      colorDistribution[key] = (colorDistribution[key] || 0) + 1
    })

    const statistics: ColorStatistics = {
      totalColors,
      dominantColor: primaryColor,
      averageBrightness,
      averageSaturation,
      colorDistribution,
      accessibilityScore,
      processingTime: performance.now() - startTime,
    }

    return {
      colors: colorObjects,
      palette,
      statistics,
      format: settings.format,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Color processing failed')
  }
}

// Custom hooks
const useColorProcessing = () => {
  const processColors = useCallback((colors: string[], settings: ColorSettings): ColorData => {
    try {
      return processColorData(colors, settings)
    } catch (error) {
      console.error('Color processing error:', error)
      throw new Error(error instanceof Error ? error.message : 'Color processing failed')
    }
  }, [])

  const generatePalette = useCallback((baseColor: string, harmonyType: HarmonyType): string[] => {
    try {
      return generateColorHarmony(baseColor, harmonyType)
    } catch (error) {
      console.error('Palette generation error:', error)
      throw new Error(error instanceof Error ? error.message : 'Palette generation failed')
    }
  }, [])

  const processBatch = useCallback(
    async (files: ColorFile[], settings: ColorSettings): Promise<ColorFile[]> => {
      return Promise.all(
        files.map(async (file) => {
          if (file.status !== 'pending') return file

          try {
            // Parse colors from file content
            const colors = parseColorsFromContent(file.content, file.type)
            const colorData = processColors(colors, settings)

            return {
              ...file,
              status: 'completed' as const,
              colorData,
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
    [processColors]
  )

  return { processColors, generatePalette, processBatch }
}

// Parse colors from file content
const parseColorsFromContent = (content: string, fileType: string): string[] => {
  const colors: string[] = []

  if (fileType.includes('json')) {
    try {
      const data = JSON.parse(content)
      if (Array.isArray(data)) {
        colors.push(...data.filter((item) => typeof item === 'string' && isValidHex(item)))
      } else if (data.colors && Array.isArray(data.colors)) {
        colors.push(...data.colors.filter((item: unknown) => typeof item === 'string' && isValidHex(item as string)))
      }
    } catch (error) {
      throw new Error('Invalid JSON format')
    }
  } else if (fileType.includes('css') || fileType.includes('scss')) {
    // Extract hex colors from CSS
    const hexMatches = content.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/g)
    if (hexMatches) {
      colors.push(
        ...hexMatches.map((hex) => (hex.length === 4 ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex))
      )
    }
  } else {
    // Extract hex colors from plain text
    const hexMatches = content.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/g)
    if (hexMatches) {
      colors.push(
        ...hexMatches.map((hex) => (hex.length === 4 ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex))
      )
    }
  }

  if (colors.length === 0) {
    throw new Error('No valid colors found in file')
  }

  return [...new Set(colors)] // Remove duplicates
}

const isValidHex = (hex: string): boolean => {
  return /^#[a-fA-F0-9]{6}$/.test(hex) || /^#[a-fA-F0-9]{3}$/.test(hex)
}

// Real-time color analysis hook
const useRealTimeColorAnalysis = (color: string, settings: ColorSettings) => {
  return useMemo(() => {
    if (!color || !isValidHex(color)) {
      return {
        colorData: null,
        error: color ? 'Invalid color format' : null,
        isEmpty: !color,
      }
    }

    try {
      const colorData = processColorData([color], settings)
      return {
        colorData,
        error: null,
        isEmpty: false,
      }
    } catch (error) {
      return {
        colorData: null,
        error: error instanceof Error ? error.message : 'Color analysis failed',
        isEmpty: false,
      }
    }
  }, [color, settings])
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<ColorFile> => {
    const validation = validateColorFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const colorFile: ColorFile = {
            id: nanoid(),
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
    async (files: File[]): Promise<ColorFile[]> => {
      const results = await Promise.allSettled(files.map((file) => processFile(file)))

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            id: nanoid(),
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
  const exportPalette = useCallback((colorData: ColorData, format: string, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'css':
        content = generateCSSPalette(colorData.colors)
        mimeType = 'text/css'
        extension = '.css'
        break
      case 'scss':
        content = generateSCSSPalette(colorData.colors)
        mimeType = 'text/scss'
        extension = '.scss'
        break
      case 'json':
        content = JSON.stringify(
          {
            colors: colorData.colors.map((c) => ({
              hex: c.hex,
              rgb: c.rgb,
              hsl: c.hsl,
              hsv: c.hsv,
              cmyk: c.cmyk,
              lab: c.lab,
              accessibility: c.accessibility,
            })),
            palette: colorData.palette,
            statistics: colorData.statistics,
          },
          null,
          2
        )
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'ase':
        content = generateASEPalette(colorData.colors)
        mimeType = 'application/octet-stream'
        extension = '.ase'
        break
      default:
        content = colorData.colors.map((c) => c.hex).join('\n')
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `color-palette${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: ColorFile[]) => {
      const completedFiles = files.filter((f) => f.colorData)

      if (completedFiles.length === 0) {
        toast.error('No color palettes to export')
        return
      }

      completedFiles.forEach((file) => {
        if (file.colorData) {
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          exportPalette(file.colorData, 'json', `${baseName}-palette.json`)
        }
      })

      toast.success(`Exported ${completedFiles.length} color palette(s)`)
    },
    [exportPalette]
  )

  const exportStatistics = useCallback((files: ColorFile[]) => {
    const stats = files
      .filter((f) => f.colorData)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.size),
        totalColors: file.colorData!.statistics.totalColors,
        averageBrightness: file.colorData!.statistics.averageBrightness.toFixed(1),
        averageSaturation: file.colorData!.statistics.averageSaturation.toFixed(1),
        accessibilityScore: file.colorData!.statistics.accessibilityScore.toFixed(1),
        processingTime: `${file.colorData!.statistics.processingTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      [
        'Filename',
        'Original Size',
        'Total Colors',
        'Avg Brightness',
        'Avg Saturation',
        'Accessibility Score',
        'Processing Time',
        'Status',
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.totalColors.toString(),
        stat.averageBrightness,
        stat.averageSaturation,
        stat.accessibilityScore,
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
    link.download = 'color-processing-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportPalette, exportBatch, exportStatistics }
}

// Generate export formats
const generateCSSPalette = (colors: Color[]): string => {
  return `:root {\n${colors.map((color, index) => `  --color-${index + 1}: ${color.hex};`).join('\n')}\n}`
}

const generateSCSSPalette = (colors: Color[]): string => {
  return colors.map((color, index) => `$color-${index + 1}: ${color.hex};`).join('\n')
}

const generateASEPalette = (colors: Color[]): string => {
  // Simplified ASE format (Adobe Swatch Exchange)
  // In a real implementation, this would generate proper binary ASE format
  return JSON.stringify(
    {
      version: '1.0',
      groups: [
        {
          name: 'Generated Palette',
          colors: colors.map((color, index) => ({
            name: `Color ${index + 1}`,
            model: 'RGB',
            color: [color.rgb.r / 255, color.rgb.g / 255, color.rgb.b / 255],
            type: 'global',
          })),
        },
      ],
    },
    null,
    2
  )
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
    async (color: Color, format: ColorFormat, label?: string) => {
      let value = ''

      switch (format) {
        case 'hex':
          value = color.hex
          break
        case 'rgb':
          value = `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
          break
        case 'hsl':
          value = `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`
          break
        case 'hsv':
          value = `hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)`
          break
        case 'cmyk':
          value = `cmyk(${color.cmyk.c}%, ${color.cmyk.m}%, ${color.cmyk.y}%, ${color.cmyk.k}%)`
          break
        case 'lab':
          value = `lab(${color.lab.l}, ${color.lab.a}, ${color.lab.b})`
          break
        default:
          value = color.hex
      }

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

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.name.match(/\.(json|ase|aco|css|scss|txt)$/i)
      )

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error('Please drop only JSON, ASE, ACO, CSS, SCSS, or TXT files')
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
 * Enhanced Color Picker Tool
 * Features: Real-time color analysis, palette generation, batch processing, accessibility checking
 */
const ColorPickerCore = () => {
  const [activeTab, setActiveTab] = useState<'picker' | 'files'>('picker')
  const [currentColor, setCurrentColor] = useState('#3498db')
  const [files, setFiles] = useState<ColorFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('material')
  const [settings, setSettings] = useState<ColorSettings>({
    format: 'hex',
    paletteSize: 5,
    harmonyType: 'complementary',
    includeAccessibility: true,
    generateNames: false,
    sortBy: 'hue',
  })

  const { generatePalette, processBatch } = useColorProcessing()
  const { exportPalette, exportBatch, exportStatistics } = useColorExport()
  const { copyToClipboard, copyColorValue, copiedText } = useCopyToClipboard()

  // Real-time color analysis
  const colorAnalysis = useRealTimeColorAnalysis(currentColor, settings)

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
    const template = colorTemplates.find((t) => t.id === templateId)
    if (template && template.colors.length > 0) {
      setCurrentColor(template.colors[0])
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Generate palette from current color
  const generateCurrentPalette = useCallback(
    (harmonyType: HarmonyType) => {
      try {
        const palette = generatePalette(currentColor, harmonyType)
        return palette
      } catch (error) {
        toast.error('Failed to generate palette')
        return []
      }
    },
    [currentColor, generatePalette]
  )

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
    const completedFiles = files.filter((f) => f.colorData)
    if (completedFiles.length === 0) return null

    const totalColors = completedFiles.reduce((sum, f) => sum + (f.colorData?.statistics.totalColors || 0), 0)
    const averageAccessibility =
      completedFiles.length > 0
        ? completedFiles.reduce((sum, f) => sum + (f.colorData?.statistics.accessibilityScore || 0), 0) /
          completedFiles.length
        : 0
    const averageProcessingTime =
      completedFiles.length > 0
        ? completedFiles.reduce((sum, f) => sum + (f.colorData?.statistics.processingTime || 0), 0) /
          completedFiles.length
        : 0

    return {
      totalFiles: files.length,
      completedFiles: completedFiles.length,
      failedFiles: files.filter((f) => f.status === 'error').length,
      totalColors,
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
              <Palette className="h-5 w-5" aria-hidden="true" />
              Color Picker & Palette Generator
            </CardTitle>
            <CardDescription>
              Advanced color manipulation tool with palette generation, accessibility checking, and batch processing.
              Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'picker' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="picker" className="flex items-center gap-2">
              <Pipette className="h-4 w-4" />
              Color Picker
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Color Picker Tab */}
          <TabsContent value="picker" className="space-y-4">
            {/* Color Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Color Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {colorTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? 'default' : 'outline'}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div className="flex gap-1 mt-2">
                          {template.colors.slice(0, 5).map((color, index) => (
                            <div
                              key={index}
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                          {template.colors.length > 5 && (
                            <div className="text-xs text-muted-foreground self-center ml-1">
                              +{template.colors.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Color Picker */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Color Picker</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <Input
                        type="color"
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                        className="w-32 h-32 border-2 border-gray-300 rounded-lg cursor-pointer"
                        aria-label="Color picker"
                      />
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                        <div className="font-mono text-sm font-medium">{currentColor}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-8">
                    <div className="space-y-2">
                      <Label htmlFor="color-input">Color Value</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color-input"
                          value={currentColor}
                          onChange={(e) => setCurrentColor(e.target.value)}
                          placeholder="Enter color value..."
                          className="font-mono"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(currentColor, 'color value')}
                        >
                          {copiedText === 'color value' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="format-select">Output Format</Label>
                      <Select
                        value={settings.format}
                        onValueChange={(value: ColorFormat) => setSettings((prev) => ({ ...prev, format: value }))}
                      >
                        <SelectTrigger id="format-select">
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
                      <Label htmlFor="harmony-select">Color Harmony</Label>
                      <Select
                        value={settings.harmonyType}
                        onValueChange={(value: HarmonyType) => setSettings((prev) => ({ ...prev, harmonyType: value }))}
                      >
                        <SelectTrigger id="harmony-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="complementary">Complementary</SelectItem>
                          <SelectItem value="analogous">Analogous</SelectItem>
                          <SelectItem value="triadic">Triadic</SelectItem>
                          <SelectItem value="tetradic">Tetradic</SelectItem>
                          <SelectItem value="monochromatic">Monochromatic</SelectItem>
                          <SelectItem value="split-complementary">Split Complementary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="includeAccessibility"
                        type="checkbox"
                        checked={settings.includeAccessibility}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeAccessibility: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="includeAccessibility" className="text-sm">
                        Include Accessibility Analysis
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Color Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {colorAnalysis.error ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <Palette className="h-4 w-4" />
                        <span className="font-medium">Color Analysis Error</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{colorAnalysis.error}</p>
                    </div>
                  ) : colorAnalysis.colorData ? (
                    <div className="space-y-4">
                      {/* Color Formats */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Color Formats</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries({
                            HEX: colorAnalysis.colorData.colors[0].hex,
                            RGB: `rgb(${colorAnalysis.colorData.colors[0].rgb.r}, ${colorAnalysis.colorData.colors[0].rgb.g}, ${colorAnalysis.colorData.colors[0].rgb.b})`,
                            HSL: `hsl(${colorAnalysis.colorData.colors[0].hsl.h}, ${colorAnalysis.colorData.colors[0].hsl.s}%, ${colorAnalysis.colorData.colors[0].hsl.l}%)`,
                            HSV: `hsv(${colorAnalysis.colorData.colors[0].hsv.h}, ${colorAnalysis.colorData.colors[0].hsv.s}%, ${colorAnalysis.colorData.colors[0].hsv.v}%)`,
                            CMYK: `cmyk(${colorAnalysis.colorData.colors[0].cmyk.c}%, ${colorAnalysis.colorData.colors[0].cmyk.m}%, ${colorAnalysis.colorData.colors[0].cmyk.y}%, ${colorAnalysis.colorData.colors[0].cmyk.k}%)`,
                            LAB: `lab(${colorAnalysis.colorData.colors[0].lab.l}, ${colorAnalysis.colorData.colors[0].lab.a}, ${colorAnalysis.colorData.colors[0].lab.b})`,
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
                                    colorAnalysis.colorData!.colors[0],
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
                      <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a color to see analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Accessibility Analysis */}
            {colorAnalysis.colorData && settings.includeAccessibility && (
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
                              {colorAnalysis.colorData.colors[0].accessibility.contrastRatios.white}:1
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">vs Black:</span>
                            <span className="font-mono text-sm">
                              {colorAnalysis.colorData.colors[0].accessibility.contrastRatios.black}:1
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
                              className={`text-sm font-medium ${colorAnalysis.colorData.colors[0].accessibility.wcagAA.normal ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {colorAnalysis.colorData.colors[0].accessibility.wcagAA.normal ? 'Pass' : 'Fail'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">AA Large:</span>
                            <span
                              className={`text-sm font-medium ${colorAnalysis.colorData.colors[0].accessibility.wcagAA.large ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {colorAnalysis.colorData.colors[0].accessibility.wcagAA.large ? 'Pass' : 'Fail'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">AAA Normal:</span>
                            <span
                              className={`text-sm font-medium ${colorAnalysis.colorData.colors[0].accessibility.wcagAAA.normal ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {colorAnalysis.colorData.colors[0].accessibility.wcagAAA.normal ? 'Pass' : 'Fail'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">AAA Large:</span>
                            <span
                              className={`text-sm font-medium ${colorAnalysis.colorData.colors[0].accessibility.wcagAAA.large ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {colorAnalysis.colorData.colors[0].accessibility.wcagAAA.large ? 'Pass' : 'Fail'}
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
                            className={`text-sm font-medium ${colorAnalysis.colorData.colors[0].accessibility.colorBlindSafe ? 'text-green-600' : 'text-orange-600'}`}
                          >
                            {colorAnalysis.colorData.colors[0].accessibility.colorBlindSafe
                              ? 'Color Blind Safe'
                              : 'May be difficult for color blind users'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Accessibility Score</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Overall Score:</span>
                            <span className="font-mono text-lg font-bold">
                              {colorAnalysis.colorData.statistics.accessibilityScore.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${colorAnalysis.colorData.statistics.accessibilityScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Color Palette Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Generated Palette
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Harmony Type: {settings.harmonyType}</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const palette = generateCurrentPalette(settings.harmonyType)
                        if (palette.length > 0) {
                          copyToClipboard(palette.join(', '), 'color palette')
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Palette
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {generateCurrentPalette(settings.harmonyType).map((color, index) => (
                      <div key={index} className="space-y-2">
                        <div
                          className="w-full h-20 rounded-lg border-2 border-gray-300 cursor-pointer transition-transform hover:scale-105"
                          style={{ backgroundColor: color }}
                          onClick={() => setCurrentColor(color)}
                          title={`Click to select ${color}`}
                        />
                        <div className="text-center">
                          <div className="font-mono text-xs">{color}</div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(color, `color ${index + 1}`)}
                            className="h-6 px-2 text-xs"
                          >
                            {copiedText === `color ${index + 1}` ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Random Palette Generator */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Random Palette Generator</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const randomColor =
                            '#' +
                            Math.floor(Math.random() * 16777215)
                              .toString(16)
                              .padStart(6, '0')
                          setCurrentColor(randomColor)
                        }}
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Random Color
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Actions */}
            {colorAnalysis.colorData && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button onClick={() => exportPalette(colorAnalysis.colorData!, 'css')} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSS
                    </Button>

                    <Button onClick={() => exportPalette(colorAnalysis.colorData!, 'scss')} variant="outline">
                      <Code className="mr-2 h-4 w-4" />
                      Export SCSS
                    </Button>

                    <Button onClick={() => exportPalette(colorAnalysis.colorData!, 'json')} variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>

                    <Button onClick={() => exportPalette(colorAnalysis.colorData!, 'ase')} variant="outline">
                      <Palette className="mr-2 h-4 w-4" />
                      Export ASE
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
                  aria-label="Drag and drop color palette files here or click to select files"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Color Palette Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your color palette files here, or click to select files
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports JSON, ASE, ACO, CSS, SCSS, and TXT files • Max 10MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".json,.ase,.aco,.css,.scss,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select color palette files"
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
                      <div className="text-2xl font-bold text-blue-600">{totalStats.totalColors}</div>
                      <div className="text-sm text-muted-foreground">Total Colors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {totalStats.averageAccessibility.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Accessibility</div>
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
                          Process Colors
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => exportBatch(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.colorData)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download All Palettes
                    </Button>

                    <Button
                      onClick={() => exportStatistics(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.colorData)}
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

                              {file.status === 'completed' && file.colorData && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium mb-1">Colors Processed:</div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div>{file.colorData.statistics.totalColors} colors</div>
                                    <div>Accessibility: {file.colorData.statistics.accessibilityScore.toFixed(0)}%</div>
                                    <div>Brightness: {file.colorData.statistics.averageBrightness.toFixed(0)}%</div>
                                    <div>{file.colorData.statistics.processingTime.toFixed(2)}ms</div>
                                  </div>

                                  {/* Color Preview */}
                                  <div className="flex gap-1 mt-2">
                                    {file.colorData.colors.slice(0, 8).map((color, index) => (
                                      <div
                                        key={index}
                                        className="w-6 h-6 rounded border border-gray-300"
                                        style={{ backgroundColor: color.hex }}
                                        title={color.hex}
                                      />
                                    ))}
                                    {file.colorData.colors.length > 8 && (
                                      <div className="text-xs text-muted-foreground self-center ml-1">
                                        +{file.colorData.colors.length - 8}
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
                            {file.status === 'completed' && file.colorData && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    exportPalette(
                                      file.colorData!,
                                      'json',
                                      file.name.replace(/\.[^/.]+$/, '-palette.json')
                                    )
                                  }
                                  aria-label={`Export palette for ${file.name}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    copyToClipboard(file.colorData!.colors.map((c) => c.hex).join(', '), file.id)
                                  }
                                  aria-label={`Copy colors from ${file.name}`}
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
const ColorPicker = () => {
  return <ColorPickerCore />
}

export default ColorPicker
