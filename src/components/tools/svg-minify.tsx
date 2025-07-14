import React, { useCallback, useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Code,
  Upload,
  Trash2,
  Target,
  Copy,
  Check,
  Eye,
  RotateCcw,
  Minimize2,
  Zap,
  BarChart3,
  Settings,
  FileCode,
} from 'lucide-react'

// Types
interface SvgFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  svgData?: SvgData
}

interface SvgData {
  original: SvgContent
  optimized: SvgContent
  statistics: SvgStatistics
  settings: SvgSettings
}

interface SvgContent {
  content: string
  size: number
  elements: SvgElement[]
  attributes: SvgAttribute[]
  metadata: SvgMetadata
}

interface SvgElement {
  tag: string
  count: number
  attributes: string[]
  hasChildren: boolean
}

interface SvgAttribute {
  name: string
  count: number
  totalLength: number
  canOptimize: boolean
}

interface SvgMetadata {
  viewBox: string
  width: string
  height: string
  xmlns: string
  version: string
  hasComments: boolean
  hasWhitespace: boolean
  hasUnusedElements: boolean
}

interface SvgStatistics {
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  spaceSaved: number
  elementsRemoved: number
  attributesOptimized: number
  commentsRemoved: number
  whitespaceRemoved: number
  processingTime: number
}

interface SvgSettings {
  optimizationLevel: OptimizationLevel
  removeComments: boolean
  removeWhitespace: boolean
  removeUnusedElements: boolean
  optimizeAttributes: boolean
  simplifyPaths: boolean
  removeMetadata: boolean
  exportFormat: ExportFormat
  preserveAccessibility: boolean
}

interface SvgTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<SvgSettings>
  optimizations: OptimizationType[]
}

// Enums
type OptimizationLevel = 'basic' | 'aggressive' | 'custom'
type ExportFormat = 'svg' | 'minified' | 'gzipped' | 'base64'
type OptimizationType = 'comments' | 'whitespace' | 'attributes' | 'paths' | 'metadata' | 'unused'

// Utility functions
const generateId = (): string => Math.random().toString(36).substring(2, 11)

const validateSvgFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/svg+xml', 'text/xml', 'application/xml', 'text/plain']

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' }
  }

  if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.svg')) {
    return { isValid: false, error: 'Only SVG files are supported' }
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

// SVG optimization functions
const removeComments = (svg: string): string => {
  return svg.replace(/<!--[\s\S]*?-->/g, '')
}

const removeWhitespace = (svg: string): string => {
  return svg.replace(/\s+/g, ' ').replace(/>\s+</g, '><').replace(/\s+>/g, '>').replace(/<\s+/g, '<').trim()
}

const optimizeAttributes = (svg: string): string => {
  let optimized = svg

  // Remove default attributes
  optimized = optimized.replace(/\s+fill="none"/g, '')
  optimized = optimized.replace(/\s+stroke="none"/g, '')
  optimized = optimized.replace(/\s+opacity="1"/g, '')
  optimized = optimized.replace(/\s+fill-opacity="1"/g, '')
  optimized = optimized.replace(/\s+stroke-opacity="1"/g, '')

  // Optimize numeric values
  optimized = optimized.replace(/(\d+)\.0+(?=\D)/g, '$1')
  optimized = optimized.replace(/0+(\d+\.\d+)/g, '$1')

  // Remove unnecessary quotes from simple values
  optimized = optimized.replace(/="(\d+)"/g, '=$1')
  optimized = optimized.replace(/="([a-zA-Z]+)"/g, '=$1')

  return optimized
}

const simplifyPaths = (svg: string): string => {
  let optimized = svg

  // Remove unnecessary path commands
  optimized = optimized.replace(/([ML])\s*([ML])/g, '$2')

  // Optimize path data
  optimized = optimized.replace(/\s+([ML])/g, '$1')
  optimized = optimized.replace(/([ML])\s+/g, '$1')

  // Remove trailing zeros in path coordinates
  optimized = optimized.replace(/(\d+)\.0+(?=\s|[ML]|$)/g, '$1')

  return optimized
}

