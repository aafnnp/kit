import React, { useCallback, useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, Download, FileText, Loader2, FileImage, Trash2, Type, RefreshCw, BookOpen, Target, Copy, Check } from 'lucide-react'

// Types
interface TextFile {
  id: string
  file: File
  originalContent: string
  convertedContent: string
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  conversions?: ConversionResult[]
}

interface ConversionResult {
  type: CaseType
  content: string
  preview: string // First 100 characters for preview
}

interface ConversionSettings {
  preserveFormatting: boolean
  handleSpecialChars: boolean
  customDelimiter: string
  batchMode: boolean
  previewLength: number
}

interface ConversionStats {
  totalFiles: number
  totalCharacters: number
  totalWords: number
  totalConversions: number
  averageFileSize: number
  processingTime: number
}

// Case conversion types
type CaseType =
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'sentencecase'
  | 'camelcase'
  | 'pascalcase'
  | 'snakecase'
  | 'kebabcase'
  | 'constantcase'
  | 'dotcase'
  | 'pathcase'
  | 'togglecase'

interface CaseOption {
  value: CaseType
  name: string
  description: string
  example: string
  icon: React.ReactNode
}

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const generateId = (): string => Math.random().toString(36).substring(2, 11)

const validateTextFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = [
    'text/plain', 'text/markdown', 'text/rtf', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/json', 'text/html', 'text/xml'
  ]

  // Check file extension as fallback
  const extension = file.name.toLowerCase().split('.').pop()
  const allowedExtensions = ['txt', 'md', 'rtf', 'csv', 'doc', 'docx', 'json', 'html', 'xml']

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension || '')) {
    return { isValid: false, error: 'Unsupported file format. Please use TXT, MD, RTF, CSV, DOC, DOCX, JSON, HTML, or XML.' }
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large. Maximum size is 50MB.' }
  }

  return { isValid: true }
}

// Case conversion functions
const convertCase = (text: string, caseType: CaseType, settings: ConversionSettings): string => {
  if (!text) return ''

  const preserveFormatting = settings.preserveFormatting
  const handleSpecialChars = settings.handleSpecialChars

  // Helper function to handle word boundaries
  const getWords = (str: string): string[] => {
    if (handleSpecialChars) {
      return str.split(/[\s\-_\.]+/).filter(word => word.length > 0)
    }
    return str.split(/\s+/).filter(word => word.length > 0)
  }

  // Helper function to capitalize first letter
  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  // Helper function to handle camelCase conversion
  const toCamelCase = (str: string): string => {
    const words = getWords(str)
    if (words.length === 0) return ''
    return words[0].toLowerCase() + words.slice(1).map(capitalize).join('')
  }

  // Helper function to handle PascalCase conversion
  const toPascalCase = (str: string): string => {
    const words = getWords(str)
    return words.map(capitalize).join('')
  }

  // Helper function to handle snake_case conversion
  const toSnakeCase = (str: string): string => {
    const words = getWords(str)
    return words.map(word => word.toLowerCase()).join('_')
  }

  // Helper function to handle kebab-case conversion
  const toKebabCase = (str: string): string => {
    const words = getWords(str)
    return words.map(word => word.toLowerCase()).join('-')
  }

  // Helper function to handle CONSTANT_CASE conversion
  const toConstantCase = (str: string): string => {
    const words = getWords(str)
    return words.map(word => word.toUpperCase()).join('_')
  }

  // Helper function to handle dot.case conversion
  const toDotCase = (str: string): string => {
    const words = getWords(str)
    return words.map(word => word.toLowerCase()).join('.')
  }

  // Helper function to handle path/case conversion
  const toPathCase = (str: string): string => {
    const words = getWords(str)
    return words.map(word => word.toLowerCase()).join('/')
  }

  // Helper function to handle tOgGlE cAsE conversion
  const toToggleCase = (str: string): string => {
    return str.split('').map((char, index) => {
      return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
    }).join('')
  }

  // Helper function to handle sentence case
  const toSentenceCase = (str: string): string => {
    if (preserveFormatting) {
      // Preserve line breaks and paragraph structure
      return str.split('\n').map(line => {
        const trimmed = line.trim()
        if (trimmed.length === 0) return line
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
      }).join('\n')
    } else {
      const sentences = str.split(/[.!?]+/).filter(s => s.trim().length > 0)
      return sentences.map(sentence => {
        const trimmed = sentence.trim()
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
      }).join('. ') + (str.endsWith('.') || text.endsWith('!') || text.endsWith('?') ? '' : '.')
    }
  }

  // Helper function to handle title case
  const toTitleCase = (str: string): string => {
    const words = str.split(/(\s+)/)
    const articles = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in'])

    return words.map((word, index) => {
      if (/^\s+$/.test(word)) return word // Preserve whitespace

      const lowerWord = word.toLowerCase()

      // Always capitalize first and last words
      if (index === 0 || index === words.length - 1) {
        return capitalize(word)
      }

      // Don't capitalize articles, conjunctions, and prepositions (unless they're the first/last word)
      if (articles.has(lowerWord)) {
        return lowerWord
      }

      return capitalize(word)
    }).join('')
  }

  switch (caseType) {
    case 'uppercase':
      return text.toUpperCase()
    case 'lowercase':
      return text.toLowerCase()
    case 'titlecase':
      return toTitleCase(text)
    case 'sentencecase':
      return toSentenceCase(text)
    case 'camelcase':
      return toCamelCase(text)
    case 'pascalcase':
      return toPascalCase(text)
    case 'snakecase':
      return toSnakeCase(text)
    case 'kebabcase':
      return toKebabCase(text)
    case 'constantcase':
      return toConstantCase(text)
    case 'dotcase':
      return toDotCase(text)
    case 'pathcase':
      return toPathCase(text)
    case 'togglecase':
      return toToggleCase(text)
    default:
      return text
  }
}

