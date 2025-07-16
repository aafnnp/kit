import React, { useCallback, useRef, useState } from 'react'
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
  Upload,
  FileImage,
  Trash2,
  Target,
  Copy,
  Check,
  Eye,
  Shuffle,
  Palette,
  Droplets,
  Contrast,
  Lightbulb,
  Settings,
  Zap,
} from 'lucide-react'
import { nanoid } from 'nanoid'
// Types
interface ColorFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  colorData?: ColorData
}

interface ColorData {
  colors: GeneratedColor[]
  palettes: ColorPalette[]
  statistics: ColorStatistics
  settings: ColorSettings
}

interface GeneratedColor {
  id: string
  hex: string
  rgb: RGBColor
  hsl: HSLColor
  hsv: HSVColor
  cmyk: CMYKColor
  name?: string
  metadata: ColorMetadata
}

interface RGBColor {
  r: number
  g: number
  b: number
}

interface HSLColor {
  h: number
  s: number
  l: number
}

interface HSVColor {
  h: number
  s: number
  v: number
}

interface CMYKColor {
  c: number
  m: number
  y: number
  k: number
}

interface ColorMetadata {
  luminance: number
  brightness: number
  contrast: number
  isLight: boolean
  isDark: boolean
  accessibility: AccessibilityInfo
  harmony: ColorHarmony[]
}

interface AccessibilityInfo {
  wcagAA: boolean
  wcagAAA: boolean
  contrastRatio: number
  readableOnWhite: boolean
  readableOnBlack: boolean
  colorBlindSafe: boolean
}

interface ColorHarmony {
  type: HarmonyType
  colors: string[]
}

interface ColorPalette {
  id: string
  name: string
  colors: GeneratedColor[]
  type: PaletteType
  description: string
  metadata: PaletteMetadata
}

interface PaletteMetadata {
  dominantHue: number
  averageSaturation: number
  averageLightness: number
  colorCount: number
  harmonyScore: number
  accessibilityScore: number
}

interface ColorStatistics {
  totalColors: number
  formatDistribution: Record<ColorFormat, number>
  paletteDistribution: Record<PaletteType, number>
  averageLuminance: number
  averageContrast: number
  accessibilityScore: number
  processingTime: number
}

interface ColorSettings {
  defaultFormat: ColorFormat
  includeHarmony: boolean
  checkAccessibility: boolean
  generatePalettes: boolean
  paletteSize: number
  exportFormat: ExportFormat
  colorSpace: ColorSpace
}

interface ColorTemplate {
  id: string
  name: string
  description: string
  category: string
  type: PaletteType
  baseColors: string[]
  settings: Partial<ColorSettings>
}

// Enums
type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk'
type PaletteType =
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'tetradic'
  | 'split-complementary'
  | 'random'
type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'split-complementary' | 'monochromatic'
type ExportFormat = 'json' | 'css' | 'scss' | 'ase' | 'gpl'
type ColorSpace = 'sRGB' | 'P3' | 'Rec2020'

// Utility functions

const validateColorFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['.json', '.css', '.scss', '.ase', '.gpl', '.txt']

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' }
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: 'Only JSON, CSS, SCSS, ASE, GPL, and TXT files are supported' }
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

// Color conversion functions
const hexToRgb = (hex: string): RGBColor => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

