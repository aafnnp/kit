// TypeScript types for IPC validation

/**
 * Update Info type
 */
export interface UpdateInfo {
  version: string
  date?: string
  body?: string
}

/**
 * Update Progress Event type
 */
export interface UpdateProgressEvent {
  event: "Started" | "Progress" | "Finished"
  data: {
    downloaded?: number
    chunkLength?: number
    contentLength?: number
  }
}
