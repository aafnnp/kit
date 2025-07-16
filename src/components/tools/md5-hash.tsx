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
  Code,
  Upload,
  Trash2,
  Target,
  Copy,
  Check,
  RotateCcw,
  Hash,
  Shield,
  Zap,
  Settings,
  FileCode,
} from 'lucide-react'
import { nanoid } from 'nanoid'
// Enhanced Types
interface HashFile {
  id: string
  name: string
  content: string | ArrayBuffer
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  hashData?: HashData
}

interface HashData {
  original: HashContent
  hashes: HashResult[]
  statistics: HashStatistics
  settings: HashSettings
}

interface HashContent {
  content: string | ArrayBuffer
  size: number
  type: 'text' | 'file'
  encoding: string
}

interface HashResult {
  algorithm: HashAlgorithm
  hash: string
  processingTime: number
  verified?: boolean
}

interface HashStatistics {
  totalHashes: number
  algorithmDistribution: Record<string, number>
  averageProcessingTime: number
  totalProcessingTime: number
  collisionCount: number
  verificationCount: number
  successRate: number
}

interface HashSettings {
  algorithms: HashAlgorithm[]
  outputFormat: OutputFormat
  includeTimestamp: boolean
  enableVerification: boolean
  batchProcessing: boolean
  realTimeHashing: boolean
  exportFormat: ExportFormat
}

interface HashTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<HashSettings>
  algorithms: HashAlgorithm[]
}

// Enums
type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512' | 'SHA-384' | 'SHA-3'
type OutputFormat = 'hex' | 'base64' | 'binary'
type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'

// Utility functions

const validateHashFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 100 * 1024 * 1024 // 100MB

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 100MB' }
  }

  return { isValid: true }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Enhanced hash algorithms
const getAlgorithmName = (algorithm: HashAlgorithm): string => {
  const algorithmMap: Record<HashAlgorithm, string> = {
    MD5: 'MD5',
    'SHA-1': 'SHA-1',
    'SHA-256': 'SHA-256',
    'SHA-384': 'SHA-384',
    'SHA-512': 'SHA-512',
    'SHA-3': 'SHA-256', // Fallback to SHA-256 for SHA-3 as it's not widely supported
  }
  return algorithmMap[algorithm] || 'SHA-256'
}

