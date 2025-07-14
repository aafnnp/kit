import React, { useCallback, useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, Download, FileText, Loader2, FileImage, Trash2, Link, RefreshCw, BookOpen, Target, Copy, Check, AlertCircle } from 'lucide-react'

// Types
interface TextFile {
  id: string
  file: File
  originalContent: string
  slugifiedContent: string[]
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  slugs?: SlugResult[]
}

interface SlugResult {
  original: string
  slug: string
  isValid: boolean
  warnings: string[]
  seoScore: number
  length: number
}

interface SlugSettings {
  separator: '-' | '_' | '.' | ''
  caseStyle: 'lowercase' | 'uppercase' | 'preserve'
  maxLength: number
  removeStopWords: boolean
  preserveNumbers: boolean
  allowUnicode: boolean
  customReplacements: Record<string, string>
  strictMode: boolean
  seoOptimized: boolean
}

interface SlugStats {
  totalFiles: number
  totalSlugs: number
  averageLength: number
  averageSeoScore: number
  validSlugs: number
  invalidSlugs: number
  processingTime: number
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
    'text/plain', 'text/markdown', 'text/csv',
    'application/json', 'text/html', 'text/xml'
  ]

  // Check file extension as fallback
  const extension = file.name.toLowerCase().split('.').pop()
  const allowedExtensions = ['txt', 'md', 'csv', 'json', 'html', 'xml']

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension || '')) {
    return { isValid: false, error: 'Unsupported file format. Please use TXT, MD, CSV, JSON, HTML, or XML.' }
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large. Maximum size is 50MB.' }
  }

  return { isValid: true }
}

// Stop words for SEO optimization
const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
  'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they',
  'have', 'had', 'what', 'said', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'up', 'out',
  'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'into', 'him',
  'time', 'two', 'more', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call',
  'who', 'oil', 'sit', 'now', 'find', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'
])

// Advanced slug generation function
const generateSlug = (text: string, settings: SlugSettings): SlugResult => {
  if (!text || text.trim().length === 0) {
    return {
      original: text,
      slug: '',
      isValid: false,
      warnings: ['Empty input'],
      seoScore: 0,
      length: 0
    }
  }

  let processedText = text.trim()
  const warnings: string[] = []

  // Apply custom replacements first
  Object.entries(settings.customReplacements).forEach(([from, to]) => {
    processedText = processedText.replace(new RegExp(from, 'g'), to)
  })

  // Handle case style
  switch (settings.caseStyle) {
    case 'lowercase':
      processedText = processedText.toLowerCase()
      break
    case 'uppercase':
      processedText = processedText.toUpperCase()
      break
    // 'preserve' keeps original case
  }

  // Remove stop words if enabled
  if (settings.removeStopWords) {
    const words = processedText.split(/\s+/)
    const filteredWords = words.filter((word, index) => {
      // Always keep the first word and non-stop words
      return index === 0 || !stopWords.has(word.toLowerCase())
    })
    processedText = filteredWords.join(' ')
  }

  // Handle Unicode characters
  if (!settings.allowUnicode) {
    // Convert accented characters to ASCII equivalents
    processedText = processedText
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
  }

  // Replace spaces and special characters
  let slug = processedText
    .replace(/\s+/g, settings.separator) // Replace spaces with separator
    .replace(/[^\w\-_.]/g, settings.separator) // Replace special chars

  // Handle numbers
  if (!settings.preserveNumbers) {
    slug = slug.replace(/\d+/g, '')
  }

  // Clean up separators
  if (settings.separator) {
    const separatorRegex = new RegExp(`\\${settings.separator}+`, 'g')
    const edgeRegex = new RegExp(`^\\${settings.separator}+|\\${settings.separator}+$`, 'g')
    slug = slug
      .replace(separatorRegex, settings.separator) // Remove duplicate separators
      .replace(edgeRegex, '') // Remove leading/trailing separators
  }

  // Apply max length
  if (settings.maxLength > 0 && slug.length > settings.maxLength) {
    slug = slug.substring(0, settings.maxLength)
    // Try to break at word boundary
    if (settings.separator) {
      const lastSeparator = slug.lastIndexOf(settings.separator)
      if (lastSeparator > settings.maxLength * 0.7) {
        slug = slug.substring(0, lastSeparator)
      }
    }
    warnings.push(`Truncated to ${settings.maxLength} characters`)
  }

  // Strict mode validation
  if (settings.strictMode) {
    const strictPattern = /^[a-z0-9\-_\.]*$/
    if (!strictPattern.test(slug)) {
      warnings.push('Contains characters not allowed in strict mode')
    }
  }

  // Calculate SEO score
  let seoScore = 100

  // Length scoring
  if (slug.length < 3) {
    seoScore -= 30
    warnings.push('Very short slug (< 3 characters)')
  } else if (slug.length > 60) {
    seoScore -= 20
    warnings.push('Long slug (> 60 characters)')
  }

  // Separator scoring
  if (settings.separator === '-') {
    seoScore += 5 // Hyphens are preferred for SEO
  }

  // Word count scoring
  const wordCount = slug.split(settings.separator).filter(word => word.length > 0).length
  if (wordCount < 2) {
    seoScore -= 15
    warnings.push('Single word slug')
  } else if (wordCount > 6) {
    seoScore -= 10
    warnings.push('Too many words in slug')
  }

  // Number presence
  if (/\d/.test(slug) && !settings.seoOptimized) {
    seoScore -= 5
    warnings.push('Contains numbers (may affect SEO)')
  }

  seoScore = Math.max(0, Math.min(100, seoScore))

  return {
    original: text,
    slug,
    isValid: slug.length > 0 && (!settings.strictMode || /^[a-z0-9\-_\.]*$/.test(slug)),
    warnings,
    seoScore,
    length: slug.length
  }
}

