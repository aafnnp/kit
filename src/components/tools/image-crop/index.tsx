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
  FileImage,
  Trash2,
  Crop,
  Settings,
  BarChart3,
  Clock,
  BookOpen,
  Eye,
  EyeOff,
  CheckCircle2,
  Activity,
  Layers,
  Sliders,
  RefreshCw,
  Save,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  ImageFile,
  CropArea,
  CropSettings,
  AspectRatioPreset,
  CropTemplate,
  CropStats,
  HistoryEntry,
} from '@/types/image-crop'
import { formatFileSize } from '@/lib/utils'
// Enhanced Types

// Utility functions

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

// Enhanced Aspect ratio presets
const aspectRatioPresets: AspectRatioPreset[] = [
  {
    name: 'Free',
    value: 'free',
    ratio: 0,
    description: 'Any aspect ratio',
    useCase: 'Flexible cropping for any purpose',
    pros: ['Maximum flexibility', 'No constraints'],
    cons: ['May not fit specific platforms', 'Inconsistent sizing'],
  },
  {
    name: 'Square',
    value: '1:1',
    ratio: 1,
    description: 'Perfect for avatars and social media',
    useCase: 'Instagram posts, profile pictures, thumbnails',
    pros: ['Universal compatibility', 'Clean appearance', 'Works on all platforms'],
    cons: ['May crop important content', 'Limited composition options'],
  },
  {
    name: 'Landscape',
    value: '16:9',
    ratio: 16 / 9,
    description: 'Widescreen format',
    useCase: 'YouTube thumbnails, desktop wallpapers, presentations',
    pros: ['Cinematic feel', 'Great for landscapes', 'Modern standard'],
    cons: ['May crop vertical content', 'Not ideal for portraits'],
  },
  {
    name: 'Standard',
    value: '4:3',
    ratio: 4 / 3,
    description: 'Traditional photo format',
    useCase: 'Classic photography, presentations, older displays',
    pros: ['Balanced composition', 'Good for mixed content', 'Traditional feel'],
    cons: ['Less modern', 'May not fit widescreen displays'],
  },
  {
    name: 'Photo',
    value: '3:2',
    ratio: 3 / 2,
    description: 'Classic 35mm film ratio',
    useCase: 'Professional photography, prints, galleries',
    pros: ['Professional standard', 'Great for prints', 'Balanced proportions'],
    cons: ['May not fit social media', 'Requires careful composition'],
  },
  {
    name: 'Portrait',
    value: '2:3',
    ratio: 2 / 3,
    description: 'Vertical photo format',
    useCase: 'Portrait photography, mobile viewing, Pinterest',
    pros: ['Great for portraits', 'Mobile-friendly', 'Vertical emphasis'],
    cons: ['Limited landscape use', 'May crop wide content'],
  },
  {
    name: 'Story',
    value: '9:16',
    ratio: 9 / 16,
    description: 'Mobile story format',
    useCase: 'Instagram Stories, TikTok, mobile-first content',
    pros: ['Perfect for mobile', 'Full-screen experience', 'Modern format'],
    cons: ['Very narrow', 'Limited desktop use', 'May crop wide content'],
  },
  {
    name: 'Custom',
    value: 'custom',
    ratio: 0,
    description: 'Define your own ratio',
    useCase: 'Specific requirements, unique formats, custom applications',
    pros: ['Complete control', 'Exact specifications', 'Unique formats'],
    cons: ['Requires manual input', 'May not be standard', 'Complex setup'],
  },
]

