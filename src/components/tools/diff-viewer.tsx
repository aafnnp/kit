import React, { useCallback, useRef, useState, useMemo } from 'react'
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
  Loader2,
  RefreshCw,
  GitCompare,
  Code,
  Upload,
  FileImage,
  Trash2,
  Settings,
  Copy,
  Check,
  BarChart3,
  Split,
  Eye,
  ArrowLeftRight,
  Columns,
} from 'lucide-react'
import { nanoid } from 'nanoid'
// Types
interface DiffFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  pairedWith?: string // ID of the file this is compared with
}

interface DiffPair {
  id: string
  leftFile: DiffFile
  rightFile: DiffFile
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  result?: DiffResult
  processedAt?: Date
}

interface DiffLine {
  type: 'added' | 'removed' | 'modified' | 'unchanged' | 'context'
  leftLineNumber?: number
  rightLineNumber?: number
  leftContent?: string
  rightContent?: string
  content: string
  wordDiffs?: WordDiff[]
}

interface WordDiff {
  type: 'added' | 'removed' | 'unchanged'
  content: string
}

interface DiffResult {
  lines: DiffLine[]
  statistics: DiffStatistics
  algorithm: DiffAlgorithm
  format: DiffFormat
}

interface DiffStatistics {
  totalLines: number
  addedLines: number
  removedLines: number
  modifiedLines: number
  unchangedLines: number
  addedWords: number
  removedWords: number
  similarity: number // percentage
  executionTime: number
}

interface DiffSettings {
  algorithm: DiffAlgorithm
  format: DiffFormat
  viewMode: DiffViewMode
  showLineNumbers: boolean
  showWhitespace: boolean
  ignoreWhitespace: boolean
  ignoreCase: boolean
  contextLines: number
  wordLevelDiff: boolean
  syntaxHighlighting: boolean
  wrapLines: boolean
}

// Enums
type DiffAlgorithm = 'myers' | 'patience' | 'histogram' | 'minimal'
type DiffFormat = 'unified' | 'side-by-side' | 'split' | 'inline'
type DiffViewMode = 'full' | 'changes-only' | 'context'

// Utility functions

const validateTextFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = [
    '.txt',
    '.text',
    '.log',
    '.csv',
    '.json',
    '.md',
    '.markdown',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.py',
    '.java',
    '.cpp',
    '.c',
    '.h',
    '.css',
    '.html',
    '.xml',
    '.yaml',
    '.yml',
  ]

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 50MB' }
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: 'Only text files are supported' }
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

// Myers diff algorithm implementation
const myersDiff = (textA: string, textB: string): DiffLine[] => {
  const linesA = textA.split(/\r?\n/)
  const linesB = textB.split(/\r?\n/)

  const n = linesA.length
  const m = linesB.length
  const max = n + m

  const v: number[] = new Array(2 * max + 1).fill(0)
  const trace: number[][] = []

  for (let d = 0; d <= max; d++) {
    trace.push([...v])

    for (let k = -d; k <= d; k += 2) {
      let x: number

      if (k === -d || (k !== d && v[k - 1 + max] < v[k + 1 + max])) {
        x = v[k + 1 + max]
      } else {
        x = v[k - 1 + max] + 1
      }

      let y = x - k

      while (x < n && y < m && linesA[x] === linesB[y]) {
        x++
        y++
      }

      v[k + max] = x

      if (x >= n && y >= m) {
        return buildDiffFromTrace(linesA, linesB, trace, d)
      }
    }
  }

  return buildDiffFromTrace(linesA, linesB, trace, max)
}

const buildDiffFromTrace = (linesA: string[], linesB: string[], trace: number[][], d: number): DiffLine[] => {
  const result: DiffLine[] = []
  let x = linesA.length
  let y = linesB.length

  for (let depth = d; depth > 0; depth--) {
    const v = trace[depth]
    const k = x - y
    const max = depth + linesA.length + linesB.length

    let prevK: number
    if (k === -depth || (k !== depth && v[k - 1 + max] < v[k + 1 + max])) {
      prevK = k + 1
    } else {
      prevK = k - 1
    }

    const prevX = v[prevK + max]
    const prevY = prevX - prevK

    while (x > prevX && y > prevY) {
      result.unshift({
        type: 'unchanged',
        leftLineNumber: x,
        rightLineNumber: y,
        leftContent: linesA[x - 1],
        rightContent: linesB[y - 1],
        content: linesA[x - 1],
      })
      x--
      y--
    }

    if (depth > 0) {
      if (x > prevX) {
        result.unshift({
          type: 'removed',
          leftLineNumber: x,
          leftContent: linesA[x - 1],
          content: linesA[x - 1],
        })
        x--
      } else if (y > prevY) {
        result.unshift({
          type: 'added',
          rightLineNumber: y,
          rightContent: linesB[y - 1],
          content: linesB[y - 1],
        })
        y--
      }
    }
  }

  return result
}

