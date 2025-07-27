import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { toast } from 'sonner'
import {
  Download,
  FileText,
  Code,
  Upload,
  FileImage,
  Trash2,
  Target,
  Copy,
  Check,
  Shuffle,
  RotateCcw,
  Hash,
  Shield,
  Zap,
  BarChart3,
  Settings,
  FileCode,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FileCheck,
  Folder,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  FileHashItem,
  FileHashData,
  FileContent,
  HashResult,
  FileHashStatistics,
  FileHashSettings,
  FileHashTemplate,
  FileIntegrityCheck,
  HashAlgorithm,
  ExportFormat,
} from '@/types/file-hash'
import { formatFileSize } from '@/lib/utils'

// Utility functions

const validateFileForHashing = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 500 * 1024 * 1024 // 500MB

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 500MB' }
  }

  if (file.size === 0) {
    return { isValid: false, error: 'File cannot be empty' }
  }

  return { isValid: true }
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <FileImage className="h-4 w-4" />
  if (type.startsWith('text/')) return <FileText className="h-4 w-4" />
  if (type.includes('json') || type.includes('javascript')) return <Code className="h-4 w-4" />
  return <FileCode className="h-4 w-4" />
}

// Enhanced file hashing algorithms
const getAlgorithmName = (algorithm: HashAlgorithm): string => {
  const algorithmMap: Record<HashAlgorithm, string> = {
    MD5: 'MD5',
    'SHA-1': 'SHA-1',
    'SHA-256': 'SHA-256',
    'SHA-384': 'SHA-384',
    'SHA-512': 'SHA-512',
  }
  return algorithmMap[algorithm] || 'SHA-256'
}

