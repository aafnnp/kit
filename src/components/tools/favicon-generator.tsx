import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  FileText,
  Code,
  Upload,
  FileImage,
  Trash2,
  Target,
  Copy,
  Check,
  Eye,
  RotateCcw,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Globe,
  Package,
  Settings,
} from 'lucide-react'
import { nanoid } from 'nanoid'
// Types
interface FaviconFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  faviconData?: FaviconData
}

interface FaviconData {
  favicons: GeneratedFavicon[]
  statistics: FaviconStatistics
  settings: FaviconSettings
  manifest: WebAppManifest
}

interface GeneratedFavicon {
  id: string
  type: FaviconType
  size: FaviconSize
  format: FaviconFormat
  url: string
  filename: string
  fileSize: number
  quality: number
  optimized: boolean
  metadata: FaviconMetadata
}

interface FaviconMetadata {
  width: number
  height: number
  colorDepth: number
  hasTransparency: boolean
  compressionRatio: number
  processingTime: number
  purpose: FaviconPurpose[]
}

interface FaviconStatistics {
  totalFavicons: number
  typeDistribution: Record<FaviconType, number>
  formatDistribution: Record<FaviconFormat, number>
  averageFileSize: number
  totalPackageSize: number
  processingTime: number
  optimizationSavings: number
}

interface FaviconSettings {
  includeStandardSizes: boolean
  includeAppleSizes: boolean
  includeAndroidSizes: boolean
  includeMSApplicationSizes: boolean
  generateManifest: boolean
  optimizeImages: boolean
  backgroundColor: string
  themeColor: string
  exportFormat: ExportFormat
}

interface WebAppManifest {
  name: string
  short_name: string
  description: string
  start_url: string
  display: string
  background_color: string
  theme_color: string
  icons: ManifestIcon[]
}

interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

interface FaviconTemplate {
  id: string
  name: string
  description: string
  category: string
  sizes: FaviconSize[]
  formats: FaviconFormat[]
  settings: Partial<FaviconSettings>
}

// Enums
type FaviconType = 'standard' | 'apple-touch' | 'android' | 'ms-application' | 'web-app'
type FaviconFormat = 'ico' | 'png' | 'svg' | 'webp' | 'jpg'
type FaviconSize = 16 | 32 | 48 | 64 | 96 | 128 | 152 | 167 | 180 | 192 | 256 | 512
type FaviconPurpose = 'any' | 'maskable' | 'monochrome'
type ExportFormat = 'zip' | 'individual' | 'html'

// Utility functions

const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only PNG, JPEG, SVG, and WebP images are supported' }
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

// Favicon generation functions
const generateFaviconFromImage = async (
  imageUrl: string,
  size: FaviconSize,
  format: FaviconFormat,
  quality: number = 0.9
): Promise<{ url: string; fileSize: number; metadata: FaviconMetadata }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        canvas.width = size
        canvas.height = size

        // Clear canvas with transparent background
        ctx.clearRect(0, 0, size, size)

        // Draw image scaled to fit
        ctx.drawImage(img, 0, 0, size, size)

        // Get image data for analysis
        const imageData = ctx.getImageData(0, 0, size, size)
        const hasTransparency = checkTransparency(imageData)

        // Convert to desired format
        let mimeType = 'image/png'
        if (format === 'jpg') mimeType = 'image/jpeg'
        else if (format === 'webp') mimeType = 'image/webp'

        const dataUrl = canvas.toDataURL(mimeType, quality)
        const fileSize = Math.round((dataUrl.length * 3) / 4) // Approximate file size

        const metadata: FaviconMetadata = {
          width: size,
          height: size,
          colorDepth: 24,
          hasTransparency,
          compressionRatio: fileSize / (size * size * 4),
          processingTime: performance.now(),
          purpose: ['any'],
        }

        resolve({
          url: dataUrl,
          fileSize,
          metadata,
        })
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

const checkTransparency = (imageData: ImageData): boolean => {
  const data = imageData.data
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true
  }
  return false
}

// Standard favicon sizes for different platforms
const FAVICON_SIZES: Record<FaviconType, FaviconSize[]> = {
  standard: [16, 32, 48],
  'apple-touch': [152, 167, 180],
  android: [192, 512],
  'ms-application': [128, 256],
  'web-app': [96, 128, 192, 256, 512],
}

