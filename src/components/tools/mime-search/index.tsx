import { useCallback, useState, useMemo, useEffect } from 'react'
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
  Trash2,
  Copy,
  Check,
  Shuffle,
  RotateCcw,
  Zap,
  Settings,
  CheckCircle2,
  AlertCircle,
  FileText,
  BookOpen,
  Search,
  Eye,
  EyeOff,
  Database,
  Globe,
  Shield,
  Info,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  Archive,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  MimeSearchResult,
  MimeTypeInfo,
  ProcessingBatch,
  BatchStatistics,
  ProcessingSettings,
  MimeTemplate,
  MimeValidation,
  QueryType,
  MimeCategory,
  SecurityRisk,
  SearchMode,
  ExportFormat,
} from '@/types/mime-search'

// Utility functions

// Comprehensive MIME type database
const mimeDatabase: MimeTypeInfo[] = [
  // Images
  {
    mimeType: 'image/jpeg',
    extensions: ['jpg', 'jpeg', 'jpe'],
    category: 'image',
    description: 'JPEG image format with lossy compression',
    commonName: 'JPEG Image',
    isStandard: true,
    rfc: 'RFC 2046',
    usage: ['Photography', 'Web images', 'Digital cameras'],
    security: {
      riskLevel: 'minimal',
      executable: false,
      scriptable: false,
      canContainMalware: false,
      requiresSandbox: false,
      warnings: [],
    },
    compression: {
      isCompressed: true,
      compressionType: 'Lossy',
      typicalSize: '50KB - 5MB',
      compressionRatio: 10,
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: true,
      mobile: true,
      notes: ['Universal support'],
    },
  },
  {
    mimeType: 'image/png',
    extensions: ['png'],
    category: 'image',
    description: 'Portable Network Graphics with lossless compression',
    commonName: 'PNG Image',
    isStandard: true,
    rfc: 'RFC 2083',
    usage: ['Web graphics', 'Screenshots', 'Logos with transparency'],
    security: {
      riskLevel: 'minimal',
      executable: false,
      scriptable: false,
      canContainMalware: false,
      requiresSandbox: false,
      warnings: [],
    },
    compression: {
      isCompressed: true,
      compressionType: 'Lossless',
      typicalSize: '10KB - 2MB',
      compressionRatio: 3,
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: true,
      mobile: true,
      notes: ['Universal support', 'Transparency support'],
    },
  },
  {
    mimeType: 'image/webp',
    extensions: ['webp'],
    category: 'image',
    description: 'Modern image format with superior compression',
    commonName: 'WebP Image',
    isStandard: true,
    usage: ['Modern web applications', 'Progressive web apps'],
    security: {
      riskLevel: 'minimal',
      executable: false,
      scriptable: false,
      canContainMalware: false,
      requiresSandbox: false,
      warnings: [],
    },
    compression: {
      isCompressed: true,
      compressionType: 'Both lossy and lossless',
      typicalSize: '20KB - 1MB',
      compressionRatio: 25,
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: false,
      mobile: true,
      notes: ['Modern browsers only', 'IE not supported'],
    },
  },
  {
    mimeType: 'image/gif',
    extensions: ['gif'],
    category: 'image',
    description: 'Graphics Interchange Format with animation support',
    commonName: 'GIF Image',
    isStandard: true,
    usage: ['Animated images', 'Simple graphics', 'Memes'],
    security: {
      riskLevel: 'minimal',
      executable: false,
      scriptable: false,
      canContainMalware: false,
      requiresSandbox: false,
      warnings: [],
    },
    compression: {
      isCompressed: true,
      compressionType: 'Lossless',
      typicalSize: '50KB - 10MB',
      compressionRatio: 2,
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: true,
      mobile: true,
      notes: ['Universal support', 'Animation support'],
    },
  },
  {
    mimeType: 'image/svg+xml',
    extensions: ['svg'],
    category: 'image',
    description: 'Scalable Vector Graphics format',
    commonName: 'SVG Image',
    isStandard: true,
    usage: ['Vector graphics', 'Icons', 'Scalable illustrations'],
    security: {
      riskLevel: 'medium',
      executable: false,
      scriptable: true,
      canContainMalware: true,
      requiresSandbox: true,
      warnings: ['Can contain JavaScript', 'Potential XSS vector'],
    },
    compression: {
      isCompressed: false,
      compressionType: 'Text-based',
      typicalSize: '1KB - 500KB',
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: false,
      mobile: true,
      notes: ['Modern browsers', 'IE 9+ with limitations'],
    },
  },
  // Videos
  {
    mimeType: 'video/mp4',
    extensions: ['mp4', 'm4v'],
    category: 'video',
    description: 'MPEG-4 video container format',
    commonName: 'MP4 Video',
    isStandard: true,
    rfc: 'ISO/IEC 14496',
    usage: ['Web video', 'Streaming', 'Mobile video'],
    security: {
      riskLevel: 'low',
      executable: false,
      scriptable: false,
      canContainMalware: false,
      requiresSandbox: false,
      warnings: [],
    },
    compression: {
      isCompressed: true,
      compressionType: 'Lossy',
      typicalSize: '10MB - 2GB',
      compressionRatio: 50,
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: true,
      mobile: true,
      notes: ['Universal support', 'H.264 codec required'],
    },
  },
  {
    mimeType: 'video/webm',
    extensions: ['webm'],
    category: 'video',
    description: 'WebM video format for web',
    commonName: 'WebM Video',
    isStandard: true,
    usage: ['Web video', 'HTML5 video', 'Open source projects'],
    security: {
      riskLevel: 'low',
      executable: false,
      scriptable: false,
      canContainMalware: false,
      requiresSandbox: false,
      warnings: [],
    },
    compression: {
      isCompressed: true,
      compressionType: 'Lossy',
      typicalSize: '5MB - 1GB',
      compressionRatio: 60,
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: false,
      edge: true,
      ie: false,
      mobile: true,
      notes: ['Chrome and Firefox preferred', 'Safari requires plugin'],
    },
  },
  // Audio
  {
    mimeType: 'audio/mpeg',
    extensions: ['mp3'],
    category: 'audio',
    description: 'MPEG Audio Layer III format',
    commonName: 'MP3 Audio',
    isStandard: true,
    rfc: 'ISO/IEC 11172-3',
    usage: ['Music', 'Podcasts', 'Audio streaming'],
    security: {
      riskLevel: 'minimal',
      executable: false,
      scriptable: false,
      canContainMalware: false,
      requiresSandbox: false,
      warnings: [],
    },
    compression: {
      isCompressed: true,
      compressionType: 'Lossy',
      typicalSize: '3MB - 10MB',
      compressionRatio: 11,
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: true,
      mobile: true,
      notes: ['Universal support'],
    },
  },
  {
    mimeType: 'audio/wav',
    extensions: ['wav'],
    category: 'audio',
    description: 'Waveform Audio File Format',
    commonName: 'WAV Audio',
    isStandard: true,
    usage: ['High-quality audio', 'Audio editing', 'Professional recording'],
    security: {
      riskLevel: 'minimal',
      executable: false,
      scriptable: false,
      canContainMalware: false,
      requiresSandbox: false,
      warnings: [],
    },
    compression: {
      isCompressed: false,
      compressionType: 'Uncompressed',
      typicalSize: '30MB - 100MB',
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: true,
      mobile: true,
      notes: ['Universal support', 'Large file sizes'],
    },
  },
  // Text
  {
    mimeType: 'text/plain',
    extensions: ['txt', 'text'],
    category: 'text',
    description: 'Plain text format',
    commonName: 'Text File',
    isStandard: true,
    rfc: 'RFC 2046',
    usage: ['Documentation', 'Configuration files', 'Data files'],
    security: {
      riskLevel: 'minimal',
      executable: false,
      scriptable: false,
      canContainMalware: false,
      requiresSandbox: false,
      warnings: [],
    },
    compression: {
      isCompressed: false,
      compressionType: 'Uncompressed',
      typicalSize: '1KB - 10MB',
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: true,
      mobile: true,
      notes: ['Universal support'],
    },
  },
  {
    mimeType: 'text/html',
    extensions: ['html', 'htm'],
    category: 'text',
    description: 'HyperText Markup Language',
    commonName: 'HTML Document',
    isStandard: true,
    rfc: 'RFC 2854',
    usage: ['Web pages', 'Email templates', 'Documentation'],
    security: {
      riskLevel: 'medium',
      executable: false,
      scriptable: true,
      canContainMalware: true,
      requiresSandbox: true,
      warnings: ['Can contain JavaScript', 'XSS vulnerability'],
    },
    compression: {
      isCompressed: false,
      compressionType: 'Text-based',
      typicalSize: '5KB - 1MB',
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: true,
      mobile: true,
      notes: ['Universal support'],
    },
  },
  {
    mimeType: 'text/css',
    extensions: ['css'],
    category: 'text',
    description: 'Cascading Style Sheets',
    commonName: 'CSS Stylesheet',
    isStandard: true,
    rfc: 'RFC 2318',
    usage: ['Web styling', 'Print styles', 'UI themes'],
    security: {
      riskLevel: 'low',
      executable: false,
      scriptable: false,
      canContainMalware: false,
      requiresSandbox: false,
      warnings: ['Can reference external resources'],
    },
    compression: {
      isCompressed: false,
      compressionType: 'Text-based',
      typicalSize: '1KB - 500KB',
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: true,
      mobile: true,
      notes: ['Universal support'],
    },
  },
  {
    mimeType: 'application/javascript',
    extensions: ['js', 'mjs'],
    category: 'application',
    description: 'JavaScript source code',
    commonName: 'JavaScript File',
    isStandard: true,
    rfc: 'RFC 4329',
    usage: ['Web applications', 'Node.js', 'Browser scripts'],
    security: {
      riskLevel: 'high',
      executable: true,
      scriptable: true,
      canContainMalware: true,
      requiresSandbox: true,
      warnings: ['Executable code', 'Can access system resources', 'XSS vector'],
    },
    compression: {
      isCompressed: false,
      compressionType: 'Text-based',
      typicalSize: '1KB - 5MB',
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: true,
      mobile: true,
      notes: ['Universal support', 'Execution context dependent'],
    },
  },
  {
    mimeType: 'application/json',
    extensions: ['json'],
    category: 'application',
    description: 'JavaScript Object Notation data format',
    commonName: 'JSON Data',
    isStandard: true,
    rfc: 'RFC 7159',
    usage: ['API responses', 'Configuration files', 'Data exchange'],
    security: {
      riskLevel: 'low',
      executable: false,
      scriptable: false,
      canContainMalware: false,
      requiresSandbox: false,
      warnings: ['Can contain sensitive data'],
    },
    compression: {
      isCompressed: false,
      compressionType: 'Text-based',
      typicalSize: '1KB - 50MB',
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: true,
      mobile: true,
      notes: ['Universal support', 'Native parsing support'],
    },
  },
  {
    mimeType: 'application/pdf',
    extensions: ['pdf'],
    category: 'application',
    description: 'Portable Document Format',
    commonName: 'PDF Document',
    isStandard: true,
    rfc: 'ISO 32000',
    usage: ['Documents', 'Forms', 'Print-ready files'],
    security: {
      riskLevel: 'medium',
      executable: true,
      scriptable: true,
      canContainMalware: true,
      requiresSandbox: true,
      warnings: ['Can contain JavaScript', 'Can execute actions', 'Form submission'],
    },
    compression: {
      isCompressed: true,
      compressionType: 'Various',
      typicalSize: '100KB - 100MB',
      compressionRatio: 5,
    },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      ie: false,
      mobile: true,
      notes: ['Built-in viewers', 'Plugin required for IE'],
    },
  },
  {
    mimeType: 'application/zip',
    extensions: ['zip'],
    category: 'application',
    description: 'ZIP archive format',
    commonName: 'ZIP Archive',
    isStandard: true,
    usage: ['File compression', 'Software distribution', 'Backup'],
    security: {
      riskLevel: 'high',
      executable: false,
      scriptable: false,
      canContainMalware: true,
      requiresSandbox: true,
      warnings: ['Can contain executable files', 'Zip bombs possible', 'Path traversal attacks'],
    },
    compression: {
      isCompressed: true,
      compressionType: 'Lossless',
      typicalSize: '1KB - 4GB',
      compressionRatio: 3,
    },
    browserSupport: {
      chrome: false,
      firefox: false,
      safari: false,
      edge: false,
      ie: false,
      mobile: false,
      notes: ['Download only', 'No browser display'],
    },
  },
]