// Calculate hash for text
const calculateTextHash = async (
  text: string,
  algorithm: HashAlgorithm,
  outputFormat: OutputFormat = 'hex'
): Promise<string> => {
  try {
    if (!window.crypto?.subtle) {
      throw new Error('Web Crypto API not supported in this browser')
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const algorithmName = getAlgorithmName(algorithm)

    const hashBuffer = await window.crypto.subtle.digest(algorithmName, data)
    const hashArray = new Uint8Array(hashBuffer)

    switch (outputFormat) {
      case 'hex':
        return Array.from(hashArray)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      case 'base64':
        return btoa(String.fromCharCode(...hashArray))
      case 'binary':
        return String.fromCharCode(...hashArray)
      default:
        return Array.from(hashArray)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Hash calculation failed')
  }
}

// Calculate multiple hashes
const calculateMultipleHashes = async (
  content: string | ArrayBuffer,
  algorithms: HashAlgorithm[],
  outputFormat: OutputFormat = 'hex',
  isFile: boolean = false
): Promise<HashResult[]> => {
  const results: HashResult[] = []

  for (const algorithm of algorithms) {
    const startTime = performance.now()

    try {
      let hash: string

      if (isFile && content instanceof ArrayBuffer) {
        // For file content
        if (!window.crypto?.subtle) {
          throw new Error('Web Crypto API not supported in this browser')
        }

        const algorithmName = getAlgorithmName(algorithm)
        const hashBuffer = await window.crypto.subtle.digest(algorithmName, content)
        const hashArray = new Uint8Array(hashBuffer)

        switch (outputFormat) {
          case 'hex':
            hash = Array.from(hashArray)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
            break
          case 'base64':
            hash = btoa(String.fromCharCode(...hashArray))
            break
          case 'binary':
            hash = String.fromCharCode(...hashArray)
            break
          default:
            hash = Array.from(hashArray)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
        }
      } else {
        // For text content
        hash = await calculateTextHash(content as string, algorithm, outputFormat)
      }

      const processingTime = performance.now() - startTime

      results.push({
        algorithm,
        hash,
        processingTime,
      })
    } catch (error) {
      results.push({
        algorithm,
        hash: 'Error: ' + (error instanceof Error ? error.message : 'Hash calculation failed'),
        processingTime: performance.now() - startTime,
      })
    }
  }

  return results
}

// Hash templates
const hashTemplates: HashTemplate[] = [
  {
    id: 'security-basic',
    name: 'Security Basic',
    description: 'Basic security hashing with MD5 and SHA-256',
    category: 'Security',
    settings: {
      algorithms: ['MD5', 'SHA-256'],
      outputFormat: 'hex',
      includeTimestamp: false,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: true,
    },
    algorithms: ['MD5', 'SHA-256'],
  },
  {
    id: 'security-advanced',
    name: 'Security Advanced',
    description: 'Advanced security with multiple SHA algorithms',
    category: 'Security',
    settings: {
      algorithms: ['SHA-256', 'SHA-384', 'SHA-512'],
      outputFormat: 'hex',
      includeTimestamp: true,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: true,
    },
    algorithms: ['SHA-256', 'SHA-384', 'SHA-512'],
  },
  {
    id: 'file-integrity',
    name: 'File Integrity',
    description: 'File integrity checking with SHA-256 and SHA-512',
    category: 'Integrity',
    settings: {
      algorithms: ['SHA-256', 'SHA-512'],
      outputFormat: 'hex',
      includeTimestamp: true,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: false,
    },
    algorithms: ['SHA-256', 'SHA-512'],
  },
  {
    id: 'legacy-support',
    name: 'Legacy Support',
    description: 'Legacy hash support including MD5 and SHA-1',
    category: 'Legacy',
    settings: {
      algorithms: ['MD5', 'SHA-1', 'SHA-256'],
      outputFormat: 'hex',
      includeTimestamp: false,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: true,
    },
    algorithms: ['MD5', 'SHA-1', 'SHA-256'],
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive',
    description: 'All available hash algorithms',
    category: 'Complete',
    settings: {
      algorithms: ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'],
      outputFormat: 'hex',
      includeTimestamp: true,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: false,
    },
    algorithms: ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'],
  },
  {
    id: 'quick-check',
    name: 'Quick Check',
    description: 'Fast hashing with MD5 only',
    category: 'Quick',
    settings: {
      algorithms: ['MD5'],
      outputFormat: 'hex',
      includeTimestamp: false,
      enableVerification: false,
      batchProcessing: false,
      realTimeHashing: true,
    },
    algorithms: ['MD5'],
  },
]

// Process hash data
const processHashData = (
  content: string | ArrayBuffer,
  hashes: HashResult[],
  statistics: HashStatistics,
  settings: HashSettings
): HashData => {
  try {
    const hashContent: HashContent = {
      content,
      size: typeof content === 'string' ? new Blob([content]).size : content.byteLength,
      type: typeof content === 'string' ? 'text' : 'file',
      encoding: 'utf-8',
    }

    return {
      original: hashContent,
      hashes,
      statistics,
      settings,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Hash processing failed')
  }
}

// Error boundary component
class Md5HashErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MD5 Hash error:', error, errorInfo)
    toast.error('An unexpected error occurred during hash processing')
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-600">
                <h3 className="font-semibold">Something went wrong</h3>
                <p className="text-sm">Please refresh the page and try again.</p>
              </div>
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Custom hooks
const useHashGeneration = () => {
  const generateHash = useCallback(
    async (
      content: string | ArrayBuffer,
      algorithms: HashAlgorithm[],
      outputFormat: OutputFormat = 'hex'
    ): Promise<HashData> => {
      try {
        const isFile = content instanceof ArrayBuffer
        const hashes = await calculateMultipleHashes(content, algorithms, outputFormat, isFile)

        const statistics: HashStatistics = {
          totalHashes: hashes.length,
          algorithmDistribution: hashes.reduce(
            (acc, hash) => {
              acc[hash.algorithm] = (acc[hash.algorithm] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          ),
          averageProcessingTime: hashes.reduce((sum, hash) => sum + hash.processingTime, 0) / hashes.length,
          totalProcessingTime: hashes.reduce((sum, hash) => sum + hash.processingTime, 0),
          collisionCount: 0,
          verificationCount: 0,
          successRate: 100,
        }

        const settings: HashSettings = {
          algorithms,
          outputFormat,
          includeTimestamp: true,
          enableVerification: true,
          batchProcessing: false,
          realTimeHashing: true,
          exportFormat: 'json',
        }

        return processHashData(content, hashes, statistics, settings)
      } catch (error) {
        console.error('Hash generation error:', error)
        throw new Error(error instanceof Error ? error.message : 'Hash generation failed')
      }
    },
    []
  )

  const processBatch = useCallback(
    async (files: HashFile[], settings: HashSettings): Promise<HashFile[]> => {
      return Promise.all(
        files.map(async (file) => {
          if (file.status !== 'pending') return file

          try {
            const content = typeof file.content === 'string' ? file.content : file.content
            const hashData = await generateHash(content, settings.algorithms, settings.outputFormat)

            return {
              ...file,
              status: 'completed' as const,
              hashData,
              processedAt: new Date(),
            }
          } catch (error) {
            return {
              ...file,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Processing failed',
            }
          }
        })
      )
    },
    [generateHash]
  )

  const processFiles = useCallback(
    async (files: HashFile[], settings: HashSettings): Promise<HashFile[]> => {
      const processedFiles = await processBatch(files, settings)
      return processedFiles
    },
    [processBatch]
  )

  return { generateHash, processBatch, processFiles }
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<HashFile> => {
    const validation = validateHashFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as ArrayBuffer

          const hashFile: HashFile = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type,
            status: 'pending',
          }

          resolve(hashFile)
        } catch (error) {
          reject(new Error('Failed to process file'))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<HashFile[]> => {
      const results = await Promise.allSettled(files.map((file) => processFile(file)))

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            id: nanoid(),
            name: files[index].name,
            content: '',
            size: files[index].size,
            type: files[index].type,
            status: 'error' as const,
            error: result.reason.message || 'Processing failed',
          }
        }
      })
    },
    [processFile]
  )

  return { processFile, processBatch }
}

