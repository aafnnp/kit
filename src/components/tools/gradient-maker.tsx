import React, { useCallback, useRef, useState, useMemo } from 'react'
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
  FileText,
  Palette,
  Code,
  Upload,
  FileImage,
  Trash2,
  Target,
  Copy,
  Check,
  Eye,
  Shuffle,
  Plus,
  Minus,
  RotateCcw,
  Layers,
  Image as ImageIcon,
  Paintbrush,
} from 'lucide-react'
import { nanoid } from 'nanoid'
// Types
interface GradientFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  gradientData?: GradientData
}

interface GradientData {
  gradients: Gradient[]
  statistics: GradientStatistics
  settings: GradientSettings
}

interface Gradient {
  id: string
  type: GradientType
  colors: ColorStop[]
  angle?: number
  position?: RadialPosition
  shape?: RadialShape
  size?: RadialSize
  repeating?: boolean
  blendMode?: BlendMode
  css: string
  svg: string
  accessibility: GradientAccessibility
}

interface ColorStop {
  id: string
  color: string
  position: number
  opacity?: number
}

interface RadialPosition {
  x: number
  y: number
}

interface GradientAccessibility {
  contrastRatio: number
  wcagCompliant: boolean
  colorBlindSafe: boolean
  readabilityScore: number
}

interface GradientStatistics {
  totalGradients: number
  typeDistribution: Record<GradientType, number>
  averageColorStops: number
  averageContrastRatio: number
  accessibilityScore: number
  processingTime: number
}

interface GradientSettings {
  defaultType: GradientType
  maxColorStops: number
  includeAccessibility: boolean
  generateSVG: boolean
  optimizeOutput: boolean
  exportFormat: ExportFormat
}

interface GradientTemplate {
  id: string
  name: string
  description: string
  category: string
  gradient: Partial<Gradient>
  preview: string
}

// Enums
type GradientType = 'linear' | 'radial' | 'conic' | 'repeating-linear' | 'repeating-radial'
type RadialShape = 'circle' | 'ellipse'
type RadialSize = 'closest-side' | 'closest-corner' | 'farthest-side' | 'farthest-corner'
type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
type ExportFormat = 'css' | 'scss' | 'svg' | 'png' | 'json'

// Utility functions

const validateGradientFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['.json', '.css', '.scss', '.svg', '.txt']

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' }
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: 'Only JSON, CSS, SCSS, SVG, and TXT files are supported' }
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

// Preset directions for linear gradients
const presetDirections = [
  { label: '→', value: 90, name: 'Right' },
  { label: '↓', value: 180, name: 'Down' },
  { label: '←', value: 270, name: 'Left' },
  { label: '↑', value: 0, name: 'Up' },
  { label: '↘', value: 135, name: 'Down Right' },
  { label: '↙', value: 225, name: 'Down Left' },
  { label: '↖', value: 315, name: 'Up Left' },
  { label: '↗', value: 45, name: 'Up Right' },
]

// Gradient generation functions
const generateLinearGradient = (colors: ColorStop[], angle: number, repeating: boolean = false): string => {
  const colorStops = colors
    .sort((a, b) => a.position - b.position)
    .map((stop) => {
      const opacity = stop.opacity !== undefined ? stop.opacity / 100 : 1
      const color = opacity < 1 ? hexToRgba(stop.color, opacity) : stop.color
      return `${color} ${stop.position}%`
    })
    .join(', ')

  const gradientType = repeating ? 'repeating-linear-gradient' : 'linear-gradient'
  return `${gradientType}(${angle}deg, ${colorStops})`
}

const generateRadialGradient = (
  colors: ColorStop[],
  position: RadialPosition,
  shape: RadialShape,
  size: RadialSize,
  repeating: boolean = false
): string => {
  const colorStops = colors
    .sort((a, b) => a.position - b.position)
    .map((stop) => {
      const opacity = stop.opacity !== undefined ? stop.opacity / 100 : 1
      const color = opacity < 1 ? hexToRgba(stop.color, opacity) : stop.color
      return `${color} ${stop.position}%`
    })
    .join(', ')

  const gradientType = repeating ? 'repeating-radial-gradient' : 'radial-gradient'
  const positionStr = `${position.x}% ${position.y}%`
  return `${gradientType}(${shape} ${size} at ${positionStr}, ${colorStops})`
}