// Search functions
const searchMimeTypes = (query: string, queryType: QueryType, settings: ProcessingSettings): MimeTypeInfo[] => {
  if (!query.trim()) return []

  const searchTerm = settings.caseSensitive ? query : query.toLowerCase()

  return mimeDatabase
    .filter((mime) => {
      // Apply filters
      if (!settings.includeDeprecated && !mime.isStandard) return false
      if (!settings.includeExperimental && mime.mimeType.includes('x-')) return false
      if (!settings.includeVendorSpecific && mime.mimeType.includes('vnd.')) return false

      let matches = false

      switch (queryType) {
        case 'extension':
          const ext = searchTerm.replace(/^\./, '') // Remove leading dot
          matches = mime.extensions.some((e) =>
            settings.exactMatch
              ? settings.caseSensitive
                ? e === ext
                : e.toLowerCase() === ext
              : settings.caseSensitive
                ? e.includes(ext)
                : e.toLowerCase().includes(ext)
          )
          break

        case 'mimetype':
          const mimeToSearch = settings.caseSensitive ? mime.mimeType : mime.mimeType.toLowerCase()
          matches = settings.exactMatch ? mimeToSearch === searchTerm : mimeToSearch.includes(searchTerm)
          break

        case 'keyword':
          const searchFields = [mime.description, mime.commonName, ...mime.usage, mime.category].join(' ')
          const fieldsToSearch = settings.caseSensitive ? searchFields : searchFields.toLowerCase()
          matches = fieldsToSearch.includes(searchTerm)
          break

        case 'category':
          const categoryToSearch = settings.caseSensitive ? mime.category : mime.category.toLowerCase()
          matches = settings.exactMatch ? categoryToSearch === searchTerm : categoryToSearch.includes(searchTerm)
          break
      }

      return matches
    })
    .slice(0, settings.maxResults)
}