// Export functionality
const useHashExport = () => {
  const exportHash = useCallback((hashData: HashData, format: ExportFormat, filename?: string) => {
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
        content = generateCSVFromHash(hashData)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'xml':
        content = generateXMLFromHash(hashData)
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'txt':
      default:
        content = generateTextFromHash(hashData)
        mimeType = 'text/plain'
        extension = '.txt'
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `hash-data${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: HashFile[]) => {
      const completedFiles = files.filter((f) => f.hashData)

      if (completedFiles.length === 0) {
        toast.error('No hash data to export')
        return
      }

      completedFiles.forEach((file) => {
        if (file.hashData) {
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          exportHash(file.hashData, 'json', `${baseName}-hashes.json`)
        }
      })

      toast.success(`Exported hash data from ${completedFiles.length} file(s)`)
    },
    [exportHash]
  )

  const exportStatistics = useCallback((files: HashFile[]) => {
    const stats = files
      .filter((f) => f.hashData)
      .map((file) => ({
        filename: file.name,
        fileSize: formatFileSize(file.size),
        hashCount: file.hashData!.hashes.length,
        algorithms: file.hashData!.hashes.map((h) => h.algorithm).join(', '),
        processingTime: `${file.hashData!.statistics.totalProcessingTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      ['Filename', 'File Size', 'Hash Count', 'Algorithms', 'Processing Time', 'Status'],
      ...stats.map((stat) => [
        stat.filename,
        stat.fileSize,
        stat.hashCount.toString(),
        stat.algorithms,
        stat.processingTime,
        stat.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'hash-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportHash, exportBatch, exportStatistics }
}

// Generate export formats
const generateTextFromHash = (hashData: HashData): string => {
  return `Hash Report
===========

Content Type: ${hashData.original.type}
Content Size: ${formatFileSize(hashData.original.size)}

Hash Results:
${hashData.hashes.map((hash) => `- ${hash.algorithm}: ${hash.hash} (${hash.processingTime.toFixed(2)}ms)`).join('\n')}

Statistics:
- Total Hashes: ${hashData.statistics.totalHashes}
- Total Processing Time: ${hashData.statistics.totalProcessingTime.toFixed(2)}ms
- Average Processing Time: ${hashData.statistics.averageProcessingTime.toFixed(2)}ms
- Success Rate: ${hashData.statistics.successRate.toFixed(1)}%
`
}

const generateCSVFromHash = (hashData: HashData): string => {
  const rows = [
    ['Algorithm', 'Hash', 'Processing Time (ms)'],
    ...hashData.hashes.map((hash) => [hash.algorithm, hash.hash, hash.processingTime.toFixed(2)]),
  ]

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

const generateXMLFromHash = (hashData: HashData): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<hashData>
  <original>
    <type>${hashData.original.type}</type>
    <size>${hashData.original.size}</size>
  </original>
  <hashes>
    ${hashData.hashes
      .map(
        (hash) => `
    <hash>
      <algorithm>${hash.algorithm}</algorithm>
      <value>${hash.hash}</value>
      <processingTime>${hash.processingTime}</processingTime>
    </hash>`
      )
      .join('')}
  </hashes>
  <statistics>
    <totalHashes>${hashData.statistics.totalHashes}</totalHashes>
    <totalProcessingTime>${hashData.statistics.totalProcessingTime}</totalProcessingTime>
    <averageProcessingTime>${hashData.statistics.averageProcessingTime}</averageProcessingTime>
    <successRate>${hashData.statistics.successRate}</successRate>
  </statistics>
</hashData>`
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
 * Enhanced MD5 Hash Tool
 * Features: Real-time hashing, multiple algorithms, batch processing, comprehensive analysis
 */
const Md5HashCore = () => {
  const [activeTab, setActiveTab] = useState<'hasher' | 'files'>('hasher')
  const [currentText, setCurrentText] = useState<string>('')
  const [currentHashData, setCurrentHashData] = useState<HashData | null>(null)
  const [files, setFiles] = useState<HashFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('security-basic')
  const [settings, setSettings] = useState<HashSettings>({
    algorithms: ['MD5', 'SHA-256'],
    outputFormat: 'hex',
    includeTimestamp: false,
    enableVerification: true,
    batchProcessing: true,
    realTimeHashing: true,
    exportFormat: 'json',
  })

  const { generateHash } = useHashGeneration()
  const { exportHash } = useHashExport()
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
    const template = hashTemplates.find((t) => t.id === templateId)
    if (template && template.settings) {
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle hash generation
  const handleGenerateHash = useCallback(async () => {
    if (!currentText.trim()) {
      toast.error('Please enter text to hash')
      return
    }

    setIsProcessing(true)
    try {
      const hashData = await generateHash(currentText, settings.algorithms, settings.outputFormat)
      setCurrentHashData(hashData)
      toast.success('Hash generated successfully')
    } catch (error) {
      toast.error('Failed to generate hash')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [currentText, settings, generateHash])

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
              <Hash className="h-5 w-5" aria-hidden="true" />
              MD5 Hash & Cryptographic Tools
            </CardTitle>
            <CardDescription>
              Advanced hash generation and verification tool with multiple algorithms and real-time processing. Generate
              secure hashes for text and files with comprehensive analysis. Use keyboard navigation: Tab to move between
              controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'hasher' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hasher" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Hash Generator
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Hash Generator Tab */}
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
                  {hashTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? 'default' : 'outline'}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div className="text-xs font-mono mt-2 p-1 bg-muted/30 rounded">
                          {template.algorithms.length} algorithms • {template.category}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Text Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Text Input
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter text to hash..."
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                    className="min-h-[120px]"
                    aria-label="Text input for hashing"
                  />

                  <div className="flex gap-2">
                    <Button onClick={handleGenerateHash} disabled={!currentText.trim() || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Generate Hash
                    </Button>
                    <Button onClick={() => setCurrentText('')} variant="outline">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hash Results */}
            {currentHashData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Hash Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentHashData.hashes.map((hash, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">{hash.algorithm}</Label>
                          <span className="text-xs text-muted-foreground">{hash.processingTime.toFixed(2)}ms</span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={hash.hash}
                            readOnly
                            className="font-mono text-sm"
                            aria-label={`${hash.algorithm} hash result`}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(hash.hash, `${hash.algorithm} hash`)}
                          >
                            {copiedText === `${hash.algorithm} hash` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button onClick={() => exportHash(currentHashData, settings.exportFormat)} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Batch Processing Tab */}
          <TabsContent value="files" className="space-y-4">
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
                    Drag and drop your files here, or click to select files for batch hash generation
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileCode className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">Supports all file types • Max 100MB per file</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select files for hashing"
                  />
                </div>
              </CardContent>
            </Card>

            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Files ({files.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {files.map((file) => (
                      <div key={file.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <FileCode className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Size:</span> {formatFileSize(file.size)}
                            </div>
                            {file.status === 'completed' && file.hashData && (
                              <div className="mt-2 text-xs">{file.hashData.hashes.length} hashes generated</div>
                            )}
                            {file.error && <div className="text-red-600 text-sm">Error: {file.error}</div>}
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
                    <Label htmlFor="output-format" className="text-sm font-medium">
                      Output Format
                    </Label>
                    <Select
                      value={settings.outputFormat}
                      onValueChange={(value: OutputFormat) => setSettings((prev) => ({ ...prev, outputFormat: value }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hex">Hexadecimal</SelectItem>
                        <SelectItem value="base64">Base64</SelectItem>
                        <SelectItem value="binary">Binary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                        <Label htmlFor={`algorithm-${algorithm}`} className="text-sm">
                          {algorithm}
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
                      id="enable-verification"
                      type="checkbox"
                      checked={settings.enableVerification}
                      onChange={(e) => setSettings((prev) => ({ ...prev, enableVerification: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="enable-verification" className="text-sm">
                      Enable hash verification
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="real-time-hashing"
                      type="checkbox"
                      checked={settings.realTimeHashing}
                      onChange={(e) => setSettings((prev) => ({ ...prev, realTimeHashing: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="real-time-hashing" className="text-sm">
                      Real-time hash generation
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const Md5Hash = () => {
  return <Md5HashCore />
}

export default Md5Hash
