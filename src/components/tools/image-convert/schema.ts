// ==================== Image Convert Types ====================

/**
 * Image File type
 */
export interface imageFile {
  id: string,
  file: File,
  originalUrl: string
  convertedUrl?: string
  originalSize: number
  convertedSize?: number
  originalFormat: string,
  targetFormat: string,
  originalDimensions: {
    width: number,
    height: number,
  },
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  timestamp: number
  processingTime?: number
  compressionRatio?: number
  qualityScore?: number
}
/**
 * Conversion Settings type
 */
export interface conversionSettings {
  targetFormat: "png"| "jpeg" | "webp" | "gif" | "bmp" | "tiff",
  quality: number,
  preserveTransparency: boolean,
  backgroundColor: string,
  colorProfile: "sRGB" | "P3" | "Rec2020",
  dithering: boolean,
  progressive: boolean,
  lossless: boolean,
  resizeMode: "none"| "scale" | "crop" | "fit"
  targetWidth?: number
  targetHeight?: number
  removeMetadata: boolean,
  optimizeForWeb: boolean,
}

/**
 * Format Info type
 */
export interface formatInfo {
  name: string,
  extension: string,
  mimeType: string,
  supportsTransparency: boolean,
  supportsAnimation: boolean,
  supportsLossless: boolean,
  supportsLossy: boolean,
  description: string,
  maxQuality: number,
  useCase: string,
  pros: string[],
  cons: string[],
}

/**
 * Conversion Stats type
 */
export interface conversionStats {
  totalOriginalSize: number,
  totalConvertedSize: number,
  totalSavings: number,
  averageSizeChange: number,
  formatDistribution: Record<string, number>,
  processingTime: number,
  imagesProcessed: number,
  averageFileSize: number,
  largestIncrease: number,
  largestDecrease: number,
  qualityMetrics: {
    averageQuality: number,
  compressionEfficiency: number,
    formatOptimization: number,
}
}
/**
 * History Entry type
 */
export interface historyEntry {
  id: string,
  timestamp: number,
  settings: conversionSettings,
  stats: conversionStats,
  imageCount: number,
  totalSavings: number,
  description: string,
}

// ==================== Type Exports ====================

export type ImageFile = imageFile
export type ConversionSettings = conversionSettings
export type FormatInfo = formatInfo
export type ConversionStats = conversionStats
export type HistoryEntry = historyEntry
