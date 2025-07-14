import React, { useCallback, useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Eye,
  Shuffle,
  RotateCcw,
  ArrowUpDown,
  Lock,
  Unlock,
} from 'lucide-react'

// Types
interface Base64File {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  encodingData?: EncodingData
}

interface EncodingData {
  encodings: EncodingResult[]
  statistics: EncodingStatistics
  settings: EncodingSettings
}

interface EncodingResult {
  id: string
  operation: EncodingOperation
  input: string
  output: string
  inputFormat: EncodingFormat
  outputFormat: EncodingFormat
  metadata: EncodingMetadata
}

interface EncodingMetadata {
  inputSize: number
  outputSize: number
  compressionRatio: number
  processingTime: number
  isValid: boolean
  encoding: string
}

interface EncodingStatistics {
  totalEncodings: number
  operationDistribution: Record<EncodingOperation, number>
  averageCompressionRatio: number
  averageProcessingTime: number
  successRate: number
  processingTime: number
}

interface EncodingSettings {
  defaultOperation: EncodingOperation
  defaultFormat: EncodingFormat
  includeMetadata: boolean
  optimizeOutput: boolean
  exportFormat: ExportFormat
  chunkSize: number
}

interface EncodingTemplate {
  id: string
  name: string
  description: string
  category: string
  operation: EncodingOperation
  inputFormat: EncodingFormat
  outputFormat: EncodingFormat
  example: string
}

// Enums
type EncodingOperation = 'encode' | 'decode'
type EncodingFormat = 'text' | 'base64' | 'url' | 'hex' | 'binary'
type ExportFormat = 'txt' | 'json' | 'csv'

// Utility functions
const generateId = (): string => Math.random().toString(36).substring(2, 11)

const validateEncodingFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['.txt', '.json', '.csv', '.xml', '.html', '.js', '.css']

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' }
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: 'Only text-based files are supported' }
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

// Encoding functions
const encodeBase64 = (input: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(input)))
  } catch (error) {
    throw new Error('Failed to encode to Base64')
  }
}

const decodeBase64 = (input: string): string => {
  try {
    return decodeURIComponent(escape(atob(input)))
  } catch (error) {
    throw new Error('Invalid Base64 string')
  }
}

const encodeURL = (input: string): string => {
  try {
    return encodeURIComponent(input)
  } catch (error) {
    throw new Error('Failed to encode URL')
  }
}

const decodeURL = (input: string): string => {
  try {
    return decodeURIComponent(input)
  } catch (error) {
    throw new Error('Invalid URL encoded string')
  }
}

const encodeHex = (input: string): string => {
  try {
    return Array.from(new TextEncoder().encode(input))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  } catch (error) {
    throw new Error('Failed to encode to Hex')
  }
}

const decodeHex = (input: string): string => {
  try {
    const cleanInput = input.replace(/\s/g, '')
    if (cleanInput.length % 2 !== 0) {
      throw new Error('Invalid hex string length')
    }

    const bytes = []
    for (let i = 0; i < cleanInput.length; i += 2) {
      bytes.push(parseInt(cleanInput.substr(i, 2), 16))
    }

    return new TextDecoder().decode(new Uint8Array(bytes))
  } catch (error) {
    throw new Error('Invalid Hex string')
  }
}

const encodeBinary = (input: string): string => {
  try {
    return Array.from(new TextEncoder().encode(input))
      .map((byte) => byte.toString(2).padStart(8, '0'))
      .join(' ')
  } catch (error) {
    throw new Error('Failed to encode to Binary')
  }
}

const decodeBinary = (input: string): string => {
  try {
    const binaryArray = input.split(/\s+/).filter((bin) => bin.length > 0)
    const bytes = binaryArray.map((bin) => {
      if (bin.length !== 8 || !/^[01]+$/.test(bin)) {
        throw new Error('Invalid binary format')
      }
      return parseInt(bin, 2)
    })

    return new TextDecoder().decode(new Uint8Array(bytes))
  } catch (error) {
    throw new Error('Invalid Binary string')
  }
}

