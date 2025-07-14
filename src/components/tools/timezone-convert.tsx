import React, { useCallback, useState, useMemo, useEffect } from 'react'
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
  Clock,
  Globe,
  BookOpen,
  Calculator,
  RefreshCw,
  Play,
  Pause,
} from 'lucide-react'

// Enhanced Types
interface TimezoneConversion {
  id: string
  inputTime: string
  inputTimezone: string
  outputTimezone: string
  inputDate: Date
  outputDate: Date
  outputTime: string
  timeDifference: number
  isDST: boolean
  isValid: boolean
  error?: string
  createdAt: Date
}

interface TimezoneInfo {
  name: string
  abbreviation: string
  offset: string
  offsetMinutes: number
  isDST: boolean
  currentTime: string
  utcOffset: string
}

interface WorldClock {
  timezone: string
  currentTime: Date
  formattedTime: string
  info: TimezoneInfo
}

interface TimezoneConversionBatch {
  id: string
  conversions: TimezoneConversion[]
  count: number
  settings: TimezoneSettings
  createdAt: Date
  statistics: TimezoneStatistics
}

interface TimezoneStatistics {
  totalConversions: number
  validCount: number
  invalidCount: number
  timezoneDistribution: Record<string, number>
  averageTimeDifference: number
  dstCount: number
  successRate: number
}

interface TimezoneSettings {
  defaultInputTimezone: string
  defaultOutputTimezone: string
  dateFormat: DateFormat
  timeFormat: TimeFormat
  includeSeconds: boolean
  show24Hour: boolean
  showDST: boolean
  realTimeConversion: boolean
  autoRefresh: boolean
  refreshInterval: number
  exportFormat: ExportFormat
}

interface TimezoneTemplate {
  id: string
  name: string
  description: string
  category: string
  inputTimezone: string
  outputTimezone: string
  useCase: string[]
}

interface DateTimeValidation {
  isValid: boolean
  error?: string
  parsedDate?: Date
}

// Enums
type DateFormat = 'iso' | 'us' | 'eu' | 'local' | 'custom'
type TimeFormat = '12h' | '24h'
type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'

// Utility functions
const generateId = (): string => Math.random().toString(36).substring(2, 11)

// Comprehensive timezone list
const WORLD_TIMEZONES = [
  // Major Cities
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Anchorage',
  'America/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'America/Lima',
  'America/Bogota',
  'America/Caracas',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Vienna',
  'Europe/Zurich',
  'Europe/Stockholm',
  'Europe/Oslo',
  'Europe/Copenhagen',
  'Europe/Helsinki',
  'Europe/Warsaw',
  'Europe/Prague',
  'Europe/Budapest',
  'Europe/Athens',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Beijing',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Manila',
  'Asia/Kuala_Lumpur',
  'Asia/Ho_Chi_Minh',
  'Asia/Kolkata',
  'Asia/Mumbai',
  'Asia/Karachi',
  'Asia/Dubai',
  'Asia/Tehran',
  'Asia/Baghdad',
  'Asia/Riyadh',
  'Asia/Jerusalem',
  'Africa/Cairo',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Africa/Casablanca',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Australia/Adelaide',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Honolulu',
  'Pacific/Tahiti',
]

// Timezone utility functions
const validateTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

