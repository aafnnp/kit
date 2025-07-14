import React, { useCallback, useEffect, useState } from 'react'
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
  Target,
  Copy,
  Check,
  Shuffle,
  RotateCcw,
  Zap,
  Settings,
  CheckCircle2,
  AlertCircle,
  Timer,
  RefreshCw,
  Clock,
  Globe,
  Play,
  Pause,
} from 'lucide-react'

// Enhanced Types
interface TimestampItem {
  id: string
  input: string
  inputType: TimestampFormat
  outputs: TimestampOutput[]
  timezone: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  isValid: boolean
}

interface TimestampOutput {
  format: TimestampFormat
  value: string
  timezone: string
  isValid: boolean
  relativeTime?: string
}

interface TimestampBatch {
  id: string
  items: TimestampItem[]
  count: number
  settings: TimestampSettings
  createdAt: Date
  statistics: TimestampStatistics
}

interface TimestampStatistics {
  totalProcessed: number
  validCount: number
  invalidCount: number
  formatDistribution: Record<string, number>
  timezoneDistribution: Record<string, number>
  averageProcessingTime: number
  totalProcessingTime: number
  successRate: number
}

interface TimestampSettings {
  inputFormat: TimestampFormat
  outputFormats: TimestampFormat[]
  timezone: string
  includeRelativeTime: boolean
  includeTimestamp: boolean
  batchProcessing: boolean
  realTimeConversion: boolean
  exportFormat: ExportFormat
  autoRefresh: boolean
  refreshInterval: number
}

interface TimestampTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<TimestampSettings>
  formats: TimestampFormat[]
}

interface CurrentTime {
  unix: number
  unixMs: number
  iso: string
  rfc2822: string
  local: string
  utc: string
  timezone: string
  relativeTime: string
}

interface TimezoneInfo {
  name: string
  offset: string
  abbreviation: string
  isDST: boolean
}

// Enums
type TimestampFormat = 'unix' | 'unix-ms' | 'iso8601' | 'rfc2822' | 'local' | 'utc' | 'custom'
type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'

// Utility functions
const generateId = (): string => Math.random().toString(36).substring(2, 11)

const validateTimestampInput = (input: string, format: TimestampFormat): { isValid: boolean; error?: string } => {
  if (!input.trim()) {
    return { isValid: false, error: 'Input cannot be empty' }
  }

  try {
    switch (format) {
      case 'unix':
        const unixNum = Number(input)
        if (isNaN(unixNum) || unixNum < 0 || unixNum > 2147483647) {
          return { isValid: false, error: 'Invalid Unix timestamp (must be between 0 and 2147483647)' }
        }
        break
      case 'unix-ms':
        const unixMsNum = Number(input)
        if (isNaN(unixMsNum) || unixMsNum < 0) {
          return { isValid: false, error: 'Invalid Unix milliseconds timestamp' }
        }
        break
      case 'iso8601':
        const isoDate = new Date(input)
        if (isNaN(isoDate.getTime())) {
          return { isValid: false, error: 'Invalid ISO 8601 format' }
        }
        break
      case 'rfc2822':
        const rfcDate = new Date(input)
        if (isNaN(rfcDate.getTime())) {
          return { isValid: false, error: 'Invalid RFC 2822 format' }
        }
        break
      case 'local':
      case 'utc':
        const date = new Date(input)
        if (isNaN(date.getTime())) {
          return { isValid: false, error: 'Invalid date format' }
        }
        break
      default:
        return { isValid: true }
    }

    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: 'Invalid timestamp format' }
  }
}

// Timezone utilities
const getTimezoneOffset = (timezone: string): string => {
  try {
    const offset = getTimezoneOffsetMinutes(timezone)
    const hours = Math.floor(Math.abs(offset) / 60)
    const minutes = Math.abs(offset) % 60
    const sign = offset >= 0 ? '+' : '-'
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  } catch {
    return '+00:00'
  }
}

const getTimezoneOffsetMinutes = (timezone: string): number => {
  try {
    const date = new Date()
    const targetDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
    const localDate = new Date(date.toLocaleString('en-US'))
    return (targetDate.getTime() - localDate.getTime()) / 60000
  } catch {
    return 0
  }
}

const getRelativeTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(Math.abs(diff) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  const future = diff < 0
  const prefix = future ? 'in ' : ''
  const suffix = future ? '' : ' ago'

  if (years > 0) return `${prefix}${years} year${years > 1 ? 's' : ''}${suffix}`
  if (months > 0) return `${prefix}${months} month${months > 1 ? 's' : ''}${suffix}`
  if (days > 0) return `${prefix}${days} day${days > 1 ? 's' : ''}${suffix}`
  if (hours > 0) return `${prefix}${hours} hour${hours > 1 ? 's' : ''}${suffix}`
  if (minutes > 0) return `${prefix}${minutes} minute${minutes > 1 ? 's' : ''}${suffix}`
  if (seconds > 0) return `${prefix}${seconds} second${seconds > 1 ? 's' : ''}${suffix}`
  return 'just now'
}

// Convert timestamp between formats
const convertTimestamp = (
  input: string,
  inputFormat: TimestampFormat,
  outputFormat: TimestampFormat,
  timezone: string = 'UTC'
): TimestampOutput => {
  try {
    let date: Date

    // Parse input based on format
    switch (inputFormat) {
      case 'unix':
        date = new Date(Number(input) * 1000)
        break
      case 'unix-ms':
        date = new Date(Number(input))
        break
      case 'iso8601':
      case 'rfc2822':
      case 'local':
      case 'utc':
        date = new Date(input)
        break
      default:
        date = new Date(input)
    }

    if (isNaN(date.getTime())) {
      return {
        format: outputFormat,
        value: 'Invalid timestamp',
        timezone,
        isValid: false,
      }
    }

    // Convert to output format
    let value: string
    switch (outputFormat) {
      case 'unix':
        value = Math.floor(date.getTime() / 1000).toString()
        break
      case 'unix-ms':
        value = date.getTime().toString()
        break
      case 'iso8601':
        value = date.toISOString()
        break
      case 'rfc2822':
        value = date.toUTCString()
        break
      case 'local':
        value = date.toLocaleString('en-US', { timeZone: timezone })
        break
      case 'utc':
        value = date.toUTCString()
        break
      default:
        value = date.toString()
    }

    return {
      format: outputFormat,
      value,
      timezone,
      isValid: true,
      relativeTime: getRelativeTime(date.getTime()),
    }
  } catch (error) {
    return {
      format: outputFormat,
      value: 'Conversion error',
      timezone,
      isValid: false,
    }
  }
}

// Convert multiple formats
const convertToMultipleFormats = (
  input: string,
  inputFormat: TimestampFormat,
  outputFormats: TimestampFormat[],
  timezone: string = 'UTC'
): TimestampOutput[] => {
  return outputFormats.map((format) => convertTimestamp(input, inputFormat, format, timezone))
}

// Get current time in all formats
const getCurrentTime = (timezone: string = 'UTC'): CurrentTime => {
  const now = new Date()
  const unix = Math.floor(now.getTime() / 1000)
  const unixMs = now.getTime()

  return {
    unix,
    unixMs,
    iso: now.toISOString(),
    rfc2822: now.toUTCString(),
    local: now.toLocaleString('en-US', { timeZone: timezone }),
    utc: now.toUTCString(),
    timezone,
    relativeTime: 'now',
  }
}

// Common timezones
const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'America/Denver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
]

// Get timezone info
const getTimezoneInfo = (timezone: string): TimezoneInfo => {
  try {
    const date = new Date()
    const offset = getTimezoneOffset(timezone)

    return {
      name: timezone,
      offset,
      abbreviation:
        date
          .toLocaleString('en-US', {
            timeZone: timezone,
            timeZoneName: 'short',
          })
          .split(' ')
          .pop() || '',
      isDST: false, // Simplified - would need more complex logic for accurate DST detection
    }
  } catch {
    return {
      name: timezone,
      offset: '+00:00',
      abbreviation: 'UTC',
      isDST: false,
    }
  }
}

