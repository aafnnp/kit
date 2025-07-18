// Image Crop 相关类型声明
export interface ImageFile {
  id: string
  file: File
  originalUrl: string
  croppedUrl?: string
  originalSize: number
  croppedSize?: number
  originalDimensions: { width: number; height: number }
  croppedDimensions?: { width: number; height: number }
  cropArea: CropArea
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  timestamp: number
  processingTime?: number
  compressionRatio?: number
  qualityScore?: number
  cropPercentage?: number
  templateUsed?: string
}

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface CropSettings {
  aspectRatio: 'free' | '1:1' | '16:9' | '4:3' | '3:2' | '2:3' | '9:16' | 'custom'
  customAspectRatio?: { width: number; height: number }
  outputFormat: 'png' | 'jpeg' | 'webp'
  quality: number
  maintainOriginalSize: boolean
  cropPosition: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom'
  backgroundColor: string
  preserveMetadata: boolean
  optimizeForWeb: boolean
  enableSmartCrop: boolean
  cropPadding: number
}

export interface AspectRatioPreset {
  name: string
  value: string
  ratio: number
  description: string
  icon?: string
  useCase: string
  pros: string[]
  cons: string[]
}

export interface CropTemplate {
  id: string
  name: string
  description: string
  settings: Partial<CropSettings>
  cropArea?: Partial<CropArea>
  category: 'social' | 'print' | 'web' | 'mobile' | 'custom'
  tags: string[]
  popularity: number
}

export interface CropStats {
  totalOriginalSize: number
  totalCroppedSize: number
  totalSavings: number
  averageSizeReduction: number
  averageCropPercentage: number
  processingTime: number
  imagesProcessed: number
  averageFileSize: number
  largestReduction: number
  smallestReduction: number
  qualityMetrics: {
    averageQuality: number
    compressionEfficiency: number
    cropOptimization: number
  }
}

export interface HistoryEntry {
  id: string
  timestamp: number
  settings: CropSettings
  stats: CropStats
  imageCount: number
  totalSavings: number
  description: string
}
