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
  List,
  Upload,
  FileImage,
  Trash2,
  Settings,
  Target,
  Copy,
  Check,
  BarChart3,
  Hash,
  Link,
  BookOpen,
  Eye,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  MarkdownFile,
  TOCResult,
  Heading,
  TOCStatistics,
  TOCSettings,
  TOCTemplate,
  TOCFormat,
  IndentStyle,
  BulletStyle,
  CaseStyle,
} from '@/types/markdown-toc'
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
    return { isValid: false, error: 'Only Markdown and text files are supported (.md, .markdown, .txt)' }
  }

  return { isValid: true }
}

// Heading parsing and processing
const parseHeadings = (markdown: string): Heading[] => {
  const lines = markdown.split(/\r?\n/)
  const headings: Heading[] = []

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      const anchor = generateAnchor(text)

      headings.push({
        level,
        text,
        anchor,
        line: index + 1,
        children: [],
      })
    }
  })

  return buildHeadingHierarchy(headings)
}

const generateAnchor = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

const buildHeadingHierarchy = (headings: Heading[]): Heading[] => {
  const result: Heading[] = []
  const stack: Heading[] = []

  headings.forEach((heading) => {
    // Remove headings from stack that are at same or deeper level
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      result.push(heading)
    } else {
      stack[stack.length - 1].children.push(heading)
    }

    stack.push(heading)
  })

  return result
}

// TOC generation functions
const generateTOC = (headings: Heading[], settings: TOCSettings): string => {
  const filteredHeadings = filterHeadingsByDepth(headings, settings.minDepth, settings.maxDepth)

  switch (settings.format) {
    case 'markdown':
      return generateMarkdownTOC(filteredHeadings, settings)
    case 'html':
      return generateHTMLTOC(filteredHeadings, settings)
    case 'json':
      return generateJSONTOC(filteredHeadings, settings)
    case 'plain':
      return generatePlainTOC(filteredHeadings)
    case 'numbered':
      return generateNumberedTOC(filteredHeadings, settings)
    default:
      return generateMarkdownTOC(filteredHeadings, settings)
  }
}

const filterHeadingsByDepth = (headings: Heading[], minDepth: number, maxDepth: number): Heading[] => {
  const filter = (headings: Heading[]): Heading[] => {
    return headings
      .filter((h) => h.level >= minDepth && h.level <= maxDepth)
      .map((h) => ({
        ...h,
        children: filter(h.children),
      }))
  }

  return filter(headings)
}

const generateMarkdownTOC = (headings: Heading[], settings: TOCSettings): string => {
  const generateIndent = (level: number): string => {
    const depth = level - 1
    switch (settings.indentStyle) {
      case 'spaces':
        return '  '.repeat(depth)
      case 'tabs':
        return '\t'.repeat(depth)
      case 'none':
        return ''
      default:
        return '  '.repeat(depth)
    }
  }

  const getBullet = (_level: number, index: number): string => {
    switch (settings.bulletStyle) {
      case 'dash':
        return '- '
      case 'asterisk':
        return '* '
      case 'plus':
        return '+ '
      case 'number':
        return `${index + 1}. `
      case 'custom':
        return `${settings.customPrefix} `
      default:
        return '- '
    }
  }

  const formatText = (text: string): string => {
    let formatted = text

    if (settings.removeNumbers) {
      formatted = formatted.replace(/^\d+\.?\s*/, '')
    }

    if (settings.removeSpecialChars) {
      formatted = formatted.replace(/[^\w\s]/g, '')
    }

    switch (settings.caseStyle) {
      case 'lowercase':
        return formatted.toLowerCase()
      case 'uppercase':
        return formatted.toUpperCase()
      case 'title':
        return formatted.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
      case 'sentence':
        return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase()
      default:
        return formatted
    }
  }

  const renderHeading = (heading: Heading, level: number, index: number): string => {
    const indent = generateIndent(level)
    const bullet = getBullet(level, index)
    const text = formatText(heading.text)

    let line = `${indent}${bullet}`

    if (settings.includeLinks) {
      const anchor = settings.customAnchorPrefix + heading.anchor
      line += `[${text}](#${anchor})`
    } else {
      line += text
    }

    const childLines = heading.children.map((child, childIndex) => renderHeading(child, level + 1, childIndex))

    return [line, ...childLines].join('\n')
  }

  return headings.map((heading, index) => renderHeading(heading, 1, index)).join('\n')
}

