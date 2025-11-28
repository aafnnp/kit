import { z } from "zod"
import {
  baseFileSchema,
  baseStatsSchema,
  historyEntryBaseSchema,
  baseTemplateSchema,
  baseAnalysisDataSchema,
  qualityMetricsSchema,
} from "@/schemas/common.schema"

// ==================== Audio Convert Schemas ====================

/**
 * Audio Metadata schema
 */
export const audioMetadataSchema = z.object({
  title: z.string().optional(),
  artist: z.string().optional(),
  album: z.string().optional(),
  year: z.number().optional(),
  genre: z.string().optional(),
  track: z.number().optional(),
})

/**
 * Audio Stats schema
 */
export const audioStatsSchema = z.object({
  duration: z.number(),
  bitrate: z.number(),
  sampleRate: z.number(),
  channels: z.number(),
  fileSize: z.number(),
  format: z.string(),
  codec: z.string().optional(),
  metadata: audioMetadataSchema.optional(),
})

/**
 * Convert Settings schema
 */
export const convertSettingsSchema = z.object({
  format: z.enum(["mp3", "wav", "aac", "ogg", "flac", "m4a", "wma", "webm"]),
  bitrate: z.number(),
  sampleRate: z.number(),
  channels: z.number().optional(),
  quality: z.number().optional(),
  preserveMetadata: z.boolean(),
  normalizeAudio: z.boolean(),
  fadeIn: z.number().optional(),
  fadeOut: z.number().optional(),
  trimStart: z.number().optional(),
  trimEnd: z.number().optional(),
})

/**
 * Convert Result schema
 */
export const convertResultSchema = z.object({
  url: z.string(),
  size: z.number(),
  format: z.string(),
  duration: z.number(),
  bitrate: z.number().optional(),
  sampleRate: z.number().optional(),
  channels: z.number().optional(),
})

/**
 * Audio File schema
 */
export const audioFileSchema = baseFileSchema.extend({
  url: z.string().optional(),
  convertedUrl: z.string().optional(),
  stats: audioStatsSchema.optional(),
  convertResult: convertResultSchema.optional(),
  originalFormat: z.string(),
  targetFormat: z.string().optional(),
  compressionRatio: z.number().optional(),
  qualityScore: z.number().optional(),
  progress: z.number().optional(),
  progressMessage: z.string().optional(),
})

/**
 * Audio Conversion Stats schema
 */
export const audioConversionStatsSchema = baseStatsSchema.extend({
  totalOriginalSize: z.number(),
  totalConvertedSize: z.number(),
  totalSavings: z.number(),
  averageSizeReduction: z.number(),
  averageBitrateReduction: z.number(),
  formatDistribution: z.record(z.string(), z.number()),
  qualityMetrics: qualityMetricsSchema,
})

/**
 * Audio Template schema
 */
export const audioTemplateSchema = baseTemplateSchema.extend({
  settings: convertSettingsSchema,
  useCase: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
})

/**
 * Audio History Entry schema
 */
export const audioHistoryEntrySchema = historyEntryBaseSchema.extend({
  settings: convertSettingsSchema,
  stats: audioConversionStatsSchema,
  fileCount: z.number(),
  totalSavings: z.number(),
})

/**
 * Audio Analysis Data schema
 */
export const audioAnalysisDataSchema = baseAnalysisDataSchema.extend({
  bitrateDistribution: z.record(z.string(), z.number()),
  durationDistribution: z.record(z.string(), z.number()),
  channelDistribution: z.record(z.string(), z.number()),
  codecDistribution: z.record(z.string(), z.number()),
})

/**
 * Audio Validation Result schema
 */
export const audioValidationResultSchema = z.object({
  isValid: z.boolean(),
  error: z.string().optional(),
  warnings: z.array(z.string()).optional(),
  supportedFormats: z.array(z.string()).optional(),
  maxSize: z.number().optional(),
})

/**
 * Audio Processing Progress schema
 */
export const audioProcessingProgressSchema = z.object({
  current: z.number(),
  total: z.number(),
  percentage: z.number(),
  currentFile: z.string().optional(),
  stage: z.enum(["loading", "analyzing", "converting", "finalizing"]).optional(),
  estimatedTimeRemaining: z.number().optional(),
})

/**
 * Audio Format Info schema
 */
export const audioFormatInfoSchema = z.object({
  name: z.string(),
  extension: z.string(),
  description: z.string(),
  supportsLossless: z.boolean(),
  supportsLossy: z.boolean(),
  supportsMetadata: z.boolean(),
  maxQuality: z.number(),
  useCase: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
})

// ==================== Type Exports ====================

export type AudioMetadata = z.infer<typeof audioMetadataSchema>
export type AudioStats = z.infer<typeof audioStatsSchema>
export type ConvertSettings = z.infer<typeof convertSettingsSchema>
export type ConvertResult = z.infer<typeof convertResultSchema>
export type AudioFile = z.infer<typeof audioFileSchema>
export type AudioConversionStats = z.infer<typeof audioConversionStatsSchema>
export type AudioTemplate = z.infer<typeof audioTemplateSchema>
export type AudioHistoryEntry = z.infer<typeof audioHistoryEntrySchema>
export type AudioAnalysisData = z.infer<typeof audioAnalysisDataSchema>
export type AudioValidationResult = z.infer<typeof audioValidationResultSchema>
export type AudioProcessingProgress = z.infer<typeof audioProcessingProgressSchema>
export type AudioFormatInfo = z.infer<typeof audioFormatInfoSchema>