const removeMetadata = (svg: string): string => {
  let optimized = svg

  // Remove XML declaration
  optimized = optimized.replace(/<\?xml[^>]*\?>\s*/g, '')

  // Remove DOCTYPE
  optimized = optimized.replace(/<!DOCTYPE[^>]*>\s*/g, '')

  // Remove metadata elements
  optimized = optimized.replace(/<metadata[\s\S]*?<\/metadata>\s*/g, '')
  optimized = optimized.replace(/<title[\s\S]*?<\/title>\s*/g, '')
  optimized = optimized.replace(/<desc[\s\S]*?<\/desc>\s*/g, '')

  return optimized
}

const removeUnusedElements = (svg: string): string => {
  let optimized = svg

  // Remove empty groups
  optimized = optimized.replace(/<g[^>]*>\s*<\/g>/g, '')

  // Remove empty defs
  optimized = optimized.replace(/<defs[^>]*>\s*<\/defs>/g, '')

  // Remove empty patterns
  optimized = optimized.replace(/<pattern[^>]*>\s*<\/pattern>/g, '')

  return optimized
}

// Analyze SVG content
const analyzeSvgContent = (svg: string): SvgContent => {
  const size = new Blob([svg]).size

  // Extract elements
  const elementMatches = svg.match(/<(\w+)[^>]*>/g) || []
  const elementCounts: Record<string, number> = {}

  elementMatches.forEach((match) => {
    const tag = match.match(/<(\w+)/)?.[1]
    if (tag) {
      elementCounts[tag] = (elementCounts[tag] || 0) + 1
    }
  })

  const elements: SvgElement[] = Object.entries(elementCounts).map(([tag, count]) => ({
    tag,
    count,
    attributes: [],
    hasChildren: svg.includes(`<${tag}`) && svg.includes(`</${tag}>`),
  }))

  // Extract attributes
  const attributeMatches = svg.match(/\s+(\w+)="[^"]*"/g) || []
  const attributeCounts: Record<string, { count: number; totalLength: number }> = {}

  attributeMatches.forEach((match) => {
    const attr = match.match(/\s+(\w+)=/)?.[1]
    if (attr) {
      if (!attributeCounts[attr]) {
        attributeCounts[attr] = { count: 0, totalLength: 0 }
      }
      attributeCounts[attr].count++
      attributeCounts[attr].totalLength += match.length
    }
  })

  const attributes: SvgAttribute[] = Object.entries(attributeCounts).map(([name, data]) => ({
    name,
    count: data.count,
    totalLength: data.totalLength,
    canOptimize: ['fill', 'stroke', 'opacity', 'transform'].includes(name),
  }))

  // Extract metadata
  const viewBoxMatch = svg.match(/viewBox="([^"]*)"/)
  const widthMatch = svg.match(/width="([^"]*)"/)
  const heightMatch = svg.match(/height="([^"]*)"/)
  const xmlnsMatch = svg.match(/xmlns="([^"]*)"/)
  const versionMatch = svg.match(/version="([^"]*)"/)

  const metadata: SvgMetadata = {
    viewBox: viewBoxMatch?.[1] || '',
    width: widthMatch?.[1] || '',
    height: heightMatch?.[1] || '',
    xmlns: xmlnsMatch?.[1] || '',
    version: versionMatch?.[1] || '',
    hasComments: svg.includes('<!--'),
    hasWhitespace: /\s{2,}/.test(svg),
    hasUnusedElements: /<g[^>]*>\s*<\/g>/.test(svg) || /<defs[^>]*>\s*<\/defs>/.test(svg),
  }

  return {
    content: svg,
    size,
    elements,
    attributes,
    metadata,
  }
}

