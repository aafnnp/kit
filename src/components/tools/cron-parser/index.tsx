import { useCallback, useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
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
  Code,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  CronBatch,
  CronExpression,
  CronField,
  CronFields,
  CronFrequency,
  CronSettings,
  CronStatistics,
  CronTemplate,
  CronValidation,
  ExportFormat,
} from "@/schemas/cron-parser.schema"

// Utility functions

// Cron field ranges and constraints
const CRON_RANGES = {
  minute: { min: 0, max: 59, name: "minute" },
  hour: { min: 0, max: 23, name: "hour" },
  dayOfMonth: { min: 1, max: 31, name: "day of month" },
  month: { min: 1, max: 12, name: "month" },
  dayOfWeek: { min: 0, max: 7, name: "day of week" }, // 0 and 7 both represent Sunday
  year: { min: 1970, max: 3000, name: "year" },
}

// Month and day names
const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

// Common timezones
const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "America/Denver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
]

// Parse cron field value
const parseCronField = (value: string, fieldType: keyof typeof CRON_RANGES): CronField => {
  const range = CRON_RANGES[fieldType]
  const field: CronField = {
    raw: value,
    values: [],
    type: "invalid",
    description: "",
    isValid: false,
  }

  try {
    // Handle wildcard
    if (value === "*") {
      field.type = "wildcard"
      field.values = Array.from({ length: range.max - range.min + 1 }, (_, i) => i + range.min)
      field.description = `Every ${range.name}`
      field.isValid = true
      return field
    }

    // Handle step values (*/5, 1-10/2)
    if (value.includes("/")) {
      const [rangeOrWildcard, step] = value.split("/")
      const stepNum = parseInt(step)

      if (isNaN(stepNum) || stepNum <= 0) {
        field.error = "Invalid step value"
        return field
      }

      let startRange: number[], endRange: number[]

      if (rangeOrWildcard === "*") {
        startRange = [range.min]
        endRange = [range.max]
      } else if (rangeOrWildcard.includes("-")) {
        const [start, end] = rangeOrWildcard.split("-").map(Number)
        if (isNaN(start) || isNaN(end) || start < range.min || end > range.max || start > end) {
          field.error = "Invalid range in step"
          return field
        }
        startRange = [start]
        endRange = [end]
      } else {
        const start = parseInt(rangeOrWildcard)
        if (isNaN(start) || start < range.min || start > range.max) {
          field.error = "Invalid start value in step"
          return field
        }
        startRange = [start]
        endRange = [range.max]
      }

      field.type = "step"
      field.values = []
      for (let i = startRange[0]; i <= endRange[0]; i += stepNum) {
        field.values.push(i)
      }
      field.description = `Every ${stepNum} ${range.name}(s) from ${startRange[0]} to ${endRange[0]}`
      field.isValid = true
      return field
    }

    // Handle ranges (1-5)
    if (value.includes("-")) {
      const [start, end] = value.split("-").map(Number)
      if (isNaN(start) || isNaN(end) || start < range.min || end > range.max || start > end) {
        field.error = "Invalid range"
        return field
      }

      field.type = "range"
      field.values = Array.from({ length: end - start + 1 }, (_, i) => i + start)
      field.description = `From ${start} to ${end}`
      field.isValid = true
      return field
    }

    // Handle lists (1,3,5)
    if (value.includes(",")) {
      const values = value.split(",").map((v) => {
        // Handle named values (MON, JAN, etc.)
        if (isNaN(Number(v))) {
          if (fieldType === "month") {
            const monthIndex = MONTH_NAMES.indexOf(v.toUpperCase())
            return monthIndex >= 0 ? monthIndex + 1 : NaN
          } else if (fieldType === "dayOfWeek") {
            const dayIndex = DAY_NAMES.indexOf(v.toUpperCase())
            return dayIndex >= 0 ? dayIndex : NaN
          }
          return NaN
        }
        return Number(v)
      })

      if (values.some((v) => isNaN(v) || v < range.min || v > range.max)) {
        field.error = "Invalid values in list"
        return field
      }

      field.type = "list"
      field.values = values.sort((a, b) => a - b)
      field.description = `At ${values.join(", ")}`
      field.isValid = true
      return field
    }

    // Handle single value
    let numValue: number
    if (isNaN(Number(value))) {
      // Handle named values
      if (fieldType === "month") {
        const monthIndex = MONTH_NAMES.indexOf(value.toUpperCase())
        numValue = monthIndex >= 0 ? monthIndex + 1 : NaN
      } else if (fieldType === "dayOfWeek") {
        const dayIndex = DAY_NAMES.indexOf(value.toUpperCase())
        numValue = dayIndex >= 0 ? dayIndex : NaN
      } else {
        field.error = "Invalid value"
        return field
      }
    } else {
      numValue = Number(value)
    }

    if (isNaN(numValue) || numValue < range.min || numValue > range.max) {
      field.error = `Value must be between ${range.min} and ${range.max}`
      return field
    }

    field.type = "specific"
    field.values = [numValue]
    field.description = `At ${numValue}`
    field.isValid = true
    return field
  } catch (error) {
    field.error = "Parse error"
    return field
  }
}

