// Image Convert 相关类型声明
export interface ImageFile {
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

export interface ConversionSettings {
  targetFormat: 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp' | 'tiff'
  quality: number
  preserveTransparency: boolean
  backgroundColor: string
  colorProfile: 'sRGB' | 'P3' | 'Rec2020'
  dithering: boolean
  progressive: boolean
  lossless: boolean
  resizeMode: 'none' | 'scale' | 'crop' | 'fit'
  targetWidth?: number
  targetHeight?: number
  removeMetadata: boolean
  optimizeForWeb: boolean
}

export interface FormatInfo {
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

export interface ConversionStats {
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

export interface HistoryEntry {
  id: string
  timestamp: number
  settings: ConversionSettings
  stats: ConversionStats
  imageCount: number
  totalSavings: number
  description: string
}
