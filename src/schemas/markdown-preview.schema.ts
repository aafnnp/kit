import { z } from "zod"

// ==================== Markdown Preview Schemas ====================

/**
 * Markdown Statistics schema
 */
export const markdownStatisticsSchema = z.object({
  wordCount: z.number(),
  characterCount: z.number(),
  lineCount: z.number(),
  paragraphCount: z.number(),
  headingCount: z.number(),
  linkCount: z.number(),
  imageCount: z.number(),
  codeBlockCount: z.number(),
  listItemCount: z.number(),
  tableCount: z.number(),
  readingTime: z.number(),
})

/**
 * Markdown File schema
 */
export const markdownFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  htmlContent: z.string().optional(),
  statistics: markdownStatisticsSchema.optional(),
})

/**
 * Preview Settings schema
 */
export const previewSettingsSchema = z.object({
  viewMode: z.enum(["split", "preview", "source"]),
  theme: z.enum(["light", "dark", "auto"]),
  fontSize: z.enum(["small", "medium", "large"]),
  lineNumbers: z.boolean(),
  wordWrap: z.boolean(),
  syntaxHighlighting: z.boolean(),
  mathSupport: z.boolean(),
  mermaidSupport: z.boolean(),
  tableOfContents: z.boolean(),
  autoSave: z.boolean(),
})

/**
 * Export Options schema
 */
export const exportOptionsSchema = z.object({
  format: z.enum(["html", "pdf", "txt", "docx"]),
  includeCSS: z.boolean(),
  includeTableOfContents: z.boolean(),
  pageBreaks: z.boolean(),
  customCSS: z.string().optional(),
})

// ==================== Type Exports ====================

export type MarkdownStatistics = z.infer<typeof markdownStatisticsSchema>
export type MarkdownFile = z.infer<typeof markdownFileSchema>
export type PreviewSettings = z.infer<typeof previewSettingsSchema>
export type ExportOptions = z.infer<typeof exportOptionsSchema>

