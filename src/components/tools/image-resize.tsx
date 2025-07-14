import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, Download, Image as ImageIcon, Loader2, FileImage, Trash2, Lock, Unlock, RotateCcw } from 'lucide-react'

// Types
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
}

interface ResizeSettings {
  width: number
  height: number
  maintainAspectRatio: boolean
  resizeMode: 'exact' | 'fit' | 'fill' | 'stretch'
  format: 'png' | 'jpeg' | 'webp'
  quality: number
  backgroundColor: string
}

interface PresetDimension {
  name: string
  width: number
  height: number
  category: 'social' | 'web' | 'print' | 'video' | 'mobile'
}

interface ResizeStats {
  totalOriginalSize: number
  totalResizedSize: number
  totalSavings: number
  averageSizeReduction: number
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

// Preset dimensions for common use cases
const presetDimensions: PresetDimension[] = [
  // Social Media
  { name: 'Instagram Post', width: 1080, height: 1080, category: 'social' },
  { name: 'Instagram Story', width: 1080, height: 1920, category: 'social' },
  { name: 'Facebook Cover', width: 1200, height: 630, category: 'social' },
  { name: 'Twitter Header', width: 1500, height: 500, category: 'social' },
  { name: 'LinkedIn Banner', width: 1584, height: 396, category: 'social' },

  // Web
  { name: 'Website Banner', width: 1920, height: 600, category: 'web' },
  { name: 'Blog Thumbnail', width: 800, height: 450, category: 'web' },
  { name: 'Avatar/Profile', width: 400, height: 400, category: 'web' },

  // Video
  { name: 'Full HD', width: 1920, height: 1080, category: 'video' },
  { name: 'HD', width: 1280, height: 720, category: 'video' },
  { name: '4K UHD', width: 3840, height: 2160, category: 'video' },

  // Mobile
  { name: 'iPhone 15 Pro', width: 1179, height: 2556, category: 'mobile' },
  { name: 'Android Standard', width: 1080, height: 1920, category: 'mobile' },

  // Print
  { name: 'A4 (300 DPI)', width: 2480, height: 3508, category: 'print' },
  { name: 'Letter (300 DPI)', width: 2550, height: 3300, category: 'print' }
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
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
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
  const resizeImage = useCallback(async (
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
            reject(new Error(`Image dimensions too large. Maximum supported size is ${maxDimension}x${maxDimension} pixels.`))
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
                dimensions: { width: targetWidth, height: targetHeight }
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
  }, [])

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
    backgroundColor: '#ffffff'
  })
  const [dragActive, setDragActive] = useState(false)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { resizeImage } = useImageResize()

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
          status: 'pending'
        })
      } catch (error) {
        toast.error(`${file.name}: Failed to read image dimensions`)
      }
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages])
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

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFiles(files)
    }
  }, [handleFiles])

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files) {
      handleFiles(files)
    }
  }, [handleFiles])

  // Preset dimension handlers
  const applyPreset = useCallback((preset: PresetDimension) => {
    setSettings(prev => ({
      ...prev,
      width: preset.width,
      height: preset.height
    }))
    setSelectedPreset(preset.name)
    toast.success(`Applied preset: ${preset.name}`)
  }, [])

  const resetDimensions = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      width: 800,
      height: 600
    }))
    setSelectedPreset('')
  }, [])

  // Resize logic
  const resizeImages = useCallback(async () => {
    const pendingImages = images.filter(img => img.status === 'pending')
    if (pendingImages.length === 0) {
      toast.error('No images to resize')
      return
    }

    setIsProcessing(true)

    for (const image of pendingImages) {
      try {
        // Update status to processing
        setImages(prev => prev.map(img =>
          img.id === image.id ? { ...img, status: 'processing' } : img
        ))

        const result = await resizeImage(image.file, settings, image.originalDimensions)

        // Update with resized result
        setImages(prev => prev.map(img =>
          img.id === image.id ? {
            ...img,
            status: 'completed',
            resizedUrl: result.url,
            resizedSize: result.size,
            resizedDimensions: result.dimensions
          } : img
        ))
      } catch (error) {
        console.error('Resize failed:', error)
        setImages(prev => prev.map(img =>
          img.id === image.id ? {
            ...img,
            status: 'error',
            error: error instanceof Error ? error.message : 'Resize failed'
          } : img
        ))
      }
    }

    setIsProcessing(false)
    const completedCount = images.filter(img => img.status === 'completed').length
    const message = `Resizing completed! ${completedCount} image${completedCount > 1 ? 's' : ''} processed successfully.`
    toast.success(message)

    // Announce completion to screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 2000)
  }, [images, settings, resizeImage])

  // Utility functions
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id)
      if (imageToRemove) {
        // Clean up URLs
        URL.revokeObjectURL(imageToRemove.originalUrl)
        if (imageToRemove.resizedUrl) {
          URL.revokeObjectURL(imageToRemove.resizedUrl)
        }
      }
      return prev.filter(img => img.id !== id)
    })
  }, [])

  const clearAll = useCallback(() => {
    images.forEach(img => {
      URL.revokeObjectURL(img.originalUrl)
      if (img.resizedUrl) {
        URL.revokeObjectURL(img.resizedUrl)
      }
    })
    setImages([])
    toast.success('All images cleared')
  }, [images])

  const downloadImage = useCallback((image: ImageFile) => {
    if (!image.resizedUrl) return

    const link = document.createElement('a')
    link.href = image.resizedUrl
    const extension = settings.format === 'jpeg' ? 'jpg' : settings.format
    link.download = `resized_${image.file.name.replace(/\.[^/.]+$/, '')}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [settings.format])

  const downloadAll = useCallback(() => {
    const completedImages = images.filter(img => img.status === 'completed' && img.resizedUrl)
    completedImages.forEach(image => downloadImage(image))
  }, [images, downloadImage])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.originalUrl)
        if (img.resizedUrl) {
          URL.revokeObjectURL(img.resizedUrl)
        }
      })
    }
  }, [images])

  // Statistics calculation
  const stats: ResizeStats = {
    totalOriginalSize: images.reduce((sum, img) => sum + img.originalSize, 0),
    totalResizedSize: images.reduce((sum, img) => sum + (img.resizedSize || 0), 0),
    totalSavings: 0,
    averageSizeReduction: 0
  }

  stats.totalSavings = stats.totalOriginalSize - stats.totalResizedSize
  const completedImages = images.filter(img => img.status === 'completed')
  stats.averageSizeReduction = completedImages.length > 0
    ? completedImages.reduce((sum, img) => {
        const reduction = img.resizedSize ? ((img.originalSize - img.resizedSize) / img.originalSize) * 100 : 0
        return sum + reduction
      }, 0) / completedImages.length
    : 0

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className='flex flex-col gap-4'>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
            Image Resize Tool
          </CardTitle>
          <CardDescription>
            Resize images with customizable dimensions and aspect ratio controls. Supports batch processing and multiple output formats.
            Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resize Settings</CardTitle>
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
                    setSettings(prev => ({ ...prev, width: Number(e.target.value) }))
                    setSelectedPreset('')
                  }}
                  className="flex-1"
                  aria-label={`Width: ${settings.width} pixels`}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    maintainAspectRatio: !prev.maintainAspectRatio
                  }))}
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
                    setSettings(prev => ({ ...prev, height: Number(e.target.value) }))
                    setSelectedPreset('')
                  }}
                  className="flex-1"
                  aria-label={`Height: ${settings.height} pixels`}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={resetDimensions}
                  aria-label="Reset dimensions to default"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Preset Dimensions */}
          <div className="space-y-3">
            <Label>Preset Dimensions</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {presetDimensions.slice(0, 8).map((preset) => (
                <Button
                  key={preset.name}
                  variant={selectedPreset === preset.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="text-xs"
                  aria-label={`Apply preset: ${preset.name} (${preset.width}x${preset.height})`}
                >
                  {preset.name}
                  <br />
                  <span className="text-xs opacity-70">{preset.width}×{preset.height}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Resize Mode and Format */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resizeMode">Resize Mode</Label>
              <Select
                value={settings.resizeMode}
                onValueChange={(value: 'exact' | 'fit' | 'fill' | 'stretch') =>
                  setSettings(prev => ({ ...prev, resizeMode: value }))
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
                  setSettings(prev => ({ ...prev, format: value }))
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
                  onChange={(e) => setSettings(prev => ({ ...prev, quality: Number(e.target.value) }))}
                  className="w-full"
                  aria-label={`Image quality: ${settings.quality} percent`}
                />
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
            <p className="text-muted-foreground mb-4">
              Drag and drop your images here, or click to select files
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="mb-2"
            >
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
                <div className="text-2xl font-bold">{formatFileSize(stats.totalResizedSize)}</div>
                <div className="text-sm text-muted-foreground">Resized Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.averageSizeReduction.toFixed(1)}%
                </div>
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
                disabled={isProcessing || images.every(img => img.status !== 'pending')}
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
                disabled={!images.some(img => img.status === 'completed')}
              >
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>

              <Button
                onClick={clearAll}
                variant="destructive"
                disabled={isProcessing}
              >
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
                            onClick={() => setExpandedImage(expandedImage === `${image.id}-original` ? null : `${image.id}-original`)}
                          />
                          <div className="text-xs mt-1 text-muted-foreground">
                            Original
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {image.originalDimensions.width}×{image.originalDimensions.height}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(image.originalSize)}
                          </div>
                        </div>

                        {/* Resized Image */}
                        {image.status === 'completed' && image.resizedUrl && (
                          <div className="text-center">
                            <img
                              src={image.resizedUrl}
                              alt={`Resized ${image.file.name}`}
                              className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setExpandedImage(expandedImage === `${image.id}-resized` ? null : `${image.id}-resized`)}
                            />
                            <div className="text-xs mt-1 text-blue-600">
                              Resized
                            </div>
                            <div className="text-xs text-blue-600">
                              {image.resizedDimensions?.width}×{image.resizedDimensions?.height}
                            </div>
                            <div className="text-xs text-blue-600">
                              {formatFileSize(image.resizedSize || 0)}
                            </div>
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
                          <span className="font-medium">Original:</span> {image.originalDimensions.width}×{image.originalDimensions.height} • {formatFileSize(image.originalSize)}
                        </div>
                        {image.status === 'completed' && image.resizedDimensions && image.resizedSize && (
                          <>
                            <div className="text-blue-600">
                              <span className="font-medium">Resized:</span> {image.resizedDimensions.width}×{image.resizedDimensions.height} • {formatFileSize(image.resizedSize)}
                            </div>
                            <div className="text-blue-600 font-medium">
                              Size change: {((image.resizedSize - image.originalSize) / image.originalSize * 100).toFixed(1)}%
                              {image.resizedSize !== image.originalSize && (
                                <span> ({image.resizedSize > image.originalSize ? '+' : ''}{formatFileSize(image.resizedSize - image.originalSize)})</span>
                              )}
                            </div>
                          </>
                        )}
                        {image.status === 'pending' && (
                          <div className="text-blue-600">Ready for resizing</div>
                        )}
                        {image.status === 'processing' && (
                          <div className="text-blue-600">Processing...</div>
                        )}
                        {image.error && (
                          <div className="text-red-600">Error: {image.error}</div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {image.status === 'completed' && image.resizedUrl && (
                        <Button
                          size="sm"
                          onClick={() => downloadImage(image)}
                          aria-label={`Download resized ${image.file.name}`}
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

                  {expandedImage === `${image.id}-resized` && image.resizedUrl && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <h5 className="font-medium mb-2">Resized Image</h5>
                      <img
                        src={image.resizedUrl}
                        alt={`Resized ${image.file.name}`}
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
const ImageResize = () => {
  return (
    <ImageResizeErrorBoundary>
      <ImageResizeCore />
    </ImageResizeErrorBoundary>
  )
}

export default ImageResize