const generateConicGradient = (colors: ColorStop[], angle: number, position: RadialPosition): string => {
  const colorStops = colors
    .sort((a, b) => a.position - b.position)
    .map((stop) => {
      const opacity = stop.opacity !== undefined ? stop.opacity / 100 : 1
      const color = opacity < 1 ? hexToRgba(stop.color, opacity) : stop.color
      return `${color} ${stop.position * 3.6}deg`
    })
    .join(', ')

  const positionStr = `${position.x}% ${position.y}%`
  return `conic-gradient(from ${angle}deg at ${positionStr}, ${colorStops})`
}

const generateSVGGradient = (gradient: Gradient): string => {
  const { id, type, colors, angle, position } = gradient

  let gradientElement = ''

  if (type === 'linear' || type === 'repeating-linear') {
    const x1 = Math.cos(((angle! - 90) * Math.PI) / 180) * 50 + 50
    const y1 = Math.sin(((angle! - 90) * Math.PI) / 180) * 50 + 50
    const x2 = Math.cos(((angle! + 90) * Math.PI) / 180) * 50 + 50
    const y2 = Math.sin(((angle! + 90) * Math.PI) / 180) * 50 + 50

    gradientElement = `
      <linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        ${colors
          .map((stop) => {
            const opacity = stop.opacity !== undefined ? stop.opacity / 100 : 1
            return `<stop offset="${stop.position}%" stop-color="${stop.color}" stop-opacity="${opacity}" />`
          })
          .join('\n        ')}
      </linearGradient>`
  } else if (type === 'radial' || type === 'repeating-radial') {
    gradientElement = `
      <radialGradient id="${id}" cx="${position?.x || 50}%" cy="${position?.y || 50}%">
        ${colors
          .map((stop) => {
            const opacity = stop.opacity !== undefined ? stop.opacity / 100 : 1
            return `<stop offset="${stop.position}%" stop-color="${stop.color}" stop-opacity="${opacity}" />`
          })
          .join('\n        ')}
      </radialGradient>`
  }

  return `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${gradientElement}
      </defs>
      <rect width="100%" height="100%" fill="url(#${id})" />
    </svg>`.trim()
}

