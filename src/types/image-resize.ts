// Image Resize 相关类型声明
export interface ImageFile {
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
  timestamp: number
  processingTime?: number
  format?: string
  aspectRatio?: number
}

export interface ResizeSettings {
  width: number
  height: number
  maintainAspectRatio: boolean
  resizeMode: 'exact' | 'fit' | 'fill' | 'stretch'
  format: 'png' | 'jpeg' | 'webp'
  quality: number
  backgroundColor: string
  interpolation: 'nearest' | 'bilinear' | 'bicubic' | 'lanczos'
  sharpen: boolean
  removeMetadata: boolean
}

export interface PresetDimension {
  name: string
  width: number
  height: number
  category: 'social' | 'web' | 'print' | 'video' | 'mobile'
  description: string
  aspectRatio: string
  useCase: string
}

export interface ResizeStats {
  totalOriginalSize: number
  totalResizedSize: number
  totalSavings: number
  averageSizeReduction: number
  processingTime: number
  imagesProcessed: number
  averageFileSize: number
  largestIncrease: number
  largestDecrease: number
  dimensionChanges: {
    averageWidthChange: number
    averageHeightChange: number
    aspectRatioChanges: number
  }
}

export interface HistoryEntry {
  id: string
  timestamp: number
  settings: ResizeSettings
  stats: ResizeStats
  imageCount: number
  totalSavings: number
  description: string
}
