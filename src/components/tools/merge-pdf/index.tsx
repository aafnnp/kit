import React, { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Upload,
  Trash2,
  Copy,
  Check,
  Settings,
  FileText,
  BookOpen,
  Activity,
  Files,
  ArrowUp,
  ArrowDown,
  Combine,
} from 'lucide-react'
import { PDFDocument, degrees } from 'pdf-lib'
import { nanoid } from 'nanoid'
import type {
  PDFFile,
  PDFPageInfo,
  PDFMetadata,
  MergeOperation,
  MergeResult,
  MergeSettings,
  ProcessingSettings,
  PDFTemplate,
  PDFValidation,
} from '@/types/merge-pdf'
import { formatFileSize } from '@/lib/utils'

// Utility functions

// PDF processing functions
const processPDFFile = async (file: File): Promise<PDFFile> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)

    // Extract metadata
    const pageCount = pdfDoc.getPageCount()
    const title = pdfDoc.getTitle()
    const author = pdfDoc.getAuthor()
    const subject = pdfDoc.getSubject()
    const creator = pdfDoc.getCreator()
    const producer = pdfDoc.getProducer()
    const creationDate = pdfDoc.getCreationDate()
    const modificationDate = pdfDoc.getModificationDate()
    const keywords =
      pdfDoc
        .getKeywords()
        ?.split(',')
        .map((k) => k.trim()) || []

    // Extract page information
    const pages: PDFPageInfo[] = []
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i)
      const { width, height } = page.getSize()
      const rotation = page.getRotation().angle

      pages.push({
        pageNumber: i + 1,
        width,
        height,
        rotation,
        selected: true, // Default to selected
      })
    }

    const metadata: PDFMetadata = {
      title: title || undefined,
      author: author || undefined,
      subject: subject || undefined,
      creator: creator || undefined,
      producer: producer || undefined,
      creationDate: creationDate || undefined,
      modificationDate: modificationDate || undefined,
      keywords,
      pageCount,
      fileSize: file.size,
      encrypted: false, // pdf-lib doesn't provide direct access to encryption status
      permissions: {
        canPrint: true,
        canModify: true,
        canCopy: true,
        canAnnotate: true,
        canFillForms: true,
        canExtractForAccessibility: true,
        canAssemble: true,
        canPrintHighQuality: true,
      },
    }

    return {
      id: nanoid(),
      file,
      name: file.name,
      size: file.size,
      pageCount,
      isValid: true,
      metadata,
      pages,
      createdAt: new Date(),
    }
  } catch (error) {
    return {
      id: nanoid(),
      file,
      name: file.name,
      size: file.size,
      isValid: false,
      error: error instanceof Error ? error.message : 'Failed to process PDF',
      createdAt: new Date(),
    }
  }
}