// Generate complete favicon set
const generateFaviconSet = async (imageUrl: string, settings: FaviconSettings): Promise<GeneratedFavicon[]> => {
  const favicons: GeneratedFavicon[] = []
  const startTime = performance.now()

  try {
    const sizesToGenerate: { size: FaviconSize; type: FaviconType; format: FaviconFormat }[] = []

    // Collect all sizes to generate based on settings
    if (settings.includeStandardSizes) {
      FAVICON_SIZES.standard.forEach((size) => {
        sizesToGenerate.push({ size, type: 'standard', format: 'png' })
        if (size === 32) sizesToGenerate.push({ size, type: 'standard', format: 'ico' })
      })
    }

    if (settings.includeAppleSizes) {
      FAVICON_SIZES['apple-touch'].forEach((size) => {
        sizesToGenerate.push({ size, type: 'apple-touch', format: 'png' })
      })
    }

    if (settings.includeAndroidSizes) {
      FAVICON_SIZES.android.forEach((size) => {
        sizesToGenerate.push({ size, type: 'android', format: 'png' })
      })
    }

    if (settings.includeMSApplicationSizes) {
      FAVICON_SIZES['ms-application'].forEach((size) => {
        sizesToGenerate.push({ size, type: 'ms-application', format: 'png' })
      })
    }

    // Generate all favicons
    for (const { size, type, format } of sizesToGenerate) {
      try {
        const result = await generateFaviconFromImage(imageUrl, size, format)

        const favicon: GeneratedFavicon = {
          id: nanoid(),
          type,
          size,
          format,
          url: result.url,
          filename: `favicon-${size}x${size}.${format}`,
          fileSize: result.fileSize,
          quality: 0.9,
          optimized: settings.optimizeImages,
          metadata: {
            ...result.metadata,
            processingTime: performance.now() - startTime,
          },
        }

        favicons.push(favicon)
      } catch (error) {
        console.error(`Failed to generate ${size}x${size} ${format}:`, error)
      }
    }

    return favicons
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Favicon generation failed')
  }
}

// Favicon templates
const faviconTemplates: FaviconTemplate[] = [
  {
    id: 'basic-web',
    name: 'Basic Web',
    description: 'Essential favicons for web browsers',
    category: 'Web',
    sizes: [16, 32, 48],
    formats: ['ico', 'png'],
    settings: {
      includeStandardSizes: true,
      includeAppleSizes: false,
      includeAndroidSizes: false,
      includeMSApplicationSizes: false,
      generateManifest: false,
      optimizeImages: true,
    },
  },
  {
    id: 'complete-web',
    name: 'Complete Web',
    description: 'Comprehensive favicon set for all platforms',
    category: 'Web',
    sizes: [16, 32, 48, 152, 167, 180, 192, 512],
    formats: ['ico', 'png'],
    settings: {
      includeStandardSizes: true,
      includeAppleSizes: true,
      includeAndroidSizes: true,
      includeMSApplicationSizes: true,
      generateManifest: true,
      optimizeImages: true,
    },
  },
  {
    id: 'apple-only',
    name: 'Apple Touch Icons',
    description: 'Apple device optimized icons',
    category: 'Mobile',
    sizes: [152, 167, 180],
    formats: ['png'],
    settings: {
      includeStandardSizes: false,
      includeAppleSizes: true,
      includeAndroidSizes: false,
      includeMSApplicationSizes: false,
      generateManifest: false,
      optimizeImages: true,
    },
  },
  {
    id: 'android-pwa',
    name: 'Android PWA',
    description: 'Progressive Web App icons for Android',
    category: 'PWA',
    sizes: [192, 512],
    formats: ['png'],
    settings: {
      includeStandardSizes: false,
      includeAppleSizes: false,
      includeAndroidSizes: true,
      includeMSApplicationSizes: false,
      generateManifest: true,
      optimizeImages: true,
    },
  },
  {
    id: 'microsoft',
    name: 'Microsoft Tiles',
    description: 'Windows and Microsoft application tiles',
    category: 'Desktop',
    sizes: [128, 256],
    formats: ['png'],
    settings: {
      includeStandardSizes: false,
      includeAppleSizes: false,
      includeAndroidSizes: false,
      includeMSApplicationSizes: true,
      generateManifest: false,
      optimizeImages: true,
    },
  },
  {
    id: 'high-res',
    name: 'High Resolution',
    description: 'High resolution icons for modern displays',
    category: 'Quality',
    sizes: [256, 512],
    formats: ['png'],
    settings: {
      includeStandardSizes: false,
      includeAppleSizes: false,
      includeAndroidSizes: false,
      includeMSApplicationSizes: false,
      generateManifest: false,
      optimizeImages: false,
    },
  },
]

