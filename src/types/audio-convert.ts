// 类型定义
export interface AudioFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  url?: string
  convertedUrl?: string
  stats?: AudioStats
  convertResult?: ConvertResult
}

export interface AudioStats {
  duration: number // 秒
  bitrate: number
  sampleRate: number
  channels: number
  fileSize: number
  format: string
}

export interface ConvertSettings {
  format: 'mp3' | 'wav' | 'aac' | 'ogg' | 'flac' | 'm4a'
  bitrate: number // kbps
  sampleRate: number // Hz
}

export interface ConvertResult {
  url: string
  size: number
  format: string
  duration: number
}
