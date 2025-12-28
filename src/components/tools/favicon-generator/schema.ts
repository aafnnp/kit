// ==================== Favicon Generator Types ====================

/**
 * Favicon Type type
 */
export type faviconType = "standard" | "apple-touch" | "android" | "ms-application" | "web-app"

/**
 * Favicon Format type
 */
export type faviconFormat = "ico" | "png" | "svg" | "webp" | "jpg"

/**
 * Favicon Size type
 */
export type faviconSize = number

/**
 * Favicon Metadata type
 */
export interface faviconMetadata {
  width: number,
  height: number,
  colorDepth: number,
  hasTransparency: boolean,
  compressionRatio: number,
  processingTime: number,
  purpose: string[],
}

/**
 * Generated Favicon type
 */
export interface generatedFavicon {
  id: string,
  type: faviconType,
  size: faviconSize,
  format: faviconFormat,
  url: string,
  filename: string,
  fileSize: number,
  quality: number,
  optimized: boolean,
  metadata: faviconMetadata,
}

/**
 * Favicon Statistics type
 */
export interface faviconStatistics {
  totalFavicons: number,
  typeDistribution: Record<faviconType, number>,
  formatDistribution: Record<faviconFormat, number>,
  averageFileSize: number,
  totalPackageSize: number,
  processingTime: number,
  optimizationSavings: number,
}

/**
 * Favicon Settings type
 */
export interface faviconSettings {
  includeStandardSizes: boolean,
  includeAppleSizes: boolean,
  includeAndroidSizes: boolean,
  includeMSApplicationSizes: boolean,
  generateManifest: boolean,
  optimizeImages: boolean,
  backgroundColor: string,
  themeColor: string,
}

/**
 * Manifest Icon type
 */
export interface manifestIcon {
  src: string,
  sizes: string,
  type: string,
  purpose: string,
}

/**
 * Web App Manifest type
 */
export interface webAppManifest {
  name: string,
  short_name: string,
  description: string,
  start_url: string,
  display: string,
  background_color: string,
  theme_color: string,
  icons: manifestIcon[],
}

/**
 * Favicon Template type
 */
export interface faviconTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  sizes: faviconSize[],
  formats: faviconFormat[],
  settings: Partial<faviconSettings>,
}

/**
 * Favicon File type
 */
export interface faviconFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending" | "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  faviconData?: faviconData
}

/**
 * Favicon Data type
 */
export interface faviconData {
  favicons: generatedFavicon[],
  statistics: faviconStatistics,
  settings: faviconSettings,
  manifest: webAppManifest,
}

// ==================== Type Exports ====================

export type FaviconType = faviconType
export type FaviconFormat = faviconFormat
export type FaviconSize = faviconSize
export type FaviconMetadata = faviconMetadata
export type GeneratedFavicon = generatedFavicon
export type FaviconStatistics = faviconStatistics
export type FaviconSettings = faviconSettings
export type ManifestIcon = manifestIcon
export type WebAppManifest = webAppManifest
export type FaviconTemplate = faviconTemplate
export type FaviconFile = faviconFile
export type FaviconData = faviconData