// Error boundary component
class SlugGeneratorErrorBoundary extends React.Component<
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
    console.error('Slug generator error:', error, errorInfo)
    toast.error('An unexpected error occurred during slug generation')
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
            // Extract text from markdown, keeping structure for slug generation
            resolve(result)
          } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
            // Extract text content from HTML
            const cleanText = result.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
            resolve(cleanText)
          } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
            try {
              const jsonData = JSON.parse(result)
              // Extract text values from JSON for slug generation
              const textContent = JSON.stringify(jsonData, null, 2)
              resolve(textContent)
            } catch {
              resolve(result) // Fallback to raw content
            }
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

// Real-time slug generation hook
const useSlugGeneration = (text: string, settings: SlugSettings) => {
  return useMemo(() => {
    if (!text.trim()) {
      return {
        original: '',
        slug: '',
        isValid: false,
        warnings: [],
        seoScore: 0,
        length: 0
      }
    }

    return generateSlug(text, settings)
  }, [text, settings])
}

// Batch slug generation hook
const useBatchSlugGeneration = () => {
  const generateSlugsFromText = useCallback((text: string, settings: SlugSettings): SlugResult[] => {
    // Split text into lines and generate slugs for each non-empty line
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    return lines.map(line => generateSlug(line.trim(), settings))
  }, [])

  return { generateSlugsFromText }
}

