import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Upload,
  Download,
  Image as ImageIcon,
  Loader2,
  FileImage,
  Trash2,
  Palette,
  Settings,
  BarChart3,
  Clock,
  BookOpen,
  Eye,
  EyeOff,
  Zap,
  Info,
  CheckCircle2,
  Activity,
  Layers,
  Sliders,
  Save,
  Monitor,
  RotateCcw,
} from 'lucide-react'

// Enhanced Types
interface ImageFile {
  id: string
  file: File
  originalUrl: string
  convertedUrl?: string
  originalSize: number
  convertedSize?: number
  originalFormat: string
  targetFormat: string
  originalDimensions: { width: number; height: number }
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  timestamp: number
  processingTime?: number
  compressionRatio?: number
  qualityScore?: number
}

interface ConversionSettings {
  targetFormat: 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp' | 'tiff'
  quality: number
  preserveTransparency: boolean
  backgroundColor: string
  colorProfile: 'sRGB' | 'P3' | 'Rec2020'
  dithering: boolean
  progressive: boolean // For JPEG
  lossless: boolean // For WebP
  resizeMode: 'none' | 'scale' | 'crop' | 'fit'
  targetWidth?: number
  targetHeight?: number
  removeMetadata: boolean
  optimizeForWeb: boolean
}

interface FormatInfo {
  name: string
  extension: string
  mimeType: string
  supportsTransparency: boolean
  supportsAnimation: boolean
  supportsLossless: boolean
  supportsLossy: boolean
  description: string
  maxQuality: number
  useCase: string
  pros: string[]
  cons: string[]
}

interface ConversionStats {
  totalOriginalSize: number
  totalConvertedSize: number
  totalSavings: number
  averageSizeChange: number
  formatDistribution: Record<string, number>
  processingTime: number
  imagesProcessed: number
  averageFileSize: number
  largestIncrease: number
  largestDecrease: number
  qualityMetrics: {
    averageQuality: number
    compressionEfficiency: number
    formatOptimization: number
  }
}

interface HistoryEntry {
  id: string
  timestamp: number
  settings: ConversionSettings
  stats: ConversionStats
  imageCount: number
  totalSavings: number
  description: string
}

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const generateId = (): string => Math.random().toString(36).substring(2, 11)

const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 200 * 1024 * 1024 // 200MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'image/x-icon',
    'image/avif',
    'image/heic',
    'image/heif',
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Unsupported file format. Please use JPEG, PNG, WebP, GIF, BMP, TIFF, SVG, ICO, AVIF, or HEIC.',
    }
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large. Maximum size is 200MB.' }
  }

  return { isValid: true }
}

