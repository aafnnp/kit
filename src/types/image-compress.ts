// Image Compress 相关类型声明
export interface ImageFile {
  id: string
  file: File
  originalUrl: string
  compressedUrl?: string
  originalSize: number
  compressedSize?: number
  compressionRatio?: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  dimensions?: { width: number; height: number }
  format?: string
  timestamp: number
  processingTime?: number
}

export interface CompressionSettings {
  quality: number
  format: 'jpeg' | 'png' | 'webp'
  maxWidth?: number
  maxHeight?: number
  maintainAspectRatio: boolean
  enableProgressive: boolean
  removeMetadata: boolean
  resizeMethod: 'lanczos' | 'bilinear' | 'bicubic'
  colorSpace: 'srgb' | 'p3' | 'rec2020'
  dithering: boolean
}

export interface CompressionStats {
  totalOriginalSize: number
  totalCompressedSize: number
  totalSavings: number
  averageCompressionRatio: number
  processingTime: number
  imagesProcessed: number
  averageFileSize: number
  largestReduction: number
  smallestReduction: number
}

export interface CompressionTemplate {
  id: string
  name: string
  description: string
  settings: CompressionSettings
  category: 'web' | 'print' | 'mobile' | 'social' | 'custom'
  useCase: string
  estimatedSavings: string
}

export interface HistoryEntry {
  id: string
  timestamp: number
  settings: CompressionSettings
  stats: CompressionStats
  imageCount: number
  totalSavings: number
  description: string
}
