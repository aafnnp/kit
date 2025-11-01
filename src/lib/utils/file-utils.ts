import { zipSync } from 'fflate'

// 文件读取工具
export const readFileAsText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export const readFileAsDataURL = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export const readFileAsArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

// 文件下载工具
export const downloadFile = (content: string | Blob, filename: string, type?: string) => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const downloadFromUrl = (url: string, filename: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ZIP 文件处理
export const createZipFromFiles = async (
  files: Array<{ name: string; content: string | Blob | Promise<ArrayBuffer> }>
) => {
  const zipData: Record<string, Uint8Array> = {}

  for (const file of files) {
    let content: Uint8Array

    if (file.content instanceof Promise) {
      const buffer = await file.content
      content = new Uint8Array(buffer)
    } else if (typeof file.content === 'string') {
      content = new TextEncoder().encode(file.content)
    } else {
      const arrayBuffer = await file.content.arrayBuffer()
      content = new Uint8Array(arrayBuffer)
    }

    zipData[file.name] = content
  }

  const zipped = zipSync(zipData)
  // 复制到新的 Uint8Array，确保底层为明确的 ArrayBuffer（避免 SharedArrayBuffer）
  const copied = new Uint8Array(zipped.byteLength)
  copied.set(zipped)
  return new Blob([copied.buffer], { type: 'application/zip' })
}

// ID 生成工具
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export const generateUniqueId = (prefix = ''): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `${prefix}${timestamp}${random}`
}

// 文件验证工具
export const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize
}

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some((type) => {
    if (type === '*/*') return true
    if (type.endsWith('/*')) {
      const mainType = type.split('/')[0]
      return file.type.startsWith(mainType + '/')
    }
    return file.type === type
  })
}

// 文件信息提取
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export const getFileNameWithoutExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.')
  return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename
}

export const getMimeTypeFromExtension = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    ico: 'image/x-icon',

    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
    flac: 'audio/flac',
    m4a: 'audio/mp4',
    wma: 'audio/x-ms-wma',

    // Video
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    webm: 'video/webm',

    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    // Text
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    ts: 'application/typescript',

    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
  }

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}

// 批量处理工具
export const processBatch = async <T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  onProgress?: (current: number, total: number) => void,
  concurrency = 3
): Promise<R[]> => {
  const results: R[] = []
  const total = items.length
  let completed = 0

  // 分批处理以控制并发
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchPromises = batch.map((item, batchIndex) => processor(item, i + batchIndex))

    const batchResults = await Promise.allSettled(batchPromises)

    batchResults.forEach((result, batchIndex) => {
      if (result.status === 'fulfilled') {
        results[i + batchIndex] = result.value
      } else {
        console.error(`Processing failed for item ${i + batchIndex}:`, result.reason)
        // 可以选择抛出错误或继续处理
      }

      completed++
      onProgress?.(completed, total)
    })
  }

  return results
}