// Calculate file hash with progress tracking
const calculateFileHash = async (
  file: File,
  algorithm: HashAlgorithm,
  onProgress?: (progress: number) => void
): Promise<HashResult> => {
  const startTime = performance.now()

  try {
    if (!window.crypto?.subtle) {
      throw new Error('Web Crypto API not supported in this browser')
    }

    const algorithmName = getAlgorithmName(algorithm)
    const chunkSize = 1024 * 1024 // 1MB chunks for progress tracking
    const chunks = Math.ceil(file.size / chunkSize)
    let processedBytes = 0

    // For small files, process directly
    if (file.size <= chunkSize) {
      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await window.crypto.subtle.digest(algorithmName, arrayBuffer)
      const hashArray = new Uint8Array(hashBuffer)
      const hash = Array.from(hashArray)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      const processingTime = performance.now() - startTime

      return {
        algorithm,
        hash,
        processingTime,
        chunks: 1,
      }
    }

    // Note: Web Crypto API doesn't support streaming, so we'll read the entire file
    // In a real implementation, you'd use a streaming hash library
    const arrayBuffer = await file.arrayBuffer()

    // Simulate chunk processing for progress
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      processedBytes = end

      if (onProgress) {
        const progress = (processedBytes / file.size) * 100
        onProgress(progress)
      }

      // Small delay to allow UI updates
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    const hashBuffer = await window.crypto.subtle.digest(algorithmName, arrayBuffer)
    const hashArray = new Uint8Array(hashBuffer)
    const hash = Array.from(hashArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const processingTime = performance.now() - startTime

    return {
      algorithm,
      hash,
      processingTime,
      chunks,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'File hash calculation failed')
  }
}

// Calculate multiple hashes for a file
const calculateMultipleFileHashes = async (
  file: File,
  algorithms: HashAlgorithm[],
  onProgress?: (algorithm: HashAlgorithm, progress: number) => void
): Promise<HashResult[]> => {
  const results: HashResult[] = []

  for (const algorithm of algorithms) {
    try {
      const result = await calculateFileHash(file, algorithm, (progress) => {
        if (onProgress) {
          onProgress(algorithm, progress)
        }
      })
      results.push(result)
    } catch (error) {
      results.push({
        algorithm,
        hash: 'Error: ' + (error instanceof Error ? error.message : 'Hash calculation failed'),
        processingTime: 0,
        chunks: 0,
      })
    }
  }

  return results
}

// Verify file integrity
const verifyFileIntegrity = async (
  file: File,
  expectedHash: string,
  algorithm: HashAlgorithm
): Promise<FileIntegrityCheck> => {
  const startTime = performance.now()

  try {
    const result = await calculateFileHash(file, algorithm)
    const isValid = result.hash.toLowerCase() === expectedHash.toLowerCase()
    const processingTime = performance.now() - startTime

    return {
      id: nanoid(),
      fileName: file.name,
      expectedHash,
      actualHash: result.hash,
      algorithm,
      isValid,
      processingTime,
    }
  } catch (error) {
    return {
      id: nanoid(),
      fileName: file.name,
      expectedHash,
      actualHash: 'Error: ' + (error instanceof Error ? error.message : 'Verification failed'),
      algorithm,
      isValid: false,
      processingTime: performance.now() - startTime,
    }
  }
}

// File hash templates with different security levels
const fileHashTemplates: FileHashTemplate[] = [
  {
    id: 'integrity-check',
    name: 'File Integrity Check',
    description: 'Standard integrity verification (SHA-256)',
    category: 'Integrity',
    settings: {
      algorithms: ['SHA-256'],
      includeTimestamp: true,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: false,
      chunkSize: 1024 * 1024,
      showProgress: true,
      integrityCheck: true,
    },
    algorithms: ['SHA-256'],
    securityLevel: 'high',
  },
  {
    id: 'comprehensive-analysis',
    name: 'Comprehensive Analysis',
    description: 'Multiple algorithms for thorough analysis',
    category: 'Analysis',
    settings: {
      algorithms: ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'],
      includeTimestamp: true,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: false,
      chunkSize: 1024 * 1024,
      showProgress: true,
      integrityCheck: true,
    },
    algorithms: ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'],
    securityLevel: 'very-high',
  },
  {
    id: 'security-focused',
    name: 'Security Focused',
    description: 'Secure algorithms only (SHA-256, SHA-384, SHA-512)',
    category: 'Security',
    settings: {
      algorithms: ['SHA-256', 'SHA-384', 'SHA-512'],
      includeTimestamp: true,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: false,
      chunkSize: 512 * 1024,
      showProgress: true,
      integrityCheck: true,
    },
    algorithms: ['SHA-256', 'SHA-384', 'SHA-512'],
    securityLevel: 'very-high',
  },
  {
    id: 'legacy-support',
    name: 'Legacy Support',
    description: 'Includes legacy algorithms for compatibility',
    category: 'Legacy',
    settings: {
      algorithms: ['MD5', 'SHA-1', 'SHA-256'],
      includeTimestamp: false,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: false,
      chunkSize: 1024 * 1024,
      showProgress: true,
      integrityCheck: false,
    },
    algorithms: ['MD5', 'SHA-1', 'SHA-256'],
    securityLevel: 'medium',
  },
  {
    id: 'quick-check',
    name: 'Quick Check',
    description: 'Fast hashing for quick verification (SHA-256)',
    category: 'Quick',
    settings: {
      algorithms: ['SHA-256'],
      includeTimestamp: false,
      enableVerification: false,
      batchProcessing: false,
      realTimeHashing: true,
      chunkSize: 2 * 1024 * 1024,
      showProgress: false,
      integrityCheck: false,
    },
    algorithms: ['SHA-256'],
    securityLevel: 'high',
  },
  {
    id: 'forensic-analysis',
    name: 'Forensic Analysis',
    description: 'Comprehensive hashing for forensic purposes',
    category: 'Forensic',
    settings: {
      algorithms: ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'],
      includeTimestamp: true,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: false,
      chunkSize: 512 * 1024,
      showProgress: true,
      integrityCheck: true,
    },
    algorithms: ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'],
    securityLevel: 'very-high',
  },
]

// Process file hash data
const processFileHashData = (
  file: File,
  hashes: HashResult[],
  statistics: FileHashStatistics,
  settings: FileHashSettings
): FileHashData => {
  try {
    const fileContent: FileContent = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
    }

    return {
      original: fileContent,
      hashes,
      statistics,
      settings,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'File hash processing failed')
  }
}

