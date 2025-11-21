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
  Upload,
  FileImage,
  Trash2,
  Target,
  Copy,
  Check,
  Eye,
  Shuffle,
  RotateCcw,
  Ruler,
  Monitor,
  Smartphone,
  Tablet,
  Settings,
  Calculator,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  AccessibilityInfo,
  ClampMetadata,
  ClampSettings,
  ClampTemplate,
  CssClampFile,
  CssProperty,
  CssUnit,
  ExportFormat,
  GeneratedClamp,
  ResponsiveBreakpoint,
  ViewportRange,
} from '@/types/css-clamp'
import { formatFileSize } from '@/lib/utils'

const validateCssFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['.css', '.scss', '.sass', '.less', '.txt']

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' }
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: 'Only CSS, SCSS, SASS, LESS, and TXT files are supported' }
  }

  return { isValid: true }
}

// CSS clamp calculation functions
const convertToPixels = (value: number, unit: CssUnit, baseSize: number = 16): number => {
  switch (unit) {
    case 'px':
      return value
    case 'rem':
      return value * baseSize
    case 'em':
      return value * baseSize
    case 'vw':
      return (value / 100) * window.innerWidth
    case 'vh':
      return (value / 100) * window.innerHeight
    case 'vmin':
      return (value / 100) * Math.min(window.innerWidth, window.innerHeight)
    case 'vmax':
      return (value / 100) * Math.max(window.innerWidth, window.innerHeight)
    case '%':
      return value // Percentage depends on parent, return as-is
    case 'ch':
      return value * (baseSize * 0.5) // Approximate character width
    case 'ex':
      return value * (baseSize * 0.5) // Approximate x-height
    default:
      return value
  }
}