const getTimezoneInfo = (timezone: string, date: Date = new Date()): TimezoneInfo => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const parts = formatter.formatToParts(date)
    const timeZoneName = parts.find((part) => part.type === 'timeZoneName')?.value || ''

    // Calculate offset
    const offsetMinutes = getTimezoneOffsetMinutes(timezone, date)
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60)
    const offsetMins = Math.abs(offsetMinutes) % 60
    const offsetSign = offsetMinutes >= 0 ? '+' : '-'
    const offset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`

    // Check if DST is active (simplified)
    const jan = new Date(date.getFullYear(), 0, 1)
    const jul = new Date(date.getFullYear(), 6, 1)
    const janOffset = getTimezoneOffsetMinutes(timezone, jan)
    const julOffset = getTimezoneOffsetMinutes(timezone, jul)
    const isDST = offsetMinutes !== Math.max(janOffset, julOffset)

    return {
      name: timezone,
      abbreviation: timeZoneName,
      offset,
      offsetMinutes,
      isDST,
      currentTime: formatter.format(date),
      utcOffset: offset,
    }
  } catch (error) {
    return {
      name: timezone,
      abbreviation: 'Unknown',
      offset: '+00:00',
      offsetMinutes: 0,
      isDST: false,
      currentTime: 'Invalid timezone',
      utcOffset: '+00:00',
    }
  }
}

const getTimezoneOffsetMinutes = (timezone: string, date: Date = new Date()): number => {
  try {
    const utcDate = new Date(date.toLocaleString('en-CA', { timeZone: 'UTC' }))
    const targetDate = new Date(date.toLocaleString('en-CA', { timeZone: timezone }))
    return (targetDate.getTime() - utcDate.getTime()) / 60000
  } catch {
    return 0
  }
}

// Validate date/time input
const validateDateTime = (input: string): DateTimeValidation => {
  if (!input.trim()) {
    return { isValid: false, error: 'Date/time input cannot be empty' }
  }

  try {
    const date = new Date(input)
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Invalid date/time format' }
    }

    // Check for reasonable date range
    const minDate = new Date('1900-01-01')
    const maxDate = new Date('2100-12-31')

    if (date < minDate || date > maxDate) {
      return { isValid: false, error: 'Date must be between 1900 and 2100' }
    }

    return { isValid: true, parsedDate: date }
  } catch (error) {
    return { isValid: false, error: 'Failed to parse date/time' }
  }
}

// Convert time between timezones
const convertTimezone = (
  inputTime: string,
  inputTimezone: string,
  outputTimezone: string,
  settings: TimezoneSettings
): TimezoneConversion => {
  try {
    const dateValidation = validateDateTime(inputTime)
    if (!dateValidation.isValid) {
      return {
        id: generateId(),
        inputTime,
        inputTimezone,
        outputTimezone,
        inputDate: new Date(),
        outputDate: new Date(),
        outputTime: '',
        timeDifference: 0,
        isDST: false,
        isValid: false,
        error: dateValidation.error,
        createdAt: new Date(),
      }
    }

    if (!validateTimezone(inputTimezone)) {
      return {
        id: generateId(),
        inputTime,
        inputTimezone,
        outputTimezone,
        inputDate: new Date(),
        outputDate: new Date(),
        outputTime: '',
        timeDifference: 0,
        isDST: false,
        isValid: false,
        error: `Invalid input timezone: ${inputTimezone}`,
        createdAt: new Date(),
      }
    }

    if (!validateTimezone(outputTimezone)) {
      return {
        id: generateId(),
        inputTime,
        inputTimezone,
        outputTimezone,
        inputDate: new Date(),
        outputDate: new Date(),
        outputTime: '',
        timeDifference: 0,
        isDST: false,
        isValid: false,
        error: `Invalid output timezone: ${outputTimezone}`,
        createdAt: new Date(),
      }
    }

    const inputDate = dateValidation.parsedDate!

    // Create a date object in the input timezone
    const inputInUTC = new Date(inputDate.toLocaleString('en-CA', { timeZone: inputTimezone }))

    // Convert to output timezone
    const outputDate = new Date(inputInUTC.toLocaleString('en-CA', { timeZone: outputTimezone }))

    // Format output time
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: outputTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...(settings.includeSeconds && { second: '2-digit' }),
      hour12: !settings.show24Hour,
    }

    const outputTime = new Intl.DateTimeFormat('en-US', formatOptions).format(inputDate)

    // Calculate time difference in hours
    const inputOffset = getTimezoneOffsetMinutes(inputTimezone, inputDate)
    const outputOffset = getTimezoneOffsetMinutes(outputTimezone, inputDate)
    const timeDifference = (outputOffset - inputOffset) / 60

    // Check DST status
    const outputInfo = getTimezoneInfo(outputTimezone, inputDate)

    return {
      id: generateId(),
      inputTime,
      inputTimezone,
      outputTimezone,
      inputDate,
      outputDate,
      outputTime,
      timeDifference,
      isDST: outputInfo.isDST,
      isValid: true,
      createdAt: new Date(),
    }
  } catch (error) {
    console.error('Timezone conversion error:', error)
    return {
      id: generateId(),
      inputTime,
      inputTimezone,
      outputTimezone,
      inputDate: new Date(),
      outputDate: new Date(),
      outputTime: '',
      timeDifference: 0,
      isDST: false,
      isValid: false,
      error: error instanceof Error ? error.message : 'Conversion failed',
      createdAt: new Date(),
    }
  }
}

// Timezone conversion templates
const timezoneTemplates: TimezoneTemplate[] = [
  {
    id: 'us-business',
    name: 'US Business Hours',
    description: 'Convert between major US business timezones',
    category: 'Business',
    inputTimezone: 'America/New_York',
    outputTimezone: 'America/Los_Angeles',
    useCase: ['Business meetings', 'Conference calls', 'Market hours'],
  },
  {
    id: 'global-meeting',
    name: 'Global Meeting',
    description: 'Convert between major global business centers',
    category: 'Business',
    inputTimezone: 'America/New_York',
    outputTimezone: 'Asia/Tokyo',
    useCase: ['International meetings', 'Global coordination', 'Cross-timezone planning'],
  },
  {
    id: 'europe-asia',
    name: 'Europe to Asia',
    description: 'Convert between European and Asian timezones',
    category: 'International',
    inputTimezone: 'Europe/London',
    outputTimezone: 'Asia/Shanghai',
    useCase: ['International business', 'Travel planning', 'Remote work coordination'],
  },
  {
    id: 'travel-planning',
    name: 'Travel Planning',
    description: 'Convert for international travel',
    category: 'Travel',
    inputTimezone: 'America/Chicago',
    outputTimezone: 'Europe/Paris',
    useCase: ['Flight schedules', 'Hotel bookings', 'Itinerary planning'],
  },
  {
    id: 'market-hours',
    name: 'Market Hours',
    description: 'Convert between major financial market timezones',
    category: 'Finance',
    inputTimezone: 'America/New_York',
    outputTimezone: 'Asia/Hong_Kong',
    useCase: ['Stock trading', 'Market analysis', 'Financial coordination'],
  },
  {
    id: 'dev-coordination',
    name: 'Development Team',
    description: 'Convert for distributed development teams',
    category: 'Technology',
    inputTimezone: 'America/Los_Angeles',
    outputTimezone: 'Asia/Kolkata',
    useCase: ['Remote development', 'Code reviews', 'Team standups'],
  },
]

// Error boundary component
class TimezoneConvertErrorBoundary extends React.Component<
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
    console.error('Timezone Convert error:', error, errorInfo)
    toast.error('An unexpected error occurred during timezone conversion')
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
const useTimezoneConversion = () => {
  const convertSingle = useCallback(
    (
      inputTime: string,
      inputTimezone: string,
      outputTimezone: string,
      settings: TimezoneSettings
    ): TimezoneConversion => {
      return convertTimezone(inputTime, inputTimezone, outputTimezone, settings)
    },
    []
  )

  const convertBatch = useCallback(
    (
      conversions: Array<{ inputTime: string; inputTimezone: string; outputTimezone: string }>,
      settings: TimezoneSettings
    ): TimezoneConversionBatch => {
      try {
        const results = conversions.map((conv) =>
          convertTimezone(conv.inputTime, conv.inputTimezone, conv.outputTimezone, settings)
        )

        const validCount = results.filter((result) => result.isValid).length
        const invalidCount = results.length - validCount
        const validResults = results.filter((result) => result.isValid)

        const timeDifferences = validResults.map((result) => Math.abs(result.timeDifference))
        const averageTimeDifference =
          timeDifferences.length > 0 ? timeDifferences.reduce((sum, diff) => sum + diff, 0) / timeDifferences.length : 0

        const dstCount = validResults.filter((result) => result.isDST).length

        const statistics: TimezoneStatistics = {
          totalConversions: results.length,
          validCount,
          invalidCount,
          timezoneDistribution: results.reduce(
            (acc, result) => {
              const key = `${result.inputTimezone} → ${result.outputTimezone}`
              acc[key] = (acc[key] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          ),
          averageTimeDifference,
          dstCount,
          successRate: (validCount / results.length) * 100,
        }

        return {
          id: generateId(),
          conversions: results,
          count: results.length,
          settings,
          createdAt: new Date(),
          statistics,
        }
      } catch (error) {
        console.error('Batch conversion error:', error)
        throw new Error(error instanceof Error ? error.message : 'Batch conversion failed')
      }
    },
    []
  )

  return { convertSingle, convertBatch }
}

// World clock hook
const useWorldClock = (timezones: string[], autoRefresh: boolean = true, refreshInterval: number = 1000) => {
  const [worldClocks, setWorldClocks] = useState<WorldClock[]>([])

  const updateClocks = useCallback(() => {
    const now = new Date()
    const clocks = timezones.map((timezone) => {
      const info = getTimezoneInfo(timezone, now)
      return {
        timezone,
        currentTime: now,
        formattedTime: info.currentTime,
        info,
      }
    })
    setWorldClocks(clocks)
  }, [timezones])

  useEffect(() => {
    updateClocks()

    if (autoRefresh) {
      const interval = setInterval(updateClocks, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [updateClocks, autoRefresh, refreshInterval])

  return { worldClocks, updateClocks }
}

// Real-time validation hook
const useRealTimeValidation = (input: string, timezone: string) => {
  return useMemo(() => {
    if (!input.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const dateValidation = validateDateTime(input)
    const timezoneValid = validateTimezone(timezone)

    if (!dateValidation.isValid) {
      return {
        isValid: false,
        error: dateValidation.error,
        isEmpty: false,
      }
    }

    if (!timezoneValid) {
      return {
        isValid: false,
        error: `Invalid timezone: ${timezone}`,
        isEmpty: false,
      }
    }

    return {
      isValid: true,
      error: null,
      isEmpty: false,
      parsedDate: dateValidation.parsedDate,
    }
  }, [input, timezone])
}

// Export functionality
const useTimezoneExport = () => {
  const exportConversions = useCallback(
    (conversions: TimezoneConversion[], format: ExportFormat, filename?: string) => {
      let content = ''
      let mimeType = 'text/plain'
      let extension = '.txt'

      switch (format) {
        case 'json':
          content = JSON.stringify(conversions, null, 2)
          mimeType = 'application/json'
          extension = '.json'
          break
        case 'csv':
          content = generateCSVFromConversions(conversions)
          mimeType = 'text/csv'
          extension = '.csv'
          break
        case 'xml':
          content = generateXMLFromConversions(conversions)
          mimeType = 'application/xml'
          extension = '.xml'
          break
        case 'txt':
        default:
          content = generateTextFromConversions(conversions)
          mimeType = 'text/plain'
          extension = '.txt'
          break
      }

      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `timezone-conversions${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    []
  )

  const exportBatch = useCallback(
    (batch: TimezoneConversionBatch) => {
      exportConversions(batch.conversions, 'json', `timezone-batch-${batch.id}.json`)
      toast.success(`Exported ${batch.conversions.length} timezone conversions`)
    },
    [exportConversions]
  )

  const exportStatistics = useCallback((batches: TimezoneConversionBatch[]) => {
    const stats = batches.map((batch) => ({
      batchId: batch.id,
      conversionCount: batch.count,
      validCount: batch.statistics.validCount,
      invalidCount: batch.statistics.invalidCount,
      averageTimeDifference: batch.statistics.averageTimeDifference.toFixed(2),
      successRate: batch.statistics.successRate.toFixed(2),
      createdAt: batch.createdAt.toISOString(),
    }))

    const csvContent = [
      [
        'Batch ID',
        'Conversion Count',
        'Valid Count',
        'Invalid Count',
        'Average Time Difference (hours)',
        'Success Rate (%)',
        'Created At',
      ],
      ...stats.map((stat) => [
        stat.batchId,
        stat.conversionCount.toString(),
        stat.validCount.toString(),
        stat.invalidCount.toString(),
        stat.averageTimeDifference,
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
    link.download = 'timezone-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportConversions, exportBatch, exportStatistics }
}

// Generate export formats
const generateTextFromConversions = (conversions: TimezoneConversion[]): string => {
  return `Timezone Conversion Report
==========================

Generated: ${new Date().toLocaleString()}
Total Conversions: ${conversions.length}
Valid Conversions: ${conversions.filter((conv) => conv.isValid).length}
Invalid Conversions: ${conversions.filter((conv) => !conv.isValid).length}

Conversions:
${conversions
  .map((conv, i) => {
    return `${i + 1}. Input: ${conv.inputTime} (${conv.inputTimezone})
   Output: ${conv.outputTime} (${conv.outputTimezone})
   Time Difference: ${conv.timeDifference > 0 ? '+' : ''}${conv.timeDifference} hours
   DST Active: ${conv.isDST ? 'Yes' : 'No'}
   Status: ${conv.isValid ? 'Valid' : 'Invalid'}
   ${conv.error ? `Error: ${conv.error}` : ''}
`
  })
  .join('\n')}

Statistics:
- Success Rate: ${((conversions.filter((conv) => conv.isValid).length / conversions.length) * 100).toFixed(1)}%
`
}

const generateCSVFromConversions = (conversions: TimezoneConversion[]): string => {
  const rows = [
    [
      'Input Time',
      'Input Timezone',
      'Output Time',
      'Output Timezone',
      'Time Difference (hours)',
      'DST Active',
      'Valid',
      'Error',
    ],
  ]

  conversions.forEach((conv) => {
    rows.push([
      conv.inputTime,
      conv.inputTimezone,
      conv.outputTime,
      conv.outputTimezone,
      conv.timeDifference.toString(),
      conv.isDST ? 'Yes' : 'No',
      conv.isValid ? 'Yes' : 'No',
      conv.error || '',
    ])
  })

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

const generateXMLFromConversions = (conversions: TimezoneConversion[]): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<timezoneConversions>
  <metadata>
    <generated>${new Date().toISOString()}</generated>
    <count>${conversions.length}</count>
    <validCount>${conversions.filter((conv) => conv.isValid).length}</validCount>
  </metadata>
  <conversions>
    ${conversions
      .map(
        (conv) => `
    <conversion>
      <inputTime>${conv.inputTime}</inputTime>
      <inputTimezone>${conv.inputTimezone}</inputTimezone>
      <outputTime>${conv.outputTime}</outputTime>
      <outputTimezone>${conv.outputTimezone}</outputTimezone>
      <timeDifference>${conv.timeDifference}</timeDifference>
      <isDST>${conv.isDST}</isDST>
      <valid>${conv.isValid}</valid>
      ${conv.error ? `<error>${conv.error}</error>` : ''}
    </conversion>`
      )
      .join('')}
  </conversions>
</timezoneConversions>`
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
 * Enhanced Timezone Convert Tool
 * Features: Advanced timezone conversion, world clock, batch processing, comprehensive analysis
 */
const TimezoneConvertCore = () => {
  const [activeTab, setActiveTab] = useState<'converter' | 'batch' | 'worldclock' | 'templates'>('converter')
  const [inputTime, setInputTime] = useState('')
  const [inputTimezone, setInputTimezone] = useState('UTC')
  const [outputTimezone, setOutputTimezone] = useState('America/New_York')
  const [currentResult, setCurrentResult] = useState<TimezoneConversion | null>(null)
  const [batches, setBatches] = useState<TimezoneConversionBatch[]>([])
  const [batchInput, setBatchInput] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [worldClockTimezones, setWorldClockTimezones] = useState<string[]>([
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Asia/Tokyo',
    'Australia/Sydney',
  ])
  const [settings, setSettings] = useState<TimezoneSettings>({
    defaultInputTimezone: 'UTC',
    defaultOutputTimezone: 'America/New_York',
    dateFormat: 'iso',
    timeFormat: '24h',
    includeSeconds: false,
    show24Hour: true,
    showDST: true,
    realTimeConversion: true,
    autoRefresh: true,
    refreshInterval: 1000,
    exportFormat: 'json',
  })

  const { convertSingle, convertBatch } = useTimezoneConversion()
  const { exportConversions, exportBatch, exportStatistics } = useTimezoneExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const { worldClocks, updateClocks } = useWorldClock(
    worldClockTimezones,
    settings.autoRefresh,
    settings.refreshInterval
  )
  const inputValidation = useRealTimeValidation(inputTime, inputTimezone)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = timezoneTemplates.find((t) => t.id === templateId)
    if (template) {
      setInputTimezone(template.inputTimezone)
      setOutputTimezone(template.outputTimezone)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single conversion
  const handleConvertSingle = useCallback(async () => {
    if (!inputTime.trim()) {
      toast.error('Please enter a date/time to convert')
      return
    }

    setIsProcessing(true)
    try {
      const result = convertSingle(inputTime, inputTimezone, outputTimezone, settings)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success('Timezone conversion completed successfully')
      } else {
        toast.error(result.error || 'Conversion failed')
      }
    } catch (error) {
      toast.error('Failed to convert timezone')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [inputTime, inputTimezone, outputTimezone, settings, convertSingle])

  // Handle batch conversion
  const handleConvertBatch = useCallback(async () => {
    const lines = batchInput.split('\n').filter((line) => line.trim())

    if (lines.length === 0) {
      toast.error('Please enter conversions to process')
      return
    }

    const conversions = lines
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim())
        if (parts.length >= 3) {
          return {
            inputTime: parts[0],
            inputTimezone: parts[1],
            outputTimezone: parts[2],
          }
        }
        return null
      })
      .filter(Boolean) as Array<{ inputTime: string; inputTimezone: string; outputTimezone: string }>

    if (conversions.length === 0) {
      toast.error('Please enter valid conversions (time,input_tz,output_tz per line)')
      return
    }

    setIsProcessing(true)
    try {
      const batch = convertBatch(conversions, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Processed ${batch.conversions.length} timezone conversions`)
    } catch (error) {
      toast.error('Failed to process batch')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, settings, convertBatch])

  // Auto-convert when real-time conversion is enabled
  useEffect(() => {
    if (settings.realTimeConversion && inputTime.trim() && inputValidation.isValid) {
      const timer = setTimeout(() => {
        handleConvertSingle()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [
    inputTime,
    inputTimezone,
    outputTimezone,
    inputValidation.isValid,
    settings.realTimeConversion,
    handleConvertSingle,
  ])

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
              <Globe className="h-5 w-5" aria-hidden="true" />
              Timezone Converter & World Clock
            </CardTitle>
            <CardDescription>
              Advanced timezone conversion tool with world clock, batch processing, and comprehensive timezone analysis.
              Convert times between any timezones with real-time validation and detailed timezone information. Use
              keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'converter' | 'batch' | 'worldclock' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="converter" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Converter
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
            <TabsTrigger value="worldclock" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              World Clock
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Timezone Converter Tab */}
          <TabsContent value="converter" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Timezone Conversion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="input-time" className="text-sm font-medium">
                      Date & Time
                    </Label>
                    <Input
                      id="input-time"
                      value={inputTime}
                      onChange={(e) => setInputTime(e.target.value)}
                      placeholder="2024-01-15 14:30:00 or Jan 15, 2024 2:30 PM"
                      className="mt-2"
                      aria-label="Input date and time"
                    />
                    {settings.realTimeConversion && inputTime && (
                      <div className="mt-2 text-sm">
                        {inputValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid date/time: {inputValidation.parsedDate?.toLocaleString()}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="input-timezone" className="text-sm font-medium">
                        From Timezone
                      </Label>
                      <Select value={inputTimezone} onValueChange={setInputTimezone}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {WORLD_TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="output-timezone" className="text-sm font-medium">
                        To Timezone
                      </Label>
                      <Select value={outputTimezone} onValueChange={setOutputTimezone}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {WORLD_TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id="real-time-conversion"
                        type="checkbox"
                        checked={settings.realTimeConversion}
                        onChange={(e) => setSettings((prev) => ({ ...prev, realTimeConversion: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="real-time-conversion" className="text-sm">
                        Real-time conversion
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="show-24hour"
                        type="checkbox"
                        checked={settings.show24Hour}
                        onChange={(e) => setSettings((prev) => ({ ...prev, show24Hour: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="show-24hour" className="text-sm">
                        24-hour format
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="include-seconds"
                        type="checkbox"
                        checked={settings.includeSeconds}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeSeconds: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="include-seconds" className="text-sm">
                        Include seconds
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="show-dst"
                        type="checkbox"
                        checked={settings.showDST}
                        onChange={(e) => setSettings((prev) => ({ ...prev, showDST: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="show-dst" className="text-sm">
                        Show daylight saving time info
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleConvertSingle} disabled={!inputTime.trim() || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Convert Timezone
                    </Button>
                    <Button
                      onClick={() => {
                        setInputTime('')
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Supported Date/Time Formats:</h4>
                    <div className="text-xs space-y-1">
                      <div>
                        <strong>ISO:</strong> 2024-01-15T14:30:00
                      </div>
                      <div>
                        <strong>US:</strong> 01/15/2024 2:30 PM
                      </div>
                      <div>
                        <strong>EU:</strong> 15/01/2024 14:30
                      </div>
                      <div>
                        <strong>Natural:</strong> Jan 15, 2024 2:30 PM
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Section */}
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
                        <div className="text-sm space-y-1">
                          <div>
                            <strong>Time:</strong> {currentResult.inputTime}
                          </div>
                          <div>
                            <strong>Timezone:</strong> {currentResult.inputTimezone}
                          </div>
                        </div>
                      </div>

                      {currentResult.isValid ? (
                        <div className="space-y-4">
                          {/* Converted Time */}
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="font-medium text-sm">Converted Time</Label>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(currentResult.outputTime, 'Converted Time')}
                              >
                                {copiedText === 'Converted Time' ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div className="text-lg font-mono bg-muted p-3 rounded">{currentResult.outputTime}</div>
                            <div className="text-sm text-muted-foreground mt-2">{currentResult.outputTimezone}</div>
                          </div>

                          {/* Timezone Information */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Timezone Information</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Time Difference:</strong> {currentResult.timeDifference > 0 ? '+' : ''}
                                  {currentResult.timeDifference} hours
                                </div>
                                {settings.showDST && (
                                  <div>
                                    <strong>DST Active:</strong> {currentResult.isDST ? 'Yes' : 'No'}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div>
                                  <strong>Input TZ:</strong> {getTimezoneInfo(currentResult.inputTimezone).abbreviation}
                                </div>
                                <div>
                                  <strong>Output TZ:</strong>{' '}
                                  {getTimezoneInfo(currentResult.outputTimezone).abbreviation}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Additional Details */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Additional Details</Label>
                            <div className="text-sm space-y-2">
                              <div>
                                <strong>Input UTC Offset:</strong> {getTimezoneInfo(currentResult.inputTimezone).offset}
                              </div>
                              <div>
                                <strong>Output UTC Offset:</strong>{' '}
                                {getTimezoneInfo(currentResult.outputTimezone).offset}
                              </div>
                              <div>
                                <strong>Conversion Direction:</strong>{' '}
                                {currentResult.timeDifference > 0
                                  ? 'Forward'
                                  : currentResult.timeDifference < 0
                                    ? 'Backward'
                                    : 'Same timezone'}
                              </div>
                            </div>
                          </div>
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
                            onClick={() => exportConversions([currentResult], settings.exportFormat)}
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
                      <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Conversion Yet</h3>
                      <p className="text-muted-foreground mb-4">Enter a date/time and select timezones to convert</p>
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
                  Batch Timezone Conversion
                </CardTitle>
                <CardDescription>Convert multiple times at once (time,input_tz,output_tz per line)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batch-input" className="text-sm font-medium">
                      Conversions (time,input_tz,output_tz per line)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder="2024-01-15 14:30,UTC,America/New_York&#10;2024-01-15 09:00,America/Los_Angeles,Europe/London&#10;Jan 15 2024 3:30 PM,Asia/Tokyo,Australia/Sydney"
                      className="mt-2 min-h-[120px] font-mono"
                      aria-label="Batch timezone conversion input"
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
                    {batches.map((batch) => (
                      <div key={batch.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{batch.count} conversions processed</h4>
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
                            <span className="font-medium">Avg Time Diff:</span>{' '}
                            {batch.statistics.averageTimeDifference.toFixed(1)}h
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.conversions.slice(0, 5).map((conv) => (
                              <div key={conv.id} className="text-xs border rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">
                                    {conv.inputTime} ({conv.inputTimezone} → {conv.outputTimezone})
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      conv.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {conv.isValid ? 'Valid' : 'Invalid'}
                                  </span>
                                </div>
                                {conv.isValid && (
                                  <div className="text-muted-foreground mt-1">
                                    Result: {conv.outputTime} ({conv.timeDifference > 0 ? '+' : ''}
                                    {conv.timeDifference}h)
                                  </div>
                                )}
                                {conv.error && <div className="text-red-600 mt-1">{conv.error}</div>}
                              </div>
                            ))}
                            {batch.conversions.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.conversions.length - 5} more conversions
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

          {/* World Clock Tab */}
          <TabsContent value="worldclock" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    World Clock
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSettings((prev) => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
                    >
                      {settings.autoRefresh ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {settings.autoRefresh ? 'Pause' : 'Resume'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={updateClocks}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
                <CardDescription>Real-time clock display for multiple timezones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="add-timezone" className="text-sm font-medium">
                      Add Timezone
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Select
                        onValueChange={(value) => {
                          if (!worldClockTimezones.includes(value)) {
                            setWorldClockTimezones((prev) => [...prev, value])
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select timezone to add" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {WORLD_TIMEZONES.filter((tz) => !worldClockTimezones.includes(tz)).map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {worldClocks.map((clock) => (
                      <div key={clock.timezone} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm truncate">{clock.timezone}</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setWorldClockTimezones((prev) => prev.filter((tz) => tz !== clock.timezone))}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div className="text-lg font-mono">{clock.formattedTime}</div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>UTC {clock.info.offset}</div>
                            <div>{clock.info.abbreviation}</div>
                            {settings.showDST && clock.info.isDST && <div className="text-blue-600">DST Active</div>}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(clock.formattedTime, `${clock.timezone} time`)}
                            className="w-full"
                          >
                            <Copy className="mr-2 h-3 w-3" />
                            Copy Time
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {worldClocks.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Timezones Added</h3>
                      <p className="text-muted-foreground mb-4">Add timezones to see their current times</p>
                    </div>
                  )}
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
                  Timezone Conversion Templates
                </CardTitle>
                <CardDescription>Common timezone conversion scenarios for different use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {timezoneTemplates.map((template) => (
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
                        <div className="font-mono text-xs bg-muted p-2 rounded">
                          <div>From: {template.inputTimezone}</div>
                          <div>To: {template.outputTimezone}</div>
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
                Conversion Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date-format" className="text-sm font-medium">
                    Date Format
                  </Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value: DateFormat) => setSettings((prev) => ({ ...prev, dateFormat: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iso">ISO (YYYY-MM-DD)</SelectItem>
                      <SelectItem value="us">US (MM/DD/YYYY)</SelectItem>
                      <SelectItem value="eu">EU (DD/MM/YYYY)</SelectItem>
                      <SelectItem value="local">Local Format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
              </div>

              <div>
                <Label htmlFor="refresh-interval" className="text-sm font-medium">
                  Auto-refresh Interval: {settings.refreshInterval / 1000}s
                </Label>
                <div className="mt-2 flex items-center gap-4">
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="1000"
                    value={settings.refreshInterval}
                    onChange={(e) => setSettings((prev) => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
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
const TimezoneConvert = () => {
  return (
    <TimezoneConvertErrorBoundary>
      <TimezoneConvertCore />
    </TimezoneConvertErrorBoundary>
  )
}

export default TimezoneConvert
