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
  Settings,
  BarChart3,
  Clock,
  BookOpen,
  Eye,
  EyeOff,
  Zap,
  RotateCcw,
  Info,
  AlertCircle,
  CheckCircle2,
  Activity,
  TrendingUp,
  Layers,
  Sliders,
  Palette,
  Save,
  Monitor,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  ImageFile,
  CompressionSettings,
  CompressionStats,
  CompressionTemplate,
  HistoryEntry,
} from '@/types/image-compress'
import { formatFileSize } from '@/lib/utils'
import { useImageCompression, validateImageFile, calculateCompressionRatio } from './hooks'
// Enhanced Types

// Utility functions

// Enhanced Templates
const COMPRESSION_TEMPLATES: CompressionTemplate[] = [
  {
    id: 'web-optimized',
    name: 'Web Optimized',
    description: 'Balanced quality and file size for web use',
    category: 'web',
    useCase: 'Website images, blog posts, general web content',
    estimatedSavings: '60-80%',
    settings: {
      quality: 85,
      format: 'webp',
      maxWidth: 1920,
      maxHeight: 1080,
      maintainAspectRatio: true,
      enableProgressive: true,
      removeMetadata: true,
      resizeMethod: 'lanczos',
      colorSpace: 'srgb',
      dithering: false,
    },
  },
  {
    id: 'mobile-first',
    name: 'Mobile First',
    description: 'Optimized for mobile devices and slow connections',
    category: 'mobile',
    useCase: 'Mobile apps, responsive images, PWAs',
    estimatedSavings: '70-85%',
    settings: {
      quality: 75,
      format: 'webp',
      maxWidth: 800,
      maxHeight: 600,
      maintainAspectRatio: true,
      enableProgressive: true,
      removeMetadata: true,
      resizeMethod: 'lanczos',
      colorSpace: 'srgb',
      dithering: true,
    },
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Perfect for social media platforms',
    category: 'social',
    useCase: 'Instagram, Facebook, Twitter posts',
    estimatedSavings: '50-70%',
    settings: {
      quality: 90,
      format: 'jpeg',
      maxWidth: 1080,
      maxHeight: 1080,
      maintainAspectRatio: true,
      enableProgressive: false,
      removeMetadata: true,
      resizeMethod: 'bicubic',
      colorSpace: 'srgb',
      dithering: false,
    },
  },
  {
    id: 'print-quality',
    name: 'Print Quality',
    description: 'High quality for print materials',
    category: 'print',
    useCase: 'Brochures, posters, high-quality prints',
    estimatedSavings: '20-40%',
    settings: {
      quality: 95,
      format: 'jpeg',
      maintainAspectRatio: true,
      enableProgressive: false,
      removeMetadata: false,
      resizeMethod: 'lanczos',
      colorSpace: 'p3',
      dithering: false,
    },
  },
  {
    id: 'maximum-compression',
    name: 'Maximum Compression',
    description: 'Smallest file size possible',
    category: 'web',
    useCase: 'Thumbnails, previews, bandwidth-limited scenarios',
    estimatedSavings: '80-95%',
    settings: {
      quality: 60,
      format: 'webp',
      maxWidth: 640,
      maxHeight: 480,
      maintainAspectRatio: true,
      enableProgressive: true,
      removeMetadata: true,
      resizeMethod: 'bilinear',
      colorSpace: 'srgb',
      dithering: true,
    },
  },
  {
    id: 'lossless',
    name: 'Lossless Compression',
    description: 'No quality loss, metadata preserved',
    category: 'custom',
    useCase: 'Archives, professional photography, exact reproduction',
    estimatedSavings: '10-30%',
    settings: {
      quality: 100,
      format: 'png',
      maintainAspectRatio: true,
      enableProgressive: false,
      removeMetadata: false,
      resizeMethod: 'lanczos',
      colorSpace: 'p3',
      dithering: false,
    },
  },
]

// Custom hooks

