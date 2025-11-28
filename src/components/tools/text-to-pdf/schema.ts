import { z } from "zod"

// ==================== Text to PDF Schemas ====================

/**
 * Page Size schema
 */
export const pageSizeSchema = z.enum(["A4", "A3", "A5", "Letter", "Legal", "Tabloid"])

/**
 * Font Family schema
 */
export const fontFamilySchema = z.enum(["Arial", "Times", "Courier", "Helvetica", "Georgia", "Verdana"])

/**
 * Text Align schema
 */
export const textAlignSchema = z.enum(["left", "center", "right", "justify"])

/**
 * PDF Settings schema
 */
export const pdfSettingsSchema = z.object({
  pageSize: pageSizeSchema,
  orientation: z.enum(["portrait", "landscape"]),
  margins: z.object({
    top: z.number(),
    right: z.number(),
    bottom: z.number(),
    left: z.number(),
  }),
  font: z.object({
    family: fontFamilySchema,
    size: z.number(),
    lineHeight: z.number(),
  }),
  styling: z.object({
    textAlign: textAlignSchema,
    textColor: z.string(),
    backgroundColor: z.string(),
    enableSyntaxHighlighting: z.boolean(),
  }),
  header: z.object({
    enabled: z.boolean(),
    text: z.string(),
    fontSize: z.number(),
    alignment: textAlignSchema,
  }),
  footer: z.object({
    enabled: z.boolean(),
    text: z.string(),
    fontSize: z.number(),
    alignment: textAlignSchema,
    showPageNumbers: z.boolean(),
  }),
  tableOfContents: z.object({
    enabled: z.boolean(),
    title: z.string(),
    maxDepth: z.number(),
  }),
  metadata: z.object({
    title: z.string(),
    author: z.string(),
    subject: z.string(),
    keywords: z.string(),
  }),
})

/**
 * PDF Result schema
 */
export const pdfResultSchema = z.object({
  blob: z.instanceof(Blob),
  url: z.string(),
  filename: z.string(),
  size: z.number(),
  pageCount: z.number(),
  generationTime: z.number(),
  settings: pdfSettingsSchema,
})

/**
 * Text File schema
 */
export const textFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  pdfResult: pdfResultSchema.optional(),
})

/**
 * PDF Statistics schema
 */
export const pdfStatisticsSchema = z.object({
  totalFiles: z.number(),
  totalPages: z.number(),
  totalSize: z.number(),
  averageGenerationTime: z.number(),
  successfulConversions: z.number(),
  failedConversions: z.number(),
})

/**
 * PDF Template schema
 */
export const pdfTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  settings: pdfSettingsSchema.partial(),
  preview: z.string(),
})

// ==================== Type Exports ====================

export type PageSize = z.infer<typeof pageSizeSchema>
export type FontFamily = z.infer<typeof fontFamilySchema>
export type TextAlign = z.infer<typeof textAlignSchema>
export type PDFSettings = z.infer<typeof pdfSettingsSchema>
export type PDFResult = z.infer<typeof pdfResultSchema>
export type TextFile = z.infer<typeof textFileSchema>
export type PDFStatistics = z.infer<typeof pdfStatisticsSchema>
export type PDFTemplate = z.infer<typeof pdfTemplateSchema>
