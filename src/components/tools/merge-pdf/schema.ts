import { z } from "zod"

// ==================== Merge PDF Schemas ====================

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["pdf", "zip"])

/**
 * Page Order schema
 */
export const pageOrderSchema = z.enum(["original", "reverse", "custom"])

/**
 * Quality schema
 */
export const qualitySchema = z.enum(["high", "medium", "low"])

/**
 * Watermark Position schema
 */
export const watermarkPositionSchema = z.enum(["center", "top-left", "top-right", "bottom-left", "bottom-right"])

/**
 * PDF Permissions schema
 */
export const pdfPermissionsSchema = z.object({
  canPrint: z.boolean(),
  canModify: z.boolean(),
  canCopy: z.boolean(),
  canAnnotate: z.boolean(),
  canFillForms: z.boolean(),
  canExtractForAccessibility: z.boolean(),
  canAssemble: z.boolean(),
  canPrintHighQuality: z.boolean(),
})

/**
 * PDF Page Info schema
 */
export const pdfPageInfoSchema = z.object({
  pageNumber: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  selected: z.boolean(),
  thumbnail: z.string().optional(),
})

/**
 * PDF Metadata schema
 */
export const pdfMetadataSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  subject: z.string().optional(),
  creator: z.string().optional(),
  producer: z.string().optional(),
  creationDate: z.date().optional(),
  modificationDate: z.date().optional(),
  keywords: z.array(z.string()).optional(),
  pageCount: z.number(),
  fileSize: z.number(),
  version: z.string().optional(),
  encrypted: z.boolean(),
  permissions: pdfPermissionsSchema.optional(),
})

/**
 * PDF File schema
 */
export const pdfFileSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  name: z.string(),
  size: z.number(),
  pageCount: z.number().optional(),
  isValid: z.boolean(),
  error: z.string().optional(),
  thumbnail: z.string().optional(),
  metadata: pdfMetadataSchema.optional(),
  pages: z.array(pdfPageInfoSchema).optional(),
  createdAt: z.date(),
})

/**
 * Page Range schema
 */
export const pageRangeSchema = z.object({
  fileId: z.string(),
  startPage: z.number(),
  endPage: z.number(),
})

/**
 * Watermark Settings schema
 */
export const watermarkSettingsSchema = z.object({
  enabled: z.boolean(),
  text: z.string(),
  opacity: z.number(),
  position: watermarkPositionSchema,
  fontSize: z.number(),
  color: z.string(),
})

/**
 * Security Settings schema
 */
export const securitySettingsSchema = z.object({
  enabled: z.boolean(),
  userPassword: z.string().optional(),
  ownerPassword: z.string().optional(),
  permissions: pdfPermissionsSchema,
})

/**
 * Merge Settings schema
 */
export const mergeSettingsSchema = z.object({
  outputFileName: z.string(),
  pageOrder: pageOrderSchema,
  includeBookmarks: z.boolean(),
  includeMetadata: z.boolean(),
  optimizeSize: z.boolean(),
  removeBlankPages: z.boolean(),
  pageRange: z.array(pageRangeSchema).optional(),
  watermark: watermarkSettingsSchema.optional(),
  security: securitySettingsSchema.optional(),
  quality: qualitySchema,
  compression: z.boolean(),
})

/**
 * Merge Statistics schema
 */
export const mergeStatisticsSchema = z.object({
  totalFiles: z.number(),
  totalPages: z.number(),
  totalSize: z.number(),
  compressionRatio: z.number(),
  processingTime: z.number(),
  qualityScore: z.number(),
  optimizationSavings: z.number(),
})

/**
 * Merge Result schema
 */
export const mergeResultSchema = z.object({
  fileName: z.string(),
  fileSize: z.number(),
  pageCount: z.number(),
  processingTime: z.number(),
  downloadUrl: z.string().optional(),
  statistics: mergeStatisticsSchema,
})

/**
 * Merge Operation schema
 */
export const mergeOperationSchema = z.object({
  id: z.string(),
  files: z.array(pdfFileSchema),
  settings: mergeSettingsSchema,
  result: mergeResultSchema.optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  progress: z.number(),
  error: z.string().optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
})

/**
 * Processing Settings schema
 */
export const processingSettingsSchema = z.object({
  maxFileSize: z.number(),
  maxFiles: z.number(),
  allowedFormats: z.array(z.string()),
  autoOptimize: z.boolean(),
  preserveQuality: z.boolean(),
  enableParallelProcessing: z.boolean(),
  exportFormat: exportFormatSchema,
  realTimePreview: z.boolean(),
})

/**
 * PDF Template schema
 */
export const pdfTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  settings: mergeSettingsSchema.partial(),
  useCase: z.array(z.string()),
  examples: z.array(z.string()),
})

/**
 * PDF Error schema
 */
export const pdfErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["format", "size", "corruption", "security", "compatibility"]),
  severity: z.enum(["error", "warning", "info"]),
})

/**
 * PDF Validation schema
 */
export const pdfValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(pdfErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// ==================== Type Exports ====================

export type ExportFormat = z.infer<typeof exportFormatSchema>
export type PageOrder = z.infer<typeof pageOrderSchema>
export type Quality = z.infer<typeof qualitySchema>
export type WatermarkPosition = z.infer<typeof watermarkPositionSchema>
export type PDFPermissions = z.infer<typeof pdfPermissionsSchema>
export type PDFPageInfo = z.infer<typeof pdfPageInfoSchema>
export type PDFMetadata = z.infer<typeof pdfMetadataSchema>
export type PDFFile = z.infer<typeof pdfFileSchema>
export type PageRange = z.infer<typeof pageRangeSchema>
export type WatermarkSettings = z.infer<typeof watermarkSettingsSchema>
export type SecuritySettings = z.infer<typeof securitySettingsSchema>
export type MergeSettings = z.infer<typeof mergeSettingsSchema>
export type MergeStatistics = z.infer<typeof mergeStatisticsSchema>
export type MergeResult = z.infer<typeof mergeResultSchema>
export type MergeOperation = z.infer<typeof mergeOperationSchema>
export type ProcessingSettings = z.infer<typeof processingSettingsSchema>
export type PDFTemplate = z.infer<typeof pdfTemplateSchema>
export type PDFError = z.infer<typeof pdfErrorSchema>
export type PDFValidation = z.infer<typeof pdfValidationSchema>
