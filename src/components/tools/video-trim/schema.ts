import { z } from "zod"

// ==================== Video Trim Schemas ====================

/**
 * Video Stats schema
 */
export const videoStatsSchema = z.object({
  duration: z.number(),
  width: z.number(),
  height: z.number(),
  bitrate: z.number(),
  fileSize: z.number(),
  format: z.string(),
})

/**
 * Trim Settings schema
 */
export const trimSettingsSchema = z.object({
  start: z.number(),
  end: z.number(),
  format: z.enum(["mp4", "webm", "mov"]),
})

/**
 * Trim Result schema
 */
export const trimResultSchema = z.object({
  url: z.string(),
  size: z.number(),
  format: z.string(),
  duration: z.number(),
})

/**
 * Video File schema
 */
export const videoFileSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  url: z.string().optional(),
  trimmedUrl: z.string().optional(),
  stats: videoStatsSchema.optional(),
  trimResult: trimResultSchema.optional(),
})

// ==================== Type Exports ====================

export type VideoStats = z.infer<typeof videoStatsSchema>
export type TrimSettings = z.infer<typeof trimSettingsSchema>
export type TrimResult = z.infer<typeof trimResultSchema>
export type VideoFile = z.infer<typeof videoFileSchema>