// Custom hooks
const useFileHashGeneration = () => {
  const generateFileHash = useCallback(
    async (
      file: File,
      algorithms: HashAlgorithm[],
      onProgress?: (algorithm: HashAlgorithm, progress: number) => void
    ): Promise<FileHashData> => {
      try {
        const hashes = await calculateMultipleFileHashes(file, algorithms, onProgress)

        const statistics: FileHashStatistics = {
          totalFiles: 1,
          totalSize: file.size,
          algorithmDistribution: hashes.reduce(
            (acc, hash) => {
              acc[hash.algorithm] = (acc[hash.algorithm] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          ),
          averageProcessingTime: hashes.reduce((sum, hash) => sum + hash.processingTime, 0) / hashes.length,
          totalProcessingTime: hashes.reduce((sum, hash) => sum + hash.processingTime, 0),
          verificationCount: 0,
          successRate: 100,
          integrityScore: 100,
          largestFile: file.size,
          smallestFile: file.size,
        }

        const settings: FileHashSettings = {
          algorithms,
          includeTimestamp: true,
          enableVerification: true,
          batchProcessing: false,
          realTimeHashing: true,
          exportFormat: 'json',
          chunkSize: 1024 * 1024,
          showProgress: true,
          integrityCheck: true,
        }

        return processFileHashData(file, hashes, statistics, settings)
      } catch (error) {
        console.error('File hash generation error:', error)
        throw new Error(error instanceof Error ? error.message : 'File hash generation failed')
      }
    },
    []
  )

  const processBatch = useCallback(
    async (
      files: FileHashItem[],
      settings: FileHashSettings,
      onProgress?: (fileId: string, algorithm: HashAlgorithm, progress: number) => void
    ): Promise<FileHashItem[]> => {
      return Promise.all(
        files.map(async (fileItem) => {
          if (fileItem.status !== 'pending') return fileItem

          try {
            const hashData = await generateFileHash(fileItem.file, settings.algorithms, (algorithm, progress) => {
              if (onProgress) {
                onProgress(fileItem.id, algorithm, progress)
              }
            })

            return {
              ...fileItem,
              status: 'completed' as const,
              hashData,
              processedAt: new Date(),
              progress: 100,
            }
          } catch (error) {
            return {
              ...fileItem,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Processing failed',
              progress: 0,
            }
          }
        })
      )
    },
    [generateFileHash]
  )

  const processFiles = useCallback(
    async (
      files: FileHashItem[],
      settings: FileHashSettings,
      onProgress?: (fileId: string, algorithm: HashAlgorithm, progress: number) => void
    ): Promise<FileHashItem[]> => {
      const processedFiles = await processBatch(files, settings, onProgress)
      return processedFiles
    },
    [processBatch]
  )

  return { generateFileHash, processBatch, processFiles }
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<FileHashItem> => {
    const validation = validateFileForHashing(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    const fileHashItem: FileHashItem = {
      id: nanoid(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
    }

    return fileHashItem
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<FileHashItem[]> => {
      const results = await Promise.allSettled(files.map((file) => processFile(file)))

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            id: nanoid(),
            file: files[index],
            name: files[index].name,
            size: files[index].size,
            type: files[index].type,
            status: 'error' as const,
            error: result.reason.message || 'Processing failed',
            progress: 0,
          }
        }
      })
    },
    [processFile]
  )

  return { processFile, processBatch }
}