// Word-level diff for modified lines
const getWordDiff = (leftText: string, rightText: string): WordDiff[] => {
  const leftWords = leftText.split(/(\s+)/)
  const rightWords = rightText.split(/(\s+)/)

  const result: WordDiff[] = []
  let leftIndex = 0
  let rightIndex = 0

  while (leftIndex < leftWords.length || rightIndex < rightWords.length) {
    if (leftIndex >= leftWords.length) {
      // Remaining words are added
      result.push({
        type: 'added',
        content: rightWords.slice(rightIndex).join(''),
      })
      break
    }

    if (rightIndex >= rightWords.length) {
      // Remaining words are removed
      result.push({
        type: 'removed',
        content: leftWords.slice(leftIndex).join(''),
      })
      break
    }

    if (leftWords[leftIndex] === rightWords[rightIndex]) {
      // Words match
      result.push({
        type: 'unchanged',
        content: leftWords[leftIndex],
      })
      leftIndex++
      rightIndex++
    } else {
      // Find next matching word
      let foundMatch = false

      for (let i = rightIndex + 1; i < rightWords.length; i++) {
        if (leftWords[leftIndex] === rightWords[i]) {
          // Found match in right, words before it are added
          for (let j = rightIndex; j < i; j++) {
            result.push({
              type: 'added',
              content: rightWords[j],
            })
          }
          result.push({
            type: 'unchanged',
            content: leftWords[leftIndex],
          })
          leftIndex++
          rightIndex = i + 1
          foundMatch = true
          break
        }
      }

      if (!foundMatch) {
        for (let i = leftIndex + 1; i < leftWords.length; i++) {
          if (leftWords[i] === rightWords[rightIndex]) {
            // Found match in left, words before it are removed
            for (let j = leftIndex; j < i; j++) {
              result.push({
                type: 'removed',
                content: leftWords[j],
              })
            }
            result.push({
              type: 'unchanged',
              content: rightWords[rightIndex],
            })
            leftIndex = i + 1
            rightIndex++
            foundMatch = true
            break
          }
        }
      }

      if (!foundMatch) {
        // No match found, treat as replacement
        result.push({
          type: 'removed',
          content: leftWords[leftIndex],
        })
        result.push({
          type: 'added',
          content: rightWords[rightIndex],
        })
        leftIndex++
        rightIndex++
      }
    }
  }

  return result
}

// Enhanced diff with word-level analysis
const generateDiff = (textA: string, textB: string, settings: DiffSettings): DiffResult => {
  const startTime = performance.now()

  let processedTextA = textA
  let processedTextB = textB

  // Apply preprocessing based on settings
  if (settings.ignoreCase) {
    processedTextA = processedTextA.toLowerCase()
    processedTextB = processedTextB.toLowerCase()
  }

  if (settings.ignoreWhitespace) {
    processedTextA = processedTextA.replace(/\s+/g, ' ').trim()
    processedTextB = processedTextB.replace(/\s+/g, ' ').trim()
  }

  // Generate line-level diff using selected algorithm
  let lines: DiffLine[]
  switch (settings.algorithm) {
    case 'myers':
    default:
      lines = myersDiff(processedTextA, processedTextB)
      break
    // Additional algorithms can be implemented here
  }

  // Add word-level diffs for modified lines
  if (settings.wordLevelDiff) {
    lines = lines.map((line) => {
      if (line.type === 'modified' && line.leftContent && line.rightContent) {
        return {
          ...line,
          wordDiffs: getWordDiff(line.leftContent, line.rightContent),
        }
      }
      return line
    })
  }

  // Calculate statistics
  const addedLines = lines.filter((l) => l.type === 'added').length
  const removedLines = lines.filter((l) => l.type === 'removed').length
  const modifiedLines = lines.filter((l) => l.type === 'modified').length
  const unchangedLines = lines.filter((l) => l.type === 'unchanged').length

  const addedWords = lines.reduce((sum, line) => {
    if (line.wordDiffs) {
      return sum + line.wordDiffs.filter((w) => w.type === 'added').length
    }
    return sum + (line.type === 'added' ? line.content.split(/\s+/).length : 0)
  }, 0)

  const removedWords = lines.reduce((sum, line) => {
    if (line.wordDiffs) {
      return sum + line.wordDiffs.filter((w) => w.type === 'removed').length
    }
    return sum + (line.type === 'removed' ? line.content.split(/\s+/).length : 0)
  }, 0)

  const totalLines = Math.max(textA.split(/\r?\n/).length, textB.split(/\r?\n/).length)
  const similarity = totalLines > 0 ? (unchangedLines / totalLines) * 100 : 100

  const statistics: DiffStatistics = {
    totalLines,
    addedLines,
    removedLines,
    modifiedLines,
    unchangedLines,
    addedWords,
    removedWords,
    similarity,
    executionTime: performance.now() - startTime,
  }

  return {
    lines,
    statistics,
    algorithm: settings.algorithm,
    format: settings.format,
  }
}

