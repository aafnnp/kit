import { z } from "zod"

// ==================== Favicon Generator Schemas ====================

/**
 * Favicon Type schema
 */
export const faviconTypeSchema = z.enum(["standard", "apple-touch", "android", "ms-application", "web-app"])

/**
 * Favicon Format schema
 */
export const faviconFormatSchema = z.enum(["ico", "png", "svg", "webp", "jpg"])

/**
 * Favicon Size schema
 */
export const faviconSizeSchema = z.union([
  z.literal(16),
  z.literal(32),
  z.literal(48),
  z.literal(64),
  z.literal(96),
  z.literal(128),
  z.literal(152),
  z.literal(167),
  z.literal(180),
  z.literal(192),
  z.literal(256),
  z.literal(512),
])

/**
 * Favicon Purpose schema
 */
export const faviconPurposeSchema = z.enum(["any", "maskable", "monochrome"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["zip", "individual", "html"])

/**
 * Favicon Metadata schema
 */
export const faviconMetadataSchema = z.object({
  width: z.number(),
  height: z.number(),
  colorDepth: z.number(),
  hasTransparency: z.boolean(),
  compressionRatio: z.number(),
  processingTime: z.number(),
  purpose: z.array(faviconPurposeSchema),
})

/**
 * Generated Favicon schema
 */
export const generatedFaviconSchema = z.object({
  id: z.string(),
  type: faviconTypeSchema,
  size: faviconSizeSchema,
  format: faviconFormatSchema,
  url: z.string(),
  filename: z.string(),
  fileSize: z.number(),
  quality: z.number(),
  optimized: z.boolean(),
  metadata: faviconMetadataSchema,
})

/**
 * Manifest Icon schema
 */
export const manifestIconSchema = z.object({
  src: z.string(),
  sizes: z.string(),
  type: z.string(),
  purpose: z.string().optional(),
})

/**
 * Web App Manifest schema
 */
export const webAppManifestSchema = z.object({
  name: z.string(),
  short_name: z.string(),
  description: z.string(),
  start_url: z.string(),
  display: z.string(),
  background_color: z.string(),
  theme_color: z.string(),
  icons: z.array(manifestIconSchema),
})

/**
 * Favicon Statistics schema
 */
export const faviconStatisticsSchema = z.object({
  totalFavicons: z.number(),
  typeDistribution: z.record(faviconTypeSchema, z.number()),
  formatDistribution: z.record(faviconFormatSchema, z.number()),
  averageFileSize: z.number(),
  totalPackageSize: z.number(),
  processingTime: z.number(),
  optimizationSavings: z.number(),
})

/**
 * Favicon Settings schema
 */
export const faviconSettingsSchema = z.object({
  includeStandardSizes: z.boolean(),
  includeAppleSizes: z.boolean(),
  includeAndroidSizes: z.boolean(),
  includeMSApplicationSizes: z.boolean(),
  generateManifest: z.boolean(),
  optimizeImages: z.boolean(),
  backgroundColor: z.string(),
  themeColor: z.string(),
  exportFormat: exportFormatSchema,
})

/**
 * Favicon Data schema
 */
export const faviconDataSchema = z.object({
  favicons: z.array(generatedFaviconSchema),
  statistics: faviconStatisticsSchema,
  settings: faviconSettingsSchema,
  manifest: webAppManifestSchema,
})

/**
 * Favicon File schema
 */
export const faviconFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  faviconData: faviconDataSchema.optional(),
})

/**
 * Favicon Template schema
 */
export const faviconTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  sizes: z.array(faviconSizeSchema),
  formats: z.array(faviconFormatSchema),
  settings: faviconSettingsSchema.partial(),
})

// ==================== Type Exports ====================

export type FaviconType = z.infer<typeof faviconTypeSchema>
export type FaviconFormat = z.infer<typeof faviconFormatSchema>
export type FaviconSize = z.infer<typeof faviconSizeSchema>
export type FaviconPurpose = z.infer<typeof faviconPurposeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type FaviconMetadata = z.infer<typeof faviconMetadataSchema>
export type GeneratedFavicon = z.infer<typeof generatedFaviconSchema>
export type ManifestIcon = z.infer<typeof manifestIconSchema>
export type WebAppManifest = z.infer<typeof webAppManifestSchema>
export type FaviconStatistics = z.infer<typeof faviconStatisticsSchema>
export type FaviconSettings = z.infer<typeof faviconSettingsSchema>
export type FaviconData = z.infer<typeof faviconDataSchema>
export type FaviconFile = z.infer<typeof faviconFileSchema>
export type FaviconTemplate = z.infer<typeof faviconTemplateSchema>
