import { useCallback, useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  Copy,
  Check,
  Shuffle,
  RotateCcw,
  Zap,
  Settings,
  CheckCircle2,
  AlertCircle,
  Link,
  BookOpen,
  FileText,
  Search,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react'
import { nanoid } from 'nanoid'
// Enhanced Types
interface URLProcessingResult {
  id: string
  input: string
  output: string
  operation: URLOperation
  encodingType: URLEncodingType
  isValid: boolean
  error?: string
  statistics: URLStatistics
  analysis?: URLAnalysis
  createdAt: Date
}

interface URLStatistics {
  inputSize: number
  outputSize: number
  inputLength: number
  outputLength: number
  compressionRatio: number
  processingTime: number
  characterChanges: number
  specialCharacters: number
}

interface URLAnalysis {
  protocol?: string
  domain?: string
  path?: string
  queryParams?: Record<string, string>
  fragment?: string
  isValidURL: boolean
  hasSpecialChars: boolean
  hasUnicodeChars: boolean
  hasSpaces: boolean
  encodingNeeded: string[]
  securityIssues: string[]
}

interface URLBatch {
  id: string
  results: URLProcessingResult[]
  count: number
  settings: URLSettings
  createdAt: Date
  statistics: URLBatchStatistics
}

interface URLBatchStatistics {
  totalProcessed: number
  validCount: number
  invalidCount: number
  averageCompressionRatio: number
  totalInputSize: number
  totalOutputSize: number
  operationDistribution: Record<string, number>
  successRate: number
}

interface URLSettings {
  encodingType: URLEncodingType
  realTimeProcessing: boolean
  showAnalysis: boolean
  validateURLs: boolean
  exportFormat: ExportFormat
  maxLength: number
  preserveCase: boolean
}

interface URLTemplate {
  id: string
  name: string
  description: string
  category: string
  operation: URLOperation
  encodingType: URLEncodingType
  example: string
  useCase: string[]
}

interface URLValidation {
  isValid: boolean
  errors: URLError[]
  warnings: string[]
  suggestions: string[]
}

interface URLError {
  message: string
  position?: number
  character?: string
}

// Enums
type URLOperation = 'encode' | 'decode'
type URLEncodingType = 'component' | 'uri' | 'form' | 'path' | 'query'
type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'

// Utility functions

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// URL encoding functions
const encodeURLComponent = (input: string): string => {
  try {
    return encodeURIComponent(input)
  } catch (error) {
    throw new Error('Failed to encode URL component')
  }
}

const decodeURLComponent = (input: string): string => {
  try {
    return decodeURIComponent(input)
  } catch (error) {
    throw new Error('Invalid URL encoded string')
  }
}

const encodeURI = (input: string): string => {
  try {
    return encodeURI(input)
  } catch (error) {
    throw new Error('Failed to encode URI')
  }
}

const decodeURI = (input: string): string => {
  try {
    return decodeURI(input)
  } catch (error) {
    throw new Error('Invalid URI encoded string')
  }
}

const encodeFormData = (input: string): string => {
  try {
    return encodeURIComponent(input).replace(/%20/g, '+')
  } catch (error) {
    throw new Error('Failed to encode form data')
  }
}

const decodeFormData = (input: string): string => {
  try {
    return decodeURIComponent(input.replace(/\+/g, '%20'))
  } catch (error) {
    throw new Error('Invalid form data encoded string')
  }
}

const encodePath = (input: string): string => {
  try {
    return input
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/')
  } catch (error) {
    throw new Error('Failed to encode path')
  }
}

const decodePath = (input: string): string => {
  try {
    return input
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/')
  } catch (error) {
    throw new Error('Invalid path encoded string')
  }
}

const encodeQuery = (input: string): string => {
  try {
    const params = new URLSearchParams()
    const pairs = input.split('&')
    pairs.forEach((pair) => {
      const [key, value] = pair.split('=')
      if (key) {
        params.append(key, value || '')
      }
    })
    return params.toString()
  } catch (error) {
    throw new Error('Failed to encode query string')
  }
}

const decodeQuery = (input: string): string => {
  try {
    const params = new URLSearchParams(input)
    const result: string[] = []
    params.forEach((value, key) => {
      result.push(`${key}=${value}`)
    })
    return result.join('&')
  } catch (error) {
    throw new Error('Invalid query string')
  }
}

// URL analysis functions
const analyzeURL = (input: string): URLAnalysis => {
  const analysis: URLAnalysis = {
    isValidURL: false,
    hasSpecialChars: false,
    hasUnicodeChars: false,
    hasSpaces: false,
    encodingNeeded: [],
    securityIssues: [],
  }

  try {
    // Check if it's a valid URL
    const url = new URL(input)
    analysis.isValidURL = true
    analysis.protocol = url.protocol
    analysis.domain = url.hostname
    analysis.path = url.pathname
    analysis.fragment = url.hash

    // Parse query parameters
    if (url.search) {
      analysis.queryParams = {}
      url.searchParams.forEach((value, key) => {
        analysis.queryParams![key] = value
      })
    }
  } catch {
    // Not a valid URL, analyze as text
    analysis.isValidURL = false
  }

  // Check for special characters
  const specialChars = /[!@#$%^&*()+=\[\]{};':"\\|,.<>?]/
  analysis.hasSpecialChars = specialChars.test(input)

  // Check for Unicode characters
  analysis.hasUnicodeChars = /[^\x00-\x7F]/.test(input)

  // Check for spaces
  analysis.hasSpaces = /\s/.test(input)

  // Determine encoding needs
  if (analysis.hasSpaces) {
    analysis.encodingNeeded.push('Spaces need encoding')
  }
  if (analysis.hasUnicodeChars) {
    analysis.encodingNeeded.push('Unicode characters need encoding')
  }
  if (analysis.hasSpecialChars) {
    analysis.encodingNeeded.push('Special characters may need encoding')
  }

  // Security analysis
  if (input.includes('javascript:')) {
    analysis.securityIssues.push('Contains JavaScript protocol (potential XSS)')
  }
  if (input.includes('data:')) {
    analysis.securityIssues.push('Contains data URI (review content)')
  }
  if (input.includes('<script')) {
    analysis.securityIssues.push('Contains script tags (potential XSS)')
  }

  return analysis
}

// Validation functions
const validateURL = (input: string): URLValidation => {
  const validation: URLValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!input.trim()) {
    validation.isValid = false
    validation.errors.push({ message: 'URL input cannot be empty' })
    return validation
  }

  // Check for common issues
  if (input.length > 2048) {
    validation.warnings.push('URL is very long (>2048 characters) - may cause issues')
  }

  if (input.includes(' ')) {
    validation.suggestions.push('URL contains spaces - consider encoding')
  }

  if (/[^\x00-\x7F]/.test(input)) {
    validation.suggestions.push('URL contains non-ASCII characters - encoding recommended')
  }

  // Try to parse as URL
  try {
    new URL(input)
  } catch {
    validation.warnings.push('Input is not a valid URL - treating as text')
  }

  return validation
}

// URL processing templates
const urlTemplates: URLTemplate[] = [
  {
    id: 'text-to-component',
    name: 'Text to URL Component',
    description: 'Encode text for use in URL components',
    category: 'Component',
    operation: 'encode',
    encodingType: 'component',
    example: 'Hello World! → Hello%20World%21',
    useCase: ['Query parameters', 'Path segments', 'Fragment identifiers'],
  },
  {
    id: 'component-to-text',
    name: 'URL Component to Text',
    description: 'Decode URL component back to text',
    category: 'Component',
    operation: 'decode',
    encodingType: 'component',
    example: 'Hello%20World%21 → Hello World!',
    useCase: ['Parsing URLs', 'Form processing', 'Data extraction'],
  },
  {
    id: 'text-to-uri',
    name: 'Text to URI',
    description: 'Encode text as complete URI',
    category: 'URI',
    operation: 'encode',
    encodingType: 'uri',
    example: 'https://example.com/path with spaces → https://example.com/path%20with%20spaces',
    useCase: ['Complete URLs', 'Link generation', 'Redirect URLs'],
  },
  {
    id: 'uri-to-text',
    name: 'URI to Text',
    description: 'Decode complete URI back to text',
    category: 'URI',
    operation: 'decode',
    encodingType: 'uri',
    example: 'https://example.com/path%20with%20spaces → https://example.com/path with spaces',
    useCase: ['URL parsing', 'Link processing', 'Analytics'],
  },
  {
    id: 'text-to-form',
    name: 'Text to Form Data',
    description: 'Encode text for form submission',
    category: 'Form',
    operation: 'encode',
    encodingType: 'form',
    example: 'Hello World! → Hello+World%21',
    useCase: ['Form submissions', 'POST data', 'AJAX requests'],
  },
  {
    id: 'form-to-text',
    name: 'Form Data to Text',
    description: 'Decode form data back to text',
    category: 'Form',
    operation: 'decode',
    encodingType: 'form',
    example: 'Hello+World%21 → Hello World!',
    useCase: ['Form processing', 'Server-side parsing', 'Data validation'],
  },
  {
    id: 'path-encode',
    name: 'Path Encoding',
    description: 'Encode URL path segments',
    category: 'Path',
    operation: 'encode',
    encodingType: 'path',
    example: '/path/with spaces/file.txt → /path/with%20spaces/file.txt',
    useCase: ['File paths', 'API endpoints', 'Resource URLs'],
  },
  {
    id: 'query-encode',
    name: 'Query String Encoding',
    description: 'Encode query string parameters',
    category: 'Query',
    operation: 'encode',
    encodingType: 'query',
    example: 'name=John Doe&city=New York → name=John+Doe&city=New+York',
    useCase: ['Search parameters', 'Filter options', 'API queries'],
  },
]

// Custom hooks
const useURLProcessing = () => {
  const processSingle = useCallback(
    (input: string, operation: URLOperation, encodingType: URLEncodingType): URLProcessingResult => {
      const startTime = window.performance.now()

      try {
        let output = ''
        let isValid = true
        let error: string | undefined

        switch (operation) {
          case 'encode':
            switch (encodingType) {
              case 'component':
                output = encodeURLComponent(input)
                break
              case 'uri':
                output = encodeURI(input)
                break
              case 'form':
                output = encodeFormData(input)
                break
              case 'path':
                output = encodePath(input)
                break
              case 'query':
                output = encodeQuery(input)
                break
              default:
                output = encodeURLComponent(input)
            }
            break

          case 'decode':
            switch (encodingType) {
              case 'component':
                output = decodeURLComponent(input)
                break
              case 'uri':
                output = decodeURI(input)
                break
              case 'form':
                output = decodeFormData(input)
                break
              case 'path':
                output = decodePath(input)
                break
              case 'query':
                output = decodeQuery(input)
                break
              default:
                output = decodeURLComponent(input)
            }
            break

          default:
            throw new Error('Unsupported operation')
        }

        const endTime = window.performance.now()
        const processingTime = endTime - startTime

        const inputSize = new Blob([input]).size
        const outputSize = new Blob([output]).size
        const compressionRatio = inputSize > 0 ? outputSize / inputSize : 1

        // Count character changes
        let characterChanges = 0
        const maxLength = Math.max(input.length, output.length)
        for (let i = 0; i < maxLength; i++) {
          if (input[i] !== output[i]) {
            characterChanges++
          }
        }

        // Count special characters
        const specialCharacters = (input.match(/[^a-zA-Z0-9]/g) || []).length

        const analysis = analyzeURL(input)

        return {
          id: nanoid(),
          input,
          output,
          operation,
          encodingType,
          isValid,
          error,
          statistics: {
            inputSize,
            outputSize,
            inputLength: input.length,
            outputLength: output.length,
            compressionRatio,
            processingTime,
            characterChanges,
            specialCharacters,
          },
          analysis,
          createdAt: new Date(),
        }
      } catch (error) {
        const endTime = window.performance.now()
        const processingTime = endTime - startTime

        return {
          id: nanoid(),
          input,
          output: '',
          operation,
          encodingType,
          isValid: false,
          error: error instanceof Error ? error.message : 'Processing failed',
          statistics: {
            inputSize: new Blob([input]).size,
            outputSize: 0,
            inputLength: input.length,
            outputLength: 0,
            compressionRatio: 0,
            processingTime,
            characterChanges: 0,
            specialCharacters: 0,
          },
          createdAt: new Date(),
        }
      }
    },
    []
  )

  const processBatch = useCallback(
    (
      inputs: Array<{ content: string; operation: URLOperation; encodingType: URLEncodingType }>,
      settings: URLSettings
    ): URLBatch => {
      try {
        const results = inputs.map((input) => processSingle(input.content, input.operation, input.encodingType))

        const validCount = results.filter((result) => result.isValid).length
        const invalidCount = results.length - validCount

        const totalInputSize = results.reduce((sum, result) => sum + result.statistics.inputSize, 0)
        const totalOutputSize = results.reduce((sum, result) => sum + result.statistics.outputSize, 0)
        const averageCompressionRatio =
          results.length > 0
            ? results.reduce((sum, result) => sum + result.statistics.compressionRatio, 0) / results.length
            : 0

        const operationDistribution = results.reduce(
          (acc, result) => {
            const key = `${result.operation}-${result.encodingType}`
            acc[key] = (acc[key] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )

        const statistics: URLBatchStatistics = {
          totalProcessed: results.length,
          validCount,
          invalidCount,
          averageCompressionRatio,
          totalInputSize,
          totalOutputSize,
          operationDistribution,
          successRate: (validCount / results.length) * 100,
        }

        return {
          id: nanoid(),
          results,
          count: results.length,
          settings,
          createdAt: new Date(),
          statistics,
        }
      } catch (error) {
        console.error('Batch processing error:', error)
        throw new Error(error instanceof Error ? error.message : 'Batch processing failed')
      }
    },
    [processSingle]
  )

  return { processSingle, processBatch }
}

// Real-time validation hook
const useRealTimeValidation = (input: string) => {
  return useMemo(() => {
    if (!input.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = validateURL(input)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
    }
  }, [input])
}

// Export functionality
const useURLExport = () => {
  const exportResults = useCallback((results: URLProcessingResult[], format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(results, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVFromResults(results)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'xml':
        content = generateXMLFromResults(results)
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'txt':
      default:
        content = generateTextFromResults(results)
        mimeType = 'text/plain'
        extension = '.txt'
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `url-processing${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (batch: URLBatch) => {
      exportResults(batch.results, 'json', `url-batch-${batch.id}.json`)
      toast.success(`Exported ${batch.results.length} URL processing results`)
    },
    [exportResults]
  )

  const exportStatistics = useCallback((batches: URLBatch[]) => {
    const stats = batches.map((batch) => ({
      batchId: batch.id,
      resultCount: batch.count,
      validCount: batch.statistics.validCount,
      invalidCount: batch.statistics.invalidCount,
      averageCompressionRatio: batch.statistics.averageCompressionRatio.toFixed(3),
      successRate: batch.statistics.successRate.toFixed(2),
      totalInputSize: formatFileSize(batch.statistics.totalInputSize),
      totalOutputSize: formatFileSize(batch.statistics.totalOutputSize),
      createdAt: batch.createdAt.toISOString(),
    }))

    const csvContent = [
      [
        'Batch ID',
        'Result Count',
        'Valid Count',
        'Invalid Count',
        'Avg Compression Ratio',
        'Success Rate (%)',
        'Total Input Size',
        'Total Output Size',
        'Created At',
      ],
      ...stats.map((stat) => [
        stat.batchId,
        stat.resultCount.toString(),
        stat.validCount.toString(),
        stat.invalidCount.toString(),
        stat.averageCompressionRatio,
        stat.successRate,
        stat.totalInputSize,
        stat.totalOutputSize,
        stat.createdAt,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'url-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportResults, exportBatch, exportStatistics }
}

// Generate export formats
const generateTextFromResults = (results: URLProcessingResult[]): string => {
  return `URL Processing Report
====================

Generated: ${new Date().toLocaleString()}
Total Results: ${results.length}
Valid Results: ${results.filter((result) => result.isValid).length}
Invalid Results: ${results.filter((result) => !result.isValid).length}

Results:
${results
  .map((result, i) => {
    return `${i + 1}. Operation: ${result.operation} (${result.encodingType})
   Status: ${result.isValid ? 'Valid' : 'Invalid'}
   ${result.error ? `Error: ${result.error}` : ''}
   Input: ${result.input.substring(0, 100)}${result.input.length > 100 ? '...' : ''}
   Output: ${result.output.substring(0, 100)}${result.output.length > 100 ? '...' : ''}
   Size: ${formatFileSize(result.statistics.inputSize)} → ${formatFileSize(result.statistics.outputSize)}
   Processing Time: ${result.statistics.processingTime.toFixed(2)}ms
   Character Changes: ${result.statistics.characterChanges}
`
  })
  .join('\n')}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Average Compression Ratio: ${(results.reduce((sum, result) => sum + result.statistics.compressionRatio, 0) / results.length).toFixed(3)}
`
}

const generateCSVFromResults = (results: URLProcessingResult[]): string => {
  const rows = [
    [
      'Operation',
      'Encoding Type',
      'Valid',
      'Error',
      'Input Size (bytes)',
      'Output Size (bytes)',
      'Compression Ratio',
      'Processing Time (ms)',
      'Character Changes',
      'Created At',
    ],
  ]

  results.forEach((result) => {
    rows.push([
      result.operation,
      result.encodingType,
      result.isValid ? 'Yes' : 'No',
      result.error || '',
      result.statistics.inputSize.toString(),
      result.statistics.outputSize.toString(),
      result.statistics.compressionRatio.toFixed(3),
      result.statistics.processingTime.toFixed(2),
      result.statistics.characterChanges.toString(),
      result.createdAt.toISOString(),
    ])
  })

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

const generateXMLFromResults = (results: URLProcessingResult[]): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlProcessingResults>
  <metadata>
    <generated>${new Date().toISOString()}</generated>
    <count>${results.length}</count>
    <validCount>${results.filter((result) => result.isValid).length}</validCount>
  </metadata>
  <results>
    ${results
      .map(
        (result) => `
    <result>
      <operation>${result.operation}</operation>
      <encodingType>${result.encodingType}</encodingType>
      <valid>${result.isValid}</valid>
      ${result.error ? `<error>${result.error}</error>` : ''}
      <statistics>
        <inputSize>${result.statistics.inputSize}</inputSize>
        <outputSize>${result.statistics.outputSize}</outputSize>
        <compressionRatio>${result.statistics.compressionRatio}</compressionRatio>
        <processingTime>${result.statistics.processingTime}</processingTime>
        <characterChanges>${result.statistics.characterChanges}</characterChanges>
      </statistics>
      <createdAt>${result.createdAt.toISOString()}</createdAt>
    </result>`
      )
      .join('')}
  </results>
</urlProcessingResults>`
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

/**
 * Enhanced URL Encode/Decode Tool
 * Features: Advanced URL processing, validation, analysis, batch processing, comprehensive encoding types
 */
const URLEncodeCore = () => {
  const [activeTab, setActiveTab] = useState<'processor' | 'batch' | 'analyzer' | 'templates'>('processor')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [currentResult, setCurrentResult] = useState<URLProcessingResult | null>(null)
  const [batches, setBatches] = useState<URLBatch[]>([])
  const [batchInput, setBatchInput] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [settings, setSettings] = useState<URLSettings>({
    encodingType: 'component',
    realTimeProcessing: true,
    showAnalysis: true,
    validateURLs: true,
    exportFormat: 'json',
    maxLength: 2048,
    preserveCase: true,
  })

  const { processSingle, processBatch } = useURLProcessing()
  const { exportResults, exportBatch, exportStatistics } = useURLExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const inputValidation = useRealTimeValidation(input)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = urlTemplates.find((t) => t.id === templateId)
    if (template) {
      setInput(template.example.split(' → ')[0])
      setSelectedTemplate(templateId)
      setSettings((prev) => ({
        ...prev,
        encodingType: template.encodingType,
      }))
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single processing
  const handleProcessSingle = useCallback(
    async (operation: URLOperation) => {
      if (!input.trim()) {
        toast.error('Please enter text to process')
        return
      }

      setIsProcessing(true)
      try {
        const result = processSingle(input, operation, settings.encodingType)
        setCurrentResult(result)
        setOutput(result.output)

        if (result.isValid) {
          toast.success(`URL ${operation} completed successfully`)
        } else {
          toast.error(result.error || `${operation} failed`)
        }
      } catch (error) {
        toast.error(`Failed to ${operation} URL`)
        console.error(error)
      } finally {
        setIsProcessing(false)
      }
    },
    [input, settings, processSingle]
  )

  // Handle batch processing
  const handleProcessBatch = useCallback(async () => {
    const lines = batchInput.split('\n').filter((line) => line.trim())

    if (lines.length === 0) {
      toast.error('Please enter content to process')
      return
    }

    // Parse batch input format: operation:encodingType:content
    const inputs = lines
      .map((line) => {
        const [operation, encodingType, ...contentParts] = line.split(':')
        const content = contentParts.join(':').trim()

        return {
          content,
          operation: (operation?.trim() || 'encode') as URLOperation,
          encodingType: (encodingType?.trim() || 'component') as URLEncodingType,
        }
      })
      .filter((input) => input.content && ['encode', 'decode'].includes(input.operation))

    if (inputs.length === 0) {
      toast.error('No valid operation:encodingType:content entries found')
      return
    }

    setIsProcessing(true)
    try {
      const batch = processBatch(inputs, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Processed ${batch.results.length} URL operations`)
    } catch (error) {
      toast.error('Failed to process batch')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, settings, processBatch])

  // Auto-process when real-time processing is enabled
  useEffect(() => {
    if (settings.realTimeProcessing && input.trim() && inputValidation.isValid) {
      const timer = setTimeout(() => {
        handleProcessSingle('encode')
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [input, inputValidation.isValid, settings.realTimeProcessing, handleProcessSingle])

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
              <Link className="h-5 w-5" aria-hidden="true" />
              URL Encoder & Decoder
            </CardTitle>
            <CardDescription>
              Advanced URL encoding and decoding tool with multiple encoding types, validation, analysis, and batch
              processing capabilities. Encode and decode URLs with comprehensive error reporting and statistics. Use
              keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'processor' | 'batch' | 'analyzer' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="processor" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              URL Processor
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              URL Analyzer
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* URL Processor Tab */}
          <TabsContent value="processor" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    URL Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="url-input" className="text-sm font-medium">
                      Text/URL Content
                    </Label>
                    <Textarea
                      id="url-input"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter text or URL to encode/decode..."
                      className="mt-2 min-h-[120px] font-mono"
                      aria-label="URL input for processing"
                    />
                    {settings.realTimeProcessing && input && (
                      <div className="mt-2 text-sm">
                        {inputValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid input
                          </div>
                        ) : inputValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {inputValidation.error}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="encoding-type" className="text-sm font-medium">
                      Encoding Type
                    </Label>
                    <Select
                      value={settings.encodingType}
                      onValueChange={(value: URLEncodingType) =>
                        setSettings((prev) => ({ ...prev, encodingType: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="component">URL Component (encodeURIComponent)</SelectItem>
                        <SelectItem value="uri">URI (encodeURI)</SelectItem>
                        <SelectItem value="form">Form Data (application/x-www-form-urlencoded)</SelectItem>
                        <SelectItem value="path">Path Segments</SelectItem>
                        <SelectItem value="query">Query String</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id="real-time-processing"
                        type="checkbox"
                        checked={settings.realTimeProcessing}
                        onChange={(e) => setSettings((prev) => ({ ...prev, realTimeProcessing: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="real-time-processing" className="text-sm">
                        Real-time processing
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="show-analysis"
                        type="checkbox"
                        checked={settings.showAnalysis}
                        onChange={(e) => setSettings((prev) => ({ ...prev, showAnalysis: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="show-analysis" className="text-sm">
                        Show URL analysis
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="validate-urls"
                        type="checkbox"
                        checked={settings.validateURLs}
                        onChange={(e) => setSettings((prev) => ({ ...prev, validateURLs: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="validate-urls" className="text-sm">
                        Validate URLs
                      </Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleProcessSingle('encode')} disabled={!input.trim() || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      Encode
                    </Button>
                    <Button
                      onClick={() => handleProcessSingle('decode')}
                      disabled={!input.trim() || isProcessing}
                      variant="outline"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Decode
                    </Button>
                  </div>

                  <Button
                    onClick={() => {
                      setInput('')
                      setOutput('')
                      setCurrentResult(null)
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>

                  {inputValidation.warnings && inputValidation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Warnings:</h4>
                      <div className="text-xs space-y-1">
                        {inputValidation.warnings.map((warning, index) => (
                          <div key={index} className="text-yellow-700">
                            {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Output Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Processing Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="url-output" className="text-sm font-medium">
                        Output
                      </Label>
                      <Textarea
                        id="url-output"
                        value={output}
                        readOnly
                        placeholder="Processed output will appear here..."
                        className="mt-2 min-h-[120px] font-mono bg-muted"
                        aria-label="URL processing output"
                      />
                    </div>

                    {currentResult && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium">Operation</div>
                            <div>
                              {currentResult.operation} ({currentResult.encodingType})
                            </div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium">Status</div>
                            <div className={currentResult.isValid ? 'text-green-600' : 'text-red-600'}>
                              {currentResult.isValid ? 'Success' : 'Failed'}
                            </div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium">Size Change</div>
                            <div>
                              {currentResult.statistics.inputLength} → {currentResult.statistics.outputLength} chars
                            </div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-medium">Processing Time</div>
                            <div>{currentResult.statistics.processingTime.toFixed(2)}ms</div>
                          </div>
                        </div>

                        {currentResult.error && (
                          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-800">
                              <AlertCircle className="h-4 w-4" />
                              <span className="font-medium">Processing Error</span>
                            </div>
                            <div className="text-red-700 text-sm mt-1">{currentResult.error}</div>
                          </div>
                        )}

                        {settings.showAnalysis && currentResult.analysis && (
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="font-medium text-sm">URL Analysis</Label>
                              <Button size="sm" variant="ghost" onClick={() => setShowAnalysis(!showAnalysis)}>
                                {showAnalysis ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            {showAnalysis && (
                              <div className="space-y-2 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div>
                                      <strong>Valid URL:</strong> {currentResult.analysis.isValidURL ? 'Yes' : 'No'}
                                    </div>
                                    {currentResult.analysis.protocol && (
                                      <div>
                                        <strong>Protocol:</strong> {currentResult.analysis.protocol}
                                      </div>
                                    )}
                                    {currentResult.analysis.domain && (
                                      <div>
                                        <strong>Domain:</strong> {currentResult.analysis.domain}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Special Characters:</strong>{' '}
                                      {currentResult.analysis.hasSpecialChars ? 'Yes' : 'No'}
                                    </div>
                                    <div>
                                      <strong>Unicode Characters:</strong>{' '}
                                      {currentResult.analysis.hasUnicodeChars ? 'Yes' : 'No'}
                                    </div>
                                    <div>
                                      <strong>Spaces:</strong> {currentResult.analysis.hasSpaces ? 'Yes' : 'No'}
                                    </div>
                                  </div>
                                </div>

                                {currentResult.analysis.encodingNeeded.length > 0 && (
                                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                    <div className="text-sm text-blue-800">
                                      <strong>Encoding Recommendations:</strong>
                                      <ul className="list-disc list-inside mt-1">
                                        {currentResult.analysis.encodingNeeded.map((need, index) => (
                                          <li key={index}>{need}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}

                                {currentResult.analysis.securityIssues.length > 0 && (
                                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                                    <div className="text-sm text-red-800">
                                      <strong>Security Issues:</strong>
                                      <ul className="list-disc list-inside mt-1">
                                        {currentResult.analysis.securityIssues.map((issue, index) => (
                                          <li key={index}>{issue}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => copyToClipboard(output, 'Processing Result')}
                            variant="outline"
                            size="sm"
                          >
                            {copiedText === 'Processing Result' ? (
                              <Check className="mr-2 h-4 w-4" />
                            ) : (
                              <Copy className="mr-2 h-4 w-4" />
                            )}
                            Copy Result
                          </Button>
                          <Button
                            onClick={() => exportResults([currentResult], settings.exportFormat)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export Result
                          </Button>
                        </div>
                      </div>
                    )}

                    {!currentResult && (
                      <div className="text-center py-8">
                        <Link className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Processing Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Enter text or URL and select an operation to see results
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Processing Tab */}
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Batch URL Processing
                </CardTitle>
                <CardDescription>
                  Process multiple URLs at once (operation:encodingType:content per line)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batch-input" className="text-sm font-medium">
                      URL Operations (operation:encodingType:content per line)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder="encode:component:Hello World!&#10;decode:component:Hello%20World%21&#10;encode:uri:https://example.com/path with spaces"
                      className="mt-2 min-h-[120px] font-mono"
                      aria-label="Batch URL processing input"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">
                      Format: <code>operation:encodingType:content</code> (one per line)
                      <br />
                      Operations: encode, decode | Encoding Types: component, uri, form, path, query
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleProcessBatch} disabled={!batchInput.trim() || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Process Batch
                    </Button>
                    <Button onClick={() => setBatchInput('')} variant="outline">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Batch Results */}
            {batches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Results ({batches.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {batches.map((batch) => (
                      <div key={batch.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{batch.count} operations processed</h4>
                            <div className="text-sm text-muted-foreground">
                              {batch.createdAt.toLocaleString()} • {batch.statistics.successRate.toFixed(1)}% success
                              rate
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => exportBatch(batch)}>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setBatches((prev) => prev.filter((b) => b.id !== batch.id))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium">Valid:</span> {batch.statistics.validCount}
                          </div>
                          <div>
                            <span className="font-medium">Invalid:</span> {batch.statistics.invalidCount}
                          </div>
                          <div>
                            <span className="font-medium">Avg Compression:</span>{' '}
                            {batch.statistics.averageCompressionRatio.toFixed(3)}
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.results.slice(0, 5).map((result) => (
                              <div key={result.id} className="text-xs border rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">
                                    {result.operation}:{result.encodingType} - {result.input.substring(0, 30)}...
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      result.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {result.isValid ? 'Valid' : 'Invalid'}
                                  </span>
                                </div>
                                {result.isValid && (
                                  <div className="text-muted-foreground mt-1">
                                    {result.statistics.inputLength} → {result.statistics.outputLength} chars •
                                    {result.statistics.processingTime.toFixed(2)}ms
                                  </div>
                                )}
                                {result.error && <div className="text-red-600 mt-1">{result.error}</div>}
                              </div>
                            ))}
                            {batch.results.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.results.length - 5} more operations
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* URL Analyzer Tab */}
          <TabsContent value="analyzer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  URL Structure Analyzer
                </CardTitle>
                <CardDescription>Detailed analysis of URL structure and encoding requirements</CardDescription>
              </CardHeader>
              <CardContent>
                {currentResult && currentResult.analysis ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">URL Structure</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Valid URL: {currentResult.analysis.isValidURL ? 'Yes' : 'No'}</div>
                          {currentResult.analysis.protocol && <div>Protocol: {currentResult.analysis.protocol}</div>}
                          {currentResult.analysis.domain && <div>Domain: {currentResult.analysis.domain}</div>}
                          {currentResult.analysis.path && <div>Path: {currentResult.analysis.path}</div>}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Character Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Special Characters: {currentResult.analysis.hasSpecialChars ? 'Yes' : 'No'}</div>
                          <div>Unicode Characters: {currentResult.analysis.hasUnicodeChars ? 'Yes' : 'No'}</div>
                          <div>Spaces: {currentResult.analysis.hasSpaces ? 'Yes' : 'No'}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Processing Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Input Length: {currentResult.statistics.inputLength}</div>
                          <div>Output Length: {currentResult.statistics.outputLength}</div>
                          <div>Character Changes: {currentResult.statistics.characterChanges}</div>
                          <div>Processing Time: {currentResult.statistics.processingTime.toFixed(2)}ms</div>
                        </CardContent>
                      </Card>
                    </div>

                    {(currentResult.analysis.encodingNeeded.length > 0 ||
                      currentResult.analysis.securityIssues.length > 0) && (
                      <div className="space-y-4">
                        {currentResult.analysis.encodingNeeded.length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm text-blue-700">Encoding Recommendations</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="text-sm space-y-1">
                                {currentResult.analysis.encodingNeeded.map((need, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3 w-3 text-blue-600" />
                                    {need}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {currentResult.analysis.securityIssues.length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm text-red-700">Security Issues</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="text-sm space-y-1">
                                {currentResult.analysis.securityIssues.map((issue, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <AlertCircle className="h-3 w-3 text-red-600" />
                                    {issue}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Process a URL in the Processor tab to see detailed analysis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  URL Processing Templates
                </CardTitle>
                <CardDescription>Common URL encoding/decoding scenarios for various use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {urlTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="font-mono text-xs bg-muted p-2 rounded">{template.example}</div>
                        <div className="text-xs">
                          <strong>Operation:</strong> {template.operation} ({template.encodingType})
                        </div>
                        {template.useCase.length > 0 && (
                          <div className="text-xs">
                            <strong>Use cases:</strong> {template.useCase.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Processing Settings
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
                  <Label htmlFor="max-length" className="text-sm font-medium">
                    Max Length: {settings.maxLength}
                  </Label>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min="100"
                      max="10000"
                      step="100"
                      value={settings.maxLength}
                      onChange={(e) => setSettings((prev) => ({ ...prev, maxLength: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {batches.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => exportStatistics(batches)} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
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
const UrlEncode = () => {
  return <URLEncodeCore />
}

export default UrlEncode