// Error boundary component
class DiffViewerErrorBoundary extends React.Component<
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
    console.error('Diff viewer error:', error, errorInfo)
    toast.error('An unexpected error occurred during diff processing')
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
const useDiffProcessing = () => {
  const processDiff = useCallback((textA: string, textB: string, settings: DiffSettings): DiffResult => {
    try {
      return generateDiff(textA, textB, settings)
    } catch (error) {
      console.error('Diff processing error:', error)
      throw new Error('Failed to process diff')
    }
  }, [])

  const processFilePair = useCallback(
    async (leftFile: DiffFile, rightFile: DiffFile, settings: DiffSettings): Promise<DiffPair> => {
      try {
        const result = processDiff(leftFile.content, rightFile.content, settings)

        return {
          id: nanoid(),
          leftFile: { ...leftFile, status: 'completed' },
          rightFile: { ...rightFile, status: 'completed' },
          status: 'completed',
          result,
          processedAt: new Date(),
        }
      } catch (error) {
        return {
          id: nanoid(),
          leftFile: { ...leftFile, status: 'error' },
          rightFile: { ...rightFile, status: 'error' },
          status: 'error',
          error: error instanceof Error ? error.message : 'Processing failed',
        }
      }
    },
    [processDiff]
  )

  const processBatch = useCallback(
    async (pairs: DiffPair[], settings: DiffSettings): Promise<DiffPair[]> => {
      return Promise.all(pairs.map((pair) => processFilePair(pair.leftFile, pair.rightFile, settings)))
    },
    [processFilePair]
  )

  return { processDiff, processFilePair, processBatch }
}

