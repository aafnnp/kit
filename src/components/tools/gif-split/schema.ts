// ==================== GIF Split Types ====================

/**
 * GIF Frame type
 */
export interface gifFrame {
  index: number,
  imageDataUrl: string,
  delay: number,
  width: number,
  height: number,
  disposalType: number,
}

/**
 * GIF Stats type
 */
export interface gifStats {
  frameCount: number,
  duration: number,
  width: number,
  height: number,
  fileSize: number,
  avgDelay: number,
}

/**
 * GIF File type
 */
export interface gifFile {
  id: string,
  file: File,
  name: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  frames?: gifFrame[]
  stats?: gifStats
}

// ==================== Type Exports ====================

export type GifFrame = gifFrame
export type GifStats = gifStats
export type GifFile = gifFile