// Main encoding function
const performEncoding = (
  input: string,
  operation: EncodingOperation,
  inputFormat: EncodingFormat,
  outputFormat: EncodingFormat
): EncodingResult => {
  const startTime = performance.now()
  const inputSize = new Blob([input]).size

  try {
    let output = ''

    if (operation === 'encode') {
      switch (outputFormat) {
        case 'base64':
          output = encodeBase64(input)
          break
        case 'url':
          output = encodeURL(input)
          break
        case 'hex':
          output = encodeHex(input)
          break
        case 'binary':
          output = encodeBinary(input)
          break
        default:
          output = input
      }
    } else {
      switch (inputFormat) {
        case 'base64':
          output = decodeBase64(input)
          break
        case 'url':
          output = decodeURL(input)
          break
        case 'hex':
          output = decodeHex(input)
          break
        case 'binary':
          output = decodeBinary(input)
          break
        default:
          output = input
      }
    }

    const outputSize = new Blob([output]).size
    const processingTime = performance.now() - startTime
    const compressionRatio = inputSize > 0 ? outputSize / inputSize : 1

    return {
      id: generateId(),
      operation,
      input,
      output,
      inputFormat,
      outputFormat,
      metadata: {
        inputSize,
        outputSize,
        compressionRatio,
        processingTime,
        isValid: true,
        encoding: operation === 'encode' ? outputFormat : inputFormat,
      },
    }
  } catch (error) {
    const processingTime = performance.now() - startTime

    return {
      id: generateId(),
      operation,
      input,
      output: '',
      inputFormat,
      outputFormat,
      metadata: {
        inputSize,
        outputSize: 0,
        compressionRatio: 0,
        processingTime,
        isValid: false,
        encoding: operation === 'encode' ? outputFormat : inputFormat,
      },
    }
  }
}

// Encoding templates
const encodingTemplates: EncodingTemplate[] = [
  {
    id: 'text-to-base64',
    name: 'Text to Base64',
    description: 'Encode plain text to Base64',
    category: 'Base64',
    operation: 'encode',
    inputFormat: 'text',
    outputFormat: 'base64',
    example: 'Hello World → SGVsbG8gV29ybGQ=',
  },
  {
    id: 'base64-to-text',
    name: 'Base64 to Text',
    description: 'Decode Base64 to plain text',
    category: 'Base64',
    operation: 'decode',
    inputFormat: 'base64',
    outputFormat: 'text',
    example: 'SGVsbG8gV29ybGQ= → Hello World',
  },
  {
    id: 'text-to-url',
    name: 'Text to URL Encoded',
    description: 'Encode text for URL usage',
    category: 'URL',
    operation: 'encode',
    inputFormat: 'text',
    outputFormat: 'url',
    example: 'Hello World! → Hello%20World%21',
  },
  {
    id: 'url-to-text',
    name: 'URL Encoded to Text',
    description: 'Decode URL encoded text',
    category: 'URL',
    operation: 'decode',
    inputFormat: 'url',
    outputFormat: 'text',
    example: 'Hello%20World%21 → Hello World!',
  },
  {
    id: 'text-to-hex',
    name: 'Text to Hex',
    description: 'Convert text to hexadecimal',
    category: 'Hex',
    operation: 'encode',
    inputFormat: 'text',
    outputFormat: 'hex',
    example: 'Hello → 48656c6c6f',
  },
  {
    id: 'hex-to-text',
    name: 'Hex to Text',
    description: 'Convert hexadecimal to text',
    category: 'Hex',
    operation: 'decode',
    inputFormat: 'hex',
    outputFormat: 'text',
    example: '48656c6c6f → Hello',
  },
  {
    id: 'text-to-binary',
    name: 'Text to Binary',
    description: 'Convert text to binary',
    category: 'Binary',
    operation: 'encode',
    inputFormat: 'text',
    outputFormat: 'binary',
    example: 'Hi → 01001000 01101001',
  },
  {
    id: 'binary-to-text',
    name: 'Binary to Text',
    description: 'Convert binary to text',
    category: 'Binary',
    operation: 'decode',
    inputFormat: 'binary',
    outputFormat: 'text',
    example: '01001000 01101001 → Hi',
  },
]

// Error boundary component
class Base64EncodeErrorBoundary extends React.Component<
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
    console.error('Base64 Encode error:', error, errorInfo)
    toast.error('An unexpected error occurred during encoding/decoding')
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