// Export functionality
const useSlugExport = () => {
  const exportSlug = useCallback((slug: SlugResult, filename: string) => {
    const data = {
      filename,
      timestamp: new Date().toISOString(),
      slug: {
        original: slug.original,
        generated: slug.slug,
        isValid: slug.isValid,
        warnings: slug.warnings,
        seoScore: slug.seoScore,
        length: slug.length
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename.replace(/\.[^/.]+$/, '')}_slug.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportAllSlugs = useCallback((slugs: SlugResult[], filename: string) => {
    const content = slugs.map(slug =>
      `${slug.original} -> ${slug.slug}`
    ).join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename.replace(/\.[^/.]+$/, '')}_slugs.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportCSV = useCallback((files: TextFile[]) => {
    const headers = ['Filename', 'Original Text', 'Generated Slug', 'Is Valid', 'SEO Score', 'Length', 'Warnings']

    const rows = files
      .filter(file => file.slugs && file.slugs.length > 0)
      .flatMap(file =>
        file.slugs!.map(slug => [
          file.name,
          slug.original,
          slug.slug,
          slug.isValid ? 'Yes' : 'No',
          slug.seoScore,
          slug.length,
          slug.warnings.join('; ')
        ])
      )

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'slug_generation_report.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportSlug, exportAllSlugs, exportCSV }
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
 * Enhanced Slug Generator Tool
 * Features: Multiple slug options, batch processing, file upload, real-time generation, SEO optimization
 */
const SlugGeneratorCore = () => {
  const [files, setFiles] = useState<TextFile[]>([])
  const [manualText, setManualText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<SlugSettings>({
    separator: '-',
    caseStyle: 'lowercase',
    maxLength: 60,
    removeStopWords: false,
    preserveNumbers: true,
    allowUnicode: false,
    customReplacements: {},
    strictMode: false,
    seoOptimized: true
  })
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'manual' | 'files'>('manual')
  const [showBatchResults, setShowBatchResults] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { processTextFile } = useTextProcessing()
  const { generateSlugsFromText } = useBatchSlugGeneration()
  const { exportSlug, exportAllSlugs, exportCSV } = useSlugExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Real-time slug generation for manual text input
  const manualSlugResult = useSlugGeneration(manualText, settings)
  const batchSlugResults = useMemo(() =>
    manualText.trim() ? generateSlugsFromText(manualText, settings) : [],
    [manualText, generateSlugsFromText, settings]
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
        slugifiedContent: [],
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        status: 'pending'
      })
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
      const message = `Added ${newFiles.length} file${newFiles.length > 1 ? 's' : ''} for slug generation`
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
        const slugs = generateSlugsFromText(content, settings)

        // Update with slug generation result
        setFiles(prev => prev.map(f =>
          f.id === file.id ? {
            ...f,
            status: 'completed',
            originalContent: content,
            slugifiedContent: slugs.map(s => s.slug),
            slugs
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
    const message = `Slug generation completed! ${completedCount} file${completedCount > 1 ? 's' : ''} processed in ${processingTime}ms.`
    toast.success(message)

    // Announce completion to screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 2000)
  }, [files, settings, processTextFile, generateSlugsFromText])

  // Utility functions
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
    toast.success('All files cleared')
  }, [])

  // Statistics calculation
  const stats: SlugStats = useMemo(() => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.slugs)
    const allSlugs = completedFiles.flatMap(f => f.slugs || [])

    return {
      totalFiles: completedFiles.length,
      totalSlugs: allSlugs.length,
      averageLength: allSlugs.length > 0
        ? allSlugs.reduce((sum, s) => sum + s.length, 0) / allSlugs.length
        : 0,
      averageSeoScore: allSlugs.length > 0
        ? allSlugs.reduce((sum, s) => sum + s.seoScore, 0) / allSlugs.length
        : 0,
      validSlugs: allSlugs.filter(s => s.isValid).length,
      invalidSlugs: allSlugs.filter(s => !s.isValid).length,
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
            <Link className="h-5 w-5" aria-hidden="true" />
            Slug Generator
          </CardTitle>
          <CardDescription>
            Generate SEO-friendly URL slugs from text with customizable options.
            Supports batch processing, multiple file formats, and real-time generation with SEO scoring.
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
            Slug Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="separator">Separator</Label>
              <Select
                value={settings.separator}
                onValueChange={(value: SlugSettings['separator']) =>
                  setSettings(prev => ({ ...prev, separator: value }))
                }
              >
                <SelectTrigger id="separator" aria-label="Select separator character">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">Hyphen (-)</SelectItem>
                  <SelectItem value="_">Underscore (_)</SelectItem>
                  <SelectItem value=".">Dot (.)</SelectItem>
                  <SelectItem value="">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseStyle">Case Style</Label>
              <Select
                value={settings.caseStyle}
                onValueChange={(value: SlugSettings['caseStyle']) =>
                  setSettings(prev => ({ ...prev, caseStyle: value }))
                }
              >
                <SelectTrigger id="caseStyle" aria-label="Select case style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lowercase">lowercase</SelectItem>
                  <SelectItem value="uppercase">UPPERCASE</SelectItem>
                  <SelectItem value="preserve">Preserve Original</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLength">Max Length</Label>
              <Input
                id="maxLength"
                type="number"
                min="0"
                max="200"
                value={settings.maxLength}
                onChange={(e) => setSettings(prev => ({ ...prev, maxLength: Number(e.target.value) }))}
                aria-label={`Maximum slug length: ${settings.maxLength} characters`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                id="removeStopWords"
                type="checkbox"
                checked={settings.removeStopWords}
                onChange={(e) => setSettings(prev => ({ ...prev, removeStopWords: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="removeStopWords" className="text-sm">
                Remove stop words (SEO optimization)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="preserveNumbers"
                type="checkbox"
                checked={settings.preserveNumbers}
                onChange={(e) => setSettings(prev => ({ ...prev, preserveNumbers: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="preserveNumbers" className="text-sm">
                Preserve numbers in slugs
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="allowUnicode"
                type="checkbox"
                checked={settings.allowUnicode}
                onChange={(e) => setSettings(prev => ({ ...prev, allowUnicode: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="allowUnicode" className="text-sm">
                Allow Unicode characters
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="strictMode"
                type="checkbox"
                checked={settings.strictMode}
                onChange={(e) => setSettings(prev => ({ ...prev, strictMode: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="strictMode" className="text-sm">
                Strict mode (a-z, 0-9, separators only)
              </Label>
            </div>
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
              <Label htmlFor="manualText">Enter your text for slug generation</Label>
              <Textarea
                id="manualText"
                placeholder="Type or paste your text here..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="min-h-[120px] resize-y"
                aria-label="Text input for slug generation"
              />
            </div>

            {/* Real-time Slug Display */}
            {manualText.trim() && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Generated Slug</h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(manualSlugResult.slug, 'slug')}
                        disabled={!manualSlugResult.slug}
                      >
                        {copiedText === 'slug' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportSlug(manualSlugResult, 'manual_text')}
                        disabled={!manualSlugResult.slug}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 bg-background rounded border">
                      <div className="text-xs text-muted-foreground mb-1">Generated Slug:</div>
                      <div className="font-mono text-sm break-all">
                        {manualSlugResult.slug || <span className="text-muted-foreground">No valid slug generated</span>}
                      </div>
                    </div>

                    {/* SEO Score and Validation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-background rounded border">
                        <div className="text-lg font-bold text-blue-600">{manualSlugResult.seoScore}</div>
                        <div className="text-xs text-muted-foreground">SEO Score</div>
                      </div>
                      <div className="text-center p-2 bg-background rounded border">
                        <div className="text-lg font-bold text-green-600">{manualSlugResult.length}</div>
                        <div className="text-xs text-muted-foreground">Characters</div>
                      </div>
                      <div className="text-center p-2 bg-background rounded border">
                        <div className={`text-lg font-bold ${manualSlugResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                          {manualSlugResult.isValid ? '✓' : '✗'}
                        </div>
                        <div className="text-xs text-muted-foreground">Valid</div>
                      </div>
                    </div>

                    {/* Warnings */}
                    {manualSlugResult.warnings.length > 0 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Warnings:</div>
                            <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              {manualSlugResult.warnings.map((warning, index) => (
                                <li key={index}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Batch Results Toggle */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setShowBatchResults(!showBatchResults)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {showBatchResults ? 'Hide' : 'Show'} Line-by-Line Results
                  </Button>

                  {showBatchResults && batchSlugResults.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => exportAllSlugs(batchSlugResults, 'manual_text')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export All
                    </Button>
                  )}
                </div>

                {/* Batch Results */}
                {showBatchResults && batchSlugResults.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium">Line-by-Line Results:</h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {batchSlugResults.map((result, index) => (
                        <div key={index} className="p-3 bg-background rounded border">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs text-muted-foreground">Line {index + 1}</div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded ${result.isValid ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {result.isValid ? 'Valid' : 'Invalid'}
                              </span>
                              <span className="text-xs text-muted-foreground">SEO: {result.seoScore}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(result.slug, `line-${index + 1}`)}
                              >
                                {copiedText === `line-${index + 1}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">Original:</div>
                          <div className="text-sm mb-2 break-all">{result.original}</div>
                          <div className="text-xs text-muted-foreground mb-1">Slug:</div>
                          <div className="font-mono text-sm break-all">{result.slug}</div>
                        </div>
                      ))}
                    </div>
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
                  Supports TXT, MD, CSV, JSON, HTML, XML • Max 50MB per file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.md,.csv,.json,.html,.xml"
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
                    <div className="text-2xl font-bold text-blue-600">{stats.totalSlugs}</div>
                    <div className="text-sm text-muted-foreground">Total Slugs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.averageLength.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Avg Length</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.averageSeoScore.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Avg SEO Score</div>
                  </div>
                </div>

                {stats.totalSlugs > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-center">
                      <span className="text-blue-700 dark:text-blue-400 font-semibold">
                        Valid slugs: {stats.validSlugs} / {stats.totalSlugs} ({((stats.validSlugs / stats.totalSlugs) * 100).toFixed(1)}%)
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
                        Generating...
                      </>
                    ) : (
                      'Generate Slugs'
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

                            {file.status === 'completed' && file.slugs && (
                              <div className="mt-2 space-y-2">
                                <div className="text-xs font-medium">Generated Slugs ({file.slugs.length}):</div>
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                  {file.slugs.slice(0, 5).map((slug, index) => (
                                    <div key={index} className="p-2 bg-muted/30 rounded text-xs">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className={`px-2 py-1 rounded text-xs ${slug.isValid ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                          SEO: {slug.seoScore}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => copyToClipboard(slug.slug, `${file.id}-${index}`)}
                                        >
                                          {copiedText === `${file.id}-${index}` ? (
                                            <Check className="h-3 w-3" />
                                          ) : (
                                            <Copy className="h-3 w-3" />
                                          )}
                                        </Button>
                                      </div>
                                      <div className="font-mono break-all">{slug.slug}</div>
                                    </div>
                                  ))}
                                  {file.slugs.length > 5 && (
                                    <div className="text-xs text-muted-foreground text-center py-2">
                                      ... and {file.slugs.length - 5} more slugs
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {file.status === 'pending' && (
                              <div className="text-blue-600">Ready for slug generation</div>
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
                          {file.status === 'completed' && file.slugs && (
                            <Button
                              size="sm"
                              onClick={() => exportAllSlugs(file.slugs!, file.name)}
                              aria-label={`Export all slugs for ${file.name}`}
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
const SlugGenerator = () => {
  return (
    <SlugGeneratorErrorBoundary>
      <SlugGeneratorCore />
    </SlugGeneratorErrorBoundary>
  )
}

export default SlugGenerator
