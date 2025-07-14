import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'


import { toast } from 'sonner'
import { Upload, Download, Image as ImageIcon, Loader2, FileImage, Trash2 } from 'lucide-react'

// Types
interface ImageFile {
  id: string
  file: File
  originalUrl: string
  compressedUrl?: string
  originalSize: number
  compressedSize?: number
  compressionRatio?: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

interface CompressionSettings {
  quality: number
  format: 'jpeg' | 'png' | 'webp'
  maxWidth?: number
  maxHeight?: number
  maintainAspectRatio: boolean
  enableProgressive: boolean
  removeMetadata: boolean
}

interface CompressionStats {
  totalOriginalSize: number
  totalCompressedSize: number
  totalSavings: number
  averageCompressionRatio: number
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
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Unsupported file format. Please use JPEG, PNG, WebP, GIF, or BMP.' }
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large. Maximum size is 50MB.' }
  }

  return { isValid: true }
}

// Error boundary component
class ImageCompressionErrorBoundary extends React.Component<
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
    console.error('Image compression error:', error, errorInfo)
    toast.error('An unexpected error occurred during image compression')
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
const useImageCompression = () => {
  const compressImage = useCallback(async (
    file: File,
    settings: CompressionSettings
  ): Promise<{ blob: Blob; url: string; size: number }> => {
    return new Promise((resolve, reject) => {
      // Validate file size before processing
      const maxProcessingSize = 100 * 1024 * 1024 // 100MB
      if (file.size > maxProcessingSize) {
        reject(new Error('Image too large for processing. Please use an image smaller than 100MB.'))
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
          const maxDimension = 8192 // Maximum safe canvas dimension
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

          // Calculate dimensions with better aspect ratio handling
          let { width, height } = img
          const originalAspectRatio = width / height

          if (settings.maxWidth && width > settings.maxWidth) {
            width = settings.maxWidth
            if (settings.maintainAspectRatio) {
              height = width / originalAspectRatio
            }
          }

          if (settings.maxHeight && height > settings.maxHeight) {
            height = settings.maxHeight
            if (settings.maintainAspectRatio) {
              width = height * originalAspectRatio
            }
          }

          // Ensure dimensions are integers and within bounds
          width = Math.max(1, Math.min(maxDimension, Math.round(width)))
          height = Math.max(1, Math.min(maxDimension, Math.round(height)))

          canvas.width = width
          canvas.height = height

          // Configure canvas for better quality
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // For PNG with transparency, ensure proper alpha handling
          if (settings.format === 'png') {
            ctx.globalCompositeOperation = 'source-over'
          }

          // Draw image with error handling
          try {
            ctx.drawImage(img, 0, 0, width, height)
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
                reject(new Error('Failed to compress image. Please try a different format or quality setting.'))
                return
              }

              // Validate output size
              if (blob.size === 0) {
                reject(new Error('Compression resulted in empty file. Please try different settings.'))
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
          reject(error instanceof Error ? error : new Error('Unknown compression error'))
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

  return { compressImage }
}

/**
 * Enhanced Image Compression Tool
 * Features: Batch processing, quality controls, multiple formats, drag-and-drop, progress tracking
 */
const ImageCompressCore = () => {
  const [images, setImages] = useState<ImageFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 80,
    format: 'jpeg',
    maintainAspectRatio: true,
    enableProgressive: false,
    removeMetadata: true
  })
  const [dragActive, setDragActive] = useState(false)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { compressImage } = useImageCompression()

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

      const id = generateId()
      const originalUrl = URL.createObjectURL(file)

      newImages.push({
        id,
        file,
        originalUrl,
        originalSize: file.size,
        status: 'pending'
      })
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages])
      const message = `Added ${newImages.length} image${newImages.length > 1 ? 's' : ''} for compression`
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

  // Compression logic
  const compressImages = useCallback(async () => {
    const pendingImages = images.filter(img => img.status === 'pending')
    if (pendingImages.length === 0) {
      toast.error('No images to compress')
      return
    }

    setIsProcessing(true)

    for (const image of pendingImages) {
      try {
        // Update status to processing
        setImages(prev => prev.map(img =>
          img.id === image.id ? { ...img, status: 'processing' } : img
        ))

        const result = await compressImage(image.file, settings)

        // Update with compressed result
        setImages(prev => prev.map(img =>
          img.id === image.id ? {
            ...img,
            status: 'completed',
            compressedUrl: result.url,
            compressedSize: result.size,
            compressionRatio: ((image.originalSize - result.size) / image.originalSize) * 100
          } : img
        ))
      } catch (error) {
        console.error('Compression failed:', error)
        setImages(prev => prev.map(img =>
          img.id === image.id ? {
            ...img,
            status: 'error',
            error: error instanceof Error ? error.message : 'Compression failed'
          } : img
        ))
      }
    }

    setIsProcessing(false)
    const completedCount = images.filter(img => img.status === 'completed').length
    const message = `Compression completed! ${completedCount} image${completedCount > 1 ? 's' : ''} processed successfully.`
    toast.success(message)

    // Announce completion to screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 2000)
  }, [images, settings, compressImage])

  // Utility functions
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id)
      if (imageToRemove) {
        // Clean up URLs
        URL.revokeObjectURL(imageToRemove.originalUrl)
        if (imageToRemove.compressedUrl) {
          URL.revokeObjectURL(imageToRemove.compressedUrl)
        }
      }
      return prev.filter(img => img.id !== id)
    })
  }, [])

  const clearAll = useCallback(() => {
    images.forEach(img => {
      URL.revokeObjectURL(img.originalUrl)
      if (img.compressedUrl) {
        URL.revokeObjectURL(img.compressedUrl)
      }
    })
    setImages([])
    toast.success('All images cleared')
  }, [images])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.originalUrl)
        if (img.compressedUrl) {
          URL.revokeObjectURL(img.compressedUrl)
        }
      })
    }
  }, [images])

  const downloadImage = useCallback((image: ImageFile) => {
    if (!image.compressedUrl) return

    const link = document.createElement('a')
    link.href = image.compressedUrl
    link.download = `compressed_${image.file.name.replace(/\.[^/.]+$/, '')}.${settings.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [settings.format])

  const downloadAll = useCallback(() => {
    const completedImages = images.filter(img => img.status === 'completed' && img.compressedUrl)
    completedImages.forEach(image => downloadImage(image))
  }, [images, downloadImage])

  // Statistics calculation
  const stats: CompressionStats = {
    totalOriginalSize: images.reduce((sum, img) => sum + img.originalSize, 0),
    totalCompressedSize: images.reduce((sum, img) => sum + (img.compressedSize || 0), 0),
    totalSavings: 0,
    averageCompressionRatio: 0
  }

  stats.totalSavings = stats.totalOriginalSize - stats.totalCompressedSize
  const completedImages = images.filter(img => img.status === 'completed')
  stats.averageCompressionRatio = completedImages.length > 0
    ? completedImages.reduce((sum, img) => sum + (img.compressionRatio || 0), 0) / completedImages.length
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
            Image Compression Tool
          </CardTitle>
          <CardDescription>
            Compress images with customizable quality settings. Supports JPEG, PNG, WebP, GIF, and BMP formats.
            Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compression Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quality Slider */}
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
                aria-label={`Compression quality: ${settings.quality} percent`}
              />
              <div className="text-xs text-muted-foreground">
                Higher quality = larger file size
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label htmlFor="format">Output Format</Label>
              <Select
                value={settings.format}
                onValueChange={(value: 'jpeg' | 'png' | 'webp') =>
                  setSettings(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger id="format" aria-label="Select output format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPEG (Best compression)</SelectItem>
                  <SelectItem value="png">PNG (Lossless)</SelectItem>
                  <SelectItem value="webp">WebP (Modern format)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max Dimensions */}
            <div className="space-y-2">
              <Label>Max Dimensions (optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Width"
                  value={settings.maxWidth || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    maxWidth: e.target.value ? Number(e.target.value) : undefined
                  }))}
                  className="w-full"
                  aria-label="Maximum width in pixels"
                />
                <Input
                  type="number"
                  placeholder="Height"
                  value={settings.maxHeight || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    maxHeight: e.target.value ? Number(e.target.value) : undefined
                  }))}
                  className="w-full"
                  aria-label="Maximum height in pixels"
                />
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm">Advanced Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  id="removeMetadata"
                  type="checkbox"
                  checked={settings.removeMetadata}
                  onChange={(e) => setSettings(prev => ({ ...prev, removeMetadata: e.target.checked }))}
                  className="rounded border-input"
                />
                <Label htmlFor="removeMetadata" className="text-sm">
                  Remove metadata (EXIF, etc.)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="maintainAspectRatio"
                  type="checkbox"
                  checked={settings.maintainAspectRatio}
                  onChange={(e) => setSettings(prev => ({ ...prev, maintainAspectRatio: e.target.checked }))}
                  className="rounded border-input"
                />
                <Label htmlFor="maintainAspectRatio" className="text-sm">
                  Maintain aspect ratio
                </Label>
              </div>
            </div>
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
              Supports JPEG, PNG, WebP, GIF, BMP • Max 50MB per file
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
                <div className="text-2xl font-bold">{formatFileSize(stats.totalCompressedSize)}</div>
                <div className="text-sm text-muted-foreground">Compressed Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.averageCompressionRatio.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg. Reduction</div>
              </div>
            </div>
            {stats.totalSavings > 0 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-center">
                  <span className="text-green-700 dark:text-green-400 font-semibold">
                    Total savings: {formatFileSize(stats.totalSavings)}
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
                onClick={compressImages}
                disabled={isProcessing || images.every(img => img.status !== 'pending')}
                className="min-w-32"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Compress Images'
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
                            {formatFileSize(image.originalSize)}
                          </div>
                        </div>

                        {/* Compressed Image */}
                        {image.status === 'completed' && image.compressedUrl && (
                          <div className="text-center">
                            <img
                              src={image.compressedUrl}
                              alt={`Compressed ${image.file.name}`}
                              className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setExpandedImage(expandedImage === `${image.id}-compressed` ? null : `${image.id}-compressed`)}
                            />
                            <div className="text-xs mt-1 text-green-600">
                              Compressed
                            </div>
                            <div className="text-xs text-green-600">
                              {formatFileSize(image.compressedSize || 0)}
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
                          <span className="font-medium">Original:</span> {formatFileSize(image.originalSize)}
                        </div>
                        {image.status === 'completed' && image.compressedSize && (
                          <>
                            <div className="text-green-600">
                              <span className="font-medium">Compressed:</span> {formatFileSize(image.compressedSize)}
                            </div>
                            <div className="text-green-600 font-medium">
                              Reduction: {image.compressionRatio?.toFixed(1)}%
                              (saved {formatFileSize(image.originalSize - image.compressedSize)})
                            </div>
                          </>
                        )}
                        {image.status === 'pending' && (
                          <div className="text-blue-600">Ready for compression</div>
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
                      {image.status === 'completed' && image.compressedUrl && (
                        <Button
                          size="sm"
                          onClick={() => downloadImage(image)}
                          aria-label={`Download compressed ${image.file.name}`}
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

                  {expandedImage === `${image.id}-compressed` && image.compressedUrl && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <h5 className="font-medium mb-2">Compressed Image</h5>
                      <img
                        src={image.compressedUrl}
                        alt={`Compressed ${image.file.name}`}
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
const ImageCompress = () => {
  return (
    <ImageCompressionErrorBoundary>
      <ImageCompressCore />
    </ImageCompressionErrorBoundary>
  )
}

export default ImageCompress
