// ==================== Image Compress Types ====================

/**
 * Compression Settings type
 */
export interface compressionSettings {
  quality: number,
  format: "jpeg"| "png" | "webp"
  maxWidth?: number
  maxHeight?: number
  maintainAspectRatio: boolean,
  enableProgressive: boolean,
  removeMetadata: boolean,
  resizeMethod: "lanczos"| "bilinear" | "bicubic",
  colorSpace: "srgb"| "p3" | "rec2020",
  dithering: boolean,
}

/**
 * Image File type
 */
export interface imageFile {
  id: string,
  file: File,
  originalUrl: string
  compressedUrl?: string
  originalSize: number
  compressedSize?: number
  compressionRatio?: number
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  dimensions?: {
    width: number,
    height: number,
  },
  width?: number,
  height?: number
  format?: string,
  timestamp: number,
  processingTime?: number,
}
/**
 * Compression Stats type
 */
export interface compressionStats {
  totalOriginalSize: number,
  totalCompressedSize: number,
  totalSavings: number,
  averageCompressionRatio: number,
  processingTime: number,
  imagesProcessed: number,
  averageFileSize: number,
  largestReduction: number,
  smallestReduction: number,
}

/**
 * Compression Template type
 */
export interface compressionTemplate {
  id: string,
  name: string,
  description: string,
  settings: compressionSettings,
  category: "web"| "print" | "mobile" | "social" | "custom",
  useCase: string,
  estimatedSavings: string,
}

/**
 * History Entry type
 */
export interface historyEntry {
  id: string,
  timestamp: number,
  settings: compressionSettings,
  stats: compressionStats,
  imageCount: number,
  totalSavings: number,
  description: string,
}

// ==================== Type Exports ====================

export type CompressionSettings = compressionSettings
export type ImageFile = imageFile
export type CompressionStats = compressionStats
export type CompressionTemplate = compressionTemplate
export type HistoryEntry = historyEntry