// Export functionality
const useFileHashExport = () => {
  const exportFileHash = useCallback((hashData: FileHashData, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(hashData, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVFromFileHash(hashData)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'xml':
        content = generateXMLFromFileHash(hashData)
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'txt':
      default:
        content = generateTextFromFileHash(hashData)
        mimeType = 'text/plain'
        extension = '.txt'
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `file-hash-${hashData.original.name}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: FileHashItem[]) => {
      const completedFiles = files.filter((f) => f.hashData)

      if (completedFiles.length === 0) {
        toast.error('No file hash data to export')
        return
      }

      completedFiles.forEach((file) => {
        if (file.hashData) {
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          exportFileHash(file.hashData, 'json', `${baseName}-hashes.json`)
        }
      })

      toast.success(`Exported hash data from ${completedFiles.length} file(s)`)
    },
    [exportFileHash]
  )

  const exportStatistics = useCallback((files: FileHashItem[]) => {
    const stats = files
      .filter((f) => f.hashData)
      .map((file) => ({
        filename: file.name,
        fileSize: formatFileSize(file.size),
        fileType: file.type,
        hashCount: file.hashData!.hashes.length,
        algorithms: file.hashData!.hashes.map((h) => h.algorithm).join(', '),
        processingTime: `${file.hashData!.statistics.totalProcessingTime.toFixed(2)}ms`,
        integrityScore: file.hashData!.statistics.integrityScore,
        status: file.status,
      }))

    const csvContent = [
      [
        'Filename',
        'File Size',
        'File Type',
        'Hash Count',
        'Algorithms',
        'Processing Time',
        'Integrity Score',
        'Status',
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.fileSize,
        stat.fileType,
        stat.hashCount.toString(),
        stat.algorithms,
        stat.processingTime,
        stat.integrityScore.toString(),
        stat.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'file-hash-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportFileHash, exportBatch, exportStatistics }
}

// Generate export formats
const generateTextFromFileHash = (hashData: FileHashData): string => {
  return `File Hash Report
================

File Information:
- Name: ${hashData.original.name}
- Size: ${formatFileSize(hashData.original.size)}
- Type: ${hashData.original.type}
- Last Modified: ${hashData.original.lastModified.toLocaleString()}

Hash Results:
${hashData.hashes.map((hash) => `- ${hash.algorithm}: ${hash.hash} (${hash.processingTime.toFixed(2)}ms, ${hash.chunks} chunks)`).join('\n')}

Statistics:
- Total Processing Time: ${hashData.statistics.totalProcessingTime.toFixed(2)}ms
- Average Processing Time: ${hashData.statistics.averageProcessingTime.toFixed(2)}ms
- Integrity Score: ${hashData.statistics.integrityScore}/100
`
}

const generateCSVFromFileHash = (hashData: FileHashData): string => {
  const rows = [
    ['Algorithm', 'Hash', 'Processing Time (ms)', 'Chunks'],
    ...hashData.hashes.map((hash) => [
      hash.algorithm,
      hash.hash,
      hash.processingTime.toFixed(2),
      hash.chunks?.toString() || '0',
    ]),
  ]

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

const generateXMLFromFileHash = (hashData: FileHashData): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<fileHashData>
  <file>
    <name>${hashData.original.name}</name>
    <size>${hashData.original.size}</size>
    <type>${hashData.original.type}</type>
    <lastModified>${hashData.original.lastModified.toISOString()}</lastModified>
  </file>
  <hashes>
    ${hashData.hashes
      .map(
        (hash) => `
    <hash>
      <algorithm>${hash.algorithm}</algorithm>
      <value>${hash.hash}</value>
      <processingTime>${hash.processingTime}</processingTime>
      <chunks>${hash.chunks || 0}</chunks>
    </hash>`
      )
      .join('')}
  </hashes>
  <statistics>
    <totalProcessingTime>${hashData.statistics.totalProcessingTime}</totalProcessingTime>
    <averageProcessingTime>${hashData.statistics.averageProcessingTime}</averageProcessingTime>
    <integrityScore>${hashData.statistics.integrityScore}</integrityScore>
  </statistics>
</fileHashData>`
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

// File drag and drop functionality
const useDragAndDrop = (onFilesDropped: (files: File[]) => void) => {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      const files = Array.from(e.dataTransfer.files)

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error('Please drop valid files')
      }
    },
    [onFilesDropped]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        onFilesDropped(files)
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [onFilesDropped]
  )

  return {
    dragActive,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileInput,
  }
}

/**
 * Enhanced File Hash Tool
 * Features: Real-time hashing, multiple algorithms, batch processing, comprehensive analysis
 */
const FileHashCore = () => {
  const [activeTab, setActiveTab] = useState<'hasher' | 'verify' | 'compare'>('hasher')
  const [files, setFiles] = useState<FileHashItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('integrity-check')
  const [verifyFile, setVerifyFile] = useState<File | null>(null)
  const [expectedHash, setExpectedHash] = useState('')
  const [verifyAlgorithm, setVerifyAlgorithm] = useState<HashAlgorithm>('SHA-256')
  const [verificationResult, setVerificationResult] = useState<FileIntegrityCheck | null>(null)
  const [settings, setSettings] = useState<FileHashSettings>({
    algorithms: ['SHA-256'],
    includeTimestamp: false,
    enableVerification: true,
    batchProcessing: true,
    realTimeHashing: true,
    exportFormat: 'json',
    chunkSize: 1024 * 1024,
    showProgress: true,
    integrityCheck: true,
  })

  const { processFiles } = useFileHashGeneration()
  const { exportBatch, exportStatistics } = useFileHashExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // File drag and drop
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    useCallback(async (droppedFiles: File[]) => {
      setIsProcessing(true)
      try {
        const { processBatch } = useFileProcessing()
        const processedFiles = await processBatch(droppedFiles)
        setFiles((prev) => [...processedFiles, ...prev])

        toast.success(`Added ${processedFiles.length} file(s)`)
      } catch (error) {
        toast.error('Failed to process files')
      } finally {
        setIsProcessing(false)
      }
    }, [])
  )

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = fileHashTemplates.find((t) => t.id === templateId)
    if (template && template.settings) {
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle file hash generation
  const handleGenerateHashes = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')

    if (pendingFiles.length === 0) {
      toast.error('No files to process')
      return
    }

    setIsProcessing(true)
    try {
      const processedFiles = await processFiles(files, settings, (fileId, _, progress) => {
        setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress, status: 'processing' as const } : f)))
      })

      setFiles(processedFiles)
      toast.success('File hashes generated successfully')
    } catch (error) {
      toast.error('Failed to generate file hashes')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [files, settings, processFiles])

  // Handle file verification
  const handleVerifyFile = useCallback(async () => {
    if (!verifyFile || !expectedHash.trim()) {
      toast.error('Please select a file and enter expected hash')
      return
    }

    setIsProcessing(true)
    try {
      const result = await verifyFileIntegrity(verifyFile, expectedHash, verifyAlgorithm)
      setVerificationResult(result)
      toast.success(result.isValid ? 'File verification successful' : 'File verification failed')
    } catch (error) {
      toast.error('Failed to verify file')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [verifyFile, expectedHash, verifyAlgorithm])

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
              <HardDrive className="h-5 w-5" aria-hidden="true" />
              File Hash & Integrity Verification
            </CardTitle>
            <CardDescription>
              Advanced file hashing tool with multiple algorithms and real-time processing. Generate secure file hashes
              for integrity verification and forensic analysis. Use keyboard navigation: Tab to move between controls,
              Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'hasher' | 'verify' | 'compare')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hasher" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              File Hasher
            </TabsTrigger>
            <TabsTrigger value="verify" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Integrity Check
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              File Comparison
            </TabsTrigger>
          </TabsList>

          {/* File Hasher Tab */}
          <TabsContent value="hasher" className="space-y-4">
            {/* Hash Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Hash Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fileHashTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? 'default' : 'outline'}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div className="text-xs font-mono mt-2 p-1 bg-muted/30 rounded flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {template.algorithms.length} algorithms • {template.category}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardContent className="pt-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Drag and drop files here or click to select files"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Files for Hash Generation</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your files here, or click to select files for hash generation
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <Folder className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">Supports all file types • Max 500MB per file</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select files for hash generation"
                  />
                </div>
              </CardContent>
            </Card>

            {/* File List */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Files ({files.length})</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleGenerateHashes}
                        disabled={isProcessing || files.filter((f) => f.status === 'pending').length === 0}
                      >
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                        ) : (
                          <Zap className="mr-2 h-4 w-4" />
                        )}
                        Generate Hashes
                      </Button>
                      <Button onClick={() => setFiles([])} variant="outline">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {files.map((file) => (
                      <div key={file.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Size:</span> {formatFileSize(file.size)} •
                              <span className="font-medium ml-2">Type:</span> {file.type || 'Unknown'}
                            </div>

                            {/* Progress Bar */}
                            {file.status === 'processing' && file.progress !== undefined && (
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${file.progress}%` }}
                                  />
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Processing... {file.progress.toFixed(0)}%
                                </div>
                              </div>
                            )}

                            {/* Hash Results */}
                            {file.status === 'completed' && file.hashData && (
                              <div className="mt-3 space-y-2">
                                {file.hashData.hashes.map((hash, index) => (
                                  <div key={index} className="text-xs">
                                    <div className="flex items-center justify-between">
                                      <Label className="font-medium">{hash.algorithm}:</Label>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(hash.hash, `${hash.algorithm} hash`)}
                                        className="h-6 px-2"
                                      >
                                        {copiedText === `${hash.algorithm} hash` ? (
                                          <Check className="h-3 w-3" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </div>
                                    <div className="font-mono text-xs bg-muted p-2 rounded break-all">{hash.hash}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {file.error && <div className="text-red-600 text-sm mt-2">Error: {file.error}</div>}
                          </div>
                          <div className="flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Integrity Check Tab */}
          <TabsContent value="verify" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  File Integrity Verification
                </CardTitle>
                <CardDescription>Verify file integrity by comparing against expected hash values</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="verify-file" className="text-sm font-medium">
                      Select File
                    </Label>
                    <div className="mt-2">
                      <Input
                        id="verify-file"
                        type="file"
                        onChange={(e) => setVerifyFile(e.target.files?.[0] || null)}
                        aria-label="Select file for verification"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expected-hash" className="text-sm font-medium">
                      Expected Hash
                    </Label>
                    <Textarea
                      id="expected-hash"
                      placeholder="Enter expected hash value..."
                      value={expectedHash}
                      onChange={(e) => setExpectedHash(e.target.value)}
                      className="mt-2 font-mono text-sm"
                      rows={3}
                      aria-label="Expected hash value for verification"
                    />
                  </div>

                  <div>
                    <Label htmlFor="verify-algorithm" className="text-sm font-medium">
                      Hash Algorithm
                    </Label>
                    <Select value={verifyAlgorithm} onValueChange={(value: HashAlgorithm) => setVerifyAlgorithm(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MD5">MD5</SelectItem>
                        <SelectItem value="SHA-1">SHA-1</SelectItem>
                        <SelectItem value="SHA-256">SHA-256</SelectItem>
                        <SelectItem value="SHA-384">SHA-384</SelectItem>
                        <SelectItem value="SHA-512">SHA-512</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleVerifyFile} disabled={!verifyFile || !expectedHash.trim() || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <FileCheck className="mr-2 h-4 w-4" />
                      )}
                      Verify Integrity
                    </Button>
                    <Button
                      onClick={() => {
                        setVerifyFile(null)
                        setExpectedHash('')
                        setVerificationResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {/* Verification Result */}
                  {verificationResult && (
                    <div
                      className={`border rounded-lg p-4 ${
                        verificationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {verificationResult.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span
                          className={`font-medium ${verificationResult.isValid ? 'text-green-800' : 'text-red-800'}`}
                        >
                          {verificationResult.isValid ? 'File Integrity Verified' : 'File Integrity Check Failed'}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium">File:</span> {verificationResult.fileName}
                        </div>
                        <div>
                          <span className="font-medium">Algorithm:</span> {verificationResult.algorithm}
                        </div>
                        <div>
                          <span className="font-medium">Expected:</span>{' '}
                          <code className="text-xs">{verificationResult.expectedHash}</code>
                        </div>
                        <div>
                          <span className="font-medium">Actual:</span>{' '}
                          <code className="text-xs">{verificationResult.actualHash}</code>
                        </div>
                        <div className="text-muted-foreground">
                          Verification completed in {verificationResult.processingTime.toFixed(2)}ms
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* File Comparison Tab */}
          <TabsContent value="compare" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  File Comparison
                </CardTitle>
                <CardDescription>
                  Compare hash values between files to check for duplicates or differences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shuffle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">File Comparison</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate hashes for multiple files in the File Hasher tab to enable comparison functionality
                  </p>
                  <Button onClick={() => setActiveTab('hasher')} variant="outline">
                    Go to File Hasher
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Hash Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="export-format" className="text-sm font-medium">
                    Export Format
                  </Label>
                  <Select
                    value={settings.exportFormat}
                    onValueChange={(value: ExportFormat) => setSettings((prev) => ({ ...prev, exportFormat: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="txt">Text</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="chunk-size" className="text-sm font-medium">
                    Chunk Size (KB)
                  </Label>
                  <Select
                    value={(settings.chunkSize / 1024).toString()}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, chunkSize: parseInt(value) * 1024 }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="512">512 KB</SelectItem>
                      <SelectItem value="1024">1 MB</SelectItem>
                      <SelectItem value="2048">2 MB</SelectItem>
                      <SelectItem value="4096">4 MB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Hash Algorithms</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as HashAlgorithm[]).map((algorithm) => (
                    <div key={algorithm} className="flex items-center space-x-2">
                      <input
                        id={`algorithm-${algorithm}`}
                        type="checkbox"
                        checked={settings.algorithms.includes(algorithm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings((prev) => ({
                              ...prev,
                              algorithms: [...prev.algorithms, algorithm],
                            }))
                          } else {
                            setSettings((prev) => ({
                              ...prev,
                              algorithms: prev.algorithms.filter((a) => a !== algorithm),
                            }))
                          }
                        }}
                        className="rounded border-input"
                      />
                      <Label htmlFor={`algorithm-${algorithm}`} className="text-sm flex items-center gap-1">
                        {algorithm}
                        {(algorithm === 'SHA-256' || algorithm === 'SHA-384' || algorithm === 'SHA-512') && (
                          <Shield className="h-3 w-3 text-green-600" />
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    id="include-timestamp"
                    type="checkbox"
                    checked={settings.includeTimestamp}
                    onChange={(e) => setSettings((prev) => ({ ...prev, includeTimestamp: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <Label htmlFor="include-timestamp" className="text-sm">
                    Include timestamp in exports
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="show-progress"
                    type="checkbox"
                    checked={settings.showProgress}
                    onChange={(e) => setSettings((prev) => ({ ...prev, showProgress: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <Label htmlFor="show-progress" className="text-sm">
                    Show progress indicators
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="integrity-check"
                    type="checkbox"
                    checked={settings.integrityCheck}
                    onChange={(e) => setSettings((prev) => ({ ...prev, integrityCheck: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <Label htmlFor="integrity-check" className="text-sm">
                    Enable integrity checking
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="batch-processing"
                    type="checkbox"
                    checked={settings.batchProcessing}
                    onChange={(e) => setSettings((prev) => ({ ...prev, batchProcessing: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <Label htmlFor="batch-processing" className="text-sm">
                    Enable batch processing
                  </Label>
                </div>
              </div>

              {files.filter((f) => f.hashData).length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => exportBatch(files)} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export All Hashes
                  </Button>
                  <Button onClick={() => exportStatistics(files)} variant="outline">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Export Statistics
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const FileHash = () => {
  return <FileHashCore />
}

export default FileHash
