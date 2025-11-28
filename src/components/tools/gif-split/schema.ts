import { z } from "zod"

// ==================== GIF Split Schemas ====================

/**
 * GIF Frame schema
 */
export const gifFrameSchema = z.object({
  index: z.number(),
  imageDataUrl: z.string(),
  delay: z.number(),
  width: z.number(),
  height: z.number(),
  disposalType: z.number(),
})

/**
 * GIF Stats schema
 */
export const gifStatsSchema = z.object({
  frameCount: z.number(),
  duration: z.number(),
  width: z.number(),
  height: z.number(),
  fileSize: z.number(),
  avgDelay: z.number(),
})

/**
 * GIF File schema
 */
export const gifFileSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  frames: z.array(gifFrameSchema).optional(),
  stats: gifStatsSchema.optional(),
})

// ==================== Type Exports ====================

export type GifFrame = z.infer<typeof gifFrameSchema>
export type GifStats = z.infer<typeof gifStatsSchema>
export type GifFile = z.infer<typeof gifFileSchema>
