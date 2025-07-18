// Lorem Image 相关类型声明
export interface LoremImageFile {
  id: string
  url: string
  width: number
  height: number
  format: 'png' | 'jpeg' | 'webp' | 'svg'
  bgColor: string
  fgColor: string
  text: string
  category?: string
  status: 'pending' | 'generating' | 'completed' | 'error'
  error?: string
  size?: number
  generatedAt?: Date
}

export interface LoremImageSettings {
  width: number
  height: number
  format: 'png' | 'jpeg' | 'webp' | 'svg'
  bgColor: string
  fgColor: string
  text: string
  category?: string
  batchCount: number
  template?: string
}

export interface LoremImageStats {
  totalCount: number
  totalSize: number
  averageSize: number
  formats: Record<string, number>
  categories: Record<string, number>
}
