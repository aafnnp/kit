import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react'
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
  ArrowLeftRight,
  ArrowRight,
  Eye,
  EyeOff,
  Image,
  FileImage,
  Maximize2,
  Minimize2,
  Palette,
} from 'lucide-react'
import { nanoid } from 'nanoid'
// Enhanced Types
interface ImageProcessingResult {
  id: string
  input: string
  output: string
  direction: ConversionDirection
  isValid: boolean
  error?: string
  statistics: ImageStatistics
  analysis?: ImageAnalysis
  createdAt: Date
}

interface ImageStatistics {
  inputSize: number
  outputSize: number
  compressionRatio: number
  processingTime: number
  imageMetadata: ImageMetadata
  qualityMetrics: QualityMetrics
}

interface ImageMetadata {
  width: number
  height: number
  format: string
  mimeType: string
  aspectRatio: number
  pixelCount: number
  estimatedColors: number
  hasTransparency: boolean
}

interface QualityMetrics {
  resolution: string
  sizeCategory: string
  compressionEfficiency: number
  dataUrlOverhead: number
  base64Efficiency: number
}

interface ImageAnalysis {
  isValidImage: boolean
  hasDataUrlPrefix: boolean
  isOptimized: boolean
  suggestedImprovements: string[]
  imageIssues: string[]
  qualityScore: number
  formatRecommendations: string[]
}

interface ProcessingBatch {
  id: string
  results: ImageProcessingResult[]
  count: number
  settings: ProcessingSettings
  createdAt: Date
  statistics: BatchStatistics
}

interface BatchStatistics {
  totalProcessed: number
  validCount: number
  invalidCount: number
  averageQuality: number
  totalInputSize: number
  totalOutputSize: number
  successRate: number
}

interface ProcessingSettings {
  outputFormat: ImageFormat
  quality: number
  maxWidth: number
  maxHeight: number
  includeDataUrlPrefix: boolean
  realTimeProcessing: boolean
  exportFormat: ExportFormat
  compressionLevel: number
  preserveMetadata: boolean
  autoOptimize: boolean
}

interface ImageTemplate {
  id: string
  name: string
  description: string
  category: string
  base64Example: string
  imageInfo: string
  useCase: string[]
}

interface ImageValidation {
  isValid: boolean
  errors: ImageError[]
  warnings: string[]
  suggestions: string[]
}

interface ImageError {
  message: string
  type: 'format' | 'size' | 'encoding' | 'corruption'
  details?: string
}

// Enums
type ConversionDirection = 'image-to-base64' | 'base64-to-image'
type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp'
type ExportFormat = 'base64' | 'dataurl' | 'json' | 'txt'

// Utility functions

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const detectImageFormat = (base64: string): string => {
  if (base64.startsWith('data:image/')) {
    const match = base64.match(/data:image\/([^;]+)/)
    return match ? match[1] : 'unknown'
  }

  // Try to detect from base64 header
  const header = base64.substring(0, 10)
  if (header.startsWith('/9j/')) return 'jpeg'
  if (header.startsWith('iVBORw0KGgo')) return 'png'
  if (header.startsWith('R0lGODlh')) return 'gif'
  if (header.startsWith('UklGR')) return 'webp'
  if (header.startsWith('Qk')) return 'bmp'

  return 'unknown'
}

const isValidBase64Image = (base64: string): boolean => {
  try {
    // Check if it's a data URL
    if (base64.startsWith('data:image/')) {
      const base64Data = base64.split(',')[1]
      if (!base64Data) return false

      // Validate base64 encoding
      const decoded = atob(base64Data)
      return decoded.length > 0
    }

    // Check if it's raw base64
    if (base64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
      const decoded = atob(base64)
      return decoded.length > 0
    }

    return false
  } catch {
    return false
  }
}

// Image processing functions
const processImageToBase64 = async (file: File, settings: ProcessingSettings): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const result = event.target?.result as string

        if (settings.autoOptimize || settings.maxWidth || settings.maxHeight) {
          const optimized = await optimizeImage(result, settings)
          resolve(optimized)
        } else {
          resolve(result)
        }
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

const optimizeImage = async (dataUrl: string, settings: ProcessingSettings): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image()

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        // Calculate new dimensions
        let { width, height } = img

        if (settings.maxWidth && width > settings.maxWidth) {
          height = (height * settings.maxWidth) / width
          width = settings.maxWidth
        }

        if (settings.maxHeight && height > settings.maxHeight) {
          width = (width * settings.maxHeight) / height
          height = settings.maxHeight
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)

        const quality = settings.quality / 100
        const format = `image/${settings.outputFormat}`

        const optimizedDataUrl = canvas.toDataURL(format, quality)
        resolve(optimizedDataUrl)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

