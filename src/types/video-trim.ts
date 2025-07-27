// 所有类型声明均从 video-trim.tsx 迁移
export interface VideoFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  url?: string
  trimmedUrl?: string
  stats?: VideoStats
  trimResult?: TrimResult
}

export interface VideoStats {
  duration: number // 秒
  width: number
  height: number
  bitrate: number
  fileSize: number
  format: string
}

export interface TrimSettings {
  start: number // 秒
  end: number // 秒
  format: 'mp4' | 'webm' | 'mov'
}

export interface TrimResult {
  url: string
  size: number
  format: string
  duration: number
}
