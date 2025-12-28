// ==================== Audio Convert Types ====================

/**
 * Audio Metadata type
 */
export interface audioMetadata {
  title?: string
  artist?: string
  album?: string
  year?: number
  genre?: string
  track?: number
}

/**
 * Audio Stats type
 */
export interface audioStats {
  duration: number,
  bitrate: number,
  sampleRate: number,
  channels: number,
  fileSize: number,
  format: string
  codec?: string
  metadata?: audioMetadata
}

/**
 * Convert Settings type
 */
export interface convertSettings {
  format: "mp3" | "wav" | "aac" | "ogg" | "flac" | "m4a" | "wma" | "webm",
  bitrate: number,
  sampleRate: number
  channels?: number
  quality?: number
  preserveMetadata: boolean,
  normalizeAudio: boolean
  fadeIn?: number
  fadeOut?: number
  trimStart?: number
  trimEnd?: number
}

/**
 * Convert Result type
 */
export interface convertResult {
  url: string,
  size: number,
  format: string,
  duration: number
  bitrate?: number
  sampleRate?: number
  channels?: number
}

/**
 * Audio File type
 */
export interface audioFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: "pending" | "processing" | "completed" | "error"
  error?: string
  timestamp: number
  url: string
  convertedUrl?: string
  stats: audioStats
  originalFormat: string
  convertResult?: convertResult
  processingTime?: number
}

/**
 * Audio Validation Result type
 */
export interface audioValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
  supportedFormats?: string[]
  maxSize?: number
}

/**
 * Audio Format Info type
 */
export interface audioFormatInfo {
  name: string
  extension: string
  description: string
  supportsLossless: boolean
  supportsLossy: boolean
  supportsMetadata: boolean
  maxQuality: number
  useCase: string
  pros: string[]
  cons: string[]
}

/**
 * Audio Template type
 */
export interface audioTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  popularity: number
  settings: convertSettings
  useCase: string
  pros: string[]
  cons: string[]
}

/**
 * Audio Conversion Stats type
 */
export interface audioConversionStats {
  totalFiles: number
  processingTime: number
  averageProcessingTime: number
  totalSize: number
  averageSize: number
  totalOriginalSize: number
  totalConvertedSize: number
  totalSavings: number
  averageSizeReduction: number
  averageBitrateReduction: number
  formatDistribution: Record<string, number>
  qualityMetrics: {
    averageQuality: number
    compressionEfficiency: number
    formatOptimization: number
  }
}

/**
 * Audio History Entry type
 */
export interface audioHistoryEntry {
  id: string
  timestamp: number
  description: string
  settings: convertSettings
  stats: audioConversionStats
  fileCount: number
  totalSavings: number
}

// ==================== Type Exports ====================

export type AudioMetadata = audioMetadata
export type AudioStats = audioStats
export type ConvertSettings = convertSettings
export type ConvertResult = convertResult
export type AudioFile = audioFile
export type AudioValidationResult = audioValidationResult
export type AudioTemplate = audioTemplate
export type AudioFormatInfo = audioFormatInfo
export type AudioConversionStats = audioConversionStats
export type AudioHistoryEntry = audioHistoryEntry
