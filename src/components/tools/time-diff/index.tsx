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
  Clock,
  BookOpen,
  Calculator,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  TimeDifference,
  Duration,
  DurationBreakdown,
  TimeDiffBatch,
  TimeDiffStatistics,
  TimeDiffSettings,
  TimeDiffTemplate,
  DateValidation,
  DateFormat,
  DurationFormat,
  DurationPrecision,
  ExportFormat,
} from '@/types/time-diff'
// Enhanced Types

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

// Date parsing and validation
const parseDate = (input: string, format: DateFormat): DateValidation => {
  if (!input.trim()) {
    return { isValid: false, error: 'Date input cannot be empty' }
  }

  try {
    let date: Date

    switch (format) {
      case 'unix':
        const unixSeconds = Number(input)
        if (isNaN(unixSeconds)) {
          return { isValid: false, error: 'Invalid Unix timestamp' }
        }
        date = new Date(unixSeconds * 1000)
        break

      case 'unix-ms':
        const unixMs = Number(input)
        if (isNaN(unixMs)) {
          return { isValid: false, error: 'Invalid Unix milliseconds timestamp' }
        }
        date = new Date(unixMs)
        break

      case 'iso8601':
        date = new Date(input)
        if (isNaN(date.getTime())) {
          return { isValid: false, error: 'Invalid ISO 8601 format' }
        }
        break

      case 'rfc2822':
        date = new Date(input)
        if (isNaN(date.getTime())) {
          return { isValid: false, error: 'Invalid RFC 2822 format' }
        }
        break

      case 'local':
      case 'custom':
      default:
        date = new Date(input)
        if (isNaN(date.getTime())) {
          return { isValid: false, error: 'Invalid date format' }
        }
        break
    }

    // Additional validation for reasonable date ranges
    const minDate = new Date('1900-01-01')
    const maxDate = new Date('2100-12-31')

    if (date < minDate || date > maxDate) {
      return { isValid: false, error: 'Date must be between 1900 and 2100' }
    }

    return { isValid: true, parsedDate: date }
  } catch (error) {
    return { isValid: false, error: 'Failed to parse date' }
  }
}

// Calculate business days between two dates
const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Ensure start is before end
  if (start > end) {
    ;[start.setTime(end.getTime()), end.setTime(start.getTime())]
  }

  let businessDays = 0
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    // Monday = 1, Tuesday = 2, ..., Friday = 5
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      businessDays++
    }
    current.setDate(current.getDate() + 1)
  }

  return businessDays
}

