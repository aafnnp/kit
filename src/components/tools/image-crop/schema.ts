// ==================== Image Crop Types ====================

/**
 * Crop Area type
 */
export interface cropArea {
  x: number,
  y: number,
  width: number,
  height: number,
}

/**
 * Crop Settings type
 */
export interface cropSettings {
  aspectRatio: "free"| "1:1" | "16:9" | "4:3" | "3:2" | "2:3" | "9:16" | "custom",
  customAspectRatio?: {
    width: number,
    height: number,
  },
  width: number,
  height: number,
  outputFormat: "png"| "jpeg" | "webp",
  quality: number,
  maintainOriginalSize: boolean,
  cropPosition: "center"| "top-left" | "top-right" | "bottom-left" | "bottom-right" | "custom",
  backgroundColor: string,
  preserveMetadata: boolean,
  optimizeForWeb: boolean,
  enableSmartCrop: boolean,
  cropPadding: number,
}
/**
 * Aspect Ratio Preset type
 */
export interface aspectRatioPreset {
  name: string,
  value: string,
  ratio: number,
  description: string
  icon?: string
  useCase: string,
  pros: string[],
  cons: string[],
}

/**
 * Crop Template type
 */
export interface cropTemplate {
  id: string,
  name: string,
  description: string,
  settings: Partial<cropSettings>
  cropArea?: cropArea
  category: "social"| "print" | "web" | "mobile" | "custom",
  tags: string[],
  popularity: number,
}

/**
 * Crop Stats type
 */
export interface cropStats {
  totalOriginalSize: number,
  totalCroppedSize: number,
  totalSavings: number,
  averageSizeReduction: number,
  averageCropPercentage: number,
  processingTime: number,
  imagesProcessed: number,
  averageFileSize: number,
  largestReduction: number,
  smallestReduction: number,
  qualityMetrics: {
    averageQuality: number,
  compressionEfficiency: number,
  cropOptimization: number,
}
}
/**
 * Image File type
 */
export interface imageFile {
  id: string,
  file: File,
  originalUrl: string
  croppedUrl?: string
  originalSize: number
  croppedSize?: number
  originalDimensions: {
    width: number,
    height: number,
  },
  croppedDimensions?: {
    width: number,
    height: number,
  },
  cropArea: {
    x: number,
    y: number,
    width: number,
    height: number,
  },
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  timestamp: number,
  processingTime?: number,
  compressionRatio?: number,
  qualityScore?: number,
  cropPercentage?: number
  templateUsed?: string
}
/**
 * History Entry type
 */
export interface historyEntry {
  id: string,
  timestamp: number,
  settings: cropSettings,
  stats: cropStats,
  imageCount: number,
  totalSavings: number,
  description: string,
}

// ==================== Type Exports ====================

export type CropArea = cropArea
export type CropSettings = cropSettings
export type AspectRatioPreset = aspectRatioPreset
export type CropTemplate = cropTemplate
export type CropStats = cropStats
export type ImageFile = imageFile
export type HistoryEntry = historyEntry
