import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, Download, Image as ImageIcon, Loader2, FileImage, Trash2, Crop, Move, Maximize2 } from 'lucide-react'

// Types
interface ImageFile {
  id: string
  file: File
  originalUrl: string
  croppedUrl?: string
  originalSize: number
  croppedSize?: number
  originalDimensions: { width: number; height: number }
  cropArea: CropArea
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface CropSettings {
  aspectRatio: 'free' | '1:1' | '16:9' | '4:3' | '3:2' | '2:3' | '9:16' | 'custom'
  customAspectRatio?: { width: number; height: number }
  outputFormat: 'png' | 'jpeg' | 'webp'
  quality: number
  maintainOriginalSize: boolean
  cropPosition: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom'
}

interface AspectRatioPreset {
  name: string
  value: string
  ratio: number
  description: string
}

interface CropStats {
  totalOriginalSize: number
  totalCroppedSize: number
  totalSavings: number
  averageSizeReduction: number
  averageCropPercentage: number
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
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Unsupported file format. Please use JPEG, PNG, WebP, GIF, or BMP.' }
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large. Maximum size is 100MB.' }
  }

  return { isValid: true }
}

// Aspect ratio presets
const aspectRatioPresets: AspectRatioPreset[] = [
  { name: 'Free', value: 'free', ratio: 0, description: 'Any aspect ratio' },
  { name: 'Square', value: '1:1', ratio: 1, description: 'Perfect for avatars and social media' },
  { name: 'Landscape', value: '16:9', ratio: 16 / 9, description: 'Widescreen format' },
  { name: 'Standard', value: '4:3', ratio: 4 / 3, description: 'Traditional photo format' },
  { name: 'Photo', value: '3:2', ratio: 3 / 2, description: 'Classic 35mm film ratio' },
  { name: 'Portrait', value: '2:3', ratio: 2 / 3, description: 'Vertical photo format' },
  { name: 'Story', value: '9:16', ratio: 9 / 16, description: 'Mobile story format' },
  { name: 'Custom', value: 'custom', ratio: 0, description: 'Define your own ratio' },
]

// Helper functions
const calculateCropArea = (
  imageDimensions: { width: number; height: number },
  aspectRatio: number,
  position: CropSettings['cropPosition']
): CropArea => {
  const { width: imgWidth, height: imgHeight } = imageDimensions

  if (aspectRatio === 0) {
    // Free aspect ratio - use 80% of image
    const cropWidth = Math.floor(imgWidth * 0.8)
    const cropHeight = Math.floor(imgHeight * 0.8)
    const x = Math.floor((imgWidth - cropWidth) / 2)
    const y = Math.floor((imgHeight - cropHeight) / 2)
    return { x, y, width: cropWidth, height: cropHeight }
  }

  // Calculate crop dimensions based on aspect ratio
  let cropWidth: number
  let cropHeight: number

  if (imgWidth / imgHeight > aspectRatio) {
    // Image is wider than target ratio
    cropHeight = imgHeight
    cropWidth = Math.floor(cropHeight * aspectRatio)
  } else {
    // Image is taller than target ratio
    cropWidth = imgWidth
    cropHeight = Math.floor(cropWidth / aspectRatio)
  }

  // Calculate position
  let x: number
  let y: number

  switch (position) {
    case 'center':
      x = Math.floor((imgWidth - cropWidth) / 2)
      y = Math.floor((imgHeight - cropHeight) / 2)
      break
    case 'top-left':
      x = 0
      y = 0
      break
    case 'top-right':
      x = imgWidth - cropWidth
      y = 0
      break
    case 'bottom-left':
      x = 0
      y = imgHeight - cropHeight
      break
    case 'bottom-right':
      x = imgWidth - cropWidth
      y = imgHeight - cropHeight
      break
    default:
      x = Math.floor((imgWidth - cropWidth) / 2)
      y = Math.floor((imgHeight - cropHeight) / 2)
  }

  return { x, y, width: cropWidth, height: cropHeight }
}