// Case conversion options
const caseOptions: CaseOption[] = [
  {
    value: 'uppercase',
    name: 'UPPERCASE',
    description: 'Convert all text to uppercase letters',
    example: 'HELLO WORLD',
    icon: <Type className="h-4 w-4" />
  },
  {
    value: 'lowercase',
    name: 'lowercase',
    description: 'Convert all text to lowercase letters',
    example: 'hello world',
    icon: <Type className="h-4 w-4" />
  },
  {
    value: 'titlecase',
    name: 'Title Case',
    description: 'Capitalize the first letter of each major word',
    example: 'Hello World Example',
    icon: <Type className="h-4 w-4" />
  },
  {
    value: 'sentencecase',
    name: 'Sentence case',
    description: 'Capitalize only the first letter of each sentence',
    example: 'Hello world. This is an example.',
    icon: <Type className="h-4 w-4" />
  },
  {
    value: 'camelcase',
    name: 'camelCase',
    description: 'First word lowercase, subsequent words capitalized, no spaces',
    example: 'helloWorldExample',
    icon: <Type className="h-4 w-4" />
  },
  {
    value: 'pascalcase',
    name: 'PascalCase',
    description: 'All words capitalized, no spaces (also called UpperCamelCase)',
    example: 'HelloWorldExample',
    icon: <Type className="h-4 w-4" />
  },
  {
    value: 'snakecase',
    name: 'snake_case',
    description: 'All lowercase with underscores between words',
    example: 'hello_world_example',
    icon: <Type className="h-4 w-4" />
  },
  {
    value: 'kebabcase',
    name: 'kebab-case',
    description: 'All lowercase with hyphens between words',
    example: 'hello-world-example',
    icon: <Type className="h-4 w-4" />
  },
  {
    value: 'constantcase',
    name: 'CONSTANT_CASE',
    description: 'All uppercase with underscores between words',
    example: 'HELLO_WORLD_EXAMPLE',
    icon: <Type className="h-4 w-4" />
  },
  {
    value: 'dotcase',
    name: 'dot.case',
    description: 'All lowercase with dots between words',
    example: 'hello.world.example',
    icon: <Type className="h-4 w-4" />
  },
  {
    value: 'pathcase',
    name: 'path/case',
    description: 'All lowercase with forward slashes between words',
    example: 'hello/world/example',
    icon: <Type className="h-4 w-4" />
  },
  {
    value: 'togglecase',
    name: 'tOgGlE cAsE',
    description: 'Alternating uppercase and lowercase letters',
    example: 'hElLo WoRlD eXaMpLe',
    icon: <Type className="h-4 w-4" />
  }
]