// Color utility functions
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex

  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const calculateContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (hex: string): number => {
    const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!rgb) return 0

    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((c) => {
      const val = parseInt(c, 16) / 255
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

const analyzeGradientAccessibility = (colors: ColorStop[]): GradientAccessibility => {
  if (colors.length < 2) {
    return {
      contrastRatio: 1,
      wcagCompliant: false,
      colorBlindSafe: false,
      readabilityScore: 0,
    }
  }

  // Calculate contrast ratio between first and last colors
  const contrastRatio = calculateContrastRatio(colors[0].color, colors[colors.length - 1].color)
  const wcagCompliant = contrastRatio >= 4.5

  // Simplified color blind safety check
  const colorBlindSafe = colors.every((stop) => {
    const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(stop.color)
    if (!rgb) return false

    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((c) => parseInt(c, 16))
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    const colorDiff = Math.abs(r - g) + Math.abs(r - b) + Math.abs(g - b)

    return brightness > 125 && colorDiff > 500
  })

  const readabilityScore = Math.min(100, (contrastRatio / 7) * 100)

  return {
    contrastRatio: Math.round(contrastRatio * 100) / 100,
    wcagCompliant,
    colorBlindSafe,
    readabilityScore: Math.round(readabilityScore),
  }
}

// Create complete gradient object
const createGradient = (
  type: GradientType,
  colors: ColorStop[],
  angle?: number,
  position?: RadialPosition,
  shape?: RadialShape,
  size?: RadialSize,
  repeating?: boolean
): Gradient => {
  const id = nanoid()

  let css = ''
  switch (type) {
    case 'linear':
    case 'repeating-linear':
      css = generateLinearGradient(colors, angle || 90, repeating)
      break
    case 'radial':
    case 'repeating-radial':
      css = generateRadialGradient(
        colors,
        position || { x: 50, y: 50 },
        shape || 'circle',
        size || 'farthest-corner',
        repeating
      )
      break
    case 'conic':
      css = generateConicGradient(colors, angle || 0, position || { x: 50, y: 50 })
      break
  }

  const gradient: Gradient = {
    id,
    type,
    colors,
    angle,
    position,
    shape,
    size,
    repeating,
    css,
    svg: generateSVGGradient({ id, type, colors, angle, position } as Gradient),
    accessibility: analyzeGradientAccessibility(colors),
  }

  return gradient
}

// Gradient templates
const gradientTemplates: GradientTemplate[] = [
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm sunset colors',
    category: 'Nature',
    gradient: {
      type: 'linear',
      colors: [
        { id: '1', color: '#ff7e5f', position: 0 },
        { id: '2', color: '#feb47b', position: 100 },
      ],
      angle: 45,
    },
    preview: 'linear-gradient(45deg, #ff7e5f 0%, #feb47b 100%)',
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Deep ocean gradient',
    category: 'Nature',
    gradient: {
      type: 'linear',
      colors: [
        { id: '1', color: '#2196F3', position: 0 },
        { id: '2', color: '#21CBF3', position: 100 },
      ],
      angle: 135,
    },
    preview: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
  },
  {
    id: 'purple-rain',
    name: 'Purple Rain',
    description: 'Purple to pink gradient',
    category: 'Vibrant',
    gradient: {
      type: 'linear',
      colors: [
        { id: '1', color: '#667eea', position: 0 },
        { id: '2', color: '#764ba2', position: 100 },
      ],
      angle: 90,
    },
    preview: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'green-forest',
    name: 'Green Forest',
    description: 'Fresh forest greens',
    category: 'Nature',
    gradient: {
      type: 'linear',
      colors: [
        { id: '1', color: '#134e5e', position: 0 },
        { id: '2', color: '#71b280', position: 100 },
      ],
      angle: 180,
    },
    preview: 'linear-gradient(180deg, #134e5e 0%, #71b280 100%)',
  },
  {
    id: 'radial-burst',
    name: 'Radial Burst',
    description: 'Radial gradient from center',
    category: 'Radial',
    gradient: {
      type: 'radial',
      colors: [
        { id: '1', color: '#ff9a9e', position: 0 },
        { id: '2', color: '#fecfef', position: 50 },
        { id: '3', color: '#fecfef', position: 100 },
      ],
      position: { x: 50, y: 50 },
      shape: 'circle',
      size: 'farthest-corner',
    },
    preview: 'radial-gradient(circle at 50% 50%, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
  },
  {
    id: 'conic-rainbow',
    name: 'Conic Rainbow',
    description: 'Rainbow conic gradient',
    category: 'Conic',
    gradient: {
      type: 'conic',
      colors: [
        { id: '1', color: '#ff0000', position: 0 },
        { id: '2', color: '#ff8000', position: 16.67 },
        { id: '3', color: '#ffff00', position: 33.33 },
        { id: '4', color: '#80ff00', position: 50 },
        { id: '5', color: '#00ff80', position: 66.67 },
        { id: '6', color: '#0080ff', position: 83.33 },
        { id: '7', color: '#8000ff', position: 100 },
      ],
      angle: 0,
      position: { x: 50, y: 50 },
    },
    preview:
      'conic-gradient(from 0deg at 50% 50%, #ff0000 0deg, #ff8000 60deg, #ffff00 120deg, #80ff00 180deg, #00ff80 240deg, #0080ff 300deg, #8000ff 360deg)',
  },
]

// Real-time gradient preview hook
const useRealTimeGradient = (
  type: GradientType,
  colors: ColorStop[],
  angle?: number,
  position?: RadialPosition,
  shape?: RadialShape,
  size?: RadialSize,
  repeating?: boolean
) => {
  return useMemo(() => {
    if (!colors.length) {
      return {
        gradient: null,
        error: null,
        isEmpty: true,
      }
    }

    try {
      const gradient = createGradient(type, colors, angle, position, shape, size, repeating)
      return {
        gradient,
        error: null,
        isEmpty: false,
      }
    } catch (error) {
      return {
        gradient: null,
        error: error instanceof Error ? error.message : 'Gradient generation failed',
        isEmpty: false,
      }
    }
  }, [type, colors, angle, position, shape, size, repeating])
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<GradientFile> => {
    const validation = validateGradientFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const gradientFile: GradientFile = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type || 'text/plain',
            status: 'pending',
          }

          resolve(gradientFile)
        } catch (error) {
          reject(new Error('Failed to process file'))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<GradientFile[]> => {
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
const useGradientExport = () => {
  const exportGradient = useCallback((gradient: Gradient, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'css':
        content = `.gradient {\n  background: ${gradient.css};\n}`
        mimeType = 'text/css'
        extension = '.css'
        break
      case 'scss':
        content = `$gradient: ${gradient.css};\n\n.gradient {\n  background: $gradient;\n}`
        mimeType = 'text/scss'
        extension = '.scss'
        break
      case 'svg':
        content = gradient.svg
        mimeType = 'image/svg+xml'
        extension = '.svg'
        break
      case 'json':
        content = JSON.stringify(
          {
            id: gradient.id,
            type: gradient.type,
            colors: gradient.colors,
            angle: gradient.angle,
            position: gradient.position,
            shape: gradient.shape,
            size: gradient.size,
            repeating: gradient.repeating,
            css: gradient.css,
            accessibility: gradient.accessibility,
          },
          null,
          2
        )
        mimeType = 'application/json'
        extension = '.json'
        break
      default:
        content = gradient.css
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `gradient${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: GradientFile[]) => {
      const completedFiles = files.filter((f) => f.gradientData)

      if (completedFiles.length === 0) {
        toast.error('No gradients to export')
        return
      }

      completedFiles.forEach((file) => {
        if (file.gradientData) {
          file.gradientData.gradients.forEach((gradient, index) => {
            const baseName = file.name.replace(/\.[^/.]+$/, '')
            exportGradient(gradient, 'css', `${baseName}-gradient-${index + 1}.css`)
          })
        }
      })

      toast.success(`Exported gradients from ${completedFiles.length} file(s)`)
    },
    [exportGradient]
  )

  const exportStatistics = useCallback((files: GradientFile[]) => {
    const stats = files
      .filter((f) => f.gradientData)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.size),
        totalGradients: file.gradientData!.statistics.totalGradients,
        averageColorStops: file.gradientData!.statistics.averageColorStops.toFixed(1),
        averageContrastRatio: file.gradientData!.statistics.averageContrastRatio.toFixed(2),
        accessibilityScore: file.gradientData!.statistics.accessibilityScore.toFixed(1),
        processingTime: `${file.gradientData!.statistics.processingTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      [
        'Filename',
        'Original Size',
        'Total Gradients',
        'Avg Color Stops',
        'Avg Contrast Ratio',
        'Accessibility Score',
        'Processing Time',
        'Status',
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.totalGradients.toString(),
        stat.averageColorStops,
        stat.averageContrastRatio,
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
    link.download = 'gradient-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportGradient, exportBatch, exportStatistics }
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

      const files = Array.from(e.dataTransfer.files).filter((file) => file.name.match(/\.(json|css|scss|svg|txt)$/i))

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error('Please drop only JSON, CSS, SCSS, SVG, or TXT files')
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
 * Enhanced Gradient Maker Tool
 * Features: Real-time gradient generation, multiple types, batch processing, accessibility analysis
 */
const GradientMakerCore = () => {
  const [activeTab, setActiveTab] = useState<'maker' | 'files'>('maker')
  const [gradientType, setGradientType] = useState<GradientType>('linear')
  const [colors, setColors] = useState<ColorStop[]>([
    { id: '1', color: '#ff7e5f', position: 0 },
    { id: '2', color: '#feb47b', position: 100 },
  ])
  const [angle, setAngle] = useState(90)
  const [position, setPosition] = useState<RadialPosition>({ x: 50, y: 50 })
  const [shape, setShape] = useState<RadialShape>('circle')
  const [size, setSize] = useState<RadialSize>('farthest-corner')
  const [repeating, setRepeating] = useState(false)
  const [files, setFiles] = useState<GradientFile[]>([])
  const [_, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('sunset')
  const [settings] = useState<GradientSettings>({
    defaultType: 'linear',
    maxColorStops: 10,
    includeAccessibility: true,
    generateSVG: true,
    optimizeOutput: false,
    exportFormat: 'css',
  })

  const { exportGradient } = useGradientExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Real-time gradient generation
  const gradientPreview = useRealTimeGradient(gradientType, colors, angle, position, shape, size, repeating)

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
    const template = gradientTemplates.find((t) => t.id === templateId)
    if (template && template.gradient) {
      if (template.gradient.type) setGradientType(template.gradient.type)
      if (template.gradient.colors) setColors(template.gradient.colors)
      if (template.gradient.angle !== undefined) setAngle(template.gradient.angle)
      if (template.gradient.position) setPosition(template.gradient.position)
      if (template.gradient.shape) setShape(template.gradient.shape)
      if (template.gradient.size) setSize(template.gradient.size)
      if (template.gradient.repeating !== undefined) setRepeating(template.gradient.repeating)

      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Color stop management
  const addColorStop = useCallback(() => {
    if (colors.length < settings.maxColorStops) {
      const newPosition = colors.length > 0 ? Math.max(...colors.map((c) => c.position)) + 10 : 0
      setColors((prev) => [
        ...prev,
        {
          id: nanoid(),
          color: '#ffffff',
          position: Math.min(newPosition, 100),
        },
      ])
    }
  }, [colors, settings.maxColorStops])

  const removeColorStop = useCallback(
    (id: string) => {
      if (colors.length > 2) {
        setColors((prev) => prev.filter((c) => c.id !== id))
      }
    },
    [colors.length]
  )

  const updateColorStop = useCallback((id: string, updates: Partial<ColorStop>) => {
    setColors((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }, [])

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
              <Paintbrush className="h-5 w-5" aria-hidden="true" />
              Gradient Maker
            </CardTitle>
            <CardDescription>
              Advanced gradient generator with support for linear, radial, and conic gradients, accessibility analysis,
              and batch processing. Use keyboard navigation: Tab to move between controls, Enter or Space to activate
              buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'maker' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="maker" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Gradient Maker
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Gradient Maker Tab */}
          <TabsContent value="maker" className="space-y-4">
            {/* Gradient Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Gradient Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {gradientTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? 'default' : 'outline'}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div
                          className="w-full h-8 rounded mt-2 border"
                          style={{ background: template.preview }}
                          title={template.preview}
                        />
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gradient Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gradient Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gradient-type">Gradient Type</Label>
                    <Select value={gradientType} onValueChange={(value: GradientType) => setGradientType(value)}>
                      <SelectTrigger id="gradient-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="radial">Radial</SelectItem>
                        <SelectItem value="conic">Conic</SelectItem>
                        <SelectItem value="repeating-linear">Repeating Linear</SelectItem>
                        <SelectItem value="repeating-radial">Repeating Radial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(gradientType === 'linear' || gradientType === 'repeating-linear' || gradientType === 'conic') && (
                    <div className="space-y-2">
                      <Label htmlFor="angle">Angle: {angle}°</Label>
                      <Input
                        id="angle"
                        type="range"
                        min="0"
                        max="360"
                        value={angle}
                        onChange={(e) => setAngle(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex gap-2 flex-wrap">
                        {presetDirections.map((preset) => (
                          <Button
                            key={preset.value}
                            size="sm"
                            variant={angle === preset.value ? 'default' : 'outline'}
                            onClick={() => setAngle(preset.value)}
                            title={preset.name}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(gradientType === 'radial' || gradientType === 'repeating-radial' || gradientType === 'conic') && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="position-x">Position X: {position.x}%</Label>
                          <Input
                            id="position-x"
                            type="range"
                            min="0"
                            max="100"
                            value={position.x}
                            onChange={(e) => setPosition((prev) => ({ ...prev, x: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="position-y">Position Y: {position.y}%</Label>
                          <Input
                            id="position-y"
                            type="range"
                            min="0"
                            max="100"
                            value={position.y}
                            onChange={(e) => setPosition((prev) => ({ ...prev, y: Number(e.target.value) }))}
                          />
                        </div>
                      </div>

                      {(gradientType === 'radial' || gradientType === 'repeating-radial') && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="shape">Shape</Label>
                            <Select value={shape} onValueChange={(value: RadialShape) => setShape(value)}>
                              <SelectTrigger id="shape">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="circle">Circle</SelectItem>
                                <SelectItem value="ellipse">Ellipse</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="size">Size</Label>
                            <Select value={size} onValueChange={(value: RadialSize) => setSize(value)}>
                              <SelectTrigger id="size">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="closest-side">Closest Side</SelectItem>
                                <SelectItem value="closest-corner">Closest Corner</SelectItem>
                                <SelectItem value="farthest-side">Farthest Side</SelectItem>
                                <SelectItem value="farthest-corner">Farthest Corner</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      id="repeating"
                      type="checkbox"
                      checked={repeating}
                      onChange={(e) => setRepeating(e.target.checked)}
                      className="rounded border-input"
                    />
                    <Label htmlFor="repeating" className="text-sm">
                      Repeating Gradient
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Gradient Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {gradientPreview.error ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <Paintbrush className="h-4 w-4" />
                        <span className="font-medium">Gradient Generation Error</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{gradientPreview.error}</p>
                    </div>
                  ) : gradientPreview.gradient ? (
                    <div className="space-y-4">
                      {/* Gradient Display */}
                      <div
                        className="w-full h-32 rounded-lg border-2 border-gray-300"
                        style={{ background: gradientPreview.gradient.css }}
                        title={gradientPreview.gradient.css}
                      />

                      {/* CSS Output */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">CSS Code</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(gradientPreview.gradient!.css, 'CSS gradient')}
                          >
                            {copiedText === 'CSS gradient' ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Textarea
                          value={gradientPreview.gradient.css}
                          readOnly
                          className="font-mono text-sm"
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Paintbrush className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Configure gradient settings to see preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Color Stops */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Color Stops
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Colors ({colors.length}/{settings.maxColorStops})
                    </Label>
                    <Button size="sm" onClick={addColorStop} disabled={colors.length >= settings.maxColorStops}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Color
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {colors.map((colorStop, index) => (
                      <div key={colorStop.id} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Color {index + 1}</span>
                          {colors.length > 2 && (
                            <Button size="sm" variant="ghost" onClick={() => removeColorStop(colorStop.id)}>
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <Input
                            type="color"
                            value={colorStop.color}
                            onChange={(e) => updateColorStop(colorStop.id, { color: e.target.value })}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <div className="flex-1">
                            <Input
                              value={colorStop.color}
                              onChange={(e) => updateColorStop(colorStop.id, { color: e.target.value })}
                              placeholder="#000000"
                              className="font-mono"
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(colorStop.color, `color ${index + 1}`)}
                          >
                            {copiedText === `color ${index + 1}` ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Position: {colorStop.position}%</Label>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={colorStop.position}
                            onChange={(e) => updateColorStop(colorStop.id, { position: Number(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        {colorStop.opacity !== undefined && (
                          <div className="space-y-2">
                            <Label className="text-xs">Opacity: {colorStop.opacity}%</Label>
                            <Input
                              type="range"
                              min="0"
                              max="100"
                              value={colorStop.opacity}
                              onChange={(e) => updateColorStop(colorStop.id, { opacity: Number(e.target.value) })}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const randomColors = colors.map((c) => ({
                          ...c,
                          color:
                            '#' +
                            Math.floor(Math.random() * 16777215)
                              .toString(16)
                              .padStart(6, '0'),
                        }))
                        setColors(randomColors)
                      }}
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                      Random Colors
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reversedColors = [...colors].reverse().map((c, i) => ({
                          ...c,
                          position: (i / (colors.length - 1)) * 100,
                        }))
                        setColors(reversedColors)
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reverse
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Analysis */}
            {gradientPreview.gradient && settings.includeAccessibility && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Accessibility Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Contrast Ratio</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span className="font-mono text-lg">
                            {gradientPreview.gradient.accessibility.contrastRatio}:1
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">WCAG Compliance</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span
                            className={`font-medium ${gradientPreview.gradient.accessibility.wcagCompliant ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {gradientPreview.gradient.accessibility.wcagCompliant
                              ? 'WCAG AA Compliant'
                              : 'Not WCAG AA Compliant'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Color Blind Safety</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span
                            className={`font-medium ${gradientPreview.gradient.accessibility.colorBlindSafe ? 'text-green-600' : 'text-orange-600'}`}
                          >
                            {gradientPreview.gradient.accessibility.colorBlindSafe
                              ? 'Color Blind Safe'
                              : 'May be difficult for color blind users'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Readability Score</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-lg">
                              {gradientPreview.gradient.accessibility.readabilityScore}%
                            </span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${gradientPreview.gradient.accessibility.readabilityScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Actions */}
            {gradientPreview.gradient && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button onClick={() => exportGradient(gradientPreview.gradient!, 'css')} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSS
                    </Button>

                    <Button onClick={() => exportGradient(gradientPreview.gradient!, 'scss')} variant="outline">
                      <Code className="mr-2 h-4 w-4" />
                      Export SCSS
                    </Button>

                    <Button onClick={() => exportGradient(gradientPreview.gradient!, 'svg')} variant="outline">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Export SVG
                    </Button>

                    <Button onClick={() => exportGradient(gradientPreview.gradient!, 'json')} variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>

                    <Button
                      onClick={() => copyToClipboard(gradientPreview.gradient!.css, 'gradient CSS')}
                      variant="outline"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy CSS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
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
                  aria-label="Drag and drop gradient files here or click to select files"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Gradient Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your gradient files here, or click to select files
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports JSON, CSS, SCSS, SVG, and TXT files • Max 10MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".json,.css,.scss,.svg,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select gradient files"
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
                            {file.status === 'completed' && file.gradientData && (
                              <div className="mt-2 text-xs">
                                {file.gradientData.statistics.totalGradients} gradients processed
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
const GradientMaker = () => {
  return <GradientMakerCore />
}

export default GradientMaker
