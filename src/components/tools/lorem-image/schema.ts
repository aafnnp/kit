// ==================== Lorem Image Types ====================

/**
 * Image Format type
 */
export type imageFormat = "png" | "jpeg" | "webp" | "svg"

/**
 * Status type
 */
export type status = "pending" | "generating" | "completed" | "error"

/**
 * Lorem Image File type
 */
export interface loremImageFile {
  id: string,
  url: string,
  width: number,
  height: number,
  format: imageFormat,
  bgColor: string,
  fgColor: string,
  text: string
  category?: string,
  status: status
  error?: string,
  size?: number,
  generatedAt?: Date,
}

/**
 * Lorem Image Settings type
 */
export interface loremImageSettings {
  width: number,
  height: number,
  format: imageFormat,
  bgColor: string,
  fgColor: string,
  text: string
  category?: string,
  batchCount: number
  template?: string,
}

/**
 * Lorem Image Stats type
 */
export interface loremImageStats {
  totalCount: number,
  totalSize: number,
  averageSize: number,
  formats: Record<string, number>,
  categories: Record<string, number>,
}

// ==================== Type Exports ====================

export type ImageFormat = imageFormat
export type Status = status
export type LoremImageFile = loremImageFile
export type LoremImageSettings = loremImageSettings
export type LoremImageStats = loremImageStats