// Error boundary component
class CaseConverterErrorBoundary extends React.Component<
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
    console.error('Case converter error:', error, errorInfo)
    toast.error('An unexpected error occurred during text conversion')
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
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Custom hooks
const useTextProcessing = () => {
  const processTextFile = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file size before processing
      const maxProcessingSize = 100 * 1024 * 1024 // 100MB
      if (file.size > maxProcessingSize) {
        reject(new Error('File too large for processing. Please use a file smaller than 100MB.'))
        return
      }

      const reader = new FileReader()

      reader.onload = () => {
        try {
          const result = reader.result as string

          // Basic text extraction based on file type
          if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            resolve(result)
          } else if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
            // Keep markdown syntax for case conversion
            resolve(result)
          } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
            // Keep HTML structure but convert text content
            resolve(result)
          } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
            // Keep JSON structure
            resolve(result)
          } else {
            // For other formats, use raw content
            resolve(result)
          }
        } catch (error) {
          reject(new Error('Failed to process file content'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file. The file may be corrupted.'))
      }

      // Read file as text
      try {
        reader.readAsText(file, 'UTF-8')
      } catch (error) {
        reject(new Error('Failed to read file. Please ensure the file is a valid text file.'))
      }
    })
  }, [])

  return { processTextFile }
}

// Real-time case conversion hook
const useCaseConversion = (text: string, caseType: CaseType, settings: ConversionSettings) => {
  return useMemo(() => {
    if (!text.trim()) return ''
    return convertCase(text, caseType, settings)
  }, [text, caseType, settings])
}

// Batch conversion hook
const useBatchConversion = () => {
  const convertAllCases = useCallback((text: string, settings: ConversionSettings): ConversionResult[] => {
    return caseOptions.map(option => ({
      type: option.value,
      content: convertCase(text, option.value, settings),
      preview: convertCase(text, option.value, settings).substring(0, settings.previewLength) +
               (convertCase(text, option.value, settings).length > settings.previewLength ? '...' : '')
    }))
  }, [])

  return { convertAllCases }
}