// Timestamp templates with different use cases
const timestampTemplates: TimestampTemplate[] = [
  {
    id: 'developer-standard',
    name: 'Developer Standard',
    description: 'Common formats for software development',
    category: 'Development',
    settings: {
      inputFormat: 'unix',
      outputFormats: ['unix', 'unix-ms', 'iso8601', 'local'],
      timezone: 'UTC',
      includeRelativeTime: true,
      batchProcessing: true,
      realTimeConversion: true,
    },
    formats: ['unix', 'unix-ms', 'iso8601', 'local'],
  },
  {
    id: 'web-api',
    name: 'Web API',
    description: 'Formats commonly used in web APIs',
    category: 'API',
    settings: {
      inputFormat: 'iso8601',
      outputFormats: ['iso8601', 'unix', 'rfc2822'],
      timezone: 'UTC',
      includeRelativeTime: false,
      batchProcessing: true,
      realTimeConversion: true,
    },
    formats: ['iso8601', 'unix', 'rfc2822'],
  },
  {
    id: 'database-migration',
    name: 'Database Migration',
    description: 'Formats for database timestamp migration',
    category: 'Database',
    settings: {
      inputFormat: 'local',
      outputFormats: ['unix', 'iso8601', 'utc'],
      timezone: 'UTC',
      includeRelativeTime: false,
      batchProcessing: true,
      realTimeConversion: false,
    },
    formats: ['unix', 'iso8601', 'utc'],
  },
  {
    id: 'log-analysis',
    name: 'Log Analysis',
    description: 'Formats for analyzing log timestamps',
    category: 'Analysis',
    settings: {
      inputFormat: 'rfc2822',
      outputFormats: ['unix', 'local', 'iso8601'],
      timezone: 'America/New_York',
      includeRelativeTime: true,
      batchProcessing: true,
      realTimeConversion: true,
    },
    formats: ['unix', 'local', 'iso8601'],
  },
  {
    id: 'timezone-converter',
    name: 'Timezone Converter',
    description: 'Convert between different timezones',
    category: 'Timezone',
    settings: {
      inputFormat: 'local',
      outputFormats: ['local', 'utc'],
      timezone: 'America/Los_Angeles',
      includeRelativeTime: true,
      batchProcessing: false,
      realTimeConversion: true,
    },
    formats: ['local', 'utc'],
  },
  {
    id: 'quick-convert',
    name: 'Quick Convert',
    description: 'Fast conversion for common use cases',
    category: 'Quick',
    settings: {
      inputFormat: 'unix',
      outputFormats: ['local'],
      timezone: 'UTC',
      includeRelativeTime: true,
      batchProcessing: false,
      realTimeConversion: true,
    },
    formats: ['local'],
  },
]

// Error boundary component
class UnixTimestampErrorBoundary extends React.Component<
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
    console.error('Unix Timestamp error:', error, errorInfo)
    toast.error('An unexpected error occurred during timestamp processing')
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
const useTimestampConversion = () => {
  const convertSingle = useCallback(
    (
      input: string,
      inputFormat: TimestampFormat,
      outputFormats: TimestampFormat[],
      timezone: string
    ): TimestampItem => {
      try {
        const validation = validateTimestampInput(input, inputFormat)
        if (!validation.isValid) {
          return {
            id: generateId(),
            input,
            inputType: inputFormat,
            outputs: [],
            timezone,
            status: 'error',
            error: validation.error,
            isValid: false,
          }
        }

        const outputs = convertToMultipleFormats(input, inputFormat, outputFormats, timezone)

        return {
          id: generateId(),
          input,
          inputType: inputFormat,
          outputs,
          timezone,
          status: 'completed',
          processedAt: new Date(),
          isValid: outputs.every((o) => o.isValid),
        }
      } catch (error) {
        console.error('Timestamp conversion error:', error)
        return {
          id: generateId(),
          input,
          inputType: inputFormat,
          outputs: [],
          timezone,
          status: 'error',
          error: error instanceof Error ? error.message : 'Conversion failed',
          isValid: false,
        }
      }
    },
    []
  )

  const convertBatch = useCallback(
    (inputs: string[], settings: TimestampSettings): TimestampBatch => {
      try {
        const items = inputs.map((input) =>
          convertSingle(input, settings.inputFormat, settings.outputFormats, settings.timezone)
        )

        const validCount = items.filter((item) => item.isValid).length
        const invalidCount = items.length - validCount

        const statistics: TimestampStatistics = {
          totalProcessed: items.length,
          validCount,
          invalidCount,
          formatDistribution: items.reduce(
            (acc, item) => {
              acc[item.inputType] = (acc[item.inputType] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          ),
          timezoneDistribution: items.reduce(
            (acc, item) => {
              acc[item.timezone] = (acc[item.timezone] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          ),
          averageProcessingTime: 0,
          totalProcessingTime: 0,
          successRate: (validCount / items.length) * 100,
        }

        return {
          id: generateId(),
          items,
          count: items.length,
          settings,
          createdAt: new Date(),
          statistics,
        }
      } catch (error) {
        console.error('Batch conversion error:', error)
        throw new Error(error instanceof Error ? error.message : 'Batch conversion failed')
      }
    },
    [convertSingle]
  )

  return { convertSingle, convertBatch }
}

// Real-time timestamp hook
const useRealTimeTimestamp = (timezone: string = 'UTC') => {
  const [currentTime, setCurrentTime] = useState<CurrentTime>(() => getCurrentTime(timezone))
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime(timezone))
    }, 1000)

    return () => clearInterval(interval)
  }, [timezone, isRunning])

  const toggle = useCallback(() => {
    setIsRunning((prev: boolean) => !prev)
  }, [])

  const refresh = useCallback(() => {
    setCurrentTime(getCurrentTime(timezone))
  }, [timezone])

  return { currentTime, isRunning, toggle, refresh }
}