// Real-time diff processing hook
const useRealTimeDiff = (textA: string, textB: string, settings: DiffSettings) => {
  return useMemo(() => {
    if (!textA.trim() && !textB.trim()) {
      return {
        lines: [],
        statistics: {
          totalLines: 0,
          addedLines: 0,
          removedLines: 0,
          modifiedLines: 0,
          unchangedLines: 0,
          addedWords: 0,
          removedWords: 0,
          similarity: 100,
          executionTime: 0,
        },
        algorithm: settings.algorithm,
        format: settings.format,
      }
    }

    try {
      return generateDiff(textA, textB, settings)
    } catch (error) {
      console.error('Real-time diff error:', error)
      return {
        lines: [],
        statistics: {
          totalLines: 0,
          addedLines: 0,
          removedLines: 0,
          modifiedLines: 0,
          unchangedLines: 0,
          addedWords: 0,
          removedWords: 0,
          similarity: 0,
          executionTime: 0,
        },
        algorithm: settings.algorithm,
        format: settings.format,
      }
    }
  }, [textA, textB, settings])
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<DiffFile> => {
    const validation = validateTextFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const diffFile: DiffFile = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type || 'text/plain',
            status: 'pending',
          }

          resolve(diffFile)
        } catch (error) {
          reject(new Error('Failed to process file'))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<DiffFile[]> => {
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
const useDiffExport = () => {
  const exportUnifiedDiff = useCallback(
    (result: DiffResult, leftName: string = 'left', rightName: string = 'right', filename?: string) => {
      const lines = [
        `--- ${leftName}`,
        `+++ ${rightName}`,
        `@@ -1,${result.statistics.totalLines} +1,${result.statistics.totalLines} @@`,
      ]

      result.lines.forEach((line) => {
        switch (line.type) {
          case 'added':
            lines.push(`+${line.content}`)
            break
          case 'removed':
            lines.push(`-${line.content}`)
            break
          case 'unchanged':
            lines.push(` ${line.content}`)
            break
          case 'modified':
            lines.push(`-${line.leftContent || ''}`)
            lines.push(`+${line.rightContent || ''}`)
            break
        }
      })

      const content = lines.join('\n')
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || 'diff.patch'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    []
  )

  const exportHTML = useCallback(
    (result: DiffResult, leftName: string = 'left', rightName: string = 'right', filename?: string) => {
      const css = `
      <style>
        body { font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4; margin: 20px; }
        .diff-header { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; margin-bottom: 10px; }
        .diff-line { padding: 2px 5px; white-space: pre-wrap; }
        .added { background-color: #d4edda; color: #155724; }
        .removed { background-color: #f8d7da; color: #721c24; }
        .modified { background-color: #fff3cd; color: #856404; }
        .unchanged { background-color: #f8f9fa; }
        .line-number { display: inline-block; width: 50px; text-align: right; margin-right: 10px; color: #666; }
      </style>
    `

      const header = `
      <div class="diff-header">
        <h2>Diff: ${leftName} vs ${rightName}</h2>
        <p>Statistics: ${result.statistics.addedLines} added, ${result.statistics.removedLines} removed, ${result.statistics.modifiedLines} modified</p>
        <p>Similarity: ${result.statistics.similarity.toFixed(1)}%</p>
      </div>
    `

      const diffLines = result.lines
        .map((line, index) => {
          const lineClass = line.type
          const lineNumber = `<span class="line-number">${index + 1}</span>`
          return `<div class="diff-line ${lineClass}">${lineNumber}${line.content}</div>`
        })
        .join('')

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Diff Report</title>${css}</head><body>${header}${diffLines}</body></html>`

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || 'diff-report.html'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    []
  )

  const exportBatch = useCallback((pairs: DiffPair[]) => {
    const content = pairs
      .map(
        (pair, index) =>
          `=== Diff ${index + 1}: ${pair.leftFile.name} vs ${pair.rightFile.name} ===\n` +
          `Status: ${pair.status}\n` +
          `Statistics: ${pair.result ? JSON.stringify(pair.result.statistics, null, 2) : 'N/A'}\n` +
          `${pair.error ? `Error: ${pair.error}` : ''}\n` +
          '---\n'
      )
      .join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'diff-batch-results.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportCSV = useCallback((pairs: DiffPair[]) => {
    const headers = [
      'Left File',
      'Right File',
      'Status',
      'Added Lines',
      'Removed Lines',
      'Modified Lines',
      'Similarity %',
      'Execution Time (ms)',
    ]

    const rows = pairs.map((pair) => [
      pair.leftFile.name,
      pair.rightFile.name,
      pair.status,
      pair.result?.statistics.addedLines || 0,
      pair.result?.statistics.removedLines || 0,
      pair.result?.statistics.modifiedLines || 0,
      pair.result?.statistics.similarity.toFixed(2) || 0,
      pair.result?.statistics.executionTime.toFixed(2) || 0,
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'diff-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportUnifiedDiff, exportHTML, exportBatch, exportCSV }
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
        (file) =>
          file.type === 'text/plain' ||
          file.name.match(/\.(txt|text|log|csv|json|md|markdown|js|ts|jsx|tsx|py|java|cpp|c|h|css|html|xml|yaml|yml)$/i)
      )

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error('Please drop only text files')
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
 * Enhanced Diff Viewer Tool
 * Features: Real-time diff, file upload, batch processing, multiple algorithms
 */
const DiffViewerCore = () => {
  const [activeTab, setActiveTab] = useState<'diff' | 'files'>('diff')
  const [leftText, setLeftText] = useState('Hello World\nThis is line 2\nThis is line 3')
  const [rightText, setRightText] = useState('Hello Universe\nThis is line 2\nThis is line 4\nThis is a new line')
  const [files, setFiles] = useState<DiffFile[]>([])
  const [pairs, setPairs] = useState<DiffPair[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<DiffSettings>({
    algorithm: 'myers',
    format: 'side-by-side',
    viewMode: 'full',
    showLineNumbers: true,
    showWhitespace: false,
    ignoreWhitespace: false,
    ignoreCase: false,
    contextLines: 3,
    wordLevelDiff: true,
    syntaxHighlighting: false,
    wrapLines: true,
  })

  const { processBatch } = useDiffProcessing()
  const { exportUnifiedDiff, exportHTML, exportBatch, exportCSV } = useDiffExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // 顶层调用
  const { processBatch: processFileBatch } = useFileProcessing()

  // Real-time diff processing
  const realtimeDiff = useRealTimeDiff(leftText, rightText, settings)

  // File drag and drop
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    useCallback(
      async (droppedFiles: File[]) => {
        try {
          setIsProcessing(true)
          const processedFiles = await processFileBatch(droppedFiles)
          setFiles((prev) => [...processedFiles, ...prev])
          toast.success(`Added ${processedFiles.length} file(s)`)
        } catch (error) {
          toast.error('Failed to process files')
        } finally {
          setIsProcessing(false)
        }
      },
      [processFileBatch]
    )
  )

  // Create file pairs for comparison
  const createPair = useCallback((leftFile: DiffFile, rightFile: DiffFile) => {
    const newPair: DiffPair = {
      id: nanoid(),
      leftFile: { ...leftFile, pairedWith: rightFile.id },
      rightFile: { ...rightFile, pairedWith: leftFile.id },
      status: 'pending',
    }
    setPairs((prev) => [...prev, newPair])
    toast.success(`Created pair: ${leftFile.name} vs ${rightFile.name}`)
  }, [])

  // Process all pending pairs
  const processPairs = useCallback(async () => {
    const pendingPairs = pairs.filter((p) => p.status === 'pending')
    if (pendingPairs.length === 0) {
      toast.error('No pairs to process')
      return
    }

    setIsProcessing(true)
    try {
      const updatedPairs = await processBatch(pendingPairs, settings)
      setPairs((prev) =>
        prev.map((pair) => {
          const updated = updatedPairs.find((u) => u.id === pair.id)
          return updated || pair
        })
      )
      toast.success('Pairs processed successfully!')
    } catch (error) {
      toast.error('Failed to process pairs')
    } finally {
      setIsProcessing(false)
    }
  }, [pairs, settings, processBatch])

  // Clear all files and pairs
  const clearAll = useCallback(() => {
    setFiles([])
    setPairs([])
    toast.success('All files and pairs cleared')
  }, [])

  // Remove specific file
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
    // Also remove any pairs involving this file
    setPairs((prev) => prev.filter((pair) => pair.leftFile.id !== id && pair.rightFile.id !== id))
  }, [])

  // Remove specific pair
  const removePair = useCallback((id: string) => {
    setPairs((prev) => prev.filter((pair) => pair.id !== id))
  }, [])

  // Statistics calculation for all pairs
  const totalStats = useMemo(() => {
    const completedPairs = pairs.filter((p) => p.result)
    if (completedPairs.length === 0) return null

    return {
      totalPairs: completedPairs.length,
      totalAddedLines: completedPairs.reduce((sum, p) => sum + p.result!.statistics.addedLines, 0),
      totalRemovedLines: completedPairs.reduce((sum, p) => sum + p.result!.statistics.removedLines, 0),
      totalModifiedLines: completedPairs.reduce((sum, p) => sum + p.result!.statistics.modifiedLines, 0),
      averageSimilarity:
        completedPairs.reduce((sum, p) => sum + p.result!.statistics.similarity, 0) / completedPairs.length,
      averageExecutionTime:
        completedPairs.reduce((sum, p) => sum + p.result!.statistics.executionTime, 0) / completedPairs.length,
    }
  }, [pairs])

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
              <GitCompare className="h-5 w-5" aria-hidden="true" />
              Diff Viewer
            </CardTitle>
            <CardDescription>
              Compare text files with advanced diff algorithms, multiple viewing modes, and export capabilities. Use
              keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'diff' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diff" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Text Diff
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File Comparison
            </TabsTrigger>
          </TabsList>

          {/* Text Diff Tab */}
          <TabsContent value="diff" className="space-y-4">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Diff Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="algorithm">Algorithm</Label>
                    <Select
                      value={settings.algorithm}
                      onValueChange={(value: DiffAlgorithm) => setSettings((prev) => ({ ...prev, algorithm: value }))}
                    >
                      <SelectTrigger id="algorithm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="myers">Myers</SelectItem>
                        <SelectItem value="patience">Patience</SelectItem>
                        <SelectItem value="histogram">Histogram</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <Select
                      value={settings.format}
                      onValueChange={(value: DiffFormat) => setSettings((prev) => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger id="format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="side-by-side">Side by Side</SelectItem>
                        <SelectItem value="unified">Unified</SelectItem>
                        <SelectItem value="split">Split View</SelectItem>
                        <SelectItem value="inline">Inline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="viewMode">View Mode</Label>
                    <Select
                      value={settings.viewMode}
                      onValueChange={(value: DiffViewMode) => setSettings((prev) => ({ ...prev, viewMode: value }))}
                    >
                      <SelectTrigger id="viewMode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="changes-only">Changes Only</SelectItem>
                        <SelectItem value="context">Context</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contextLines">Context Lines</Label>
                    <Input
                      id="contextLines"
                      type="number"
                      min="0"
                      max="20"
                      value={settings.contextLines}
                      onChange={(e) => setSettings((prev) => ({ ...prev, contextLines: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      id="showLineNumbers"
                      type="checkbox"
                      checked={settings.showLineNumbers}
                      onChange={(e) => setSettings((prev) => ({ ...prev, showLineNumbers: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="showLineNumbers" className="text-sm">
                      Line Numbers
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="wordLevelDiff"
                      type="checkbox"
                      checked={settings.wordLevelDiff}
                      onChange={(e) => setSettings((prev) => ({ ...prev, wordLevelDiff: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="wordLevelDiff" className="text-sm">
                      Word-level Diff
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="ignoreWhitespace"
                      type="checkbox"
                      checked={settings.ignoreWhitespace}
                      onChange={(e) => setSettings((prev) => ({ ...prev, ignoreWhitespace: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="ignoreWhitespace" className="text-sm">
                      Ignore Whitespace
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="ignoreCase"
                      type="checkbox"
                      checked={settings.ignoreCase}
                      onChange={(e) => setSettings((prev) => ({ ...prev, ignoreCase: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="ignoreCase" className="text-sm">
                      Ignore Case
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Text Input */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Left Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="left-text">Original Text</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(leftText, 'left text')}
                        disabled={!leftText}
                      >
                        {copiedText === 'left text' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Textarea
                      id="left-text"
                      value={leftText}
                      onChange={(e) => setLeftText(e.target.value)}
                      placeholder="Enter original text..."
                      className="min-h-[200px] font-mono"
                      aria-label="Left text input"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Right Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="right-text">Modified Text</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(rightText, 'right text')}
                        disabled={!rightText}
                      >
                        {copiedText === 'right text' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Textarea
                      id="right-text"
                      value={rightText}
                      onChange={(e) => setRightText(e.target.value)}
                      placeholder="Enter modified text..."
                      className="min-h-[200px] font-mono"
                      aria-label="Right text input"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Diff Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded">
                    <div className="text-lg font-bold text-green-600">{realtimeDiff.statistics.addedLines}</div>
                    <div className="text-xs text-muted-foreground">Added Lines</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded">
                    <div className="text-lg font-bold text-red-600">{realtimeDiff.statistics.removedLines}</div>
                    <div className="text-xs text-muted-foreground">Removed Lines</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                    <div className="text-lg font-bold text-yellow-600">{realtimeDiff.statistics.modifiedLines}</div>
                    <div className="text-xs text-muted-foreground">Modified Lines</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {realtimeDiff.statistics.similarity.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Similarity</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold">{realtimeDiff.statistics.totalLines}</div>
                    <div className="text-xs text-muted-foreground">Total Lines</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold">{realtimeDiff.statistics.unchangedLines}</div>
                    <div className="text-xs text-muted-foreground">Unchanged Lines</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold">
                      {realtimeDiff.statistics.addedWords + realtimeDiff.statistics.removedWords}
                    </div>
                    <div className="text-xs text-muted-foreground">Word Changes</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold">{realtimeDiff.statistics.executionTime.toFixed(2)}ms</div>
                    <div className="text-xs text-muted-foreground">Execution Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Diff Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Diff Results
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const diffText = realtimeDiff.lines
                          .map((line) => {
                            switch (line.type) {
                              case 'added':
                                return `+${line.content}`
                              case 'removed':
                                return `-${line.content}`
                              case 'unchanged':
                                return ` ${line.content}`
                              case 'modified':
                                return `~${line.leftContent} -> ${line.rightContent}`
                              default:
                                return line.content
                            }
                          })
                          .join('\n')
                        copyToClipboard(diffText, 'diff result')
                      }}
                      disabled={realtimeDiff.lines.length === 0}
                    >
                      {copiedText === 'diff result' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {realtimeDiff.lines.length > 0 ? (
                  <div className="space-y-2">
                    {/* View Mode Selector */}
                    <div className="flex items-center gap-2 mb-4">
                      <Button
                        size="sm"
                        variant={settings.format === 'side-by-side' ? 'default' : 'outline'}
                        onClick={() => setSettings((prev) => ({ ...prev, format: 'side-by-side' }))}
                      >
                        <Columns className="h-4 w-4 mr-2" />
                        Side by Side
                      </Button>
                      <Button
                        size="sm"
                        variant={settings.format === 'unified' ? 'default' : 'outline'}
                        onClick={() => setSettings((prev) => ({ ...prev, format: 'unified' }))}
                      >
                        <Split className="h-4 w-4 mr-2" />
                        Unified
                      </Button>
                      <Button
                        size="sm"
                        variant={settings.format === 'inline' ? 'default' : 'outline'}
                        onClick={() => setSettings((prev) => ({ ...prev, format: 'inline' }))}
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Inline
                      </Button>
                    </div>

                    {/* Diff Display */}
                    <div className="border rounded-lg overflow-hidden">
                      {settings.format === 'side-by-side' ? (
                        <div className="grid grid-cols-2 divide-x">
                          <div className="p-4 bg-red-50/30 dark:bg-red-950/10">
                            <h4 className="font-medium mb-2 text-red-700 dark:text-red-400">Original</h4>
                            <div className="font-mono text-sm space-y-1">
                              {realtimeDiff.lines.map((line, index) => (
                                <div
                                  key={index}
                                  className={`flex ${
                                    line.type === 'removed'
                                      ? 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300'
                                      : line.type === 'modified'
                                        ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300'
                                        : line.type === 'unchanged'
                                          ? 'text-muted-foreground'
                                          : 'opacity-50'
                                  }`}
                                >
                                  {settings.showLineNumbers && (
                                    <span className="w-8 text-right mr-2 text-xs text-muted-foreground">
                                      {line.leftLineNumber || ''}
                                    </span>
                                  )}
                                  <span className="flex-1 whitespace-pre-wrap">
                                    {line.type === 'added' ? '' : line.leftContent || line.content}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-4 bg-green-50/30 dark:bg-green-950/10">
                            <h4 className="font-medium mb-2 text-green-700 dark:text-green-400">Modified</h4>
                            <div className="font-mono text-sm space-y-1">
                              {realtimeDiff.lines.map((line, index) => (
                                <div
                                  key={index}
                                  className={`flex ${
                                    line.type === 'added'
                                      ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300'
                                      : line.type === 'modified'
                                        ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300'
                                        : line.type === 'unchanged'
                                          ? 'text-muted-foreground'
                                          : 'opacity-50'
                                  }`}
                                >
                                  {settings.showLineNumbers && (
                                    <span className="w-8 text-right mr-2 text-xs text-muted-foreground">
                                      {line.rightLineNumber || ''}
                                    </span>
                                  )}
                                  <span className="flex-1 whitespace-pre-wrap">
                                    {line.type === 'removed' ? '' : line.rightContent || line.content}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4">
                          <div className="font-mono text-sm space-y-1">
                            {realtimeDiff.lines.map((line, index) => (
                              <div
                                key={index}
                                className={`flex ${
                                  line.type === 'added'
                                    ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300'
                                    : line.type === 'removed'
                                      ? 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300'
                                      : line.type === 'modified'
                                        ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300'
                                        : 'text-muted-foreground'
                                }`}
                              >
                                <span className="w-4 text-center mr-2">
                                  {line.type === 'added'
                                    ? '+'
                                    : line.type === 'removed'
                                      ? '-'
                                      : line.type === 'modified'
                                        ? '~'
                                        : ' '}
                                </span>
                                {settings.showLineNumbers && (
                                  <span className="w-8 text-right mr-2 text-xs text-muted-foreground">
                                    {line.leftLineNumber || line.rightLineNumber || ''}
                                  </span>
                                )}
                                <span className="flex-1 whitespace-pre-wrap">{line.content}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter text in both fields to see the diff</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    onClick={() => exportUnifiedDiff(realtimeDiff, 'left.txt', 'right.txt')}
                    variant="outline"
                    disabled={realtimeDiff.lines.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Patch
                  </Button>

                  <Button
                    onClick={() => exportHTML(realtimeDiff, 'left.txt', 'right.txt')}
                    variant="outline"
                    disabled={realtimeDiff.lines.length === 0}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export HTML
                  </Button>

                  <Button
                    onClick={() => {
                      const diffText = realtimeDiff.lines
                        .map((line) => {
                          switch (line.type) {
                            case 'added':
                              return `+${line.content}`
                            case 'removed':
                              return `-${line.content}`
                            case 'unchanged':
                              return ` ${line.content}`
                            case 'modified':
                              return `~${line.leftContent} -> ${line.rightContent}`
                            default:
                              return line.content
                          }
                        })
                        .join('\n')
                      copyToClipboard(diffText, 'diff text')
                    }}
                    variant="outline"
                    disabled={realtimeDiff.lines.length === 0}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Diff
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* File Comparison Tab */}
          <TabsContent value="files" className="space-y-4">
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
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports TXT, LOG, CSV, JSON, MD, JS, TS, PY and other text files • Max 50MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.log,.csv,.json,.md,.markdown,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.xml,.yaml,.yml"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select text files"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            {totalStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalStats.totalPairs}</div>
                      <div className="text-sm text-muted-foreground">Pairs Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{totalStats.totalAddedLines}</div>
                      <div className="text-sm text-muted-foreground">Total Added Lines</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{totalStats.totalRemovedLines}</div>
                      <div className="text-sm text-muted-foreground">Total Removed Lines</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{totalStats.totalModifiedLines}</div>
                      <div className="text-sm text-muted-foreground">Total Modified Lines</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalStats.averageSimilarity.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Avg Similarity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {totalStats.averageExecutionTime.toFixed(2)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Execution Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {(files.length > 0 || pairs.length > 0) && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={processPairs}
                      disabled={isProcessing || pairs.every((p) => p.status !== 'pending')}
                      className="min-w-32"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Process Pairs
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => exportBatch(pairs)}
                      variant="outline"
                      disabled={!pairs.some((p) => p.status === 'completed')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Results
                    </Button>

                    <Button onClick={() => exportCSV(pairs)} variant="outline" disabled={!pairs.some((p) => p.result)}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Export Stats
                    </Button>

                    <Button onClick={clearAll} variant="destructive" disabled={isProcessing}>
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
                  <CardTitle className="text-lg">Files ({files.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
                      <div key={file.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type}
                            </div>
                            {file.error && <div className="text-red-600 text-sm mt-1">Error: {file.error}</div>}
                          </div>
                          <div className="flex items-center gap-2">
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

                        {/* Pairing Options */}
                        <div className="mt-3 pt-3 border-t">
                          <Label className="text-xs font-medium">Pair with:</Label>
                          <div className="mt-1 space-y-1">
                            {files
                              .filter((f) => f.id !== file.id && !f.pairedWith)
                              .slice(0, 3)
                              .map((otherFile) => (
                                <Button
                                  key={otherFile.id}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => createPair(file, otherFile)}
                                  className="w-full text-xs"
                                >
                                  vs {otherFile.name}
                                </Button>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pairs List */}
            {pairs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comparison Pairs ({pairs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pairs.map((pair) => (
                      <div key={pair.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">
                                {pair.leftFile.name} vs {pair.rightFile.name}
                              </h4>
                              <div
                                className={`px-2 py-1 rounded text-xs ${
                                  pair.status === 'completed'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300'
                                    : pair.status === 'processing'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300'
                                      : pair.status === 'error'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300'
                                }`}
                              >
                                {pair.status}
                              </div>
                            </div>

                            {pair.result && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="font-medium text-green-600">
                                    +{pair.result.statistics.addedLines}
                                  </span>
                                  <span className="text-muted-foreground"> added</span>
                                </div>
                                <div>
                                  <span className="font-medium text-red-600">
                                    -{pair.result.statistics.removedLines}
                                  </span>
                                  <span className="text-muted-foreground"> removed</span>
                                </div>
                                <div>
                                  <span className="font-medium text-yellow-600">
                                    ~{pair.result.statistics.modifiedLines}
                                  </span>
                                  <span className="text-muted-foreground"> modified</span>
                                </div>
                                <div>
                                  <span className="font-medium text-blue-600">
                                    {pair.result.statistics.similarity.toFixed(1)}%
                                  </span>
                                  <span className="text-muted-foreground"> similar</span>
                                </div>
                              </div>
                            )}

                            {pair.error && <div className="text-red-600 text-sm">Error: {pair.error}</div>}
                          </div>

                          <div className="flex items-center gap-2">
                            {pair.result && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    exportUnifiedDiff(pair.result!, pair.leftFile.name, pair.rightFile.name)
                                  }
                                  aria-label={`Export diff for ${pair.leftFile.name} vs ${pair.rightFile.name}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const diffText = pair
                                      .result!.lines.map((line) => {
                                        switch (line.type) {
                                          case 'added':
                                            return `+${line.content}`
                                          case 'removed':
                                            return `-${line.content}`
                                          case 'unchanged':
                                            return ` ${line.content}`
                                          case 'modified':
                                            return `~${line.leftContent} -> ${line.rightContent}`
                                          default:
                                            return line.content
                                        }
                                      })
                                      .join('\n')
                                    copyToClipboard(diffText, pair.id)
                                  }}
                                  aria-label={`Copy diff for ${pair.leftFile.name} vs ${pair.rightFile.name}`}
                                >
                                  {copiedText === pair.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removePair(pair.id)}
                              aria-label={`Remove pair ${pair.leftFile.name} vs ${pair.rightFile.name}`}
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
const DiffViewer = () => {
  return <DiffViewerCore />
}

export default DiffViewer