// Parse complete cron expression
const parseCronExpression = (
  expression: string,
  includeSeconds: boolean = false,
  includeYear: boolean = false
): CronFields => {
  const parts = expression.trim().split(/\s+/)
  const expectedParts = 5 + (includeSeconds ? 1 : 0) + (includeYear ? 1 : 0)

  if (parts.length !== expectedParts) {
    const invalidField: CronField = {
      raw: "",
      values: [],
      type: "invalid",
      description: "",
      isValid: false,
      error: `Expected ${expectedParts} parts, got ${parts.length}`,
    }

    return {
      minute: invalidField,
      hour: invalidField,
      dayOfMonth: invalidField,
      month: invalidField,
      dayOfWeek: invalidField,
      ...(includeYear && { year: invalidField }),
    }
  }

  let partIndex = 0
  const fields: CronFields = {
    minute: parseCronField(parts[partIndex++], "minute"),
    hour: parseCronField(parts[partIndex++], "hour"),
    dayOfMonth: parseCronField(parts[partIndex++], "dayOfMonth"),
    month: parseCronField(parts[partIndex++], "month"),
    dayOfWeek: parseCronField(parts[partIndex++], "dayOfWeek"),
  }

  if (includeYear && partIndex < parts.length) {
    fields.year = parseCronField(parts[partIndex], "year")
  }

  return fields
}

// Generate human-readable description
const generateHumanReadable = (fields: CronFields): string => {
  try {
    const parts: string[] = []

    // Handle special cases first
    if (
      fields.minute.type === "wildcard" &&
      fields.hour.type === "wildcard" &&
      fields.dayOfMonth.type === "wildcard" &&
      fields.month.type === "wildcard" &&
      fields.dayOfWeek.type === "wildcard"
    ) {
      return "Every minute"
    }

    // Frequency part
    if (fields.minute.type === "specific" && fields.minute.values[0] === 0) {
      if (fields.hour.type === "specific") {
        parts.push(`At ${fields.hour.values[0].toString().padStart(2, "0")}:00`)
      } else if (fields.hour.type === "wildcard") {
        parts.push("At the top of every hour")
      } else {
        parts.push(`At minute 0 of ${fields.hour.description.toLowerCase()}`)
      }
    } else if (fields.minute.type === "wildcard") {
      parts.push("Every minute")
    } else {
      parts.push(`At ${fields.minute.description.toLowerCase()}`)
    }

    // Hour part
    if (fields.hour.type !== "wildcard" && !(fields.minute.type === "specific" && fields.minute.values[0] === 0)) {
      parts.push(`of ${fields.hour.description.toLowerCase()}`)
    }

    // Day part
    if (fields.dayOfMonth.type !== "wildcard" && fields.dayOfWeek.type !== "wildcard") {
      parts.push(`on ${fields.dayOfMonth.description.toLowerCase()} and ${fields.dayOfWeek.description.toLowerCase()}`)
    } else if (fields.dayOfMonth.type !== "wildcard") {
      parts.push(`on ${fields.dayOfMonth.description.toLowerCase()}`)
    } else if (fields.dayOfWeek.type !== "wildcard") {
      const dayNames = fields.dayOfWeek.values.map((d) => DAY_NAMES[d === 7 ? 0 : d]).join(", ")
      parts.push(`on ${dayNames}`)
    }

    // Month part
    if (fields.month.type !== "wildcard") {
      const monthNames = fields.month.values.map((m) => MONTH_NAMES[m - 1]).join(", ")
      parts.push(`in ${monthNames}`)
    }

    return parts.join(" ")
  } catch (error) {
    return "Unable to generate description"
  }
}

