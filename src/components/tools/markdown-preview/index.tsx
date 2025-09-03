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
  Loader2,
  RefreshCw,
  Eye,
  Code,
  Split,
  Copy,
  Check,
  BarChart3,
  Upload,
  FileImage,
  Trash2,
  Settings,
  Target,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type { MarkdownFile, MarkdownStatistics, PreviewSettings, ExportOptions } from '@/types/markdown-preview'
import { formatFileSize } from '@/lib/utils'
// Types

// Utility functions

const validateMarkdownFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = ['.md', '.markdown', '.txt', '.text']

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 50MB' }
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: 'Only Markdown (.md, .markdown) and text files are supported' }
  }

  return { isValid: true }
}

// Enhanced Markdown parser with comprehensive syntax support
const parseMarkdown = (markdown: string): string => {
  let html = markdown

  // Escape HTML entities first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Headers (must be processed before other formatting)
  html = html
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')

  // Code blocks (process before inline code)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
    const language = lang || 'text'
    return `<pre><code class="language-${language}">${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Bold and italic (process bold before italic to avoid conflicts)
  html = html
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')

  // Lists (unordered)
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

  // Lists (ordered)
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>')

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>')

  // Tables
  html = html.replace(/\|(.+)\|/g, (_match, content) => {
    const cells = content.split('|').map((cell: string) => cell.trim())
    return '<tr>' + cells.map((cell: string) => `<td>${cell}</td>`).join('') + '</tr>'
  })
  html = html.replace(/(<tr>.*<\/tr>)/s, '<table class="table-auto border-collapse border border-gray-300">$1</table>')

  // Line breaks and paragraphs
  html = html
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p>(<ul>.*<\/ul>)<\/p>/g, '$1')
    .replace(/<p>(<ol>.*<\/ol>)<\/p>/g, '$1')
    .replace(/<p>(<blockquote>.*<\/blockquote>)<\/p>/g, '$1')
    .replace(/<p>(<hr>)<\/p>/g, '$1')
    .replace(/<p>(<table.*<\/table>)<\/p>/g, '$1')
    .replace(/<p>(<pre>.*<\/pre>)<\/p>/g, '$1')

  return html
}

// Calculate markdown statistics
const calculateStatistics = (markdown: string): MarkdownStatistics => {
  const lines = markdown.split('\n')
  const words = markdown.split(/\s+/).filter((word) => word.length > 0)
  const paragraphs = markdown.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

  const headings = markdown.match(/^#{1,6}\s+.+$/gm) || []
  const links = markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []
  const images = markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []
  const codeBlocks = markdown.match(/```[\s\S]*?```/g) || []
  const listItems = markdown.match(/^[\*\-\+]\s+.+$/gm) || []
  const tables = markdown.match(/\|(.+)\|/g) || []

  // Estimate reading time (average 200 words per minute)
  const readingTime = Math.ceil(words.length / 200)

  return {
    wordCount: words.length,
    characterCount: markdown.length,
    lineCount: lines.length,
    paragraphCount: paragraphs.length,
    headingCount: headings.length,
    linkCount: links.length,
    imageCount: images.length,
    codeBlockCount: codeBlocks.length,
    listItemCount: listItems.length,
    tableCount: tables.length,
    readingTime,
  }
}

// Custom hooks
const useMarkdownProcessing = () => {
  const processMarkdown = useCallback((content: string): { html: string; statistics: MarkdownStatistics } => {
    try {
      const html = parseMarkdown(content)
      const statistics = calculateStatistics(content)
      return { html, statistics }
    } catch (error) {
      console.error('Markdown processing error:', error)
      throw new Error('Failed to process markdown content')
    }
  }, [])

  const processFile = useCallback(
    async (file: File): Promise<MarkdownFile> => {
      const validation = validateMarkdownFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            const { html, statistics } = processMarkdown(content)

            const markdownFile: MarkdownFile = {
              id: nanoid(),
              name: file.name,
              content,
              size: file.size,
              type: file.type || 'text/markdown',
              status: 'completed',
              processedAt: new Date(),
              htmlContent: html,
              statistics,
            }

            resolve(markdownFile)
          } catch (error) {
            reject(new Error('Failed to process markdown file'))
          }
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
      })
    },
    [processMarkdown]
  )

  const processBatch = useCallback(
    async (files: File[]): Promise<MarkdownFile[]> => {
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
            type: files[index].type || 'text/markdown',
            status: 'error' as const,
            error: result.reason.message || 'Processing failed',
          }
        }
      })
    },
    [processFile]
  )

  return { processMarkdown, processFile, processBatch }
}

// Real-time markdown processing hook
const useRealTimeMarkdown = (content: string, settings: PreviewSettings) => {
  return useMemo(() => {
    try {
      if (!content.trim()) {
        return {
          html: '<p class="text-muted-foreground">Start typing to see the preview...</p>',
          statistics: {
            wordCount: 0,
            characterCount: 0,
            lineCount: 0,
            paragraphCount: 0,
            headingCount: 0,
            linkCount: 0,
            imageCount: 0,
            codeBlockCount: 0,
            listItemCount: 0,
            tableCount: 0,
            readingTime: 0,
          },
        }
      }

      const html = parseMarkdown(content)
      const statistics = calculateStatistics(content)

      return { html, statistics }
    } catch (error) {
      console.error('Real-time processing error:', error)
      return {
        html: '<p class="text-red-600">Error processing markdown</p>',
        statistics: {
          wordCount: 0,
          characterCount: 0,
          lineCount: 0,
          paragraphCount: 0,
          headingCount: 0,
          linkCount: 0,
          imageCount: 0,
          codeBlockCount: 0,
          listItemCount: 0,
          tableCount: 0,
          readingTime: 0,
        },
      }
    }
  }, [content, settings])
}

// Export functionality
const useMarkdownExport = () => {
  const exportHTML = useCallback(
    (
      content: string,
      filename?: string,
      options: ExportOptions = { format: 'html', includeCSS: true, includeTableOfContents: false, pageBreaks: false }
    ) => {
      const html = parseMarkdown(content)

      let fullHTML = html
      if (options.includeCSS) {
        const css = `
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
          h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 10px; }
          h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 8px; }
          p { margin-bottom: 16px; }
          code { background-color: rgba(175, 184, 193, 0.2); padding: 2px 4px; border-radius: 3px; font-size: 85%; }
          pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
          blockquote { border-left: 4px solid #dfe2e5; padding-left: 16px; color: #6a737d; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #dfe2e5; padding: 8px 12px; text-align: left; }
          th { background-color: #f6f8fa; font-weight: 600; }
          ul, ol { padding-left: 30px; }
          li { margin-bottom: 4px; }
          a { color: #0366d6; text-decoration: none; }
          a:hover { text-decoration: underline; }
          img { max-width: 100%; height: auto; }
          hr { border: none; border-top: 1px solid #eaecef; margin: 24px 0; }
        </style>
      `
        fullHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Markdown Export</title>${css}</head><body>${html}</body></html>`
      }

      const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || 'markdown-export.html'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    []
  )

  const exportPlainText = useCallback((content: string, filename?: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || 'markdown-export.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback((files: MarkdownFile[]) => {
    const content = files.map((file, index) => `=== File ${index + 1}: ${file.name} ===\n${file.content}\n`).join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'markdown-batch-export.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportCSV = useCallback((files: MarkdownFile[]) => {
    const headers = [
      'Filename',
      'Word Count',
      'Character Count',
      'Line Count',
      'Paragraph Count',
      'Heading Count',
      'Link Count',
      'Image Count',
      'Reading Time (min)',
    ]

    const rows = files
      .filter((f) => f.statistics)
      .map((file) => [
        file.name,
        file.statistics!.wordCount,
        file.statistics!.characterCount,
        file.statistics!.lineCount,
        file.statistics!.paragraphCount,
        file.statistics!.headingCount,
        file.statistics!.linkCount,
        file.statistics!.imageCount,
        file.statistics!.readingTime,
      ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'markdown-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportHTML, exportPlainText, exportBatch, exportCSV }
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
          file.type === 'text/markdown' ||
          file.name.endsWith('.md') ||
          file.name.endsWith('.markdown') ||
          file.type === 'text/plain'
      )

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error('Please drop only Markdown or text files')
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
 * Enhanced Markdown Preview Tool
 * Features: Real-time preview, file upload, batch processing, export capabilities
 */
const MarkdownPreviewCore = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'files'>('editor')
  const [markdownContent, setMarkdownContent] = useState(
    '# Welcome to Markdown Preview\n\nStart typing your **Markdown** content here!\n\n## Features\n\n- Real-time preview\n- File upload support\n- Export to multiple formats\n- Comprehensive statistics\n\n```javascript\nconst hello = "world";\nconsole.log(hello);\n```\n\n> This is a blockquote example\n\n### Lists\n\n1. Ordered list item\n2. Another item\n\n* Unordered list\n* Another item\n\n[Link example](https://example.com)\n\n![Image example](https://via.placeholder.com/300x200)'
  )
  const [files, setFiles] = useState<MarkdownFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<PreviewSettings>({
    viewMode: 'split',
    theme: 'auto',
    fontSize: 'medium',
    lineNumbers: false,
    wordWrap: true,
    syntaxHighlighting: true,
    mathSupport: false,
    mermaidSupport: false,
    tableOfContents: false,
    autoSave: false,
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { processMarkdown, processBatch } = useMarkdownProcessing()
  const { exportHTML, exportPlainText, exportBatch, exportCSV } = useMarkdownExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Real-time markdown processing
  const { html: previewHTML, statistics: previewStats } = useRealTimeMarkdown(markdownContent, settings)

  // File drag and drop
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    useCallback(
      async (droppedFiles: File[]) => {
        setIsProcessing(true)
        try {
          const processedFiles = await processBatch(droppedFiles)
          setFiles((prev) => [...processedFiles, ...prev])
          toast.success(`Processed ${processedFiles.length} file(s)`)
        } catch (error) {
          toast.error('Failed to process files')
        } finally {
          setIsProcessing(false)
        }
      },
      [processBatch]
    )
  )

  // Process files
  const processFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsProcessing(true)
    try {
      const updatedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.status !== 'pending') return file

          try {
            const { html, statistics } = processMarkdown(file.content)
            return {
              ...file,
              status: 'completed' as const,
              htmlContent: html,
              statistics,
              processedAt: new Date(),
            }
          } catch (error) {
            return {
              ...file,
              status: 'error' as const,
              error: 'Processing failed',
            }
          }
        })
      )

      setFiles(updatedFiles)
      toast.success('Files processed successfully!')
    } catch (error) {
      toast.error('Failed to process files')
    } finally {
      setIsProcessing(false)
    }
  }, [files, processMarkdown])

  // Clear all files
  const clearAll = useCallback(() => {
    setFiles([])
    toast.success('All files cleared')
  }, [])

  // Remove specific file
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }, [])

  // Statistics calculation for all files
  const totalStats = useMemo(() => {
    const completedFiles = files.filter((f) => f.statistics)
    if (completedFiles.length === 0) return null

    return {
      totalFiles: completedFiles.length,
      totalWords: completedFiles.reduce((sum, f) => sum + f.statistics!.wordCount, 0),
      totalCharacters: completedFiles.reduce((sum, f) => sum + f.statistics!.characterCount, 0),
      totalReadingTime: completedFiles.reduce((sum, f) => sum + f.statistics!.readingTime, 0),
      averageWordsPerFile: Math.round(
        completedFiles.reduce((sum, f) => sum + f.statistics!.wordCount, 0) / completedFiles.length
      ),
      averageReadingTime:
        Math.round(
          (completedFiles.reduce((sum, f) => sum + f.statistics!.readingTime, 0) / completedFiles.length) * 10
        ) / 10,
    }
  }, [files])

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
              <FileText className="h-5 w-5" aria-hidden="true" />
              Markdown Preview
            </CardTitle>
            <CardDescription>
              Real-time Markdown editor and preview with file upload, batch processing, and export capabilities. Use
              keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'editor' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File Upload
            </TabsTrigger>
          </TabsList>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-4">
            {/* Settings Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Preview Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="viewMode">View Mode</Label>
                    <Select
                      value={settings.viewMode}
                      onValueChange={(value: 'split' | 'preview' | 'source') =>
                        setSettings((prev) => ({ ...prev, viewMode: value }))
                      }
                    >
                      <SelectTrigger id="viewMode" aria-label="Select view mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="split">
                          <div className="flex items-center gap-2">
                            <Split className="h-4 w-4" />
                            Split View
                          </div>
                        </SelectItem>
                        <SelectItem value="preview">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Preview Only
                          </div>
                        </SelectItem>
                        <SelectItem value="source">
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Source Only
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Select
                      value={settings.fontSize}
                      onValueChange={(value: 'small' | 'medium' | 'large') =>
                        setSettings((prev) => ({ ...prev, fontSize: value }))
                      }
                    >
                      <SelectTrigger id="fontSize" aria-label="Select font size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value: 'light' | 'dark' | 'auto') =>
                        setSettings((prev) => ({ ...prev, theme: value }))
                      }
                    >
                      <SelectTrigger id="theme" aria-label="Select theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Advanced Options</h4>
                    <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                      <Target className="h-4 w-4 mr-2" />
                      {showAdvanced ? 'Hide' : 'Show'} Advanced
                    </Button>
                  </div>

                  {showAdvanced && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <input
                          id="lineNumbers"
                          type="checkbox"
                          checked={settings.lineNumbers}
                          onChange={(e) => setSettings((prev) => ({ ...prev, lineNumbers: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="lineNumbers" className="text-sm">
                          Line numbers
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="wordWrap"
                          type="checkbox"
                          checked={settings.wordWrap}
                          onChange={(e) => setSettings((prev) => ({ ...prev, wordWrap: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="wordWrap" className="text-sm">
                          Word wrap
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="syntaxHighlighting"
                          type="checkbox"
                          checked={settings.syntaxHighlighting}
                          onChange={(e) => setSettings((prev) => ({ ...prev, syntaxHighlighting: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="syntaxHighlighting" className="text-sm">
                          Syntax highlighting
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="tableOfContents"
                          type="checkbox"
                          checked={settings.tableOfContents}
                          onChange={(e) => setSettings((prev) => ({ ...prev, tableOfContents: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="tableOfContents" className="text-sm">
                          Table of contents
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold text-blue-600">{previewStats.wordCount}</div>
                    <div className="text-xs text-muted-foreground">Words</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold text-green-600">{previewStats.characterCount}</div>
                    <div className="text-xs text-muted-foreground">Characters</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold text-purple-600">{previewStats.headingCount}</div>
                    <div className="text-xs text-muted-foreground">Headings</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold text-orange-600">{previewStats.readingTime}</div>
                    <div className="text-xs text-muted-foreground">Min Read</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editor and Preview */}
            <Card>
              <CardContent className="pt-6">
                <div className={`grid gap-4 ${settings.viewMode === 'split' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Source Editor */}
                  {(settings.viewMode === 'split' || settings.viewMode === 'source') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="markdown-editor" className="font-medium">
                          Markdown Source
                        </Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(markdownContent, 'markdown')}
                        >
                          {copiedText === 'markdown' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Textarea
                        id="markdown-editor"
                        value={markdownContent}
                        onChange={(e) => setMarkdownContent(e.target.value)}
                        placeholder="Type your Markdown here..."
                        className={`min-h-[400px] font-mono resize-none ${
                          settings.fontSize === 'small'
                            ? 'text-sm'
                            : settings.fontSize === 'large'
                              ? 'text-lg'
                              : 'text-base'
                        } ${settings.wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}
                        style={{
                          lineHeight: settings.lineNumbers ? '1.5' : '1.6',
                          tabSize: 2,
                        }}
                        aria-label="Markdown editor"
                      />
                    </div>
                  )}

                  {/* Preview */}
                  {(settings.viewMode === 'split' || settings.viewMode === 'preview') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Preview</Label>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(previewHTML, 'html')}>
                            {copiedText === 'html' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => exportHTML(markdownContent)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div
                        className={`min-h-[400px] p-4 border rounded-lg bg-background overflow-auto max-w-none ${
                          settings.fontSize === 'small'
                            ? 'text-sm'
                            : settings.fontSize === 'large'
                              ? 'text-lg'
                              : 'text-base'
                        }`}
                        dangerouslySetInnerHTML={{ __html: previewHTML }}
                        aria-label="Markdown preview"
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center mt-6 pt-4 border-t">
                  <Button onClick={() => exportHTML(markdownContent)} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export HTML
                  </Button>

                  <Button onClick={() => exportPlainText(markdownContent)} variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Export Text
                  </Button>

                  <Button onClick={() => copyToClipboard(markdownContent, 'markdown source')} variant="outline">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Source
                  </Button>

                  <Button onClick={() => copyToClipboard(previewHTML, 'HTML')} variant="outline">
                    <Code className="mr-2 h-4 w-4" />
                    Copy HTML
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* File Upload Tab */}
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
                  aria-label="Drag and drop markdown files here or click to select files"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Markdown Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your Markdown files here, or click to select files
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">Supports MD, Markdown, TXT files • Max 50MB per file</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".md,.markdown,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select markdown files"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            {totalStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalStats.totalFiles}</div>
                      <div className="text-sm text-muted-foreground">Files Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalStats.totalWords.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {totalStats.totalCharacters.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Characters</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{totalStats.totalReadingTime}</div>
                      <div className="text-sm text-muted-foreground">Total Reading Time (min)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{totalStats.averageWordsPerFile}</div>
                      <div className="text-sm text-muted-foreground">Avg Words/File</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{totalStats.averageReadingTime}</div>
                      <div className="text-sm text-muted-foreground">Avg Reading Time (min)</div>
                    </div>
                  </div>
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
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Process Files
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => exportBatch(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.status === 'completed')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export All
                    </Button>

                    <Button
                      onClick={() => exportCSV(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.statistics)}
                    >
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

                              {file.status === 'completed' && file.statistics && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium mb-1">Statistics:</div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div>{file.statistics.wordCount} words</div>
                                    <div>{file.statistics.characterCount} chars</div>
                                    <div>{file.statistics.headingCount} headings</div>
                                    <div>{file.statistics.readingTime} min read</div>
                                  </div>
                                </div>
                              )}

                              {file.status === 'pending' && <div className="text-blue-600">Ready for processing</div>}
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
                            {file.status === 'completed' && file.htmlContent && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(file.content, file.id)}
                                  aria-label={`Copy markdown for ${file.name}`}
                                >
                                  {copiedText === file.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => exportHTML(file.content, file.name.replace(/\.[^/.]+$/, '.html'))}
                                  aria-label={`Export HTML for ${file.name}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
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

                        {file.status === 'completed' && file.htmlContent && (
                          <div className="mt-4">
                            <div className="text-xs font-medium mb-2">Preview:</div>
                            <div
                              className="p-3 bg-muted/30 rounded border max-h-40 overflow-y-auto prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html:
                                  file.htmlContent.substring(0, 500) + (file.htmlContent.length > 500 ? '...' : ''),
                              }}
                            />
                          </div>
                        )}
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
const MarkdownPreview = () => {
  return <MarkdownPreviewCore />
}

export default MarkdownPreview
