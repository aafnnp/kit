// ==================== Icon Spriter Types ====================

/**
 * Layout type
 */
export type layout = "symbol" | "grid"

/**
 * Naming type
 */
export type naming = "auto" | "filename" | "custom"

/**
 * Output Format type
 */
export type outputFormat = "svg" | "png" | "css" | "zip"

/**
 * Icon File type
 */
export interface iconFile {
  id: string,
  file: File,
  name: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  content?: string
  url?: string
}

/**
 * Sprite Settings type
 */
export interface spriteSettings {
  layout: layout,
  spacing: number,
  naming: naming,
  customPrefix: string,
  output: outputFormat,
}

/**
 * Sprite Stats type
 */
export interface spriteStats {
  iconCount: number,
  totalSize: number,
  formats: string[],
}

// ==================== Type Exports ====================

export type Layout = layout
export type Naming = naming
export type OutputFormat = outputFormat
export type IconFile = iconFile
export type SpriteSettings = spriteSettings
export type SpriteStats = spriteStats
