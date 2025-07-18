// EXIF Viewer 相关类型声明
export interface ExifFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  exifData?: ExifData
}

export interface ExifData {
  basicInfo: BasicImageInfo
  cameraInfo: CameraInfo
  exposureInfo: ExposureInfo
  gpsInfo: GPSInfo
  technicalInfo: TechnicalInfo
  statistics: ExifStatistics
  settings: ExifSettings
}

export interface BasicImageInfo {
  fileName: string
  fileSize: number
  fileType: string
  mimeType: string
  dimensions: ImageDimensions
  colorSpace: string
  bitDepth: number
  compression: string
  orientation: number
}

export interface ImageDimensions {
  width: number
  height: number
  aspectRatio: number
  megapixels: number
}

export interface CameraInfo {
  make: string
  model: string
  software: string
  artist: string
  copyright: string
  dateTime: string
  dateTimeOriginal: string
  dateTimeDigitized: string
  subSecTime: string
}

export interface ExposureInfo {
  exposureTime: string
  fNumber: string
  exposureProgram: string
  iso: number
  exposureBias: string
  meteringMode: string
  flash: string
  focalLength: string
  focalLengthIn35mm: string
  whiteBalance: string
  sceneCaptureType: string
}

export interface GPSInfo {
  latitude: number | null
  longitude: number | null
  altitude: number | null
  latitudeRef: string
  longitudeRef: string
  altitudeRef: string
  timestamp: string
  datestamp: string
  mapDatum: string
  processingMethod: string
}

export interface TechnicalInfo {
  colorSpace: string
  pixelXDimension: number
  pixelYDimension: number
  resolutionUnit: string
  xResolution: number
  yResolution: number
  yCbCrPositioning: string
  exifVersion: string
  flashpixVersion: string
  componentConfiguration: string
  compressedBitsPerPixel: string
}

export interface ExifStatistics {
  totalImages: number
  formatDistribution: Record<string, number>
  cameraDistribution: Record<string, number>
  averageFileSize: number
  averageMegapixels: number
  gpsEnabledCount: number
  processingTime: number
}

export interface ExifSettings {
  includeGPS: boolean
  includeTechnical: boolean
  includeCamera: boolean
  includeExposure: boolean
  exportFormat: ExportFormat
  privacyMode: boolean
  showThumbnails: boolean
}

export interface ExifTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<ExifSettings>
  fields: ExifField[]
}

export interface ExifField {
  key: string
  label: string
  category: ExifCategory
  required: boolean
  sensitive: boolean
}

export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
export type ExifCategory = 'basic' | 'camera' | 'exposure' | 'gps' | 'technical'
