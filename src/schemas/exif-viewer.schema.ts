import { z } from "zod"

// ==================== EXIF Viewer Schemas ====================

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml"])

/**
 * EXIF Category schema
 */
export const exifCategorySchema = z.enum(["basic", "camera", "exposure", "gps", "technical"])

/**
 * Image Dimensions schema
 */
export const imageDimensionsSchema = z.object({
  width: z.number(),
  height: z.number(),
  aspectRatio: z.number(),
  megapixels: z.number(),
})

/**
 * Basic Image Info schema
 */
export const basicImageInfoSchema = z.object({
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
  mimeType: z.string(),
  dimensions: imageDimensionsSchema,
  colorSpace: z.string(),
  bitDepth: z.number(),
  compression: z.string(),
  orientation: z.number(),
})

/**
 * Camera Info schema
 */
export const cameraInfoSchema = z.object({
  make: z.string(),
  model: z.string(),
  software: z.string(),
  artist: z.string(),
  copyright: z.string(),
  dateTime: z.string(),
  dateTimeOriginal: z.string(),
  dateTimeDigitized: z.string(),
  subSecTime: z.string(),
})

/**
 * Exposure Info schema
 */
export const exposureInfoSchema = z.object({
  exposureTime: z.string(),
  fNumber: z.string(),
  exposureProgram: z.string(),
  iso: z.number(),
  exposureBias: z.string(),
  meteringMode: z.string(),
  flash: z.string(),
  focalLength: z.string(),
  focalLengthIn35mm: z.string(),
  whiteBalance: z.string(),
  sceneCaptureType: z.string(),
})

/**
 * GPS Info schema
 */
export const gpsInfoSchema = z.object({
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  altitude: z.number().nullable(),
  latitudeRef: z.string(),
  longitudeRef: z.string(),
  altitudeRef: z.string(),
  timestamp: z.string(),
  datestamp: z.string(),
  mapDatum: z.string(),
  processingMethod: z.string(),
})

/**
 * Technical Info schema
 */
export const technicalInfoSchema = z.object({
  colorSpace: z.string(),
  pixelXDimension: z.number(),
  pixelYDimension: z.number(),
  resolutionUnit: z.string(),
  xResolution: z.number(),
  yResolution: z.number(),
  yCbCrPositioning: z.string(),
  exifVersion: z.string(),
  flashpixVersion: z.string(),
  componentConfiguration: z.string(),
  compressedBitsPerPixel: z.string(),
})

/**
 * EXIF Statistics schema
 */
export const exifStatisticsSchema = z.object({
  totalImages: z.number(),
  formatDistribution: z.record(z.string(), z.number()),
  cameraDistribution: z.record(z.string(), z.number()),
  averageFileSize: z.number(),
  averageMegapixels: z.number(),
  gpsEnabledCount: z.number(),
  processingTime: z.number(),
})

/**
 * EXIF Settings schema
 */
export const exifSettingsSchema = z.object({
  includeGPS: z.boolean(),
  includeTechnical: z.boolean(),
  includeCamera: z.boolean(),
  includeExposure: z.boolean(),
  exportFormat: exportFormatSchema,
  privacyMode: z.boolean(),
  showThumbnails: z.boolean(),
})

/**
 * EXIF Field schema
 */
export const exifFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  category: exifCategorySchema,
  required: z.boolean(),
  sensitive: z.boolean(),
})

/**
 * EXIF Data schema
 */
export const exifDataSchema = z.object({
  basicInfo: basicImageInfoSchema,
  cameraInfo: cameraInfoSchema,
  exposureInfo: exposureInfoSchema,
  gpsInfo: gpsInfoSchema,
  technicalInfo: technicalInfoSchema,
  statistics: exifStatisticsSchema,
  settings: exifSettingsSchema,
})

/**
 * EXIF File schema
 */
export const exifFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  exifData: exifDataSchema.optional(),
})

/**
 * EXIF Template schema
 */
export const exifTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  settings: exifSettingsSchema.partial(),
  fields: z.array(exifFieldSchema),
})

// ==================== Type Exports ====================

export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ExifCategory = z.infer<typeof exifCategorySchema>
export type ImageDimensions = z.infer<typeof imageDimensionsSchema>
export type BasicImageInfo = z.infer<typeof basicImageInfoSchema>
export type CameraInfo = z.infer<typeof cameraInfoSchema>
export type ExposureInfo = z.infer<typeof exposureInfoSchema>
export type GPSInfo = z.infer<typeof gpsInfoSchema>
export type TechnicalInfo = z.infer<typeof technicalInfoSchema>
export type ExifStatistics = z.infer<typeof exifStatisticsSchema>
export type ExifSettings = z.infer<typeof exifSettingsSchema>
export type ExifField = z.infer<typeof exifFieldSchema>
export type ExifData = z.infer<typeof exifDataSchema>
export type ExifFile = z.infer<typeof exifFileSchema>
export type ExifTemplate = z.infer<typeof exifTemplateSchema>
