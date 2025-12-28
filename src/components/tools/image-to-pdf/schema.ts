// ==================== Image to PDF Types ====================

/**
 * Image to PDF File type
 */
export interface imageToPdfFile {
  id: string,
  file: File,
  url: string,
  name: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
}

/**
 * Image to PDF Settings type
 */
export interface imageToPdfSettings {
  pageSize: "A4" | "A5" | "Letter" | "Legal",
  orientation: "portrait"| "landscape",
  margin: number,
  quality: number,
  batch: boolean,
}

/**
 * Image to PDF Stats type
 */
export interface imageToPdfStats {
  totalImages: number,
  totalSize: number
  pdfSize?: number
  pageCount?: number
}

// ==================== Type Exports ====================

export type ImageToPdfFile = imageToPdfFile
export type ImageToPdfSettings = imageToPdfSettings
export type ImageToPdfStats = imageToPdfStats