// Calculate next run times
const calculateNextRuns = (fields: CronFields, count: number = 5, _timezone: string = "UTC"): Date[] => {
  const nextRuns: Date[] = []
  const now = new Date()
  let current = new Date(now.getTime() + 60000) // Start from next minute

  // Reset seconds and milliseconds
  current.setSeconds(0, 0)

  let attempts = 0
  const maxAttempts = 10000 // Prevent infinite loops

  while (nextRuns.length < count && attempts < maxAttempts) {
    attempts++

    if (matchesCronFields(current, fields)) {
      nextRuns.push(new Date(current))
    }

    // Increment by 1 minute
    current.setMinutes(current.getMinutes() + 1)
  }

  return nextRuns
}

// Check if a date matches cron fields
const matchesCronFields = (date: Date, fields: CronFields): boolean => {
  const minute = date.getMinutes()
  const hour = date.getHours()
  const dayOfMonth = date.getDate()
  const month = date.getMonth() + 1
  const dayOfWeek = date.getDay()

  return (
    fields.minute.values.includes(minute) &&
    fields.hour.values.includes(hour) &&
    fields.dayOfMonth.values.includes(dayOfMonth) &&
    fields.month.values.includes(month) &&
    (fields.dayOfWeek.values.includes(dayOfWeek) || fields.dayOfWeek.values.includes(dayOfWeek === 0 ? 7 : dayOfWeek))
  )
}

// Determine cron frequency
const determineCronFrequency = (fields: CronFields): CronFrequency => {
  // Check for specific patterns
  if (fields.minute.type === "wildcard") {
    return { type: "minutely", interval: 1, description: "Every minute" }
  }

  if (fields.hour.type === "wildcard" && fields.minute.type === "specific") {
    return { type: "hourly", interval: 1, description: "Every hour" }
  }

  if (
    fields.dayOfMonth.type === "wildcard" &&
    fields.dayOfWeek.type === "wildcard" &&
    fields.hour.type === "specific" &&
    fields.minute.type === "specific"
  ) {
    return { type: "daily", interval: 1, description: "Every day" }
  }

  if (fields.dayOfWeek.type === "specific" && fields.dayOfWeek.values.length === 1) {
    return { type: "weekly", interval: 1, description: "Every week" }
  }

  if (fields.dayOfMonth.type === "specific" && fields.dayOfMonth.values.length === 1) {
    return { type: "monthly", interval: 1, description: "Every month" }
  }

  if (fields.month.type === "specific" && fields.month.values.length === 1) {
    return { type: "yearly", interval: 1, description: "Every year" }
  }

  return { type: "custom", interval: 0, description: "Custom schedule" }
}

// Validate cron expression
const validateCronExpression = (expression: string, settings: CronSettings): CronValidation => {
  const validation: CronValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!expression.trim()) {
    validation.isValid = false
    validation.errors.push("Cron expression cannot be empty")
    return validation
  }

  const fields = parseCronExpression(expression, false, settings.includeYear)

  // Check if all fields are valid
  Object.values(fields).forEach((field, index) => {
    if (!field.isValid && field.error) {
      validation.isValid = false
      validation.errors.push(`Field ${index + 1}: ${field.error}`)
    }
  })

  // Add warnings and suggestions
  if (fields.dayOfMonth.type !== "wildcard" && fields.dayOfWeek.type !== "wildcard") {
    validation.warnings.push("Both day of month and day of week are specified. This may not run as expected.")
  }

  if (fields.minute.type === "wildcard" && fields.hour.type === "wildcard") {
    validation.warnings.push("This will run every minute. Consider if this is intended.")
  }

  return validation
}

