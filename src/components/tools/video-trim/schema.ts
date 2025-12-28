// ==================== Video Trim Types ====================

/**
 * Video Stats type
 */
export interface videoStats {
  duration: number,
  width: number,
  height: number,
  bitrate: number,
  fileSize: number,
  format: string,
}

/**
 * Trim Settings type
 */
export interface trimSettings {
  start: number,
  end: number,
  format: "mp4"| "webm" | "mov",
}

/**
 * Trim Result type
 */
export interface trimResult {
  url: string,
  size: number,
  format: string,
  duration: number,
}

/**
 * Video File type
 */
export interface videoFile {
  id: string,
  file: File,
  name: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  url?: string
  trimmedUrl?: string
  stats?: videoStats
  trimResult?: trimResult
}

// ==================== Type Exports ====================

export type VideoStats = videoStats
export type TrimSettings = trimSettings
export type TrimResult = trimResult
export type VideoFile = videoFile