// Calculate duration between two dates
const calculateDuration = (startDate: Date, endDate: Date): Duration => {
  const start = startDate.getTime()
  const end = endDate.getTime()
  const diff = Math.abs(end - start)

  const totalMilliseconds = diff
  const totalSeconds = Math.floor(diff / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalDays = Math.floor(totalHours / 24)
  const totalWeeks = Math.floor(totalDays / 7)
  const totalMonths = Math.floor(totalDays / 30.44) // Average month length
  const totalYears = Math.floor(totalDays / 365.25) // Account for leap years

  // Calculate breakdown
  const years = Math.floor(totalDays / 365.25)
  const remainingDaysAfterYears = totalDays - years * 365.25
  const months = Math.floor(remainingDaysAfterYears / 30.44)
  const remainingDaysAfterMonths = remainingDaysAfterYears - months * 30.44
  const weeks = Math.floor(remainingDaysAfterMonths / 7)
  const days = Math.floor(remainingDaysAfterMonths % 7)
  const hours = totalHours % 24
  const minutes = totalMinutes % 60
  const seconds = totalSeconds % 60
  const milliseconds = totalMilliseconds % 1000

  const breakdown: DurationBreakdown = {
    years: Math.floor(years),
    months: Math.floor(months),
    weeks: Math.floor(weeks),
    days: Math.floor(days),
    hours: Math.floor(hours),
    minutes: Math.floor(minutes),
    seconds: Math.floor(seconds),
    milliseconds: Math.floor(milliseconds),
  }

  // Generate human readable format
  const parts: string[] = []
  if (breakdown.years > 0) parts.push(`${breakdown.years} year${breakdown.years > 1 ? 's' : ''}`)
  if (breakdown.months > 0) parts.push(`${breakdown.months} month${breakdown.months > 1 ? 's' : ''}`)
  if (breakdown.weeks > 0) parts.push(`${breakdown.weeks} week${breakdown.weeks > 1 ? 's' : ''}`)
  if (breakdown.days > 0) parts.push(`${breakdown.days} day${breakdown.days > 1 ? 's' : ''}`)
  if (breakdown.hours > 0) parts.push(`${breakdown.hours} hour${breakdown.hours > 1 ? 's' : ''}`)
  if (breakdown.minutes > 0) parts.push(`${breakdown.minutes} minute${breakdown.minutes > 1 ? 's' : ''}`)
  if (breakdown.seconds > 0) parts.push(`${breakdown.seconds} second${breakdown.seconds > 1 ? 's' : ''}`)

  const humanReadable = parts.length > 0 ? parts.join(', ') : '0 seconds'

  // Generate relative time
  const relative = generateRelativeTime(startDate, endDate)

  return {
    totalMilliseconds,
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDays,
    totalWeeks,
    totalMonths,
    totalYears,
    breakdown,
    humanReadable,
    relative,
  }
}

// Generate relative time description
const generateRelativeTime = (startDate: Date, endDate: Date): string => {
  const now = new Date()
  const start = startDate.getTime()
  const end = endDate.getTime()
  const current = now.getTime()

  if (start <= current && current <= end) {
    return 'Currently in progress'
  } else if (end < current) {
    return 'Completed in the past'
  } else if (start > current) {
    return 'Will occur in the future'
  }

  return 'Time period'
}

// Time difference templates
const timeDiffTemplates: TimeDiffTemplate[] = [
  {
    id: 'project-duration',
    name: 'Project Duration',
    description: 'Calculate project timeline from start to end',
    category: 'Business',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    useCase: ['Project planning', 'Timeline estimation', 'Milestone tracking'],
  },
  {
    id: 'age-calculation',
    name: 'Age Calculation',
    description: 'Calculate age from birth date to current date',
    category: 'Personal',
    startDate: '1990-01-01',
    endDate: new Date().toISOString().split('T')[0],
    useCase: ['Age verification', 'Birthday calculations', 'Life milestones'],
  },
  {
    id: 'event-countdown',
    name: 'Event Countdown',
    description: 'Time remaining until a future event',
    category: 'Events',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2024-12-25',
    useCase: ['Holiday countdown', 'Event planning', 'Deadline tracking'],
  },
  {
    id: 'work-period',
    name: 'Work Period',
    description: 'Calculate employment duration',
    category: 'Business',
    startDate: '2020-01-01',
    endDate: new Date().toISOString().split('T')[0],
    useCase: ['Employment history', 'Service years', 'Experience calculation'],
  },
  {
    id: 'vacation-length',
    name: 'Vacation Length',
    description: 'Calculate vacation or leave duration',
    category: 'Personal',
    startDate: '2024-07-01',
    endDate: '2024-07-14',
    useCase: ['Vacation planning', 'Leave requests', 'Time off tracking'],
  },
  {
    id: 'subscription-period',
    name: 'Subscription Period',
    description: 'Calculate subscription or membership duration',
    category: 'Business',
    startDate: '2024-01-01',
    endDate: '2025-01-01',
    useCase: ['Subscription tracking', 'Membership duration', 'Billing cycles'],
  },
]

// Custom hooks
const useTimeDiffCalculation = () => {
  const calculateSingle = useCallback(
    (
      startInput: string,
      endInput: string,
      startFormat: DateFormat,
      endFormat: DateFormat,
      settings: TimeDiffSettings
    ): TimeDifference => {
      try {
        const startValidation = parseDate(startInput, startFormat)
        const endValidation = parseDate(endInput, endFormat)

        if (!startValidation.isValid) {
          return {
            id: nanoid(),
            startDate: new Date(),
            endDate: new Date(),
            startInput,
            endInput,
            startFormat,
            endFormat,
            timezone: settings.defaultTimezone,
            duration: {
              totalMilliseconds: 0,
              totalSeconds: 0,
              totalMinutes: 0,
              totalHours: 0,
              totalDays: 0,
              totalWeeks: 0,
              totalMonths: 0,
              totalYears: 0,
              breakdown: {
                years: 0,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
              },
              humanReadable: '',
              relative: '',
            },
            businessDays: 0,
            isValid: false,
            error: `Start date: ${startValidation.error}`,
            createdAt: new Date(),
          }
        }

        if (!endValidation.isValid) {
          return {
            id: nanoid(),
            startDate: new Date(),
            endDate: new Date(),
            startInput,
            endInput,
            startFormat,
            endFormat,
            timezone: settings.defaultTimezone,
            duration: {
              totalMilliseconds: 0,
              totalSeconds: 0,
              totalMinutes: 0,
              totalHours: 0,
              totalDays: 0,
              totalWeeks: 0,
              totalMonths: 0,
              totalYears: 0,
              breakdown: {
                years: 0,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
              },
              humanReadable: '',
              relative: '',
            },
            businessDays: 0,
            isValid: false,
            error: `End date: ${endValidation.error}`,
            createdAt: new Date(),
          }
        }

        const startDate = startValidation.parsedDate!
        const endDate = endValidation.parsedDate!
        const duration = calculateDuration(startDate, endDate)
        const businessDays = settings.includeBusinessDays ? calculateBusinessDays(startDate, endDate) : 0

        return {
          id: nanoid(),
          startDate,
          endDate,
          startInput,
          endInput,
          startFormat,
          endFormat,
          timezone: settings.defaultTimezone,
          duration,
          businessDays,
          isValid: true,
          createdAt: new Date(),
        }
      } catch (error) {
        console.error('Time diff calculation error:', error)
        return {
          id: nanoid(),
          startDate: new Date(),
          endDate: new Date(),
          startInput,
          endInput,
          startFormat,
          endFormat,
          timezone: settings.defaultTimezone,
          duration: {
            totalMilliseconds: 0,
            totalSeconds: 0,
            totalMinutes: 0,
            totalHours: 0,
            totalDays: 0,
            totalWeeks: 0,
            totalMonths: 0,
            totalYears: 0,
            breakdown: {
              years: 0,
              months: 0,
              weeks: 0,
              days: 0,
              hours: 0,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            },
            humanReadable: '',
            relative: '',
          },
          businessDays: 0,
          isValid: false,
          error: error instanceof Error ? error.message : 'Calculation failed',
          createdAt: new Date(),
        }
      }
    },
    []
  )

  const calculateBatch = useCallback(
    (
      pairs: Array<{ start: string; end: string; startFormat: DateFormat; endFormat: DateFormat }>,
      settings: TimeDiffSettings
    ): TimeDiffBatch => {
      try {
        const calculations = pairs.map((pair) =>
          calculateSingle(pair.start, pair.end, pair.startFormat, pair.endFormat, settings)
        )

        const validCount = calculations.filter((calc) => calc.isValid).length
        const invalidCount = calculations.length - validCount
        const validCalculations = calculations.filter((calc) => calc.isValid)

        const durations = validCalculations.map((calc) => calc.duration.totalDays)
        const averageDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0
        const longestDuration = durations.length > 0 ? Math.max(...durations) : 0
        const shortestDuration = durations.length > 0 ? Math.min(...durations) : 0

        const statistics: TimeDiffStatistics = {
          totalCalculations: calculations.length,
          validCount,
          invalidCount,
          averageDuration,
          longestDuration,
          shortestDuration,
          durationDistribution: {},
          timezoneDistribution: calculations.reduce(
            (acc, calc) => {
              acc[calc.timezone] = (acc[calc.timezone] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          ),
          successRate: (validCount / calculations.length) * 100,
        }

        return {
          id: nanoid(),
          calculations,
          count: calculations.length,
          settings,
          createdAt: new Date(),
          statistics,
        }
      } catch (error) {
        console.error('Batch calculation error:', error)
        throw new Error(error instanceof Error ? error.message : 'Batch calculation failed')
      }
    },
    [calculateSingle]
  )

  return { calculateSingle, calculateBatch }
}

// Real-time validation hook
const useRealTimeValidation = (input: string, format: DateFormat, timezone: string) => {
  return useMemo(() => {
    if (!input.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = parseDate(input, format)
    return {
      isValid: validation.isValid,
      error: validation.error || null,
      isEmpty: false,
      parsedDate: validation.parsedDate,
    }
  }, [input, format, timezone])
}

// Export functionality
const useTimeDiffExport = () => {
  const exportTimeDiffs = useCallback((calculations: TimeDifference[], format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(calculations, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVFromTimeDiffs(calculations)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'xml':
        content = generateXMLFromTimeDiffs(calculations)
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'txt':
      default:
        content = generateTextFromTimeDiffs(calculations)
        mimeType = 'text/plain'
        extension = '.txt'
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `time-differences${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (batch: TimeDiffBatch) => {
      exportTimeDiffs(batch.calculations, 'json', `time-diff-batch-${batch.id}.json`)
      toast.success(`Exported ${batch.calculations.length} time difference calculations`)
    },
    [exportTimeDiffs]
  )

  const exportStatistics = useCallback((batches: TimeDiffBatch[]) => {
    const stats = batches.map((batch) => ({
      batchId: batch.id,
      calculationCount: batch.count,
      validCount: batch.statistics.validCount,
      invalidCount: batch.statistics.invalidCount,
      averageDuration: batch.statistics.averageDuration.toFixed(2),
      successRate: batch.statistics.successRate.toFixed(2),
      createdAt: batch.createdAt.toISOString(),
    }))

    const csvContent = [
      [
        'Batch ID',
        'Calculation Count',
        'Valid Count',
        'Invalid Count',
        'Average Duration (days)',
        'Success Rate (%)',
        'Created At',
      ],
      ...stats.map((stat) => [
        stat.batchId,
        stat.calculationCount.toString(),
        stat.validCount.toString(),
        stat.invalidCount.toString(),
        stat.averageDuration,
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
    link.download = 'time-diff-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportTimeDiffs, exportBatch, exportStatistics }
}

// Generate export formats
const generateTextFromTimeDiffs = (calculations: TimeDifference[]): string => {
  return `Time Difference Calculation Report
===================================

Generated: ${new Date().toLocaleString()}
Total Calculations: ${calculations.length}
Valid Calculations: ${calculations.filter((calc) => calc.isValid).length}
Invalid Calculations: ${calculations.filter((calc) => !calc.isValid).length}

Calculations:
${calculations
  .map((calc, i) => {
    return `${i + 1}. Start: ${calc.startInput} | End: ${calc.endInput}
   Duration: ${calc.duration.humanReadable}
   Total Days: ${calc.duration.totalDays}
   Business Days: ${calc.businessDays}
   Status: ${calc.isValid ? 'Valid' : 'Invalid'}
   ${calc.error ? `Error: ${calc.error}` : ''}
   Relative: ${calc.duration.relative}
`
  })
  .join('\n')}

Statistics:
- Success Rate: ${((calculations.filter((calc) => calc.isValid).length / calculations.length) * 100).toFixed(1)}%
`
}

const generateCSVFromTimeDiffs = (calculations: TimeDifference[]): string => {
  const rows = [
    [
      'Start Date',
      'End Date',
      'Start Format',
      'End Format',
      'Total Days',
      'Business Days',
      'Human Readable',
      'Relative',
      'Valid',
      'Error',
      'Timezone',
    ],
  ]

  calculations.forEach((calc) => {
    rows.push([
      calc.startInput,
      calc.endInput,
      calc.startFormat,
      calc.endFormat,
      calc.duration.totalDays.toString(),
      calc.businessDays.toString(),
      calc.duration.humanReadable,
      calc.duration.relative,
      calc.isValid ? 'Yes' : 'No',
      calc.error || '',
      calc.timezone,
    ])
  })

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

const generateXMLFromTimeDiffs = (calculations: TimeDifference[]): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<timeDifferences>
  <metadata>
    <generated>${new Date().toISOString()}</generated>
    <count>${calculations.length}</count>
    <validCount>${calculations.filter((calc) => calc.isValid).length}</validCount>
  </metadata>
  <calculations>
    ${calculations
      .map(
        (calc) => `
    <calculation>
      <startDate>${calc.startInput}</startDate>
      <endDate>${calc.endInput}</endDate>
      <startFormat>${calc.startFormat}</startFormat>
      <endFormat>${calc.endFormat}</endFormat>
      <duration>
        <totalDays>${calc.duration.totalDays}</totalDays>
        <humanReadable>${calc.duration.humanReadable}</humanReadable>
        <relative>${calc.duration.relative}</relative>
      </duration>
      <businessDays>${calc.businessDays}</businessDays>
      <valid>${calc.isValid}</valid>
      ${calc.error ? `<error>${calc.error}</error>` : ''}
      <timezone>${calc.timezone}</timezone>
    </calculation>`
      )
      .join('')}
  </calculations>
</timeDifferences>`
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
 * Enhanced Time Diff Tool
 * Features: Advanced time difference calculation, timezone support, batch processing, comprehensive analysis
 */
const TimeDiffCore = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'batch' | 'templates'>('calculator')
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')
  const [startFormat, setStartFormat] = useState<DateFormat>('local')
  const [endFormat, setEndFormat] = useState<DateFormat>('local')
  const [currentResult, setCurrentResult] = useState<TimeDifference | null>(null)
  const [batches, setBatches] = useState<TimeDiffBatch[]>([])
  const [batchInput, setBatchInput] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<TimeDiffSettings>({
    defaultTimezone: 'UTC',
    includeBusinessDays: true,
    includeTime: true,
    outputFormat: 'detailed',
    exportFormat: 'json',
    realTimeCalculation: true,
    showRelativeTime: true,
    precision: 'days',
  })

  const { calculateSingle, calculateBatch } = useTimeDiffCalculation()
  const { exportTimeDiffs, exportBatch, exportStatistics } = useTimeDiffExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const startValidation = useRealTimeValidation(startInput, startFormat, settings.defaultTimezone)
  const endValidation = useRealTimeValidation(endInput, endFormat, settings.defaultTimezone)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = timeDiffTemplates.find((t) => t.id === templateId)
    if (template) {
      setStartInput(template.startDate)
      setEndInput(template.endDate)
      setStartFormat('local')
      setEndFormat('local')
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single calculation
  const handleCalculateSingle = useCallback(async () => {
    if (!startInput.trim() || !endInput.trim()) {
      toast.error('Please enter both start and end dates')
      return
    }

    setIsProcessing(true)
    try {
      const result = calculateSingle(startInput, endInput, startFormat, endFormat, settings)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success('Time difference calculated successfully')
      } else {
        toast.error(result.error || 'Calculation failed')
      }
    } catch (error) {
      toast.error('Failed to calculate time difference')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [startInput, endInput, startFormat, endFormat, settings, calculateSingle])

  // Handle batch calculation
  const handleCalculateBatch = useCallback(async () => {
    const lines = batchInput.split('\n').filter((line) => line.trim())

    if (lines.length === 0) {
      toast.error('Please enter date pairs to calculate')
      return
    }

    const pairs = lines
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim())
        if (parts.length >= 2) {
          return {
            start: parts[0],
            end: parts[1],
            startFormat: startFormat,
            endFormat: endFormat,
          }
        }
        return null
      })
      .filter(Boolean) as Array<{ start: string; end: string; startFormat: DateFormat; endFormat: DateFormat }>

    if (pairs.length === 0) {
      toast.error('Please enter valid date pairs (comma-separated)')
      return
    }

    setIsProcessing(true)
    try {
      const batch = calculateBatch(pairs, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Calculated ${batch.calculations.length} time differences`)
    } catch (error) {
      toast.error('Failed to calculate batch')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, startFormat, endFormat, settings, calculateBatch])

  // Auto-calculate when real-time calculation is enabled
  useEffect(() => {
    if (
      settings.realTimeCalculation &&
      startInput.trim() &&
      endInput.trim() &&
      startValidation.isValid &&
      endValidation.isValid
    ) {
      const timer = setTimeout(() => {
        handleCalculateSingle()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [
    startInput,
    endInput,
    startValidation.isValid,
    endValidation.isValid,
    settings.realTimeCalculation,
    handleCalculateSingle,
  ])

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
              <Calculator className="h-5 w-5" aria-hidden="true" />
              Time Difference Calculator & Analyzer
            </CardTitle>
            <CardDescription>
              Advanced time difference calculator with timezone support, business days calculation, and comprehensive
              analysis. Calculate duration between dates with multiple format support and batch processing capabilities.
              Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'calculator' | 'batch' | 'templates')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Time Calculator
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates & Examples
            </TabsTrigger>
          </TabsList>

          {/* Time Calculator Tab */}
          <TabsContent value="calculator" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Date & Time Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="start-date" className="text-sm font-medium">
                      Start Date
                    </Label>
                    <Input
                      id="start-date"
                      value={startInput}
                      onChange={(e) => setStartInput(e.target.value)}
                      placeholder="Enter start date/time..."
                      className="mt-2"
                      aria-label="Start date input"
                    />
                    {settings.realTimeCalculation && startInput && (
                      <div className="mt-2 text-sm">
                        {startValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid date: {startValidation.parsedDate?.toLocaleString()}
                          </div>
                        ) : startValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {startValidation.error}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="end-date" className="text-sm font-medium">
                      End Date
                    </Label>
                    <Input
                      id="end-date"
                      value={endInput}
                      onChange={(e) => setEndInput(e.target.value)}
                      placeholder="Enter end date/time..."
                      className="mt-2"
                      aria-label="End date input"
                    />
                    {settings.realTimeCalculation && endInput && (
                      <div className="mt-2 text-sm">
                        {endValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid date: {endValidation.parsedDate?.toLocaleString()}
                          </div>
                        ) : endValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {endValidation.error}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-format" className="text-sm font-medium">
                        Start Format
                      </Label>
                      <Select value={startFormat} onValueChange={(value: DateFormat) => setStartFormat(value)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local Date/Time</SelectItem>
                          <SelectItem value="iso8601">ISO 8601</SelectItem>
                          <SelectItem value="rfc2822">RFC 2822</SelectItem>
                          <SelectItem value="unix">Unix Timestamp</SelectItem>
                          <SelectItem value="unix-ms">Unix Milliseconds</SelectItem>
                          <SelectItem value="custom">Custom Format</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="end-format" className="text-sm font-medium">
                        End Format
                      </Label>
                      <Select value={endFormat} onValueChange={(value: DateFormat) => setEndFormat(value)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local Date/Time</SelectItem>
                          <SelectItem value="iso8601">ISO 8601</SelectItem>
                          <SelectItem value="rfc2822">RFC 2822</SelectItem>
                          <SelectItem value="unix">Unix Timestamp</SelectItem>
                          <SelectItem value="unix-ms">Unix Milliseconds</SelectItem>
                          <SelectItem value="custom">Custom Format</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="timezone" className="text-sm font-medium">
                      Timezone
                    </Label>
                    <Select
                      value={settings.defaultTimezone}
                      onValueChange={(value) => setSettings((prev) => ({ ...prev, defaultTimezone: value }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id="real-time-calculation"
                        type="checkbox"
                        checked={settings.realTimeCalculation}
                        onChange={(e) => setSettings((prev) => ({ ...prev, realTimeCalculation: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="real-time-calculation" className="text-sm">
                        Real-time calculation
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="include-business-days"
                        type="checkbox"
                        checked={settings.includeBusinessDays}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeBusinessDays: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="include-business-days" className="text-sm">
                        Include business days calculation
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="show-relative-time"
                        type="checkbox"
                        checked={settings.showRelativeTime}
                        onChange={(e) => setSettings((prev) => ({ ...prev, showRelativeTime: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="show-relative-time" className="text-sm">
                        Show relative time descriptions
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCalculateSingle}
                      disabled={!startInput.trim() || !endInput.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Calculate Difference
                    </Button>
                    <Button
                      onClick={() => {
                        setStartInput('')
                        setEndInput('')
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Supported Date Formats:</h4>
                    <div className="text-xs space-y-1">
                      <div>
                        <strong>Local:</strong> 2024-01-15, Jan 15 2024, 15/01/2024
                      </div>
                      <div>
                        <strong>ISO 8601:</strong> 2024-01-15T10:30:00Z
                      </div>
                      <div>
                        <strong>Unix:</strong> 1705312200 (seconds)
                      </div>
                      <div>
                        <strong>Unix MS:</strong> 1705312200000 (milliseconds)
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
                    Calculation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-2">Date Range</div>
                        <div className="text-sm space-y-1">
                          <div>
                            <strong>Start:</strong> {currentResult.startInput} ({currentResult.startFormat})
                          </div>
                          <div>
                            <strong>End:</strong> {currentResult.endInput} ({currentResult.endFormat})
                          </div>
                          <div>
                            <strong>Timezone:</strong> {currentResult.timezone}
                          </div>
                        </div>
                      </div>

                      {currentResult.isValid ? (
                        <div className="space-y-4">
                          {/* Duration Summary */}
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="font-medium text-sm">Duration Summary</Label>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(currentResult.duration.humanReadable, 'Duration')}
                              >
                                {copiedText === 'Duration' ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div className="text-sm bg-muted p-2 rounded">{currentResult.duration.humanReadable}</div>
                            {settings.showRelativeTime && (
                              <div className="text-xs text-muted-foreground mt-2">
                                {currentResult.duration.relative}
                              </div>
                            )}
                          </div>

                          {/* Detailed Breakdown */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Detailed Breakdown</Label>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Years:</strong> {currentResult.duration.breakdown.years}
                                </div>
                                <div>
                                  <strong>Months:</strong> {currentResult.duration.breakdown.months}
                                </div>
                                <div>
                                  <strong>Weeks:</strong> {currentResult.duration.breakdown.weeks}
                                </div>
                                <div>
                                  <strong>Days:</strong> {currentResult.duration.breakdown.days}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Hours:</strong> {currentResult.duration.breakdown.hours}
                                </div>
                                <div>
                                  <strong>Minutes:</strong> {currentResult.duration.breakdown.minutes}
                                </div>
                                <div>
                                  <strong>Seconds:</strong> {currentResult.duration.breakdown.seconds}
                                </div>
                                {settings.includeBusinessDays && (
                                  <div>
                                    <strong>Business Days:</strong> {currentResult.businessDays}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Total Units */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Total Units</Label>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Total Days:</strong> {currentResult.duration.totalDays.toFixed(2)}
                                </div>
                                <div>
                                  <strong>Total Hours:</strong> {currentResult.duration.totalHours.toFixed(2)}
                                </div>
                                <div>
                                  <strong>Total Minutes:</strong> {currentResult.duration.totalMinutes.toFixed(0)}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Total Weeks:</strong> {currentResult.duration.totalWeeks.toFixed(2)}
                                </div>
                                <div>
                                  <strong>Total Months:</strong> {currentResult.duration.totalMonths.toFixed(2)}
                                </div>
                                <div>
                                  <strong>Total Years:</strong> {currentResult.duration.totalYears.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Calculation Error</span>
                          </div>
                          <div className="text-red-700 text-sm mt-1">{currentResult.error}</div>
                        </div>
                      )}

                      {currentResult.isValid && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => exportTimeDiffs([currentResult], settings.exportFormat)}
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
                      <Calculator className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Calculation Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Enter start and end dates to calculate the time difference
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
                  Batch Time Difference Calculation
                </CardTitle>
                <CardDescription>
                  Calculate multiple time differences at once (one pair per line, comma-separated)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batch-input" className="text-sm font-medium">
                      Date Pairs (start,end per line)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder="2024-01-01,2024-01-15&#10;2023-12-01,2024-01-01&#10;1990-01-01,2024-01-01"
                      className="mt-2 min-h-[120px] font-mono"
                      aria-label="Batch date pairs input"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCalculateBatch} disabled={!batchInput.trim() || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Calculate Batch
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
                            <h4 className="font-medium">{batch.count} calculations processed</h4>
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
                            <span className="font-medium">Avg Duration:</span>{' '}
                            {batch.statistics.averageDuration.toFixed(1)} days
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.calculations.slice(0, 5).map((calc) => (
                              <div key={calc.id} className="text-xs border rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">
                                    {calc.startInput} → {calc.endInput}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      calc.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {calc.isValid ? 'Valid' : 'Invalid'}
                                  </span>
                                </div>
                                {calc.isValid && (
                                  <div className="text-muted-foreground mt-1">
                                    {calc.duration.humanReadable} ({calc.duration.totalDays.toFixed(1)} days)
                                  </div>
                                )}
                                {calc.error && <div className="text-red-600 mt-1">{calc.error}</div>}
                              </div>
                            ))}
                            {batch.calculations.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.calculations.length - 5} more calculations
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

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Time Difference Templates
                </CardTitle>
                <CardDescription>Common time difference calculations for various scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {timeDiffTemplates.map((template) => (
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
                          <div>Start: {template.startDate}</div>
                          <div>End: {template.endDate}</div>
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
                Calculation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="output-format" className="text-sm font-medium">
                    Output Format
                  </Label>
                  <Select
                    value={settings.outputFormat}
                    onValueChange={(value: DurationFormat) => setSettings((prev) => ({ ...prev, outputFormat: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="human">Human Readable</SelectItem>
                      <SelectItem value="iso8601">ISO 8601 Duration</SelectItem>
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
                <Label htmlFor="precision" className="text-sm font-medium">
                  Precision Level
                </Label>
                <Select
                  value={settings.precision}
                  onValueChange={(value: DurationPrecision) => setSettings((prev) => ({ ...prev, precision: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="seconds">Seconds</SelectItem>
                    <SelectItem value="milliseconds">Milliseconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    id="include-time"
                    type="checkbox"
                    checked={settings.includeTime}
                    onChange={(e) => setSettings((prev) => ({ ...prev, includeTime: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <Label htmlFor="include-time" className="text-sm">
                    Include time components in calculations
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
const TimeDiff = () => {
  return <TimeDiffCore />
}

export default TimeDiff