const extractImageMetadata = (dataUrl: string): Promise<ImageMetadata> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image()

    img.onload = () => {
      const format = detectImageFormat(dataUrl)
      const mimeType = dataUrl.startsWith('data:') ? dataUrl.split(';')[0].replace('data:', '') : `image/${format}`

      const metadata: ImageMetadata = {
        width: img.width,
        height: img.height,
        format,
        mimeType,
        aspectRatio: img.width / img.height,
        pixelCount: img.width * img.height,
        estimatedColors: estimateColorCount(img),
        hasTransparency: format === 'png' || format === 'gif' || format === 'webp',
      }

      resolve(metadata)
    }

    img.onerror = () => reject(new Error('Failed to load image for metadata extraction'))
    img.src = dataUrl
  })
}

const estimateColorCount = (img: HTMLImageElement): number => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return 0

    // Use a smaller sample for performance
    const sampleSize = Math.min(100, img.width, img.height)
    canvas.width = sampleSize
    canvas.height = sampleSize

    ctx.drawImage(img, 0, 0, sampleSize, sampleSize)
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
    const data = imageData.data

    const colors = new Set<string>()
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      colors.add(`${r},${g},${b}`)
    }

    // Estimate total colors based on sample
    const sampleRatio = (sampleSize * sampleSize) / (img.width * img.height)
    return Math.round(colors.size / sampleRatio)
  } catch {
    return 0
  }
}

// Analysis functions
const analyzeImage = async (input: string, direction: ConversionDirection): Promise<ImageAnalysis> => {
  const analysis: ImageAnalysis = {
    isValidImage: false,
    hasDataUrlPrefix: false,
    isOptimized: false,
    suggestedImprovements: [],
    imageIssues: [],
    qualityScore: 100,
    formatRecommendations: [],
  }

  if (direction === 'base64-to-image') {
    analysis.isValidImage = isValidBase64Image(input)
    analysis.hasDataUrlPrefix = input.startsWith('data:image/')

    if (!analysis.isValidImage) {
      analysis.imageIssues.push('Invalid Base64 image data')
      analysis.qualityScore -= 50
    }

    if (!analysis.hasDataUrlPrefix && analysis.isValidImage) {
      analysis.suggestedImprovements.push('Add data URL prefix for better browser compatibility')
      analysis.qualityScore -= 10
    }

    // Check size efficiency
    const base64Size = input.length
    if (base64Size > 1000000) {
      // 1MB
      analysis.suggestedImprovements.push('Consider compressing large images for better performance')
      analysis.qualityScore -= 20
    }

    // Format recommendations
    const format = detectImageFormat(input)
    if (format === 'bmp') {
      analysis.formatRecommendations.push('Consider converting BMP to PNG or JPEG for better compression')
    } else if (format === 'png' && base64Size > 500000) {
      analysis.formatRecommendations.push('Consider JPEG format for large photos without transparency')
    }
  }

  return analysis
}

// Templates
const imageTemplates: ImageTemplate[] = [
  {
    id: 'small-icon',
    name: 'Small Icon',
    description: 'Small icon or favicon (16x16 to 64x64)',
    category: 'Icons',
    base64Example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    imageInfo: '1x1 pixel transparent PNG',
    useCase: ['Favicons', 'UI icons', 'Small graphics'],
  },
  {
    id: 'profile-photo',
    name: 'Profile Photo',
    description: 'User profile photo or avatar',
    category: 'Photos',
    base64Example:
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A',
    imageInfo: 'Sample JPEG profile image',
    useCase: ['User avatars', 'Profile pictures', 'Contact photos'],
  },
  {
    id: 'logo',
    name: 'Company Logo',
    description: 'Company or brand logo with transparency',
    category: 'Branding',
    base64Example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    imageInfo: 'PNG with transparency support',
    useCase: ['Company logos', 'Brand assets', 'Website headers'],
  },
  {
    id: 'product-image',
    name: 'Product Image',
    description: 'E-commerce product photo',
    category: 'Commerce',
    base64Example:
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A',
    imageInfo: 'High-quality product photo',
    useCase: ['Product catalogs', 'E-commerce', 'Marketing materials'],
  },
  {
    id: 'chart-graph',
    name: 'Chart/Graph',
    description: 'Data visualization or chart image',
    category: 'Data',
    base64Example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    imageInfo: 'Chart or graph visualization',
    useCase: ['Reports', 'Dashboards', 'Data presentations'],
  },
]

// Validation functions
const validateImageInput = (input: string, direction: ConversionDirection): ImageValidation => {
  const validation: ImageValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!input.trim()) {
    validation.isValid = false
    validation.errors.push({
      message: 'Input cannot be empty',
      type: 'format',
    })
    return validation
  }

  if (direction === 'base64-to-image') {
    if (!isValidBase64Image(input)) {
      validation.isValid = false
      validation.errors.push({
        message: 'Invalid Base64 image data',
        type: 'encoding',
        details: 'The input does not appear to be valid Base64 encoded image data',
      })
    }

    if (!input.startsWith('data:image/')) {
      validation.warnings.push('Missing data URL prefix - add "data:image/[format];base64," for better compatibility')
    }

    // Check size
    if (input.length > 5000000) {
      // 5MB
      validation.warnings.push('Large Base64 string detected - may cause performance issues')
    }

    // Format detection
    const format = detectImageFormat(input)
    if (format === 'unknown') {
      validation.warnings.push('Could not detect image format')
    }
  }

  return validation
}