const generateHTMLTOC = (headings: Heading[], settings: TOCSettings): string => {
  const renderHeading = (heading: Heading): string => {
    const text = heading.text
    const anchor = settings.customAnchorPrefix + heading.anchor

    let html = '<li>'
    if (settings.includeLinks) {
      html += `<a href="#${anchor}">${text}</a>`
    } else {
      html += text
    }

    if (heading.children.length > 0) {
      html += '<ul>' + heading.children.map(renderHeading).join('') + '</ul>'
    }

    html += '</li>'
    return html
  }

  return '<ul>' + headings.map(renderHeading).join('') + '</ul>'
}

const generateJSONTOC = (headings: Heading[], settings: TOCSettings): string => {
  const convertHeading = (heading: Heading): any => {
    return {
      level: heading.level,
      text: heading.text,
      anchor: settings.customAnchorPrefix + heading.anchor,
      line: heading.line,
      children: heading.children.map(convertHeading),
    }
  }

  return JSON.stringify(headings.map(convertHeading), null, 2)
}

const generatePlainTOC = (headings: Heading[]): string => {
  const renderHeading = (heading: Heading, level: number): string => {
    const indent = '  '.repeat(level - 1)
    const text = heading.text
    const childLines = heading.children.map((child) => renderHeading(child, level + 1))

    return [indent + text, ...childLines].join('\n')
  }

  return headings.map((heading) => renderHeading(heading, 1)).join('\n')
}

const generateNumberedTOC = (headings: Heading[], settings: TOCSettings): string => {
  const renderHeading = (heading: Heading, level: number, numbers: number[]): string => {
    const indent = '  '.repeat(level - 1)
    const numberStr = numbers.join('.')
    const text = heading.text

    let line = `${indent}${numberStr}. `
    if (settings.includeLinks) {
      const anchor = settings.customAnchorPrefix + heading.anchor
      line += `[${text}](#${anchor})`
    } else {
      line += text
    }

    const childLines = heading.children.map((child, index) => renderHeading(child, level + 1, [...numbers, index + 1]))

    return [line, ...childLines].join('\n')
  }

  return headings.map((heading, index) => renderHeading(heading, 1, [index + 1])).join('\n')
}

// Statistics calculation
const calculateTOCStatistics = (headings: Heading[], processingTime: number): TOCStatistics => {
  const flatHeadings = flattenHeadings(headings)
  const headingsByLevel: Record<number, number> = {}
  const anchors: string[] = []

  flatHeadings.forEach((heading) => {
    headingsByLevel[heading.level] = (headingsByLevel[heading.level] || 0) + 1
    anchors.push(heading.anchor)
  })

  const duplicateAnchors = anchors.filter((anchor, index) => anchors.indexOf(anchor) !== index)
  const maxDepth = Math.max(...flatHeadings.map((h) => h.level), 0)
  const averageDepth =
    flatHeadings.length > 0 ? flatHeadings.reduce((sum, h) => sum + h.level, 0) / flatHeadings.length : 0

  return {
    totalHeadings: flatHeadings.length,
    headingsByLevel,
    maxDepth,
    averageDepth,
    duplicateAnchors: [...new Set(duplicateAnchors)],
    processingTime,
  }
}

const flattenHeadings = (headings: Heading[]): Heading[] => {
  const result: Heading[] = []

  const flatten = (headings: Heading[]) => {
    headings.forEach((heading) => {
      result.push(heading)
      flatten(heading.children)
    })
  }

  flatten(headings)
  return result
}

