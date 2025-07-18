import React, { useCallback, useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
// 移除 import { ErrorBoundary } from '@/components/error-boundary'
import { Upload, Download, FileText, Loader2, FileImage, Trash2, BarChart3, BookOpen, Target } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { TextFile, TextAnalysis, AnalysisSettings, AnalysisStats } from '@/types/word-count'
// Types
// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const validateTextFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = [
    'text/plain',
    'text/markdown',
    'text/rtf',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'application/json',
    'text/html',
    'text/xml',
  ]

  // Check file extension as fallback
  const extension = file.name.toLowerCase().split('.').pop()
  const allowedExtensions = ['txt', 'md', 'rtf', 'csv', 'doc', 'docx', 'pdf', 'json', 'html', 'xml']

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension || '')) {
    return {
      isValid: false,
      error: 'Unsupported file format. Please use TXT, MD, RTF, CSV, DOC, DOCX, PDF, JSON, HTML, or XML.',
    }
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large. Maximum size is 50MB.' }
  }

  return { isValid: true }
}

// Common words to exclude from keyword analysis
const commonWords = {
  en: new Set([
    'the',
    'be',
    'to',
    'of',
    'and',
    'a',
    'in',
    'that',
    'have',
    'i',
    'it',
    'for',
    'not',
    'on',
    'with',
    'he',
    'as',
    'you',
    'do',
    'at',
    'this',
    'but',
    'his',
    'by',
    'from',
    'they',
    'we',
    'say',
    'her',
    'she',
    'or',
    'an',
    'will',
    'my',
    'one',
    'all',
    'would',
    'there',
    'their',
  ]),
  zh: new Set([
    '的',
    '了',
    '在',
    '是',
    '我',
    '有',
    '和',
    '就',
    '不',
    '人',
    '都',
    '一',
    '一个',
    '上',
    '也',
    '很',
    '到',
    '说',
    '要',
    '去',
    '你',
    '会',
    '着',
    '没有',
    '看',
    '好',
    '自己',
    '这',
  ]),
  auto: new Set(),
}