// Export functionality
const useTextExport = () => {
  const exportConversion = useCallback((content: string, filename: string, caseType: CaseType) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const extension = filename.includes('.') ? filename.split('.').pop() : 'txt'
    link.download = `${filename.replace(/\.[^/.]+$/, '')}_${caseType}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportAllConversions = useCallback((conversions: ConversionResult[], filename: string) => {
    const content = conversions.map(conv =>
      `=== ${caseOptions.find(opt => opt.value === conv.type)?.name} ===\n${conv.content}\n`
    ).join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename.replace(/\.[^/.]+$/, '')}_all_cases.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportCSV = useCallback((files: TextFile[]) => {
    const headers = ['Filename', 'Original Size', 'Case Type', 'Converted Size', 'Character Change']

    const rows = files
      .filter(file => file.conversions && file.conversions.length > 0)
      .flatMap(file =>
        file.conversions!.map(conv => [
          file.name,
          file.originalContent.length,
          caseOptions.find(opt => opt.value === conv.type)?.name || conv.type,
          conv.content.length,
          conv.content.length - file.originalContent.length
        ])
      )

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'case_conversion_report.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportConversion, exportAllConversions, exportCSV }
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
 * Enhanced Character Case Converter Tool
 * Features: Multiple case types, batch processing, file upload, real-time conversion, export capabilities
 */
const CaseConverterCore = () => {
  const [files, setFiles] = useState<TextFile[]>([])
  const [manualText, setManualText] = useState('')
  const [selectedCaseType, setSelectedCaseType] = useState<CaseType>('uppercase')
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<ConversionSettings>({
    preserveFormatting: true,
    handleSpecialChars: true,
    customDelimiter: ' ',
    batchMode: false,
    previewLength: 100
  })
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'manual' | 'files'>('manual')
  const [showAllConversions, setShowAllConversions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { processTextFile } = useTextProcessing()
  const { convertAllCases } = useBatchConversion()
  const { exportConversion, exportAllConversions, exportCSV } = useTextExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Real-time conversion for manual text input
  const convertedManualText = useCaseConversion(manualText, selectedCaseType, settings)
  const allManualConversions = useMemo(() =>
    manualText.trim() ? convertAllCases(manualText, settings) : [],
    [manualText, convertAllCases, settings]
  )

  // File handling
  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList)
    const newFiles: TextFile[] = []

    for (const file of fileArray) {
      const validation = validateTextFile(file)
      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.error}`)
        continue
      }

      const id = generateId()
      newFiles.push({
        id,
        file,
        originalContent: '',
        convertedContent: '',
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        status: 'pending'
      })
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
      const message = `Added ${newFiles.length} file${newFiles.length > 1 ? 's' : ''} for conversion`
      toast.success(message)

      // Announce to screen readers
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = message
      document.body.appendChild(announcement)
      setTimeout(() => document.body.removeChild(announcement), 1000)
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (fileList) {
      handleFiles(fileList)
    }
  }, [handleFiles])

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const fileList = e.dataTransfer.files
    if (fileList) {
      handleFiles(fileList)
    }
  }, [handleFiles])

  // Process files
  const processFiles = useCallback(async () => {
    const pendingFiles = files.filter(file => file.status === 'pending')
    if (pendingFiles.length === 0) {
      toast.error('No files to process')
      return
    }

    setIsProcessing(true)
    const startTime = Date.now()

    for (const file of pendingFiles) {
      try {
        // Update status to processing
        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'processing' } : f
        ))

        const content = await processTextFile(file.file)
        const conversions = settings.batchMode ?
          convertAllCases(content, settings) :
          [{ type: selectedCaseType, content: convertCase(content, selectedCaseType, settings), preview: '' }]

        // Update with conversion result
        setFiles(prev => prev.map(f =>
          f.id === file.id ? {
            ...f,
            status: 'completed',
            originalContent: content,
            convertedContent: conversions[0].content,
            conversions
          } : f
        ))
      } catch (error) {
        console.error('Processing failed:', error)
        setFiles(prev => prev.map(f =>
          f.id === file.id ? {
            ...f,
            status: 'error',
            error: error instanceof Error ? error.message : 'Processing failed'
          } : f
        ))
      }
    }

    setIsProcessing(false)
    const processingTime = Date.now() - startTime
    const completedCount = files.filter(f => f.status === 'completed').length
    const message = `Conversion completed! ${completedCount} file${completedCount > 1 ? 's' : ''} processed in ${processingTime}ms.`
    toast.success(message)

    // Announce completion to screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 2000)
  }, [files, settings, selectedCaseType, processTextFile, convertAllCases])

  // Utility functions
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
    toast.success('All files cleared')
  }, [])

  // Statistics calculation
  const stats: ConversionStats = useMemo(() => {
    const completedFiles = files.filter(f => f.status === 'completed')

    return {
      totalFiles: completedFiles.length,
      totalCharacters: completedFiles.reduce((sum, f) => sum + f.originalContent.length, 0),
      totalWords: completedFiles.reduce((sum, f) => sum + f.originalContent.split(/\s+/).length, 0),
      totalConversions: completedFiles.reduce((sum, f) => sum + (f.conversions?.length || 1), 0),
      averageFileSize: completedFiles.length > 0
        ? completedFiles.reduce((sum, f) => sum + f.size, 0) / completedFiles.length
        : 0,
      processingTime: 0 // This would be calculated during processing
    }
  }, [files])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className='flex flex-col gap-4'>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" aria-hidden="true" />
            Character Case Converter
          </CardTitle>
          <CardDescription>
            Convert text between different case formats including uppercase, lowercase, camelCase, snake_case, and more.
            Supports both manual input and file processing with real-time preview.
            Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tab Navigation */}
      <Card>
        <CardHeader>
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'manual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('manual')}
              className="flex-1"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Manual Input
            </Button>
            <Button
              variant={activeTab === 'files' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('files')}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              File Upload
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Conversion Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caseType">Case Type</Label>
              <Select
                value={selectedCaseType}
                onValueChange={(value: CaseType) => setSelectedCaseType(value)}
              >
                <SelectTrigger id="caseType" aria-label="Select case conversion type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {caseOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.name}</span>
                        <span className="text-xs text-muted-foreground">{option.example}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="previewLength">Preview Length</Label>
              <Input
                id="previewLength"
                type="number"
                min="50"
                max="500"
                value={settings.previewLength}
                onChange={(e) => setSettings(prev => ({ ...prev, previewLength: Number(e.target.value) }))}
                aria-label={`Preview length: ${settings.previewLength} characters`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                id="preserveFormatting"
                type="checkbox"
                checked={settings.preserveFormatting}
                onChange={(e) => setSettings(prev => ({ ...prev, preserveFormatting: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="preserveFormatting" className="text-sm">
                Preserve line breaks and formatting
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="handleSpecialChars"
                type="checkbox"
                checked={settings.handleSpecialChars}
                onChange={(e) => setSettings(prev => ({ ...prev, handleSpecialChars: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="handleSpecialChars" className="text-sm">
                Handle special characters and punctuation
              </Label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="batchMode"
              type="checkbox"
              checked={settings.batchMode}
              onChange={(e) => setSettings(prev => ({ ...prev, batchMode: e.target.checked }))}
              className="rounded border-input"
            />
            <Label htmlFor="batchMode" className="text-sm">
              Batch mode: Generate all case types for files
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Manual Text Input */}
      {activeTab === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manual Text Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manualText">Enter your text for conversion</Label>
              <Textarea
                id="manualText"
                placeholder="Type or paste your text here..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="min-h-[150px] resize-y"
                aria-label="Text input for case conversion"
              />
            </div>

            {/* Real-time Conversion Display */}
            {manualText.trim() && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">
                      {caseOptions.find(opt => opt.value === selectedCaseType)?.name} Result
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(convertedManualText, selectedCaseType)}
                      >
                        {copiedText === selectedCaseType ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportConversion(convertedManualText, 'manual_text', selectedCaseType)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={convertedManualText}
                    readOnly
                    className="min-h-[100px] bg-background"
                    aria-label={`Converted text in ${selectedCaseType}`}
                  />
                </div>

                {/* Show All Conversions Toggle */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllConversions(!showAllConversions)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {showAllConversions ? 'Hide' : 'Show'} All Case Types
                  </Button>

                  {showAllConversions && (
                    <Button
                      variant="outline"
                      onClick={() => exportAllConversions(allManualConversions, 'manual_text')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export All
                    </Button>
                  )}
                </div>

                {/* All Conversions Grid */}
                {showAllConversions && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allManualConversions.map((conversion) => {
                      const option = caseOptions.find(opt => opt.value === conversion.type)
                      return (
                        <Card key={conversion.type} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              {option?.icon}
                              {option?.name}
                            </h5>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(conversion.content, conversion.type)}
                              >
                                {copiedText === conversion.type ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => exportConversion(conversion.content, 'manual_text', conversion.type)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {option?.description}
                          </div>
                          <div className="p-2 bg-muted/50 rounded text-sm font-mono break-all">
                            {conversion.preview || conversion.content}
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Upload */}
      {activeTab === 'files' && (
        <>
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
                  Drag and drop your text files here, or click to select files
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mb-2"
                >
                  <FileImage className="mr-2 h-4 w-4" />
                  Choose Files
                </Button>
                <p className="text-xs text-muted-foreground">
                  Supports TXT, MD, RTF, CSV, DOC, DOCX, JSON, HTML, XML • Max 50MB per file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.md,.rtf,.csv,.doc,.docx,.json,.html,.xml"
                  onChange={handleFileInput}
                  className="hidden"
                  aria-label="Select text files"
                />
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalFiles}</div>
                    <div className="text-sm text-muted-foreground">Files Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalCharacters.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Characters</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.totalWords.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalConversions}</div>
                    <div className="text-sm text-muted-foreground">Total Conversions</div>
                  </div>
                </div>

                {stats.totalFiles > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-center">
                      <span className="text-blue-700 dark:text-blue-400 font-semibold">
                        Average file size: {formatFileSize(stats.averageFileSize)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {files.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    onClick={processFiles}
                    disabled={isProcessing || files.every(f => f.status !== 'pending')}
                    className="min-w-32"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      'Convert Files'
                    )}
                  </Button>

                  <Button
                    onClick={() => exportCSV(files)}
                    variant="outline"
                    disabled={!files.some(f => f.status === 'completed')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV Report
                  </Button>

                  <Button
                    onClick={clearAll}
                    variant="destructive"
                    disabled={isProcessing}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File List */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Files</CardTitle>
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
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              <span className="font-medium">Size:</span> {formatFileSize(file.size)} •
                              <span className="font-medium"> Type:</span> {file.type}
                            </div>

                            {file.status === 'completed' && file.conversions && (
                              <div className="mt-2 space-y-2">
                                <div className="text-xs font-medium">Conversions Available:</div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {file.conversions.map((conversion) => {
                                    const option = caseOptions.find(opt => opt.value === conversion.type)
                                    return (
                                      <div key={conversion.type} className="p-2 bg-muted/30 rounded text-xs">
                                        <div className="font-medium">{option?.name}</div>
                                        <div className="text-muted-foreground truncate">
                                          {conversion.preview || conversion.content.substring(0, 30) + '...'}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {file.status === 'pending' && (
                              <div className="text-blue-600">Ready for conversion</div>
                            )}
                            {file.status === 'processing' && (
                              <div className="text-blue-600 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </div>
                            )}
                            {file.error && (
                              <div className="text-red-600">Error: {file.error}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-2">
                          {file.status === 'completed' && file.conversions && (
                            <Button
                              size="sm"
                              onClick={() => exportAllConversions(file.conversions!, file.name)}
                              aria-label={`Export all conversions for ${file.name}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(file.id)}
                            aria-label={`Remove ${file.name}`}
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
        </>
      )}
      </div>
    </div>
  )
}

// Main component with error boundary
const CaseConverter = () => {
  return (
    <CaseConverterErrorBoundary>
      <CaseConverterCore />
    </CaseConverterErrorBoundary>
  )
}

export default CaseConverter
