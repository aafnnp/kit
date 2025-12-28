// ==================== Image Resize Types ====================

/**
 * Image File type
 */
export interface imageFile {
  id: string,
  file: File,
  originalUrl: string
  resizedUrl?: string
  originalSize: number
  resizedSize?: number
  originalDimensions: {
    width: number,
  height: number,
  },
  resizedDimensions?: {
    width: number,
    height: number,
  },
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  timestamp: number,
  processingTime?: number,
  format?: string,
  aspectRatio: number,
}
/**
 * Resize Settings type
 */
export interface resizeSettings {
  width: number,
  height: number,
  maintainAspectRatio: boolean,
  resizeMode: "exact"| "fit" | "fill" | "stretch",
  format: "png"| "jpeg" | "webp",
  quality: number,
  backgroundColor: string,
  interpolation: "nearest"| "bilinear" | "bicubic" | "lanczos",
  sharpen: boolean,
  removeMetadata: boolean,
}

/**
 * Preset Dimension type
 */
export interface presetDimension {
  name: string,
  width: number,
  height: number,
  category: "social"| "web" | "print" | "video" | "mobile",
  description: string,
  aspectRatio: string,
  useCase: string,
}

/**
 * Resize Stats type
 */
export interface resizeStats {
  totalOriginalSize: number,
  totalResizedSize: number,
  totalSavings: number,
  averageSizeReduction: number,
  processingTime: number,
  imagesProcessed: number,
  averageFileSize: number,
  largestIncrease: number,
  largestDecrease: number,
  dimensionChanges: {
    averageWidthChange: number,
  averageHeightChange: number,
    aspectRatioChanges: number,
}
}
/**
 * History Entry type
 */
export interface historyEntry {
  id: string,
  timestamp: number,
  settings: resizeSettings,
  stats: resizeStats,
  imageCount: number,
  totalSavings: number,
  description: string,
}

// ==================== Type Exports ====================

export type ImageFile = imageFile
export type ResizeSettings = resizeSettings
export type PresetDimension = presetDimension
export type ResizeStats = resizeStats
export type HistoryEntry = historyEntry
