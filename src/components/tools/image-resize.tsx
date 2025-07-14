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
  Lock,
  Unlock,
  RotateCcw,
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
  Crop,
} from 'lucide-react'

// Enhanced Types
interface ImageFile {
  id: string
  file: File
  originalUrl: string
  resizedUrl?: string
  originalSize: number
  resizedSize?: number
  originalDimensions: { width: number; height: number }
  resizedDimensions?: { width: number; height: number }
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  timestamp: number
  processingTime?: number
  format?: string
  aspectRatio?: number
}

interface ResizeSettings {
  width: number
  height: number
  maintainAspectRatio: boolean
  resizeMode: 'exact' | 'fit' | 'fill' | 'stretch'
  format: 'png' | 'jpeg' | 'webp'
  quality: number
  backgroundColor: string
  interpolation: 'nearest' | 'bilinear' | 'bicubic' | 'lanczos'
  sharpen: boolean
  removeMetadata: boolean
}

interface PresetDimension {
  name: string
  width: number
  height: number
  category: 'social' | 'web' | 'print' | 'video' | 'mobile'
  description: string
  aspectRatio: string
  useCase: string
}

interface ResizeStats {
  totalOriginalSize: number
  totalResizedSize: number
  totalSavings: number
  averageSizeReduction: number
  processingTime: number
  imagesProcessed: number
  averageFileSize: number
  largestIncrease: number
  largestDecrease: number
  dimensionChanges: {
    averageWidthChange: number
    averageHeightChange: number
    aspectRatioChanges: number
  }
}

interface HistoryEntry {
  id: string
  timestamp: number
  settings: ResizeSettings
  stats: ResizeStats
  imageCount: number
  totalSavings: number
  description: string
}

interface AnalysisData {
  resizeEfficiency: number
  qualityScore: number
  dimensionOptimization: number
  formatRecommendation: string
  performanceImpact: 'low' | 'medium' | 'high'
  recommendations: string[]
  technicalDetails: {
    aspectRatioPreserved: boolean
    upscaling: boolean
    downscaling: boolean
    significantResize: boolean
  }
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
  const maxSize = 100 * 1024 * 1024 // 100MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml']

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Unsupported file format. Please use JPEG, PNG, WebP, GIF, BMP, or SVG.' }
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large. Maximum size is 100MB.' }
  }

  return { isValid: true }
}