// Error boundary component
class ImageCropErrorBoundary extends React.Component<
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
    console.error('Image crop error:', error, errorInfo)
    toast.error('An unexpected error occurred during image cropping')
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
const useImageCrop = () => {
  const cropImage = useCallback(
    async (
      file: File,
      cropArea: CropArea,
      settings: CropSettings,
      originalDimensions: { width: number; height: number }
    ): Promise<{ blob: Blob; url: string; size: number }> => {
      return new Promise((resolve, reject) => {
        // Validate file size before processing
        const maxProcessingSize = 150 * 1024 * 1024 // 150MB
        if (file.size > maxProcessingSize) {
          reject(new Error('Image too large for processing. Please use an image smaller than 150MB.'))
          return
        }

        // Validate crop area
        if (cropArea.width <= 0 || cropArea.height <= 0) {
          reject(new Error('Invalid crop area. Width and height must be greater than 0.'))
          return
        }

        if (
          cropArea.x < 0 ||
          cropArea.y < 0 ||
          cropArea.x + cropArea.width > originalDimensions.width ||
          cropArea.y + cropArea.height > originalDimensions.height
        ) {
          reject(new Error('Crop area is outside image boundaries.'))
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
            const ctx = canvas.getContext('2d', { alpha: settings.outputFormat === 'png' })

            if (!ctx) {
              cleanup()
              reject(new Error('Failed to get canvas context. Your browser may not support this feature.'))
              return
            }

            // Set canvas dimensions
            canvas.width = cropArea.width
            canvas.height = cropArea.height

            // Configure canvas for better quality
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'

            // Handle background for formats that don't support transparency
            if (settings.outputFormat !== 'png') {
              ctx.fillStyle = '#ffffff'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
            }

            // Draw cropped image with error handling
            try {
              ctx.drawImage(
                img,
                cropArea.x,
                cropArea.y,
                cropArea.width,
                cropArea.height,
                0,
                0,
                cropArea.width,
                cropArea.height
              )
            } catch (drawError) {
              cleanup()
              reject(new Error('Failed to draw image to canvas. The image may be corrupted.'))
              return
            }

            // Convert to blob with format-specific options
            const mimeType = `image/${settings.outputFormat}`
            const quality =
              settings.outputFormat === 'png' ? undefined : Math.max(0.1, Math.min(1, settings.quality / 100))

            canvas.toBlob(
              (blob) => {
                cleanup()

                if (!blob) {
                  reject(new Error('Failed to crop image. Please try a different format or settings.'))
                  return
                }

                // Validate output size
                if (blob.size === 0) {
                  reject(new Error('Cropping resulted in empty file. Please try different settings.'))
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
            reject(error instanceof Error ? error : new Error('Unknown crop error'))
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

  return { cropImage }
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
 * Enhanced Image Crop Tool
 * Features: Batch processing, interactive crop selection, aspect ratio presets, drag-and-drop, progress tracking
 */
const ImageCropCore = () => {
  const [images, setImages] = useState<ImageFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<CropSettings>({
    aspectRatio: 'free',
    outputFormat: 'png',
    quality: 90,
    maintainOriginalSize: true,
    cropPosition: 'center',
  })
  const [dragActive, setDragActive] = useState(false)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { cropImage } = useImageCrop()

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
          const dimensions = await getImageDimensions(file)
          const id = generateId()
          const originalUrl = URL.createObjectURL(file)

          // Calculate initial crop area based on current settings
          const aspectRatio =
            settings.aspectRatio === 'free'
              ? 0
              : settings.aspectRatio === 'custom' && settings.customAspectRatio
                ? settings.customAspectRatio.width / settings.customAspectRatio.height
                : aspectRatioPresets.find((p) => p.value === settings.aspectRatio)?.ratio || 0

          const cropArea = calculateCropArea(dimensions, aspectRatio, settings.cropPosition)

          newImages.push({
            id,
            file,
            originalUrl,
            originalSize: file.size,
            originalDimensions: dimensions,
            cropArea,
            status: 'pending',
          })
        } catch (error) {
          toast.error(`${file.name}: Failed to read image dimensions`)
        }
      }

      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages])
        const message = `Added ${newImages.length} image${newImages.length > 1 ? 's' : ''} for cropping`
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
    [settings]
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

  // Aspect ratio and crop area handlers
  const updateAspectRatio = useCallback(
    (newAspectRatio: CropSettings['aspectRatio']) => {
      setSettings((prev) => ({ ...prev, aspectRatio: newAspectRatio }))

      // Update crop areas for all images
      setImages((prev) =>
        prev.map((image) => {
          const aspectRatio =
            newAspectRatio === 'free'
              ? 0
              : newAspectRatio === 'custom' && settings.customAspectRatio
                ? settings.customAspectRatio.width / settings.customAspectRatio.height
                : aspectRatioPresets.find((p) => p.value === newAspectRatio)?.ratio || 0

          const newCropArea = calculateCropArea(image.originalDimensions, aspectRatio, settings.cropPosition)
          return { ...image, cropArea: newCropArea }
        })
      )
    },
    [settings.customAspectRatio, settings.cropPosition]
  )

  const updateCropPosition = useCallback(
    (newPosition: CropSettings['cropPosition']) => {
      setSettings((prev) => ({ ...prev, cropPosition: newPosition }))

      // Update crop areas for all images
      setImages((prev) =>
        prev.map((image) => {
          const aspectRatio =
            settings.aspectRatio === 'free'
              ? 0
              : settings.aspectRatio === 'custom' && settings.customAspectRatio
                ? settings.customAspectRatio.width / settings.customAspectRatio.height
                : aspectRatioPresets.find((p) => p.value === settings.aspectRatio)?.ratio || 0

          const newCropArea = calculateCropArea(image.originalDimensions, aspectRatio, newPosition)
          return { ...image, cropArea: newCropArea }
        })
      )
    },
    [settings.aspectRatio, settings.customAspectRatio]
  )

  // Manual crop area adjustment
  const updateImageCropArea = useCallback((imageId: string, newCropArea: Partial<CropArea>) => {
    setImages((prev) =>
      prev.map((image) => {
        if (image.id === imageId) {
          const updatedCropArea = { ...image.cropArea, ...newCropArea }

          // Validate crop area bounds
          const maxX = image.originalDimensions.width - updatedCropArea.width
          const maxY = image.originalDimensions.height - updatedCropArea.height

          updatedCropArea.x = Math.max(0, Math.min(maxX, updatedCropArea.x))
          updatedCropArea.y = Math.max(0, Math.min(maxY, updatedCropArea.y))
          updatedCropArea.width = Math.max(
            1,
            Math.min(image.originalDimensions.width - updatedCropArea.x, updatedCropArea.width)
          )
          updatedCropArea.height = Math.max(
            1,
            Math.min(image.originalDimensions.height - updatedCropArea.y, updatedCropArea.height)
          )

          return { ...image, cropArea: updatedCropArea }
        }
        return image
      })
    )
  }, [])

  // Crop logic
  const cropImages = useCallback(async () => {
    const pendingImages = images.filter((img) => img.status === 'pending')
    if (pendingImages.length === 0) {
      toast.error('No images to crop')
      return
    }

    setIsProcessing(true)

    for (const image of pendingImages) {
      try {
        // Update status to processing
        setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, status: 'processing' } : img)))

        const result = await cropImage(image.file, image.cropArea, settings, image.originalDimensions)

        // Update with cropped result
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'completed',
                  croppedUrl: result.url,
                  croppedSize: result.size,
                }
              : img
          )
        )
      } catch (error) {
        console.error('Crop failed:', error)
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Crop failed',
                }
              : img
          )
        )
      }
    }

    setIsProcessing(false)
    const completedCount = images.filter((img) => img.status === 'completed').length
    const message = `Cropping completed! ${completedCount} image${completedCount > 1 ? 's' : ''} processed successfully.`
    toast.success(message)

    // Announce completion to screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 2000)
  }, [images, settings, cropImage])

  // Utility functions
  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id)
      if (imageToRemove) {
        // Clean up URLs
        URL.revokeObjectURL(imageToRemove.originalUrl)
        if (imageToRemove.croppedUrl) {
          URL.revokeObjectURL(imageToRemove.croppedUrl)
        }
      }
      return prev.filter((img) => img.id !== id)
    })
  }, [])

  const clearAll = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl)
      if (img.croppedUrl) {
        URL.revokeObjectURL(img.croppedUrl)
      }
    })
    setImages([])
    toast.success('All images cleared')
  }, [images])

  const downloadImage = useCallback(
    (image: ImageFile) => {
      if (!image.croppedUrl) return

      const link = document.createElement('a')
      link.href = image.croppedUrl
      const extension = settings.outputFormat === 'jpeg' ? 'jpg' : settings.outputFormat
      link.download = `cropped_${image.file.name.replace(/\.[^/.]+$/, '')}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    [settings.outputFormat]
  )

  const downloadAll = useCallback(() => {
    const completedImages = images.filter((img) => img.status === 'completed' && img.croppedUrl)
    completedImages.forEach((image) => downloadImage(image))
  }, [images, downloadImage])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      images.forEach((img) => {
        URL.revokeObjectURL(img.originalUrl)
        if (img.croppedUrl) {
          URL.revokeObjectURL(img.croppedUrl)
        }
      })
    }
  }, [images])

  // Statistics calculation
  const stats: CropStats = {
    totalOriginalSize: images.reduce((sum, img) => sum + img.originalSize, 0),
    totalCroppedSize: images.reduce((sum, img) => sum + (img.croppedSize || 0), 0),
    totalSavings: 0,
    averageSizeReduction: 0,
    averageCropPercentage: 0,
  }

  stats.totalSavings = stats.totalOriginalSize - stats.totalCroppedSize
  const completedImages = images.filter((img) => img.status === 'completed')
  stats.averageSizeReduction =
    completedImages.length > 0
      ? completedImages.reduce((sum, img) => {
          const reduction = img.croppedSize ? ((img.originalSize - img.croppedSize) / img.originalSize) * 100 : 0
          return sum + reduction
        }, 0) / completedImages.length
      : 0

  stats.averageCropPercentage =
    images.length > 0
      ? images.reduce((sum, img) => {
          const originalArea = img.originalDimensions.width * img.originalDimensions.height
          const cropArea = img.cropArea.width * img.cropArea.height
          return sum + (cropArea / originalArea) * 100
        }, 0) / images.length
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

      <div id="main-content" className="flex flex-col gap-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" aria-hidden="true" />
              Image Crop Tool
            </CardTitle>
            <CardDescription>
              Crop images with customizable aspect ratios and precise positioning controls. Supports batch processing
              and multiple output formats. Use keyboard navigation: Tab to move between controls, Enter or Space to
              activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crop className="h-5 w-5" />
              Crop Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Aspect Ratio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                <Select
                  value={settings.aspectRatio}
                  onValueChange={(value: CropSettings['aspectRatio']) => updateAspectRatio(value)}
                >
                  <SelectTrigger id="aspectRatio" aria-label="Select aspect ratio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatioPresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        <div className="flex flex-col">
                          <span>{preset.name}</span>
                          <span className="text-xs text-muted-foreground">{preset.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Aspect Ratio */}
              {settings.aspectRatio === 'custom' && (
                <div className="space-y-2">
                  <Label>Custom Ratio</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Width"
                      value={settings.customAspectRatio?.width || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          customAspectRatio: {
                            ...prev.customAspectRatio,
                            width: Number(e.target.value) || 1,
                            height: prev.customAspectRatio?.height || 1,
                          },
                        }))
                      }
                      className="flex-1"
                    />
                    <span>:</span>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Height"
                      value={settings.customAspectRatio?.height || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          customAspectRatio: {
                            width: prev.customAspectRatio?.width || 1,
                            height: Number(e.target.value) || 1,
                          },
                        }))
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              {/* Crop Position */}
              <div className="space-y-2">
                <Label htmlFor="cropPosition">Crop Position</Label>
                <Select
                  value={settings.cropPosition}
                  onValueChange={(value: CropSettings['cropPosition']) => updateCropPosition(value)}
                >
                  <SelectTrigger id="cropPosition" aria-label="Select crop position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Output Format and Quality */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outputFormat">Output Format</Label>
                <Select
                  value={settings.outputFormat}
                  onValueChange={(value: CropSettings['outputFormat']) =>
                    setSettings((prev) => ({ ...prev, outputFormat: value }))
                  }
                >
                  <SelectTrigger id="outputFormat" aria-label="Select output format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG (Lossless)</SelectItem>
                    <SelectItem value="jpeg">JPEG (Smaller size)</SelectItem>
                    <SelectItem value="webp">WebP (Modern format)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.outputFormat !== 'png' && (
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

              <div className="space-y-2">
                <Label>Quick Actions</Label>
                <Button size="sm" variant="outline" onClick={() => updateAspectRatio('1:1')} className="w-full">
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Square Crop
                </Button>
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
              <p className="text-muted-foreground mb-4">Drag and drop your images here, or click to select files</p>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                <FileImage className="mr-2 h-4 w-4" />
                Choose Files
              </Button>
              <p className="text-xs text-muted-foreground">Supports JPEG, PNG, WebP, GIF, BMP • Max 100MB per file</p>
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
                  <div className="text-2xl font-bold">{formatFileSize(stats.totalCroppedSize)}</div>
                  <div className="text-sm text-muted-foreground">Cropped Size</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.averageCropPercentage.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Avg. Crop Area</div>
                </div>
              </div>
              {Math.abs(stats.totalSavings) > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-center">
                    <span className="text-green-700 dark:text-green-400 font-semibold">
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
                  onClick={cropImages}
                  disabled={isProcessing || images.every((img) => img.status !== 'pending')}
                  className="min-w-32"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cropping...
                    </>
                  ) : (
                    'Crop Images'
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
                            <div className="relative">
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
                              {/* Crop overlay indicator */}
                              <div className="absolute inset-0 border-2 border-dashed border-blue-400 opacity-50 rounded"></div>
                            </div>
                            <div className="text-xs mt-1 text-muted-foreground">Original</div>
                            <div className="text-xs text-muted-foreground">
                              {image.originalDimensions.width}×{image.originalDimensions.height}
                            </div>
                            <div className="text-xs text-muted-foreground">{formatFileSize(image.originalSize)}</div>
                          </div>

                          {/* Cropped Image */}
                          {image.status === 'completed' && image.croppedUrl && (
                            <div className="text-center">
                              <img
                                src={image.croppedUrl}
                                alt={`Cropped ${image.file.name}`}
                                className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() =>
                                  setExpandedImage(
                                    expandedImage === `${image.id}-cropped` ? null : `${image.id}-cropped`
                                  )
                                }
                              />
                              <div className="text-xs mt-1 text-green-600">Cropped</div>
                              <div className="text-xs text-green-600">
                                {image.cropArea.width}×{image.cropArea.height}
                              </div>
                              <div className="text-xs text-green-600">{formatFileSize(image.croppedSize || 0)}</div>
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

                      {/* Image Info and Crop Controls */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate" title={image.file.name}>
                          {image.file.name}
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            <span className="font-medium">Original:</span> {image.originalDimensions.width}×
                            {image.originalDimensions.height} • {formatFileSize(image.originalSize)}
                          </div>
                          <div>
                            <span className="font-medium">Crop Area:</span> {image.cropArea.width}×
                            {image.cropArea.height} at ({image.cropArea.x}, {image.cropArea.y})
                          </div>
                          {image.status === 'completed' && image.croppedSize && (
                            <>
                              <div className="text-green-600">
                                <span className="font-medium">Cropped:</span> {formatFileSize(image.croppedSize)}
                              </div>
                              <div className="text-green-600 font-medium">
                                Size change:{' '}
                                {(((image.croppedSize - image.originalSize) / image.originalSize) * 100).toFixed(1)}%
                                {image.croppedSize !== image.originalSize && (
                                  <span>
                                    {' '}
                                    ({image.croppedSize > image.originalSize ? '+' : ''}
                                    {formatFileSize(image.croppedSize - image.originalSize)})
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                          {image.status === 'pending' && <div className="text-blue-600">Ready for cropping</div>}
                          {image.status === 'processing' && <div className="text-blue-600">Cropping...</div>}
                          {image.error && <div className="text-red-600">Error: {image.error}</div>}
                        </div>

                        {/* Manual Crop Controls */}
                        {selectedImageForCrop === image.id && (
                          <div className="mt-3 p-3 border rounded bg-muted/30">
                            <h5 className="font-medium mb-2 flex items-center gap-2">
                              <Move className="h-4 w-4" />
                              Manual Crop Adjustment
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>
                                <Label htmlFor={`x-${image.id}`} className="text-xs">
                                  X Position
                                </Label>
                                <Input
                                  id={`x-${image.id}`}
                                  type="number"
                                  min="0"
                                  max={image.originalDimensions.width - image.cropArea.width}
                                  value={image.cropArea.x}
                                  onChange={(e) => updateImageCropArea(image.id, { x: Number(e.target.value) })}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`y-${image.id}`} className="text-xs">
                                  Y Position
                                </Label>
                                <Input
                                  id={`y-${image.id}`}
                                  type="number"
                                  min="0"
                                  max={image.originalDimensions.height - image.cropArea.height}
                                  value={image.cropArea.y}
                                  onChange={(e) => updateImageCropArea(image.id, { y: Number(e.target.value) })}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`width-${image.id}`} className="text-xs">
                                  Width
                                </Label>
                                <Input
                                  id={`width-${image.id}`}
                                  type="number"
                                  min="1"
                                  max={image.originalDimensions.width - image.cropArea.x}
                                  value={image.cropArea.width}
                                  onChange={(e) => updateImageCropArea(image.id, { width: Number(e.target.value) })}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`height-${image.id}`} className="text-xs">
                                  Height
                                </Label>
                                <Input
                                  id={`height-${image.id}`}
                                  type="number"
                                  min="1"
                                  max={image.originalDimensions.height - image.cropArea.y}
                                  value={image.cropArea.height}
                                  onChange={(e) => updateImageCropArea(image.id, { height: Number(e.target.value) })}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedImageForCrop(selectedImageForCrop === image.id ? null : image.id)}
                          aria-label={`${selectedImageForCrop === image.id ? 'Hide' : 'Show'} crop controls for ${image.file.name}`}
                        >
                          <Move className="h-4 w-4" />
                        </Button>

                        {image.status === 'completed' && image.croppedUrl && (
                          <Button
                            size="sm"
                            onClick={() => downloadImage(image)}
                            aria-label={`Download cropped ${image.file.name}`}
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

                    {expandedImage === `${image.id}-cropped` && image.croppedUrl && (
                      <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                        <h5 className="font-medium mb-2">Cropped Image</h5>
                        <img
                          src={image.croppedUrl}
                          alt={`Cropped ${image.file.name}`}
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
const ImageCrop = () => {
  return (
    <ImageCropErrorBoundary>
      <ImageCropCore />
    </ImageCropErrorBoundary>
  )
}

export default ImageCrop
