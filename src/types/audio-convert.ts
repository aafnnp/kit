// Audio Convert 相关类型声明
import { BaseFile, BaseStats, HistoryEntryBase, BaseTemplate, BaseAnalysisData, QualityMetrics } from './common'

export interface AudioFile extends BaseFile {
  url?: string
  convertedUrl?: string
  stats?: AudioStats
  convertResult?: ConvertResult
  originalFormat: string
  targetFormat?: string
  compressionRatio?: number
  qualityScore?: number
}

export interface AudioStats {
  duration: number // 秒
  bitrate: number
  sampleRate: number
  channels: number
  fileSize: number
  format: string
  codec?: string
  metadata?: AudioMetadata
}

export interface AudioMetadata {
  title?: string
  artist?: string
  album?: string
  year?: number
  genre?: string
  track?: number
}

export interface ConvertSettings {
  format: 'mp3' | 'wav' | 'aac' | 'ogg' | 'flac' | 'm4a' | 'wma' | 'webm'
  bitrate: number // kbps
  sampleRate: number // Hz
  channels?: number
  quality?: number
  preserveMetadata: boolean
  normalizeAudio: boolean
  fadeIn?: number
  fadeOut?: number
  trimStart?: number
  trimEnd?: number
}

export interface ConvertResult {
  url: string
  size: number
  format: string
  duration: number
  bitrate?: number
  sampleRate?: number
  channels?: number
}

export interface AudioConversionStats extends BaseStats {
  totalOriginalSize: number
  totalConvertedSize: number
  totalSavings: number
  averageSizeReduction: number
  averageBitrateReduction: number
  formatDistribution: Record<string, number>
  qualityMetrics: QualityMetrics
}

export interface AudioTemplate extends BaseTemplate {
  settings: ConvertSettings
  useCase: string
  pros: string[]
  cons: string[]
}

export interface AudioHistoryEntry extends HistoryEntryBase {
  settings: ConvertSettings
  stats: AudioConversionStats
  fileCount: number
  totalSavings: number
}

export interface AudioAnalysisData extends BaseAnalysisData {
  bitrateDistribution: Record<string, number>
  durationDistribution: Record<string, number>
  channelDistribution: Record<string, number>
  codecDistribution: Record<string, number>
}

export interface AudioValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
  supportedFormats?: string[]
  maxSize?: number
}

export interface AudioProcessingProgress {
  current: number
  total: number
  percentage: number
  currentFile?: string
  stage?: 'loading' | 'analyzing' | 'converting' | 'finalizing'
  estimatedTimeRemaining?: number
}
// 音频格式信息
export interface AudioFormatInfo {
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