const getMimesByCategory = (category: MimeCategory): MimeTypeInfo[] => {
  return mimeDatabase.filter((mime) => mime.category === category)
}

const getSecurityRisks = (mimeTypes: MimeTypeInfo[]): MimeTypeInfo[] => {
  return mimeTypes.filter((mime) => mime.security.riskLevel === 'high' || mime.security.riskLevel === 'medium')
}

// MIME templates
const mimeTemplates: MimeTemplate[] = [
  {
    id: 'web-images',
    name: 'Web Images',
    description: 'Common image formats for web development',
    category: 'Images',
    examples: ['jpg', 'png', 'webp', 'svg', 'gif'],
    useCase: ['Web development', 'UI design', 'Content creation'],
    searchTerms: ['image', 'photo', 'graphic', 'picture'],
  },
  {
    id: 'web-documents',
    name: 'Web Documents',
    description: 'Document formats for web applications',
    category: 'Documents',
    examples: ['html', 'css', 'js', 'json', 'xml'],
    useCase: ['Web development', 'API development', 'Configuration'],
    searchTerms: ['web', 'document', 'markup', 'script'],
  },
  {
    id: 'media-files',
    name: 'Media Files',
    description: 'Audio and video formats for multimedia',
    category: 'Media',
    examples: ['mp4', 'webm', 'mp3', 'wav', 'ogg'],
    useCase: ['Multimedia', 'Streaming', 'Entertainment'],
    searchTerms: ['video', 'audio', 'media', 'sound', 'music'],
  },
  {
    id: 'office-documents',
    name: 'Office Documents',
    description: 'Common office and productivity file formats',
    category: 'Office',
    examples: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
    useCase: ['Business', 'Documentation', 'Reports'],
    searchTerms: ['office', 'document', 'spreadsheet', 'presentation'],
  },
  {
    id: 'archive-formats',
    name: 'Archive Formats',
    description: 'Compression and archive file formats',
    category: 'Archives',
    examples: ['zip', 'rar', 'tar', 'gz', '7z'],
    useCase: ['File compression', 'Backup', 'Distribution'],
    searchTerms: ['archive', 'compress', 'zip', 'backup'],
  },
  {
    id: 'development-files',
    name: 'Development Files',
    description: 'Programming and development file formats',
    category: 'Development',
    examples: ['js', 'ts', 'py', 'java', 'cpp', 'cs'],
    useCase: ['Software development', 'Programming', 'Scripting'],
    searchTerms: ['code', 'programming', 'script', 'development'],
  },
]

