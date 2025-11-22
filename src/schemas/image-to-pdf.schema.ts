import { z } from "zod"

// ==================== Image to PDF Schemas ====================

/**
 * Image to PDF File schema
 */
export const imageToPdfFileSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  url: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
})

/**
 * Image to PDF Settings schema
 */
export const imageToPdfSettingsSchema = z.object({
  pageSize: z.enum(["A4", "A5", "Letter", "Legal"]),
  orientation: z.enum(["portrait", "landscape"]),
  margin: z.number(),
  quality: z.number(),
  batch: z.boolean(),
})

/**
 * Image to PDF Stats schema
 */
export const imageToPdfStatsSchema = z.object({
  totalImages: z.number(),
  totalSize: z.number(),
  pdfSize: z.number().optional(),
  pageCount: z.number().optional(),
})

// ==================== Type Exports ====================

export type ImageToPdfFile = z.infer<typeof imageToPdfFileSchema>
export type ImageToPdfSettings = z.infer<typeof imageToPdfSettingsSchema>
export type ImageToPdfStats = z.infer<typeof imageToPdfStatsSchema>