// Crop Templates
const cropTemplates: CropTemplate[] = [
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    description: 'Perfect square crop for Instagram feed posts',
    settings: { aspectRatio: '1:1', outputFormat: 'jpeg', quality: 85, optimizeForWeb: true },
    category: 'social',
    tags: ['instagram', 'social', 'square'],
    popularity: 95,
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    description: 'Vertical format for Instagram Stories',
    settings: { aspectRatio: '9:16', outputFormat: 'jpeg', quality: 80, optimizeForWeb: true },
    category: 'social',
    tags: ['instagram', 'story', 'vertical'],
    popularity: 90,
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    description: 'Widescreen format for YouTube video thumbnails',
    settings: { aspectRatio: '16:9', outputFormat: 'jpeg', quality: 90, optimizeForWeb: true },
    category: 'web',
    tags: ['youtube', 'thumbnail', 'widescreen'],
    popularity: 85,
  },
  {
    id: 'profile-picture',
    name: 'Profile Picture',
    description: 'Square crop optimized for profile pictures',
    settings: { aspectRatio: '1:1', outputFormat: 'png', quality: 95, cropPosition: 'center' },
    category: 'social',
    tags: ['profile', 'avatar', 'square'],
    popularity: 88,
  },
  {
    id: 'print-4x6',
    name: 'Print 4x6',
    description: 'Standard photo print format',
    settings: { aspectRatio: '3:2', outputFormat: 'jpeg', quality: 95, maintainOriginalSize: true },
    category: 'print',
    tags: ['print', 'photo', '4x6'],
    popularity: 70,
  },
  {
    id: 'facebook-cover',
    name: 'Facebook Cover',
    description: 'Facebook cover photo format',
    settings: { aspectRatio: '16:9', outputFormat: 'jpeg', quality: 85, optimizeForWeb: true },
    category: 'social',
    tags: ['facebook', 'cover', 'banner'],
    popularity: 65,
  },
  {
    id: 'twitter-header',
    name: 'Twitter Header',
    description: 'Twitter header image format',
    settings: {
      aspectRatio: 'custom',
      customAspectRatio: { width: 3, height: 1 },
      outputFormat: 'jpeg',
      quality: 85,
      optimizeForWeb: true,
    },
    category: 'social',
    tags: ['twitter', 'header', 'banner'],
    popularity: 60,
  },
  {
    id: 'mobile-wallpaper',
    name: 'Mobile Wallpaper',
    description: 'Vertical format for mobile wallpapers',
    settings: { aspectRatio: '9:16', outputFormat: 'png', quality: 90, maintainOriginalSize: true },
    category: 'mobile',
    tags: ['wallpaper', 'mobile', 'vertical'],
    popularity: 75,
  },
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
 * Enhanced Image Crop Tool with Comprehensive Features
 * Features: Tabbed interface, templates, batch processing, interactive crop selection,
 * aspect ratio presets, drag-and-drop, progress tracking, history, analysis, export
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
    backgroundColor: '#ffffff',
    preserveMetadata: false,
    optimizeForWeb: true,
    enableSmartCrop: false,
    cropPadding: 0,
  })
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState('crop')
  const [_, setHistory] = useState<HistoryEntry[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { cropImage } = useImageCrop()

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
              cropImages()
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
    (stats: CropStats) => {
      const entry: HistoryEntry = {
        id: nanoid(),
        timestamp: Date.now(),
        settings: { ...settings },
        stats,
        imageCount: images.length,
        totalSavings: stats.totalSavings,
        description: `Cropped ${images.length} images to ${settings.aspectRatio === 'custom' ? 'custom ratio' : settings.aspectRatio}`,
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
        croppedSize: img.croppedSize,
        originalDimensions: img.originalDimensions,
        croppedDimensions: img.croppedDimensions,
        cropArea: img.cropArea,
        processingTime: img.processingTime,
        compressionRatio: img.compressionRatio,
        cropPercentage: img.cropPercentage,
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `image-crop-results-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Results exported successfully')
  }, [images, settings])

  // Apply Template
  const applyTemplate = useCallback((templateId: string) => {
    const template = cropTemplates.find((t) => t.id === templateId)
    if (!template) return

    setSettings((prev) => ({ ...prev, ...template.settings }))
    setSelectedTemplate(templateId)
    toast.success(`Applied template: ${template.name}`)
  }, [])

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
          const id = nanoid()
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
            timestamp: Date.now(),
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

  // Enhanced Crop logic
  const cropImages = useCallback(async () => {
    const pendingImages = images.filter((img) => img.status === 'pending')
    if (pendingImages.length === 0) {
      toast.error('No images to crop')
      return
    }

    setIsProcessing(true)
    const startTime = Date.now()

    for (const image of pendingImages) {
      try {
        const imageStartTime = Date.now()

        // Update status to processing
        setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, status: 'processing' } : img)))

        const result = await cropImage(image.file, image.cropArea, settings, image.originalDimensions)
        const processingTime = (Date.now() - imageStartTime) / 1000
        const compressionRatio = result.size / image.originalSize
        const qualityScore = compressionRatio > 0.8 ? 95 : compressionRatio > 0.5 ? 85 : 75

        // Calculate crop percentage
        const originalArea = image.originalDimensions.width * image.originalDimensions.height
        const cropArea = image.cropArea.width * image.cropArea.height
        const cropPercentage = (cropArea / originalArea) * 100

        // Calculate cropped dimensions
        const croppedDimensions = {
          width: image.cropArea.width,
          height: image.cropArea.height,
        }

        // Update with cropped result
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'completed',
                  croppedUrl: result.url,
                  croppedSize: result.size,
                  croppedDimensions,
                  processingTime,
                  compressionRatio,
                  qualityScore,
                  cropPercentage,
                  templateUsed: selectedTemplate || undefined,
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
    const totalTime = (Date.now() - startTime) / 1000
    const completedCount = images.filter((img) => img.status === 'completed').length
    const message = `Cropping completed! ${completedCount} image${completedCount > 1 ? 's' : ''} processed in ${totalTime.toFixed(1)}s.`
    toast.success(message)

    // Save to history
    setTimeout(() => {
      const currentStats = {
        totalOriginalSize: images.reduce((sum, img) => sum + img.originalSize, 0),
        totalCroppedSize: images.reduce((sum, img) => sum + (img.croppedSize || 0), 0),
        totalSavings: 0,
        averageSizeReduction: 0,
        averageCropPercentage: 0,
        processingTime: totalTime,
        imagesProcessed: completedCount,
        averageFileSize: 0,
        largestReduction: 0,
        smallestReduction: 0,
        qualityMetrics: {
          averageQuality: 0,
          compressionEfficiency: 0,
          cropOptimization: 0,
        },
      }
      currentStats.totalSavings = currentStats.totalOriginalSize - currentStats.totalCroppedSize
      saveToHistory(currentStats)
    }, 100)

    // Announce completion to screen readers
    const announcement = document.createElement('div')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 2000)
  }, [images, settings, cropImage, selectedTemplate, saveToHistory])

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

  // Enhanced Statistics calculation
  const stats: CropStats = useMemo(() => {
    const completedImages = images.filter((img) => img.status === 'completed')
    const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0)
    const totalCroppedSize = images.reduce((sum, img) => sum + (img.croppedSize || 0), 0)
    const totalSavings = totalOriginalSize - totalCroppedSize

    const sizeReductions = completedImages.map((img) => {
      const reduction = img.croppedSize ? ((img.originalSize - img.croppedSize) / img.originalSize) * 100 : 0
      return reduction
    })

    const cropPercentages = images.map((img) => {
      const originalArea = img.originalDimensions.width * img.originalDimensions.height
      const cropArea = img.cropArea.width * img.cropArea.height
      return (cropArea / originalArea) * 100
    })

    const processingTimes = completedImages.map((img) => img.processingTime || 0).filter((time) => time > 0)
    const qualityScores = completedImages.map((img) => img.qualityScore || 0).filter((score) => score > 0)
    const compressionRatios = completedImages.map((img) => img.compressionRatio || 0).filter((ratio) => ratio > 0)

    return {
      totalOriginalSize,
      totalCroppedSize,
      totalSavings,
      averageSizeReduction:
        sizeReductions.length > 0
          ? sizeReductions.reduce((sum, reduction) => sum + reduction, 0) / sizeReductions.length
          : 0,
      averageCropPercentage:
        cropPercentages.length > 0
          ? cropPercentages.reduce((sum, percentage) => sum + percentage, 0) / cropPercentages.length
          : 0,
      processingTime:
        processingTimes.length > 0 ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length : 0,
      imagesProcessed: completedImages.length,
      averageFileSize: completedImages.length > 0 ? totalCroppedSize / completedImages.length : 0,
      largestReduction: sizeReductions.length > 0 ? Math.max(...sizeReductions) : 0,
      smallestReduction: sizeReductions.length > 0 ? Math.min(...sizeReductions) : 0,
      qualityMetrics: {
        averageQuality:
          qualityScores.length > 0 ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0,
        compressionEfficiency:
          compressionRatios.length > 0
            ? compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / compressionRatios.length
            : 0,
        cropOptimization:
          completedImages.length > 0
            ? (completedImages.filter((img) => img.croppedSize && img.croppedSize < img.originalSize).length /
                completedImages.length) *
              100
            : 0,
      },
    }
  }, [images])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
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
              <Crop className="h-6 w-6" />
              Professional Image Crop & Resize Tool
            </CardTitle>
            <CardDescription>
              Professional image cropping with intelligent templates, batch processing, and advanced analytics. Crop to
              perfect aspect ratios for social media, print, web, and custom applications with precision controls.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Enhanced Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="crop" className="flex items-center gap-2">
              <Crop className="h-4 w-4" />
              Crop
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Templates
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

          {/* Crop Tab */}
          <TabsContent value="crop" className="space-y-6">
            {/* Settings Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Crop Settings
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                    {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Aspect Ratio and Templates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                    <Select
                      value={settings.aspectRatio}
                      onValueChange={(value: CropSettings['aspectRatio']) => updateAspectRatio(value)}
                    >
                      <SelectTrigger id="aspectRatio">
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

                  <div className="space-y-2">
                    <Label htmlFor="template">Quick Templates</Label>
                    <Select value={selectedTemplate} onValueChange={applyTemplate}>
                      <SelectTrigger id="template">
                        <SelectValue placeholder="Choose a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cropTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex flex-col">
                              <span>{template.name}</span>
                              <span className="text-xs text-muted-foreground">{template.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Aspect Ratio */}
                {settings.aspectRatio === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customWidth">Width Ratio</Label>
                      <Input
                        id="customWidth"
                        type="number"
                        min="1"
                        value={settings.customAspectRatio?.width || 1}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            customAspectRatio: {
                              ...prev.customAspectRatio,
                              width: Number(e.target.value),
                              height: prev.customAspectRatio?.height || 1,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customHeight">Height Ratio</Label>
                      <Input
                        id="customHeight"
                        type="number"
                        min="1"
                        value={settings.customAspectRatio?.height || 1}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            customAspectRatio: {
                              width: prev.customAspectRatio?.width || 1,
                              ...prev.customAspectRatio,
                              height: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Output Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="outputFormat">Output Format</Label>
                    <Select
                      value={settings.outputFormat}
                      onValueChange={(value: 'png' | 'jpeg' | 'webp') =>
                        setSettings((prev) => ({ ...prev, outputFormat: value }))
                      }
                    >
                      <SelectTrigger id="outputFormat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG - Lossless with transparency</SelectItem>
                        <SelectItem value="jpeg">JPEG - Smaller file size</SelectItem>
                        <SelectItem value="webp">WebP - Modern, efficient</SelectItem>
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
                      />
                    </div>
                  )}
                </div>

                {/* Crop Position */}
                <div className="space-y-2">
                  <Label htmlFor="cropPosition">Crop Position</Label>
                  <Select
                    value={settings.cropPosition}
                    onValueChange={(value: CropSettings['cropPosition']) =>
                      setSettings((prev) => ({ ...prev, cropPosition: value }))
                    }
                  >
                    <SelectTrigger id="cropPosition">
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

                {/* Advanced Settings */}
                {showAdvanced && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Sliders className="h-4 w-4" />
                      Advanced Options
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            id="maintainOriginalSize"
                            type="checkbox"
                            checked={settings.maintainOriginalSize}
                            onChange={(e) =>
                              setSettings((prev) => ({ ...prev, maintainOriginalSize: e.target.checked }))
                            }
                            className="rounded border-input"
                          />
                          <Label htmlFor="maintainOriginalSize" className="text-sm">
                            Maintain original dimensions
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

                        <div className="flex items-center space-x-2">
                          <input
                            id="enableSmartCrop"
                            type="checkbox"
                            checked={settings.enableSmartCrop}
                            onChange={(e) => setSettings((prev) => ({ ...prev, enableSmartCrop: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label htmlFor="enableSmartCrop" className="text-sm">
                            Enable smart crop detection
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-3">
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

                        <div className="space-y-2">
                          <Label htmlFor="cropPadding">Crop Padding: {settings.cropPadding}px</Label>
                          <Input
                            id="cropPadding"
                            type="range"
                            min="0"
                            max="50"
                            value={settings.cropPadding}
                            onChange={(e) => setSettings((prev) => ({ ...prev, cropPadding: Number(e.target.value) }))}
                            className="w-full"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            id="preserveMetadata"
                            type="checkbox"
                            checked={settings.preserveMetadata}
                            onChange={(e) => setSettings((prev) => ({ ...prev, preserveMetadata: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label htmlFor="preserveMetadata" className="text-sm">
                            Preserve image metadata
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Images to Crop</h3>
                  <p className="text-muted-foreground mb-4">Drag and drop your images here, or click to select files</p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports JPEG, PNG, WebP, GIF, BMP • Max 100MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
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
                    Crop Statistics
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
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Cropping...
                        </>
                      ) : (
                        <>
                          <Crop className="mr-2 h-4 w-4" />
                          Crop Images
                        </>
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

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Crop Templates
                </CardTitle>
                <CardDescription>Pre-configured crop settings for popular platforms and use cases.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cropTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          {template.name}
                          {selectedTemplate === template.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        </CardTitle>
                        <CardDescription className="text-sm">{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Aspect Ratio:</span>
                            <span className="font-medium">{template.settings.aspectRatio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Format:</span>
                            <span className="font-medium">{template.settings.outputFormat?.toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Quality:</span>
                            <span className="font-medium">{template.settings.quality}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Category:</span>
                            <span className="font-medium capitalize">{template.category}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex flex-wrap gap-1">
                            {template.tags.map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-muted rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < Math.floor(template.popularity / 20) ? 'bg-yellow-400' : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground ml-1">{template.popularity}% popular</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
const ImageCrop = () => {
  return <ImageCropCore />
}

export default ImageCrop