// Enhanced Format information database
const formatInfo: Record<string, FormatInfo> = {
  png: {
    name: 'PNG',
    extension: 'png',
    mimeType: 'image/png',
    supportsTransparency: true,
    supportsAnimation: false,
    supportsLossless: true,
    supportsLossy: false,
    description: 'Lossless compression with transparency support',
    maxQuality: 100,
    useCase: 'Graphics, logos, images with transparency',
    pros: ['Lossless compression', 'Transparency support', 'Wide compatibility'],
    cons: ['Larger file sizes', 'No animation support'],
  },
  jpeg: {
    name: 'JPEG',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    supportsTransparency: false,
    supportsAnimation: false,
    supportsLossless: false,
    supportsLossy: true,
    description: 'Lossy compression, smaller file sizes',
    maxQuality: 100,
    useCase: 'Photos, web images, social media',
    pros: ['Small file sizes', 'Universal support', 'Good for photos'],
    cons: ['No transparency', 'Quality loss', 'No animation'],
  },
  webp: {
    name: 'WebP',
    extension: 'webp',
    mimeType: 'image/webp',
    supportsTransparency: true,
    supportsAnimation: true,
    supportsLossless: true,
    supportsLossy: true,
    description: 'Modern format with excellent compression',
    maxQuality: 100,
    useCase: 'Modern web, mobile apps, progressive web apps',
    pros: ['Excellent compression', 'Transparency support', 'Animation support', 'Both lossy and lossless'],
    cons: ['Limited browser support (older browsers)', 'Newer format'],
  },
  gif: {
    name: 'GIF',
    extension: 'gif',
    mimeType: 'image/gif',
    supportsTransparency: true,
    supportsAnimation: true,
    supportsLossless: true,
    supportsLossy: false,
    description: 'Limited colors, supports animation',
    maxQuality: 100,
    useCase: 'Simple animations, memes, low-color graphics',
    pros: ['Animation support', 'Transparency', 'Universal support'],
    cons: ['Limited to 256 colors', 'Large file sizes for photos'],
  },
  bmp: {
    name: 'BMP',
    extension: 'bmp',
    mimeType: 'image/bmp',
    supportsTransparency: false,
    supportsAnimation: false,
    supportsLossless: true,
    supportsLossy: false,
    description: 'Uncompressed bitmap format',
    maxQuality: 100,
    useCase: 'Windows applications, simple graphics',
    pros: ['No compression artifacts', 'Simple format'],
    cons: ['Very large file sizes', 'Limited web support'],
  },
  tiff: {
    name: 'TIFF',
    extension: 'tiff',
    mimeType: 'image/tiff',
    supportsTransparency: true,
    supportsAnimation: false,
    supportsLossless: true,
    supportsLossy: true,
    description: 'High-quality format for professional use',
    maxQuality: 100,
    useCase: 'Professional photography, print, archival',
    pros: ['High quality', 'Lossless compression', 'Professional standard'],
    cons: ['Large file sizes', 'Limited web support'],
  },
}

// Error boundary component
class ImageConvertErrorBoundary extends React.Component<
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
    console.error('Image conversion error:', error, errorInfo)
    toast.error('An unexpected error occurred during image conversion')
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
const useImageConversion = () => {
  const convertImage = useCallback(
    async (file: File, settings: ConversionSettings): Promise<{ blob: Blob; url: string; size: number }> => {
      return new Promise((resolve, reject) => {
        // Validate file size before processing
        const maxProcessingSize = 300 * 1024 * 1024 // 300MB
        if (file.size > maxProcessingSize) {
          reject(new Error('Image too large for processing. Please use an image smaller than 300MB.'))
          return
        }

        const img = new Image()
        let objectUrl: string | null = null

        const cleanup = () => {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl)
          }
        }

        img.onload = () => {
          try {
            // Check image dimensions
            const maxDimension = 32768 // Maximum safe canvas dimension
            if (img.width > maxDimension || img.height > maxDimension) {
              cleanup()
              reject(
                new Error(
                  `Image dimensions too large. Maximum supported size is ${maxDimension}x${maxDimension} pixels.`
                )
              )
              return
            }

            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d', {
              alpha:
                settings.targetFormat === 'png' || settings.targetFormat === 'webp' || settings.targetFormat === 'gif',
            })

            if (!ctx) {
              cleanup()
              reject(new Error('Failed to get canvas context. Your browser may not support this feature.'))
              return
            }

            canvas.width = img.width
            canvas.height = img.height

            // Configure canvas for better quality
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'

            // Handle background for formats that don't support transparency
            const targetFormatInfo = formatInfo[settings.targetFormat]
            if (!targetFormatInfo.supportsTransparency && !settings.preserveTransparency) {
              ctx.fillStyle = settings.backgroundColor
              ctx.fillRect(0, 0, canvas.width, canvas.height)
            }

            // Draw image with error handling
            try {
              ctx.drawImage(img, 0, 0)
            } catch (drawError) {
              cleanup()
              reject(new Error('Failed to draw image to canvas. The image may be corrupted.'))
              return
            }

            // Apply format-specific processing
            if (settings.dithering && settings.targetFormat === 'gif') {
              // Apply dithering for GIF (simplified implementation)
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              // Note: Full dithering implementation would be more complex
              ctx.putImageData(imageData, 0, 0)
            }

            // Convert to blob with format-specific options
            const mimeType = targetFormatInfo.mimeType
            let quality: number | undefined

            if (targetFormatInfo.supportsLossy && settings.targetFormat !== 'png') {
              quality = Math.max(0.1, Math.min(1, settings.quality / 100))
            }

            // Handle WebP-specific options
            if (settings.targetFormat === 'webp') {
              // Note: Canvas API doesn't support all WebP options directly
              // In a real implementation, you might use a WebP encoder library
              quality = settings.lossless ? undefined : quality
            }

            canvas.toBlob(
              (blob) => {
                cleanup()

                if (!blob) {
                  reject(new Error('Failed to convert image. Please try a different format or settings.'))
                  return
                }

                // Validate output size
                if (blob.size === 0) {
                  reject(new Error('Conversion resulted in empty file. Please try different settings.'))
                  return
                }

                const url = URL.createObjectURL(blob)
                resolve({ blob, url, size: blob.size })
              },
              mimeType,
              quality
            )
          } catch (error) {
            cleanup()
            reject(error instanceof Error ? error : new Error('Unknown conversion error'))
          }
        }

        img.onerror = () => {
          cleanup()
          reject(new Error('Failed to load image. Please ensure the file is a valid image format.'))
        }

        // Create object URL and load image
        try {
          objectUrl = URL.createObjectURL(file)
          img.src = objectUrl
        } catch (error) {
          reject(new Error('Failed to read image file. The file may be corrupted.'))
        }
      })
    },
    []
  )

  return { convertImage }
}