// Export functionality
const useTimestampExport = () => {
  const exportTimestamps = useCallback((items: TimestampItem[], format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(items, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVFromTimestamps(items)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'xml':
        content = generateXMLFromTimestamps(items)
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'txt':
      default:
        content = generateTextFromTimestamps(items)
        mimeType = 'text/plain'
        extension = '.txt'
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `timestamps${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (batch: TimestampBatch) => {
      exportTimestamps(batch.items, 'json', `timestamp-batch-${batch.id}.json`)
      toast.success(`Exported ${batch.items.length} timestamps`)
    },
    [exportTimestamps]
  )

  const exportStatistics = useCallback((batches: TimestampBatch[]) => {
    const stats = batches.map((batch) => ({
      batchId: batch.id,
      itemCount: batch.count,
      validCount: batch.statistics.validCount,
      invalidCount: batch.statistics.invalidCount,
      successRate: batch.statistics.successRate.toFixed(2),
      createdAt: batch.createdAt.toISOString(),
    }))

    const csvContent = [
      ['Batch ID', 'Item Count', 'Valid Count', 'Invalid Count', 'Success Rate (%)', 'Created At'],
      ...stats.map((stat) => [
        stat.batchId,
        stat.itemCount.toString(),
        stat.validCount.toString(),
        stat.invalidCount.toString(),
        stat.successRate,
        stat.createdAt,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'timestamp-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportTimestamps, exportBatch, exportStatistics }
}

// Generate export formats
const generateTextFromTimestamps = (items: TimestampItem[]): string => {
  return `Timestamp Conversion Report
==========================

Generated: ${new Date().toLocaleString()}
Total Items: ${items.length}
Valid Items: ${items.filter((item) => item.isValid).length}
Invalid Items: ${items.filter((item) => !item.isValid).length}

Conversions:
${items
  .map((item, i) => {
    const outputs = item.outputs.map((output) => `  ${output.format}: ${output.value}`).join('\n')
    return `${i + 1}. Input: ${item.input} (${item.inputType})
${outputs}
   Status: ${item.isValid ? 'Valid' : 'Invalid'}
   ${item.error ? `Error: ${item.error}` : ''}
`
  })
  .join('\n')}

Statistics:
- Success Rate: ${((items.filter((item) => item.isValid).length / items.length) * 100).toFixed(1)}%
`
}

const generateCSVFromTimestamps = (items: TimestampItem[]): string => {
  const rows = [
    ['Input', 'Input Type', 'Output Format', 'Output Value', 'Timezone', 'Relative Time', 'Status', 'Error'],
  ]

  items.forEach((item) => {
    if (item.outputs.length === 0) {
      rows.push([
        item.input,
        item.inputType,
        '',
        '',
        item.timezone,
        '',
        item.isValid ? 'Valid' : 'Invalid',
        item.error || '',
      ])
    } else {
      item.outputs.forEach((output) => {
        rows.push([
          item.input,
          item.inputType,
          output.format,
          output.value,
          output.timezone,
          output.relativeTime || '',
          output.isValid ? 'Valid' : 'Invalid',
          item.error || '',
        ])
      })
    }
  })

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

const generateXMLFromTimestamps = (items: TimestampItem[]): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<timestamps>
  <metadata>
    <generated>${new Date().toISOString()}</generated>
    <count>${items.length}</count>
    <validCount>${items.filter((item) => item.isValid).length}</validCount>
  </metadata>
  <items>
    ${items
      .map(
        (item) => `
    <item>
      <input>${item.input}</input>
      <inputType>${item.inputType}</inputType>
      <timezone>${item.timezone}</timezone>
      <status>${item.isValid ? 'valid' : 'invalid'}</status>
      ${item.error ? `<error>${item.error}</error>` : ''}
      <outputs>
        ${item.outputs
          .map(
            (output) => `
        <output>
          <format>${output.format}</format>
          <value>${output.value}</value>
          <timezone>${output.timezone}</timezone>
          <relativeTime>${output.relativeTime || ''}</relativeTime>
          <valid>${output.isValid}</valid>
        </output>`
          )
          .join('')}
      </outputs>
    </item>`
      )
      .join('')}
  </items>
</timestamps>`
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
 * Enhanced Unix Timestamp Tool
 * Features: Multiple formats, timezone support, batch processing, comprehensive analysis
 */
const UnixTimestampCore = () => {
  const [activeTab, setActiveTab] = useState<'converter' | 'batch' | 'current'>('converter')
  const [currentInput, setCurrentInput] = useState('')
  const [currentResult, setCurrentResult] = useState<TimestampItem | null>(null)
  const [batches, setBatches] = useState<TimestampBatch[]>([])
  const [batchInput, setBatchInput] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('developer-standard')
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<TimestampSettings>({
    inputFormat: 'unix',
    outputFormats: ['unix', 'unix-ms', 'iso8601', 'local'],
    timezone: 'UTC',
    includeRelativeTime: true,
    includeTimestamp: true,
    batchProcessing: true,
    realTimeConversion: true,
    exportFormat: 'json',
    autoRefresh: true,
    refreshInterval: 1000,
  })

  const { convertSingle, convertBatch } = useTimestampConversion()
  const { exportTimestamps, exportBatch, exportStatistics } = useTimestampExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const { currentTime, isRunning, toggle, refresh } = useRealTimeTimestamp(settings.timezone)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = timestampTemplates.find((t) => t.id === templateId)
    if (template && template.settings) {
      setSettings((prev: any) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single conversion
  const handleConvertSingle = useCallback(async () => {
    if (!currentInput.trim()) {
      toast.error('Please enter a timestamp to convert')
      return
    }

    setIsProcessing(true)
    try {
      const result = convertSingle(currentInput, settings.inputFormat, settings.outputFormats, settings.timezone)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success('Timestamp converted successfully')
      } else {
        toast.error(result.error || 'Conversion failed')
      }
    } catch (error) {
      toast.error('Failed to convert timestamp')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [currentInput, settings, convertSingle])

  // Handle batch conversion
  const handleConvertBatch = useCallback(async () => {
    const inputs = batchInput.split('\n').filter((line: string) => line.trim())

    if (inputs.length === 0) {
      toast.error('Please enter timestamps to convert')
      return
    }

    setIsProcessing(true)
    try {
      const batch = convertBatch(inputs, settings)
      setBatches((prev: any) => [batch, ...prev])
      toast.success(`Converted ${batch.items.length} timestamps`)
    } catch (error) {
      toast.error('Failed to convert batch')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, settings, convertBatch])

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
              <Clock className="h-5 w-5" aria-hidden="true" />
              Unix Timestamp & Timezone Converter
            </CardTitle>
            <CardDescription>
              Advanced timestamp conversion tool with multiple formats, timezone support, and batch processing. Convert
              between Unix timestamps, ISO 8601, RFC 2822, and local time formats with comprehensive analysis. Use
              keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'converter' | 'batch' | 'current')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="converter" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timestamp Converter
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Current Time
            </TabsTrigger>
          </TabsList>

          {/* Timestamp Converter Tab */}
          <TabsContent value="converter" className="space-y-4">
            {/* Timestamp Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Conversion Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {timestampTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? 'default' : 'outline'}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div className="text-xs font-mono mt-2 p-1 bg-muted/30 rounded flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.formats.length} formats • {template.category}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Conversion Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Conversion Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="input-format" className="text-sm font-medium">
                      Input Format
                    </Label>
                    <Select
                      value={settings.inputFormat}
                      onValueChange={(value: TimestampFormat) =>
                        setSettings((prev) => ({ ...prev, inputFormat: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unix">Unix Timestamp (seconds)</SelectItem>
                        <SelectItem value="unix-ms">Unix Timestamp (milliseconds)</SelectItem>
                        <SelectItem value="iso8601">ISO 8601</SelectItem>
                        <SelectItem value="rfc2822">RFC 2822</SelectItem>
                        <SelectItem value="local">Local Date/Time</SelectItem>
                        <SelectItem value="utc">UTC Date/Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone" className="text-sm font-medium">
                      Timezone
                    </Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value: string) => setSettings((prev: any) => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz} ({getTimezoneOffset(tz)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Output Formats</Label>
                    <div className="space-y-2">
                      {(['unix', 'unix-ms', 'iso8601', 'rfc2822', 'local', 'utc'] as TimestampFormat[]).map(
                        (format) => (
                          <div key={format} className="flex items-center space-x-2">
                            <input
                              id={`format-${format}`}
                              type="checkbox"
                              checked={settings.outputFormats.includes(format)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSettings((prev: any) => ({
                                    ...prev,
                                    outputFormats: [...prev.outputFormats, format],
                                  }))
                                } else {
                                  setSettings((prev: any) => ({
                                    ...prev,
                                    outputFormats: prev.outputFormats.filter((f: any) => f !== format),
                                  }))
                                }
                              }}
                              className="rounded border-input"
                            />
                            <Label htmlFor={`format-${format}`} className="text-sm">
                              {format === 'unix'
                                ? 'Unix Timestamp (seconds)'
                                : format === 'unix-ms'
                                  ? 'Unix Timestamp (milliseconds)'
                                  : format === 'iso8601'
                                    ? 'ISO 8601'
                                    : format === 'rfc2822'
                                      ? 'RFC 2822'
                                      : format === 'local'
                                        ? 'Local Date/Time'
                                        : 'UTC Date/Time'}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id="include-relative-time"
                        type="checkbox"
                        checked={settings.includeRelativeTime}
                        onChange={(e) =>
                          setSettings((prev: any) => ({ ...prev, includeRelativeTime: e.target.checked }))
                        }
                        className="rounded border-input"
                      />
                      <Label htmlFor="include-relative-time" className="text-sm">
                        Include relative time (e.g., "2 hours ago")
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="real-time-conversion"
                        type="checkbox"
                        checked={settings.realTimeConversion}
                        onChange={(e) =>
                          setSettings((prev: any) => ({ ...prev, realTimeConversion: e.target.checked }))
                        }
                        className="rounded border-input"
                      />
                      <Label htmlFor="real-time-conversion" className="text-sm">
                        Real-time conversion
                      </Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="timestamp-input" className="text-sm font-medium">
                      Timestamp Input
                    </Label>
                    <Input
                      id="timestamp-input"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder={`Enter ${settings.inputFormat} timestamp...`}
                      className="mt-2"
                      aria-label="Timestamp input for conversion"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleConvertSingle} disabled={!currentInput.trim() || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Convert
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentInput('')
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Conversion Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-2">Input</div>
                        <div className="font-mono text-sm bg-muted p-2 rounded">
                          {currentResult.input} ({currentResult.inputType})
                        </div>
                      </div>

                      {currentResult.isValid ? (
                        <div className="space-y-3">
                          {currentResult.outputs.map((output: any, index: number) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="font-medium text-sm">
                                  {output.format === 'unix'
                                    ? 'Unix Timestamp (seconds)'
                                    : output.format === 'unix-ms'
                                      ? 'Unix Timestamp (milliseconds)'
                                      : output.format === 'iso8601'
                                        ? 'ISO 8601'
                                        : output.format === 'rfc2822'
                                          ? 'RFC 2822'
                                          : output.format === 'local'
                                            ? 'Local Date/Time'
                                            : 'UTC Date/Time'}
                                </Label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(output.value, output.format)}
                                >
                                  {copiedText === output.format ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <div className="font-mono text-sm bg-muted p-2 rounded break-all">{output.value}</div>
                              {output.relativeTime && settings.includeRelativeTime && (
                                <div className="text-xs text-muted-foreground mt-2">{output.relativeTime}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Conversion Error</span>
                          </div>
                          <div className="text-red-700 text-sm mt-1">{currentResult.error}</div>
                        </div>
                      )}

                      {currentResult.isValid && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => exportTimestamps([currentResult], settings.exportFormat)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export Result
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Conversion Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Enter a timestamp and click convert to see the results
                      </p>
                    </div>
                  )}
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
                  Batch Timestamp Conversion
                </CardTitle>
                <CardDescription>Convert multiple timestamps at once (one per line)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batch-input" className="text-sm font-medium">
                      Timestamps (one per line)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder={`Enter ${settings.inputFormat} timestamps, one per line...`}
                      className="mt-2 min-h-[120px] font-mono"
                      aria-label="Batch timestamp input"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleConvertBatch} disabled={!batchInput.trim() || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Convert Batch
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
                    {batches.map((batch: any) => (
                      <div key={batch.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{batch.count} timestamps processed</h4>
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
                              onClick={() => setBatches((prev: any) => prev.filter((b: any) => b.id !== batch.id))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Valid:</span> {batch.statistics.validCount}
                          </div>
                          <div>
                            <span className="font-medium">Invalid:</span> {batch.statistics.invalidCount}
                          </div>
                        </div>

                        <div className="mt-3 max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.items.slice(0, 5).map((item: any) => (
                              <div key={item.id} className="text-xs border rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">{item.input}</span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      item.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {item.isValid ? 'Valid' : 'Invalid'}
                                  </span>
                                </div>
                                {item.error && <div className="text-red-600 mt-1">{item.error}</div>}
                              </div>
                            ))}
                            {batch.items.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.items.length - 5} more items
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

          {/* Current Time Tab */}
          <TabsContent value="current" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Current Time ({settings.timezone})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={toggle}>
                      {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {isRunning ? 'Pause' : 'Resume'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={refresh}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Unix Timestamp (seconds)', value: currentTime.unix.toString(), key: 'unix' },
                    { label: 'Unix Timestamp (milliseconds)', value: currentTime.unixMs.toString(), key: 'unix-ms' },
                    { label: 'ISO 8601', value: currentTime.iso, key: 'iso' },
                    { label: 'RFC 2822', value: currentTime.rfc2822, key: 'rfc2822' },
                    { label: 'Local Time', value: currentTime.local, key: 'local' },
                    { label: 'UTC Time', value: currentTime.utc, key: 'utc' },
                  ].map((item) => (
                    <div key={item.key} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium text-sm">{item.label}</Label>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(item.value, item.label)}>
                          {copiedText === item.label ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="font-mono text-sm bg-muted p-2 rounded break-all">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Timezone:</span> {currentTime.timezone}
                    </div>
                    <div>
                      <span className="font-medium">Offset:</span> {getTimezoneOffset(settings.timezone)}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {isRunning ? 'Live' : 'Paused'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timezone Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Timezone Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COMMON_TIMEZONES.map((tz) => {
                    const info = getTimezoneInfo(tz)
                    const time = getCurrentTime(tz)
                    return (
                      <div key={tz} className="border rounded-lg p-3">
                        <div className="font-medium text-sm mb-1">{tz}</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {info.offset} • {info.abbreviation}
                        </div>
                        <div className="font-mono text-xs bg-muted p-2 rounded">{time.local}</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Export Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="export-format" className="text-sm font-medium">
                  Export Format
                </Label>
                <Select
                  value={settings.exportFormat}
                  onValueChange={(value: ExportFormat) =>
                    setSettings((prev: any) => ({ ...prev, exportFormat: value }))
                  }
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

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    id="include-timestamp"
                    type="checkbox"
                    checked={settings.includeTimestamp}
                    onChange={(e) => setSettings((prev: any) => ({ ...prev, includeTimestamp: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <Label htmlFor="include-timestamp" className="text-sm">
                    Include timestamp in exports
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="batch-processing"
                    type="checkbox"
                    checked={settings.batchProcessing}
                    onChange={(e) => setSettings((prev: any) => ({ ...prev, batchProcessing: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <Label htmlFor="batch-processing" className="text-sm">
                    Enable batch processing
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="auto-refresh"
                    type="checkbox"
                    checked={settings.autoRefresh}
                    onChange={(e) => setSettings((prev: any) => ({ ...prev, autoRefresh: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <Label htmlFor="auto-refresh" className="text-sm">
                    Auto-refresh current time
                  </Label>
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
const UnixTimestamp = () => {
  return (
    <UnixTimestampErrorBoundary>
      <UnixTimestampCore />
    </UnixTimestampErrorBoundary>
  )
}

export default UnixTimestamp
