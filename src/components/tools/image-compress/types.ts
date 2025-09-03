/**
 * 图片压缩组件的类型定义
 */

export interface ImageFile {
  id: string
  file: File
  preview?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  originalSize: number
  compressedSize?: number
  compressedBlob?: Blob
  error?: string
}

export interface CompressionSettings {
  quality: number // 0-1
  format: 'jpeg' | 'png' | 'webp'
  maxWidth?: number
  maxHeight?: number
  maintainAspectRatio: boolean
  removeMetadata: boolean
  resizeMethod: 'lanczos' | 'bilinear' | 'bicubic'
  colorSpace: 'srgb' | 'p3' | 'rec2020'
  dithering: boolean
}

export interface CompressionTemplate {
  name: string
  description: string
  settings: CompressionSettings
  icon: string
}

export interface CompressionResult {
  success: boolean
  originalSize: number
  compressedSize: number
  compressionRatio: number
  blob?: Blob
  error?: string
}

export interface BatchCompressionProgress {
  total: number
  completed: number
  failed: number
  progress: number // 0-100
}

export interface ImageDimensions {
  width: number
  height: number
}

export interface ImageMetadata {
  dimensions: ImageDimensions
  format: string
  size: number
  hasAlpha: boolean
  colorDepth: number
  dpi?: number
}

/**
 * Web Worker 消息类型
 */
export interface WorkerMessage {
  taskId: string
  type: 'compress-image' | 'batch-compress' | 'progress' | 'complete' | 'error'
  data?: any
  progress?: number
  error?: string
}

export interface WorkerImageData {
  imageData: ArrayBuffer
  fileName: string
  settings: CompressionSettings
}

export interface WorkerCompressionResult {
  compressedBlob: Blob
  originalSize: number
  compressedSize: number
  metadata: ImageMetadata
}