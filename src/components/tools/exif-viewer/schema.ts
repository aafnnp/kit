// ==================== EXIF Viewer Types ====================

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml"

/**
 * EXIF Category type
 */
export type exifCategory = "basic" | "camera" | "exposure" | "gps" | "technical"

/**
 * Image Dimensions type
 */
export interface imageDimensions {
  width: number,
  height: number,
  aspectRatio: number,
  megapixels: number,
}

/**
 * Basic Image Info type
 */
export interface basicImageInfo {
  fileName: string,
  fileSize: number,
  fileType: string,
  mimeType: string,
  dimensions: imageDimensions,
  colorSpace: string,
  bitDepth: number,
  compression: string,
  orientation: number,
}

/**
 * Camera Info type
 */
export interface cameraInfo {
  make: string,
  model: string,
  software: string,
  artist: string,
  copyright: string,
  dateTime: string,
  dateTimeOriginal: string,
  dateTimeDigitized: string,
  subSecTime: string,
}

/**
 * Exposure Info type
 */
export interface exposureInfo {
  exposureTime: string,
  fNumber: string,
  exposureProgram: string,
  iso: number,
  exposureBias: string,
  meteringMode: string,
  flash: string,
  focalLength: string,
  focalLengthIn35mm: string,
  whiteBalance: string,
  sceneCaptureType: string,
}

/**
 * GPS Info type
 */
export interface gpsInfo {
  latitude?: number
  longitude?: number
  altitude?: number
  latitudeRef: string,
  longitudeRef: string,
  altitudeRef: string,
  timestamp: string,
  datestamp: string,
  mapDatum: string,
  processingMethod: string,
}

/**
 * Technical Info type
 */
export interface technicalInfo {
  colorSpace: string,
  pixelXDimension: number,
  pixelYDimension: number,
  resolutionUnit: string,
  xResolution: number,
  yResolution: number,
  yCbCrPositioning: string,
  exifVersion: string,
  flashpixVersion: string,
  componentConfiguration: string,
  compressedBitsPerPixel: string,
}

/**
 * EXIF Statistics type
 */
export interface exifStatistics {
  totalImages: number,
  formatDistribution: Record<string, number>,
  cameraDistribution: Record<string, number>,
  averageFileSize: number,
  averageMegapixels: number,
  gpsEnabledCount: number,
  processingTime: number,
}

/**
 * EXIF Settings type
 */
export interface exifSettings {
  includeGPS: boolean,
  includeTechnical: boolean,
  includeCamera: boolean,
  includeExposure: boolean,
  exportFormat: exportFormat,
  privacyMode: boolean,
  showThumbnails: boolean,
}

/**
 * EXIF Field type
 */
export interface exifField {
  key: string,
  label: string,
  category: exifCategory,
  required: boolean,
  sensitive: boolean,
}

/**
 * EXIF Data type
 */
export interface exifData {
  basicInfo: basicImageInfo,
  cameraInfo: cameraInfo,
  exposureInfo: exposureInfo,
  gpsInfo: gpsInfo,
  technicalInfo: technicalInfo,
  statistics: exifStatistics,
  settings: exifSettings,
}

/**
 * EXIF File type
 */
export interface exifFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  exifData?: exifData
}

/**
 * EXIF Template type
 */
export interface exifTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  settings: exifSettings,
  fields: exifField[],
}

// ==================== Type Exports ====================

export type ExportFormat = exportFormat
export type ExifCategory = exifCategory
export type ImageDimensions = imageDimensions
export type BasicImageInfo = basicImageInfo
export type CameraInfo = cameraInfo
export type ExposureInfo = exposureInfo
export type GPSInfo = gpsInfo
export type TechnicalInfo = technicalInfo
export type ExifStatistics = exifStatistics
export type ExifSettings = exifSettings
export type ExifField = exifField
export type ExifData = exifData
export type ExifFile = exifFile
export type ExifTemplate = exifTemplate
export type GpsInfo = gpsInfo