// Optimize SVG based on settings
const optimizeSvg = (svg: string, settings: SvgSettings): { optimized: string; statistics: SvgStatistics } => {
  const startTime = performance.now()
  const originalSize = new Blob([svg]).size

  let optimized = svg
  let elementsRemoved = 0
  let attributesOptimized = 0
  let commentsRemoved = 0
  let whitespaceRemoved = 0

  try {
    if (settings.removeComments) {
      const beforeComments = optimized
      optimized = removeComments(optimized)
      commentsRemoved = (beforeComments.match(/<!--[\s\S]*?-->/g) || []).length
    }

    if (settings.removeWhitespace) {
      const beforeWhitespace = optimized.length
      optimized = removeWhitespace(optimized)
      whitespaceRemoved = beforeWhitespace - optimized.length
    }

    if (settings.optimizeAttributes) {
      const beforeAttributes = (optimized.match(/\s+\w+="[^"]*"/g) || []).length
      optimized = optimizeAttributes(optimized)
      const afterAttributes = (optimized.match(/\s+\w+="[^"]*"/g) || []).length
      attributesOptimized = beforeAttributes - afterAttributes
    }

    if (settings.simplifyPaths) {
      optimized = simplifyPaths(optimized)
    }

    if (settings.removeMetadata && !settings.preserveAccessibility) {
      optimized = removeMetadata(optimized)
    }

    if (settings.removeUnusedElements) {
      const beforeElements = (optimized.match(/<\w+[^>]*>/g) || []).length
      optimized = removeUnusedElements(optimized)
      const afterElements = (optimized.match(/<\w+[^>]*>/g) || []).length
      elementsRemoved = beforeElements - afterElements
    }

    const optimizedSize = new Blob([optimized]).size
    const spaceSaved = originalSize - optimizedSize
    const compressionRatio = originalSize > 0 ? (spaceSaved / originalSize) * 100 : 0

    const statistics: SvgStatistics = {
      originalSize,
      optimizedSize,
      compressionRatio,
      spaceSaved,
      elementsRemoved,
      attributesOptimized,
      commentsRemoved,
      whitespaceRemoved,
      processingTime: performance.now() - startTime,
    }

    return { optimized, statistics }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'SVG optimization failed')
  }
}

// SVG optimization templates
const svgTemplates: SvgTemplate[] = [
  {
    id: 'web-basic',
    name: 'Web Basic',
    description: 'Basic optimization for web usage',
    category: 'Web',
    settings: {
      optimizationLevel: 'basic',
      removeComments: true,
      removeWhitespace: true,
      removeUnusedElements: false,
      optimizeAttributes: false,
      simplifyPaths: false,
      removeMetadata: false,
      preserveAccessibility: true,
    },
    optimizations: ['comments', 'whitespace'],
  },
  {
    id: 'web-aggressive',
    name: 'Web Aggressive',
    description: 'Maximum compression for web delivery',
    category: 'Web',
    settings: {
      optimizationLevel: 'aggressive',
      removeComments: true,
      removeWhitespace: true,
      removeUnusedElements: true,
      optimizeAttributes: true,
      simplifyPaths: true,
      removeMetadata: true,
      preserveAccessibility: false,
    },
    optimizations: ['comments', 'whitespace', 'attributes', 'paths', 'metadata', 'unused'],
  },
  {
    id: 'print-ready',
    name: 'Print Ready',
    description: 'Optimized for print while preserving quality',
    category: 'Print',
    settings: {
      optimizationLevel: 'basic',
      removeComments: true,
      removeWhitespace: false,
      removeUnusedElements: false,
      optimizeAttributes: false,
      simplifyPaths: false,
      removeMetadata: false,
      preserveAccessibility: true,
    },
    optimizations: ['comments'],
  },
  {
    id: 'icon-optimization',
    name: 'Icon Optimization',
    description: 'Optimized for icon usage with path simplification',
    category: 'Icons',
    settings: {
      optimizationLevel: 'aggressive',
      removeComments: true,
      removeWhitespace: true,
      removeUnusedElements: true,
      optimizeAttributes: true,
      simplifyPaths: true,
      removeMetadata: true,
      preserveAccessibility: false,
    },
    optimizations: ['comments', 'whitespace', 'attributes', 'paths', 'metadata', 'unused'],
  },
  {
    id: 'accessibility-safe',
    name: 'Accessibility Safe',
    description: 'Optimization while preserving accessibility features',
    category: 'Accessibility',
    settings: {
      optimizationLevel: 'basic',
      removeComments: false,
      removeWhitespace: true,
      removeUnusedElements: false,
      optimizeAttributes: false,
      simplifyPaths: false,
      removeMetadata: false,
      preserveAccessibility: true,
    },
    optimizations: ['whitespace'],
  },
  {
    id: 'custom-balanced',
    name: 'Custom Balanced',
    description: 'Balanced optimization for general use',
    category: 'General',
    settings: {
      optimizationLevel: 'custom',
      removeComments: true,
      removeWhitespace: true,
      removeUnusedElements: true,
      optimizeAttributes: true,
      simplifyPaths: false,
      removeMetadata: false,
      preserveAccessibility: true,
    },
    optimizations: ['comments', 'whitespace', 'attributes', 'unused'],
  },
]

// Process SVG data
const processSvgData = (
  originalSvg: string,
  optimizedSvg: string,
  statistics: SvgStatistics,
  settings: SvgSettings
): SvgData => {
  try {
    const original = analyzeSvgContent(originalSvg)
    const optimized = analyzeSvgContent(optimizedSvg)

    return {
      original,
      optimized,
      statistics,
      settings,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'SVG processing failed')
  }
}

// Error boundary component
class SvgMinifyErrorBoundary extends React.Component<
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
    console.error('SVG Minify error:', error, errorInfo)
    toast.error('An unexpected error occurred during SVG optimization')
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
const useSvgOptimization = () => {
  const optimizeSvgContent = useCallback(async (svg: string, settings: SvgSettings): Promise<SvgData> => {
    try {
      const { optimized, statistics } = optimizeSvg(svg, settings)
      return processSvgData(svg, optimized, statistics, settings)
    } catch (error) {
      console.error('SVG optimization error:', error)
      throw new Error(error instanceof Error ? error.message : 'SVG optimization failed')
    }
  }, [])

  const processBatch = useCallback(
    async (files: SvgFile[], settings: SvgSettings): Promise<SvgFile[]> => {
      return Promise.all(
        files.map(async (file) => {
          if (file.status !== 'pending') return file

          try {
            const svgData = await optimizeSvgContent(file.content, settings)

            return {
              ...file,
              status: 'completed' as const,
              svgData,
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
    [optimizeSvgContent]
  )

  const processFiles = useCallback(
    async (files: SvgFile[], settings: SvgSettings): Promise<SvgFile[]> => {
      const processedFiles = await processBatch(files, settings)
      return processedFiles
    },
    [processBatch]
  )

  return { optimizeSvgContent, processBatch, processFiles }
}

// Real-time SVG optimization hook
const useRealTimeSvg = (svg: string, settings: SvgSettings) => {
  return useMemo(() => {
    if (!svg.trim()) {
      return {
        svgData: null,
        error: null,
        isEmpty: true,
      }
    }

    try {
      const { optimized, statistics } = optimizeSvg(svg, settings)
      const svgData = processSvgData(svg, optimized, statistics, settings)

      return {
        svgData,
        error: null,
        isEmpty: false,
      }
    } catch (error) {
      return {
        svgData: null,
        error: error instanceof Error ? error.message : 'Optimization failed',
        isEmpty: false,
      }
    }
  }, [svg, settings])
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<SvgFile> => {
    const validation = validateSvgFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const svgFile: SvgFile = {
            id: generateId(),
            name: file.name,
            content,
            size: file.size,
            type: file.type,
            status: 'pending',
          }

          resolve(svgFile)
        } catch (error) {
          reject(new Error('Failed to process file'))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<SvgFile[]> => {
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
            type: files[index].type,
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
const useSvgExport = () => {
  const exportSvg = useCallback((svgData: SvgData, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'image/svg+xml'
    let extension = '.svg'

    switch (format) {
      case 'svg':
        content = svgData.optimized.content
        mimeType = 'image/svg+xml'
        extension = '.svg'
        break
      case 'minified':
        content = svgData.optimized.content
        mimeType = 'image/svg+xml'
        extension = '.min.svg'
        break
      case 'gzipped':
        // Note: Browser can't create gzip, so we'll just export as SVG
        content = svgData.optimized.content
        mimeType = 'image/svg+xml'
        extension = '.svg'
        break
      case 'base64':
        content = btoa(svgData.optimized.content)
        mimeType = 'text/plain'
        extension = '.txt'
        break
      default:
        content = svgData.optimized.content
        mimeType = 'image/svg+xml'
        extension = '.svg'
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `optimized${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: SvgFile[]) => {
      const completedFiles = files.filter((f) => f.svgData)

      if (completedFiles.length === 0) {
        toast.error('No optimized SVG data to export')
        return
      }

      completedFiles.forEach((file) => {
        if (file.svgData) {
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          exportSvg(file.svgData, 'minified', `${baseName}.min.svg`)
        }
      })

      toast.success(`Exported ${completedFiles.length} optimized SVG file(s)`)
    },
    [exportSvg]
  )

  const exportStatistics = useCallback((files: SvgFile[]) => {
    const stats = files
      .filter((f) => f.svgData)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.svgData!.statistics.originalSize),
        optimizedSize: formatFileSize(file.svgData!.statistics.optimizedSize),
        compressionRatio: `${file.svgData!.statistics.compressionRatio.toFixed(1)}%`,
        spaceSaved: formatFileSize(file.svgData!.statistics.spaceSaved),
        elementsRemoved: file.svgData!.statistics.elementsRemoved,
        attributesOptimized: file.svgData!.statistics.attributesOptimized,
        processingTime: `${file.svgData!.statistics.processingTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      [
        'Filename',
        'Original Size',
        'Optimized Size',
        'Compression',
        'Space Saved',
        'Elements Removed',
        'Attributes Optimized',
        'Processing Time',
        'Status',
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.optimizedSize,
        stat.compressionRatio,
        stat.spaceSaved,
        stat.elementsRemoved.toString(),
        stat.attributesOptimized.toString(),
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
    link.download = 'svg-optimization-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportSvg, exportBatch, exportStatistics }
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
        (file) => file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
      )

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error('Please drop only SVG files')
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
 * Enhanced SVG Minify Tool
 * Features: Real-time optimization, multiple levels, batch processing, comprehensive analysis
 */
const SvgMinifyCore = () => {
  const [activeTab, setActiveTab] = useState<'minifier' | 'files'>('minifier')
  const [currentSvg, setCurrentSvg] = useState<string>('')
  const [currentSvgData, setCurrentSvgData] = useState<SvgData | null>(null)
  const [files, setFiles] = useState<SvgFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('web-basic')
  const [settings, setSettings] = useState<SvgSettings>({
    optimizationLevel: 'basic',
    removeComments: true,
    removeWhitespace: true,
    removeUnusedElements: false,
    optimizeAttributes: false,
    simplifyPaths: false,
    removeMetadata: false,
    exportFormat: 'svg',
    preserveAccessibility: true,
  })

  const { optimizeSvgContent } = useSvgOptimization()
  const { exportSvg } = useSvgExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Real-time SVG optimization
  const { svgData: realTimeSvgData, error: realTimeError } = useRealTimeSvg(currentSvg, settings)

  // File drag and drop
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    useCallback(async (droppedFiles: File[]) => {
      setIsProcessing(true)
      try {
        const { processBatch } = useFileProcessing()
        const processedFiles = await processBatch(droppedFiles)
        setFiles((prev) => [...processedFiles, ...prev])

        // If only one file, set it as current SVG
        if (droppedFiles.length === 1 && processedFiles[0].content) {
          setCurrentSvg(processedFiles[0].content)
        }

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
    const template = svgTemplates.find((t) => t.id === templateId)
    if (template && template.settings) {
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle SVG optimization
  const handleOptimize = useCallback(async () => {
    if (!currentSvg.trim()) {
      toast.error('Please enter SVG content to optimize')
      return
    }

    setIsProcessing(true)
    try {
      const svgData = await optimizeSvgContent(currentSvg, settings)
      setCurrentSvgData(svgData)
      toast.success('SVG optimized successfully')
    } catch (error) {
      toast.error('Failed to optimize SVG')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [currentSvg, settings, optimizeSvgContent])

  // Update current SVG data when real-time data changes
  React.useEffect(() => {
    if (realTimeSvgData && !realTimeError) {
      setCurrentSvgData(realTimeSvgData)
    }
  }, [realTimeSvgData, realTimeError])

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
              <Minimize2 className="h-5 w-5" aria-hidden="true" />
              SVG Minify
            </CardTitle>
            <CardDescription>
              Advanced SVG optimization tool with multiple compression levels and real-time preview. Reduce file sizes
              while maintaining quality and accessibility. Use keyboard navigation: Tab to move between controls, Enter
              or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'minifier' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="minifier" className="flex items-center gap-2">
              <Minimize2 className="h-4 w-4" />
              SVG Minifier
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* SVG Minifier Tab */}
          <TabsContent value="minifier" className="space-y-4">
            {/* SVG Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Optimization Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {svgTemplates.map((template) => (
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
                          {template.optimizations.length} optimizations • {template.category}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SVG Input */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Original SVG
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste your SVG code here..."
                      value={currentSvg}
                      onChange={(e) => setCurrentSvg(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                      aria-label="Original SVG code input"
                    />

                    <div className="flex gap-2">
                      <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Load File
                      </Button>
                      <Button onClick={() => setCurrentSvg('')} variant="outline" size="sm">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                      <Button onClick={handleOptimize} disabled={!currentSvg.trim() || isProcessing} size="sm">
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                        ) : (
                          <Zap className="mr-2 h-4 w-4" />
                        )}
                        Optimize
                      </Button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".svg,image/svg+xml"
                      onChange={handleFileInput}
                      className="hidden"
                      aria-label="Select SVG file"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Optimized SVG Output */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Minimize2 className="h-5 w-5" />
                    Optimized SVG
                    {currentSvgData && (
                      <span className="text-sm font-normal text-muted-foreground">
                        ({currentSvgData.statistics.compressionRatio.toFixed(1)}% reduction)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      value={currentSvgData?.optimized.content || ''}
                      readOnly
                      className="min-h-[300px] font-mono text-sm bg-muted/30"
                      placeholder="Optimized SVG will appear here..."
                      aria-label="Optimized SVG code output"
                    />

                    {currentSvgData && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => copyToClipboard(currentSvgData.optimized.content, 'Optimized SVG')}
                          variant="outline"
                          size="sm"
                        >
                          {copiedText === 'Optimized SVG' ? (
                            <Check className="mr-2 h-4 w-4" />
                          ) : (
                            <Copy className="mr-2 h-4 w-4" />
                          )}
                          Copy
                        </Button>
                        <Button
                          onClick={() => exportSvg(currentSvgData, settings.exportFormat)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          onClick={() => {
                            const blob = new Blob([currentSvgData.optimized.content], { type: 'image/svg+xml' })
                            const url = URL.createObjectURL(blob)
                            window.open(url, '_blank')
                            URL.revokeObjectURL(url)
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                      </div>
                    )}

                    {realTimeError && (
                      <div className="text-red-600 text-sm p-2 bg-red-50 rounded">Error: {realTimeError}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            {currentSvgData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Optimization Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-muted/30 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {currentSvgData.statistics.compressionRatio.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Size Reduction</div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded">
                      <div className="text-2xl font-bold">{formatFileSize(currentSvgData.statistics.spaceSaved)}</div>
                      <div className="text-sm text-muted-foreground">Space Saved</div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded">
                      <div className="text-2xl font-bold">{currentSvgData.statistics.elementsRemoved}</div>
                      <div className="text-sm text-muted-foreground">Elements Removed</div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded">
                      <div className="text-2xl font-bold">{currentSvgData.statistics.processingTime.toFixed(1)}ms</div>
                      <div className="text-sm text-muted-foreground">Processing Time</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium mb-2">File Sizes</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Original:</span>
                          <span className="font-mono">{formatFileSize(currentSvgData.statistics.originalSize)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Optimized:</span>
                          <span className="font-mono">{formatFileSize(currentSvgData.statistics.optimizedSize)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="font-medium mb-2">Optimizations Applied</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Comments Removed:</span>
                          <span className="font-mono">{currentSvgData.statistics.commentsRemoved}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Attributes Optimized:</span>
                          <span className="font-mono">{currentSvgData.statistics.attributesOptimized}</span>
                        </div>
                      </div>
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
                  Optimization Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="optimization-level" className="text-sm font-medium">
                      Optimization Level
                    </Label>
                    <Select
                      value={settings.optimizationLevel}
                      onValueChange={(value: OptimizationLevel) =>
                        setSettings((prev) => ({ ...prev, optimizationLevel: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="svg">SVG</SelectItem>
                        <SelectItem value="minified">Minified SVG</SelectItem>
                        <SelectItem value="base64">Base64</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remove-comments"
                      type="checkbox"
                      checked={settings.removeComments}
                      onChange={(e) => setSettings((prev) => ({ ...prev, removeComments: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="remove-comments" className="text-sm">
                      Remove comments
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="remove-whitespace"
                      type="checkbox"
                      checked={settings.removeWhitespace}
                      onChange={(e) => setSettings((prev) => ({ ...prev, removeWhitespace: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="remove-whitespace" className="text-sm">
                      Remove unnecessary whitespace
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="optimize-attributes"
                      type="checkbox"
                      checked={settings.optimizeAttributes}
                      onChange={(e) => setSettings((prev) => ({ ...prev, optimizeAttributes: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="optimize-attributes" className="text-sm">
                      Optimize attributes
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="simplify-paths"
                      type="checkbox"
                      checked={settings.simplifyPaths}
                      onChange={(e) => setSettings((prev) => ({ ...prev, simplifyPaths: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="simplify-paths" className="text-sm">
                      Simplify paths
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="remove-unused"
                      type="checkbox"
                      checked={settings.removeUnusedElements}
                      onChange={(e) => setSettings((prev) => ({ ...prev, removeUnusedElements: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="remove-unused" className="text-sm">
                      Remove unused elements
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="remove-metadata"
                      type="checkbox"
                      checked={settings.removeMetadata}
                      onChange={(e) => setSettings((prev) => ({ ...prev, removeMetadata: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="remove-metadata" className="text-sm">
                      Remove metadata
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="preserve-accessibility"
                      type="checkbox"
                      checked={settings.preserveAccessibility}
                      onChange={(e) => setSettings((prev) => ({ ...prev, preserveAccessibility: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="preserve-accessibility" className="text-sm">
                      Preserve accessibility features
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
                  aria-label="Drag and drop SVG files here or click to select files"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload SVG Files for Batch Processing</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your SVG files here, or click to select files for batch optimization
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileCode className="mr-2 h-4 w-4" />
                    Choose SVG Files
                  </Button>
                  <p className="text-xs text-muted-foreground">Supports SVG files • Max 10MB per file</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".svg,image/svg+xml"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select SVG files"
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
                            <FileCode className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Size:</span> {formatFileSize(file.size)}
                            </div>
                            {file.status === 'completed' && file.svgData && (
                              <div className="mt-2 text-xs">
                                Optimized • {file.svgData.statistics.compressionRatio.toFixed(1)}% reduction
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
const SvgMinify = () => {
  return (
    <SvgMinifyErrorBoundary>
      <SvgMinifyCore />
    </SvgMinifyErrorBoundary>
  )
}

export default SvgMinify