const rgbToHsl = (rgb: RGBColor): HSLColor => {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

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

const rgbToHsv = (rgb: RGBColor): HSVColor => {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    v = max

  const d = max - min
  s = max === 0 ? 0 : d / max

  if (max !== min) {
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
    v: Math.round(v * 100),
  }
}

const rgbToCmyk = (rgb: RGBColor): CMYKColor => {
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

// Color analysis functions
const calculateLuminance = (rgb: RGBColor): number => {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const calculateContrast = (color1: RGBColor, color2: RGBColor): number => {
  const lum1 = calculateLuminance(color1)
  const lum2 = calculateLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

const isColorBlindSafe = (rgb: RGBColor): boolean => {
  // Simplified colorblind safety check
  const { r, g, b } = rgb
  const redGreenDiff = Math.abs(r - g)
  const blueYellowDiff = Math.abs(b - (r + g) / 2)
  return redGreenDiff > 50 || blueYellowDiff > 50
}

// Random color generation
const generateRandomHex = (): string => {
  return (
    '#' +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
  )
}

// Generate color with full metadata
const generateCompleteColor = (): GeneratedColor => {
  const hex = generateRandomHex()
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb)
  const hsv = rgbToHsv(rgb)
  const cmyk = rgbToCmyk(rgb)

  const luminance = calculateLuminance(rgb)
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  const isLight = luminance > 0.5
  const isDark = !isLight

  const whiteContrast = calculateContrast(rgb, { r: 255, g: 255, b: 255 })
  const blackContrast = calculateContrast(rgb, { r: 0, g: 0, b: 0 })

  const accessibility: AccessibilityInfo = {
    wcagAA: Math.max(whiteContrast, blackContrast) >= 4.5,
    wcagAAA: Math.max(whiteContrast, blackContrast) >= 7,
    contrastRatio: Math.max(whiteContrast, blackContrast),
    readableOnWhite: whiteContrast >= 4.5,
    readableOnBlack: blackContrast >= 4.5,
    colorBlindSafe: isColorBlindSafe(rgb),
  }

  const harmony = generateColorHarmony(hex)

  return {
    id: nanoid(),
    hex,
    rgb,
    hsl,
    hsv,
    cmyk,
    metadata: {
      luminance,
      brightness,
      contrast: Math.max(whiteContrast, blackContrast),
      isLight,
      isDark,
      accessibility,
      harmony,
    },
  }
}

// Color harmony generation
const generateColorHarmony = (baseHex: string): ColorHarmony[] => {
  const rgb = hexToRgb(baseHex)
  const hsl = rgbToHsl(rgb)
  const harmonies: ColorHarmony[] = []

  // Complementary
  const complementaryHue = (hsl.h + 180) % 360
  harmonies.push({
    type: 'complementary',
    colors: [baseHex, hslToHex({ h: complementaryHue, s: hsl.s, l: hsl.l })],
  })

  // Analogous
  const analogous1 = (hsl.h + 30) % 360
  const analogous2 = (hsl.h - 30 + 360) % 360
  harmonies.push({
    type: 'analogous',
    colors: [hslToHex({ h: analogous2, s: hsl.s, l: hsl.l }), baseHex, hslToHex({ h: analogous1, s: hsl.s, l: hsl.l })],
  })

  // Triadic
  const triadic1 = (hsl.h + 120) % 360
  const triadic2 = (hsl.h + 240) % 360
  harmonies.push({
    type: 'triadic',
    colors: [baseHex, hslToHex({ h: triadic1, s: hsl.s, l: hsl.l }), hslToHex({ h: triadic2, s: hsl.s, l: hsl.l })],
  })

  // Tetradic
  const tetradic1 = (hsl.h + 90) % 360
  const tetradic2 = (hsl.h + 180) % 360
  const tetradic3 = (hsl.h + 270) % 360
  harmonies.push({
    type: 'tetradic',
    colors: [
      baseHex,
      hslToHex({ h: tetradic1, s: hsl.s, l: hsl.l }),
      hslToHex({ h: tetradic2, s: hsl.s, l: hsl.l }),
      hslToHex({ h: tetradic3, s: hsl.s, l: hsl.l }),
    ],
  })

  // Split complementary
  const splitComp1 = (hsl.h + 150) % 360
  const splitComp2 = (hsl.h + 210) % 360
  harmonies.push({
    type: 'split-complementary',
    colors: [baseHex, hslToHex({ h: splitComp1, s: hsl.s, l: hsl.l }), hslToHex({ h: splitComp2, s: hsl.s, l: hsl.l })],
  })

  // Monochromatic
  harmonies.push({
    type: 'monochromatic',
    colors: [
      hslToHex({ h: hsl.h, s: hsl.s, l: Math.max(10, hsl.l - 30) }),
      hslToHex({ h: hsl.h, s: hsl.s, l: Math.max(10, hsl.l - 15) }),
      baseHex,
      hslToHex({ h: hsl.h, s: hsl.s, l: Math.min(90, hsl.l + 15) }),
      hslToHex({ h: hsl.h, s: hsl.s, l: Math.min(90, hsl.l + 30) }),
    ],
  })

  return harmonies
}

const hslToHex = (hsl: HSLColor): string => {
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
    r = g = b = l // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Generate color palette
const generateColorPalette = (type: PaletteType, baseColor?: string, count: number = 5): ColorPalette => {
  const colors: GeneratedColor[] = []
  let name = ''
  let description = ''

  switch (type) {
    case 'random':
      name = 'Random Palette'
      description = 'A collection of randomly generated colors'
      for (let i = 0; i < count; i++) {
        colors.push(generateCompleteColor())
      }
      break

    case 'monochromatic':
      name = 'Monochromatic Palette'
      description = 'Variations of a single hue with different saturation and lightness'
      const baseHex = baseColor || generateRandomHex()
      const baseRgb = hexToRgb(baseHex)
      const baseHsl = rgbToHsl(baseRgb)

      for (let i = 0; i < count; i++) {
        const lightness = 20 + i * (60 / (count - 1))
        const hex = hslToHex({ h: baseHsl.h, s: baseHsl.s, l: lightness })
        const rgb = hexToRgb(hex)
        colors.push({
          ...generateCompleteColor(),
          hex,
          rgb,
          hsl: { h: baseHsl.h, s: baseHsl.s, l: lightness },
        })
      }
      break

    default:
      // For other harmony types, use the base color and generate harmony
      const base = baseColor || generateRandomHex()
      const harmony = generateColorHarmony(base)
      const harmonyColors = harmony.find((h) => h.type === type)?.colors || [base]

      harmonyColors.slice(0, count).forEach((hex) => {
        const rgb = hexToRgb(hex)
        colors.push({
          ...generateCompleteColor(),
          hex,
          rgb,
          hsl: rgbToHsl(rgb),
        })
      })

      name = `${type.charAt(0).toUpperCase() + type.slice(1)} Palette`
      description = `Colors based on ${type} harmony`
      break
  }

  // Calculate palette metadata
  const dominantHue = colors.reduce((sum, c) => sum + c.hsl.h, 0) / colors.length
  const averageSaturation = colors.reduce((sum, c) => sum + c.hsl.s, 0) / colors.length
  const averageLightness = colors.reduce((sum, c) => sum + c.hsl.l, 0) / colors.length
  const harmonyScore = calculateHarmonyScore(colors)
  const accessibilityScore =
    colors.reduce((sum, c) => sum + (c.metadata.accessibility.wcagAA ? 100 : 0), 0) / colors.length

  return {
    id: nanoid(),
    name,
    colors,
    type,
    description,
    metadata: {
      dominantHue,
      averageSaturation,
      averageLightness,
      colorCount: colors.length,
      harmonyScore,
      accessibilityScore,
    },
  }
}

const calculateHarmonyScore = (colors: GeneratedColor[]): number => {
  if (colors.length < 2) return 100

  // Calculate harmony based on hue relationships
  const hues = colors.map((c) => c.hsl.h)
  let harmonySum = 0

  for (let i = 0; i < hues.length - 1; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const diff = Math.abs(hues[i] - hues[j])
      const normalizedDiff = Math.min(diff, 360 - diff)

      // Ideal relationships: 0°, 30°, 60°, 90°, 120°, 150°, 180°
      const idealRelationships = [0, 30, 60, 90, 120, 150, 180]
      const closestIdeal = idealRelationships.reduce((prev, curr) =>
        Math.abs(curr - normalizedDiff) < Math.abs(prev - normalizedDiff) ? curr : prev
      )

      const harmony = 100 - Math.abs(normalizedDiff - closestIdeal) * 2
      harmonySum += Math.max(0, harmony)
    }
  }

  return harmonySum / ((hues.length * (hues.length - 1)) / 2)
}

// Color templates
const colorTemplates: ColorTemplate[] = [
  {
    id: 'vibrant-random',
    name: 'Vibrant Random',
    description: 'Bright and energetic random colors',
    category: 'Random',
    type: 'random',
    baseColors: [],
    settings: {
      paletteSize: 5,
      checkAccessibility: true,
      includeHarmony: true,
    },
  },
  {
    id: 'pastel-palette',
    name: 'Pastel Palette',
    description: 'Soft and gentle pastel colors',
    category: 'Mood',
    type: 'analogous',
    baseColors: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF'],
    settings: {
      paletteSize: 5,
      checkAccessibility: false,
      includeHarmony: true,
    },
  },
  {
    id: 'earth-tones',
    name: 'Earth Tones',
    description: 'Natural and grounded earth colors',
    category: 'Nature',
    type: 'analogous',
    baseColors: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F4A460'],
    settings: {
      paletteSize: 5,
      checkAccessibility: true,
      includeHarmony: true,
    },
  },
  {
    id: 'ocean-blues',
    name: 'Ocean Blues',
    description: 'Deep and calming ocean-inspired blues',
    category: 'Nature',
    type: 'monochromatic',
    baseColors: ['#003366', '#0066CC', '#3399FF', '#66B2FF', '#99CCFF'],
    settings: {
      paletteSize: 5,
      checkAccessibility: true,
      includeHarmony: false,
    },
  },
  {
    id: 'sunset-warm',
    name: 'Sunset Warm',
    description: 'Warm sunset colors with orange and red tones',
    category: 'Mood',
    type: 'analogous',
    baseColors: ['#FF6B35', '#F7931E', '#FFD23F', '#FF4081', '#E91E63'],
    settings: {
      paletteSize: 5,
      checkAccessibility: false,
      includeHarmony: true,
    },
  },
  {
    id: 'forest-greens',
    name: 'Forest Greens',
    description: 'Rich forest and nature greens',
    category: 'Nature',
    type: 'monochromatic',
    baseColors: ['#0B5345', '#148F77', '#52C41A', '#7CB342', '#AED581'],
    settings: {
      paletteSize: 5,
      checkAccessibility: true,
      includeHarmony: false,
    },
  },
  {
    id: 'complementary-bold',
    name: 'Complementary Bold',
    description: 'High contrast complementary color pairs',
    category: 'Contrast',
    type: 'complementary',
    baseColors: ['#FF0000', '#00FF00'],
    settings: {
      paletteSize: 2,
      checkAccessibility: true,
      includeHarmony: true,
    },
  },
  {
    id: 'triadic-balanced',
    name: 'Triadic Balanced',
    description: 'Balanced triadic color harmony',
    category: 'Harmony',
    type: 'triadic',
    baseColors: ['#FF0000', '#00FF00', '#0000FF'],
    settings: {
      paletteSize: 3,
      checkAccessibility: true,
      includeHarmony: true,
    },
  },
]

// Process color data
const processColorData = (colors: GeneratedColor[], palettes: ColorPalette[], settings: ColorSettings): ColorData => {
  const startTime = performance.now()

  try {
    const formatDistribution: Record<ColorFormat, number> = {
      hex: 0,
      rgb: 0,
      hsl: 0,
      hsv: 0,
      cmyk: 0,
    }

    const paletteDistribution: Record<PaletteType, number> = {
      monochromatic: 0,
      analogous: 0,
      complementary: 0,
      triadic: 0,
      tetradic: 0,
      'split-complementary': 0,
      random: 0,
    }

    // Count format usage (assuming hex is primary)
    formatDistribution[settings.defaultFormat] = colors.length

    palettes.forEach((palette) => {
      paletteDistribution[palette.type]++
    })

    const averageLuminance =
      colors.length > 0 ? colors.reduce((sum, c) => sum + c.metadata.luminance, 0) / colors.length : 0

    const averageContrast =
      colors.length > 0 ? colors.reduce((sum, c) => sum + c.metadata.contrast, 0) / colors.length : 0

    const accessibilityScore =
      colors.length > 0
        ? colors.reduce((sum, c) => sum + (c.metadata.accessibility.wcagAA ? 100 : 0), 0) / colors.length
        : 0

    const statistics: ColorStatistics = {
      totalColors: colors.length,
      formatDistribution,
      paletteDistribution,
      averageLuminance,
      averageContrast,
      accessibilityScore,
      processingTime: performance.now() - startTime,
    }

    return {
      colors,
      palettes,
      statistics,
      settings,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Color processing failed')
  }
}

// Error boundary component
class RandomColorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Random Color error:', error, errorInfo)
    toast.error('An unexpected error occurred during color generation')
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
const useColorGeneration = () => {
  const generateColor = useCallback((): GeneratedColor => {
    try {
      return generateCompleteColor()
    } catch (error) {
      console.error('Color generation error:', error)
      throw new Error(error instanceof Error ? error.message : 'Color generation failed')
    }
  }, [])

  const generatePalette = useCallback((type: PaletteType, baseColor?: string, count: number = 5): ColorPalette => {
    try {
      return generateColorPalette(type, baseColor, count)
    } catch (error) {
      console.error('Palette generation error:', error)
      throw new Error(error instanceof Error ? error.message : 'Palette generation failed')
    }
  }, [])

  const processBatch = useCallback(
    (colors: GeneratedColor[], palettes: ColorPalette[], settings: ColorSettings): ColorData => {
      try {
        return processColorData(colors, palettes, settings)
      } catch (error) {
        console.error('Batch processing error:', error)
        throw new Error(error instanceof Error ? error.message : 'Batch processing failed')
      }
    },
    []
  )

  const processFiles = useCallback(async (files: ColorFile[], settings: ColorSettings): Promise<ColorFile[]> => {
    return Promise.all(
      files.map(async (file) => {
        if (file.status !== 'pending') return file

        try {
          // Parse color content and extract colors
          const colors = parseColorFile(file.content, file.type)
          const palettes = [generateColorPalette('random', undefined, colors.length)]
          const colorData = processColorData(colors, palettes, settings)

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
  }, [])

  return { generateColor, generatePalette, processBatch, processFiles }
}

// Parse color file content
const parseColorFile = (content: string, fileType: string): GeneratedColor[] => {
  const colors: GeneratedColor[] = []

  try {
    if (fileType.includes('json')) {
      const data = JSON.parse(content)
      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (typeof item === 'string' && item.match(/^#[0-9A-Fa-f]{6}$/)) {
            const rgb = hexToRgb(item)
            colors.push({
              ...generateCompleteColor(),
              hex: item,
              rgb,
              hsl: rgbToHsl(rgb),
            })
          }
        })
      }
    } else {
      // Parse CSS/text content for hex colors
      const hexRegex = /#[0-9A-Fa-f]{6}/g
      const matches = content.match(hexRegex)

      if (matches) {
        matches.forEach((hex) => {
          const rgb = hexToRgb(hex)
          colors.push({
            ...generateCompleteColor(),
            hex,
            rgb,
            hsl: rgbToHsl(rgb),
          })
        })
      }
    }
  } catch (error) {
    console.warn('Failed to parse color file:', error)
  }

  return colors
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
  const exportColor = useCallback((color: GeneratedColor, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(
          {
            id: color.id,
            hex: color.hex,
            rgb: color.rgb,
            hsl: color.hsl,
            hsv: color.hsv,
            cmyk: color.cmyk,
            metadata: color.metadata,
          },
          null,
          2
        )
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'css':
        content = `:root {
  --color-primary: ${color.hex};
  --color-primary-rgb: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b};
  --color-primary-hsl: ${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%;
}`
        mimeType = 'text/css'
        extension = '.css'
        break
      case 'scss':
        content = `$primary-color: ${color.hex};
$primary-rgb: (${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b});
$primary-hsl: (${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%);`
        mimeType = 'text/scss'
        extension = '.scss'
        break
      default:
        content = color.hex
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `color${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportPalette = useCallback((palette: ColorPalette, format: ExportFormat) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(palette, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'css':
        content = `:root {
${palette.colors.map((color, index) => `  --color-${index + 1}: ${color.hex};`).join('\n')}
}`
        mimeType = 'text/css'
        extension = '.css'
        break
      case 'scss':
        content = palette.colors.map((color, index) => `$color-${index + 1}: ${color.hex};`).join('\n')
        mimeType = 'text/scss'
        extension = '.scss'
        break
      case 'ase':
        // Adobe Swatch Exchange format (simplified)
        content = palette.colors.map((color) => color.hex).join('\n')
        mimeType = 'text/plain'
        extension = '.ase'
        break
      case 'gpl':
        // GIMP Palette format
        content = `GIMP Palette
Name: ${palette.name}
#
${palette.colors.map((color) => `${color.rgb.r} ${color.rgb.g} ${color.rgb.b} ${color.hex}`).join('\n')}`
        mimeType = 'text/plain'
        extension = '.gpl'
        break
      default:
        content = palette.colors.map((color) => color.hex).join('\n')
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${palette.name.toLowerCase().replace(/\s+/g, '-')}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: ColorFile[]) => {
      const completedFiles = files.filter((f) => f.colorData)

      if (completedFiles.length === 0) {
        toast.error('No color results to export')
        return
      }

      completedFiles.forEach((file) => {
        if (file.colorData) {
          file.colorData.palettes.forEach((palette) => {
            exportPalette(palette, 'json')
          })
        }
      })

      toast.success(`Exported results from ${completedFiles.length} file(s)`)
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
        averageLuminance: file.colorData!.statistics.averageLuminance.toFixed(3),
        averageContrast: file.colorData!.statistics.averageContrast.toFixed(2),
        accessibilityScore: `${file.colorData!.statistics.accessibilityScore.toFixed(1)}%`,
        processingTime: `${file.colorData!.statistics.processingTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      [
        'Filename',
        'Original Size',
        'Total Colors',
        'Avg Luminance',
        'Avg Contrast',
        'Accessibility Score',
        'Processing Time',
        'Status',
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.totalColors.toString(),
        stat.averageLuminance,
        stat.averageContrast,
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
    link.download = 'color-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportColor, exportPalette, exportBatch, exportStatistics }
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

      const files = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.type.includes('json') ||
          file.type.includes('css') ||
          file.type.includes('text') ||
          file.name.match(/\.(json|css|scss|ase|gpl|txt)$/i)
      )

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error('Please drop only color palette files (JSON, CSS, SCSS, ASE, GPL, TXT)')
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
 * Enhanced Random Color Tool
 * Features: Real-time color generation, multiple formats, batch processing, color harmony
 */
const RandomColorCore = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'files'>('generator')
  const [currentColor, setCurrentColor] = useState<GeneratedColor | null>(null)
  const [currentPalette, setCurrentPalette] = useState<ColorPalette | null>(null)
  const [files, setFiles] = useState<ColorFile[]>([])
  const [_, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('vibrant-random')
  const [settings, setSettings] = useState<ColorSettings>({
    defaultFormat: 'hex',
    includeHarmony: true,
    checkAccessibility: true,
    generatePalettes: true,
    paletteSize: 5,
    exportFormat: 'json',
    colorSpace: 'sRGB',
  })

  const { generateColor, generatePalette } = useColorGeneration()
  const { exportColor, exportPalette } = useColorExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

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
  const applyTemplate = useCallback(
    (templateId: string) => {
      const template = colorTemplates.find((t) => t.id === templateId)
      if (template && template.settings) {
        setSettings((prev) => ({ ...prev, ...template.settings }))
        setSelectedTemplate(templateId)

        // Generate palette based on template
        if (template.baseColors.length > 0) {
          const palette = generatePalette(template.type, template.baseColors[0], template.settings.paletteSize || 5)
          setCurrentPalette(palette)
          if (palette.colors.length > 0) {
            setCurrentColor(palette.colors[0])
          }
        } else {
          const palette = generatePalette(template.type, undefined, template.settings.paletteSize || 5)
          setCurrentPalette(palette)
          if (palette.colors.length > 0) {
            setCurrentColor(palette.colors[0])
          }
        }

        toast.success(`Applied template: ${template.name}`)
      }
    },
    [generatePalette]
  )

  // Generate new color
  const handleGenerateColor = useCallback(() => {
    try {
      const newColor = generateColor()
      setCurrentColor(newColor)

      if (settings.generatePalettes) {
        const palette = generatePalette('random', newColor.hex, settings.paletteSize)
        setCurrentPalette(palette)
      }
    } catch (error) {
      toast.error('Failed to generate color')
      console.error(error)
    }
  }, [generateColor, generatePalette, settings])

  // Generate new palette
  const handleGeneratePalette = useCallback(
    (type: PaletteType) => {
      try {
        const baseColor = currentColor?.hex
        const palette = generatePalette(type, baseColor, settings.paletteSize)
        setCurrentPalette(palette)
        if (palette.colors.length > 0) {
          setCurrentColor(palette.colors[0])
        }
      } catch (error) {
        toast.error('Failed to generate palette')
        console.error(error)
      }
    },
    [currentColor, generatePalette, settings.paletteSize]
  )

  // Initialize with a random color
  React.useEffect(() => {
    handleGenerateColor()
  }, []) // Only run once on mount

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
              Random Color Generator
            </CardTitle>
            <CardDescription>
              Advanced random color generator with support for multiple formats, color harmony, and accessibility
              analysis. Generate beautiful color palettes and analyze color relationships for your design projects. Use
              keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'generator' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Color Generator
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Color Generator Tab */}
          <TabsContent value="generator" className="space-y-4">
            {/* Color Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Color Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
                          {template.baseColors.slice(0, 3).map((color, index) => (
                            <div key={index} className="w-4 h-4 rounded border" style={{ backgroundColor: color }} />
                          ))}
                          {template.baseColors.length > 3 && (
                            <div className="text-xs text-muted-foreground">+{template.baseColors.length - 3}</div>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Color Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Color</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentColor ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-24 h-24 rounded-lg border-2 border-border shadow-sm"
                          style={{ backgroundColor: currentColor.hex }}
                          aria-label={`Color preview: ${currentColor.hex}`}
                        />
                        <div className="space-y-2">
                          <div>
                            <Label className="text-sm font-medium">HEX</Label>
                            <div className="font-mono text-lg">{currentColor.hex}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(currentColor.hex, 'HEX color')}
                            >
                              {copiedText === 'HEX color' ? (
                                <Check className="h-4 w-4 mr-2" />
                              ) : (
                                <Copy className="h-4 w-4 mr-2" />
                              )}
                              Copy HEX
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => exportColor(currentColor, 'json')}>
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="font-medium">RGB</Label>
                          <div className="font-mono">
                            rgb({currentColor.rgb.r}, {currentColor.rgb.g}, {currentColor.rgb.b})
                          </div>
                        </div>
                        <div>
                          <Label className="font-medium">HSL</Label>
                          <div className="font-mono">
                            hsl({currentColor.hsl.h}, {currentColor.hsl.s}%, {currentColor.hsl.l}%)
                          </div>
                        </div>
                        <div>
                          <Label className="font-medium">HSV</Label>
                          <div className="font-mono">
                            hsv({currentColor.hsv.h}, {currentColor.hsv.s}%, {currentColor.hsv.v}%)
                          </div>
                        </div>
                        <div>
                          <Label className="font-medium">CMYK</Label>
                          <div className="font-mono">
                            cmyk({currentColor.cmyk.c}%, {currentColor.cmyk.m}%, {currentColor.cmyk.y}%,{' '}
                            {currentColor.cmyk.k}%)
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleGenerateColor}>
                          <Shuffle className="h-4 w-4 mr-2" />
                          Generate New Color
                        </Button>
                        <Button variant="outline" onClick={() => handleGeneratePalette('random')}>
                          <Palette className="h-4 w-4 mr-2" />
                          Generate Palette
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Click generate to create a random color</p>
                      <Button onClick={handleGenerateColor} className="mt-4">
                        <Shuffle className="h-4 w-4 mr-2" />
                        Generate Color
                      </Button>
                    </div>
                  )}
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
                  {currentColor ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="font-medium">Luminance</Label>
                          <div className="font-mono">{currentColor.metadata.luminance.toFixed(3)}</div>
                        </div>
                        <div>
                          <Label className="font-medium">Brightness</Label>
                          <div className="font-mono">{currentColor.metadata.brightness.toFixed(1)}</div>
                        </div>
                        <div>
                          <Label className="font-medium">Type</Label>
                          <div>{currentColor.metadata.isLight ? 'Light' : 'Dark'}</div>
                        </div>
                        <div>
                          <Label className="font-medium">Contrast</Label>
                          <div className="font-mono">{currentColor.metadata.contrast.toFixed(2)}:1</div>
                        </div>
                      </div>

                      {settings.checkAccessibility && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                            <Contrast className="h-4 w-4" />
                            <span className="font-medium">Accessibility Analysis</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  currentColor.metadata.accessibility.wcagAA ? 'text-green-600' : 'text-red-600'
                                }
                              >
                                {currentColor.metadata.accessibility.wcagAA ? '✓' : '✗'}
                              </span>
                              <span>WCAG AA compliant</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  currentColor.metadata.accessibility.wcagAAA ? 'text-green-600' : 'text-red-600'
                                }
                              >
                                {currentColor.metadata.accessibility.wcagAAA ? '✓' : '✗'}
                              </span>
                              <span>WCAG AAA compliant</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  currentColor.metadata.accessibility.colorBlindSafe
                                    ? 'text-green-600'
                                    : 'text-orange-600'
                                }
                              >
                                {currentColor.metadata.accessibility.colorBlindSafe ? '✓' : '⚠'}
                              </span>
                              <span>Colorblind friendly</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {settings.includeHarmony && currentColor.metadata.harmony.length > 0 && (
                        <div>
                          <Label className="font-medium mb-2 block">Color Harmonies</Label>
                          <div className="space-y-2">
                            {currentColor.metadata.harmony.slice(0, 3).map((harmony) => (
                              <div key={harmony.type} className="flex items-center gap-2">
                                <span className="text-sm capitalize min-w-0 flex-1">
                                  {harmony.type.replace('-', ' ')}
                                </span>
                                <div className="flex gap-1">
                                  {harmony.colors.slice(0, 4).map((color, index) => (
                                    <div
                                      key={index}
                                      className="w-6 h-6 rounded border cursor-pointer"
                                      style={{ backgroundColor: color }}
                                      onClick={() => copyToClipboard(color, `${harmony.type} color`)}
                                      title={color}
                                    />
                                  ))}
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => handleGeneratePalette(harmony.type)}>
                                  <Target className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Generate a color to see analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Current Palette */}
            {currentPalette && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Droplets className="h-5 w-5" />
                    {currentPalette.name} ({currentPalette.colors.length} colors)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {currentPalette.colors.map((color, index) => (
                        <div key={color.id} className="space-y-2">
                          <div
                            className="w-full h-20 rounded-lg border-2 border-border shadow-sm cursor-pointer"
                            style={{ backgroundColor: color.hex }}
                            onClick={() => setCurrentColor(color)}
                            aria-label={`Color ${index + 1}: ${color.hex}`}
                          />
                          <div className="text-center">
                            <div className="font-mono text-sm">{color.hex}</div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(color.hex, `color ${index + 1}`)}
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-sm font-medium">Dominant Hue</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span className="font-mono text-lg">{currentPalette.metadata.dominantHue.toFixed(0)}°</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Harmony Score</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span className="font-mono text-lg">{currentPalette.metadata.harmonyScore.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Accessibility</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span className="font-mono text-lg">
                            {currentPalette.metadata.accessibilityScore.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center pt-4 border-t">
                      <Button size="sm" variant="outline" onClick={() => handleGeneratePalette('monochromatic')}>
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Monochromatic
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleGeneratePalette('analogous')}>
                        <Droplets className="h-4 w-4 mr-2" />
                        Analogous
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleGeneratePalette('complementary')}>
                        <Contrast className="h-4 w-4 mr-2" />
                        Complementary
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleGeneratePalette('triadic')}>
                        <Target className="h-4 w-4 mr-2" />
                        Triadic
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportPalette(currentPalette, settings.exportFormat)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Palette
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Generator Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="palette-size" className="text-sm font-medium">
                      Palette Size
                    </Label>
                    <Input
                      id="palette-size"
                      type="number"
                      min="2"
                      max="10"
                      value={settings.paletteSize}
                      onChange={(e) => setSettings((prev) => ({ ...prev, paletteSize: Number(e.target.value) }))}
                      className="mt-2"
                    />
                  </div>

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
                        <SelectItem value="css">CSS</SelectItem>
                        <SelectItem value="scss">SCSS</SelectItem>
                        <SelectItem value="ase">Adobe ASE</SelectItem>
                        <SelectItem value="gpl">GIMP GPL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      id="include-harmony"
                      type="checkbox"
                      checked={settings.includeHarmony}
                      onChange={(e) => setSettings((prev) => ({ ...prev, includeHarmony: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="include-harmony" className="text-sm">
                      Generate color harmonies
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="check-accessibility"
                      type="checkbox"
                      checked={settings.checkAccessibility}
                      onChange={(e) => setSettings((prev) => ({ ...prev, checkAccessibility: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="check-accessibility" className="text-sm">
                      Check accessibility compliance
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="generate-palettes"
                      type="checkbox"
                      checked={settings.generatePalettes}
                      onChange={(e) => setSettings((prev) => ({ ...prev, generatePalettes: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="generate-palettes" className="text-sm">
                      Auto-generate palettes
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Batch Processing Tab */}
          <TabsContent value="files" className="space-y-4">
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
                    Drag and drop your color palette files here, or click to select files for batch color analysis
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports JSON, CSS, SCSS, ASE, GPL, TXT files • Max 5MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".json,.css,.scss,.ase,.gpl,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select color palette files"
                  />
                </div>
              </CardContent>
            </Card>

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
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Size:</span> {formatFileSize(file.size)}
                            </div>
                            {file.status === 'completed' && file.colorData && (
                              <div className="mt-2 text-xs">
                                {file.colorData.statistics.totalColors} colors analyzed
                              </div>
                            )}
                            {file.error && <div className="text-red-600 text-sm">Error: {file.error}</div>}
                          </div>
                          <div className="flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
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
const RandomColor = () => {
  return <RandomColorCore />
}

export default RandomColor
