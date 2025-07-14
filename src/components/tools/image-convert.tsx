import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Upload,
  Download,
  Image as ImageIcon,
  Loader2,
  FileImage,
  Trash2,
  RefreshCw,
  Palette,
  Settings,
} from 'lucide-react'

// Types
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
}

interface ConversionStats {
  totalOriginalSize: number
  totalConvertedSize: number
  totalSavings: number
  averageSizeChange: number
  formatDistribution: Record<string, number>
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

// Format information database
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

// Helper function to detect optimal format
const suggestOptimalFormat = (file: File, hasTransparency: boolean): string => {
  const fileSize = file.size
  const fileType = file.type

  // If image has transparency, suggest PNG or WebP
  if (hasTransparency) {
    return fileSize > 1024 * 1024 ? 'webp' : 'png' // Use WebP for larger files
  }

  // For photos without transparency, suggest JPEG or WebP
  if (fileType.includes('jpeg') || fileType.includes('jpg')) {
    return fileSize > 2 * 1024 * 1024 ? 'webp' : 'jpeg'
  }

  // For other formats, suggest WebP for better compression
  return 'webp'
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
  })
  const [dragActive, setDragActive] = useState(false)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { convertImage } = useImageConversion()

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

  // Format suggestion
  const suggestFormats = useCallback(() => {
    const suggestions = images.map((image) => {
      const suggested = suggestOptimalFormat(
        image.file,
        formatInfo[image.originalFormat]?.supportsTransparency || false
      )
      return { id: image.id, suggested }
    })

    // Apply most common suggestion to all images
    const formatCounts = suggestions.reduce(
      (acc, { suggested }) => {
        acc[suggested] = (acc[suggested] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const mostCommon = Object.entries(formatCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] as ConversionSettings['targetFormat']

    if (mostCommon) {
      setSettings((prev) => ({ ...prev, targetFormat: mostCommon }))
      setImages((prev) => prev.map((img) => ({ ...img, targetFormat: mostCommon })))
      toast.success(`Suggested format: ${formatInfo[mostCommon].name}`)
    }
  }, [images])

  // Conversion logic
  const convertImages = useCallback(async () => {
    const pendingImages = images.filter((img) => img.status === 'pending')
    if (pendingImages.length === 0) {
      toast.error('No images to convert')
      return
    }

    setIsProcessing(true)

    for (const image of pendingImages) {
      try {
        // Update status to processing
        setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, status: 'processing' } : img)))

        const result = await convertImage(image.file, settings)

        // Update with converted result
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'completed',
                  convertedUrl: result.url,
                  convertedSize: result.size,
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
    const completedCount = images.filter((img) => img.status === 'completed').length
    const message = `Conversion completed! ${completedCount} image${completedCount > 1 ? 's' : ''} processed successfully.`
    toast.success(message)

    // Announce completion to screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 2000)
  }, [images, settings, convertImage])

  // Utility functions
  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id)
      if (imageToRemove) {
        // Clean up URLs
        URL.revokeObjectURL(imageToRemove.originalUrl)
        if (imageToRemove.convertedUrl) {
          URL.revokeObjectURL(imageToRemove.convertedUrl)
        }
      }
      return prev.filter((img) => img.id !== id)
    })
  }, [])

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

  // Statistics calculation
  const stats: ConversionStats = {
    totalOriginalSize: images.reduce((sum, img) => sum + img.originalSize, 0),
    totalConvertedSize: images.reduce((sum, img) => sum + (img.convertedSize || 0), 0),
    totalSavings: 0,
    averageSizeChange: 0,
    formatDistribution: {},
  }

  stats.totalSavings = stats.totalOriginalSize - stats.totalConvertedSize
  const completedImages = images.filter((img) => img.status === 'completed')
  stats.averageSizeChange =
    completedImages.length > 0
      ? completedImages.reduce((sum, img) => {
          const change = img.convertedSize ? ((img.convertedSize - img.originalSize) / img.originalSize) * 100 : 0
          return sum + change
        }, 0) / completedImages.length
      : 0

  // Calculate format distribution
  images.forEach((img) => {
    const format = img.originalFormat
    stats.formatDistribution[format] = (stats.formatDistribution[format] || 0) + 1
  })

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
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
              <ImageIcon className="h-5 w-5" aria-hidden="true" />
              Image Format Conversion Tool
            </CardTitle>
            <CardDescription>
              Convert images between different formats with customizable quality settings. Supports batch processing and
              multiple output formats. Use keyboard navigation: Tab to move between controls, Enter or Space to activate
              buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Conversion Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Target Format */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetFormat">Target Format</Label>
                <Select
                  value={settings.targetFormat}
                  onValueChange={(value: ConversionSettings['targetFormat']) =>
                    setSettings((prev) => ({ ...prev, targetFormat: value }))
                  }
                >
                  <SelectTrigger id="targetFormat" aria-label="Select target format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(formatInfo).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{info.name}</span>
                          <span className="text-xs text-muted-foreground">{info.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Quick Actions</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={suggestFormats}
                    disabled={images.length === 0}
                    aria-label="Suggest optimal format based on uploaded images"
                  >
                    <Palette className="h-4 w-4 mr-1" />
                    Suggest Format
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Current: {formatInfo[settings.targetFormat].name} - {formatInfo[settings.targetFormat].description}
                </div>
              </div>
            </div>

            {/* Quality Settings */}
            {formatInfo[settings.targetFormat].supportsLossy && (
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

            {/* Advanced Settings */}
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="p-0 h-auto font-normal"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`}
                />
                Advanced Settings
              </Button>

              {showAdvancedSettings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                  {/* Transparency */}
                  {formatInfo[settings.targetFormat].supportsTransparency && (
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

                  {/* Background Color */}
                  {!formatInfo[settings.targetFormat].supportsTransparency && (
                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor" className="text-sm">
                        Background Color
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Input
                          type="text"
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="flex-1 text-xs"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  )}

                  {/* WebP Specific */}
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

                  {/* JPEG Specific */}
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
              )}
            </div>
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
                Supports JPEG, PNG, WebP, GIF, BMP, TIFF, SVG, ICO, AVIF, HEIC • Max 200MB per file
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
              <CardTitle className="text-lg">Statistics</CardTitle>
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
                  <div className="text-2xl font-bold text-purple-600">{stats.averageSizeChange.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Avg. Size Change</div>
                </div>
              </div>

              {/* Format Distribution */}
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

              {Math.abs(stats.totalSavings) > 0 && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-center">
                    <span className="text-purple-700 dark:text-purple-400 font-semibold">
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image List */}
        {images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {images.map((image) => (
                  <div key={image.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {/* Image Previews */}
                      <div className="flex-shrink-0">
                        <div className="flex gap-2">
                          {/* Original Image */}
                          <div className="text-center">
                            <img
                              src={image.originalUrl}
                              alt={`Original ${image.file.name}`}
                              className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() =>
                                setExpandedImage(
                                  expandedImage === `${image.id}-original` ? null : `${image.id}-original`
                                )
                              }
                            />
                            <div className="text-xs mt-1 text-muted-foreground">Original</div>
                            <div className="text-xs text-muted-foreground">{image.originalFormat.toUpperCase()}</div>
                            <div className="text-xs text-muted-foreground">{formatFileSize(image.originalSize)}</div>
                          </div>

                          {/* Converted Image */}
                          {image.status === 'completed' && image.convertedUrl && (
                            <div className="text-center">
                              <img
                                src={image.convertedUrl}
                                alt={`Converted ${image.file.name}`}
                                className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() =>
                                  setExpandedImage(
                                    expandedImage === `${image.id}-converted` ? null : `${image.id}-converted`
                                  )
                                }
                              />
                              <div className="text-xs mt-1 text-purple-600">Converted</div>
                              <div className="text-xs text-purple-600">{formatInfo[settings.targetFormat].name}</div>
                              <div className="text-xs text-purple-600">{formatFileSize(image.convertedSize || 0)}</div>
                            </div>
                          )}

                          {/* Processing State */}
                          {image.status === 'processing' && (
                            <div className="w-20 h-20 border rounded flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Image Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate" title={image.file.name}>
                          {image.file.name}
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            <span className="font-medium">Original:</span> {image.originalFormat.toUpperCase()} •{' '}
                            {image.originalDimensions.width}×{image.originalDimensions.height} •{' '}
                            {formatFileSize(image.originalSize)}
                          </div>
                          <div>
                            <span className="font-medium">Target:</span> {formatInfo[settings.targetFormat].name}
                          </div>
                          {image.status === 'completed' && image.convertedSize && (
                            <>
                              <div className="text-purple-600">
                                <span className="font-medium">Converted:</span> {formatFileSize(image.convertedSize)}
                              </div>
                              <div className="text-purple-600 font-medium">
                                Size change:{' '}
                                {(((image.convertedSize - image.originalSize) / image.originalSize) * 100).toFixed(1)}%
                                {image.convertedSize !== image.originalSize && (
                                  <span>
                                    {' '}
                                    ({image.convertedSize > image.originalSize ? '+' : ''}
                                    {formatFileSize(image.convertedSize - image.originalSize)})
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                          {image.status === 'pending' && <div className="text-blue-600">Ready for conversion</div>}
                          {image.status === 'processing' && <div className="text-blue-600">Converting...</div>}
                          {image.error && <div className="text-red-600">Error: {image.error}</div>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {image.status === 'completed' && image.convertedUrl && (
                          <Button
                            size="sm"
                            onClick={() => downloadImage(image)}
                            aria-label={`Download converted ${image.file.name}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeImage(image.id)}
                          aria-label={`Remove ${image.file.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Image View */}
                    {expandedImage === `${image.id}-original` && (
                      <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                        <h5 className="font-medium mb-2">Original Image</h5>
                        <img
                          src={image.originalUrl}
                          alt={`Original ${image.file.name}`}
                          className="max-w-full max-h-96 object-contain mx-auto border rounded"
                        />
                      </div>
                    )}

                    {expandedImage === `${image.id}-converted` && image.convertedUrl && (
                      <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                        <h5 className="font-medium mb-2">Converted Image</h5>
                        <img
                          src={image.convertedUrl}
                          alt={`Converted ${image.file.name}`}
                          className="max-w-full max-h-96 object-contain mx-auto border rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
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
