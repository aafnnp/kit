// Icon Spriter 相关类型声明
export interface IconFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  content?: string // SVG文本或base64
  url?: string // 预览
}

export interface SpriteSettings {
  layout: 'symbol' | 'grid'
  spacing: number
  naming: 'auto' | 'filename' | 'custom'
  customPrefix: string
  output: 'svg' | 'png' | 'css' | 'zip'
}

export interface SpriteStats {
  iconCount: number
  totalSize: number
  formats: string[]
}
