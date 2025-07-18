// GIF Split 相关类型声明
export interface GifFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  frames?: GifFrame[]
  stats?: GifStats
}

export interface GifFrame {
  index: number
  imageDataUrl: string
  delay: number // ms
  width: number
  height: number
  disposalType: number
}

export interface GifStats {
  frameCount: number
  duration: number // ms
  width: number
  height: number
  fileSize: number
  avgDelay: number
}