// Enhanced Preset dimensions for common use cases
const presetDimensions: PresetDimension[] = [
  // Social Media
  {
    name: 'Instagram Post',
    width: 1080,
    height: 1080,
    category: 'social',
    description: 'Perfect square format for Instagram feed posts',
    aspectRatio: '1:1',
    useCase: 'Instagram feed posts, profile pictures',
  },
  {
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    category: 'social',
    description: 'Vertical format for Instagram and Facebook stories',
    aspectRatio: '9:16',
    useCase: 'Instagram stories, Facebook stories, vertical video',
  },
  {
    name: 'Facebook Cover',
    width: 1200,
    height: 630,
    category: 'social',
    description: 'Facebook page cover photo dimensions',
    aspectRatio: '1.91:1',
    useCase: 'Facebook cover photos, LinkedIn company banners',
  },
  {
    name: 'Twitter Header',
    width: 1500,
    height: 500,
    category: 'social',
    description: 'Twitter profile header banner',
    aspectRatio: '3:1',
    useCase: 'Twitter headers, wide banner graphics',
  },
  {
    name: 'LinkedIn Banner',
    width: 1584,
    height: 396,
    category: 'social',
    description: 'LinkedIn personal profile banner',
    aspectRatio: '4:1',
    useCase: 'LinkedIn profile banners, professional headers',
  },

  // Web
  {
    name: 'Website Banner',
    width: 1920,
    height: 600,
    category: 'web',
    description: 'Full-width website hero banner',
    aspectRatio: '3.2:1',
    useCase: 'Website headers, hero banners, landing pages',
  },
  {
    name: 'Blog Thumbnail',
    width: 800,
    height: 450,
    category: 'web',
    description: 'Standard blog post thumbnail',
    aspectRatio: '16:9',
    useCase: 'Blog thumbnails, article previews, video thumbnails',
  },
  {
    name: 'Avatar/Profile',
    width: 400,
    height: 400,
    category: 'web',
    description: 'Square profile picture format',
    aspectRatio: '1:1',
    useCase: 'Profile pictures, avatars, user icons',
  },

  // Video
  {
    name: 'Full HD',
    width: 1920,
    height: 1080,
    category: 'video',
    description: '1080p high definition video format',
    aspectRatio: '16:9',
    useCase: 'HD video, YouTube thumbnails, presentations',
  },
  {
    name: 'HD',
    width: 1280,
    height: 720,
    category: 'video',
    description: '720p high definition video format',
    aspectRatio: '16:9',
    useCase: 'HD video, streaming, web video',
  },
  {
    name: '4K UHD',
    width: 3840,
    height: 2160,
    category: 'video',
    description: '4K ultra high definition format',
    aspectRatio: '16:9',
    useCase: '4K video, high-resolution displays, professional video',
  },

  // Mobile
  {
    name: 'iPhone 15 Pro',
    width: 1179,
    height: 2556,
    category: 'mobile',
    description: 'iPhone 15 Pro screen resolution',
    aspectRatio: '19.5:9',
    useCase: 'Mobile wallpapers, app screenshots, mobile design',
  },
  {
    name: 'Android Standard',
    width: 1080,
    height: 1920,
    category: 'mobile',
    description: 'Standard Android phone resolution',
    aspectRatio: '16:9',
    useCase: 'Android wallpapers, mobile apps, responsive design',
  },

  // Print
  {
    name: 'A4 (300 DPI)',
    width: 2480,
    height: 3508,
    category: 'print',
    description: 'A4 paper size at print resolution',
    aspectRatio: '1.41:1',
    useCase: 'Print documents, flyers, posters',
  },
  {
    name: 'Letter (300 DPI)',
    width: 2550,
    height: 3300,
    category: 'print',
    description: 'US Letter size at print resolution',
    aspectRatio: '1.29:1',
    useCase: 'US print documents, letters, reports',
  },
]