// Cron templates with common expressions
const cronTemplates: CronTemplate[] = [
  {
    id: "every-minute",
    name: "Every Minute",
    expression: "* * * * *",
    description: "Runs every minute",
    category: "Basic",
    frequency: "Every minute",
    examples: ["System monitoring", "Real-time data processing"],
  },
  {
    id: "every-hour",
    name: "Every Hour",
    expression: "0 * * * *",
    description: "Runs at the beginning of every hour",
    category: "Basic",
    frequency: "Hourly",
    examples: ["Log rotation", "Cache cleanup"],
  },
  {
    id: "daily-midnight",
    name: "Daily at Midnight",
    expression: "0 0 * * *",
    description: "Runs every day at midnight",
    category: "Daily",
    frequency: "Daily",
    examples: ["Daily backups", "Report generation"],
  },
  {
    id: "daily-9am",
    name: "Daily at 9 AM",
    expression: "0 9 * * *",
    description: "Runs every day at 9:00 AM",
    category: "Daily",
    frequency: "Daily",
    examples: ["Morning reports", "Daily notifications"],
  },
  {
    id: "weekly-monday",
    name: "Weekly on Monday",
    expression: "0 9 * * 1",
    description: "Runs every Monday at 9:00 AM",
    category: "Weekly",
    frequency: "Weekly",
    examples: ["Weekly reports", "System maintenance"],
  },
  {
    id: "monthly-first",
    name: "Monthly on 1st",
    expression: "0 0 1 * *",
    description: "Runs on the 1st day of every month at midnight",
    category: "Monthly",
    frequency: "Monthly",
    examples: ["Monthly billing", "Archive old data"],
  },
  {
    id: "workdays-9am",
    name: "Workdays at 9 AM",
    expression: "0 9 * * 1-5",
    description: "Runs Monday through Friday at 9:00 AM",
    category: "Business",
    frequency: "Weekdays",
    examples: ["Business reports", "Workday notifications"],
  },
  {
    id: "every-15min",
    name: "Every 15 Minutes",
    expression: "*/15 * * * *",
    description: "Runs every 15 minutes",
    category: "Frequent",
    frequency: "Every 15 minutes",
    examples: ["Health checks", "Data synchronization"],
  },
  {
    id: "twice-daily",
    name: "Twice Daily",
    expression: "0 9,21 * * *",
    description: "Runs twice daily at 9:00 AM and 9:00 PM",
    category: "Daily",
    frequency: "Twice daily",
    examples: ["Bi-daily backups", "Status updates"],
  },
  {
    id: "quarterly",
    name: "Quarterly",
    expression: "0 0 1 1,4,7,10 *",
    description: "Runs quarterly on the 1st day of Jan, Apr, Jul, Oct",
    category: "Periodic",
    frequency: "Quarterly",
    examples: ["Quarterly reports", "License renewals"],
  },
]

