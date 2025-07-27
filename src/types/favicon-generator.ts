// Favicon Generator 相关类型声明
export interface FaviconFile {
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

export interface FaviconData {
  favicons: GeneratedFavicon[]
  statistics: FaviconStatistics
  settings: FaviconSettings
  manifest: WebAppManifest
}

export interface GeneratedFavicon {
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

export interface FaviconMetadata {
  width: number
  height: number
  colorDepth: number
  hasTransparency: boolean
  compressionRatio: number
  processingTime: number
  purpose: FaviconPurpose[]
}

export interface FaviconStatistics {
  totalFavicons: number
  typeDistribution: Record<FaviconType, number>
  formatDistribution: Record<FaviconFormat, number>
  averageFileSize: number
  totalPackageSize: number
  processingTime: number
  optimizationSavings: number
}

export interface FaviconSettings {
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

export interface WebAppManifest {
  name: string
  short_name: string
  description: string
  start_url: string
  display: string
  background_color: string
  theme_color: string
  icons: ManifestIcon[]
}

export interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

export interface FaviconTemplate {
  id: string
  name: string
  description: string
  category: string
  sizes: FaviconSize[]
  formats: FaviconFormat[]
  settings: Partial<FaviconSettings>
}

export type FaviconType = 'standard' | 'apple-touch' | 'android' | 'ms-application' | 'web-app'
export type FaviconFormat = 'ico' | 'png' | 'svg' | 'webp' | 'jpg'
export type FaviconSize = 16 | 32 | 48 | 64 | 96 | 128 | 152 | 167 | 180 | 192 | 256 | 512
export type FaviconPurpose = 'any' | 'maskable' | 'monochrome'
export type ExportFormat = 'zip' | 'individual' | 'html'