// Error boundary component
class ImageResizeErrorBoundary extends React.Component<
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
    console.error('Image resize error:', error, errorInfo)
    toast.error('An unexpected error occurred during image resizing')
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
const useImageResize = () => {
  const resizeImage = useCallback(
    async (
      file: File,
      settings: ResizeSettings,
      originalDimensions: { width: number; height: number }
    ): Promise<{ blob: Blob; url: string; size: number; dimensions: { width: number; height: number } }> => {
      return new Promise((resolve, reject) => {
        // Validate file size before processing
        const maxProcessingSize = 200 * 1024 * 1024 // 200MB
        if (file.size > maxProcessingSize) {
          reject(new Error('Image too large for processing. Please use an image smaller than 200MB.'))
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
            const maxDimension = 16384 // Maximum safe canvas dimension
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
            const ctx = canvas.getContext('2d', { alpha: settings.format === 'png' })

            if (!ctx) {
              cleanup()
              reject(new Error('Failed to get canvas context. Your browser may not support this feature.'))
              return
            }

            // Calculate target dimensions based on resize mode
            let targetWidth = settings.width
            let targetHeight = settings.height

            if (settings.maintainAspectRatio && settings.resizeMode !== 'exact') {
              const aspectRatio = originalDimensions.width / originalDimensions.height

              switch (settings.resizeMode) {
                case 'fit':
                  // Fit within bounds while maintaining aspect ratio
                  if (targetWidth / targetHeight > aspectRatio) {
                    targetWidth = targetHeight * aspectRatio
                  } else {
                    targetHeight = targetWidth / aspectRatio
                  }
                  break
                case 'fill':
                  // Fill bounds while maintaining aspect ratio (may crop)
                  if (targetWidth / targetHeight < aspectRatio) {
                    targetWidth = targetHeight * aspectRatio
                  } else {
                    targetHeight = targetWidth / aspectRatio
                  }
                  break
                case 'stretch':
                  // Use exact dimensions (will distort if aspect ratios don't match)
                  break
              }
            }

            // Ensure dimensions are integers and within bounds
            targetWidth = Math.max(1, Math.min(maxDimension, Math.round(targetWidth)))
            targetHeight = Math.max(1, Math.min(maxDimension, Math.round(targetHeight)))

            canvas.width = targetWidth
            canvas.height = targetHeight

            // Configure canvas for better quality
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'

            // Set background color for formats that don't support transparency
            if (settings.format !== 'png' && settings.backgroundColor) {
              ctx.fillStyle = settings.backgroundColor
              ctx.fillRect(0, 0, targetWidth, targetHeight)
            }

            // Calculate drawing dimensions and position for different resize modes
            let drawWidth = targetWidth
            let drawHeight = targetHeight
            let drawX = 0
            let drawY = 0

            if (settings.resizeMode === 'fill' && settings.maintainAspectRatio) {
              const scaleX = targetWidth / originalDimensions.width
              const scaleY = targetHeight / originalDimensions.height
              const scale = Math.max(scaleX, scaleY)

              drawWidth = originalDimensions.width * scale
              drawHeight = originalDimensions.height * scale
              drawX = (targetWidth - drawWidth) / 2
              drawY = (targetHeight - drawHeight) / 2
            }

            // Draw image with error handling
            try {
              ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
            } catch (drawError) {
              cleanup()
              reject(new Error('Failed to draw image to canvas. The image may be corrupted.'))
              return
            }

            // Convert to blob with format-specific options
            const mimeType = `image/${settings.format}`
            const quality = settings.format === 'png' ? undefined : Math.max(0.1, Math.min(1, settings.quality / 100))

            canvas.toBlob(
              (blob) => {
                cleanup()

                if (!blob) {
                  reject(new Error('Failed to resize image. Please try a different format or settings.'))
                  return
                }

                // Validate output size
                if (blob.size === 0) {
                  reject(new Error('Resizing resulted in empty file. Please try different settings.'))
                  return
                }

                const url = URL.createObjectURL(blob)
                resolve({
                  blob,
                  url,
                  size: blob.size,
                  dimensions: { width: targetWidth, height: targetHeight },
                })
              },
              mimeType,
              quality
            )
          } catch (error) {
            cleanup()
            reject(error instanceof Error ? error : new Error('Unknown resize error'))
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

  return { resizeImage }
}

// Helper function to get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image dimensions'))
    }

    img.src = objectUrl
  })
}

/**
 * Enhanced Image Resize Tool
 * Features: Batch processing, aspect ratio controls, preset dimensions, drag-and-drop, progress tracking
 */
const ImageResizeCore = () => {
  const [images, setImages] = useState<ImageFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<ResizeSettings>({
    width: 800,
    height: 600,
    maintainAspectRatio: true,
    resizeMode: 'fit',
    format: 'png',
    quality: 90,
    backgroundColor: '#ffffff',
    interpolation: 'lanczos',
    sharpen: false,
    removeMetadata: true,
  })
  const [dragActive, setDragActive] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [activeTab, setActiveTab] = useState('resize')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterStatus] = useState<'all' | 'pending' | 'completed' | 'error'>('all')
  const [sortBy] = useState<'name' | 'size' | 'dimensions' | 'time'>('name')
  const [_, setCopySuccess] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { resizeImage } = useImageResize()

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
              resizeImages()
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
    (stats: ResizeStats) => {
      const entry: HistoryEntry = {
        id: generateId(),
        timestamp: Date.now(),
        settings: { ...settings },
        stats,
        imageCount: images.length,
        totalSavings: stats.totalSavings,
        description: `Resized ${images.length} images to ${settings.width}×${settings.height} in ${settings.format.toUpperCase()}`,
      }
      setHistory((prev) => [entry, ...prev.slice(0, 9)]) // Keep last 10 entries
    },
    [settings, images.length]
  )

  // Enhanced Statistics calculation
  const stats: ResizeStats = useMemo(() => {
    const completedImages = images.filter((img) => img.status === 'completed')
    const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0)
    const totalResizedSize = images.reduce((sum, img) => sum + (img.resizedSize || 0), 0)
    const totalSavings = totalOriginalSize - totalResizedSize

    const sizeChanges = completedImages.map((img) => {
      const change = img.resizedSize ? ((img.originalSize - img.resizedSize) / img.originalSize) * 100 : 0
      return change
    })

    const processingTimes = completedImages.map((img) => img.processingTime || 0).filter((time) => time > 0)

    const widthChanges = completedImages.map((img) => {
      if (!img.resizedDimensions) return 0
      return ((img.resizedDimensions.width - img.originalDimensions.width) / img.originalDimensions.width) * 100
    })

    const heightChanges = completedImages.map((img) => {
      if (!img.resizedDimensions) return 0
      return ((img.resizedDimensions.height - img.originalDimensions.height) / img.originalDimensions.height) * 100
    })

    const aspectRatioChanges = completedImages.filter((img) => {
      if (!img.resizedDimensions) return false
      const originalRatio = img.originalDimensions.width / img.originalDimensions.height
      const resizedRatio = img.resizedDimensions.width / img.resizedDimensions.height
      return Math.abs(originalRatio - resizedRatio) > 0.01
    }).length

    return {
      totalOriginalSize,
      totalResizedSize,
      totalSavings,
      averageSizeReduction:
        sizeChanges.length > 0 ? sizeChanges.reduce((sum, change) => sum + change, 0) / sizeChanges.length : 0,
      processingTime:
        processingTimes.length > 0 ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length : 0,
      imagesProcessed: completedImages.length,
      averageFileSize: completedImages.length > 0 ? totalResizedSize / completedImages.length : 0,
      largestIncrease: sizeChanges.length > 0 ? Math.min(...sizeChanges) : 0,
      largestDecrease: sizeChanges.length > 0 ? Math.max(...sizeChanges) : 0,
      dimensionChanges: {
        averageWidthChange:
          widthChanges.length > 0 ? widthChanges.reduce((sum, change) => sum + change, 0) / widthChanges.length : 0,
        averageHeightChange:
          heightChanges.length > 0 ? heightChanges.reduce((sum, change) => sum + change, 0) / heightChanges.length : 0,
        aspectRatioChanges,
      },
    }
  }, [images])

  const exportResults = useCallback(() => {
    const completedImages = images.filter((img) => img.status === 'completed')
    const exportData = {
      timestamp: new Date().toISOString(),
      settings,
      statistics: stats,
      images: completedImages.map((img) => ({
        name: img.file.name,
        originalSize: img.originalSize,
        resizedSize: img.resizedSize,
        originalDimensions: img.originalDimensions,
        resizedDimensions: img.resizedDimensions,
        format: img.format,
        processingTime: img.processingTime,
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `image-resize-results-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Results exported successfully')
  }, [images, settings, stats])

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
        case 'dimensions':
          return (
            b.originalDimensions.width * b.originalDimensions.height -
            a.originalDimensions.width * a.originalDimensions.height
          )
        case 'time':
          return b.timestamp - a.timestamp
        default:
          return 0
      }
    })
  }, [images, filterStatus, sortBy])

  // File handling
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newImages: ImageFile[] = []

    for (const file of fileArray) {
      const validation = validateImageFile(file)
      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.error}`)
        continue
      }

      try {
        const dimensions = await getImageDimensions(file)
        const id = generateId()
        const originalUrl = URL.createObjectURL(file)

        newImages.push({
          id,
          file,
          originalUrl,
          originalSize: file.size,
          originalDimensions: dimensions,
          status: 'pending',
          timestamp: Date.now(),
          aspectRatio: dimensions.width / dimensions.height,
        })
      } catch (error) {
        toast.error(`${file.name}: Failed to read image dimensions`)
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages])
      const message = `Added ${newImages.length} image${newImages.length > 1 ? 's' : ''} for resizing`
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
  }, [])

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

  // Preset dimension handlers
  const applyPreset = useCallback((preset: PresetDimension) => {
    setSettings((prev) => ({
      ...prev,
      width: preset.width,
      height: preset.height,
    }))
    setSelectedPreset(preset.name)
    toast.success(`Applied preset: ${preset.name}`)
  }, [])

  // Enhanced Resize logic
  const resizeImages = useCallback(async () => {
    const pendingImages = images.filter((img) => img.status === 'pending')
    if (pendingImages.length === 0) {
      toast.error('No images to resize')
      return
    }

    setIsProcessing(true)
    const startTime = Date.now()

    for (const image of pendingImages) {
      try {
        const imageStartTime = Date.now()

        // Update status to processing
        setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, status: 'processing' } : img)))

        const result = await resizeImage(image.file, settings, image.originalDimensions)
        const processingTime = (Date.now() - imageStartTime) / 1000

        // Update with resized result
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'completed',
                  resizedUrl: result.url,
                  resizedSize: result.size,
                  resizedDimensions: result.dimensions,
                  processingTime,
                  format: settings.format,
                }
              : img
          )
        )
      } catch (error) {
        console.error('Resize failed:', error)
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Resize failed',
                }
              : img
          )
        )
      }
    }

    setIsProcessing(false)
    const totalTime = (Date.now() - startTime) / 1000
    const completedCount = images.filter((img) => img.status === 'completed').length
    const message = `Resizing completed! ${completedCount} image${completedCount > 1 ? 's' : ''} processed in ${totalTime.toFixed(1)}s.`
    toast.success(message)

    // Save to history
    setTimeout(() => {
      const currentStats = {
        totalOriginalSize: images.reduce((sum, img) => sum + img.originalSize, 0),
        totalResizedSize: images.reduce((sum, img) => sum + (img.resizedSize || 0), 0),
        totalSavings: 0,
        averageSizeReduction: 0,
        processingTime: totalTime,
        imagesProcessed: completedCount,
        averageFileSize: 0,
        largestIncrease: 0,
        largestDecrease: 0,
        dimensionChanges: {
          averageWidthChange: 0,
          averageHeightChange: 0,
          aspectRatioChanges: 0,
        },
      }
      currentStats.totalSavings = currentStats.totalOriginalSize - currentStats.totalResizedSize
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
  }, [images, settings, resizeImage, saveToHistory])

  const clearAll = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl)
      if (img.resizedUrl) {
        URL.revokeObjectURL(img.resizedUrl)
      }
    })
    setImages([])
    toast.success('All images cleared')
  }, [images])

  const downloadImage = useCallback(
    (image: ImageFile) => {
      if (!image.resizedUrl) return

      const link = document.createElement('a')
      link.href = image.resizedUrl
      const extension = settings.format === 'jpeg' ? 'jpg' : settings.format
      link.download = `resized_${image.file.name.replace(/\.[^/.]+$/, '')}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    [settings.format]
  )

  const downloadAll = useCallback(() => {
    const completedImages = images.filter((img) => img.status === 'completed' && img.resizedUrl)
    completedImages.forEach((image) => downloadImage(image))
  }, [images, downloadImage])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      images.forEach((img) => {
        URL.revokeObjectURL(img.originalUrl)
        if (img.resizedUrl) {
          URL.revokeObjectURL(img.resizedUrl)
        }
      })
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
              Image Resize & Dimension Tool
            </CardTitle>
            <CardDescription>
              Professional image resizing with advanced dimension controls, batch processing, and detailed analytics.
              Supports multiple resize modes, aspect ratio preservation, and intelligent optimization recommendations.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Enhanced Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="resize" className="flex items-center gap-2">
              <Crop className="h-4 w-4" />
              Resize
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Presets
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

          {/* Resize Tab */}
          <TabsContent value="resize" className="space-y-6">
            {/* Settings Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Resize Settings
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                    {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dimensions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (pixels)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="width"
                        type="number"
                        min="1"
                        max="16384"
                        value={settings.width}
                        onChange={(e) => {
                          setSettings((prev) => ({ ...prev, width: Number(e.target.value) }))
                          setSelectedPreset('')
                        }}
                        className="flex-1"
                        aria-label={`Width: ${settings.width} pixels`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            maintainAspectRatio: !prev.maintainAspectRatio,
                          }))
                        }
                        aria-label={`${settings.maintainAspectRatio ? 'Unlock' : 'Lock'} aspect ratio`}
                      >
                        {settings.maintainAspectRatio ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Height (pixels)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="height"
                        type="number"
                        min="1"
                        max="16384"
                        value={settings.height}
                        onChange={(e) => {
                          setSettings((prev) => ({ ...prev, height: Number(e.target.value) }))
                          setSelectedPreset('')
                        }}
                        className="flex-1"
                        aria-label={`Height: ${settings.height} pixels`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            width: 800,
                            height: 600,
                          }))
                        }
                        aria-label="Reset dimensions to default"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Resize Mode and Format */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resizeMode">Resize Mode</Label>
                    <Select
                      value={settings.resizeMode}
                      onValueChange={(value: 'exact' | 'fit' | 'fill' | 'stretch') =>
                        setSettings((prev) => ({ ...prev, resizeMode: value }))
                      }
                    >
                      <SelectTrigger id="resizeMode" aria-label="Select resize mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit (maintain aspect ratio)</SelectItem>
                        <SelectItem value="fill">Fill (may crop)</SelectItem>
                        <SelectItem value="exact">Exact dimensions</SelectItem>
                        <SelectItem value="stretch">Stretch to fit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Output Format</Label>
                    <Select
                      value={settings.format}
                      onValueChange={(value: 'png' | 'jpeg' | 'webp') =>
                        setSettings((prev) => ({ ...prev, format: value }))
                      }
                    >
                      <SelectTrigger id="format" aria-label="Select output format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG (Lossless)</SelectItem>
                        <SelectItem value="jpeg">JPEG (Smaller size)</SelectItem>
                        <SelectItem value="webp">WebP (Modern format)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.format !== 'png' && (
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
                          <Label htmlFor="interpolation">Interpolation Method</Label>
                          <Select
                            value={settings.interpolation}
                            onValueChange={(value: 'nearest' | 'bilinear' | 'bicubic' | 'lanczos') =>
                              setSettings((prev) => ({ ...prev, interpolation: value }))
                            }
                          >
                            <SelectTrigger id="interpolation">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lanczos">Lanczos (Best quality)</SelectItem>
                              <SelectItem value="bicubic">Bicubic (Balanced)</SelectItem>
                              <SelectItem value="bilinear">Bilinear (Fast)</SelectItem>
                              <SelectItem value="nearest">Nearest (Fastest)</SelectItem>
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
                            id="sharpen"
                            type="checkbox"
                            checked={settings.sharpen}
                            onChange={(e) => setSettings((prev) => ({ ...prev, sharpen: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label htmlFor="sharpen" className="text-sm">
                            Apply sharpening filter
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
                    Supports JPEG, PNG, WebP, GIF, BMP, SVG • Max 100MB per file
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
                    Resize Statistics
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
                      <div className="text-2xl font-bold">{formatFileSize(stats.totalResizedSize)}</div>
                      <div className="text-sm text-muted-foreground">Resized Size</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.averageSizeReduction.toFixed(1)}%</div>
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
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {images.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={resizeImages}
                      disabled={isProcessing || images.every((img) => img.status !== 'pending')}
                      className="min-w-32"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Resize Images'
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

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Dimension Presets
                </CardTitle>
                <CardDescription>
                  Pre-configured dimensions optimized for different platforms and use cases. Click to apply a preset.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {presetDimensions.map((preset) => (
                    <Card
                      key={preset.name}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPreset === preset.name ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => applyPreset(preset)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          {preset.name}
                          {selectedPreset === preset.name && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        </CardTitle>
                        <CardDescription className="text-sm">{preset.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dimensions:</span>
                            <span className="font-medium">
                              {preset.width}×{preset.height}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Aspect Ratio:</span>
                            <span className="font-medium">{preset.aspectRatio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Category:</span>
                            <span className="capitalize font-medium">{preset.category}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
                            <strong>Use case:</strong> {preset.useCase}
                          </p>
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
                  Resize Analysis
                </CardTitle>
                <CardDescription>
                  Detailed analysis of resize performance and dimension optimization recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {images.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Images to Analyze</h3>
                    <p className="text-muted-foreground">Upload and resize some images to see detailed analysis.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Overall Performance */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">
                              {stats.averageSizeReduction.toFixed(1)}%
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
                              {stats.dimensionChanges.aspectRatioChanges}
                            </div>
                            <div className="text-sm text-muted-foreground">Aspect Ratio Changes</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Dimension Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Dimension Changes by Image</CardTitle>
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
                                    {image.originalDimensions.width}×{image.originalDimensions.height} →{' '}
                                    {image.resizedDimensions?.width}×{image.resizedDimensions?.height}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium">
                                    {image.resizedSize && image.originalSize
                                      ? `${(((image.resizedSize - image.originalSize) / image.originalSize) * 100).toFixed(1)}%`
                                      : 'N/A'}
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
                  Resize History
                </CardTitle>
                <CardDescription>View your recent resize sessions and reuse settings.</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
                    <p className="text-muted-foreground">
                      Your resize sessions will appear here after you process images.
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
                                  <span className="text-muted-foreground">Dimensions:</span>
                                  <span className="ml-1 font-medium">
                                    {entry.settings.width}×{entry.settings.height}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Format:</span>
                                  <span className="ml-1 font-medium">{entry.settings.format.toUpperCase()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Mode:</span>
                                  <span className="ml-1 font-medium capitalize">{entry.settings.resizeMode}</span>
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
                  Image Resize Guide
                </CardTitle>
                <CardDescription>Learn how to resize images effectively with our comprehensive guide.</CardDescription>
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
                        <strong>Set Dimensions:</strong> Enter target width and height or use presets
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <strong>Choose Mode:</strong> Select how images should be resized (fit, fill, exact, stretch)
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        4
                      </div>
                      <div>
                        <strong>Resize:</strong> Click "Resize Images" to process your files
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resize Modes */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Crop className="h-5 w-5" />
                    Resize Modes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-blue-600 mb-2">Fit</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Maintains aspect ratio</li>
                          <li>• Fits within target dimensions</li>
                          <li>• No cropping or distortion</li>
                          <li>• Best for preserving image quality</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-green-600 mb-2">Fill</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Maintains aspect ratio</li>
                          <li>• Fills target dimensions exactly</li>
                          <li>• May crop parts of the image</li>
                          <li>• Good for thumbnails</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-purple-600 mb-2">Exact</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Uses exact dimensions</li>
                          <li>• May change aspect ratio</li>
                          <li>• Can cause distortion</li>
                          <li>• Use when exact size is required</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-orange-600 mb-2">Stretch</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Stretches to fit dimensions</li>
                          <li>• Will distort the image</li>
                          <li>• No cropping</li>
                          <li>• Use with caution</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Pro Tips */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Pro Tips
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Use "Fit" mode to preserve image quality and aspect ratio</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Choose WebP format for the best compression and quality balance</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Use presets for common social media and web dimensions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Enable sharpening when downscaling images significantly</span>
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
                      <span>Resize images</span>
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
const ImageResize = () => {
  return (
    <ImageResizeErrorBoundary>
      <ImageResizeCore />
    </ImageResizeErrorBoundary>
  )
}

export default ImageResize
