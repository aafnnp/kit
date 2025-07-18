// Image to PDF 相关类型声明
export interface ImageToPdfFile {
  id: string
  file: File
  url: string
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

export interface ImageToPdfSettings {
  pageSize: 'A4' | 'A5' | 'Letter' | 'Legal'
  orientation: 'portrait' | 'landscape'
  margin: number
  quality: number
  batch: boolean
}

export interface ImageToPdfStats {
  totalImages: number
  totalSize: number
  pdfSize?: number
  pageCount?: number
}
