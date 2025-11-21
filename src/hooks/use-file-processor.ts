import React, { useState, useCallback, useRef } from "react"
import { toast } from "sonner"

// 文件类型
export type FileType = "text" | "json" | "csv" | "xml" | "image" | "binary" | "any"

// 文件处理配置
export interface FileProcessorConfig {
  acceptedTypes?: FileType[]
  maxFileSize?: number // bytes
  maxFiles?: number
  allowMultiple?: boolean
  autoProcess?: boolean
  encoding?: string
}

// 处理后的文件信息
export interface ProcessedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  content?: string | ArrayBuffer
  preview?: string
  error?: string
  processed: boolean
  processingTime?: number
}

// 文件验证结果
export interface FileValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// 文件统计信息
export interface FileStats {
  totalFiles: number
  totalSize: number
  processedFiles: number
  failedFiles: number
  averageSize: number
  largestFile?: ProcessedFile
  smallestFile?: ProcessedFile
}

// 文件处理器 Hook
export function useFileProcessor(config: FileProcessorConfig = {}) {
  const {
    acceptedTypes = ["any"],
    maxFileSize = 10 * 1024 * 1024, // 10MB
    maxFiles = 10,
    allowMultiple = true,
    autoProcess = true,
    encoding = "utf-8",
  } = config

  const [files, setFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [stats, setStats] = useState<FileStats>({
    totalFiles: 0,
    totalSize: 0,
    processedFiles: 0,
    failedFiles: 0,
    averageSize: 0,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  // 获取文件 MIME 类型映射
  const getAcceptedMimeTypes = useCallback(() => {
    const mimeTypeMap: Record<FileType, string[]> = {
      text: ["text/plain", "text/csv", "text/html", "text/css", "text/javascript"],
      json: ["application/json", "text/json"],
      csv: ["text/csv", "application/csv"],
      xml: ["application/xml", "text/xml"],
      image: ["image/*"],
      binary: ["application/octet-stream"],
      any: ["*/*"],
    }

    const acceptedMimes = acceptedTypes.flatMap((type) => mimeTypeMap[type] || [])
    return [...new Set(acceptedMimes)]
  }, [acceptedTypes])

  // 验证文件
  const validateFile = useCallback(
    (file: File): FileValidationResult => {
      const errors: string[] = []
      const warnings: string[] = []

      // 检查文件大小
      if (file.size > maxFileSize) {
        errors.push(
          `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxFileSize)})`
        )
      }

      // 检查文件类型
      if (!acceptedTypes.includes("any")) {
        const acceptedMimes = getAcceptedMimeTypes()
        const isAccepted = acceptedMimes.some((mime) => {
          if (mime === "*/*") return true
          if (mime.endsWith("/*")) {
            return file.type.startsWith(mime.slice(0, -2))
          }
          return file.type === mime
        })

        if (!isAccepted) {
          errors.push(`File type "${file.type}" is not accepted`)
        }
      }

      // 检查文件名
      if (!file.name || file.name.trim() === "") {
        warnings.push("File has no name")
      }

      // 检查空文件
      if (file.size === 0) {
        warnings.push("File is empty")
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      }
    },
    [acceptedTypes, maxFileSize, getAcceptedMimeTypes]
  )

  // 读取文件内容
  const readFileContent = useCallback(
    (file: File): Promise<string | ArrayBuffer> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = () => {
          resolve(reader.result!)
        }

        reader.onerror = () => {
          reject(new Error(`Failed to read file: ${file.name}`))
        }

        // 根据文件类型选择读取方式
        if (file.type.startsWith("text/") || file.type === "application/json" || file.type === "application/xml") {
          reader.readAsText(file, encoding)
        } else if (file.type.startsWith("image/")) {
          reader.readAsDataURL(file)
        } else {
          reader.readAsArrayBuffer(file)
        }
      })
    },
    [encoding]
  )

  // 生成文件预览
  const generatePreview = useCallback((file: File, content: string | ArrayBuffer): string | undefined => {
    if (file.type.startsWith("image/") && typeof content === "string") {
      return content // Data URL
    }

    if (typeof content === "string") {
      // 文本文件预览（前 200 个字符）
      return content.length > 200 ? content.substring(0, 200) + "..." : content
    }

    return undefined
  }, [])

  // 处理单个文件
  const processFile = useCallback(
    async (file: File): Promise<ProcessedFile> => {
      const startTime = Date.now()
      const fileId = `${file.name}_${file.size}_${file.lastModified}`

      // 验证文件
      const validation = validateFile(file)
      if (!validation.valid) {
        return {
          id: fileId,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          error: validation.errors.join(", "),
          processed: false,
        }
      }

      try {
        // 读取文件内容
        const content = await readFileContent(file)
        const preview = generatePreview(file, content)
        const processingTime = Date.now() - startTime

        return {
          id: fileId,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          content,
          preview,
          processed: true,
          processingTime,
        }
      } catch (error) {
        return {
          id: fileId,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          error: error instanceof Error ? error.message : "Unknown error",
          processed: false,
        }
      }
    },
    [validateFile, readFileContent, generatePreview]
  )

  // 处理多个文件
  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const filesToProcess = Array.from(fileList)

      // 检查文件数量限制
      if (files.length + filesToProcess.length > maxFiles) {
        toast.error(`Cannot add more than ${maxFiles} files`)
        return
      }

      setIsProcessing(true)
      setProcessingProgress(0)

      const processedFiles: ProcessedFile[] = []

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i]
        const processed = await processFile(file)
        processedFiles.push(processed)

        // 更新进度
        setProcessingProgress(((i + 1) / filesToProcess.length) * 100)

        // 显示处理结果
        if (processed.error) {
          toast.error(`Failed to process ${file.name}: ${processed.error}`)
        } else {
          toast.success(`Successfully processed ${file.name}`)
        }
      }

      // 更新文件列表
      setFiles((prev) => [...prev, ...processedFiles])

      setIsProcessing(false)
      setProcessingProgress(0)
    },
    [files.length, maxFiles, processFile]
  )

  // 添加文件
  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (autoProcess) {
        await processFiles(fileList)
      } else {
        const filesToAdd = Array.from(fileList).map((file) => ({
          id: `${file.name}_${file.size}_${file.lastModified}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          processed: false,
        }))
        setFiles((prev) => [...prev, ...filesToAdd])
      }
    },
    [autoProcess, processFiles]
  )

  // 移除文件
  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
    toast.success("File removed")
  }, [])

  // 清除所有文件
  const clearFiles = useCallback(() => {
    setFiles([])
    toast.success("All files cleared")
  }, [])

  // 重新处理文件
  const reprocessFile = useCallback(
    async (fileId: string) => {
      const fileToReprocess = files.find((f) => f.id === fileId)
      if (!fileToReprocess) return

      setIsProcessing(true)
      const processed = await processFile(fileToReprocess.file)

      setFiles((prev) => prev.map((f) => (f.id === fileId ? processed : f)))
      setIsProcessing(false)

      if (processed.error) {
        toast.error(`Failed to reprocess ${processed.name}: ${processed.error}`)
      } else {
        toast.success(`Successfully reprocessed ${processed.name}`)
      }
    },
    [files, processFile]
  )

  // 文件输入处理
  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files
      if (fileList && fileList.length > 0) {
        addFiles(fileList)
      }
      // 清除输入值以允许重新选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [addFiles]
  )

  // 拖拽处理
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      setDragActive(false)

      const droppedFiles = event.dataTransfer.files
      if (droppedFiles && droppedFiles.length > 0) {
        addFiles(droppedFiles)
      }
    },
    [addFiles]
  )

  // 打开文件选择器
  const openFileSelector = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  // 计算统计信息
  const calculateStats = useCallback((): FileStats => {
    const processedFiles = files.filter((f) => f.processed)
    const failedFiles = files.filter((f) => f.error)
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)

    let largestFile: ProcessedFile | undefined
    let smallestFile: ProcessedFile | undefined

    if (files.length > 0) {
      largestFile = files.reduce((largest, current) => (current.size > largest.size ? current : largest))
      smallestFile = files.reduce((smallest, current) => (current.size < smallest.size ? current : smallest))
    }

    return {
      totalFiles: files.length,
      totalSize,
      processedFiles: processedFiles.length,
      failedFiles: failedFiles.length,
      averageSize: files.length > 0 ? totalSize / files.length : 0,
      largestFile,
      smallestFile,
    }
  }, [files])

  // 更新统计信息
  React.useEffect(() => {
    setStats(calculateStats())
  }, [files, calculateStats])

  // 文件输入属性
  const fileInputProps = {
    ref: fileInputRef,
    type: "file" as const,
    multiple: allowMultiple,
    accept: getAcceptedMimeTypes().join(","),
    onChange: handleFileInput,
    style: { display: "none" },
  }

  // 拖拽区域属性
  const dropZoneProps = {
    ref: dropZoneRef,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onClick: openFileSelector,
    "data-drag-active": dragActive,
  }

  return {
    // 状态
    files,
    isProcessing,
    processingProgress,
    dragActive,
    stats,

    // 操作
    addFiles,
    removeFile,
    clearFiles,
    reprocessFile,
    processFiles,
    openFileSelector,

    // 工具函数
    validateFile,
    formatFileSize,

    // 组件属性
    fileInputProps,
    dropZoneProps,

    // 配置信息
    config: {
      acceptedTypes,
      maxFileSize,
      maxFiles,
      allowMultiple,
      autoProcess,
      encoding,
    },
  }
}

// 专用的图片处理 Hook
export function useImageProcessor(config?: Omit<FileProcessorConfig, "acceptedTypes">) {
  const processor = useFileProcessor({
    ...config,
    acceptedTypes: ["image"],
  })

  // 获取图片信息
  const getImageInfo = useCallback(async (file: ProcessedFile) => {
    if (!file.file.type.startsWith("image/") || !file.content) {
      return null
    }

    return new Promise<{ width: number; height: number; aspectRatio: number }>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
        })
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = file.content as string
    })
  }, [])

  return {
    ...processor,
    getImageInfo,
  }
}

// 专用的文本文件处理 Hook
export function useTextProcessor(config?: Omit<FileProcessorConfig, "acceptedTypes">) {
  const processor = useFileProcessor({
    ...config,
    acceptedTypes: ["text", "json", "csv", "xml"],
  })

  // 获取文本统计
  const getTextStats = useCallback((content: string) => {
    const lines = content.split("\n")
    const words = content.trim() ? content.trim().split(/\s+/) : []
    const characters = content.length
    const charactersNoSpaces = content.replace(/\s/g, "").length

    return {
      lines: lines.length,
      words: words.length,
      characters,
      charactersNoSpaces,
      paragraphs: content.split(/\n\s*\n/).filter((p) => p.trim()).length,
    }
  }, [])

  return {
    ...processor,
    getTextStats,
  }
}