// TOC Templates
const tocTemplates: TOCTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Markdown',
    description: 'Standard markdown TOC with dashes and links',
    settings: {
      format: 'markdown',
      maxDepth: 6,
      minDepth: 1,
      includeLinks: true,
      indentStyle: 'spaces',
      bulletStyle: 'dash',
      caseStyle: 'original',
    },
    example: '- [Introduction](#introduction)\n  - [Getting Started](#getting-started)',
  },
  {
    id: 'numbered',
    name: 'Numbered List',
    description: 'Numbered TOC with hierarchical numbering',
    settings: {
      format: 'numbered',
      maxDepth: 4,
      minDepth: 1,
      includeLinks: true,
      indentStyle: 'spaces',
      bulletStyle: 'number',
      caseStyle: 'original',
    },
    example: '1. [Introduction](#introduction)\n  1.1. [Getting Started](#getting-started)',
  },
  {
    id: 'html',
    name: 'HTML List',
    description: 'HTML unordered list format',
    settings: {
      format: 'html',
      maxDepth: 6,
      minDepth: 1,
      includeLinks: true,
      indentStyle: 'none',
      bulletStyle: 'dash',
      caseStyle: 'original',
    },
    example: '<ul><li><a href="#introduction">Introduction</a></li></ul>',
  },
  {
    id: 'plain',
    name: 'Plain Text',
    description: 'Simple plain text outline',
    settings: {
      format: 'plain',
      maxDepth: 6,
      minDepth: 1,
      includeLinks: false,
      indentStyle: 'spaces',
      bulletStyle: 'dash',
      caseStyle: 'original',
    },
    example: 'Introduction\n  Getting Started\n    Installation',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Compact TOC with minimal depth',
    settings: {
      format: 'markdown',
      maxDepth: 3,
      minDepth: 1,
      includeLinks: true,
      indentStyle: 'spaces',
      bulletStyle: 'asterisk',
      caseStyle: 'original',
    },
    example: '* [Introduction](#introduction)\n  * [Setup](#setup)',
  },
]

// Process markdown and generate TOC
const processMarkdownTOC = (markdown: string, settings: TOCSettings): TOCResult => {
  const startTime = performance.now()

  try {
    const headings = parseHeadings(markdown)
    const toc = generateTOC(headings, settings)
    const statistics = calculateTOCStatistics(headings, performance.now() - startTime)

    return {
      toc,
      headings,
      statistics,
      format: settings.format,
      settings,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'TOC generation failed')
  }
}

// Custom hooks
const useTOCGeneration = () => {
  const generateTOCFromMarkdown = useCallback((markdown: string, settings: TOCSettings): TOCResult => {
    try {
      return processMarkdownTOC(markdown, settings)
    } catch (error) {
      console.error('TOC generation error:', error)
      throw new Error(error instanceof Error ? error.message : 'TOC generation failed')
    }
  }, [])

  const processBatch = useCallback(
    async (files: MarkdownFile[], settings: TOCSettings): Promise<MarkdownFile[]> => {
      return Promise.all(
        files.map(async (file) => {
          if (file.status !== 'pending') return file

          try {
            const result = generateTOCFromMarkdown(file.content, settings)

            return {
              ...file,
              status: 'completed' as const,
              tocResult: result,
              processedAt: new Date(),
            }
          } catch (error) {
            return {
              ...file,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'TOC generation failed',
            }
          }
        })
      )
    },
    [generateTOCFromMarkdown]
  )

  return { generateTOCFromMarkdown, processBatch }
}