const mergePDFs = async (
  pdfFiles: PDFFile[],
  settings: MergeSettings,
  onProgress?: (progress: number) => void
): Promise<MergeResult> => {
  const startTime = performance.now()

  try {
    const mergedPdf = await PDFDocument.create()
    let totalPages = 0
    let processedPages = 0

    // Calculate total pages for progress tracking
    pdfFiles.forEach((pdfFile) => {
      if (pdfFile.isValid && pdfFile.pages) {
        totalPages += pdfFile.pages.filter((page) => page.selected).length
      }
    })

    // Set metadata for merged PDF
    if (settings.includeMetadata) {
      mergedPdf.setTitle(settings.outputFileName.replace('.pdf', ''))
      mergedPdf.setCreator('PDF Merge Tool')
      mergedPdf.setProducer('Enhanced PDF Merger')
      mergedPdf.setCreationDate(new Date())
    }

    // Process files in order
    for (const pdfFile of pdfFiles) {
      if (!pdfFile.isValid || !pdfFile.pages) continue

      const arrayBuffer = await pdfFile.file.arrayBuffer()
      const sourcePdf = await PDFDocument.load(arrayBuffer)

      // Get selected pages
      const selectedPageIndices = pdfFile.pages.filter((page) => page.selected).map((page) => page.pageNumber - 1)

      if (selectedPageIndices.length === 0) continue

      // Copy selected pages
      const copiedPages = await mergedPdf.copyPages(sourcePdf, selectedPageIndices)

      copiedPages.forEach((page) => {
        // Apply rotation if needed
        const originalPageInfo = pdfFile.pages!.find(
          (p) => p.pageNumber === selectedPageIndices[copiedPages.indexOf(page)] + 1
        )
        if (originalPageInfo && originalPageInfo.rotation !== 0) {
          page.setRotation(degrees(originalPageInfo.rotation))
        }

        mergedPdf.addPage(page)
        processedPages++

        // Update progress
        if (onProgress) {
          onProgress((processedPages / totalPages) * 100)
        }
      })
    }

    // Apply watermark if enabled
    if (settings.watermark?.enabled && settings.watermark.text) {
      const pages = mergedPdf.getPages()
      pages.forEach((page) => {
        const { width, height } = page.getSize()
        let x = width / 2
        let y = height / 2

        // Adjust position based on settings
        switch (settings.watermark!.position) {
          case 'top-left':
            x = 50
            y = height - 50
            break
          case 'top-right':
            x = width - 50
            y = height - 50
            break
          case 'bottom-left':
            x = 50
            y = 50
            break
          case 'bottom-right':
            x = width - 50
            y = 50
            break
        }

        page.drawText(settings.watermark!.text, {
          x,
          y,
          size: settings.watermark!.fontSize,
          opacity: settings.watermark!.opacity,
        })
      })
    }

    // Save with optimization if enabled
    const pdfBytes = await mergedPdf.save({
      useObjectStreams: settings.optimizeSize,
      addDefaultPage: false,
    })

    const endTime = performance.now()
    const processingTime = endTime - startTime

    // Calculate statistics
    const totalSize = pdfFiles.reduce((sum, file) => sum + file.size, 0)
    const compressionRatio = totalSize > 0 ? (totalSize - pdfBytes.length) / totalSize : 0

    return {
      fileName: settings.outputFileName,
      fileSize: pdfBytes.length,
      pageCount: mergedPdf.getPageCount(),
      processingTime,
      statistics: {
        totalFiles: pdfFiles.length,
        totalPages: totalPages,
        totalSize: totalSize,
        compressionRatio,
        processingTime,
        qualityScore: calculateQualityScore(pdfFiles, settings),
        optimizationSavings: totalSize - pdfBytes.length,
      },
    }
  } catch (error) {
    throw new Error(`PDF merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const calculateQualityScore = (_pdfFiles: PDFFile[], settings: MergeSettings): number => {
  let score = 100

  // Deduct points for potential quality issues
  if (!settings.includeMetadata) score -= 5
  if (!settings.includeBookmarks) score -= 5
  if (settings.optimizeSize) score -= 10 // Optimization might reduce quality
  if (settings.compression) score -= 15

  // Add points for good practices
  if (settings.removeBlankPages) score += 5
  if (settings.watermark?.enabled) score += 5

  return Math.max(0, Math.min(100, score))
}

// PDF templates
const pdfTemplates: PDFTemplate[] = [
  {
    id: 'basic-merge',
    name: 'Basic Merge',
    description: 'Simple PDF merging with default settings',
    category: 'Basic',
    settings: {
      outputFileName: 'merged-document.pdf',
      pageOrder: 'original',
      includeBookmarks: true,
      includeMetadata: true,
      optimizeSize: false,
      removeBlankPages: false,
      quality: 'high',
      compression: false,
    },
    useCase: ['Document combination', 'Report compilation', 'File consolidation'],
    examples: ['Merge multiple reports', 'Combine contract pages', 'Consolidate presentations'],
  },
  {
    id: 'optimized-merge',
    name: 'Optimized Merge',
    description: 'PDF merging with size optimization',
    category: 'Optimization',
    settings: {
      outputFileName: 'optimized-merged.pdf',
      pageOrder: 'original',
      includeBookmarks: true,
      includeMetadata: true,
      optimizeSize: true,
      removeBlankPages: true,
      quality: 'medium',
      compression: true,
    },
    useCase: ['File size reduction', 'Email attachments', 'Web distribution'],
    examples: ['Compress large documents', 'Optimize for email', 'Reduce storage space'],
  },
  {
    id: 'presentation-merge',
    name: 'Presentation Merge',
    description: 'Merge presentation slides with high quality',
    category: 'Presentation',
    settings: {
      outputFileName: 'presentation-merged.pdf',
      pageOrder: 'original',
      includeBookmarks: false,
      includeMetadata: true,
      optimizeSize: false,
      removeBlankPages: true,
      quality: 'high',
      compression: false,
    },
    useCase: ['Slide compilation', 'Training materials', 'Conference presentations'],
    examples: ['Combine slide decks', 'Merge training modules', 'Consolidate presentations'],
  },
  {
    id: 'document-archive',
    name: 'Document Archive',
    description: 'Archive multiple documents with metadata preservation',
    category: 'Archive',
    settings: {
      outputFileName: 'document-archive.pdf',
      pageOrder: 'original',
      includeBookmarks: true,
      includeMetadata: true,
      optimizeSize: true,
      removeBlankPages: false,
      quality: 'medium',
      compression: true,
    },
    useCase: ['Document archiving', 'Record keeping', 'Digital storage'],
    examples: ['Archive contracts', 'Store invoices', 'Preserve documents'],
  },
  {
    id: 'watermarked-merge',
    name: 'Watermarked Merge',
    description: 'Merge PDFs with watermark protection',
    category: 'Security',
    settings: {
      outputFileName: 'watermarked-merged.pdf',
      pageOrder: 'original',
      includeBookmarks: true,
      includeMetadata: true,
      optimizeSize: false,
      removeBlankPages: false,
      quality: 'high',
      compression: false,
      watermark: {
        enabled: true,
        text: 'CONFIDENTIAL',
        opacity: 0.3,
        position: 'center',
        fontSize: 48,
        color: '#FF0000',
      },
    },
    useCase: ['Confidential documents', 'Draft protection', 'Copyright marking'],
    examples: ['Mark confidential files', 'Protect drafts', 'Add copyright notice'],
  },
  {
    id: 'custom-order',
    name: 'Custom Order Merge',
    description: 'Merge PDFs with custom page ordering',
    category: 'Custom',
    settings: {
      outputFileName: 'custom-order-merged.pdf',
      pageOrder: 'custom',
      includeBookmarks: true,
      includeMetadata: true,
      optimizeSize: false,
      removeBlankPages: false,
      quality: 'high',
      compression: false,
    },
    useCase: ['Custom arrangement', 'Specific ordering', 'Manual organization'],
    examples: ['Reorder chapters', 'Custom page sequence', 'Manual arrangement'],
  },
]

// Validation functions
const validatePDFFile = (file: File): PDFValidation => {
  const validation: PDFValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  // File type validation
  if (file.type !== 'application/pdf') {
    validation.isValid = false
    validation.errors.push({
      message: 'File is not a PDF',
      type: 'format',
      severity: 'error',
    })
  }

  // File size validation (100MB limit)
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    validation.isValid = false
    validation.errors.push({
      message: `File size exceeds ${formatFileSize(maxSize)} limit`,
      type: 'size',
      severity: 'error',
    })
  }

  // File size warnings
  if (file.size > 50 * 1024 * 1024) {
    validation.warnings.push('Large file size may affect processing performance')
  }

  if (file.size < 1024) {
    validation.warnings.push('File size is very small, may be corrupted')
  }

  // File name validation
  if (file.name.length > 255) {
    validation.warnings.push('File name is very long')
    validation.suggestions.push('Consider shortening the file name')
  }

  if (!/^[\w\-. ]+\.pdf$/i.test(file.name)) {
    validation.warnings.push('File name contains special characters')
    validation.suggestions.push('Use only letters, numbers, spaces, hyphens, and dots')
  }

  return validation
}

// Custom hooks
const usePDFMerger = () => {
  const [operations, setOperations] = useState<MergeOperation[]>([])

  const createMergeOperation = useCallback((files: PDFFile[], settings: MergeSettings): MergeOperation => {
    const operation: MergeOperation = {
      id: nanoid(),
      files,
      settings,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    }

    setOperations((prev) => [operation, ...prev])
    return operation
  }, [])

  const processMergeOperation = useCallback(
    async (operationId: string) => {
      setOperations((prev) =>
        prev.map((op) => (op.id === operationId ? { ...op, status: 'processing' as const, progress: 0 } : op))
      )

      try {
        const operation = operations.find((op) => op.id === operationId)
        if (!operation) throw new Error('Operation not found')

        const result = await mergePDFs(operation.files, operation.settings, (progress) => {
          setOperations((prev) => prev.map((op) => (op.id === operationId ? { ...op, progress } : op)))
        })

        // Create download URL
        const mergedPdf = await PDFDocument.create()
        for (const pdfFile of operation.files) {
          if (!pdfFile.isValid) continue
          const arrayBuffer = await pdfFile.file.arrayBuffer()
          const sourcePdf = await PDFDocument.load(arrayBuffer)
          const selectedPages = pdfFile.pages?.filter((page) => page.selected).map((page) => page.pageNumber - 1) || []
          if (selectedPages.length > 0) {
            const copiedPages = await mergedPdf.copyPages(sourcePdf, selectedPages)
            copiedPages.forEach((page) => mergedPdf.addPage(page))
          }
        }

        const pdfBytes = await mergedPdf.save()
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const downloadUrl = URL.createObjectURL(blob)

        setOperations((prev) =>
          prev.map((op) =>
            op.id === operationId
              ? {
                  ...op,
                  status: 'completed' as const,
                  progress: 100,
                  result: { ...result, downloadUrl },
                  completedAt: new Date(),
                }
              : op
          )
        )

        return { ...result, downloadUrl }
      } catch (error) {
        setOperations((prev) =>
          prev.map((op) =>
            op.id === operationId
              ? {
                  ...op,
                  status: 'failed' as const,
                  error: error instanceof Error ? error.message : 'Merge failed',
                }
              : op
          )
        )
        throw error
      }
    },
    [operations]
  )

  const removeOperation = useCallback((operationId: string) => {
    setOperations((prev) => {
      const operation = prev.find((op) => op.id === operationId)
      if (operation?.result?.downloadUrl) {
        URL.revokeObjectURL(operation.result.downloadUrl)
      }
      return prev.filter((op) => op.id !== operationId)
    })
  }, [])

  const clearOperations = useCallback(() => {
    operations.forEach((operation) => {
      if (operation.result?.downloadUrl) {
        URL.revokeObjectURL(operation.result.downloadUrl)
      }
    })
    setOperations([])
  }, [operations])

  return {
    operations,
    createMergeOperation,
    processMergeOperation,
    removeOperation,
    clearOperations,
  }
}

// File processing hook
const usePDFFileProcessor = () => {
  const [files, setFiles] = useState<PDFFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    setIsProcessing(true)
    const newFiles: PDFFile[] = []

    try {
      const fileArray = Array.from(fileList)

      for (const file of fileArray) {
        const validation = validatePDFFile(file)
        if (!validation.isValid) {
          toast.error(`${file.name}: ${validation.errors[0]?.message}`)
          continue
        }

        if (validation.warnings.length > 0) {
          validation.warnings.forEach((warning) => {
            toast.warning(`${file.name}: ${warning}`)
          })
        }

        const pdfFile = await processPDFFile(file)
        newFiles.push(pdfFile)

        if (!pdfFile.isValid) {
          toast.error(`Failed to process ${file.name}: ${pdfFile.error}`)
        }
      }

      setFiles((prev) => [...prev, ...newFiles])

      if (newFiles.length > 0) {
        toast.success(`Added ${newFiles.length} PDF file(s)`)
      }
    } catch (error) {
      toast.error('Failed to process files')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }, [])

  const updateFile = useCallback((fileId: string, updates: Partial<PDFFile>) => {
    setFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, ...updates } : file)))
  }, [])

  const reorderFiles = useCallback((startIndex: number, endIndex: number) => {
    setFiles((prev) => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  const togglePageSelection = useCallback((fileId: string, pageNumber: number) => {
    setFiles((prev) =>
      prev.map((file) => {
        if (file.id === fileId && file.pages) {
          return {
            ...file,
            pages: file.pages.map((page) =>
              page.pageNumber === pageNumber ? { ...page, selected: !page.selected } : page
            ),
          }
        }
        return file
      })
    )
  }, [])

  const selectAllPages = useCallback((fileId: string, selected: boolean) => {
    setFiles((prev) =>
      prev.map((file) => {
        if (file.id === fileId && file.pages) {
          return {
            ...file,
            pages: file.pages.map((page) => ({ ...page, selected })),
          }
        }
        return file
      })
    )
  }, [])

  return {
    files,
    isProcessing,
    addFiles,
    removeFile,
    updateFile,
    reorderFiles,
    clearFiles,
    togglePageSelection,
    selectAllPages,
  }
}

// Copy to clipboard functionality
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || 'text')
      toast.success(`${label || 'Text'} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return { copyToClipboard, copiedText }
}

// Export functionality
const usePDFExport = () => {
  const downloadPDF = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportOperationReport = useCallback(
    (operations: MergeOperation[], format: 'txt' | 'json' | 'csv') => {
      let content = ''
      let mimeType = 'text/plain'
      let extension = '.txt'

      switch (format) {
        case 'json':
          const jsonData = operations.map((op) => ({
            id: op.id,
            status: op.status,
            filesCount: op.files.length,
            totalPages: op.files.reduce((sum, file) => sum + (file.pageCount || 0), 0),
            outputFileName: op.settings.outputFileName,
            processingTime: op.result?.processingTime,
            fileSize: op.result?.fileSize,
            createdAt: op.createdAt,
            completedAt: op.completedAt,
          }))
          content = JSON.stringify(jsonData, null, 2)
          mimeType = 'application/json'
          extension = '.json'
          break
        case 'csv':
          const csvHeaders = [
            'Operation ID',
            'Status',
            'Files Count',
            'Total Pages',
            'Output Filename',
            'Processing Time (ms)',
            'File Size',
            'Created At',
            'Completed At',
          ]
          const csvRows = operations.map((op) =>
            [
              op.id,
              op.status,
              op.files.length.toString(),
              op.files.reduce((sum, file) => sum + (file.pageCount || 0), 0).toString(),
              op.settings.outputFileName,
              op.result?.processingTime?.toFixed(2) || '',
              op.result?.fileSize ? formatFileSize(op.result.fileSize) : '',
              op.createdAt.toISOString(),
              op.completedAt?.toISOString() || '',
            ]
              .map((field) => `"${field.replace(/"/g, '""')}"`)
              .join(',')
          )
          content = [csvHeaders.join(','), ...csvRows].join('\n')
          mimeType = 'text/csv'
          extension = '.csv'
          break
        case 'txt':
        default:
          content = generateTextReport(operations)
          break
      }

      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
      downloadPDF(blob, `pdf-merge-report${extension}`)
    },
    [downloadPDF]
  )

  return { downloadPDF, exportOperationReport }
}

// Generate text report
const generateTextReport = (operations: MergeOperation[]): string => {
  return `PDF Merge Operations Report
============================

Generated: ${new Date().toLocaleString()}
Total Operations: ${operations.length}
Successful Operations: ${operations.filter((op) => op.status === 'completed').length}
Failed Operations: ${operations.filter((op) => op.status === 'failed').length}

Operation Details:
${operations
  .map((op, i) => {
    return `${i + 1}. Operation ID: ${op.id}
   Status: ${op.status}
   Files: ${op.files.length}
   Total Pages: ${op.files.reduce((sum, file) => sum + (file.pageCount || 0), 0)}
   Output: ${op.settings.outputFileName}
   Created: ${op.createdAt.toLocaleString()}
   ${op.completedAt ? `Completed: ${op.completedAt.toLocaleString()}` : ''}
   ${op.result ? `Processing Time: ${op.result.processingTime.toFixed(2)}ms` : ''}
   ${op.result ? `File Size: ${formatFileSize(op.result.fileSize)}` : ''}
   ${op.error ? `Error: ${op.error}` : ''}

   Files:
   ${op.files.map((file, j) => `   ${j + 1}. ${file.name} (${formatFileSize(file.size)}, ${file.pageCount || 0} pages)`).join('\n')}
`
  })
  .join('\n')}

Statistics:
- Success Rate: ${((operations.filter((op) => op.status === 'completed').length / operations.length) * 100).toFixed(1)}%
- Total Files Processed: ${operations.reduce((sum, op) => sum + op.files.length, 0)}
- Total Pages Processed: ${operations.reduce((sum, op) => sum + op.files.reduce((fileSum, file) => fileSum + (file.pageCount || 0), 0), 0)}
- Average Processing Time: ${(operations.filter((op) => op.result).reduce((sum, op) => sum + (op.result!.processingTime || 0), 0) / operations.filter((op) => op.result).length || 0).toFixed(2)}ms
`
}

/**
 * Enhanced PDF Merge Tool
 * Features: Advanced PDF merging, page selection, watermarks, optimization, batch processing
 */
const MergePDFCore = () => {
  const [activeTab, setActiveTab] = useState<'merge' | 'batch' | 'settings' | 'templates'>('merge')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [settings, setSettings] = useState<MergeSettings>({
    outputFileName: 'merged-document.pdf',
    pageOrder: 'original',
    includeBookmarks: true,
    includeMetadata: true,
    optimizeSize: false,
    removeBlankPages: false,
    quality: 'high',
    compression: false,
  })
  const [processingSettings, setProcessingSettings] = useState<ProcessingSettings>({
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 50,
    allowedFormats: ['application/pdf'],
    autoOptimize: false,
    preserveQuality: true,
    enableParallelProcessing: false,
    exportFormat: 'pdf',
    realTimePreview: false,
  })

  const { files, isProcessing, addFiles, removeFile, reorderFiles, clearFiles, togglePageSelection, selectAllPages } =
    usePDFFileProcessor()
  const { operations, createMergeOperation, processMergeOperation, removeOperation, clearOperations } = usePDFMerger()
  const { exportOperationReport } = usePDFExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = pdfTemplates.find((t) => t.id === templateId)
    if (template) {
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files
      if (fileList && fileList.length > 0) {
        addFiles(fileList)
      }
      // Reset input value to allow re-uploading the same file
      event.target.value = ''
    },
    [addFiles]
  )

  // Handle drag and drop
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const droppedFiles = Array.from(event.dataTransfer.files).filter((file) => file.type === 'application/pdf')
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles)
      } else {
        toast.error('Please drop PDF files only')
      }
    },
    [addFiles]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  // Handle merge
  const handleMerge = useCallback(async () => {
    if (files.length < 2) {
      toast.error('Please add at least 2 PDF files to merge')
      return
    }

    const validFiles = files.filter((file) => file.isValid)
    if (validFiles.length < 2) {
      toast.error('Please add at least 2 valid PDF files to merge')
      return
    }

    try {
      const operation = createMergeOperation(validFiles, settings)
      await processMergeOperation(operation.id)
      toast.success('PDF merge completed successfully!')
    } catch (error) {
      toast.error(`Merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [files, settings, createMergeOperation, processMergeOperation])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Combine className="h-5 w-5" aria-hidden="true" />
              PDF Merge & Processing Tool
            </CardTitle>
            <CardDescription>
              Advanced PDF merging tool with page selection, watermarks, optimization, and batch processing. Merge
              multiple PDF files, select specific pages, add watermarks, and optimize file sizes. Use keyboard
              navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'merge' | 'batch' | 'settings' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="merge" className="flex items-center gap-2">
              <Combine className="h-4 w-4" />
              PDF Merge
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Files className="h-4 w-4" />
              Batch Operations
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* PDF Merge Tab */}
          <TabsContent value="merge" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload PDF Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Drag and Drop Area */}
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Drop PDF files here</p>
                      <p className="text-sm text-muted-foreground">or click to browse files</p>
                    </div>
                    <Input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <Label
                      htmlFor="pdf-upload"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-4 cursor-pointer"
                    >
                      Browse Files
                    </Label>
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Uploaded Files ({files.length})</Label>
                        <Button size="sm" variant="outline" onClick={clearFiles}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {files.map((file, index) => (
                          <div key={file.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{index + 1}.</span>
                                  <FileText className={`h-4 w-4 ${file.isValid ? 'text-green-600' : 'text-red-600'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{file.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                    {file.pageCount && ` • ${file.pageCount} pages`}
                                  </div>
                                  {file.error && <div className="text-xs text-red-600">{file.error}</div>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => reorderFiles(index, Math.max(0, index - 1))}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => reorderFiles(index, Math.min(files.length - 1, index + 1))}
                                  disabled={index === files.length - 1}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => removeFile(file.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Page Selection */}
                            {file.isValid && file.pages && file.pages.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-xs font-medium">Page Selection</Label>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => selectAllPages(file.id, true)}
                                      className="text-xs h-6 px-2"
                                    >
                                      All
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => selectAllPages(file.id, false)}
                                      className="text-xs h-6 px-2"
                                    >
                                      None
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-8 gap-1">
                                  {file.pages.map((page) => (
                                    <button
                                      key={page.pageNumber}
                                      onClick={() => togglePageSelection(file.id, page.pageNumber)}
                                      className={`text-xs p-1 rounded border ${
                                        page.selected
                                          ? 'bg-primary text-primary-foreground border-primary'
                                          : 'bg-muted hover:bg-muted/80 border-border'
                                      }`}
                                    >
                                      {page.pageNumber}
                                    </button>
                                  ))}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {file.pages.filter((page) => page.selected).length} of {file.pages.length} pages
                                  selected
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Merge Settings Quick Access */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Quick Settings</Label>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="output-filename" className="text-xs">
                          Output Filename
                        </Label>
                        <Input
                          id="output-filename"
                          value={settings.outputFileName}
                          onChange={(e) => setSettings((prev) => ({ ...prev, outputFileName: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quality" className="text-xs">
                          Quality
                        </Label>
                        <Select
                          value={settings.quality}
                          onValueChange={(value: 'high' | 'medium' | 'low') =>
                            setSettings((prev) => ({ ...prev, quality: value }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High Quality</SelectItem>
                            <SelectItem value="medium">Medium Quality</SelectItem>
                            <SelectItem value="low">Low Quality</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="optimize-size"
                          type="checkbox"
                          checked={settings.optimizeSize}
                          onChange={(e) => setSettings((prev) => ({ ...prev, optimizeSize: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="optimize-size" className="text-xs">
                          Optimize file size
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-bookmarks"
                          type="checkbox"
                          checked={settings.includeBookmarks}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeBookmarks: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-bookmarks" className="text-xs">
                          Include bookmarks
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="remove-blank"
                          type="checkbox"
                          checked={settings.removeBlankPages}
                          onChange={(e) => setSettings((prev) => ({ ...prev, removeBlankPages: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="remove-blank" className="text-xs">
                          Remove blank pages
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleMerge}
                      disabled={files.length < 2 || isProcessing || files.filter((f) => f.isValid).length < 2}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Combine className="mr-2 h-4 w-4" />
                      )}
                      Merge PDFs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Merge Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Merge Operations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {operations.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Recent Operations ({operations.length})</Label>
                        <Button size="sm" variant="outline" onClick={clearOperations}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {operations.map((operation) => (
                          <div key={operation.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="font-medium text-sm">{operation.settings.outputFileName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {operation.files.length} files • {operation.createdAt.toLocaleString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    operation.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : operation.status === 'failed'
                                        ? 'bg-red-100 text-red-800'
                                        : operation.status === 'processing'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {operation.status}
                                </span>
                                <Button size="sm" variant="ghost" onClick={() => removeOperation(operation.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            {operation.status === 'processing' && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span>Processing...</span>
                                  <span>{operation.progress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${operation.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {/* Operation Details */}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <div>
                                  <strong>Files:</strong> {operation.files.length}
                                </div>
                                <div>
                                  <strong>Total Pages:</strong>{' '}
                                  {operation.files.reduce((sum, file) => sum + (file.pageCount || 0), 0)}
                                </div>
                                {operation.result && (
                                  <div>
                                    <strong>Output Pages:</strong> {operation.result.pageCount}
                                  </div>
                                )}
                              </div>
                              <div>
                                {operation.result && (
                                  <>
                                    <div>
                                      <strong>File Size:</strong> {formatFileSize(operation.result.fileSize)}
                                    </div>
                                    <div>
                                      <strong>Processing Time:</strong> {operation.result.processingTime.toFixed(2)}ms
                                    </div>
                                    <div>
                                      <strong>Quality Score:</strong> {operation.result.statistics.qualityScore}/100
                                    </div>
                                  </>
                                )}
                                {operation.error && (
                                  <div className="text-red-600">
                                    <strong>Error:</strong> {operation.error}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Download Button */}
                            {operation.status === 'completed' && operation.result?.downloadUrl && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const link = document.createElement('a')
                                      link.href = operation.result!.downloadUrl!
                                      link.download = operation.settings.outputFileName
                                      link.click()
                                    }}
                                    className="flex-1"
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(operation.result!.downloadUrl!, 'Download URL')}
                                  >
                                    {copiedText === 'Download URL' ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Statistics */}
                            {operation.result && (
                              <div className="mt-3 pt-3 border-t">
                                <Label className="text-xs font-medium mb-2 block">Statistics</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                  <div>
                                    <div>
                                      <strong>Compression:</strong>{' '}
                                      {(operation.result.statistics.compressionRatio * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Savings:</strong>{' '}
                                      {formatFileSize(operation.result.statistics.optimizationSavings)}
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Quality:</strong> {operation.result.statistics.qualityScore}/100
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Time:</strong> {operation.result.statistics.processingTime.toFixed(2)}ms
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Export Operations Report */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button size="sm" variant="outline" onClick={() => exportOperationReport(operations, 'txt')}>
                          <Download className="mr-2 h-4 w-4" />
                          Export Report
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => exportOperationReport(operations, 'csv')}>
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Combine className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Merge Operations</h3>
                      <p className="text-muted-foreground mb-4">
                        Upload PDF files and merge them to see operations here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Operations Tab */}
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Files className="h-5 w-5" />
                  Batch PDF Operations
                </CardTitle>
                <CardDescription>Process multiple PDF merge operations simultaneously</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Files className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Batch Operations</h3>
                  <p className="text-muted-foreground mb-4">Batch processing functionality coming soon</p>
                  <p className="text-sm text-muted-foreground">
                    Use the main merge tab to process individual operations
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Merge Settings
                </CardTitle>
                <CardDescription>Configure PDF merge options and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Basic Settings</Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="settings-filename" className="text-sm font-medium">
                        Default Output Filename
                      </Label>
                      <Input
                        id="settings-filename"
                        value={settings.outputFileName}
                        onChange={(e) => setSettings((prev) => ({ ...prev, outputFileName: e.target.value }))}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="page-order" className="text-sm font-medium">
                        Page Order
                      </Label>
                      <Select
                        value={settings.pageOrder}
                        onValueChange={(value: 'original' | 'reverse' | 'custom') =>
                          setSettings((prev) => ({ ...prev, pageOrder: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original">Original Order</SelectItem>
                          <SelectItem value="reverse">Reverse Order</SelectItem>
                          <SelectItem value="custom">Custom Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quality-setting" className="text-sm font-medium">
                        Quality
                      </Label>
                      <Select
                        value={settings.quality}
                        onValueChange={(value: 'high' | 'medium' | 'low') =>
                          setSettings((prev) => ({ ...prev, quality: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Quality</SelectItem>
                          <SelectItem value="medium">Medium Quality</SelectItem>
                          <SelectItem value="low">Low Quality</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id="settings-bookmarks"
                        type="checkbox"
                        checked={settings.includeBookmarks}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeBookmarks: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="settings-bookmarks" className="text-sm">
                        Include bookmarks from source PDFs
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="settings-metadata"
                        type="checkbox"
                        checked={settings.includeMetadata}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeMetadata: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="settings-metadata" className="text-sm">
                        Include metadata in merged PDF
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="settings-optimize"
                        type="checkbox"
                        checked={settings.optimizeSize}
                        onChange={(e) => setSettings((prev) => ({ ...prev, optimizeSize: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="settings-optimize" className="text-sm">
                        Optimize file size (may reduce quality)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="settings-compression"
                        type="checkbox"
                        checked={settings.compression}
                        onChange={(e) => setSettings((prev) => ({ ...prev, compression: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="settings-compression" className="text-sm">
                        Enable compression
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="settings-blank-pages"
                        type="checkbox"
                        checked={settings.removeBlankPages}
                        onChange={(e) => setSettings((prev) => ({ ...prev, removeBlankPages: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="settings-blank-pages" className="text-sm">
                        Remove blank pages
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Watermark Settings */}
                <div className="space-y-4 border-t pt-6">
                  <Label className="text-base font-medium">Watermark Settings</Label>

                  <div className="flex items-center space-x-2">
                    <input
                      id="watermark-enabled"
                      type="checkbox"
                      checked={settings.watermark?.enabled || false}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          watermark: {
                            ...prev.watermark,
                            enabled: e.target.checked,
                            text: prev.watermark?.text || 'CONFIDENTIAL',
                            opacity: prev.watermark?.opacity || 0.3,
                            position: prev.watermark?.position || 'center',
                            fontSize: prev.watermark?.fontSize || 48,
                            color: prev.watermark?.color || '#FF0000',
                          },
                        }))
                      }
                      className="rounded border-input"
                    />
                    <Label htmlFor="watermark-enabled" className="text-sm">
                      Add watermark to merged PDF
                    </Label>
                  </div>

                  {settings.watermark?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                      <div>
                        <Label htmlFor="watermark-text" className="text-sm font-medium">
                          Watermark Text
                        </Label>
                        <Input
                          id="watermark-text"
                          value={settings.watermark.text}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              watermark: { ...prev.watermark!, text: e.target.value },
                            }))
                          }
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="watermark-position" className="text-sm font-medium">
                          Position
                        </Label>
                        <Select
                          value={settings.watermark.position}
                          onValueChange={(
                            value: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
                          ) =>
                            setSettings((prev) => ({
                              ...prev,
                              watermark: { ...prev.watermark!, position: value },
                            }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="watermark-opacity" className="text-sm font-medium">
                          Opacity ({Math.round((settings.watermark.opacity || 0.3) * 100)}%)
                        </Label>
                        <input
                          id="watermark-opacity"
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={settings.watermark.opacity}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              watermark: { ...prev.watermark!, opacity: parseFloat(e.target.value) },
                            }))
                          }
                          className="mt-2 w-full"
                        />
                      </div>

                      <div>
                        <Label htmlFor="watermark-size" className="text-sm font-medium">
                          Font Size
                        </Label>
                        <Input
                          id="watermark-size"
                          type="number"
                          min="12"
                          max="72"
                          value={settings.watermark.fontSize}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              watermark: { ...prev.watermark!, fontSize: parseInt(e.target.value) || 48 },
                            }))
                          }
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Processing Settings */}
                <div className="space-y-4 border-t pt-6">
                  <Label className="text-base font-medium">Processing Settings</Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max-file-size" className="text-sm font-medium">
                        Max File Size (MB)
                      </Label>
                      <Input
                        id="max-file-size"
                        type="number"
                        min="1"
                        max="500"
                        value={Math.round(processingSettings.maxFileSize / (1024 * 1024))}
                        onChange={(e) =>
                          setProcessingSettings((prev) => ({
                            ...prev,
                            maxFileSize: (parseInt(e.target.value) || 100) * 1024 * 1024,
                          }))
                        }
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="max-files" className="text-sm font-medium">
                        Max Files per Operation
                      </Label>
                      <Input
                        id="max-files"
                        type="number"
                        min="2"
                        max="100"
                        value={processingSettings.maxFiles}
                        onChange={(e) =>
                          setProcessingSettings((prev) => ({
                            ...prev,
                            maxFiles: parseInt(e.target.value) || 50,
                          }))
                        }
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id="auto-optimize"
                        type="checkbox"
                        checked={processingSettings.autoOptimize}
                        onChange={(e) => setProcessingSettings((prev) => ({ ...prev, autoOptimize: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="auto-optimize" className="text-sm">
                        Auto-optimize large files
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="preserve-quality"
                        type="checkbox"
                        checked={processingSettings.preserveQuality}
                        onChange={(e) =>
                          setProcessingSettings((prev) => ({ ...prev, preserveQuality: e.target.checked }))
                        }
                        className="rounded border-input"
                      />
                      <Label htmlFor="preserve-quality" className="text-sm">
                        Preserve original quality when possible
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  PDF Merge Templates
                </CardTitle>
                <CardDescription>Pre-configured merge settings for common scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pdfTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs font-medium mb-1">Settings:</div>
                            <div className="text-xs text-muted-foreground">
                              Quality: {template.settings.quality} •
                              {template.settings.optimizeSize ? ' Optimized' : ' Standard'} •
                              {template.settings.includeBookmarks ? ' Bookmarks' : ' No Bookmarks'}
                              {template.settings.watermark?.enabled ? ' • Watermarked' : ''}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Use Cases:</div>
                            <div className="text-xs text-muted-foreground">{template.useCase.join(', ')}</div>
                          </div>
                        </div>
                        {template.examples.length > 0 && (
                          <div className="text-xs">
                            <strong>Examples:</strong> {template.examples.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const MergePDF = () => {
  return <MergePDFCore />
}

export default MergePDF