// Text analysis functions
const analyzeText = (text: string, settings: AnalysisSettings): TextAnalysis => {
  // Basic counts
  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length

  // Word count
  const words =
    text.trim() === ''
      ? 0
      : text
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length

  // Sentence count (basic implementation)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length

  // Paragraph count
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length

  // Line count
  const lines = text.split('\n').length

  // Reading time (average reading speed)
  const readingTime = words / settings.wordsPerMinute

  // Average words per sentence
  const averageWordsPerSentence = sentences > 0 ? words / sentences : 0

  // Average characters per word
  const averageCharactersPerWord = words > 0 ? charactersNoSpaces / words : 0

  // Simple readability score (Flesch Reading Ease approximation)
  const averageSentenceLength = averageWordsPerSentence
  const averageSyllablesPerWord = averageCharactersPerWord / 2 // rough approximation
  const readabilityScore = Math.max(
    0,
    Math.min(100, 206.835 - 1.015 * averageSentenceLength - 84.6 * averageSyllablesPerWord)
  )

  // Keyword frequency analysis
  const wordList = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= settings.minWordLength)

  const excludeWords = settings.excludeCommonWords
    ? settings.language === 'auto'
      ? commonWords.en
      : commonWords[settings.language]
    : new Set()

  const keywordFrequency: Record<string, number> = {}
  wordList.forEach((word) => {
    if (!excludeWords.has(word)) {
      keywordFrequency[word] = (keywordFrequency[word] || 0) + 1
    }
  })

  // Most common words
  const mostCommonWords = Object.entries(keywordFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  // Longest and shortest words
  const validWords = wordList.filter((word) => word.length > 0)
  const longestWord = validWords.reduce((longest, word) => (word.length > longest.length ? word : longest), '')
  const shortestWord = validWords.reduce(
    (shortest, word) => (word.length < shortest.length ? word : shortest),
    validWords[0] || ''
  )

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    readingTime,
    averageWordsPerSentence,
    averageCharactersPerWord,
    readabilityScore,
    keywordFrequency,
    mostCommonWords,
    longestWord,
    shortestWord,
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
            // Remove markdown syntax for word counting
            const cleanText = result
              .replace(/#{1,6}\s+/g, '') // Remove headers
              .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
              .replace(/\*(.*?)\*/g, '$1') // Remove italic
              .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
              .replace(/`(.*?)`/g, '$1') // Remove inline code
              .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            resolve(cleanText)
          } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
            // Remove HTML tags
            const cleanText = result.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
            resolve(cleanText)
          } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
            try {
              const jsonData = JSON.parse(result)
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

// Real-time text analysis hook
const useTextAnalysis = (text: string, settings: AnalysisSettings) => {
  return useMemo(() => {
    if (!text.trim()) {
      return {
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        sentences: 0,
        paragraphs: 0,
        lines: 0,
        readingTime: 0,
        averageWordsPerSentence: 0,
        averageCharactersPerWord: 0,
        readabilityScore: 0,
        keywordFrequency: {},
        mostCommonWords: [],
        longestWord: '',
        shortestWord: '',
      }
    }

    return analyzeText(text, settings)
  }, [text, settings])
}

// Export functionality
const useTextExport = () => {
  const exportAnalysis = useCallback((analysis: TextAnalysis, filename: string) => {
    const data = {
      filename,
      timestamp: new Date().toISOString(),
      analysis: {
        basicCounts: {
          characters: analysis.characters,
          charactersNoSpaces: analysis.charactersNoSpaces,
          words: analysis.words,
          sentences: analysis.sentences,
          paragraphs: analysis.paragraphs,
          lines: analysis.lines,
        },
        readability: {
          readingTime: `${analysis.readingTime.toFixed(1)} minutes`,
          averageWordsPerSentence: analysis.averageWordsPerSentence.toFixed(1),
          averageCharactersPerWord: analysis.averageCharactersPerWord.toFixed(1),
          readabilityScore: analysis.readabilityScore.toFixed(1),
        },
        keywords: {
          mostCommonWords: analysis.mostCommonWords,
          longestWord: analysis.longestWord,
          shortestWord: analysis.shortestWord,
        },
      },
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename.replace(/\.[^/.]+$/, '')}_analysis.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportCSV = useCallback((files: TextFile[]) => {
    const headers = [
      'Filename',
      'Characters',
      'Characters (No Spaces)',
      'Words',
      'Sentences',
      'Paragraphs',
      'Lines',
      'Reading Time (min)',
      'Avg Words/Sentence',
      'Avg Chars/Word',
      'Readability Score',
      'Longest Word',
      'Shortest Word',
    ]

    const rows = files
      .filter((file) => file.analysis)
      .map((file) => {
        const a = file.analysis!
        return [
          file.name,
          a.characters,
          a.charactersNoSpaces,
          a.words,
          a.sentences,
          a.paragraphs,
          a.lines,
          a.readingTime.toFixed(1),
          a.averageWordsPerSentence.toFixed(1),
          a.averageCharactersPerWord.toFixed(1),
          a.readabilityScore.toFixed(1),
          a.longestWord,
          a.shortestWord,
        ]
      })

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'text_analysis_report.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportAnalysis, exportCSV }
}

/**
 * Enhanced Word Count Tool
 * Features: Batch processing, multiple file formats, comprehensive text analysis, real-time processing
 */
const WordCountCore = () => {
  const [files, setFiles] = useState<TextFile[]>([])
  const [manualText, setManualText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<AnalysisSettings>({
    includeSpaces: true,
    countPunctuation: true,
    wordsPerMinute: 200,
    minWordLength: 3,
    excludeCommonWords: true,
    language: 'auto',
  })
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'manual' | 'files'>('manual')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { processTextFile } = useTextProcessing()
  const { exportAnalysis, exportCSV } = useTextExport()

  // Real-time analysis for manual text input
  const manualAnalysis = useTextAnalysis(manualText, settings)

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

      const id = nanoid()
      newFiles.push({
        id,
        file,
        content: '',
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        status: 'pending',
      })
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles])
      const message = `Added ${newFiles.length} file${newFiles.length > 1 ? 's' : ''} for analysis`
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

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files
      if (fileList) {
        handleFiles(fileList)
        // 关键：重置 input 的值，允许重复上传同一文件
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [handleFiles]
  )

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const fileList = e.dataTransfer.files
      if (fileList) {
        handleFiles(fileList)
      }
    },
    [handleFiles]
  )

  // Process files
  const processFiles = useCallback(async () => {
    const pendingFiles = files.filter((file) => file.status === 'pending')
    if (pendingFiles.length === 0) {
      toast.error('No files to process')
      return
    }

    setIsProcessing(true)

    for (const file of pendingFiles) {
      try {
        // Update status to processing
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' } : f)))

        const content = await processTextFile(file.file)
        const analysis = analyzeText(content, settings)

        // Update with analysis result
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: 'completed',
                  content,
                  analysis,
                }
              : f
          )
        )
      } catch (error) {
        console.error('Processing failed:', error)
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Processing failed',
                }
              : f
          )
        )
      }
    }

    setIsProcessing(false)
    const completedCount = files.filter((f) => f.status === 'completed').length
    const message = `Analysis completed! ${completedCount} file${completedCount > 1 ? 's' : ''} processed successfully.`
    toast.success(message)

    // Announce completion to screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 2000)
  }, [files, settings, processTextFile])

  // Utility functions
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
    toast.success('All files cleared')
  }, [])

  // Statistics calculation
  const stats: AnalysisStats = useMemo(() => {
    const completedFiles = files.filter((f) => f.status === 'completed' && f.analysis)

    return {
      totalFiles: completedFiles.length,
      totalCharacters: completedFiles.reduce((sum, f) => sum + (f.analysis?.characters || 0), 0),
      totalWords: completedFiles.reduce((sum, f) => sum + (f.analysis?.words || 0), 0),
      totalSentences: completedFiles.reduce((sum, f) => sum + (f.analysis?.sentences || 0), 0),
      totalParagraphs: completedFiles.reduce((sum, f) => sum + (f.analysis?.paragraphs || 0), 0),
      averageReadingTime:
        completedFiles.length > 0
          ? completedFiles.reduce((sum, f) => sum + (f.analysis?.readingTime || 0), 0) / completedFiles.length
          : 0,
      averageReadabilityScore:
        completedFiles.length > 0
          ? completedFiles.reduce((sum, f) => sum + (f.analysis?.readabilityScore || 0), 0) / completedFiles.length
          : 0,
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

      <div id="main-content" className="flex flex-col gap-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" aria-hidden="true" />
              Text Analysis Tool
            </CardTitle>
            <CardDescription>
              Analyze text with comprehensive metrics including word count, readability scores, and keyword frequency.
              Supports multiple file formats and real-time analysis. Use keyboard navigation: Tab to move between
              controls, Enter or Space to activate buttons.
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
              Analysis Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wordsPerMinute">Reading Speed (WPM)</Label>
                <Input
                  id="wordsPerMinute"
                  type="number"
                  min="100"
                  max="500"
                  value={settings.wordsPerMinute}
                  onChange={(e) => setSettings((prev) => ({ ...prev, wordsPerMinute: Number(e.target.value) }))}
                  aria-label={`Reading speed: ${settings.wordsPerMinute} words per minute`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minWordLength">Min Word Length</Label>
                <Input
                  id="minWordLength"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.minWordLength}
                  onChange={(e) => setSettings((prev) => ({ ...prev, minWordLength: Number(e.target.value) }))}
                  aria-label={`Minimum word length: ${settings.minWordLength} characters`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value: AnalysisSettings['language']) =>
                    setSettings((prev) => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger id="language" aria-label="Select language for analysis">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto Detect</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  id="excludeCommonWords"
                  type="checkbox"
                  checked={settings.excludeCommonWords}
                  onChange={(e) => setSettings((prev) => ({ ...prev, excludeCommonWords: e.target.checked }))}
                  className="rounded border-input"
                />
                <Label htmlFor="excludeCommonWords" className="text-sm">
                  Exclude common words from analysis
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="countPunctuation"
                  type="checkbox"
                  checked={settings.countPunctuation}
                  onChange={(e) => setSettings((prev) => ({ ...prev, countPunctuation: e.target.checked }))}
                  className="rounded border-input"
                />
                <Label htmlFor="countPunctuation" className="text-sm">
                  Include punctuation in character count
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
                <Label htmlFor="manualText">Enter your text for analysis</Label>
                <Textarea
                  id="manualText"
                  placeholder="Type or paste your text here..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="min-h-[200px] resize-y"
                  aria-label="Text input for analysis"
                />
              </div>

              {/* Real-time Analysis Display */}
              {manualText.trim() && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{manualAnalysis.words}</div>
                    <div className="text-sm text-muted-foreground">Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{manualAnalysis.characters}</div>
                    <div className="text-sm text-muted-foreground">Characters</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{manualAnalysis.sentences}</div>
                    <div className="text-sm text-muted-foreground">Sentences</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{manualAnalysis.readingTime.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Min Read</div>
                  </div>
                </div>
              )}

              {/* Detailed Analysis */}
              {manualText.trim() && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Detailed Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Basic Counts</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Characters (with spaces):</span>
                            <span className="font-mono">{manualAnalysis.characters}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Characters (no spaces):</span>
                            <span className="font-mono">{manualAnalysis.charactersNoSpaces}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Words:</span>
                            <span className="font-mono">{manualAnalysis.words}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sentences:</span>
                            <span className="font-mono">{manualAnalysis.sentences}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Paragraphs:</span>
                            <span className="font-mono">{manualAnalysis.paragraphs}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lines:</span>
                            <span className="font-mono">{manualAnalysis.lines}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Readability Metrics</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Reading time:</span>
                            <span className="font-mono">{manualAnalysis.readingTime.toFixed(1)} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg words/sentence:</span>
                            <span className="font-mono">{manualAnalysis.averageWordsPerSentence.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg chars/word:</span>
                            <span className="font-mono">{manualAnalysis.averageCharactersPerWord.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Readability score:</span>
                            <span className="font-mono">{manualAnalysis.readabilityScore.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Longest word:</span>
                            <span className="font-mono">{manualAnalysis.longestWord}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shortest word:</span>
                            <span className="font-mono">{manualAnalysis.shortestWord}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Most Common Words */}
                    {manualAnalysis.mostCommonWords.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Most Common Words</h4>
                        <div className="flex flex-wrap gap-2">
                          {manualAnalysis.mostCommonWords.slice(0, 10).map(({ word, count }) => (
                            <span key={word} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs">
                              {word} ({count})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Export Button */}
                    <div className="flex justify-end">
                      <Button onClick={() => exportAnalysis(manualAnalysis, 'manual_text')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports TXT, MD, RTF, CSV, DOC, DOCX, PDF, JSON, HTML, XML • Max 50MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.md,.rtf,.csv,.doc,.docx,.pdf,.json,.html,.xml"
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
                      <div className="text-2xl font-bold text-blue-600">{stats.totalWords.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.totalCharacters.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Characters</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.averageReadingTime.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Avg Reading Time</div>
                    </div>
                  </div>

                  {stats.totalFiles > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-center">
                        <span className="text-blue-700 dark:text-blue-400 font-semibold">
                          Average readability score: {stats.averageReadabilityScore.toFixed(1)}
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
                      disabled={isProcessing || files.every((f) => f.status !== 'pending')}
                      className="min-w-32"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Analyze Files'
                      )}
                    </Button>

                    <Button
                      onClick={() => exportCSV(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.status === 'completed')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV Report
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

                              {file.status === 'completed' && file.analysis && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 p-2 bg-muted/30 rounded">
                                  <div className="text-center">
                                    <div className="font-bold text-blue-600">{file.analysis.words}</div>
                                    <div className="text-xs">Words</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold text-green-600">{file.analysis.characters}</div>
                                    <div className="text-xs">Characters</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold text-purple-600">{file.analysis.sentences}</div>
                                    <div className="text-xs">Sentences</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold text-orange-600">
                                      {file.analysis.readingTime.toFixed(1)}
                                    </div>
                                    <div className="text-xs">Min Read</div>
                                  </div>
                                </div>
                              )}

                              {file.status === 'pending' && <div className="text-blue-600">Ready for analysis</div>}
                              {file.status === 'processing' && (
                                <div className="text-blue-600 flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Processing...
                                </div>
                              )}
                              {file.error && <div className="text-red-600">Error: {file.error}</div>}
                            </div>
                          </div>

                          <div className="flex-shrink-0 flex items-center gap-2">
                            {file.status === 'completed' && file.analysis && (
                              <Button
                                size="sm"
                                onClick={() => exportAnalysis(file.analysis!, file.name)}
                                aria-label={`Export analysis for ${file.name}`}
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
const WordCount = () => {
  return <WordCountCore />
}

export default WordCount