// Generate web app manifest
const generateWebAppManifest = (favicons: GeneratedFavicon[], settings: FaviconSettings): WebAppManifest => {
  const icons: ManifestIcon[] = favicons
    .filter((f) => f.type === 'android' || f.type === 'web-app')
    .map((f) => ({
      src: f.filename,
      sizes: `${f.size}x${f.size}`,
      type: `image/${f.format}`,
      purpose: f.metadata.purpose.join(' '),
    }))

  return {
    name: 'Web Application',
    short_name: 'WebApp',
    description: 'Generated web application',
    start_url: '/',
    display: 'standalone',
    background_color: settings.backgroundColor,
    theme_color: settings.themeColor,
    icons,
  }
}

// Process favicon data
const processFaviconData = (favicons: GeneratedFavicon[], settings: FaviconSettings): FaviconData => {
  const startTime = performance.now()

  try {
    const typeDistribution: Record<FaviconType, number> = {
      standard: 0,
      'apple-touch': 0,
      android: 0,
      'ms-application': 0,
      'web-app': 0,
    }

    const formatDistribution: Record<FaviconFormat, number> = {
      ico: 0,
      png: 0,
      svg: 0,
      webp: 0,
      jpg: 0,
    }

    favicons.forEach((favicon) => {
      typeDistribution[favicon.type]++
      formatDistribution[favicon.format]++
    })

    const averageFileSize = favicons.reduce((sum, f) => sum + f.fileSize, 0) / favicons.length
    const totalPackageSize = favicons.reduce((sum, f) => sum + f.fileSize, 0)
    const optimizationSavings = (favicons.filter((f) => f.optimized).length / favicons.length) * 100

    const statistics: FaviconStatistics = {
      totalFavicons: favicons.length,
      typeDistribution,
      formatDistribution,
      averageFileSize,
      totalPackageSize,
      processingTime: performance.now() - startTime,
      optimizationSavings,
    }

    const manifest = settings.generateManifest ? generateWebAppManifest(favicons, settings) : ({} as WebAppManifest)

    return {
      favicons,
      statistics,
      settings,
      manifest,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Favicon processing failed')
  }
}

// Error boundary component
class FaviconGeneratorErrorBoundary extends React.Component<
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
    console.error('Favicon Generator error:', error, errorInfo)
    toast.error('An unexpected error occurred during favicon generation')
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
const useFaviconGeneration = () => {
  const generateFavicons = useCallback(async (imageUrl: string, settings: FaviconSettings): Promise<FaviconData> => {
    try {
      const favicons = await generateFaviconSet(imageUrl, settings)
      return processFaviconData(favicons, settings)
    } catch (error) {
      console.error('Favicon generation error:', error)
      throw new Error(error instanceof Error ? error.message : 'Favicon generation failed')
    }
  }, [])

  const processBatch = useCallback(
    async (files: FaviconFile[], settings: FaviconSettings): Promise<FaviconFile[]> => {
      return Promise.all(
        files.map(async (file) => {
          if (file.status !== 'pending') return file

          try {
            const faviconData = await generateFavicons(file.content, settings)

            return {
              ...file,
              status: 'completed' as const,
              faviconData,
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
    [generateFavicons]
  )

  return { generateFavicons, processBatch }
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<FaviconFile> => {
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const faviconFile: FaviconFile = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type,
            status: 'pending',
          }

          resolve(faviconFile)
        } catch (error) {
          reject(new Error('Failed to process file'))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<FaviconFile[]> => {
      const results = await Promise.allSettled(files.map((file) => processFile(file)))

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            id: nanoid(),
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
const useFaviconExport = () => {
  const exportFavicon = useCallback((favicon: GeneratedFavicon, filename?: string) => {
    const link = document.createElement('a')
    link.href = favicon.url
    link.download = filename || favicon.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const exportFaviconPackage = useCallback(
    async (faviconData: FaviconData) => {
      // In a real implementation, you would create a ZIP file
      // For now, we'll download each favicon individually
      faviconData.favicons.forEach((favicon, index) => {
        setTimeout(() => {
          exportFavicon(favicon)
        }, index * 100) // Stagger downloads
      })

      // Export manifest if available
      if (faviconData.settings.generateManifest && faviconData.manifest.name) {
        const manifestBlob = new Blob([JSON.stringify(faviconData.manifest, null, 2)], {
          type: 'application/json',
        })
        const manifestUrl = URL.createObjectURL(manifestBlob)
        const link = document.createElement('a')
        link.href = manifestUrl
        link.download = 'manifest.json'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(manifestUrl)
      }

      toast.success(`Exported ${faviconData.favicons.length} favicon(s)`)
    },
    [exportFavicon]
  )

  const exportHTML = useCallback((faviconData: FaviconData) => {
    const htmlContent = generateFaviconHTML(faviconData.favicons, faviconData.settings)
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'favicon-links.html'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('HTML code exported')
  }, [])

  const exportStatistics = useCallback((files: FaviconFile[]) => {
    const stats = files
      .filter((f) => f.faviconData)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.size),
        totalFavicons: file.faviconData!.statistics.totalFavicons,
        averageFileSize: formatFileSize(file.faviconData!.statistics.averageFileSize),
        totalPackageSize: formatFileSize(file.faviconData!.statistics.totalPackageSize),
        optimizationSavings: `${file.faviconData!.statistics.optimizationSavings.toFixed(1)}%`,
        processingTime: `${file.faviconData!.statistics.processingTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      [
        'Filename',
        'Original Size',
        'Total Favicons',
        'Avg File Size',
        'Total Package Size',
        'Optimization Savings',
        'Processing Time',
        'Status',
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.totalFavicons.toString(),
        stat.averageFileSize,
        stat.totalPackageSize,
        stat.optimizationSavings,
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
    link.download = 'favicon-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportFavicon, exportFaviconPackage, exportHTML, exportStatistics }
}

// Generate HTML code for favicons
const generateFaviconHTML = (favicons: GeneratedFavicon[], settings: FaviconSettings): string => {
  const links: string[] = []

  // Standard favicons
  const standardFavicons = favicons.filter((f) => f.type === 'standard')
  standardFavicons.forEach((favicon) => {
    if (favicon.format === 'ico') {
      links.push(`<link rel="icon" type="image/x-icon" href="${favicon.filename}">`)
    } else {
      links.push(
        `<link rel="icon" type="image/${favicon.format}" sizes="${favicon.size}x${favicon.size}" href="${favicon.filename}">`
      )
    }
  })

  // Apple touch icons
  const appleFavicons = favicons.filter((f) => f.type === 'apple-touch')
  appleFavicons.forEach((favicon) => {
    links.push(`<link rel="apple-touch-icon" sizes="${favicon.size}x${favicon.size}" href="${favicon.filename}">`)
  })

  // Android/PWA icons
  if (settings.generateManifest) {
    links.push(`<link rel="manifest" href="manifest.json">`)
  }

  // Theme colors
  if (settings.themeColor) {
    links.push(`<meta name="theme-color" content="${settings.themeColor}">`)
  }

  if (settings.backgroundColor) {
    links.push(`<meta name="msapplication-TileColor" content="${settings.backgroundColor}">`)
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Favicon HTML Code</title>

  <!-- Favicon Links -->
${links.map((link) => `  ${link}`).join('\n')}

</head>
<body>
  <h1>Favicon HTML Code</h1>
  <p>Copy the links from the head section above and paste them into your HTML document.</p>
</body>
</html>`
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

      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'))

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error('Please drop only image files')
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
 * Enhanced Favicon Generator Tool
 * Features: Real-time favicon generation, multiple formats, batch processing, comprehensive export
 */
const FaviconGeneratorCore = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'files'>('generator')
  const [sourceImage, setSourceImage] = useState<string>('')
  const [files, setFiles] = useState<FaviconFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('complete-web')
  const [settings, setSettings] = useState<FaviconSettings>({
    includeStandardSizes: true,
    includeAppleSizes: true,
    includeAndroidSizes: true,
    includeMSApplicationSizes: true,
    generateManifest: true,
    optimizeImages: true,
    backgroundColor: '#ffffff',
    themeColor: '#000000',
    exportFormat: 'zip',
  })
  const [generatedFavicons, setGeneratedFavicons] = useState<FaviconData | null>(null)

  const { generateFavicons } = useFaviconGeneration()
  const { exportFavicon, exportFaviconPackage, exportHTML } = useFaviconExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // File drag and drop
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    useCallback(async (droppedFiles: File[]) => {
      setIsProcessing(true)
      try {
        const { processBatch: processFilesBatch } = useFileProcessing()
        const processedFiles = await processFilesBatch(droppedFiles)
        setFiles((prev) => [...processedFiles, ...prev])

        // If only one file, set it as source image
        if (droppedFiles.length === 1) {
          const reader = new FileReader()
          reader.onload = (e) => {
            setSourceImage(e.target?.result as string)
          }
          reader.readAsDataURL(droppedFiles[0])
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
    const template = faviconTemplates.find((t) => t.id === templateId)
    if (template && template.settings) {
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Generate favicons
  const handleGenerateFavicons = useCallback(async () => {
    if (!sourceImage) {
      toast.error('Please select a source image first')
      return
    }

    setIsProcessing(true)
    try {
      const faviconData = await generateFavicons(sourceImage, settings)
      setGeneratedFavicons(faviconData)
      toast.success(`Generated ${faviconData.favicons.length} favicon(s)`)
    } catch (error) {
      toast.error('Failed to generate favicons')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [sourceImage, settings, generateFavicons])

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
              <Globe className="h-5 w-5" aria-hidden="true" />
              Favicon Generator
            </CardTitle>
            <CardDescription>
              Advanced favicon generator with support for multiple formats, sizes, and platforms. Generate complete
              favicon packages for web, mobile, and desktop applications. Use keyboard navigation: Tab to move between
              controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'generator' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Favicon Generator
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Favicon Generator Tab */}
          <TabsContent value="generator" className="space-y-4">
            {/* Favicon Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Favicon Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {faviconTemplates.map((template) => (
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
                          {template.sizes.join(', ')} • {template.formats.join(', ')}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Source Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Source Image</CardTitle>
              </CardHeader>
              <CardContent>
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
                  aria-label="Drag and drop image here or click to select image"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  {sourceImage ? (
                    <div className="space-y-4">
                      <img
                        src={sourceImage}
                        alt="Source favicon"
                        className="w-24 h-24 mx-auto rounded border object-cover"
                      />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Source image loaded</p>
                        <div className="flex gap-2 justify-center">
                          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Change Image
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSourceImage('')}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Clear
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Upload Source Image</h3>
                      <p className="text-muted-foreground mb-4">
                        Drag and drop your image here, or click to select a file
                      </p>
                      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                        <FileImage className="mr-2 h-4 w-4" />
                        Choose Image
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supports PNG, JPEG, SVG, WebP • Max 10MB • Recommended: 512x512px or larger
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select source image"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Favicon Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Favicon Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id="standard-sizes"
                        type="checkbox"
                        checked={settings.includeStandardSizes}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeStandardSizes: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="standard-sizes" className="text-sm flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Standard Web Favicons (16, 32, 48px)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="apple-sizes"
                        type="checkbox"
                        checked={settings.includeAppleSizes}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeAppleSizes: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="apple-sizes" className="text-sm flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Apple Touch Icons (152, 167, 180px)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="android-sizes"
                        type="checkbox"
                        checked={settings.includeAndroidSizes}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeAndroidSizes: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="android-sizes" className="text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Android/PWA Icons (192, 512px)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="ms-sizes"
                        type="checkbox"
                        checked={settings.includeMSApplicationSizes}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, includeMSApplicationSizes: e.target.checked }))
                        }
                        className="rounded border-input"
                      />
                      <Label htmlFor="ms-sizes" className="text-sm flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Microsoft Tiles (128, 256px)
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id="generate-manifest"
                        type="checkbox"
                        checked={settings.generateManifest}
                        onChange={(e) => setSettings((prev) => ({ ...prev, generateManifest: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="generate-manifest" className="text-sm">
                        Generate Web App Manifest
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="optimize-images"
                        type="checkbox"
                        checked={settings.optimizeImages}
                        onChange={(e) => setSettings((prev) => ({ ...prev, optimizeImages: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="optimize-images" className="text-sm">
                        Optimize Images
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="theme-color" className="text-sm">
                        Theme Color
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="theme-color"
                          type="color"
                          value={settings.themeColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, themeColor: e.target.value }))}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Input
                          value={settings.themeColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, themeColor: e.target.value }))}
                          placeholder="#000000"
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="background-color" className="text-sm">
                        Background Color
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="background-color"
                          type="color"
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Input
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          placeholder="#ffffff"
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={handleGenerateFavicons} disabled={!sourceImage || isProcessing} className="w-full">
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Generating Favicons...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Generate Favicons
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generated Favicons */}
            {generatedFavicons && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Generated Favicons ({generatedFavicons.favicons.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {generatedFavicons.favicons.map((favicon) => (
                        <div key={favicon.id} className="border rounded-lg p-3 text-center">
                          <img
                            src={favicon.url}
                            alt={`${favicon.size}x${favicon.size} favicon`}
                            className="w-12 h-12 mx-auto mb-2 border rounded"
                          />
                          <div className="text-xs space-y-1">
                            <div className="font-medium">
                              {favicon.size}x{favicon.size}
                            </div>
                            <div className="text-muted-foreground">{favicon.format.toUpperCase()}</div>
                            <div className="text-muted-foreground">{formatFileSize(favicon.fileSize)}</div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportFavicon(favicon)}
                              className="w-full mt-2"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-sm font-medium">Total Favicons</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span className="font-mono text-lg">{generatedFavicons.statistics.totalFavicons}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Package Size</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span className="font-mono text-lg">
                            {formatFileSize(generatedFavicons.statistics.totalPackageSize)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Processing Time</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span className="font-mono text-lg">
                            {generatedFavicons.statistics.processingTime.toFixed(2)}ms
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Optimization</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span className="font-mono text-lg">
                            {generatedFavicons.statistics.optimizationSavings.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Export Actions */}
                    <div className="flex flex-wrap gap-3 justify-center pt-4 border-t">
                      <Button onClick={() => exportFaviconPackage(generatedFavicons)} variant="outline">
                        <Package className="mr-2 h-4 w-4" />
                        Download All
                      </Button>

                      <Button onClick={() => exportHTML(generatedFavicons)} variant="outline">
                        <Code className="mr-2 h-4 w-4" />
                        Export HTML
                      </Button>

                      {generatedFavicons.settings.generateManifest && (
                        <Button
                          onClick={() => {
                            const manifestBlob = new Blob([JSON.stringify(generatedFavicons.manifest, null, 2)], {
                              type: 'application/json',
                            })
                            const manifestUrl = URL.createObjectURL(manifestBlob)
                            const link = document.createElement('a')
                            link.href = manifestUrl
                            link.download = 'manifest.json'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            URL.revokeObjectURL(manifestUrl)
                          }}
                          variant="outline"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Download Manifest
                        </Button>
                      )}

                      <Button
                        onClick={() => {
                          const htmlCode = generateFaviconHTML(generatedFavicons.favicons, generatedFavicons.settings)
                          const htmlLinks = htmlCode.match(/<link[^>]*>/g)?.join('\n') || ''
                          copyToClipboard(htmlLinks, 'HTML favicon links')
                        }}
                        variant="outline"
                      >
                        {copiedText === 'HTML favicon links' ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Copy HTML
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
                  aria-label="Drag and drop image files here or click to select files"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Images for Batch Processing</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your images here, or click to select files for batch favicon generation
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Images
                  </Button>
                  <p className="text-xs text-muted-foreground">Supports PNG, JPEG, SVG, WebP • Max 10MB per file</p>
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
                            {file.content ? (
                              <img
                                src={file.content}
                                alt={file.name}
                                className="w-12 h-12 rounded border object-cover"
                              />
                            ) : (
                              <FileImage className="h-12 w-12 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Size:</span> {formatFileSize(file.size)}
                            </div>
                            {file.status === 'completed' && file.faviconData && (
                              <div className="mt-2 text-xs">
                                {file.faviconData.statistics.totalFavicons} favicons generated
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
const FaviconGenerator = () => {
  return (
    <FaviconGeneratorErrorBoundary>
      <FaviconGeneratorCore />
    </FaviconGeneratorErrorBoundary>
  )
}

export default FaviconGenerator
