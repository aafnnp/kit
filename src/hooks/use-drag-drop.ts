import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { DragDropConfig, ValidationResult } from '@/types/common'

export const useDragAndDrop = (
  onFilesDropped: (files: File[]) => void,
  config: DragDropConfig = {}
) => {
  const {
    accept,
    maxSize = 200 * 1024 * 1024, // 200MB default
    maxFiles = 100,
    multiple = true
  } = config

  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): ValidationResult => {
    // 检查文件大小
    if (maxSize && file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
      }
    }

    // 检查文件类型
    if (accept) {
      const acceptTypes = Array.isArray(accept) ? accept : [accept]
      const isValidType = acceptTypes.some(type => {
        if (type === '*/*') return true
        if (type.endsWith('/*')) {
          const mainType = type.split('/')[0]
          return file.type.startsWith(mainType + '/')
        }
        return file.type === type
      })

      if (!isValidType) {
        return {
          isValid: false,
          error: `File type ${file.type} is not supported`
        }
      }
    }

    return { isValid: true }
  }, [accept, maxSize])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      let files = Array.from(e.dataTransfer.files)
      
      // 限制文件数量
      if (!multiple) {
        files = files.slice(0, 1)
      } else if (maxFiles && files.length > maxFiles) {
        files = files.slice(0, maxFiles)
        toast.warning(`Only first ${maxFiles} files will be processed`)
      }

      // 验证文件
      const validFiles: File[] = []
      const errors: string[] = []

      files.forEach(file => {
        const validation = validateFile(file)
        if (validation.isValid) {
          validFiles.push(file)
        } else {
          errors.push(`${file.name}: ${validation.error}`)
        }
      })

      // 显示错误信息
      if (errors.length > 0) {
        errors.forEach(error => toast.error(error))
      }

      // 处理有效文件
      if (validFiles.length > 0) {
        onFilesDropped(validFiles)
      } else if (files.length > 0) {
        toast.error('No valid files to process')
      }
    },
    [onFilesDropped, multiple, maxFiles, validateFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        let files = Array.from(e.target.files)
        
        // 限制文件数量
        if (!multiple) {
          files = files.slice(0, 1)
        } else if (maxFiles && files.length > maxFiles) {
          files = files.slice(0, maxFiles)
          toast.warning(`Only first ${maxFiles} files will be processed`)
        }

        // 验证文件
        const validFiles: File[] = []
        const errors: string[] = []

        files.forEach(file => {
          const validation = validateFile(file)
          if (validation.isValid) {
            validFiles.push(file)
          } else {
            errors.push(`${file.name}: ${validation.error}`)
          }
        })

        // 显示错误信息
        if (errors.length > 0) {
          errors.forEach(error => toast.error(error))
        }

        // 处理有效文件
        if (validFiles.length > 0) {
          onFilesDropped(validFiles)
        }
      }

      // 清空 input 值以允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [onFilesDropped, multiple, maxFiles, validateFile]
  )

  return { 
    dragActive, 
    fileInputRef, 
    handleDrag, 
    handleDrop, 
    handleFileInput,
    validateFile
  }
}