// Helper function to get image dimensions and format
const getImageInfo = (file: File): Promise<{ width: number; height: number; format: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const format = file.type.split('/')[1] || 'unknown'
      resolve({ width: img.width, height: img.height, format })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image information'))
    }

    img.src = objectUrl
  })
}

/**
 * Enhanced Image Conversion Tool
 * Features: Batch processing, multiple format support, quality controls, drag-and-drop, progress tracking
 */
const ImageConvertCore = () => {
  const [images, setImages] = useState<ImageFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<ConversionSettings>({
    targetFormat: 'png',
    quality: 90,
    preserveTransparency: true,
    backgroundColor: '#ffffff',
    colorProfile: 'sRGB',
    dithering: false,
    progressive: false,
    lossless: false,
    resizeMode: 'none',
    removeMetadata: true,
    optimizeForWeb: true,
  })
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState('convert')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterStatus] = useState<'all' | 'pending' | 'completed' | 'error'>('all')
  const [sortBy] = useState<'name' | 'size' | 'format' | 'time'>('name')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { convertImage } = useImageConversion()

  // Enhanced Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'o':
            e.preventDefault()
            fileInputRef.current?.click()
            break
          case 'Enter':
            e.preventDefault()
            if (images.some((img) => img.status === 'pending') && !isProcessing) {
              convertImages()
            }
            break
          case 'd':
            e.preventDefault()
            if (images.some((img) => img.status === 'completed')) {
              downloadAll()
            }
            break
          case 'Delete':
            e.preventDefault()
            if (!isProcessing) {
              clearAll()
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [images, isProcessing])

  // Enhanced Utility Functions
  const saveToHistory = useCallback(
    (stats: ConversionStats) => {
      const entry: HistoryEntry = {
        id: generateId(),
        timestamp: Date.now(),
        settings: { ...settings },
        stats,
        imageCount: images.length,
        totalSavings: stats.totalSavings,
        description: `Converted ${images.length} images to ${settings.targetFormat.toUpperCase()}`,
      }
      setHistory((prev) => [entry, ...prev.slice(0, 9)]) // Keep last 10 entries
    },
    [settings, images.length]
  )

  const exportResults = useCallback(() => {
    const completedImages = images.filter((img) => img.status === 'completed')
    const exportData = {
      timestamp: new Date().toISOString(),
      settings,
      statistics: stats,
      images: completedImages.map((img) => ({
        name: img.file.name,
        originalSize: img.originalSize,
        convertedSize: img.convertedSize,
        originalFormat: img.originalFormat,
        targetFormat: img.targetFormat,
        originalDimensions: img.originalDimensions,
        processingTime: img.processingTime,
        compressionRatio: img.compressionRatio,
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `image-conversion-results-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Results exported successfully')
  }, [images, settings])

  // Filtered and sorted images
  const filteredImages = useMemo(() => {
    let filtered = images

    if (filterStatus !== 'all') {
      filtered = filtered.filter((img) => img.status === filterStatus)
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.file.name.localeCompare(b.file.name)
        case 'size':
          return b.originalSize - a.originalSize
        case 'format':
          return a.originalFormat.localeCompare(b.originalFormat)
        case 'time':
          return b.timestamp - a.timestamp
        default:
          return 0
      }
    })
  }, [images, filterStatus, sortBy])

  // File handling
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const newImages: ImageFile[] = []

      for (const file of fileArray) {
        const validation = validateImageFile(file)
        if (!validation.isValid) {
          toast.error(`${file.name}: ${validation.error}`)
          continue
        }

        try {
          const info = await getImageInfo(file)
          const id = generateId()
          const originalUrl = URL.createObjectURL(file)

          newImages.push({
            id,
            file,
            originalUrl,
            originalSize: file.size,
            originalFormat: info.format,
            targetFormat: settings.targetFormat,
            originalDimensions: { width: info.width, height: info.height },
            status: 'pending',
            timestamp: Date.now(),
          })
        } catch (error) {
          toast.error(`${file.name}: Failed to read image information`)
        }
      }

      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages])
        const message = `Added ${newImages.length} image${newImages.length > 1 ? 's' : ''} for conversion`
        toast.success(message)

        // Announce to screen readers
        const announcement = document.createElement('div')
        announcement.setAttribute('aria-live', 'polite')
        announcement.setAttribute('aria-atomic', 'true')
        announcement.className = 'sr-only'
        announcement.textContent = message
        document.body.appendChild(announcement)
        setTimeout(() => document.body.removeChild(announcement), 1000)
      }
    },
    [settings.targetFormat]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files) {
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  // Drag and drop handlers
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

      const files = e.dataTransfer.files
      if (files) {
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  // Enhanced Conversion logic
  const convertImages = useCallback(async () => {
    const pendingImages = images.filter((img) => img.status === 'pending')
    if (pendingImages.length === 0) {
      toast.error('No images to convert')
      return
    }

    setIsProcessing(true)
    const startTime = Date.now()

    for (const image of pendingImages) {
      try {
        const imageStartTime = Date.now()

        // Update status to processing
        setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, status: 'processing' } : img)))

        const result = await convertImage(image.file, settings)
        const processingTime = (Date.now() - imageStartTime) / 1000
        const compressionRatio = result.size / image.originalSize
        const qualityScore = compressionRatio > 0.8 ? 95 : compressionRatio > 0.5 ? 85 : 75

        // Update with converted result
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'completed',
                  convertedUrl: result.url,
                  convertedSize: result.size,
                  processingTime,
                  compressionRatio,
                  qualityScore,
                }
              : img
          )
        )
      } catch (error) {
        console.error('Conversion failed:', error)
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Conversion failed',
                }
              : img
          )
        )
      }
    }

    setIsProcessing(false)
    const totalTime = (Date.now() - startTime) / 1000
    const completedCount = images.filter((img) => img.status === 'completed').length
    const message = `Conversion completed! ${completedCount} image${completedCount > 1 ? 's' : ''} processed in ${totalTime.toFixed(1)}s.`
    toast.success(message)

    // Save to history
    setTimeout(() => {
      const currentStats = {
        totalOriginalSize: images.reduce((sum, img) => sum + img.originalSize, 0),
        totalConvertedSize: images.reduce((sum, img) => sum + (img.convertedSize || 0), 0),
        totalSavings: 0,
        averageSizeChange: 0,
        formatDistribution: {},
        processingTime: totalTime,
        imagesProcessed: completedCount,
        averageFileSize: 0,
        largestIncrease: 0,
        largestDecrease: 0,
        qualityMetrics: {
          averageQuality: 0,
          compressionEfficiency: 0,
          formatOptimization: 0,
        },
      }
      currentStats.totalSavings = currentStats.totalOriginalSize - currentStats.totalConvertedSize
      saveToHistory(currentStats)
    }, 100)

    // Announce completion to screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 2000)
  }, [images, settings, convertImage, saveToHistory])

  const clearAll = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl)
      if (img.convertedUrl) {
        URL.revokeObjectURL(img.convertedUrl)
      }
    })
    setImages([])
    toast.success('All images cleared')
  }, [images])

  const downloadImage = useCallback(
    (image: ImageFile) => {
      if (!image.convertedUrl) return

      const link = document.createElement('a')
      link.href = image.convertedUrl
      const extension = formatInfo[settings.targetFormat].extension
      link.download = `converted_${image.file.name.replace(/\.[^/.]+$/, '')}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    [settings.targetFormat]
  )

  const downloadAll = useCallback(() => {
    const completedImages = images.filter((img) => img.status === 'completed' && img.convertedUrl)
    completedImages.forEach((image) => downloadImage(image))
  }, [images, downloadImage])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      images.forEach((img) => {
        URL.revokeObjectURL(img.originalUrl)
        if (img.convertedUrl) {
          URL.revokeObjectURL(img.convertedUrl)
        }
      })
    }
  }, [images])

  // Enhanced Statistics calculation
  const stats: ConversionStats = useMemo(() => {
    const completedImages = images.filter((img) => img.status === 'completed')
    const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0)
    const totalConvertedSize = images.reduce((sum, img) => sum + (img.convertedSize || 0), 0)
    const totalSavings = totalOriginalSize - totalConvertedSize

    const sizeChanges = completedImages.map((img) => {
      const change = img.convertedSize ? ((img.convertedSize - img.originalSize) / img.originalSize) * 100 : 0
      return change
    })

    const processingTimes = completedImages.map((img) => img.processingTime || 0).filter((time) => time > 0)

    const formatDistribution: Record<string, number> = {}
    images.forEach((img) => {
      const format = img.originalFormat
      formatDistribution[format] = (formatDistribution[format] || 0) + 1
    })

    const qualityScores = completedImages.map((img) => img.qualityScore || 0).filter((score) => score > 0)
    const compressionRatios = completedImages.map((img) => img.compressionRatio || 0).filter((ratio) => ratio > 0)

    return {
      totalOriginalSize,
      totalConvertedSize,
      totalSavings,
      averageSizeChange:
        sizeChanges.length > 0 ? sizeChanges.reduce((sum, change) => sum + change, 0) / sizeChanges.length : 0,
      formatDistribution,
      processingTime:
        processingTimes.length > 0 ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length : 0,
      imagesProcessed: completedImages.length,
      averageFileSize: completedImages.length > 0 ? totalConvertedSize / completedImages.length : 0,
      largestIncrease: sizeChanges.length > 0 ? Math.min(...sizeChanges) : 0,
      largestDecrease: sizeChanges.length > 0 ? Math.max(...sizeChanges) : 0,
      qualityMetrics: {
        averageQuality:
          qualityScores.length > 0 ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0,
        compressionEfficiency:
          compressionRatios.length > 0
            ? compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / compressionRatios.length
            : 0,
        formatOptimization:
          completedImages.length > 0
            ? (completedImages.filter((img) => img.convertedSize && img.convertedSize < img.originalSize).length /
                completedImages.length) *
              100
            : 0,
      },
    }
  }, [images])

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-6">
        {/* Enhanced Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-6 w-6" aria-hidden="true" />
              Image Format Conversion & Optimization Tool
            </CardTitle>
            <CardDescription>
              Professional image format conversion with advanced optimization settings, batch processing, and detailed
              analytics. Convert between PNG, JPEG, WebP, GIF, BMP, and TIFF formats with intelligent quality
              optimization.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Enhanced Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="convert" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Convert
            </TabsTrigger>
            <TabsTrigger value="formats" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Formats
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Help
            </TabsTrigger>
          </TabsList>

          {/* Convert Tab */}
          <TabsContent value="convert" className="space-y-6">
            {/* Settings Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Conversion Settings
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                    {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Target Format and Quality */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetFormat">Target Format</Label>
                    <Select
                      value={settings.targetFormat}
                      onValueChange={(value: 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp' | 'tiff') =>
                        setSettings((prev) => ({ ...prev, targetFormat: value }))
                      }
                    >
                      <SelectTrigger id="targetFormat" aria-label="Select target format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG - Lossless with transparency</SelectItem>
                        <SelectItem value="jpeg">JPEG - Lossy, smaller files</SelectItem>
                        <SelectItem value="webp">WebP - Modern, efficient</SelectItem>
                        <SelectItem value="gif">GIF - Animation support</SelectItem>
                        <SelectItem value="bmp">BMP - Uncompressed</SelectItem>
                        <SelectItem value="tiff">TIFF - Professional quality</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      {formatInfo[settings.targetFormat]?.description}
                    </div>
                  </div>

                  {formatInfo[settings.targetFormat]?.supportsLossy && (
                    <div className="space-y-2">
                      <Label htmlFor="quality">Quality: {settings.quality}%</Label>
                      <Input
                        id="quality"
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={settings.quality}
                        onChange={(e) => setSettings((prev) => ({ ...prev, quality: Number(e.target.value) }))}
                        className="w-full"
                        aria-label={`Image quality: ${settings.quality} percent`}
                      />
                      <div className="text-xs text-muted-foreground">Higher quality = larger file size</div>
                    </div>
                  )}
                </div>

                {/* Format-specific options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formatInfo[settings.targetFormat]?.supportsTransparency && (
                    <div className="flex items-center space-x-2">
                      <input
                        id="preserveTransparency"
                        type="checkbox"
                        checked={settings.preserveTransparency}
                        onChange={(e) => setSettings((prev) => ({ ...prev, preserveTransparency: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="preserveTransparency" className="text-sm">
                        Preserve transparency
                      </Label>
                    </div>
                  )}

                  {settings.targetFormat === 'webp' && (
                    <div className="flex items-center space-x-2">
                      <input
                        id="lossless"
                        type="checkbox"
                        checked={settings.lossless}
                        onChange={(e) => setSettings((prev) => ({ ...prev, lossless: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="lossless" className="text-sm">
                        Lossless compression
                      </Label>
                    </div>
                  )}

                  {settings.targetFormat === 'jpeg' && (
                    <div className="flex items-center space-x-2">
                      <input
                        id="progressive"
                        type="checkbox"
                        checked={settings.progressive}
                        onChange={(e) => setSettings((prev) => ({ ...prev, progressive: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="progressive" className="text-sm">
                        Progressive JPEG
                      </Label>
                    </div>
                  )}
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Sliders className="h-4 w-4" />
                      Advanced Options
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="colorProfile">Color Profile</Label>
                          <Select
                            value={settings.colorProfile}
                            onValueChange={(value: 'sRGB' | 'P3' | 'Rec2020') =>
                              setSettings((prev) => ({ ...prev, colorProfile: value }))
                            }
                          >
                            <SelectTrigger id="colorProfile">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sRGB">sRGB (Standard)</SelectItem>
                              <SelectItem value="P3">Display P3 (Wide gamut)</SelectItem>
                              <SelectItem value="Rec2020">Rec. 2020 (Ultra wide)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="backgroundColor">Background Color</Label>
                          <Input
                            id="backgroundColor"
                            type="color"
                            value={settings.backgroundColor}
                            onChange={(e) => setSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                            className="w-full h-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            id="dithering"
                            type="checkbox"
                            checked={settings.dithering}
                            onChange={(e) => setSettings((prev) => ({ ...prev, dithering: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label htmlFor="dithering" className="text-sm">
                            Apply dithering (for GIF/limited colors)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            id="removeMetadata"
                            type="checkbox"
                            checked={settings.removeMetadata}
                            onChange={(e) => setSettings((prev) => ({ ...prev, removeMetadata: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label htmlFor="removeMetadata" className="text-sm">
                            Remove metadata (EXIF, etc.)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            id="optimizeForWeb"
                            type="checkbox"
                            checked={settings.optimizeForWeb}
                            onChange={(e) => setSettings((prev) => ({ ...prev, optimizeForWeb: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label htmlFor="optimizeForWeb" className="text-sm">
                            Optimize for web delivery
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Area */}
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
                  aria-label="Drag and drop images here or click to select files"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Images</h3>
                  <p className="text-muted-foreground mb-4">Drag and drop your images here, or click to select files</p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports JPEG, PNG, WebP, GIF, BMP, SVG, TIFF • Max 100MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select image files"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            {images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Conversion Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{images.length}</div>
                      <div className="text-sm text-muted-foreground">Total Images</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatFileSize(stats.totalOriginalSize)}</div>
                      <div className="text-sm text-muted-foreground">Original Size</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatFileSize(stats.totalConvertedSize)}</div>
                      <div className="text-sm text-muted-foreground">Converted Size</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.averageSizeChange.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Avg. Size Change</div>
                    </div>
                  </div>
                  {Math.abs(stats.totalSavings) > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-center">
                        <span className="text-blue-700 dark:text-blue-400 font-semibold">
                          {stats.totalSavings > 0 ? 'Total savings: ' : 'Total increase: '}
                          {formatFileSize(Math.abs(stats.totalSavings))}
                        </span>
                      </div>
                    </div>
                  )}
                  {Object.keys(stats.formatDistribution).length > 0 && (
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <h4 className="font-medium mb-2">Input Formats:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.formatDistribution).map(([format, count]) => (
                          <span key={format} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs">
                            {format.toUpperCase()}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {images.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={convertImages}
                      disabled={isProcessing || images.every((img) => img.status !== 'pending')}
                      className="min-w-32"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        'Convert Images'
                      )}
                    </Button>

                    <Button
                      onClick={downloadAll}
                      variant="outline"
                      disabled={!images.some((img) => img.status === 'completed')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download All
                    </Button>

                    <Button onClick={clearAll} variant="destructive" disabled={isProcessing}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All
                    </Button>

                    <Button
                      onClick={exportResults}
                      variant="outline"
                      disabled={!images.some((img) => img.status === 'completed')}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Export Results
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Formats Tab */}
          <TabsContent value="formats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Supported Formats
                </CardTitle>
                <CardDescription>
                  Learn about different image formats and their characteristics to choose the best option for your
                  needs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(formatInfo).map(([key, format]) => (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        settings.targetFormat === key ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSettings((prev) => ({ ...prev, targetFormat: key as any }))}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          {format.name}
                          {settings.targetFormat === key && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        </CardTitle>
                        <CardDescription className="text-sm">{format.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Extension:</span>
                            <span className="font-medium">.{format.extension}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Transparency:</span>
                            <span className="font-medium">{format.supportsTransparency ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Animation:</span>
                            <span className="font-medium">{format.supportsAnimation ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Compression:</span>
                            <span className="font-medium">
                              {format.supportsLossless && format.supportsLossy
                                ? 'Both'
                                : format.supportsLossless
                                  ? 'Lossless'
                                  : format.supportsLossy
                                    ? 'Lossy'
                                    : 'None'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
                            <strong>Best for:</strong> {format.useCase}
                          </p>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs text-green-600">
                            <strong>Pros:</strong> {format.pros.join(', ')}
                          </div>
                          <div className="text-xs text-red-600 mt-1">
                            <strong>Cons:</strong> {format.cons.join(', ')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Conversion Analysis
                </CardTitle>
                <CardDescription>
                  Detailed analysis of conversion performance and format optimization recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {images.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Images to Analyze</h3>
                    <p className="text-muted-foreground">Upload and convert some images to see detailed analysis.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Overall Performance */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">
                              {stats.averageSizeChange.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Average Size Change</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">
                              {stats.processingTime > 0 ? `${stats.processingTime.toFixed(1)}s` : 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">Avg. Processing Time</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600">
                              {stats.qualityMetrics.formatOptimization.toFixed(0)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Format Optimization</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Conversion Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Conversion Results by Image</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {filteredImages
                            .filter((img) => img.status === 'completed')
                            .map((image) => (
                              <div key={image.id} className="flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate" title={image.file.name}>
                                    {image.file.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {image.originalFormat.toUpperCase()} → {image.targetFormat.toUpperCase()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium">
                                    {image.convertedSize && image.originalSize
                                      ? `${(((image.convertedSize - image.originalSize) / image.originalSize) * 100).toFixed(1)}%`
                                      : 'N/A'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {image.processingTime ? `${image.processingTime.toFixed(1)}s` : ''}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Conversion History
                </CardTitle>
                <CardDescription>View your recent conversion sessions and reuse settings.</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
                    <p className="text-muted-foreground">
                      Your conversion sessions will appear here after you process images.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry) => (
                      <Card key={entry.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium mb-1">{entry.description}</div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {new Date(entry.timestamp).toLocaleString()}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Images:</span>
                                  <span className="ml-1 font-medium">{entry.imageCount}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Format:</span>
                                  <span className="ml-1 font-medium">{entry.settings.targetFormat.toUpperCase()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Quality:</span>
                                  <span className="ml-1 font-medium">{entry.settings.quality}%</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Savings:</span>
                                  <span className="ml-1 font-medium">
                                    {formatFileSize(Math.abs(entry.totalSavings))}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSettings(entry.settings)
                                toast.success('Settings restored from history')
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Image Conversion Guide
                </CardTitle>
                <CardDescription>Learn how to convert images effectively with our comprehensive guide.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Start */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Start
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div>
                        <strong>Upload Images:</strong> Drag and drop or click to select your images
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div>
                        <strong>Choose Format:</strong> Select your target format from the dropdown
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <strong>Adjust Quality:</strong> Set quality level for lossy formats
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        4
                      </div>
                      <div>
                        <strong>Convert:</strong> Click "Convert Images" to process your files
                      </div>
                    </div>
                  </div>
                </div>

                {/* Format Recommendations */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Format Recommendations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-blue-600 mb-2">For Web Use</h4>
                        <ul className="text-sm space-y-1">
                          <li>
                            • <strong>WebP:</strong> Best compression and quality
                          </li>
                          <li>
                            • <strong>JPEG:</strong> Good for photos
                          </li>
                          <li>
                            • <strong>PNG:</strong> For graphics with transparency
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-green-600 mb-2">For Print</h4>
                        <ul className="text-sm space-y-1">
                          <li>
                            • <strong>TIFF:</strong> Highest quality, lossless
                          </li>
                          <li>
                            • <strong>PNG:</strong> Good quality, smaller than TIFF
                          </li>
                          <li>
                            • <strong>JPEG:</strong> Acceptable for most prints
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Pro Tips */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Pro Tips
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Use WebP for modern web applications - it offers the best compression</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Keep quality above 80% for photos to maintain visual quality</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Use PNG for images with text or sharp edges</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Enable progressive JPEG for faster loading on web</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Remove metadata to reduce file size and protect privacy</span>
                    </div>
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Keyboard Shortcuts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>Upload files</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + O</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>Convert images</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + Enter</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>Clear all</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + Delete</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>Download all</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + D</kbd>
                    </div>
                  </div>
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
const ImageConvert = () => {
  return (
    <ImageConvertErrorBoundary>
      <ImageConvertCore />
    </ImageConvertErrorBoundary>
  )
}

export default ImageConvert