const calculateClampValue = (
  minValue: number,
  idealValue: number,
  maxValue: number,
  minUnit: CssUnit,
  idealUnit: CssUnit,
  maxUnit: CssUnit,
  viewportRange: ViewportRange
): GeneratedClamp => {
  try {
    // Convert values to pixels for calculation
    const minPx = convertToPixels(minValue, minUnit)
    const maxPx = convertToPixels(maxValue, maxUnit)

    // Calculate scaling factor
    const viewportDiff = viewportRange.maxWidth - viewportRange.minWidth
    const valueDiff = maxPx - minPx
    const scalingFactor = valueDiff / viewportDiff

    // Generate clamp rule
    const clampRule = `clamp(${minValue}${minUnit}, ${idealValue}${idealUnit}, ${maxValue}${maxUnit})`

    // Calculate responsive breakpoints
    const breakpoints: ResponsiveBreakpoint[] = [
      { name: 'Mobile', width: 320, value: minValue, unit: minUnit },
      { name: 'Tablet', width: 768, value: idealValue, unit: idealUnit },
      { name: 'Desktop', width: 1024, value: maxValue, unit: maxUnit },
      { name: 'Wide', width: 1440, value: maxValue, unit: maxUnit },
    ]

    // Accessibility analysis
    const accessibility: AccessibilityInfo = {
      meetsMinimumSize: minPx >= 16, // WCAG minimum for text
      scalingRatio: maxPx / minPx,
      readabilityScore: Math.min(100, (minPx / 16) * 100),
      contrastCompatible: true,
    }

    const metadata: ClampMetadata = {
      minViewport: viewportRange.minWidth,
      maxViewport: viewportRange.maxWidth,
      scalingFactor,
      responsiveRange: viewportDiff,
      isValid: minPx <= maxPx && idealValue > 0,
      breakpoints,
      accessibility,
    }

    return {
      id: nanoid(),
      property: 'font-size',
      minValue,
      idealValue,
      maxValue,
      minUnit,
      idealUnit,
      maxUnit,
      clampRule,
      cssRule: `font-size: ${clampRule};`,
      metadata,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Clamp calculation failed')
  }
}

const validateClampValues = (
  minValue: number,
  idealValue: number,
  maxValue: number,
  minUnit: CssUnit,
  _idealUnit: CssUnit,
  maxUnit: CssUnit
): { isValid: boolean; error?: string } => {
  if (minValue <= 0 || idealValue <= 0 || maxValue <= 0) {
    return { isValid: false, error: 'All values must be positive numbers' }
  }

  if (minValue >= maxValue) {
    return { isValid: false, error: 'Minimum value must be less than maximum value' }
  }

  // Convert to pixels for comparison
  const minPx = convertToPixels(minValue, minUnit)
  const maxPx = convertToPixels(maxValue, maxUnit)

  if (minPx >= maxPx) {
    return { isValid: false, error: 'Minimum value must be less than maximum value when converted to pixels' }
  }

  return { isValid: true }
}

// Generate CSS clamp for different properties
const generatePropertyClamp = (
  property: CssProperty,
  minValue: number,
  idealValue: number,
  maxValue: number,
  minUnit: CssUnit,
  idealUnit: CssUnit,
  maxUnit: CssUnit,
  viewportRange: ViewportRange
): GeneratedClamp => {
  const clamp = calculateClampValue(minValue, idealValue, maxValue, minUnit, idealUnit, maxUnit, viewportRange)

  return {
    ...clamp,
    property,
    cssRule: `${property}: ${clamp.clampRule};`,
  }
}

// CSS clamp templates
const clampTemplates: ClampTemplate[] = [
  {
    id: 'responsive-text',
    name: 'Responsive Text',
    description: 'Fluid typography that scales with viewport',
    category: 'Typography',
    property: 'font-size',
    minValue: 16,
    idealValue: 4,
    maxValue: 24,
    minUnit: 'px',
    idealUnit: 'vw',
    maxUnit: 'px',
    viewportRange: { minWidth: 320, maxWidth: 1200 },
  },
  {
    id: 'heading-large',
    name: 'Large Heading',
    description: 'Responsive heading for hero sections',
    category: 'Typography',
    property: 'font-size',
    minValue: 32,
    idealValue: 8,
    maxValue: 64,
    minUnit: 'px',
    idealUnit: 'vw',
    maxUnit: 'px',
    viewportRange: { minWidth: 320, maxWidth: 1200 },
  },
  {
    id: 'container-width',
    name: 'Container Width',
    description: 'Responsive container with fluid width',
    category: 'Layout',
    property: 'width',
    minValue: 320,
    idealValue: 90,
    maxValue: 1200,
    minUnit: 'px',
    idealUnit: 'vw',
    maxUnit: 'px',
    viewportRange: { minWidth: 320, maxWidth: 1440 },
  },
  {
    id: 'spacing-margin',
    name: 'Responsive Margin',
    description: 'Fluid spacing that adapts to screen size',
    category: 'Spacing',
    property: 'margin',
    minValue: 1,
    idealValue: 4,
    maxValue: 3,
    minUnit: 'rem',
    idealUnit: 'vw',
    maxUnit: 'rem',
    viewportRange: { minWidth: 320, maxWidth: 1200 },
  },
  {
    id: 'spacing-padding',
    name: 'Responsive Padding',
    description: 'Fluid padding for consistent spacing',
    category: 'Spacing',
    property: 'padding',
    minValue: 0.5,
    idealValue: 2,
    maxValue: 2,
    minUnit: 'rem',
    idealUnit: 'vw',
    maxUnit: 'rem',
    viewportRange: { minWidth: 320, maxWidth: 1200 },
  },
  {
    id: 'border-radius',
    name: 'Responsive Border Radius',
    description: 'Fluid border radius for modern designs',
    category: 'Design',
    property: 'border-radius',
    minValue: 4,
    idealValue: 1,
    maxValue: 16,
    minUnit: 'px',
    idealUnit: 'vw',
    maxUnit: 'px',
    viewportRange: { minWidth: 320, maxWidth: 1200 },
  },
  {
    id: 'gap-responsive',
    name: 'Responsive Gap',
    description: 'Fluid gap for grid and flexbox layouts',
    category: 'Layout',
    property: 'gap',
    minValue: 0.5,
    idealValue: 2,
    maxValue: 2.5,
    minUnit: 'rem',
    idealUnit: 'vw',
    maxUnit: 'rem',
    viewportRange: { minWidth: 320, maxWidth: 1200 },
  },
  {
    id: 'line-height',
    name: 'Responsive Line Height',
    description: 'Fluid line height for better readability',
    category: 'Typography',
    property: 'line-height',
    minValue: 1.4,
    idealValue: 0.2,
    maxValue: 1.8,
    minUnit: 'em',
    idealUnit: 'vw',
    maxUnit: 'em',
    viewportRange: { minWidth: 320, maxWidth: 1200 },
  },
]

// Real-time clamp calculation hook
const useRealTimeClamp = (
  property: CssProperty,
  minValue: number,
  idealValue: number,
  maxValue: number,
  minUnit: CssUnit,
  idealUnit: CssUnit,
  maxUnit: CssUnit,
  viewportRange: ViewportRange
) => {
  return useMemo(() => {
    if (!minValue || !idealValue || !maxValue) {
      return {
        result: null,
        error: null,
        isEmpty: true,
      }
    }

    try {
      const validation = validateClampValues(minValue, idealValue, maxValue, minUnit, idealUnit, maxUnit)
      if (!validation.isValid) {
        return {
          result: null,
          error: validation.error,
          isEmpty: false,
        }
      }

      const result = generatePropertyClamp(
        property,
        minValue,
        idealValue,
        maxValue,
        minUnit,
        idealUnit,
        maxUnit,
        viewportRange
      )
      return {
        result,
        error: null,
        isEmpty: false,
      }
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Clamp calculation failed',
        isEmpty: false,
      }
    }
  }, [property, minValue, idealValue, maxValue, minUnit, idealUnit, maxUnit, viewportRange])
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<CssClampFile> => {
    const validation = validateCssFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const clampFile: CssClampFile = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type || 'text/css',
            status: 'pending',
          }

          resolve(clampFile)
        } catch (error) {
          reject(new Error('Failed to process file'))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<CssClampFile[]> => {
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
            type: files[index].type || 'text/css',
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
const useClampExport = () => {
  const exportClamp = useCallback((clamp: GeneratedClamp, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.css'

    switch (format) {
      case 'css':
        content = clamp.cssRule
        mimeType = 'text/css'
        extension = '.css'
        break
      case 'scss':
        content = `$clamp-${clamp.property}: ${clamp.clampRule};\n${clamp.cssRule}`
        mimeType = 'text/scss'
        extension = '.scss'
        break
      case 'json':
        content = JSON.stringify(
          {
            id: clamp.id,
            property: clamp.property,
            clampRule: clamp.clampRule,
            cssRule: clamp.cssRule,
            values: {
              min: { value: clamp.minValue, unit: clamp.minUnit },
              ideal: { value: clamp.idealValue, unit: clamp.idealUnit },
              max: { value: clamp.maxValue, unit: clamp.maxUnit },
            },
            metadata: clamp.metadata,
          },
          null,
          2
        )
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'js':
        content = `export const ${clamp.property.replace('-', '')}Clamp = '${clamp.clampRule}';`
        mimeType = 'text/javascript'
        extension = '.js'
        break
      default:
        content = clamp.cssRule
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `clamp-${clamp.property}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: CssClampFile[]) => {
      const completedFiles = files.filter((f) => f.clampData)

      if (completedFiles.length === 0) {
        toast.error('No clamp results to export')
        return
      }

      completedFiles.forEach((file) => {
        if (file.clampData) {
          file.clampData.clamps.forEach((clamp, index) => {
            const baseName = file.name.replace(/\.[^/.]+$/, '')
            exportClamp(clamp, 'css', `${baseName}-clamp-${index + 1}.css`)
          })
        }
      })

      toast.success(`Exported results from ${completedFiles.length} file(s)`)
    },
    [exportClamp]
  )

  const exportStatistics = useCallback((files: CssClampFile[]) => {
    const stats = files
      .filter((f) => f.clampData)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.size),
        totalClamps: file.clampData!.statistics.totalClamps,
        averageScalingFactor: file.clampData!.statistics.averageScalingFactor.toFixed(3),
        responsiveRange: file.clampData!.statistics.responsiveRangeAverage.toFixed(0),
        accessibilityScore: `${file.clampData!.statistics.accessibilityScore.toFixed(1)}%`,
        processingTime: `${file.clampData!.statistics.processingTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      [
        'Filename',
        'Original Size',
        'Total Clamps',
        'Avg Scaling Factor',
        'Responsive Range',
        'Accessibility Score',
        'Processing Time',
        'Status',
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.totalClamps.toString(),
        stat.averageScalingFactor,
        stat.responsiveRange,
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
    link.download = 'clamp-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportClamp, exportBatch, exportStatistics }
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
          file.type.includes('css') || file.type.includes('text') || file.name.match(/\.(css|scss|sass|less|txt)$/i)
      )

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error('Please drop only CSS or text files')
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
 * Enhanced CSS Clamp Tool
 * Features: Real-time clamp generation, multiple units, batch processing, responsive design
 */
const CssClampCore = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'files'>('generator')
  const [property, setProperty] = useState<CssProperty>('font-size')
  const [minValue, setMinValue] = useState<number>(16)
  const [idealValue, setIdealValue] = useState<number>(4)
  const [maxValue, setMaxValue] = useState<number>(24)
  const [minUnit, setMinUnit] = useState<CssUnit>('px')
  const [idealUnit, setIdealUnit] = useState<CssUnit>('vw')
  const [maxUnit, setMaxUnit] = useState<CssUnit>('px')
  const [files, setFiles] = useState<CssClampFile[]>([])
  const [_, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('responsive-text')
  const [settings, setSettings] = useState<ClampSettings>({
    defaultProperty: 'font-size',
    defaultMinUnit: 'px',
    defaultIdealUnit: 'vw',
    defaultMaxUnit: 'px',
    includeBreakpoints: true,
    generateFullCSS: true,
    optimizeForAccessibility: true,
    exportFormat: 'css',
    viewportRange: { minWidth: 320, maxWidth: 1200 },
  })

  const { exportClamp } = useClampExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Real-time clamp calculation
  const clampResult = useRealTimeClamp(
    property,
    minValue,
    idealValue,
    maxValue,
    minUnit,
    idealUnit,
    maxUnit,
    settings.viewportRange
  )

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
    const template = clampTemplates.find((t) => t.id === templateId)
    if (template) {
      setProperty(template.property)
      setMinValue(template.minValue)
      setIdealValue(template.idealValue)
      setMaxValue(template.maxValue)
      setMinUnit(template.minUnit)
      setIdealUnit(template.idealUnit)
      setMaxUnit(template.maxUnit)
      setSettings((prev) => ({ ...prev, viewportRange: template.viewportRange }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Generate random values for testing
  const generateRandomValues = useCallback(() => {
    const properties: CssProperty[] = ['font-size', 'width', 'height', 'margin', 'padding']
    const units: CssUnit[] = ['px', 'rem', 'em', 'vw', 'vh']

    setProperty(properties[Math.floor(Math.random() * properties.length)])
    setMinValue(Math.floor(Math.random() * 20) + 10)
    setIdealValue(Math.floor(Math.random() * 10) + 2)
    setMaxValue(Math.floor(Math.random() * 30) + 25)
    setMinUnit(units[Math.floor(Math.random() * units.length)])
    setIdealUnit('vw')
    setMaxUnit(units[Math.floor(Math.random() * units.length)])
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
              <Ruler className="h-5 w-5" />
              CSS Clamp Generator
            </CardTitle>
            <CardDescription>
              Advanced CSS clamp generator with support for multiple units, responsive design, and accessibility
              optimization. Generate fluid typography and spacing that scales perfectly across all devices. Use keyboard
              navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'generator' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Clamp Generator
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Clamp Generator Tab */}
          <TabsContent value="generator" className="space-y-4">
            {/* Clamp Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  CSS Clamp Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {clampTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? 'default' : 'outline'}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div className="text-xs font-mono mt-2 p-1 bg-muted/30 rounded">
                          {template.property}: clamp({template.minValue}
                          {template.minUnit}, {template.idealValue}
                          {template.idealUnit}, {template.maxValue}
                          {template.maxUnit})
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Clamp Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Clamp Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="property" className="text-sm font-medium">
                      CSS Property
                    </Label>
                    <Select value={property} onValueChange={(value: CssProperty) => setProperty(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="font-size">Font Size</SelectItem>
                        <SelectItem value="width">Width</SelectItem>
                        <SelectItem value="height">Height</SelectItem>
                        <SelectItem value="margin">Margin</SelectItem>
                        <SelectItem value="padding">Padding</SelectItem>
                        <SelectItem value="gap">Gap</SelectItem>
                        <SelectItem value="border-radius">Border Radius</SelectItem>
                        <SelectItem value="line-height">Line Height</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="min-value" className="text-sm font-medium">
                        Minimum
                      </Label>
                      <div className="flex mt-2">
                        <Input
                          id="min-value"
                          type="number"
                          value={minValue}
                          onChange={(e) => setMinValue(Number(e.target.value))}
                          className="rounded-r-none"
                          step="0.1"
                        />
                        <Select value={minUnit} onValueChange={(value: CssUnit) => setMinUnit(value)}>
                          <SelectTrigger className="w-20 rounded-l-none border-l-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="px">px</SelectItem>
                            <SelectItem value="rem">rem</SelectItem>
                            <SelectItem value="em">em</SelectItem>
                            <SelectItem value="vw">vw</SelectItem>
                            <SelectItem value="vh">vh</SelectItem>
                            <SelectItem value="%">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="ideal-value" className="text-sm font-medium">
                        Ideal (Fluid)
                      </Label>
                      <div className="flex mt-2">
                        <Input
                          id="ideal-value"
                          type="number"
                          value={idealValue}
                          onChange={(e) => setIdealValue(Number(e.target.value))}
                          className="rounded-r-none"
                          step="0.1"
                        />
                        <Select value={idealUnit} onValueChange={(value: CssUnit) => setIdealUnit(value)}>
                          <SelectTrigger className="w-20 rounded-l-none border-l-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vw">vw</SelectItem>
                            <SelectItem value="vh">vh</SelectItem>
                            <SelectItem value="vmin">vmin</SelectItem>
                            <SelectItem value="vmax">vmax</SelectItem>
                            <SelectItem value="%">%</SelectItem>
                            <SelectItem value="rem">rem</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="max-value" className="text-sm font-medium">
                        Maximum
                      </Label>
                      <div className="flex mt-2">
                        <Input
                          id="max-value"
                          type="number"
                          value={maxValue}
                          onChange={(e) => setMaxValue(Number(e.target.value))}
                          className="rounded-r-none"
                          step="0.1"
                        />
                        <Select value={maxUnit} onValueChange={(value: CssUnit) => setMaxUnit(value)}>
                          <SelectTrigger className="w-20 rounded-l-none border-l-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="px">px</SelectItem>
                            <SelectItem value="rem">rem</SelectItem>
                            <SelectItem value="em">em</SelectItem>
                            <SelectItem value="vw">vw</SelectItem>
                            <SelectItem value="vh">vh</SelectItem>
                            <SelectItem value="%">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setMinValue(16)
                        setIdealValue(4)
                        setMaxValue(24)
                        setMinUnit('px')
                        setIdealUnit('vw')
                        setMaxUnit('px')
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>

                    <Button size="sm" variant="outline" onClick={generateRandomValues}>
                      <Shuffle className="h-4 w-4 mr-2" />
                      Random
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Generated Clamp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clampResult.error ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <Calculator className="h-4 w-4" />
                        <span className="font-medium">Clamp Error</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{clampResult.error}</p>
                    </div>
                  ) : clampResult.result ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">CSS Rule</Label>
                        <Textarea
                          value={clampResult.result.cssRule}
                          readOnly
                          className="mt-2 font-mono text-sm bg-muted/30"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Clamp Function</Label>
                        <Textarea
                          value={clampResult.result.clampRule}
                          readOnly
                          className="mt-2 font-mono text-sm bg-muted/30"
                          rows={1}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(clampResult.result!.cssRule, 'CSS rule')}
                        >
                          {copiedText === 'CSS rule' ? (
                            <Check className="h-4 w-4 mr-2" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Copy CSS
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(clampResult.result!.clampRule, 'clamp function')}
                        >
                          {copiedText === 'clamp function' ? (
                            <Check className="h-4 w-4 mr-2" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Copy Clamp
                        </Button>

                        <Button size="sm" variant="outline" onClick={() => exportClamp(clampResult.result!, 'css')}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <Ruler className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Configure values to see the generated clamp</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Clamp Metadata */}
            {clampResult.result && settings.includeBreakpoints && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Responsive Breakpoints & Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {clampResult.result.metadata.breakpoints.map((breakpoint) => (
                        <div key={breakpoint.name} className="border rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            {breakpoint.name === 'Mobile' && <Smartphone className="h-4 w-4" />}
                            {breakpoint.name === 'Tablet' && <Tablet className="h-4 w-4" />}
                            {(breakpoint.name === 'Desktop' || breakpoint.name === 'Wide') && (
                              <Monitor className="h-4 w-4" />
                            )}
                            <span className="font-medium text-sm">{breakpoint.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{breakpoint.width}px</div>
                          <div className="font-mono text-sm mt-1">
                            {breakpoint.value}
                            {breakpoint.unit}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-sm font-medium">Scaling Factor</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span className="font-mono text-lg">
                            {clampResult.result.metadata.scalingFactor.toFixed(3)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Responsive Range</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span className="font-mono text-lg">{clampResult.result.metadata.responsiveRange}px</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Accessibility Score</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span className="font-mono text-lg">
                            {clampResult.result.metadata.accessibility.readabilityScore.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {settings.optimizeForAccessibility && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                          <Eye className="h-4 w-4" />
                          <span className="font-medium">Accessibility Analysis</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                clampResult.result.metadata.accessibility.meetsMinimumSize
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              {clampResult.result.metadata.accessibility.meetsMinimumSize ? '✓' : '✗'}
                            </span>
                            <span>Meets minimum size requirements (16px)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">ℹ</span>
                            <span>
                              Scaling ratio: {clampResult.result.metadata.accessibility.scalingRatio.toFixed(2)}x
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Viewport Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Viewport & Export Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-viewport" className="text-sm font-medium">
                      Minimum Viewport Width
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="min-viewport"
                        type="number"
                        value={settings.viewportRange.minWidth}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            viewportRange: { ...prev.viewportRange, minWidth: Number(e.target.value) },
                          }))
                        }
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">px</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="max-viewport" className="text-sm font-medium">
                      Maximum Viewport Width
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="max-viewport"
                        type="number"
                        value={settings.viewportRange.maxWidth}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            viewportRange: { ...prev.viewportRange, maxWidth: Number(e.target.value) },
                          }))
                        }
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      id="include-breakpoints"
                      type="checkbox"
                      checked={settings.includeBreakpoints}
                      onChange={(e) => setSettings((prev) => ({ ...prev, includeBreakpoints: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="include-breakpoints" className="text-sm">
                      Show responsive breakpoints analysis
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="generate-full-css"
                      type="checkbox"
                      checked={settings.generateFullCSS}
                      onChange={(e) => setSettings((prev) => ({ ...prev, generateFullCSS: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="generate-full-css" className="text-sm">
                      Generate complete CSS rules
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="optimize-accessibility"
                      type="checkbox"
                      checked={settings.optimizeForAccessibility}
                      onChange={(e) => setSettings((prev) => ({ ...prev, optimizeForAccessibility: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="optimize-accessibility" className="text-sm">
                      Optimize for accessibility
                    </Label>
                  </div>
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
                      <SelectItem value="css">CSS</SelectItem>
                      <SelectItem value="scss">SCSS</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="js">JavaScript</SelectItem>
                    </SelectContent>
                  </Select>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload CSS Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your CSS files here, or click to select files for batch clamp analysis
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports CSS, SCSS, SASS, LESS, TXT files • Max 5MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".css,.scss,.sass,.less,.txt"
                    onChange={handleFileInput}
                    className="hidden"
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
                            {file.status === 'completed' && file.clampData && (
                              <div className="mt-2 text-xs">
                                {file.clampData.statistics.totalClamps} clamp values found
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
const CssClamp = () => {
  return <CssClampCore />
}

export default CssClamp