// Validation functions
const validateMimeQuery = (query: string, queryType: QueryType): MimeValidation => {
  const validation: MimeValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!query || query.trim().length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: 'Search query cannot be empty',
      type: 'format',
      severity: 'error',
    })
    return validation
  }

  // Query type specific validation
  switch (queryType) {
    case 'extension':
      if (query.includes('/')) {
        validation.warnings.push('Extensions should not contain slashes')
        validation.suggestions.push('Use MIME type search for formats like "image/jpeg"')
      }
      if (query.length > 10) {
        validation.warnings.push('Extension seems unusually long')
      }
      break

    case 'mimetype':
      if (!query.includes('/')) {
        validation.warnings.push('MIME types typically contain a slash (e.g., "image/jpeg")')
        validation.suggestions.push('Try extension search if looking for file extensions')
      }
      if (!/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/.test(query)) {
        validation.warnings.push('MIME type format may be invalid')
      }
      break

    case 'keyword':
      if (query.length < 2) {
        validation.warnings.push('Keyword search works better with longer terms')
      }
      break

    case 'category':
      const validCategories = [
        'image',
        'video',
        'audio',
        'text',
        'application',
        'font',
        'model',
        'multipart',
        'message',
      ]
      if (!validCategories.includes(query.toLowerCase())) {
        validation.suggestions.push(`Valid categories: ${validCategories.join(', ')}`)
      }
      break
  }

  // Security checks
  if (/[<>'"&]/.test(query)) {
    validation.warnings.push('Query contains potentially unsafe characters')
  }

  return validation
}