// Custom hooks
const useCronParsing = () => {
  const parseSingle = useCallback((expression: string, settings: CronSettings): CronExpression => {
    try {
      const validation = validateCronExpression(expression, settings)
      const fields = parseCronExpression(expression, false, settings.includeYear)

      const cronExpression: CronExpression = {
        id: nanoid(),
        expression,
        description: "",
        isValid: validation.isValid,
        error: validation.errors.join("; "),
        parsedFields: fields,
        humanReadable: "",
        nextRuns: [],
        frequency: { type: "custom", interval: 0, description: "Custom" },
        timezone: settings.timezone,
        createdAt: new Date(),
      }

      if (validation.isValid) {
        cronExpression.humanReadable = generateHumanReadable(fields)
        cronExpression.nextRuns = calculateNextRuns(fields, settings.maxNextRuns, settings.timezone)
        cronExpression.frequency = determineCronFrequency(fields)
      }

      return cronExpression
    } catch (error) {
      console.error("Cron parsing error:", error)
      return {
        id: nanoid(),
        expression,
        description: "",
        isValid: false,
        error: error instanceof Error ? error.message : "Parsing failed",
        parsedFields: {
          minute: { raw: "", values: [], type: "invalid", description: "", isValid: false },
          hour: { raw: "", values: [], type: "invalid", description: "", isValid: false },
          dayOfMonth: { raw: "", values: [], type: "invalid", description: "", isValid: false },
          month: { raw: "", values: [], type: "invalid", description: "", isValid: false },
          dayOfWeek: { raw: "", values: [], type: "invalid", description: "", isValid: false },
        },
        humanReadable: "Parse error",
        nextRuns: [],
        frequency: { type: "custom", interval: 0, description: "Error" },
        timezone: settings.timezone,
        createdAt: new Date(),
      }
    }
  }, [])

  const parseBatch = useCallback(
    (expressions: string[], settings: CronSettings): CronBatch => {
      try {
        const cronExpressions = expressions.map((expr) => parseSingle(expr, settings))

        const validCount = cronExpressions.filter((expr) => expr.isValid).length
        const invalidCount = cronExpressions.length - validCount

        const statistics: CronStatistics = {
          totalExpressions: cronExpressions.length,
          validCount,
          invalidCount,
          frequencyDistribution: cronExpressions.reduce(
            (acc, expr) => {
              acc[expr.frequency.type] = (acc[expr.frequency.type] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          ),
          fieldComplexity: {},
          averageNextRuns:
            cronExpressions.reduce((sum, expr) => sum + expr.nextRuns.length, 0) / cronExpressions.length,
          successRate: (validCount / cronExpressions.length) * 100,
        }

        return {
          id: nanoid(),
          expressions: cronExpressions,
          count: cronExpressions.length,
          settings,
          createdAt: new Date(),
          statistics,
        }
      } catch (error) {
        console.error("Batch parsing error:", error)
        throw new Error(error instanceof Error ? error.message : "Batch parsing failed")
      }
    },
    [parseSingle]
  )

  return { parseSingle, parseBatch }
}

// Real-time validation hook
const useRealTimeCronValidation = (expression: string, settings: CronSettings) => {
  return useMemo(() => {
    if (!expression.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    try {
      const validation = validateCronExpression(expression, settings)
      return {
        isValid: validation.isValid,
        error: validation.errors.join("; ") || null,
        isEmpty: false,
        warnings: validation.warnings,
        suggestions: validation.suggestions,
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Validation failed",
        isEmpty: false,
      }
    }
  }, [expression, settings])
}

// Export functionality
const useCronExport = () => {
  const exportCronExpressions = useCallback(
    (expressions: CronExpression[], format: ExportFormat, filename?: string) => {
      let content = ""
      let mimeType = "text/plain"
      let extension = ".txt"

      switch (format) {
        case "json":
          content = JSON.stringify(expressions, null, 2)
          mimeType = "application/json"
          extension = ".json"
          break
        case "csv":
          content = generateCSVFromCron(expressions)
          mimeType = "text/csv"
          extension = ".csv"
          break
        case "xml":
          content = generateXMLFromCron(expressions)
          mimeType = "application/xml"
          extension = ".xml"
          break
        case "txt":
        default:
          content = generateTextFromCron(expressions)
          mimeType = "text/plain"
          extension = ".txt"
          break
      }

      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename || `cron-expressions${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    []
  )

  const exportBatch = useCallback(
    (batch: CronBatch) => {
      exportCronExpressions(batch.expressions, "json", `cron-batch-${batch.id}.json`)
      toast.success(`Exported ${batch.expressions.length} cron expressions`)
    },
    [exportCronExpressions]
  )

  const exportStatistics = useCallback((batches: CronBatch[]) => {
    const stats = batches.map((batch) => ({
      batchId: batch.id,
      expressionCount: batch.count,
      validCount: batch.statistics.validCount,
      invalidCount: batch.statistics.invalidCount,
      successRate: batch.statistics.successRate.toFixed(2),
      createdAt: batch.createdAt.toISOString(),
    }))

    const csvContent = [
      ["Batch ID", "Expression Count", "Valid Count", "Invalid Count", "Success Rate (%)", "Created At"],
      ...stats.map((stat) => [
        stat.batchId,
        stat.expressionCount.toString(),
        stat.validCount.toString(),
        stat.invalidCount.toString(),
        stat.successRate,
        stat.createdAt,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "cron-statistics.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Statistics exported")
  }, [])

  return { exportCronExpressions, exportBatch, exportStatistics }
}

// Generate export formats
const generateTextFromCron = (expressions: CronExpression[]): string => {
  return `Cron Expression Analysis Report
==============================

Generated: ${new Date().toLocaleString()}
Total Expressions: ${expressions.length}
Valid Expressions: ${expressions.filter((expr) => expr.isValid).length}
Invalid Expressions: ${expressions.filter((expr) => !expr.isValid).length}

Expressions:
${expressions
  .map((expr, i) => {
    const nextRunsText =
      expr.nextRuns.length > 0
        ? expr.nextRuns
            .slice(0, 3)
            .map((date) => date.toLocaleString())
            .join(", ")
        : "No upcoming runs"

    return `${i + 1}. Expression: ${expr.expression}
   Description: ${expr.humanReadable}
   Frequency: ${expr.frequency.description}
   Status: ${expr.isValid ? "Valid" : "Invalid"}
   ${expr.error ? `Error: ${expr.error}` : ""}
   Next Runs: ${nextRunsText}
`
  })
  .join("\n")}

Statistics:
- Success Rate: ${((expressions.filter((expr) => expr.isValid).length / expressions.length) * 100).toFixed(1)}%
`
}

const generateCSVFromCron = (expressions: CronExpression[]): string => {
  const rows = [
    [
      "Expression",
      "Human Readable",
      "Frequency Type",
      "Frequency Description",
      "Valid",
      "Error",
      "Next Run",
      "Timezone",
    ],
  ]

  expressions.forEach((expr) => {
    rows.push([
      expr.expression,
      expr.humanReadable,
      expr.frequency.type,
      expr.frequency.description,
      expr.isValid ? "Yes" : "No",
      expr.error || "",
      expr.nextRuns.length > 0 ? expr.nextRuns[0].toISOString() : "",
      expr.timezone,
    ])
  })

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}

const generateXMLFromCron = (expressions: CronExpression[]): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<cronExpressions>
  <metadata>
    <generated>${new Date().toISOString()}</generated>
    <count>${expressions.length}</count>
    <validCount>${expressions.filter((expr) => expr.isValid).length}</validCount>
  </metadata>
  <expressions>
    ${expressions
      .map(
        (expr) => `
    <expression>
      <value>${expr.expression}</value>
      <humanReadable>${expr.humanReadable}</humanReadable>
      <frequency>
        <type>${expr.frequency.type}</type>
        <description>${expr.frequency.description}</description>
      </frequency>
      <valid>${expr.isValid}</valid>
      ${expr.error ? `<error>${expr.error}</error>` : ""}
      <timezone>${expr.timezone}</timezone>
      <nextRuns>
        ${expr.nextRuns.map((date) => `<run>${date.toISOString()}</run>`).join("")}
      </nextRuns>
    </expression>`
      )
      .join("")}
  </expressions>
</cronExpressions>`
}

// Copy to clipboard functionality
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || "text")
      toast.success(`${label || "Text"} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }, [])

  return { copyToClipboard, copiedText }
}

/**
 * Enhanced Cron Parser Tool
 * Features: Expression parsing, validation, human-readable descriptions, schedule prediction
 */
const CronParserCore = () => {
  const [activeTab, setActiveTab] = useState<"parser" | "batch" | "templates">("parser")
  const [currentExpression, setCurrentExpression] = useState("")
  const [currentResult, setCurrentResult] = useState<CronExpression | null>(null)
  const [batches, setBatches] = useState<CronBatch[]>([])
  const [batchInput, setBatchInput] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<CronSettings>({
    timezone: "UTC",
    includeSeconds: false,
    includeYear: false,
    maxNextRuns: 5,
    validateOnly: false,
    exportFormat: "json",
    realTimeValidation: true,
    showExamples: true,
  })

  const { parseSingle, parseBatch } = useCronParsing()
  const { exportCronExpressions, exportBatch, exportStatistics } = useCronExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const realTimeValidation = useRealTimeCronValidation(currentExpression, settings)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = cronTemplates.find((t) => t.id === templateId)
    if (template) {
      setCurrentExpression(template.expression)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single parsing
  const handleParseSingle = useCallback(async () => {
    if (!currentExpression.trim()) {
      toast.error("Please enter a cron expression to parse")
      return
    }

    setIsProcessing(true)
    try {
      const result = parseSingle(currentExpression, settings)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success("Cron expression parsed successfully")
      } else {
        toast.error(result.error || "Parsing failed")
      }
    } catch (error) {
      toast.error("Failed to parse cron expression")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [currentExpression, settings, parseSingle])

  // Handle batch parsing
  const handleParseBatch = useCallback(async () => {
    const expressions = batchInput.split("\n").filter((line) => line.trim())

    if (expressions.length === 0) {
      toast.error("Please enter cron expressions to parse")
      return
    }

    setIsProcessing(true)
    try {
      const batch = parseBatch(expressions, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Parsed ${batch.expressions.length} cron expressions`)
    } catch (error) {
      toast.error("Failed to parse batch")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, settings, parseBatch])

  // Auto-parse when real-time validation is enabled
  useEffect(() => {
    if (settings.realTimeValidation && currentExpression.trim()) {
      const timer = setTimeout(() => {
        handleParseSingle()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentExpression, settings.realTimeValidation, handleParseSingle])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div
        id="main-content"
        className="flex flex-col gap-4"
      >
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cron Expression Parser & Analyzer
            </CardTitle>
            <CardDescription>
              Advanced cron expression parser with validation, human-readable descriptions, and schedule prediction.
              Parse and analyze cron expressions with comprehensive validation and next run calculations. Use keyboard
              navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "parser" | "batch" | "templates")}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="parser"
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              Expression Parser
            </TabsTrigger>
            <TabsTrigger
              value="batch"
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Templates & Examples
            </TabsTrigger>
          </TabsList>

          {/* Expression Parser Tab */}
          <TabsContent
            value="parser"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Cron Expression Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="cron-expression"
                      className="text-sm font-medium"
                    >
                      Cron Expression
                    </Label>
                    <Input
                      id="cron-expression"
                      value={currentExpression}
                      onChange={(e) => setCurrentExpression(e.target.value)}
                      placeholder="* * * * * (minute hour day month weekday)"
                      className="mt-2 font-mono"
                    />
                    {settings.realTimeValidation && currentExpression && (
                      <div className="mt-2 text-sm">
                        {realTimeValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid expression
                          </div>
                        ) : realTimeValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {realTimeValidation.error}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="timezone"
                        className="text-sm font-medium"
                      >
                        Timezone
                      </Label>
                      <Select
                        value={settings.timezone}
                        onValueChange={(value) => setSettings((prev) => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_TIMEZONES.map((tz) => (
                            <SelectItem
                              key={tz}
                              value={tz}
                            >
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="max-runs"
                        className="text-sm font-medium"
                      >
                        Max Next Runs
                      </Label>
                      <Select
                        value={settings.maxNextRuns.toString()}
                        onValueChange={(value) => setSettings((prev) => ({ ...prev, maxNextRuns: parseInt(value) }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id="real-time-validation"
                        type="checkbox"
                        checked={settings.realTimeValidation}
                        onChange={(e) => setSettings((prev) => ({ ...prev, realTimeValidation: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="real-time-validation"
                        className="text-sm"
                      >
                        Real-time validation
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="include-year"
                        type="checkbox"
                        checked={settings.includeYear}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeYear: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="include-year"
                        className="text-sm"
                      >
                        Include year field (6-field format)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="show-examples"
                        type="checkbox"
                        checked={settings.showExamples}
                        onChange={(e) => setSettings((prev) => ({ ...prev, showExamples: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="show-examples"
                        className="text-sm"
                      >
                        Show examples and help
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleParseSingle}
                      disabled={!currentExpression.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Parse Expression
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentExpression("")
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {settings.showExamples && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Cron Format Help:</h4>
                      <div className="text-xs space-y-1 font-mono">
                        <div>* * * * * (minute hour day month weekday)</div>
                        <div>0-59 0-23 1-31 1-12 0-7 (ranges)</div>
                        <div>Examples: */5 * * * * (every 5 minutes)</div>
                        <div>0 9 * * 1-5 (9 AM on weekdays)</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Parsing Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-2">Expression</div>
                        <div className="font-mono text-sm bg-muted p-2 rounded">{currentResult.expression}</div>
                      </div>

                      {currentResult.isValid ? (
                        <div className="space-y-4">
                          {/* Human Readable Description */}
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="font-medium text-sm">Human Readable</Label>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(currentResult.humanReadable, "Description")}
                              >
                                {copiedText === "Description" ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div className="text-sm bg-muted p-2 rounded">{currentResult.humanReadable}</div>
                          </div>

                          {/* Frequency Information */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm">Frequency</Label>
                            <div className="text-sm mt-2">
                              <div>
                                <strong>Type:</strong> {currentResult.frequency.type}
                              </div>
                              <div>
                                <strong>Description:</strong> {currentResult.frequency.description}
                              </div>
                            </div>
                          </div>

                          {/* Field Breakdown */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Field Breakdown</Label>
                            <div className="space-y-2 text-xs">
                              {Object.entries(currentResult.parsedFields).map(([fieldName, field]) => (
                                <div
                                  key={fieldName}
                                  className="grid grid-cols-3 gap-2"
                                >
                                  <div className="font-medium capitalize">{fieldName}:</div>
                                  <div className="font-mono">{field.raw}</div>
                                  <div className="text-muted-foreground">{field.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Next Runs */}
                          {currentResult.nextRuns.length > 0 && (
                            <div className="border rounded-lg p-3">
                              <Label className="font-medium text-sm mb-3 block">
                                Next {currentResult.nextRuns.length} Runs
                              </Label>
                              <div className="space-y-2">
                                {currentResult.nextRuns.map((date, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <span>{date.toLocaleString()}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(date.toISOString(), `Run ${index + 1}`)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Parsing Error</span>
                          </div>
                          <div className="text-red-700 text-sm mt-1">{currentResult.error}</div>
                        </div>
                      )}

                      {currentResult.isValid && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => exportCronExpressions([currentResult], settings.exportFormat)}
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
                      <Code className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Expression Parsed</h3>
                      <p className="text-muted-foreground mb-4">
                        Enter a cron expression and click parse to see the results
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Processing Tab */}
          <TabsContent
            value="batch"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Batch Cron Expression Processing
                </CardTitle>
                <CardDescription>Parse multiple cron expressions at once (one per line)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="batch-input"
                      className="text-sm font-medium"
                    >
                      Cron Expressions (one per line)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder="* * * * *&#10;0 9 * * 1-5&#10;0 0 1 * *"
                      className="mt-2 min-h-[120px] font-mono"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleParseBatch}
                      disabled={!batchInput.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Parse Batch
                    </Button>
                    <Button
                      onClick={() => setBatchInput("")}
                      variant="outline"
                    >
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
                      <div
                        key={batch.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{batch.count} expressions processed</h4>
                            <div className="text-sm text-muted-foreground">
                              {batch.createdAt.toLocaleString()} • {batch.statistics.successRate.toFixed(1)}% success
                              rate
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportBatch(batch)}
                            >
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
                            <span className="font-medium">Success Rate:</span> {batch.statistics.successRate.toFixed(1)}
                            %
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.expressions.slice(0, 5).map((expr) => (
                              <div
                                key={expr.id}
                                className="text-xs border rounded p-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">{expr.expression}</span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      expr.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {expr.isValid ? "Valid" : "Invalid"}
                                  </span>
                                </div>
                                {expr.isValid && <div className="text-muted-foreground mt-1">{expr.humanReadable}</div>}
                                {expr.error && <div className="text-red-600 mt-1">{expr.error}</div>}
                              </div>
                            ))}
                            {batch.expressions.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.expressions.length - 5} more expressions
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
          <TabsContent
            value="templates"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Cron Expression Templates
                </CardTitle>
                <CardDescription>Common cron expressions for various scheduling needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cronTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                        </div>
                        <div className="font-mono text-xs bg-muted p-2 rounded">{template.expression}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="text-xs">
                          <strong>Frequency:</strong> {template.frequency}
                        </div>
                        {template.examples.length > 0 && (
                          <div className="text-xs">
                            <strong>Use cases:</strong> {template.examples.join(", ")}
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
                Export Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label
                  htmlFor="export-format"
                  className="text-sm font-medium"
                >
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

              {batches.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => exportStatistics(batches)}
                    variant="outline"
                  >
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
const CronParser = () => {
  return <CronParserCore />
}

export default CronParser