// Real-time encoding hook
const useRealTimeEncoding = (
  input: string,
  operation: EncodingOperation,
  inputFormat: EncodingFormat,
  outputFormat: EncodingFormat
) => {
  return useMemo(() => {
    if (!input.trim()) {
      return {
        result: null,
        error: null,
        isEmpty: true,
      }
    }

    try {
      const result = performEncoding(input, operation, inputFormat, outputFormat)
      return {
        result,
        error: null,
        isEmpty: false,
      }
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Encoding failed',
        isEmpty: false,
      }
    }
  }, [input, operation, inputFormat, outputFormat])
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<Base64File> => {
    const validation = validateEncodingFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const encodingFile: Base64File = {
            id: generateId(),
            name: file.name,
            content,
            size: file.size,
            type: file.type || 'text/plain',
            status: 'pending',
          }

          resolve(encodingFile)
        } catch (error) {
          reject(new Error('Failed to process file'))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<Base64File[]> => {
      const results = await Promise.allSettled(files.map((file) => processFile(file)))

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            id: generateId(),
            name: files[index].name,
            content: '',
            size: files[index].size,
            type: files[index].type || 'text/plain',
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
const useEncodingExport = () => {
  const exportResult = useCallback((result: EncodingResult, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'txt':
        content = result.output
        mimeType = 'text/plain'
        extension = '.txt'
        break
      case 'json':
        content = JSON.stringify(
          {
            id: result.id,
            operation: result.operation,
            input: result.input,
            output: result.output,
            inputFormat: result.inputFormat,
            outputFormat: result.outputFormat,
            metadata: result.metadata,
          },
          null,
          2
        )
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = [
          [
            'Operation',
            'Input Format',
            'Output Format',
            'Input Size',
            'Output Size',
            'Compression Ratio',
            'Processing Time',
            'Valid',
          ],
          [
            result.operation,
            result.inputFormat,
            result.outputFormat,
            result.metadata.inputSize.toString(),
            result.metadata.outputSize.toString(),
            result.metadata.compressionRatio.toFixed(2),
            `${result.metadata.processingTime.toFixed(2)}ms`,
            result.metadata.isValid.toString(),
          ],
        ]
          .map((row) => row.map((cell) => `"${cell}"`).join(','))
          .join('\n')
        mimeType = 'text/csv'
        extension = '.csv'
        break
      default:
        content = result.output
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `encoding-result${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: Base64File[]) => {
      const completedFiles = files.filter((f) => f.encodingData)

      if (completedFiles.length === 0) {
        toast.error('No encoding results to export')
        return
      }

      completedFiles.forEach((file) => {
        if (file.encodingData) {
          file.encodingData.encodings.forEach((result, index) => {
            const baseName = file.name.replace(/\.[^/.]+$/, '')
            exportResult(result, 'txt', `${baseName}-encoded-${index + 1}.txt`)
          })
        }
      })

      toast.success(`Exported results from ${completedFiles.length} file(s)`)
    },
    [exportResult]
  )

  const exportStatistics = useCallback((files: Base64File[]) => {
    const stats = files
      .filter((f) => f.encodingData)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.size),
        totalEncodings: file.encodingData!.statistics.totalEncodings,
        averageCompressionRatio: file.encodingData!.statistics.averageCompressionRatio.toFixed(2),
        averageProcessingTime: `${file.encodingData!.statistics.averageProcessingTime.toFixed(2)}ms`,
        successRate: `${file.encodingData!.statistics.successRate.toFixed(1)}%`,
        processingTime: `${file.encodingData!.statistics.processingTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      [
        'Filename',
        'Original Size',
        'Total Encodings',
        'Avg Compression Ratio',
        'Avg Processing Time',
        'Success Rate',
        'Processing Time',
        'Status',
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.totalEncodings.toString(),
        stat.averageCompressionRatio,
        stat.averageProcessingTime,
        stat.successRate,
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
    link.download = 'encoding-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportResult, exportBatch, exportStatistics }
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

      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.type.startsWith('text/') || file.name.match(/\.(txt|json|csv|xml|html|js|css)$/i)
      )

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error('Please drop only text-based files')
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
 * Enhanced Base64 Encode Tool
 * Features: Real-time encoding/decoding, multiple formats, batch processing, statistics
 */
const Base64EncodeCore = () => {
  const [activeTab, setActiveTab] = useState<'encoder' | 'files'>('encoder')
  const [input, setInput] = useState('')
  const [operation, setOperation] = useState<EncodingOperation>('encode')
  const [inputFormat, setInputFormat] = useState<EncodingFormat>('text')
  const [outputFormat, setOutputFormat] = useState<EncodingFormat>('base64')
  const [files, setFiles] = useState<Base64File[]>([])
  const [_, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('text-to-base64')
  const [settings, setSettings] = useState<EncodingSettings>({
    defaultOperation: 'encode',
    defaultFormat: 'base64',
    includeMetadata: true,
    optimizeOutput: false,
    exportFormat: 'txt',
    chunkSize: 1024,
  })

  const { exportResult } = useEncodingExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Real-time encoding
  const encodingResult = useRealTimeEncoding(input, operation, inputFormat, outputFormat)

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
    const template = encodingTemplates.find((t) => t.id === templateId)
    if (template) {
      setOperation(template.operation)
      setInputFormat(template.inputFormat)
      setOutputFormat(template.outputFormat)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Swap input and output
  const swapInputOutput = useCallback(() => {
    if (encodingResult.result) {
      setInput(encodingResult.result.output)
      setOperation(operation === 'encode' ? 'decode' : 'encode')
      const tempFormat = inputFormat
      setInputFormat(outputFormat)
      setOutputFormat(tempFormat)
    }
  }, [encodingResult.result, operation, inputFormat, outputFormat])

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
              <Lock className="h-5 w-5" aria-hidden="true" />
              Base64 Encoder/Decoder
            </CardTitle>
            <CardDescription>
              Advanced encoding and decoding tool with support for Base64, URL encoding, Hex, Binary, and more. Includes
              batch processing, real-time conversion, and comprehensive analysis. Use keyboard navigation: Tab to move
              between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'encoder' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encoder" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Encoder/Decoder
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Encoder/Decoder Tab */}
          <TabsContent value="encoder" className="space-y-4">
            {/* Encoding Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Encoding Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {encodingTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? 'default' : 'outline'}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div className="text-xs font-mono mt-2 p-1 bg-muted/30 rounded">{template.example}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Encoding Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Input</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={operation} onValueChange={(value: EncodingOperation) => setOperation(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="encode">Encode</SelectItem>
                        <SelectItem value="decode">Decode</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={inputFormat} onValueChange={(value: EncodingFormat) => setInputFormat(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="base64">Base64</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="hex">Hex</SelectItem>
                        <SelectItem value="binary">Binary</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button size="sm" variant="outline" onClick={swapInputOutput} disabled={!encodingResult.result}>
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Enter ${inputFormat} to ${operation}...`}
                    className="min-h-[200px] font-mono text-sm"
                  />

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setInput('')}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Clear
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const samples = ['Hello World!', 'Test123', 'Sample text for encoding']
                        setInput(samples[Math.floor(Math.random() * samples.length)])
                      }}
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                      Sample
                    </Button>

                    {input && (
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(input, 'input text')}>
                        {copiedText === 'input text' ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        Copy
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Output
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={outputFormat} onValueChange={(value: EncodingFormat) => setOutputFormat(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="base64">Base64</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="hex">Hex</SelectItem>
                        <SelectItem value="binary">Binary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {encodingResult.error ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <Unlock className="h-4 w-4" />
                        <span className="font-medium">Encoding Error</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{encodingResult.error}</p>
                    </div>
                  ) : encodingResult.result ? (
                    <div className="space-y-4">
                      <Textarea
                        value={encodingResult.result.output}
                        readOnly
                        className="min-h-[200px] font-mono text-sm bg-muted/30"
                      />

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(encodingResult.result!.output, 'encoded result')}
                        >
                          {copiedText === 'encoded result' ? (
                            <Check className="h-4 w-4 mr-2" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Copy Result
                        </Button>

                        <Button size="sm" variant="outline" onClick={() => exportResult(encodingResult.result!, 'txt')}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Enter text to see the {operation}d result</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Encoding Metadata */}
            {encodingResult.result && settings.includeMetadata && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Encoding Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Input Size</Label>
                      <div className="mt-2 p-3 bg-muted/30 rounded">
                        <span className="font-mono text-lg">
                          {formatFileSize(encodingResult.result.metadata.inputSize)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Output Size</Label>
                      <div className="mt-2 p-3 bg-muted/30 rounded">
                        <span className="font-mono text-lg">
                          {formatFileSize(encodingResult.result.metadata.outputSize)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Size Ratio</Label>
                      <div className="mt-2 p-3 bg-muted/30 rounded">
                        <span className="font-mono text-lg">
                          {encodingResult.result.metadata.compressionRatio.toFixed(2)}x
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Processing Time</Label>
                      <div className="mt-2 p-3 bg-muted/30 rounded">
                        <span className="font-mono text-lg">
                          {encodingResult.result.metadata.processingTime.toFixed(2)}ms
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    onClick={() => setSettings((prev) => ({ ...prev, includeMetadata: !prev.includeMetadata }))}
                    variant="outline"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {settings.includeMetadata ? 'Hide' : 'Show'} Metadata
                  </Button>

                  {encodingResult.result && (
                    <>
                      <Button onClick={() => exportResult(encodingResult.result!, 'json')} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export JSON
                      </Button>

                      <Button onClick={() => exportResult(encodingResult.result!, 'csv')} variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
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
                  aria-label="Drag and drop text files here or click to select files"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Text Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your text files here, or click to select files for batch encoding/decoding
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports TXT, JSON, CSV, XML, HTML, JS, CSS files • Max 10MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.json,.csv,.xml,.html,.js,.css"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select text files"
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
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Size:</span> {formatFileSize(file.size)}
                            </div>
                            {file.status === 'completed' && file.encodingData && (
                              <div className="mt-2 text-xs">
                                {file.encodingData.statistics.totalEncodings} encoding operations processed
                              </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const Base64Encode = () => {
  return (
    <Base64EncodeErrorBoundary>
      <Base64EncodeCore />
    </Base64EncodeErrorBoundary>
  )
}

export default Base64Encode