/**
 * Enhanced Image Compression Tool
 * Features: Batch processing, quality controls, multiple formats, drag-and-drop, progress tracking
 */
const ImageCompressCore = () => {
  // Enhanced State Management
  const [images, setImages] = useState<ImageFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 80,
    format: 'jpeg',
    maintainAspectRatio: true,
    enableProgressive: false,
    removeMetadata: true,
    resizeMethod: 'lanczos',
    colorSpace: 'srgb',
    dithering: false,
  })
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState('compress')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterStatus] = useState<'all' | 'pending' | 'completed' | 'error'>('all')
  const [sortBy] = useState<'name' | 'size' | 'ratio' | 'time'>('name')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    compressImages: compressImagesWorker,
    isCompressing,
    progress,
    cancelCompression,
  } = useImageCompression(
    // onProgress callback
    (imageId: string, progress: number) => {
      setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, status: 'processing' as const } : img)))
    },
    // onComplete callback
    (imageId: string, result: Blob, originalSize: number, compressedSize: number) => {
      const url = URL.createObjectURL(result)
      const compressionRatio = calculateCompressionRatio(originalSize, compressedSize)

      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                status: 'completed' as const,
                compressedUrl: url,
                compressedSize,
                compressionRatio,
                processingTime: (Date.now() - img.timestamp) / 1000,
              }
            : img
        )
      )
    },
    // onError callback
    (imageId: string, error: string) => {
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                status: 'error' as const,
                error,
              }
            : img
        )
      )
    }
  )

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
              compressImages()
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
    (stats: CompressionStats) => {
      const entry: HistoryEntry = {
        id: nanoid(),
        timestamp: Date.now(),
        settings: { ...settings },
        stats,
        imageCount: images.length,
        totalSavings: stats.totalSavings,
        description: `Compressed ${images.length} images with ${settings.format.toUpperCase()} at ${settings.quality}% quality`,
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
        compressedSize: img.compressedSize,
        compressionRatio: img.compressionRatio,
        format: img.format,
        dimensions: img.dimensions,
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `image-compression-results-${new Date().toISOString().split('T')[0]}.json`
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
        case 'ratio':
          return (b.compressionRatio || 0) - (a.compressionRatio || 0)
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

      const id = nanoid()
      const originalUrl = URL.createObjectURL(file)

      newImages.push({
        id,
        file,
        originalUrl,
        originalSize: file.size,
        status: 'pending',
        timestamp: Date.now(),
      })
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages])
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

  // Enhanced Compression logic
  const compressImages = useCallback(async () => {
    const pendingImages = images.filter((img) => img.status === 'pending')
    if (pendingImages.length === 0) {
      toast.error('No images to compress')
      return
    }

    const startTime = Date.now()

    try {
      // Convert ImageFile[] to the format expected by the worker
      const workerImages = pendingImages.map((img) => ({
        id: img.id,
        file: img.file,
        status: 'pending' as const,
        progress: 0,
        originalSize: img.originalSize,
      }))

      await compressImagesWorker(workerImages, settings)

      const totalTime = (Date.now() - startTime) / 1000
      const completedCount = images.filter((img) => img.status === 'completed').length
      const message = `Compression completed! ${completedCount} image${completedCount > 1 ? 's' : ''} processed in ${totalTime.toFixed(1)}s.`
      toast.success(message)

      // Save to history
      setTimeout(() => {
        const currentStats = {
          totalOriginalSize: images.reduce((sum, img) => sum + img.originalSize, 0),
          totalCompressedSize: images.reduce((sum, img) => sum + (img.compressedSize || 0), 0),
          totalSavings: 0,
          averageCompressionRatio: 0,
          processingTime: totalTime,
          imagesProcessed: completedCount,
          averageFileSize: 0,
          largestReduction: 0,
          smallestReduction: 0,
        }
        currentStats.totalSavings = currentStats.totalOriginalSize - currentStats.totalCompressedSize
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
    } catch (error) {
      console.error('Batch compression failed:', error)
      toast.error('Compression failed. Please try again.')
    }
  }, [images, settings, compressImagesWorker])

  const clearAll = useCallback(() => {
    images.forEach((img) => {
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
      images.forEach((img) => {
        URL.revokeObjectURL(img.originalUrl)
        if (img.compressedUrl) {
          URL.revokeObjectURL(img.compressedUrl)
        }
      })
    }
  }, [images])

  const downloadImage = useCallback(
    (image: ImageFile) => {
      if (!image.compressedUrl) return

      const link = document.createElement('a')
      link.href = image.compressedUrl
      link.download = `compressed_${image.file.name.replace(/\.[^/.]+$/, '')}.${settings.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    [settings.format]
  )

  const downloadAll = useCallback(() => {
    const completedImages = images.filter((img) => img.status === 'completed' && img.compressedUrl)
    completedImages.forEach((image) => downloadImage(image))
  }, [images, downloadImage])

  // Enhanced Statistics calculation
  const stats: CompressionStats = useMemo(() => {
    const completedImages = images.filter((img) => img.status === 'completed')
    const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0)
    const totalCompressedSize = images.reduce((sum, img) => sum + (img.compressedSize || 0), 0)
    const totalSavings = totalOriginalSize - totalCompressedSize
    const averageCompressionRatio =
      completedImages.length > 0
        ? completedImages.reduce((sum, img) => sum + (img.compressionRatio || 0), 0) / completedImages.length
        : 0

    const processingTimes = completedImages.map((img) => img.processingTime || 0).filter((time) => time > 0)
    const compressionRatios = completedImages.map((img) => img.compressionRatio || 0)

    return {
      totalOriginalSize,
      totalCompressedSize,
      totalSavings,
      averageCompressionRatio,
      processingTime:
        processingTimes.length > 0 ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length : 0,
      imagesProcessed: completedImages.length,
      averageFileSize: completedImages.length > 0 ? totalCompressedSize / completedImages.length : 0,
      largestReduction: compressionRatios.length > 0 ? Math.max(...compressionRatios) : 0,
      smallestReduction: compressionRatios.length > 0 ? Math.min(...compressionRatios) : 0,
    }
  }, [images])

  // Enhanced Utility Functions
  const applyTemplate = useCallback((templateId: string) => {
    const template = COMPRESSION_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      setSettings(template.settings)
      setSelectedTemplate(templateId)
      toast.success(`Applied ${template.name} template`)
    }
  }, [])

  return (
    <div className="w-full mx-auto space-y-6">
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
              Image Compression & Optimization Tool
            </CardTitle>
            <CardDescription>
              Professional image compression with advanced settings, batch processing, and detailed analytics. Supports
              JPEG, PNG, WebP, GIF, and BMP formats with intelligent optimization recommendations.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Enhanced Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="compress" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Compress
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

          {/* Compress Tab */}
          <TabsContent value="compress" className="space-y-6">
            {/* Settings Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Compression Settings
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                    {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Settings */}
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
                      onChange={(e) => setSettings((prev) => ({ ...prev, quality: Number(e.target.value) }))}
                      className="w-full"
                      aria-label={`Compression quality: ${settings.quality} percent`}
                    />
                    <div className="text-xs text-muted-foreground">Higher quality = larger file size</div>
                  </div>

                  {/* Format Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="format">Output Format</Label>
                    <Select
                      value={settings.format}
                      onValueChange={(value: 'jpeg' | 'png' | 'webp') =>
                        setSettings((prev) => ({ ...prev, format: value }))
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
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            maxWidth: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        className="w-full"
                        aria-label="Maximum width in pixels"
                      />
                      <Input
                        type="number"
                        placeholder="Height"
                        value={settings.maxHeight || ''}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            maxHeight: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        className="w-full"
                        aria-label="Maximum height in pixels"
                      />
                    </div>
                  </div>
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
                            id="maintainAspectRatio"
                            type="checkbox"
                            checked={settings.maintainAspectRatio}
                            onChange={(e) =>
                              setSettings((prev) => ({ ...prev, maintainAspectRatio: e.target.checked }))
                            }
                            className="rounded border-input"
                          />
                          <Label htmlFor="maintainAspectRatio" className="text-sm">
                            Maintain aspect ratio
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            id="enableProgressive"
                            type="checkbox"
                            checked={settings.enableProgressive}
                            onChange={(e) => setSettings((prev) => ({ ...prev, enableProgressive: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label htmlFor="enableProgressive" className="text-sm">
                            Progressive encoding
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="resizeMethod">Resize Method</Label>
                          <Select
                            value={settings.resizeMethod}
                            onValueChange={(value: 'lanczos' | 'bilinear' | 'bicubic') =>
                              setSettings((prev) => ({ ...prev, resizeMethod: value }))
                            }
                          >
                            <SelectTrigger id="resizeMethod">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lanczos">Lanczos (Best quality)</SelectItem>
                              <SelectItem value="bicubic">Bicubic (Balanced)</SelectItem>
                              <SelectItem value="bilinear">Bilinear (Fastest)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="colorSpace">Color Space</Label>
                          <Select
                            value={settings.colorSpace}
                            onValueChange={(value: 'srgb' | 'p3' | 'rec2020') =>
                              setSettings((prev) => ({ ...prev, colorSpace: value }))
                            }
                          >
                            <SelectTrigger id="colorSpace">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="srgb">sRGB (Standard)</SelectItem>
                              <SelectItem value="p3">Display P3 (Wide gamut)</SelectItem>
                              <SelectItem value="rec2020">Rec. 2020 (Ultra wide)</SelectItem>
                            </SelectContent>
                          </Select>
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
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Compression Statistics
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
                      disabled={isProcessing || images.every((img) => img.status !== 'pending')}
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
                  Compression Templates
                </CardTitle>
                <CardDescription>
                  Pre-configured settings optimized for different use cases. Click to apply a template.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COMPRESSION_TEMPLATES.map((template) => (
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
                            <span className="text-muted-foreground">Category:</span>
                            <span className="capitalize font-medium">{template.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Format:</span>
                            <span className="font-medium">{template.settings.format.toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Quality:</span>
                            <span className="font-medium">{template.settings.quality}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Est. Savings:</span>
                            <span className="font-medium text-green-600">{template.estimatedSavings}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
                            <strong>Use case:</strong> {template.useCase}
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
                  Compression Analysis
                </CardTitle>
                <CardDescription>
                  Detailed analysis of compression performance and optimization recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {images.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Images to Analyze</h3>
                    <p className="text-muted-foreground">Upload and compress some images to see detailed analysis.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Overall Performance */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">
                              {stats.averageCompressionRatio.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Average Compression</div>
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
                              {formatFileSize(stats.averageFileSize)}
                            </div>
                            <div className="text-sm text-muted-foreground">Avg. Output Size</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Compression Efficiency Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Compression Efficiency by Image</CardTitle>
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
                                    {formatFileSize(image.originalSize)} → {formatFileSize(image.compressedSize || 0)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 bg-muted rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                                      style={{ width: `${Math.min(100, image.compressionRatio || 0)}%` }}
                                    />
                                  </div>
                                  <div className="text-sm font-medium w-12 text-right">
                                    {(image.compressionRatio || 0).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Info className="h-5 w-5" />
                          Optimization Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {stats.averageCompressionRatio < 30 && (
                            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                              <div>
                                <div className="font-medium text-blue-900 dark:text-blue-100">
                                  Low Compression Ratio
                                </div>
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                  Consider lowering quality settings or switching to WebP format for better compression.
                                </div>
                              </div>
                            </div>
                          )}

                          {stats.averageCompressionRatio > 80 && (
                            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                              <div>
                                <div className="font-medium text-yellow-900 dark:text-yellow-100">
                                  High Compression Ratio
                                </div>
                                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                                  Very high compression may affect image quality. Consider increasing quality settings.
                                </div>
                              </div>
                            </div>
                          )}

                          {stats.totalOriginalSize > 50 * 1024 * 1024 && (
                            <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                              <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
                              <div>
                                <div className="font-medium text-orange-900 dark:text-orange-100">Large File Sizes</div>
                                <div className="text-sm text-orange-700 dark:text-orange-300">
                                  Consider setting maximum dimensions to reduce file sizes further.
                                </div>
                              </div>
                            </div>
                          )}

                          {settings.format === 'png' && images.some((img) => !img.file.type.includes('png')) && (
                            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                              <Palette className="h-5 w-5 text-purple-600 mt-0.5" />
                              <div>
                                <div className="font-medium text-purple-900 dark:text-purple-100">
                                  Format Optimization
                                </div>
                                <div className="text-sm text-purple-700 dark:text-purple-300">
                                  PNG format may not be optimal for photos. Consider JPEG or WebP for better
                                  compression.
                                </div>
                              </div>
                            </div>
                          )}
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
                  Compression History
                </CardTitle>
                <CardDescription>View your recent compression sessions and reuse settings.</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
                    <p className="text-muted-foreground">
                      Your compression sessions will appear here after you process images.
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
                                  <span className="ml-1 font-medium">{entry.settings.format.toUpperCase()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Quality:</span>
                                  <span className="ml-1 font-medium">{entry.settings.quality}%</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Savings:</span>
                                  <span className="ml-1 font-medium text-green-600">
                                    {formatFileSize(entry.totalSavings)}
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
                  Image Compression Guide
                </CardTitle>
                <CardDescription>
                  Learn how to optimize your images effectively with our comprehensive guide.
                </CardDescription>
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
                        <strong>Upload Images:</strong> Drag and drop or click to select your images (JPEG, PNG, WebP,
                        GIF, BMP)
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div>
                        <strong>Choose Settings:</strong> Select quality, format, and dimensions or use a template
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <strong>Compress:</strong> Click "Compress Images" to process your files
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        4
                      </div>
                      <div>
                        <strong>Download:</strong> Download individual images or all at once
                      </div>
                    </div>
                  </div>
                </div>

                {/* Format Guide */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileImage className="h-5 w-5" />
                    Format Guide
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-blue-600 mb-2">JPEG</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Best for photos</li>
                          <li>• Excellent compression</li>
                          <li>• No transparency</li>
                          <li>• Lossy compression</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-green-600 mb-2">PNG</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Best for graphics</li>
                          <li>• Supports transparency</li>
                          <li>• Larger file sizes</li>
                          <li>• Lossless compression</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-purple-600 mb-2">WebP</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Modern format</li>
                          <li>• Best compression</li>
                          <li>• Supports transparency</li>
                          <li>• Great for web</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Quality Settings */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Sliders className="h-5 w-5" />
                    Quality Settings Guide
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        90+
                      </div>
                      <div>
                        <div className="font-medium text-green-900 dark:text-green-100">High Quality</div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          Best for print, professional use, minimal compression
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        70-90
                      </div>
                      <div>
                        <div className="font-medium text-blue-900 dark:text-blue-100">Balanced</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          Good for web, social media, general use
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        50-70
                      </div>
                      <div>
                        <div className="font-medium text-orange-900 dark:text-orange-100">High Compression</div>
                        <div className="text-sm text-orange-700 dark:text-orange-300">
                          Smaller files, some quality loss, good for thumbnails
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Pro Tips
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Use WebP format for the best compression and quality balance</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Set maximum dimensions to reduce file sizes significantly</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Remove metadata to save additional space</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Use progressive encoding for better perceived loading speed</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Test different quality settings to find the optimal balance</span>
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
                      <span>Compress images</span>
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
const ImageCompress = () => {
  return <ImageCompressCore />
}

export default ImageCompress