// Custom hooks
const useMimeSearch = () => {
  const performSearch = useCallback(
    (query: string, queryType: QueryType, settings: ProcessingSettings): MimeSearchResult => {
      const startTime = performance.now()

      try {
        const results = searchMimeTypes(query, queryType, settings)
        const endTime = performance.now()
        const processingTime = endTime - startTime

        // Calculate statistics
        const categoryDistribution: Record<string, number> = {}
        let securityRiskCount = 0
        let standardCompliantCount = 0

        results.forEach((mime) => {
          categoryDistribution[mime.category] = (categoryDistribution[mime.category] || 0) + 1
          if (mime.security.riskLevel === 'high' || mime.security.riskLevel === 'medium') {
            securityRiskCount++
          }
          if (mime.isStandard) {
            standardCompliantCount++
          }
        })

        return {
          id: nanoid(),
          query,
          queryType,
          results,
          isValid: true,
          statistics: {
            queryLength: query.length,
            resultCount: results.length,
            processingTime,
            categoryDistribution,
            securityRiskCount,
            standardCompliantCount,
          },
          createdAt: new Date(),
        }
      } catch (error) {
        const endTime = performance.now()
        const processingTime = endTime - startTime

        return {
          id: nanoid(),
          query,
          queryType,
          results: [],
          isValid: false,
          error: error instanceof Error ? error.message : 'Search failed',
          statistics: {
            queryLength: query.length,
            resultCount: 0,
            processingTime,
            categoryDistribution: {},
            securityRiskCount: 0,
            standardCompliantCount: 0,
          },
          createdAt: new Date(),
        }
      }
    },
    []
  )

  const processBatch = useCallback(
    (queries: Array<{ query: string; queryType: QueryType }>, settings: ProcessingSettings): ProcessingBatch => {
      try {
        const results = queries.map(({ query, queryType }) => performSearch(query, queryType, settings))

        const validCount = results.filter((result) => result.isValid).length
        const invalidCount = results.length - validCount
        const totalResults = results.reduce((sum, result) => sum + result.results.length, 0)

        // Aggregate statistics
        const categoryDistribution: Record<string, number> = {}
        const securityDistribution: Record<string, number> = {}

        results.forEach((result) => {
          if (result.isValid) {
            Object.entries(result.statistics.categoryDistribution).forEach(([category, count]) => {
              categoryDistribution[category] = (categoryDistribution[category] || 0) + count
            })

            result.results.forEach((mime) => {
              const risk = mime.security.riskLevel
              securityDistribution[risk] = (securityDistribution[risk] || 0) + 1
            })
          }
        })

        const statistics: BatchStatistics = {
          totalProcessed: results.length,
          validCount,
          invalidCount,
          totalResults,
          categoryDistribution,
          securityDistribution,
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
    [performSearch]
  )

  return { performSearch, processBatch }
}

// Real-time validation hook
const useRealTimeValidation = (query: string, queryType: QueryType) => {
  return useMemo(() => {
    if (!query.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = validateMimeQuery(query, queryType)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
    }
  }, [query, queryType])
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

// Export functionality
const useMimeExport = () => {
  const exportResults = useCallback((results: MimeSearchResult[], format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        const jsonData = results.map((result) => ({
          id: result.id,
          query: result.query,
          queryType: result.queryType,
          results: result.results,
          isValid: result.isValid,
          error: result.error,
          statistics: result.statistics,
          createdAt: result.createdAt,
        }))
        content = JSON.stringify(jsonData, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        const csvHeaders = [
          'Query',
          'Query Type',
          'MIME Type',
          'Extensions',
          'Category',
          'Description',
          'Security Risk',
          'Standard',
          'Browser Support',
        ]
        const csvRows: string[] = []
        results.forEach((result) => {
          if (result.isValid) {
            result.results.forEach((mime) => {
              csvRows.push(
                [
                  `"${result.query.replace(/"/g, '""')}"`,
                  result.queryType,
                  mime.mimeType,
                  `"${mime.extensions.join(', ')}"`,
                  mime.category,
                  `"${mime.description.replace(/"/g, '""')}"`,
                  mime.security.riskLevel,
                  mime.isStandard ? 'Yes' : 'No',
                  `"${Object.entries(mime.browserSupport)
                    .filter(([_, supported]) => supported)
                    .map(([browser]) => browser)
                    .join(', ')}"`,
                ].join(',')
              )
            })
          }
        })
        content = [csvHeaders.join(','), ...csvRows].join('\n')
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'xml':
        const xmlData = results
          .map(
            (result) => `
  <searchResult>
    <query>${result.query}</query>
    <queryType>${result.queryType}</queryType>
    <valid>${result.isValid}</valid>
    <results>
      ${result.results
        .map(
          (mime) => `
      <mimeType>
        <type>${mime.mimeType}</type>
        <extensions>${mime.extensions.join(',')}</extensions>
        <category>${mime.category}</category>
        <description><![CDATA[${mime.description}]]></description>
        <security>
          <riskLevel>${mime.security.riskLevel}</riskLevel>
          <executable>${mime.security.executable}</executable>
        </security>
      </mimeType>`
        )
        .join('')}
    </results>
  </searchResult>`
          )
          .join('')
        content = `<?xml version="1.0" encoding="UTF-8"?>\n<mimeSearchResults>${xmlData}\n</mimeSearchResults>`
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
    link.download = filename || `mime-search-results${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResults }
}

// Generate text report from results
const generateTextFromResults = (results: MimeSearchResult[]): string => {
  return `MIME Type Search Results
=======================

Generated: ${new Date().toLocaleString()}
Total Searches: ${results.length}
Valid Searches: ${results.filter((result) => result.isValid).length}
Invalid Searches: ${results.filter((result) => !result.isValid).length}

Search Results:
${results
  .map((result, i) => {
    return `${i + 1}. Search Query: "${result.query}" (${result.queryType})
   Status: ${result.isValid ? 'Valid' : 'Invalid'}
   ${result.error ? `Error: ${result.error}` : ''}
   Results Found: ${result.results.length}
   Processing Time: ${result.statistics.processingTime.toFixed(2)}ms

   ${result.results.length > 0 ? 'MIME Types Found:' : 'No MIME types found'}
   ${result.results
     .map(
       (mime, j) => `
   ${j + 1}. ${mime.mimeType}
      Extensions: ${mime.extensions.join(', ')}
      Category: ${mime.category}
      Description: ${mime.description}
      Security Risk: ${mime.security.riskLevel}
      Standard: ${mime.isStandard ? 'Yes' : 'No'}
   `
     )
     .join('')}
`
  })
  .join('\n')}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Total MIME Types Found: ${results.reduce((sum, result) => sum + result.results.length, 0)}
- Average Results per Search: ${(results.reduce((sum, result) => sum + result.results.length, 0) / results.length).toFixed(1)}
`
}

/**
 * Enhanced MIME Type Search & Analysis Tool
 * Features: Advanced MIME search, type analysis, security assessment, browser compatibility
 */
const MimeSearchCore = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'batch' | 'analyzer' | 'templates'>('search')
  const [query, setQuery] = useState('')
  const [queryType, setQueryType] = useState<QueryType>('extension')
  const [currentResult, setCurrentResult] = useState<MimeSearchResult | null>(null)
  const [batches, setBatches] = useState<ProcessingBatch[]>([])
  const [batchInput, setBatchInput] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDetailedInfo, setShowDetailedInfo] = useState(false)
  const [settings, setSettings] = useState<ProcessingSettings>({
    searchMode: 'fuzzy',
    includeDeprecated: false,
    includeExperimental: false,
    includeVendorSpecific: false,
    caseSensitive: false,
    exactMatch: false,
    includeSecurityInfo: true,
    includeBrowserSupport: true,
    exportFormat: 'json',
    realTimeSearch: true,
    maxResults: 50,
  })

  const { performSearch, processBatch } = useMimeSearch()
  const { exportResults } = useMimeExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const queryValidation = useRealTimeValidation(query, queryType)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = mimeTemplates.find((t) => t.id === templateId)
    if (template) {
      setQuery(template.examples[0])
      setQueryType('extension')
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single search
  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setIsProcessing(true)
    try {
      const result = performSearch(query, queryType, settings)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success(`Found ${result.results.length} MIME type(s)`)
      } else {
        toast.error(result.error || 'Search failed')
      }
    } catch (error) {
      toast.error('Failed to perform search')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [query, queryType, settings, performSearch])

  // Handle batch processing
  const handleProcessBatch = useCallback(async () => {
    const lines = batchInput.split('\n').filter((line) => line.trim())
    const queries = lines.map((line) => {
      const [queryPart, typePart] = line.split('\t')
      return {
        query: queryPart.trim(),
        queryType: (typePart?.trim() as QueryType) || 'extension',
      }
    })

    if (queries.length === 0) {
      toast.error('Please enter search queries')
      return
    }

    setIsProcessing(true)
    try {
      const batch = processBatch(queries, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Processed ${batch.results.length} searches`)
    } catch (error) {
      toast.error('Failed to process batch')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, settings, processBatch])

  // Auto-search when real-time search is enabled
  useEffect(() => {
    if (settings.realTimeSearch && query.trim() && queryValidation.isValid) {
      const timer = setTimeout(() => {
        handleSearch()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [query, queryType, queryValidation.isValid, settings.realTimeSearch, handleSearch])

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
              <Database className="h-5 w-5" aria-hidden="true" />
              MIME Type Search & Analysis Tool
            </CardTitle>
            <CardDescription>
              Advanced MIME type search engine with comprehensive database, security analysis, and browser compatibility
              information. Search by file extension, MIME type, keyword, or category to find detailed information about
              file formats. Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'search' | 'batch' | 'analyzer' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              MIME Search
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Batch Search
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Type Analyzer
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* MIME Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Search Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    MIME Type Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="search-query" className="text-sm font-medium">
                        Search Query
                      </Label>
                      <Input
                        id="search-query"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter file extension, MIME type, or keyword..."
                        className="mt-2"
                        aria-label="MIME type search query"
                      />
                      {settings.realTimeSearch && query && (
                        <div className="mt-2 text-sm">
                          {queryValidation.isValid ? (
                            <div className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Valid search query
                            </div>
                          ) : queryValidation.error ? (
                            <div className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {queryValidation.error}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="query-type" className="text-sm font-medium">
                        Search Type
                      </Label>
                      <Select value={queryType} onValueChange={(value: QueryType) => setQueryType(value)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="extension">File Extension</SelectItem>
                          <SelectItem value="mimetype">MIME Type</SelectItem>
                          <SelectItem value="keyword">Keyword</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Search Examples */}
                  <div className="border rounded-lg p-3 bg-muted/50">
                    <Label className="text-sm font-medium mb-2 block">Search Examples</Label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <strong>Extension:</strong> jpg, png, pdf
                      </div>
                      <div>
                        <strong>MIME Type:</strong> image/jpeg, text/html
                      </div>
                      <div>
                        <strong>Keyword:</strong> image, video, document
                      </div>
                      <div>
                        <strong>Category:</strong> image, audio, application
                      </div>
                    </div>
                  </div>

                  {/* Search Settings */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Search Settings</Label>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="max-results" className="text-xs">
                          Max Results
                        </Label>
                        <Input
                          id="max-results"
                          type="number"
                          value={settings.maxResults}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, maxResults: parseInt(e.target.value) || 50 }))
                          }
                          min="1"
                          max="200"
                          className="h-8"
                        />
                      </div>

                      <div>
                        <Label htmlFor="search-mode" className="text-xs">
                          Search Mode
                        </Label>
                        <Select
                          value={settings.searchMode}
                          onValueChange={(value: SearchMode) => setSettings((prev) => ({ ...prev, searchMode: value }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fuzzy">Fuzzy</SelectItem>
                            <SelectItem value="exact">Exact</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="case-sensitive"
                          type="checkbox"
                          checked={settings.caseSensitive}
                          onChange={(e) => setSettings((prev) => ({ ...prev, caseSensitive: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="case-sensitive" className="text-xs">
                          Case sensitive search
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="exact-match"
                          type="checkbox"
                          checked={settings.exactMatch}
                          onChange={(e) => setSettings((prev) => ({ ...prev, exactMatch: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="exact-match" className="text-xs">
                          Exact match only
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-deprecated"
                          type="checkbox"
                          checked={settings.includeDeprecated}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeDeprecated: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-deprecated" className="text-xs">
                          Include deprecated types
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="real-time-search"
                          type="checkbox"
                          checked={settings.realTimeSearch}
                          onChange={(e) => setSettings((prev) => ({ ...prev, realTimeSearch: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="real-time-search" className="text-xs">
                          Real-time search
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSearch} disabled={!query.trim() || isProcessing} className="flex-1">
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Search MIME Types
                    </Button>
                    <Button
                      onClick={() => {
                        setQuery('')
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {queryValidation.warnings && queryValidation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Warnings:</h4>
                      <div className="text-xs space-y-1">
                        {queryValidation.warnings.map((warning, index) => (
                          <div key={index} className="text-yellow-700">
                            {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {queryValidation.suggestions && queryValidation.suggestions.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-blue-800">Suggestions:</h4>
                      <div className="text-xs space-y-1">
                        {queryValidation.suggestions.map((suggestion, index) => (
                          <div key={index} className="text-blue-700">
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Search Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Search Results
                    <div className="ml-auto">
                      <Button size="sm" variant="ghost" onClick={() => setShowDetailedInfo(!showDetailedInfo)}>
                        {showDetailedInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-2">
                          Search: "{currentResult.query}" ({currentResult.queryType})
                        </div>
                        <div className="text-sm">
                          <div>
                            <strong>Status:</strong> {currentResult.isValid ? 'Success' : 'Failed'}
                          </div>
                          <div>
                            <strong>Results Found:</strong> {currentResult.results.length}
                          </div>
                          <div>
                            <strong>Processing Time:</strong> {currentResult.statistics.processingTime.toFixed(2)}ms
                          </div>
                          {currentResult.error && (
                            <div className="text-red-600 mt-1">
                              <strong>Error:</strong> {currentResult.error}
                            </div>
                          )}
                        </div>
                      </div>

                      {currentResult.isValid && currentResult.results.length > 0 ? (
                        <div className="space-y-4">
                          {/* Results List */}
                          <div className="space-y-3">
                            {currentResult.results.map((mime, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-medium text-lg">{mime.mimeType}</h4>
                                    <p className="text-sm text-muted-foreground">{mime.commonName}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        mime.category === 'image'
                                          ? 'bg-blue-100 text-blue-800'
                                          : mime.category === 'video'
                                            ? 'bg-purple-100 text-purple-800'
                                            : mime.category === 'audio'
                                              ? 'bg-green-100 text-green-800'
                                              : mime.category === 'text'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {mime.category}
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        mime.security.riskLevel === 'high'
                                          ? 'bg-red-100 text-red-800'
                                          : mime.security.riskLevel === 'medium'
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-green-100 text-green-800'
                                      }`}
                                    >
                                      {mime.security.riskLevel} risk
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(mime.mimeType, 'MIME Type')}
                                    >
                                      {copiedText === 'MIME Type' ? (
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div>
                                      <strong>Extensions:</strong> {mime.extensions.map((ext) => `.${ext}`).join(', ')}
                                    </div>
                                    <div>
                                      <strong>Description:</strong> {mime.description}
                                    </div>
                                    <div>
                                      <strong>Standard:</strong> {mime.isStandard ? 'Yes' : 'No'}
                                    </div>
                                    {mime.rfc && (
                                      <div>
                                        <strong>RFC:</strong> {mime.rfc}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Usage:</strong> {mime.usage.join(', ')}
                                    </div>
                                    <div>
                                      <strong>Compression:</strong>{' '}
                                      {mime.compression.isCompressed ? mime.compression.compressionType : 'None'}
                                    </div>
                                    <div>
                                      <strong>Typical Size:</strong> {mime.compression.typicalSize}
                                    </div>
                                  </div>
                                </div>

                                {showDetailedInfo && (
                                  <div className="mt-4 space-y-3 border-t pt-3">
                                    {/* Security Information */}
                                    <div>
                                      <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Security Information
                                      </h5>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div>Executable: {mime.security.executable ? '⚠️ Yes' : '✅ No'}</div>
                                        <div>Scriptable: {mime.security.scriptable ? '⚠️ Yes' : '✅ No'}</div>
                                        <div>Malware Risk: {mime.security.canContainMalware ? '⚠️ Yes' : '✅ No'}</div>
                                        <div>
                                          Sandbox: {mime.security.requiresSandbox ? '⚠️ Required' : '✅ Not needed'}
                                        </div>
                                      </div>
                                      {mime.security.warnings.length > 0 && (
                                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                          <div className="text-xs text-yellow-800">
                                            <strong>Security Warnings:</strong>
                                            <ul className="list-disc list-inside mt-1">
                                              {mime.security.warnings.map((warning, i) => (
                                                <li key={i}>{warning}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Browser Support */}
                                    <div>
                                      <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        Browser Support
                                      </h5>
                                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                                        <div className={mime.browserSupport.chrome ? 'text-green-600' : 'text-red-600'}>
                                          Chrome: {mime.browserSupport.chrome ? '✅' : '❌'}
                                        </div>
                                        <div
                                          className={mime.browserSupport.firefox ? 'text-green-600' : 'text-red-600'}
                                        >
                                          Firefox: {mime.browserSupport.firefox ? '✅' : '❌'}
                                        </div>
                                        <div className={mime.browserSupport.safari ? 'text-green-600' : 'text-red-600'}>
                                          Safari: {mime.browserSupport.safari ? '✅' : '❌'}
                                        </div>
                                        <div className={mime.browserSupport.edge ? 'text-green-600' : 'text-red-600'}>
                                          Edge: {mime.browserSupport.edge ? '✅' : '❌'}
                                        </div>
                                        <div className={mime.browserSupport.ie ? 'text-green-600' : 'text-red-600'}>
                                          IE: {mime.browserSupport.ie ? '✅' : '❌'}
                                        </div>
                                        <div className={mime.browserSupport.mobile ? 'text-green-600' : 'text-red-600'}>
                                          Mobile: {mime.browserSupport.mobile ? '✅' : '❌'}
                                        </div>
                                      </div>
                                      {mime.browserSupport.notes.length > 0 && (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                          <strong>Notes:</strong> {mime.browserSupport.notes.join(', ')}
                                        </div>
                                      )}
                                    </div>

                                    {/* Compression Information */}
                                    {mime.compression.isCompressed && (
                                      <div>
                                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                          <Archive className="h-4 w-4" />
                                          Compression Details
                                        </h5>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div>
                                            <strong>Type:</strong> {mime.compression.compressionType}
                                          </div>
                                          <div>
                                            <strong>Typical Size:</strong> {mime.compression.typicalSize}
                                          </div>
                                          {mime.compression.compressionRatio && (
                                            <div>
                                              <strong>Compression Ratio:</strong> {mime.compression.compressionRatio}:1
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Statistics */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Search Statistics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Total Results:</strong> {currentResult.statistics.resultCount}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Security Risks:</strong> {currentResult.statistics.securityRiskCount}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Standard Types:</strong> {currentResult.statistics.standardCompliantCount}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Processing Time:</strong> {currentResult.statistics.processingTime.toFixed(2)}
                                  ms
                                </div>
                              </div>
                            </div>

                            {Object.keys(currentResult.statistics.categoryDistribution).length > 0 && (
                              <div className="mt-3">
                                <div className="text-sm font-medium mb-2">Category Distribution:</div>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(currentResult.statistics.categoryDistribution).map(
                                    ([category, count]) => (
                                      <span key={category} className="px-2 py-1 bg-muted rounded text-xs">
                                        {category}: {count}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : currentResult.isValid ? (
                        <div className="text-center py-8">
                          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                          <p className="text-muted-foreground mb-4">
                            No MIME types found for "{currentResult.query}". Try a different search term or adjust your
                            search settings.
                          </p>
                        </div>
                      ) : null}

                      {currentResult.isValid && currentResult.results.length > 0 && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => exportResults([currentResult], settings.exportFormat)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export Results
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Search Performed</h3>
                      <p className="text-muted-foreground mb-4">
                        Enter a search query to find MIME types and file format information
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Search Tab */}
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Batch MIME Search
                </CardTitle>
                <CardDescription>
                  Search multiple MIME types simultaneously (one per line, optional tab-separated type)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batch-input" className="text-sm font-medium">
                      Search Queries (one per line, format: query[tab]type)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder="jpg&#10;image/png&#9;mimetype&#10;video&#9;keyword&#10;application&#9;category"
                      className="mt-2 min-h-[200px] font-mono text-sm"
                      aria-label="Batch MIME search input"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">
                      Format: query[tab]type (type is optional, defaults to 'extension')
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleProcessBatch} disabled={!batchInput.trim() || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Search Batch
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
                            <h4 className="font-medium">{batch.count} searches processed</h4>
                            <div className="text-sm text-muted-foreground">
                              {batch.createdAt.toLocaleString()} • {batch.statistics.successRate.toFixed(1)}% success
                              rate
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => exportResults(batch.results, 'csv')}>
                              <Download className="mr-2 h-4 w-4" />
                              Export CSV
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
                            <span className="font-medium">Total Results:</span> {batch.statistics.totalResults}
                          </div>
                        </div>

                        {/* Distribution Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Category Distribution</h5>
                            <div className="space-y-1">
                              {Object.entries(batch.statistics.categoryDistribution).map(([category, count]) => (
                                <div key={category} className="flex justify-between text-xs">
                                  <span>{category}:</span>
                                  <span>{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2">Security Risk Distribution</h5>
                            <div className="space-y-1">
                              {Object.entries(batch.statistics.securityDistribution).map(([risk, count]) => (
                                <div key={risk} className="flex justify-between text-xs">
                                  <span
                                    className={
                                      risk === 'high'
                                        ? 'text-red-600'
                                        : risk === 'medium'
                                          ? 'text-orange-600'
                                          : 'text-green-600'
                                    }
                                  >
                                    {risk}:
                                  </span>
                                  <span>{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.results.slice(0, 5).map((result) => (
                              <div key={result.id} className="text-xs border rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">
                                    "{result.query}" ({result.queryType})
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      result.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {result.isValid ? `${result.results.length} found` : 'Failed'}
                                  </span>
                                </div>
                                {result.isValid && result.results.length > 0 && (
                                  <div className="text-muted-foreground mt-1">
                                    Top results:{' '}
                                    {result.results
                                      .slice(0, 3)
                                      .map((mime) => mime.mimeType)
                                      .join(', ')}
                                    {result.results.length > 3 && ` +${result.results.length - 3} more`}
                                  </div>
                                )}
                                {result.error && <div className="text-red-600 mt-1">{result.error}</div>}
                              </div>
                            ))}
                            {batch.results.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.results.length - 5} more searches
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

          {/* Type Analyzer Tab */}
          <TabsContent value="analyzer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  MIME Type Analyzer
                </CardTitle>
                <CardDescription>Analyze MIME types by category and security risk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Category Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(['image', 'video', 'audio', 'text', 'application'] as MimeCategory[]).map((category) => {
                      const categoryMimes = getMimesByCategory(category)
                      const securityRisks = getSecurityRisks(categoryMimes)

                      return (
                        <Card key={category}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              {category === 'image' && <FileImage className="h-4 w-4" />}
                              {category === 'video' && <FileVideo className="h-4 w-4" />}
                              {category === 'audio' && <FileAudio className="h-4 w-4" />}
                              {category === 'text' && <FileText className="h-4 w-4" />}
                              {category === 'application' && <File className="h-4 w-4" />}
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm space-y-2">
                            <div>Total Types: {categoryMimes.length}</div>
                            <div>Security Risks: {securityRisks.length}</div>
                            <div>Standard Types: {categoryMimes.filter((m) => m.isStandard).length}</div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              onClick={() => {
                                setQuery(category)
                                setQueryType('category')
                                setActiveTab('search')
                              }}
                            >
                              View All {category}
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Security Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Security Risk Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(['high', 'medium', 'low'] as SecurityRisk[]).map((riskLevel) => {
                          const riskMimes = mimeDatabase.filter((mime) => mime.security.riskLevel === riskLevel)

                          return (
                            <div key={riskLevel} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4
                                  className={`font-medium text-sm ${
                                    riskLevel === 'high'
                                      ? 'text-red-700'
                                      : riskLevel === 'medium'
                                        ? 'text-orange-700'
                                        : 'text-green-700'
                                  }`}
                                >
                                  {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk ({riskMimes.length}{' '}
                                  types)
                                </h4>
                              </div>
                              <div className="text-xs space-y-1">
                                {riskMimes.slice(0, 5).map((mime) => (
                                  <div key={mime.mimeType} className="flex justify-between">
                                    <span>{mime.mimeType}</span>
                                    <span className="text-muted-foreground">{mime.extensions.join(', ')}</span>
                                  </div>
                                ))}
                                {riskMimes.length > 5 && (
                                  <div className="text-muted-foreground">... and {riskMimes.length - 5} more</div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Database Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Database Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Total MIME Types</div>
                          <div className="text-2xl font-bold">{mimeDatabase.length}</div>
                        </div>
                        <div>
                          <div className="font-medium">Standard Types</div>
                          <div className="text-2xl font-bold">{mimeDatabase.filter((m) => m.isStandard).length}</div>
                        </div>
                        <div>
                          <div className="font-medium">Security Risks</div>
                          <div className="text-2xl font-bold">
                            {mimeDatabase.filter((m) => m.security.riskLevel !== 'minimal').length}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Categories</div>
                          <div className="text-2xl font-bold">{new Set(mimeDatabase.map((m) => m.category)).size}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  MIME Search Templates
                </CardTitle>
                <CardDescription>Pre-built search templates for common file types and use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mimeTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs font-medium mb-1">Examples:</div>
                            <div className="flex flex-wrap gap-1">
                              {template.examples.map((example, index) => (
                                <span key={index} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                  {example}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Search Terms:</div>
                            <div className="text-xs text-muted-foreground">{template.searchTerms.join(', ')}</div>
                          </div>
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
                Search Settings
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
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="txt">Text Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Advanced Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        id="include-security"
                        type="checkbox"
                        checked={settings.includeSecurityInfo}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeSecurityInfo: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="include-security" className="text-xs">
                        Include security information
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="include-browser"
                        type="checkbox"
                        checked={settings.includeBrowserSupport}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeBrowserSupport: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="include-browser" className="text-xs">
                        Include browser support
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {batches.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      const allResults = batches.flatMap((batch) => batch.results)
                      exportResults(allResults, 'txt', 'mime-search-report.txt')
                    }}
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export All Statistics
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
const MimeSearch = () => {
  return <MimeSearchCore />
}

export default MimeSearch