// Real-time TOC preview hook
const useRealTimeTOC = (markdown: string, settings: TOCSettings) => {
  return useMemo(() => {
    if (!markdown.trim()) {
      return {
        result: null,
        error: null,
        isEmpty: true,
      }
    }

    try {
      const result = processMarkdownTOC(markdown, settings)
      return {
        result,
        error: null,
        isEmpty: false,
      }
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : 'TOC generation failed',
        isEmpty: false,
      }
    }
  }, [markdown, settings])
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<MarkdownFile> => {
    const validation = validateMarkdownFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const markdownFile: MarkdownFile = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type || 'text/plain',
            status: 'pending',
          }

          resolve(markdownFile)
        } catch (error) {
          reject(new Error('Failed to process file'))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

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
const useTOCExport = () => {
  const exportTOC = useCallback((result: TOCResult, filename?: string) => {
    const extension = result.format === 'html' ? '.html' : result.format === 'json' ? '.json' : '.md'
    const mimeType =
      result.format === 'html' ? 'text/html' : result.format === 'json' ? 'application/json' : 'text/markdown'

    const blob = new Blob([result.toc], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `table-of-contents${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportMarkdownWithTOC = useCallback((markdown: string, toc: string, filename?: string) => {
    const content = `${toc}\n\n${markdown}`
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || 'document-with-toc.md'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: MarkdownFile[]) => {
      const completedFiles = files.filter((f) => f.tocResult)

      if (completedFiles.length === 0) {
        toast.error('No TOCs to export')
        return
      }

      completedFiles.forEach((file) => {
        if (file.tocResult) {
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          exportTOC(file.tocResult, `${baseName}-toc`)
        }
      })

      toast.success(`Exported ${completedFiles.length} TOC(s)`)
    },
    [exportTOC]
  )

  const exportStatistics = useCallback((files: MarkdownFile[]) => {
    const stats = files
      .filter((f) => f.tocResult)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.size),
        totalHeadings: file.tocResult!.statistics.totalHeadings,
        maxDepth: file.tocResult!.statistics.maxDepth,
        averageDepth: file.tocResult!.statistics.averageDepth.toFixed(2),
        duplicateAnchors: file.tocResult!.statistics.duplicateAnchors.length,
        processingTime: `${file.tocResult!.statistics.processingTime.toFixed(2)}ms`,
        format: file.tocResult!.format,
        status: file.status,
      }))

    const csvContent = [
      [
        'Filename',
        'Original Size',
        'Total Headings',
        'Max Depth',
        'Avg Depth',
        'Duplicate Anchors',
        'Processing Time',
        'Format',
        'Status',
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.totalHeadings.toString(),
        stat.maxDepth.toString(),
        stat.averageDepth,
        stat.duplicateAnchors.toString(),
        stat.processingTime,
        stat.format,
        stat.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'toc-generation-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportTOC, exportMarkdownWithTOC, exportBatch, exportStatistics }
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

      const files = Array.from(e.dataTransfer.files).filter((file) => file.name.match(/\.(md|markdown|txt)$/i))

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
 * Enhanced Markdown TOC Tool
 * Features: Real-time TOC generation, file upload, batch processing, multiple formats
 */
const MarkdownTOCCore = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'files'>('generator')
  const [markdown, setMarkdown] = useState(
    "# Introduction\n\nThis is a sample markdown document.\n\n## Getting Started\n\nLet's begin with the basics.\n\n### Installation\n\nFirst, install the required dependencies.\n\n### Configuration\n\nNext, configure your settings.\n\n## Advanced Topics\n\nOnce you're comfortable with the basics.\n\n### Performance\n\nOptimizing for better performance.\n\n### Security\n\nBest practices for security."
  )
  const [files, setFiles] = useState<MarkdownFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard')
  const [settings, setSettings] = useState<TOCSettings>({
    format: 'markdown',
    maxDepth: 6,
    minDepth: 1,
    includeLinks: true,
    customPrefix: '-',
    indentStyle: 'spaces',
    bulletStyle: 'dash',
    caseStyle: 'original',
    removeNumbers: false,
    removeSpecialChars: false,
    customAnchorPrefix: '',
  })

  const { processBatch } = useTOCGeneration()
  const { exportTOC, exportMarkdownWithTOC, exportBatch, exportStatistics } = useTOCExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Real-time TOC generation
  const tocPreview = useRealTimeTOC(markdown, settings)

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
    const template = tocTemplates.find((t) => t.id === templateId)
    if (template) {
      setSettings((prev) => ({
        ...prev,
        ...template.settings,
      }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Process all files
  const processFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) {
      toast.error('No files to process')
      return
    }

    setIsProcessing(true)
    try {
      const updatedFiles = await processBatch(pendingFiles, settings)
      setFiles((prev) =>
        prev.map((file) => {
          const updated = updatedFiles.find((u) => u.id === file.id)
          return updated || file
        })
      )
      toast.success('Files processed successfully!')
    } catch (error) {
      toast.error('Failed to process files')
    } finally {
      setIsProcessing(false)
    }
  }, [files, settings, processBatch])

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
    const completedFiles = files.filter((f) => f.tocResult)
    if (completedFiles.length === 0) return null

    const totalHeadings = completedFiles.reduce((sum, f) => sum + (f.tocResult?.statistics.totalHeadings || 0), 0)
    const averageDepth =
      completedFiles.length > 0
        ? completedFiles.reduce((sum, f) => sum + (f.tocResult?.statistics.averageDepth || 0), 0) /
          completedFiles.length
        : 0
    const averageProcessingTime =
      completedFiles.length > 0
        ? completedFiles.reduce((sum, f) => sum + (f.tocResult?.statistics.processingTime || 0), 0) /
          completedFiles.length
        : 0

    return {
      totalFiles: files.length,
      completedFiles: completedFiles.length,
      failedFiles: files.filter((f) => f.status === 'error').length,
      totalHeadings,
      averageDepth,
      averageProcessingTime,
    }
  }, [files])

  return (
    <div className="w-full mx-auto space-y-6">
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
              <List className="h-5 w-5" aria-hidden="true" />
              Markdown TOC Generator
            </CardTitle>
            <CardDescription>
              Generate table of contents from Markdown documents with customizable formats, templates, and batch
              processing. Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'generator' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              TOC Generator
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* TOC Generator Tab */}
          <TabsContent value="generator" className="space-y-4">
            {/* TOC Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  TOC Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tocTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? 'default' : 'outline'}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div className="text-xs font-mono mt-1 bg-muted/30 px-1 rounded">{template.example}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* TOC Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  TOC Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <Select
                      value={settings.format}
                      onValueChange={(value: TOCFormat) => setSettings((prev) => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger id="format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="plain">Plain Text</SelectItem>
                        <SelectItem value="numbered">Numbered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulletStyle">Bullet Style</Label>
                    <Select
                      value={settings.bulletStyle}
                      onValueChange={(value: BulletStyle) => setSettings((prev) => ({ ...prev, bulletStyle: value }))}
                    >
                      <SelectTrigger id="bulletStyle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dash">Dash (-)</SelectItem>
                        <SelectItem value="asterisk">Asterisk (*)</SelectItem>
                        <SelectItem value="plus">Plus (+)</SelectItem>
                        <SelectItem value="number">Number (1.)</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="indentStyle">Indent Style</Label>
                    <Select
                      value={settings.indentStyle}
                      onValueChange={(value: IndentStyle) => setSettings((prev) => ({ ...prev, indentStyle: value }))}
                    >
                      <SelectTrigger id="indentStyle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spaces">Spaces</SelectItem>
                        <SelectItem value="tabs">Tabs</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caseStyle">Case Style</Label>
                    <Select
                      value={settings.caseStyle}
                      onValueChange={(value: CaseStyle) => setSettings((prev) => ({ ...prev, caseStyle: value }))}
                    >
                      <SelectTrigger id="caseStyle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">Original</SelectItem>
                        <SelectItem value="lowercase">lowercase</SelectItem>
                        <SelectItem value="uppercase">UPPERCASE</SelectItem>
                        <SelectItem value="title">Title Case</SelectItem>
                        <SelectItem value="sentence">Sentence case</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minDepth">Min Depth</Label>
                    <Input
                      id="minDepth"
                      type="number"
                      min="1"
                      max="6"
                      value={settings.minDepth}
                      onChange={(e) => setSettings((prev) => ({ ...prev, minDepth: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxDepth">Max Depth</Label>
                    <Input
                      id="maxDepth"
                      type="number"
                      min="1"
                      max="6"
                      value={settings.maxDepth}
                      onChange={(e) => setSettings((prev) => ({ ...prev, maxDepth: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      id="includeLinks"
                      type="checkbox"
                      checked={settings.includeLinks}
                      onChange={(e) => setSettings((prev) => ({ ...prev, includeLinks: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="includeLinks" className="text-sm">
                      Include Links
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="removeNumbers"
                      type="checkbox"
                      checked={settings.removeNumbers}
                      onChange={(e) => setSettings((prev) => ({ ...prev, removeNumbers: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="removeNumbers" className="text-sm">
                      Remove Numbers
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="removeSpecialChars"
                      type="checkbox"
                      checked={settings.removeSpecialChars}
                      onChange={(e) => setSettings((prev) => ({ ...prev, removeSpecialChars: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="removeSpecialChars" className="text-sm">
                      Remove Special Chars
                    </Label>
                  </div>
                </div>

                {settings.bulletStyle === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="customPrefix">Custom Prefix</Label>
                    <Input
                      id="customPrefix"
                      value={settings.customPrefix}
                      onChange={(e) => setSettings((prev) => ({ ...prev, customPrefix: e.target.value }))}
                      placeholder="Enter custom bullet prefix..."
                    />
                  </div>
                )}

                {settings.includeLinks && (
                  <div className="space-y-2">
                    <Label htmlFor="customAnchorPrefix">Anchor Prefix</Label>
                    <Input
                      id="customAnchorPrefix"
                      value={settings.customAnchorPrefix}
                      onChange={(e) => setSettings((prev) => ({ ...prev, customAnchorPrefix: e.target.value }))}
                      placeholder="Optional anchor prefix..."
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Markdown Input */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Markdown Input</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="markdown-input">Enter your Markdown content</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(markdown, 'markdown content')}
                        disabled={!markdown}
                      >
                        {copiedText === 'markdown content' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Textarea
                      id="markdown-input"
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                      placeholder="Enter your Markdown content here..."
                      className="min-h-[300px] font-mono"
                      aria-label="Markdown content input"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Generated TOC
                    <div className="ml-auto flex items-center gap-2">
                      {tocPreview.result && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(tocPreview.result!.toc, 'TOC')}
                        >
                          {copiedText === 'TOC' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tocPreview.error ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <Hash className="h-4 w-4" />
                        <span className="font-medium">TOC Generation Error</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{tocPreview.error}</p>
                    </div>
                  ) : tocPreview.result ? (
                    <div className="space-y-2">
                      <Textarea
                        value={tocPreview.result.toc}
                        readOnly
                        className="min-h-[300px] font-mono"
                        aria-label="Generated table of contents"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Enter Markdown content to generate TOC</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            {tocPreview.result && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    TOC Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                      <div className="text-lg font-bold text-blue-600">
                        {tocPreview.result.statistics.totalHeadings}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Headings</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded">
                      <div className="text-lg font-bold text-green-600">{tocPreview.result.statistics.maxDepth}</div>
                      <div className="text-xs text-muted-foreground">Max Depth</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded">
                      <div className="text-lg font-bold text-purple-600">
                        {tocPreview.result.statistics.averageDepth.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Depth</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded">
                      <div className="text-lg font-bold text-orange-600">
                        {tocPreview.result.statistics.processingTime.toFixed(2)}ms
                      </div>
                      <div className="text-xs text-muted-foreground">Processing Time</div>
                    </div>
                  </div>

                  {/* Heading Distribution */}
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Headings by Level</Label>
                    <div className="mt-2 grid grid-cols-6 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((level) => (
                        <div key={level} className="text-center p-2 bg-muted/30 rounded">
                          <div className="text-lg font-bold">
                            {tocPreview.result!.statistics.headingsByLevel[level] || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">H{level}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Duplicate Anchors Warning */}
                  {tocPreview.result.statistics.duplicateAnchors.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                        <Link className="h-4 w-4" />
                        <span className="font-medium">Duplicate Anchors Detected</span>
                      </div>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                        The following anchors appear multiple times:{' '}
                        {tocPreview.result.statistics.duplicateAnchors.join(', ')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Export Actions */}
            {tocPreview.result && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button onClick={() => exportTOC(tocPreview.result!)} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export TOC
                    </Button>

                    <Button onClick={() => exportMarkdownWithTOC(markdown, tocPreview.result!.toc)} variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Export with TOC
                    </Button>

                    <Button
                      onClick={() => copyToClipboard(tocPreview.result!.toc, 'table of contents')}
                      variant="outline"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy TOC
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Batch Processing Tab */}
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
                  aria-label="Drag and drop Markdown files here or click to select files"
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
                  <p className="text-xs text-muted-foreground">
                    Supports MD, Markdown, and TXT files • Max 50MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".md,.markdown,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                    aria-label="Select Markdown files"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Batch Statistics */}
            {totalStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalStats.totalFiles}</div>
                      <div className="text-sm text-muted-foreground">Total Files</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{totalStats.completedFiles}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{totalStats.failedFiles}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalStats.totalHeadings}</div>
                      <div className="text-sm text-muted-foreground">Total Headings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{totalStats.averageDepth.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Avg Depth</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {totalStats.averageProcessingTime.toFixed(2)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Processing Time</div>
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
                          Generate TOCs
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => exportBatch(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.tocResult)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download All TOCs
                    </Button>

                    <Button
                      onClick={() => exportStatistics(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.tocResult)}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Export Statistics
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

                              {file.status === 'completed' && file.tocResult && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium mb-1">TOC Generated:</div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div>{file.tocResult.statistics.totalHeadings} headings</div>
                                    <div>Max depth: {file.tocResult.statistics.maxDepth}</div>
                                    <div>Format: {file.tocResult.format}</div>
                                    <div>{file.tocResult.statistics.processingTime.toFixed(2)}ms</div>
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
                            {file.status === 'completed' && file.tocResult && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => exportTOC(file.tocResult!, file.name.replace(/\.[^/.]+$/, '-toc'))}
                                  aria-label={`Export TOC for ${file.name}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(file.tocResult!.toc, file.id)}
                                  aria-label={`Copy TOC from ${file.name}`}
                                >
                                  {copiedText === file.id ? (
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const MarkdownToc = () => {
  return <MarkdownTOCCore />
}

export default MarkdownToc