// Error boundary component
class Base64ImageErrorBoundary extends React.Component<
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
    console.error('Base64 Image processing error:', error, errorInfo)
    toast.error('An unexpected error occurred during image processing')
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
const useImageProcessing = () => {
  const processSingle = useCallback(
    async (
      input: string | File,
      direction: ConversionDirection,
      settings: ProcessingSettings
    ): Promise<ImageProcessingResult> => {
      const startTime = performance.now()

      try {
        let output: string
        let inputString: string
        let metadata: ImageMetadata

        if (direction === 'image-to-base64') {
          if (!(input instanceof File)) {
            throw new Error('File input required for image-to-base64 conversion')
          }

          output = await processImageToBase64(input, settings)
          inputString = input.name
          metadata = await extractImageMetadata(output)
        } else {
          if (typeof input !== 'string') {
            throw new Error('String input required for base64-to-image conversion')
          }

          inputString = input
          output = input.startsWith('data:image/') ? input : `data:image/png;base64,${input}`
          metadata = await extractImageMetadata(output)
        }

        const analysis = await analyzeImage(inputString, direction)
        const endTime = performance.now()
        const processingTime = endTime - startTime

        const inputSize = direction === 'image-to-base64' ? (input as File).size : new Blob([inputString]).size
        const outputSize = new Blob([output]).size

        const qualityMetrics: QualityMetrics = {
          resolution: `${metadata.width}x${metadata.height}`,
          sizeCategory: getSizeCategory(metadata.pixelCount),
          compressionEfficiency: calculateCompressionEfficiency(inputSize, outputSize),
          dataUrlOverhead: calculateDataUrlOverhead(output),
          base64Efficiency: calculateBase64Efficiency(output),
        }

        return {
          id: nanoid(),
          input: inputString,
          output,
          direction,
          isValid: true,
          statistics: {
            inputSize,
            outputSize,
            compressionRatio: outputSize / inputSize,
            processingTime,
            imageMetadata: metadata,
            qualityMetrics,
          },
          analysis,
          createdAt: new Date(),
        }
      } catch (error) {
        const endTime = performance.now()
        const processingTime = endTime - startTime

        return {
          id: nanoid(),
          input: typeof input === 'string' ? input : input.name,
          output: '',
          direction,
          isValid: false,
          error: error instanceof Error ? error.message : 'Processing failed',
          statistics: {
            inputSize: typeof input === 'string' ? new Blob([input]).size : input.size,
            outputSize: 0,
            compressionRatio: 0,
            processingTime,
            imageMetadata: {
              width: 0,
              height: 0,
              format: 'unknown',
              mimeType: 'unknown',
              aspectRatio: 0,
              pixelCount: 0,
              estimatedColors: 0,
              hasTransparency: false,
            },
            qualityMetrics: {
              resolution: '0x0',
              sizeCategory: 'unknown',
              compressionEfficiency: 0,
              dataUrlOverhead: 0,
              base64Efficiency: 0,
            },
          },
          createdAt: new Date(),
        }
      }
    },
    []
  )

  const processBatch = useCallback(
    async (
      inputs: Array<{ content: string | File; direction: ConversionDirection }>,
      settings: ProcessingSettings
    ): Promise<ProcessingBatch> => {
      try {
        const results = await Promise.all(
          inputs.map((input) => processSingle(input.content, input.direction, settings))
        )

        const validCount = results.filter((result) => result.isValid).length
        const invalidCount = results.length - validCount

        const totalInputSize = results.reduce((sum, result) => sum + result.statistics.inputSize, 0)
        const totalOutputSize = results.reduce((sum, result) => sum + result.statistics.outputSize, 0)
        const averageQuality =
          results.length > 0
            ? results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length
            : 0

        const statistics: BatchStatistics = {
          totalProcessed: results.length,
          validCount,
          invalidCount,
          averageQuality,
          totalInputSize,
          totalOutputSize,
          successRate: (validCount / results.length) * 100,
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
        console.error('Batch processing error:', error)
        throw new Error(error instanceof Error ? error.message : 'Batch processing failed')
      }
    },
    [processSingle]
  )

  return { processSingle, processBatch }
}

// Utility functions for quality metrics
const getSizeCategory = (pixelCount: number): string => {
  if (pixelCount < 10000) return 'Small'
  if (pixelCount < 100000) return 'Medium'
  if (pixelCount < 1000000) return 'Large'
  return 'Very Large'
}

const calculateCompressionEfficiency = (inputSize: number, outputSize: number): number => {
  if (inputSize === 0) return 0
  return ((inputSize - outputSize) / inputSize) * 100
}

const calculateDataUrlOverhead = (dataUrl: string): number => {
  if (!dataUrl.startsWith('data:')) return 0
  const prefixEnd = dataUrl.indexOf(',')
  if (prefixEnd === -1) return 0
  return ((prefixEnd + 1) / dataUrl.length) * 100
}

const calculateBase64Efficiency = (dataUrl: string): number => {
  const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  const decodedSize = base64Data.length * 0.75 // Base64 is ~33% larger than binary
  return (decodedSize / dataUrl.length) * 100
}

// Real-time validation hook
const useRealTimeValidation = (input: string, direction: ConversionDirection) => {
  return useMemo(() => {
    if (!input.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = validateImageInput(input, direction)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
    }
  }, [input, direction])
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

// Export functionality
const useImageExport = () => {
  const exportResults = useCallback((results: ImageProcessingResult[], format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'base64':
        content = results.map((result) => result.output).join('\n\n')
        mimeType = 'text/plain'
        extension = '.txt'
        break
      case 'dataurl':
        content = results
          .map((result) =>
            result.output.startsWith('data:') ? result.output : `data:image/png;base64,${result.output}`
          )
          .join('\n\n')
        mimeType = 'text/plain'
        extension = '.txt'
        break
      case 'json':
        const jsonData = results.map((result) => ({
          id: result.id,
          direction: result.direction,
          input: result.input,
          output: result.output,
          isValid: result.isValid,
          error: result.error,
          statistics: result.statistics,
          analysis: result.analysis,
          createdAt: result.createdAt,
        }))
        content = JSON.stringify(jsonData, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'txt':
      default:
        content = generateTextFromResults(results)
        mimeType = 'text/plain'
        extension = '.txt'
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `base64-images${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResults }
}

// Generate text report from results
const generateTextFromResults = (results: ImageProcessingResult[]): string => {
  return `Base64 Image Processing Report
==============================

Generated: ${new Date().toLocaleString()}
Total Results: ${results.length}
Valid Results: ${results.filter((result) => result.isValid).length}
Invalid Results: ${results.filter((result) => !result.isValid).length}

Results:
${results
  .map((result, i) => {
    return `${i + 1}. Direction: ${result.direction}
   Status: ${result.isValid ? 'Valid' : 'Invalid'}
   ${result.error ? `Error: ${result.error}` : ''}
   Input Size: ${formatFileSize(result.statistics.inputSize)}
   Output Size: ${formatFileSize(result.statistics.outputSize)}
   Processing Time: ${result.statistics.processingTime.toFixed(2)}ms
   ${result.isValid ? `Resolution: ${result.statistics.imageMetadata.width}x${result.statistics.imageMetadata.height}` : ''}
   ${result.isValid ? `Format: ${result.statistics.imageMetadata.format}` : ''}
   Quality Score: ${result.analysis?.qualityScore || 'N/A'}
`
  })
  .join('\n')}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Average Quality: ${(results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length).toFixed(1)}
`
}

/**
 * Enhanced Base64 ⇄ Image Bidirectional Converter
 * Features: Advanced image processing, Base64 conversion, validation, analysis, batch processing
 */
const Base64ImageCore = () => {
  const [activeTab, setActiveTab] = useState<'converter' | 'batch' | 'analyzer' | 'templates'>('converter')
  const [input, setInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [direction, setDirection] = useState<ConversionDirection>('base64-to-image')
  const [currentResult, setCurrentResult] = useState<ImageProcessingResult | null>(null)
  const [batches, setBatches] = useState<ProcessingBatch[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [imagePreviewExpanded, setImagePreviewExpanded] = useState(false)
  const [settings, setSettings] = useState<ProcessingSettings>({
    outputFormat: 'png',
    quality: 90,
    maxWidth: 0,
    maxHeight: 0,
    includeDataUrlPrefix: true,
    realTimeProcessing: true,
    exportFormat: 'base64',
    compressionLevel: 6,
    preserveMetadata: false,
    autoOptimize: false,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchFileInputRef = useRef<HTMLInputElement>(null)

  const { processSingle, processBatch } = useImageProcessing()
  const { exportResults } = useImageExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const inputValidation = useRealTimeValidation(input, direction)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = imageTemplates.find((t) => t.id === templateId)
    if (template) {
      setInput(template.base64Example)
      setDirection('base64-to-image')
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single processing
  const handleProcessSingle = useCallback(async () => {
    const inputData = direction === 'image-to-base64' ? selectedFile : input

    if (!inputData) {
      toast.error(`Please ${direction === 'image-to-base64' ? 'select an image file' : 'enter Base64 data'} to process`)
      return
    }

    if (direction === 'base64-to-image' && !inputValidation.isValid) {
      toast.error(inputValidation.error || 'Invalid input')
      return
    }

    setIsProcessing(true)
    try {
      const result = await processSingle(inputData, direction, settings)
      setCurrentResult(result)

      if (result.isValid) {
        const directionText = direction === 'image-to-base64' ? 'Image to Base64' : 'Base64 to Image'
        toast.success(`${directionText} conversion completed`)
      } else {
        toast.error(result.error || 'Processing failed')
      }
    } catch (error) {
      toast.error('Failed to process image')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [direction, selectedFile, input, inputValidation, settings, processSingle])

  // Handle batch processing
  const handleProcessBatch = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select image files to process')
      return
    }

    setIsProcessing(true)
    try {
      const inputs = selectedFiles.map((file) => ({
        content: file,
        direction: 'image-to-base64' as ConversionDirection,
      }))

      const batch = await processBatch(inputs, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Processed ${batch.results.length} images`)
    } catch (error) {
      toast.error('Failed to process batch')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedFiles, settings, processBatch])

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        setSelectedFile(file)
        setCurrentResult(null)

        if (settings.realTimeProcessing) {
          setTimeout(() => {
            handleProcessSingle()
          }, 500)
        }
      }
    },
    [settings.realTimeProcessing, handleProcessSingle]
  )

  // Handle batch file selection
  const handleBatchFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
  }, [])

  // Toggle conversion direction
  const toggleDirection = useCallback(() => {
    const newDirection: ConversionDirection = direction === 'base64-to-image' ? 'image-to-base64' : 'base64-to-image'
    setDirection(newDirection)

    // Clear current inputs and results
    setInput('')
    setSelectedFile(null)
    setCurrentResult(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    toast.success(`Switched to ${newDirection === 'base64-to-image' ? 'Base64 to Image' : 'Image to Base64'} mode`)
  }, [direction])

  // Auto-process when real-time processing is enabled
  useEffect(() => {
    if (settings.realTimeProcessing && direction === 'base64-to-image' && input.trim() && inputValidation.isValid) {
      const timer = setTimeout(() => {
        handleProcessSingle()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [input, inputValidation.isValid, settings.realTimeProcessing, direction, handleProcessSingle])

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
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5" aria-hidden="true" />
                <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              Base64 ⇄ Image Bidirectional Converter
            </CardTitle>
            <CardDescription>
              Advanced bidirectional Base64 and image converter with intelligent processing, validation, analysis, and
              batch processing capabilities. Convert between images and Base64 format with comprehensive image analysis
              and optimization features. Use keyboard navigation: Tab to move between controls, Enter or Space to
              activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'converter' | 'batch' | 'analyzer' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="converter" className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Converter
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Image Analyzer
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Converter Tab */}
          <TabsContent value="converter" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {direction === 'base64-to-image' ? <FileText className="h-5 w-5" /> : <Image className="h-5 w-5" />}
                    {direction === 'base64-to-image' ? 'Base64 Input' : 'Image Input'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Button onClick={toggleDirection} variant="outline" size="sm" className="flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4" />
                      Switch to {direction === 'base64-to-image' ? 'Image → Base64' : 'Base64 → Image'}
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Current: {direction === 'base64-to-image' ? 'Base64 → Image' : 'Image → Base64'}
                    </div>
                  </div>

                  {direction === 'base64-to-image' ? (
                    <div>
                      <Label htmlFor="base64-input" className="text-sm font-medium">
                        Base64 Data
                      </Label>
                      <Textarea
                        id="base64-input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter or paste Base64 image data here..."
                        className="mt-2 min-h-[120px] font-mono"
                        aria-label="Base64 input for image conversion"
                      />
                      {settings.realTimeProcessing && input && (
                        <div className="mt-2 text-sm">
                          {inputValidation.isValid ? (
                            <div className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Valid Base64 image data
                            </div>
                          ) : inputValidation.error ? (
                            <div className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {inputValidation.error}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="image-input" className="text-sm font-medium">
                        Select Image File
                      </Label>
                      <div className="mt-2">
                        <input
                          ref={fileInputRef}
                          id="image-input"
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          aria-label="Select image file for Base64 conversion"
                        />
                      </div>
                      {selectedFile && (
                        <div className="mt-2 text-sm">
                          <div className="flex items-center gap-2">
                            <FileImage className="h-4 w-4" />
                            <span className="font-medium">{selectedFile.name}</span>
                            <span className="text-muted-foreground">({formatFileSize(selectedFile.size)})</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Processing Settings */}
                  {direction === 'image-to-base64' && (
                    <div className="space-y-3 border-t pt-4">
                      <Label className="text-sm font-medium">Image Processing Settings</Label>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="output-format" className="text-xs">
                            Output Format
                          </Label>
                          <Select
                            value={settings.outputFormat}
                            onValueChange={(value: ImageFormat) =>
                              setSettings((prev) => ({ ...prev, outputFormat: value }))
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="png">PNG</SelectItem>
                              <SelectItem value="jpeg">JPEG</SelectItem>
                              <SelectItem value="webp">WebP</SelectItem>
                              <SelectItem value="gif">GIF</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="quality" className="text-xs">
                            Quality: {settings.quality}%
                          </Label>
                          <div className="mt-1">
                            <input
                              type="range"
                              min="10"
                              max="100"
                              step="5"
                              value={settings.quality}
                              onChange={(e) => setSettings((prev) => ({ ...prev, quality: parseInt(e.target.value) }))}
                              className="w-full h-2"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="max-width" className="text-xs">
                            Max Width (0 = no limit)
                          </Label>
                          <Input
                            id="max-width"
                            type="number"
                            value={settings.maxWidth || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({ ...prev, maxWidth: parseInt(e.target.value) || 0 }))
                            }
                            placeholder="0"
                            className="h-8"
                          />
                        </div>

                        <div>
                          <Label htmlFor="max-height" className="text-xs">
                            Max Height (0 = no limit)
                          </Label>
                          <Input
                            id="max-height"
                            type="number"
                            value={settings.maxHeight || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({ ...prev, maxHeight: parseInt(e.target.value) || 0 }))
                            }
                            placeholder="0"
                            className="h-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            id="include-dataurl"
                            type="checkbox"
                            checked={settings.includeDataUrlPrefix}
                            onChange={(e) =>
                              setSettings((prev) => ({ ...prev, includeDataUrlPrefix: e.target.checked }))
                            }
                            className="rounded border-input"
                          />
                          <Label htmlFor="include-dataurl" className="text-xs">
                            Include data URL prefix
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            id="auto-optimize"
                            type="checkbox"
                            checked={settings.autoOptimize}
                            onChange={(e) => setSettings((prev) => ({ ...prev, autoOptimize: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label htmlFor="auto-optimize" className="text-xs">
                            Auto-optimize image
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        id="real-time-processing"
                        type="checkbox"
                        checked={settings.realTimeProcessing}
                        onChange={(e) => setSettings((prev) => ({ ...prev, realTimeProcessing: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="real-time-processing" className="text-sm">
                        Real-time processing
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleProcessSingle}
                      disabled={
                        (direction === 'base64-to-image' && (!input.trim() || !inputValidation.isValid)) ||
                        (direction === 'image-to-base64' && !selectedFile) ||
                        isProcessing
                      }
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      Convert {direction === 'base64-to-image' ? 'to Image' : 'to Base64'}
                    </Button>
                    <Button
                      onClick={() => {
                        setInput('')
                        setSelectedFile(null)
                        setCurrentResult(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {inputValidation.warnings && inputValidation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Warnings:</h4>
                      <div className="text-xs space-y-1">
                        {inputValidation.warnings.map((warning, index) => (
                          <div key={index} className="text-yellow-700">
                            {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Output Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {direction === 'base64-to-image' ? <Image className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    {direction === 'base64-to-image' ? 'Image Preview' : 'Base64 Output'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-2">
                          Conversion:{' '}
                          {currentResult.direction === 'base64-to-image' ? 'Base64 → Image' : 'Image → Base64'}
                        </div>
                        <div className="text-sm">
                          <div>
                            <strong>Status:</strong> {currentResult.isValid ? 'Success' : 'Failed'}
                          </div>
                          {currentResult.error && (
                            <div className="text-red-600 mt-1">
                              <strong>Error:</strong> {currentResult.error}
                            </div>
                          )}
                        </div>
                      </div>

                      {currentResult.isValid ? (
                        <div className="space-y-4">
                          {/* Image Preview or Base64 Output */}
                          {direction === 'base64-to-image' ? (
                            <div className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="font-medium text-sm">Image Preview</Label>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setImagePreviewExpanded(!imagePreviewExpanded)}
                                  >
                                    {imagePreviewExpanded ? (
                                      <Minimize2 className="h-4 w-4" />
                                    ) : (
                                      <Maximize2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setShowAnalysis(!showAnalysis)}>
                                    {showAnalysis ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              <div className="flex justify-center">
                                <img
                                  src={currentResult.output}
                                  alt="Converted from Base64"
                                  className={`border rounded ${
                                    imagePreviewExpanded ? 'max-w-full max-h-96' : 'max-w-xs max-h-40'
                                  }`}
                                  style={{ objectFit: 'contain' }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="font-medium text-sm">Generated Base64</Label>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(currentResult.output, 'Base64 Data')}
                                  >
                                    {copiedText === 'Base64 Data' ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setShowAnalysis(!showAnalysis)}>
                                    {showAnalysis ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              <Textarea
                                value={currentResult.output}
                                readOnly
                                className="min-h-[120px] font-mono text-sm bg-muted"
                              />
                            </div>
                          )}

                          {/* Image Metadata */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Image Information</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Resolution:</strong> {currentResult.statistics.imageMetadata.width}×
                                  {currentResult.statistics.imageMetadata.height}
                                </div>
                                <div>
                                  <strong>Format:</strong> {currentResult.statistics.imageMetadata.format.toUpperCase()}
                                </div>
                                <div>
                                  <strong>Aspect Ratio:</strong>{' '}
                                  {currentResult.statistics.imageMetadata.aspectRatio.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Pixel Count:</strong>{' '}
                                  {currentResult.statistics.imageMetadata.pixelCount.toLocaleString()}
                                </div>
                                <div>
                                  <strong>Est. Colors:</strong>{' '}
                                  {currentResult.statistics.imageMetadata.estimatedColors.toLocaleString()}
                                </div>
                                <div>
                                  <strong>Transparency:</strong>{' '}
                                  {currentResult.statistics.imageMetadata.hasTransparency ? 'Yes' : 'No'}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Input Size:</strong> {formatFileSize(currentResult.statistics.inputSize)}
                                </div>
                                <div>
                                  <strong>Output Size:</strong> {formatFileSize(currentResult.statistics.outputSize)}
                                </div>
                                <div>
                                  <strong>Processing Time:</strong> {currentResult.statistics.processingTime.toFixed(2)}
                                  ms
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quality Metrics */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Quality Metrics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Size Category:</strong> {currentResult.statistics.qualityMetrics.sizeCategory}
                                </div>
                                <div>
                                  <strong>Compression:</strong>{' '}
                                  {currentResult.statistics.qualityMetrics.compressionEfficiency.toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Data URL Overhead:</strong>{' '}
                                  {currentResult.statistics.qualityMetrics.dataUrlOverhead.toFixed(1)}%
                                </div>
                                <div>
                                  <strong>Base64 Efficiency:</strong>{' '}
                                  {currentResult.statistics.qualityMetrics.base64Efficiency.toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Quality Score:</strong>{' '}
                                  {currentResult.analysis?.qualityScore?.toFixed(1) || 'N/A'}/100
                                </div>
                                <div>
                                  <strong>MIME Type:</strong> {currentResult.statistics.imageMetadata.mimeType}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Analysis */}
                          {showAnalysis && currentResult.analysis && (
                            <div className="border rounded-lg p-3">
                              <Label className="font-medium text-sm mb-3 block">Image Analysis</Label>
                              <div className="space-y-2 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div>
                                      <strong>Valid Image:</strong> {currentResult.analysis.isValidImage ? 'Yes' : 'No'}
                                    </div>
                                    <div>
                                      <strong>Has Data URL Prefix:</strong>{' '}
                                      {currentResult.analysis.hasDataUrlPrefix ? 'Yes' : 'No'}
                                    </div>
                                    <div>
                                      <strong>Optimized:</strong> {currentResult.analysis.isOptimized ? 'Yes' : 'No'}
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Quality Score:</strong> {currentResult.analysis.qualityScore.toFixed(1)}
                                      /100
                                    </div>
                                    <div>
                                      <strong>Format Issues:</strong> {currentResult.analysis.imageIssues.length}
                                    </div>
                                    <div>
                                      <strong>Recommendations:</strong>{' '}
                                      {currentResult.analysis.formatRecommendations.length}
                                    </div>
                                  </div>
                                </div>

                                {currentResult.analysis.suggestedImprovements.length > 0 && (
                                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                    <div className="text-sm text-blue-800">
                                      <strong>Suggestions:</strong>
                                      <ul className="list-disc list-inside mt-1">
                                        {currentResult.analysis.suggestedImprovements.map((suggestion, index) => (
                                          <li key={index}>{suggestion}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}

                                {currentResult.analysis.formatRecommendations.length > 0 && (
                                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                                    <div className="text-sm text-green-800">
                                      <strong>Format Recommendations:</strong>
                                      <ul className="list-disc list-inside mt-1">
                                        {currentResult.analysis.formatRecommendations.map((rec, index) => (
                                          <li key={index}>{rec}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}

                                {currentResult.analysis.imageIssues.length > 0 && (
                                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                                    <div className="text-sm text-red-800">
                                      <strong>Image Issues:</strong>
                                      <ul className="list-disc list-inside mt-1">
                                        {currentResult.analysis.imageIssues.map((issue, index) => (
                                          <li key={index}>{issue}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Processing Error</span>
                          </div>
                          <div className="text-red-700 text-sm mt-1">{currentResult.error}</div>
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
                            Export Result
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Image className="h-12 w-12 text-muted-foreground" />
                        <ArrowLeftRight className="h-8 w-8 text-muted-foreground" />
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No Conversion Result</h3>
                      <p className="text-muted-foreground mb-4">
                        {direction === 'base64-to-image'
                          ? 'Enter Base64 data and convert to see image preview'
                          : 'Select an image file and convert to see Base64 output'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Processing Tab */}
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Batch Image Processing
                </CardTitle>
                <CardDescription>Process multiple images to Base64 simultaneously</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batch-file-input" className="text-sm font-medium">
                      Select Multiple Image Files
                    </Label>
                    <div className="mt-2">
                      <input
                        ref={batchFileInputRef}
                        id="batch-file-input"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleBatchFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        aria-label="Select multiple image files for batch processing"
                      />
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 text-sm">
                        <div className="font-medium">{selectedFiles.length} files selected</div>
                        <div className="text-muted-foreground">
                          Total size: {formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleProcessBatch} disabled={selectedFiles.length === 0 || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Process Batch
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedFiles([])
                        if (batchFileInputRef.current) {
                          batchFileInputRef.current.value = ''
                        }
                      }}
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
                      <div key={batch.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{batch.count} images processed</h4>
                            <div className="text-sm text-muted-foreground">
                              {batch.createdAt.toLocaleString()} • {batch.statistics.successRate.toFixed(1)}% success
                              rate
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => exportResults(batch.results, 'base64')}>
                              <Download className="mr-2 h-4 w-4" />
                              Export
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
                            <span className="font-medium">Avg Quality:</span>{' '}
                            {batch.statistics.averageQuality.toFixed(1)}
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.results.slice(0, 5).map((result) => (
                              <div key={result.id} className="text-xs border rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">{result.input}</span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      result.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {result.isValid ? 'Valid' : 'Invalid'}
                                  </span>
                                </div>
                                {result.isValid && (
                                  <div className="text-muted-foreground mt-1">
                                    {result.statistics.imageMetadata.width}×{result.statistics.imageMetadata.height} •
                                    {result.statistics.imageMetadata.format.toUpperCase()} •
                                    {formatFileSize(result.statistics.outputSize)} •
                                    {result.statistics.processingTime.toFixed(2)}ms
                                  </div>
                                )}
                                {result.error && <div className="text-red-600 mt-1">{result.error}</div>}
                              </div>
                            ))}
                            {batch.results.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.results.length - 5} more images
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

          {/* Image Analyzer Tab */}
          <TabsContent value="analyzer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Image Quality Analyzer
                </CardTitle>
                <CardDescription>Detailed analysis of image quality and Base64 efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                {currentResult && currentResult.isValid ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Image Properties</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>
                            Resolution: {currentResult.statistics.imageMetadata.width}×
                            {currentResult.statistics.imageMetadata.height}
                          </div>
                          <div>Format: {currentResult.statistics.imageMetadata.format.toUpperCase()}</div>
                          <div>Aspect Ratio: {currentResult.statistics.imageMetadata.aspectRatio.toFixed(2)}</div>
                          <div>Pixel Count: {currentResult.statistics.imageMetadata.pixelCount.toLocaleString()}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Quality Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Quality Score: {currentResult.analysis?.qualityScore?.toFixed(1) || 'N/A'}/100</div>
                          <div>Size Category: {currentResult.statistics.qualityMetrics.sizeCategory}</div>
                          <div>
                            Compression: {currentResult.statistics.qualityMetrics.compressionEfficiency.toFixed(1)}%
                          </div>
                          <div>Processing Time: {currentResult.statistics.processingTime.toFixed(2)}ms</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Base64 Efficiency</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>
                            Data URL Overhead: {currentResult.statistics.qualityMetrics.dataUrlOverhead.toFixed(1)}%
                          </div>
                          <div>
                            Base64 Efficiency: {currentResult.statistics.qualityMetrics.base64Efficiency.toFixed(1)}%
                          </div>
                          <div>Input Size: {formatFileSize(currentResult.statistics.inputSize)}</div>
                          <div>Output Size: {formatFileSize(currentResult.statistics.outputSize)}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {currentResult.analysis &&
                      (currentResult.analysis.suggestedImprovements.length > 0 ||
                        currentResult.analysis.formatRecommendations.length > 0 ||
                        currentResult.analysis.imageIssues.length > 0) && (
                        <div className="space-y-4">
                          {currentResult.analysis.suggestedImprovements.length > 0 && (
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-blue-700">Suggested Improvements</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="text-sm space-y-1">
                                  {currentResult.analysis.suggestedImprovements.map((suggestion, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <CheckCircle2 className="h-3 w-3 text-blue-600" />
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}

                          {currentResult.analysis.formatRecommendations.length > 0 && (
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-green-700">Format Recommendations</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="text-sm space-y-1">
                                  {currentResult.analysis.formatRecommendations.map((rec, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <Palette className="h-3 w-3 text-green-600" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}

                          {currentResult.analysis.imageIssues.length > 0 && (
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-red-700">Image Issues</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="text-sm space-y-1">
                                  {currentResult.analysis.imageIssues.map((issue, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <AlertCircle className="h-3 w-3 text-red-600" />
                                      {issue}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Process an image in the Converter tab to see detailed analysis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Base64 Image Templates
                </CardTitle>
                <CardDescription>Common Base64 image examples and use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {imageTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
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
                            <div className="text-xs font-medium mb-1">Image Preview:</div>
                            <div className="flex justify-center p-2 bg-muted rounded">
                              <img
                                src={template.base64Example}
                                alt={template.name}
                                className="max-w-16 max-h-16 border rounded"
                                style={{ objectFit: 'contain' }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Base64 Data:</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded max-h-16 overflow-y-auto">
                              {template.base64Example.substring(0, 100)}...
                            </div>
                          </div>
                        </div>
                        <div className="text-xs">
                          <div>
                            <strong>Info:</strong> {template.imageInfo}
                          </div>
                        </div>
                        {template.useCase.length > 0 && (
                          <div className="text-xs">
                            <strong>Use cases:</strong> {template.useCase.join(', ')}
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
                Processing Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <SelectItem value="base64">Base64 Only</SelectItem>
                      <SelectItem value="dataurl">Data URL</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="txt">Text Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="compression-level" className="text-sm font-medium">
                    Compression Level: {settings.compressionLevel}
                  </Label>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="9"
                      step="1"
                      value={settings.compressionLevel}
                      onChange={(e) => setSettings((prev) => ({ ...prev, compressionLevel: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {batches.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      const allResults = batches.flatMap((batch) => batch.results)
                      exportResults(allResults, 'txt', 'base64-image-statistics.txt')
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
const Base64Image = () => {
  return (
    <Base64ImageErrorBoundary>
      <Base64ImageCore />
    </Base64ImageErrorBoundary>
  )
}

export default Base64Image
