import { z } from "zod"

// ==================== SVG Minify Schemas ====================

/**
 * Optimization Level schema
 */
export const optimizationLevelSchema = z.enum(["basic", "aggressive", "custom"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["svg", "minified", "gzipped", "base64"])

/**
 * Optimization Type schema
 */
export const optimizationTypeSchema = z.enum(["comments", "whitespace", "attributes", "paths", "metadata", "unused"])

/**
 * SVG Element schema
 */
export const svgElementSchema = z.object({
  tag: z.string(),
  count: z.number(),
  attributes: z.array(z.string()),
  hasChildren: z.boolean(),
})

/**
 * SVG Attribute schema
 */
export const svgAttributeSchema = z.object({
  name: z.string(),
  count: z.number(),
  totalLength: z.number(),
  canOptimize: z.boolean(),
})

/**
 * SVG Metadata schema
 */
export const svgMetadataSchema = z.object({
  viewBox: z.string(),
  width: z.string(),
  height: z.string(),
  xmlns: z.string(),
  version: z.string(),
  hasComments: z.boolean(),
  hasWhitespace: z.boolean(),
  hasUnusedElements: z.boolean(),
})

/**
 * SVG Content schema
 */
export const svgContentSchema = z.object({
  content: z.string(),
  size: z.number(),
  elements: z.array(svgElementSchema),
  attributes: z.array(svgAttributeSchema),
  metadata: svgMetadataSchema,
})

/**
 * SVG Statistics schema
 */
export const svgStatisticsSchema = z.object({
  originalSize: z.number(),
  optimizedSize: z.number(),
  compressionRatio: z.number(),
  spaceSaved: z.number(),
  elementsRemoved: z.number(),
  attributesOptimized: z.number(),
  commentsRemoved: z.number(),
  whitespaceRemoved: z.number(),
  processingTime: z.number(),
})

/**
 * SVG Settings schema
 */
export const svgSettingsSchema = z.object({
  optimizationLevel: optimizationLevelSchema,
  removeComments: z.boolean(),
  removeWhitespace: z.boolean(),
  removeUnusedElements: z.boolean(),
  optimizeAttributes: z.boolean(),
  simplifyPaths: z.boolean(),
  removeMetadata: z.boolean(),
  exportFormat: exportFormatSchema,
  preserveAccessibility: z.boolean(),
})

/**
 * SVG Data schema
 */
export const svgDataSchema = z.object({
  original: svgContentSchema,
  optimized: svgContentSchema,
  statistics: svgStatisticsSchema,
  settings: svgSettingsSchema,
})

/**
 * SVG File schema
 */
export const svgFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  svgData: svgDataSchema.optional(),
})

/**
 * SVG Template schema
 */
export const svgTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  settings: svgSettingsSchema.partial(),
  optimizations: z.array(optimizationTypeSchema),
})

// ==================== Type Exports ====================

export type OptimizationLevel = z.infer<typeof optimizationLevelSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type OptimizationType = z.infer<typeof optimizationTypeSchema>
export type SvgElement = z.infer<typeof svgElementSchema>
export type SvgAttribute = z.infer<typeof svgAttributeSchema>
export type SvgMetadata = z.infer<typeof svgMetadataSchema>
export type SvgContent = z.infer<typeof svgContentSchema>
export type SvgStatistics = z.infer<typeof svgStatisticsSchema>
export type SvgSettings = z.infer<typeof svgSettingsSchema>
export type SvgData = z.infer<typeof svgDataSchema>
export type SvgFile = z.infer<typeof svgFileSchema>
export type SvgTemplate = z.infer<typeof svgTemplateSchema>
