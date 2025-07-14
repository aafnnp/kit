import React, { useCallback, useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  BookOpen,
  Search,
  ArrowLeftRight,
  ArrowRight,
  Eye,
  EyeOff,
  Braces,
  FileSpreadsheet,
} from 'lucide-react'

// Enhanced Types
interface ConversionResult {
  id: string
  input: string
  output: string
  direction: ConversionDirection
  isValid: boolean
  error?: string
  statistics: ConversionStatistics
  analysis?: DataAnalysis
  createdAt: Date
}

interface ConversionStatistics {
  inputSize: number
  outputSize: number
  inputLines: number
  outputLines: number
  processingTime: number
  dataMetrics: DataMetrics
  compressionRatio: number
}

interface DataMetrics {
  rowCount: number
  columnCount: number
  totalCells: number
  emptyValues: number
  dataTypes: DataTypeCount
  encoding: string
}

interface DataTypeCount {
  strings: number
  numbers: number
  booleans: number
  nulls: number
  dates: number
  objects: number
  arrays: number
}

interface DataAnalysis {
  hasHeaders: boolean
  delimiter: string
  quoteChar: string
  escapeChar: string
  hasNestedData: boolean
  hasSpecialChars: boolean
  suggestedImprovements: string[]
  dataIssues: string[]
  qualityScore: number
}

interface ConversionBatch {
  id: string
  results: ConversionResult[]
  count: number
  settings: ConversionSettings
  createdAt: Date
  statistics: BatchStatistics
}

interface BatchStatistics {
  totalConverted: number
  validCount: number
  invalidCount: number
  averageQuality: number
  totalInputSize: number
  totalOutputSize: number
  successRate: number
}

interface ConversionSettings {
  delimiter: string
  quoteChar: string
  escapeChar: string
  hasHeaders: boolean
  skipEmptyLines: boolean
  trimWhitespace: boolean
  realTimeConversion: boolean
  exportFormat: ExportFormat
  jsonIndentation: number
  csvQuoting: CSVQuoting
  dateFormat: string
  numberFormat: string
}

interface CSVTemplate {
  id: string
  name: string
  description: string
  category: string
  csvExample: string
  jsonExample: string
  useCase: string[]
}

interface DataValidation {
  isValid: boolean
  errors: DataError[]
  warnings: string[]
  suggestions: string[]
}

interface DataError {
  message: string
  line?: number
  column?: string
  value?: string
}

// Enums
type ConversionDirection = 'csv-to-json' | 'json-to-csv'
type ExportFormat = 'json' | 'csv' | 'txt' | 'xlsx'
type CSVQuoting = 'minimal' | 'all' | 'non-numeric' | 'none'

// Utility functions
const generateId = (): string => Math.random().toString(36).substring(2, 11)

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const detectDelimiter = (csvText: string): string => {
  const delimiters = [',', ';', '\t', '|']
  const firstLine = csvText.split('\n')[0]

  let maxCount = 0
  let detectedDelimiter = ','

  delimiters.forEach((delimiter) => {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length
    if (count > maxCount) {
      maxCount = count
      detectedDelimiter = delimiter
    }
  })

  return detectedDelimiter
}

// CSV parsing functions
const parseCSVLine = (line: string, delimiter: string, quoteChar: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === quoteChar) {
      if (inQuotes && nextChar === quoteChar) {
        // Escaped quote
        current += quoteChar
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
      i++
    } else {
      current += char
      i++
    }
  }

  result.push(current.trim())
  return result
}

const csvToJson = (csvText: string, settings: ConversionSettings): any[] => {
  const lines = csvText.split(/\r?\n/).filter((line) => (settings.skipEmptyLines ? line.trim() : true))

  if (lines.length === 0) {
    throw new Error('Empty CSV data')
  }

  const delimiter = settings.delimiter === 'auto' ? detectDelimiter(csvText) : settings.delimiter
  let headers: string[] = []
  let dataLines = lines

  if (settings.hasHeaders) {
    headers = parseCSVLine(lines[0], delimiter, settings.quoteChar)
    dataLines = lines.slice(1)
  } else {
    // Generate column names
    const firstLine = parseCSVLine(lines[0], delimiter, settings.quoteChar)
    headers = firstLine.map((_, index) => `column_${index + 1}`)
  }

  const result = dataLines.map((line, _lineIndex) => {
    const values = parseCSVLine(line, delimiter, settings.quoteChar)
    const row: any = {}

    headers.forEach((header, index) => {
      let value = values[index] || ''

      if (settings.trimWhitespace) {
        value = value.trim()
      }

      // Type inference
      if (value === '') {
        row[header] = null
      } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        row[header] = value.toLowerCase() === 'true'
      } else if (!isNaN(Number(value)) && value !== '') {
        row[header] = Number(value)
      } else {
        row[header] = value
      }
    })

    return row
  })

  return result
}

// JSON to CSV functions
const jsonToCsv = (jsonData: any[], settings: ConversionSettings): string => {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    throw new Error('JSON must be an array of objects')
  }

  // Extract all unique keys
  const allKeys = new Set<string>()
  jsonData.forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach((key) => allKeys.add(key))
    }
  })

  const headers = Array.from(allKeys)
  const lines: string[] = []

  // Add headers if enabled
  if (settings.hasHeaders) {
    lines.push(formatCSVLine(headers, settings))
  }

  // Add data rows
  jsonData.forEach((item) => {
    const values = headers.map((header) => {
      const value = item[header]

      if (value === null || value === undefined) {
        return ''
      } else if (typeof value === 'object') {
        return JSON.stringify(value)
      } else {
        return String(value)
      }
    })

    lines.push(formatCSVLine(values, settings))
  })

  return lines.join('\n')
}

const formatCSVLine = (values: string[], settings: ConversionSettings): string => {
  return values
    .map((value) => {
      const needsQuoting =
        settings.csvQuoting === 'all' ||
        (settings.csvQuoting === 'minimal' &&
          (value.includes(settings.delimiter) ||
            value.includes(settings.quoteChar) ||
            value.includes('\n') ||
            value.includes('\r'))) ||
        (settings.csvQuoting === 'non-numeric' && isNaN(Number(value)))

      if (needsQuoting) {
        // Escape quotes by doubling them
        const escapedValue = value.replace(new RegExp(settings.quoteChar, 'g'), settings.quoteChar + settings.quoteChar)
        return `${settings.quoteChar}${escapedValue}${settings.quoteChar}`
      }

      return value
    })
    .join(settings.delimiter)
}

// Analysis functions
const analyzeData = (input: string, direction: ConversionDirection, settings: ConversionSettings): DataAnalysis => {
  const analysis: DataAnalysis = {
    hasHeaders: settings.hasHeaders,
    delimiter: settings.delimiter,
    quoteChar: settings.quoteChar,
    escapeChar: settings.escapeChar,
    hasNestedData: false,
    hasSpecialChars: false,
    suggestedImprovements: [],
    dataIssues: [],
    qualityScore: 100,
  }

  if (direction === 'csv-to-json') {
    // Analyze CSV
    const lines = input.split(/\r?\n/)

    // Check for special characters
    if (input.includes('\t')) {
      analysis.hasSpecialChars = true
      analysis.suggestedImprovements.push('Consider using tab delimiter for tab-separated data')
    }

    if (input.includes(';')) {
      analysis.suggestedImprovements.push('Consider using semicolon delimiter for European CSV format')
    }

    // Check for inconsistent column counts
    const delimiter = settings.delimiter === 'auto' ? detectDelimiter(input) : settings.delimiter
    const columnCounts = lines.map((line) => parseCSVLine(line, delimiter, settings.quoteChar).length)
    const uniqueCounts = [...new Set(columnCounts)]

    if (uniqueCounts.length > 1) {
      analysis.dataIssues.push('Inconsistent number of columns across rows')
      analysis.qualityScore -= 20
    }
  } else {
    // Analyze JSON
    try {
      const parsed = JSON.parse(input)

      if (Array.isArray(parsed)) {
        // Check for nested objects
        const hasNested = parsed.some(
          (item) =>
            typeof item === 'object' && Object.values(item).some((value) => typeof value === 'object' && value !== null)
        )

        if (hasNested) {
          analysis.hasNestedData = true
          analysis.suggestedImprovements.push('Nested objects will be stringified in CSV format')
        }
      } else {
        analysis.dataIssues.push('JSON should be an array of objects for CSV conversion')
        analysis.qualityScore -= 30
      }
    } catch {
      analysis.dataIssues.push('Invalid JSON format')
      analysis.qualityScore -= 50
    }
  }

  return analysis
}

// CSV/JSON templates
const conversionTemplates: CSVTemplate[] = [
  {
    id: 'simple-table',
    name: 'Simple Table',
    description: 'Basic table with headers and simple data types',
    category: 'Basic',
    csvExample: `name,age,email,active
John Doe,30,john@example.com,true
Jane Smith,25,jane@example.com,false
Bob Johnson,35,bob@example.com,true`,
    jsonExample: `[
  {
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com",
    "active": true
  },
  {
    "name": "Jane Smith",
    "age": 25,
    "email": "jane@example.com",
    "active": false
  },
  {
    "name": "Bob Johnson",
    "age": 35,
    "email": "bob@example.com",
    "active": true
  }
]`,
    useCase: ['User data', 'Contact lists', 'Simple databases'],
  },
  {
    id: 'sales-data',
    name: 'Sales Data',
    description: 'Sales records with dates and numbers',
    category: 'Business',
    csvExample: `date,product,quantity,price,total
2024-01-15,Widget A,10,29.99,299.90
2024-01-16,Widget B,5,39.99,199.95
2024-01-17,Widget C,8,19.99,159.92`,
    jsonExample: `[
  {
    "date": "2024-01-15",
    "product": "Widget A",
    "quantity": 10,
    "price": 29.99,
    "total": 299.90
  },
  {
    "date": "2024-01-16",
    "product": "Widget B",
    "quantity": 5,
    "price": 39.99,
    "total": 199.95
  },
  {
    "date": "2024-01-17",
    "product": "Widget C",
    "quantity": 8,
    "price": 19.99,
    "total": 159.92
  }
]`,
    useCase: ['Sales reports', 'Financial data', 'E-commerce analytics'],
  },
  {
    id: 'semicolon-csv',
    name: 'Semicolon Delimited',
    description: 'European CSV format with semicolon delimiter',
    category: 'Formats',
    csvExample: `name;country;population;gdp
France;FR;67000000;2.94
Germany;DE;83000000;4.26
Italy;IT;60000000;2.11`,
    jsonExample: `[
  {
    "name": "France",
    "country": "FR",
    "population": 67000000,
    "gdp": 2.94
  },
  {
    "name": "Germany",
    "country": "DE",
    "population": 83000000,
    "gdp": 4.26
  },
  {
    "name": "Italy",
    "country": "IT",
    "population": 60000000,
    "gdp": 2.11
  }
]`,
    useCase: ['European data', 'Localized formats', 'International datasets'],
  },
  {
    id: 'quoted-data',
    name: 'Quoted Fields',
    description: 'CSV with quoted fields containing special characters',
    category: 'Complex',
    csvExample: `title,description,tags,status
"Product A","High-quality widget, best in class","widget,premium,new",active
"Product B","Budget option, ""good value""","widget,budget,sale",inactive
"Product C","Enterprise solution, multi-feature","enterprise,premium",active`,
    jsonExample: `[
  {
    "title": "Product A",
    "description": "High-quality widget, best in class",
    "tags": "widget,premium,new",
    "status": "active"
  },
  {
    "title": "Product B",
    "description": "Budget option, \\"good value\\"",
    "tags": "widget,budget,sale",
    "status": "inactive"
  },
  {
    "title": "Product C",
    "description": "Enterprise solution, multi-feature",
    "tags": "enterprise,premium",
    "status": "active"
  }
]`,
    useCase: ['Product catalogs', 'Content management', 'Complex text data'],
  },
  {
    id: 'nested-json',
    name: 'Nested JSON',
    description: 'JSON with nested objects (flattened in CSV)',
    category: 'Complex',
    csvExample: `id,name,address,metadata
1,John Doe,"{""street"":""123 Main St"",""city"":""New York""}","{""created"":""2024-01-15"",""source"":""web""}"
2,Jane Smith,"{""street"":""456 Oak Ave"",""city"":""Los Angeles""}","{""created"":""2024-01-16"",""source"":""mobile""}"`,
    jsonExample: `[
  {
    "id": 1,
    "name": "John Doe",
    "address": {
      "street": "123 Main St",
      "city": "New York"
    },
    "metadata": {
      "created": "2024-01-15",
      "source": "web"
    }
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "address": {
      "street": "456 Oak Ave",
      "city": "Los Angeles"
    },
    "metadata": {
      "created": "2024-01-16",
      "source": "mobile"
    }
  }
]`,
    useCase: ['API responses', 'Complex data structures', 'Database exports'],
  },
]

// Validation functions
const validateData = (input: string, direction: ConversionDirection): DataValidation => {
  const validation: DataValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!input.trim()) {
    validation.isValid = false
    validation.errors.push({ message: 'Input cannot be empty' })
    return validation
  }

  if (direction === 'csv-to-json') {
    // Validate CSV
    const lines = input.split(/\r?\n/).filter((line) => line.trim())

    if (lines.length === 0) {
      validation.isValid = false
      validation.errors.push({ message: 'No valid CSV lines found' })
      return validation
    }

    // Check for consistent delimiters
    const firstLineCommas = (lines[0].match(/,/g) || []).length
    const firstLineSemicolons = (lines[0].match(/;/g) || []).length
    const firstLineTabs = (lines[0].match(/\t/g) || []).length

    if (firstLineCommas === 0 && firstLineSemicolons === 0 && firstLineTabs === 0) {
      validation.warnings.push('No common delimiters detected - data may be in single column')
    }
  } else {
    // Validate JSON
    try {
      const parsed = JSON.parse(input)

      if (!Array.isArray(parsed)) {
        validation.warnings.push('JSON should be an array for optimal CSV conversion')
      } else if (parsed.length === 0) {
        validation.warnings.push('Empty array will produce empty CSV')
      } else {
        // Check for consistent object structure
        const firstKeys = Object.keys(parsed[0] || {})
        const inconsistentRows = parsed.filter((item, _index) => {
          const keys = Object.keys(item || {})
          return keys.length !== firstKeys.length || !firstKeys.every((key) => keys.includes(key))
        })

        if (inconsistentRows.length > 0) {
          validation.warnings.push(`${inconsistentRows.length} rows have inconsistent structure`)
        }
      }
    } catch (error) {
      validation.isValid = false
      if (error instanceof SyntaxError) {
        validation.errors.push({
          message: `Invalid JSON: ${error.message}`,
          line: extractLineFromError(error.message),
        })
      } else {
        validation.errors.push({ message: 'Unknown JSON parsing error' })
      }
    }
  }

  return validation
}

const extractLineFromError = (errorMessage: string): number | undefined => {
  const match = errorMessage.match(/line (\d+)/i)
  return match ? parseInt(match[1]) : undefined
}

// Error boundary component
class CSVJSONErrorBoundary extends React.Component<
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
    console.error('CSV/JSON conversion error:', error, errorInfo)
    toast.error('An unexpected error occurred during conversion')
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
const useDataConversion = () => {
  const convertSingle = useCallback(
    (input: string, direction: ConversionDirection, settings: ConversionSettings): ConversionResult => {
      const startTime = performance.now()

      try {
        let output: string
        let dataMetrics: DataMetrics

        if (direction === 'csv-to-json') {
          const jsonData = csvToJson(input, settings)
          output = JSON.stringify(jsonData, null, settings.jsonIndentation)

          // Calculate metrics for CSV input
          const lines = input.split(/\r?\n/).filter((line) => line.trim())
          const delimiter = settings.delimiter === 'auto' ? detectDelimiter(input) : settings.delimiter
          const firstLine = parseCSVLine(lines[0] || '', delimiter, settings.quoteChar)

          dataMetrics = {
            rowCount: lines.length - (settings.hasHeaders ? 1 : 0),
            columnCount: firstLine.length,
            totalCells: (lines.length - (settings.hasHeaders ? 1 : 0)) * firstLine.length,
            emptyValues: 0, // TODO: Calculate empty values
            dataTypes: analyzeDataTypes(jsonData),
            encoding: 'UTF-8',
          }
        } else {
          const jsonData = JSON.parse(input)
          output = jsonToCsv(jsonData, settings)

          // Calculate metrics for JSON input
          dataMetrics = {
            rowCount: Array.isArray(jsonData) ? jsonData.length : 1,
            columnCount: Array.isArray(jsonData) && jsonData.length > 0 ? Object.keys(jsonData[0] || {}).length : 0,
            totalCells: Array.isArray(jsonData) ? jsonData.length * Object.keys(jsonData[0] || {}).length : 0,
            emptyValues: 0, // TODO: Calculate empty values
            dataTypes: analyzeDataTypes(jsonData),
            encoding: 'UTF-8',
          }
        }

        const analysis = analyzeData(input, direction, settings)
        const endTime = performance.now()
        const processingTime = endTime - startTime

        const inputSize = new Blob([input]).size
        const outputSize = new Blob([output]).size

        return {
          id: generateId(),
          input,
          output,
          direction,
          isValid: true,
          statistics: {
            inputSize,
            outputSize,
            inputLines: input.split('\n').length,
            outputLines: output.split('\n').length,
            processingTime,
            dataMetrics,
            compressionRatio: outputSize / inputSize,
          },
          analysis,
          createdAt: new Date(),
        }
      } catch (error) {
        const endTime = performance.now()
        const processingTime = endTime - startTime

        return {
          id: generateId(),
          input,
          output: '',
          direction,
          isValid: false,
          error: error instanceof Error ? error.message : 'Conversion failed',
          statistics: {
            inputSize: new Blob([input]).size,
            outputSize: 0,
            inputLines: input.split('\n').length,
            outputLines: 0,
            processingTime,
            dataMetrics: {
              rowCount: 0,
              columnCount: 0,
              totalCells: 0,
              emptyValues: 0,
              dataTypes: { strings: 0, numbers: 0, booleans: 0, nulls: 0, dates: 0, objects: 0, arrays: 0 },
              encoding: 'UTF-8',
            },
            compressionRatio: 0,
          },
          createdAt: new Date(),
        }
      }
    },
    []
  )

  const convertBatch = useCallback(
    (
      inputs: Array<{ content: string; direction: ConversionDirection }>,
      settings: ConversionSettings
    ): ConversionBatch => {
      try {
        const results = inputs.map((input) => convertSingle(input.content, input.direction, settings))

        const validCount = results.filter((result) => result.isValid).length
        const invalidCount = results.length - validCount

        const totalInputSize = results.reduce((sum, result) => sum + result.statistics.inputSize, 0)
        const totalOutputSize = results.reduce((sum, result) => sum + result.statistics.outputSize, 0)
        const averageQuality =
          results.length > 0
            ? results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length
            : 0

        const statistics: BatchStatistics = {
          totalConverted: results.length,
          validCount,
          invalidCount,
          averageQuality,
          totalInputSize,
          totalOutputSize,
          successRate: (validCount / results.length) * 100,
        }

        return {
          id: generateId(),
          results,
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
    [convertSingle]
  )

  return { convertSingle, convertBatch }
}

// Helper function to analyze data types
const analyzeDataTypes = (data: any): DataTypeCount => {
  const counts: DataTypeCount = {
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
    dates: 0,
    objects: 0,
    arrays: 0,
  }

  const analyzeValue = (value: any) => {
    if (value === null || value === undefined) {
      counts.nulls++
    } else if (typeof value === 'boolean') {
      counts.booleans++
    } else if (typeof value === 'number') {
      counts.numbers++
    } else if (typeof value === 'string') {
      // Check if it's a date string
      if (!isNaN(Date.parse(value)) && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        counts.dates++
      } else {
        counts.strings++
      }
    } else if (Array.isArray(value)) {
      counts.arrays++
      value.forEach(analyzeValue)
    } else if (typeof value === 'object') {
      counts.objects++
      Object.values(value).forEach(analyzeValue)
    }
  }

  if (Array.isArray(data)) {
    data.forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        Object.values(item).forEach(analyzeValue)
      } else {
        analyzeValue(item)
      }
    })
  } else {
    analyzeValue(data)
  }

  return counts
}

// Real-time validation hook
const useRealTimeValidation = (input: string, direction: ConversionDirection) => {
  return useMemo(() => {
    if (!input.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = validateData(input, direction)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
    }
  }, [input, direction])
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
const useDataExport = () => {
  const exportResults = useCallback((results: ConversionResult[], format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'csv':
        content = results
          .map((result) => (result.direction === 'json-to-csv' ? result.output : result.input))
          .join('\n\n')
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'json':
        const jsonData = results.map((result) => ({
          id: result.id,
          direction: result.direction,
          input: result.input,
          output: result.output,
          isValid: result.isValid,
          error: result.error,
          statistics: result.statistics,
          analysis: result.analysis,
          createdAt: result.createdAt,
        }))
        content = JSON.stringify(jsonData, null, 2)
        mimeType = 'application/json'
        extension = '.json'
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
    link.download = filename || `csv-json-conversion${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResults }
}

// Generate text report from results
const generateTextFromResults = (results: ConversionResult[]): string => {
  return `CSV ⇄ JSON Conversion Report
============================

Generated: ${new Date().toLocaleString()}
Total Results: ${results.length}
Valid Results: ${results.filter((result) => result.isValid).length}
Invalid Results: ${results.filter((result) => !result.isValid).length}

Results:
${results
  .map((result, i) => {
    return `${i + 1}. Direction: ${result.direction}
   Status: ${result.isValid ? 'Valid' : 'Invalid'}
   ${result.error ? `Error: ${result.error}` : ''}
   Input Size: ${formatFileSize(result.statistics.inputSize)}
   Output Size: ${formatFileSize(result.statistics.outputSize)}
   Processing Time: ${result.statistics.processingTime.toFixed(2)}ms
   Data: ${result.statistics.dataMetrics.rowCount} rows, ${result.statistics.dataMetrics.columnCount} columns
   Quality Score: ${result.analysis?.qualityScore || 'N/A'}
`
  })
  .join('\n')}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Average Quality: ${(results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length).toFixed(1)}
`
}

/**
 * Enhanced CSV ⇄ JSON Bidirectional Converter
 * Features: Advanced CSV/JSON conversion, validation, analysis, batch processing, comprehensive format support
 */
const CSVJSONCore = () => {
  const [activeTab, setActiveTab] = useState<'converter' | 'batch' | 'analyzer' | 'templates'>('converter')
  const [input, setInput] = useState('')
  const [direction, setDirection] = useState<ConversionDirection>('csv-to-json')
  const [currentResult, setCurrentResult] = useState<ConversionResult | null>(null)
  const [batches, setBatches] = useState<ConversionBatch[]>([])
  const [batchInput, setBatchInput] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [settings, setSettings] = useState<ConversionSettings>({
    delimiter: ',',
    quoteChar: '"',
    escapeChar: '"',
    hasHeaders: true,
    skipEmptyLines: true,
    trimWhitespace: true,
    realTimeConversion: true,
    exportFormat: 'json',
    jsonIndentation: 2,
    csvQuoting: 'minimal',
    dateFormat: 'ISO',
    numberFormat: 'auto',
  })

  const { convertSingle, convertBatch } = useDataConversion()
  const { exportResults } = useDataExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const inputValidation = useRealTimeValidation(input, direction)

  // Apply template
  const applyTemplate = useCallback(
    (templateId: string) => {
      const template = conversionTemplates.find((t) => t.id === templateId)
      if (template) {
        if (direction === 'csv-to-json') {
          setInput(template.csvExample)
        } else {
          setInput(template.jsonExample)
        }
        setSelectedTemplate(templateId)

        // Auto-detect settings from template
        if (template.csvExample.includes(';')) {
          setSettings((prev) => ({ ...prev, delimiter: ';' }))
        }

        toast.success(`Applied template: ${template.name}`)
      }
    },
    [direction]
  )

  // Handle single conversion
  const handleConvertSingle = useCallback(async () => {
    if (!input.trim()) {
      toast.error('Please enter data to convert')
      return
    }

    setIsProcessing(true)
    try {
      const result = convertSingle(input, direction, settings)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success(`${direction === 'csv-to-json' ? 'CSV to JSON' : 'JSON to CSV'} conversion completed`)
      } else {
        toast.error(result.error || 'Conversion failed')
      }
    } catch (error) {
      toast.error('Failed to convert data')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [input, direction, settings, convertSingle])

  // Handle batch processing
  const handleConvertBatch = useCallback(async () => {
    const lines = batchInput.split('\n').filter((line) => line.trim())

    if (lines.length === 0) {
      toast.error('Please enter data to process')
      return
    }

    // Parse batch input format: direction:data
    const inputs = lines
      .map((line, _index) => {
        const colonIndex = line.indexOf(':')
        if (colonIndex === -1) {
          return {
            content: line.trim(),
            direction: direction,
          }
        }

        const directionStr = line.substring(0, colonIndex).trim()
        const content = line.substring(colonIndex + 1).trim()

        const parsedDirection: ConversionDirection = directionStr.toLowerCase().includes('json')
          ? 'json-to-csv'
          : 'csv-to-json'

        return { content, direction: parsedDirection }
      })
      .filter((input) => input.content)

    if (inputs.length === 0) {
      toast.error('No valid data found')
      return
    }

    setIsProcessing(true)
    try {
      const batch = convertBatch(inputs, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Processed ${batch.results.length} conversions`)
    } catch (error) {
      toast.error('Failed to process batch')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, direction, settings, convertBatch])

  // Auto-convert when real-time conversion is enabled
  useEffect(() => {
    if (settings.realTimeConversion && input.trim() && inputValidation.isValid) {
      const timer = setTimeout(() => {
        handleConvertSingle()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [input, inputValidation.isValid, settings.realTimeConversion, handleConvertSingle])

  // Toggle conversion direction
  const toggleDirection = useCallback(() => {
    const newDirection: ConversionDirection = direction === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json'
    setDirection(newDirection)

    // Swap input/output if there's a current result
    if (currentResult && currentResult.isValid) {
      setInput(currentResult.output)
      setCurrentResult(null)
    }

    toast.success(`Switched to ${newDirection === 'csv-to-json' ? 'CSV to JSON' : 'JSON to CSV'} mode`)
  }, [direction, currentResult])

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
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
                <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                <Braces className="h-5 w-5" aria-hidden="true" />
              </div>
              CSV ⇄ JSON Bidirectional Converter
            </CardTitle>
            <CardDescription>
              Advanced bidirectional CSV and JSON converter with intelligent parsing, validation, analysis, and batch
              processing capabilities. Convert between CSV and JSON formats with comprehensive format support and error
              reporting. Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'converter' | 'batch' | 'analyzer' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="converter" className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Converter
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Data Analyzer
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Converter Tab */}
          <TabsContent value="converter" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {direction === 'csv-to-json' ? (
                      <FileSpreadsheet className="h-5 w-5" />
                    ) : (
                      <Braces className="h-5 w-5" />
                    )}
                    {direction === 'csv-to-json' ? 'CSV Input' : 'JSON Input'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Button onClick={toggleDirection} variant="outline" size="sm" className="flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4" />
                      Switch to {direction === 'csv-to-json' ? 'JSON → CSV' : 'CSV → JSON'}
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Current: {direction === 'csv-to-json' ? 'CSV → JSON' : 'JSON → CSV'}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="data-input" className="text-sm font-medium">
                      {direction === 'csv-to-json' ? 'CSV Data' : 'JSON Data'}
                    </Label>
                    <Textarea
                      id="data-input"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        direction === 'csv-to-json'
                          ? 'Enter or paste your CSV data here...'
                          : 'Enter or paste your JSON data here...'
                      }
                      className="mt-2 min-h-[200px] font-mono"
                      aria-label={`${direction === 'csv-to-json' ? 'CSV' : 'JSON'} input for conversion`}
                    />
                    {settings.realTimeConversion && input && (
                      <div className="mt-2 text-sm">
                        {inputValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid {direction === 'csv-to-json' ? 'CSV' : 'JSON'}
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

                  {/* CSV-specific settings */}
                  {direction === 'csv-to-json' && (
                    <div className="space-y-3 border-t pt-4">
                      <Label className="text-sm font-medium">CSV Settings</Label>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="delimiter" className="text-xs">
                            Delimiter
                          </Label>
                          <Select
                            value={settings.delimiter}
                            onValueChange={(value) => setSettings((prev) => ({ ...prev, delimiter: value }))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value=",">Comma (,)</SelectItem>
                              <SelectItem value=";">Semicolon (;)</SelectItem>
                              <SelectItem value="\t">Tab</SelectItem>
                              <SelectItem value="|">Pipe (|)</SelectItem>
                              <SelectItem value="auto">Auto-detect</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="quote-char" className="text-xs">
                            Quote Character
                          </Label>
                          <Select
                            value={settings.quoteChar}
                            onValueChange={(value) => setSettings((prev) => ({ ...prev, quoteChar: value }))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='"'>Double Quote (")</SelectItem>
                              <SelectItem value="'">Single Quote (')</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            id="has-headers"
                            type="checkbox"
                            checked={settings.hasHeaders}
                            onChange={(e) => setSettings((prev) => ({ ...prev, hasHeaders: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label htmlFor="has-headers" className="text-xs">
                            First row contains headers
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            id="skip-empty"
                            type="checkbox"
                            checked={settings.skipEmptyLines}
                            onChange={(e) => setSettings((prev) => ({ ...prev, skipEmptyLines: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label htmlFor="skip-empty" className="text-xs">
                            Skip empty lines
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            id="trim-whitespace"
                            type="checkbox"
                            checked={settings.trimWhitespace}
                            onChange={(e) => setSettings((prev) => ({ ...prev, trimWhitespace: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label htmlFor="trim-whitespace" className="text-xs">
                            Trim whitespace
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* JSON-specific settings */}
                  {direction === 'json-to-csv' && (
                    <div className="space-y-3 border-t pt-4">
                      <Label className="text-sm font-medium">CSV Output Settings</Label>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="csv-delimiter" className="text-xs">
                            Delimiter
                          </Label>
                          <Select
                            value={settings.delimiter}
                            onValueChange={(value) => setSettings((prev) => ({ ...prev, delimiter: value }))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value=",">Comma (,)</SelectItem>
                              <SelectItem value=";">Semicolon (;)</SelectItem>
                              <SelectItem value="\t">Tab</SelectItem>
                              <SelectItem value="|">Pipe (|)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="csv-quoting" className="text-xs">
                            Quoting
                          </Label>
                          <Select
                            value={settings.csvQuoting}
                            onValueChange={(value: CSVQuoting) =>
                              setSettings((prev) => ({ ...prev, csvQuoting: value }))
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minimal">Minimal</SelectItem>
                              <SelectItem value="all">All fields</SelectItem>
                              <SelectItem value="non-numeric">Non-numeric</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
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
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleConvertSingle} disabled={!input.trim() || isProcessing} className="flex-1">
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      Convert {direction === 'csv-to-json' ? 'to JSON' : 'to CSV'}
                    </Button>
                    <Button
                      onClick={() => {
                        setInput('')
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {inputValidation.warnings && inputValidation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Warnings:</h4>
                      <div className="text-xs space-y-1">
                        {inputValidation.warnings.map((warning, index) => (
                          <div key={index} className="text-yellow-700">
                            {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Output Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {direction === 'csv-to-json' ? (
                      <Braces className="h-5 w-5" />
                    ) : (
                      <FileSpreadsheet className="h-5 w-5" />
                    )}
                    {direction === 'csv-to-json' ? 'JSON Output' : 'CSV Output'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-2">
                          Conversion: {currentResult.direction === 'csv-to-json' ? 'CSV → JSON' : 'JSON → CSV'}
                        </div>
                        <div className="text-sm">
                          <div>
                            <strong>Status:</strong> {currentResult.isValid ? 'Success' : 'Failed'}
                          </div>
                          {currentResult.error && (
                            <div className="text-red-600 mt-1">
                              <strong>Error:</strong> {currentResult.error}
                            </div>
                          )}
                        </div>
                      </div>

                      {currentResult.isValid ? (
                        <div className="space-y-4">
                          {/* Generated Output */}
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="font-medium text-sm">
                                Converted {direction === 'csv-to-json' ? 'JSON' : 'CSV'}
                              </Label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    copyToClipboard(
                                      currentResult.output,
                                      `${direction === 'csv-to-json' ? 'JSON' : 'CSV'} Data`
                                    )
                                  }
                                >
                                  {copiedText === `${direction === 'csv-to-json' ? 'JSON' : 'CSV'} Data` ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowAnalysis(!showAnalysis)}>
                                  {showAnalysis ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            <Textarea
                              value={currentResult.output}
                              readOnly
                              className="min-h-[200px] font-mono text-sm bg-muted"
                            />
                          </div>

                          {/* Statistics */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Conversion Statistics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Input Size:</strong> {formatFileSize(currentResult.statistics.inputSize)}
                                </div>
                                <div>
                                  <strong>Output Size:</strong> {formatFileSize(currentResult.statistics.outputSize)}
                                </div>
                                <div>
                                  <strong>Processing Time:</strong> {currentResult.statistics.processingTime.toFixed(2)}
                                  ms
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Rows:</strong> {currentResult.statistics.dataMetrics.rowCount}
                                </div>
                                <div>
                                  <strong>Columns:</strong> {currentResult.statistics.dataMetrics.columnCount}
                                </div>
                                <div>
                                  <strong>Total Cells:</strong> {currentResult.statistics.dataMetrics.totalCells}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Compression:</strong>{' '}
                                  {(currentResult.statistics.compressionRatio * 100).toFixed(1)}%
                                </div>
                                <div>
                                  <strong>Quality Score:</strong> {currentResult.analysis?.qualityScore || 'N/A'}
                                </div>
                                <div>
                                  <strong>Encoding:</strong> {currentResult.statistics.dataMetrics.encoding}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Data Analysis */}
                          {showAnalysis && currentResult.analysis && (
                            <div className="border rounded-lg p-3">
                              <Label className="font-medium text-sm mb-3 block">Data Analysis</Label>
                              <div className="space-y-2 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div>
                                      <strong>Has Headers:</strong> {currentResult.analysis.hasHeaders ? 'Yes' : 'No'}
                                    </div>
                                    <div>
                                      <strong>Delimiter:</strong> {currentResult.analysis.delimiter}
                                    </div>
                                    <div>
                                      <strong>Quote Character:</strong> {currentResult.analysis.quoteChar}
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Has Nested Data:</strong>{' '}
                                      {currentResult.analysis.hasNestedData ? 'Yes' : 'No'}
                                    </div>
                                    <div>
                                      <strong>Has Special Chars:</strong>{' '}
                                      {currentResult.analysis.hasSpecialChars ? 'Yes' : 'No'}
                                    </div>
                                    <div>
                                      <strong>Quality Score:</strong> {currentResult.analysis.qualityScore}/100
                                    </div>
                                  </div>
                                </div>

                                {currentResult.analysis.suggestedImprovements.length > 0 && (
                                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                    <div className="text-sm text-blue-800">
                                      <strong>Suggestions:</strong>
                                      <ul className="list-disc list-inside mt-1">
                                        {currentResult.analysis.suggestedImprovements.map((suggestion, index) => (
                                          <li key={index}>{suggestion}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}

                                {currentResult.analysis.dataIssues.length > 0 && (
                                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                                    <div className="text-sm text-red-800">
                                      <strong>Data Issues:</strong>
                                      <ul className="list-disc list-inside mt-1">
                                        {currentResult.analysis.dataIssues.map((issue, index) => (
                                          <li key={index}>{issue}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
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
                            onClick={() => exportResults([currentResult], settings.exportFormat)}
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
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                        <ArrowLeftRight className="h-8 w-8 text-muted-foreground" />
                        <Braces className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No Conversion Result</h3>
                      <p className="text-muted-foreground mb-4">
                        Enter {direction === 'csv-to-json' ? 'CSV' : 'JSON'} data and convert to see results
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
                  Batch CSV ⇄ JSON Conversion
                </CardTitle>
                <CardDescription>Process multiple conversions at once (direction:data per line)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batch-input" className="text-sm font-medium">
                      Conversion Definitions (direction:data per line)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder='csv:name,age,email&#10;John,30,john@example.com&#10;json:[{"name":"John","age":30}]&#10;csv:product,price&#10;Widget,29.99'
                      className="mt-2 min-h-[120px] font-mono"
                      aria-label="Batch conversion input"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">
                      Format: <code>csv:data</code> or <code>json:data</code> (one per line)
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleConvertBatch} disabled={!batchInput.trim() || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Process Batch
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
                            <Button size="sm" variant="outline" onClick={() => exportResults(batch.results, 'json')}>
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
                            <span className="font-medium">Avg Quality:</span>{' '}
                            {batch.statistics.averageQuality.toFixed(1)}
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.results.slice(0, 5).map((result) => (
                              <div key={result.id} className="text-xs border rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">{result.direction}</span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      result.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {result.isValid ? 'Valid' : 'Invalid'}
                                  </span>
                                </div>
                                {result.isValid && (
                                  <div className="text-muted-foreground mt-1">
                                    Rows: {result.statistics.dataMetrics.rowCount} • Cols:{' '}
                                    {result.statistics.dataMetrics.columnCount} • Time:{' '}
                                    {result.statistics.processingTime.toFixed(2)}ms
                                  </div>
                                )}
                                {result.error && <div className="text-red-600 mt-1">{result.error}</div>}
                              </div>
                            ))}
                            {batch.results.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.results.length - 5} more conversions
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

          {/* Data Analyzer Tab */}
          <TabsContent value="analyzer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Data Structure Analyzer
                </CardTitle>
                <CardDescription>Detailed analysis of CSV/JSON data structure and quality</CardDescription>
              </CardHeader>
              <CardContent>
                {currentResult && currentResult.isValid ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Data Structure</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Rows: {currentResult.statistics.dataMetrics.rowCount}</div>
                          <div>Columns: {currentResult.statistics.dataMetrics.columnCount}</div>
                          <div>Total Cells: {currentResult.statistics.dataMetrics.totalCells}</div>
                          <div>Empty Values: {currentResult.statistics.dataMetrics.emptyValues}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Data Types</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Strings: {currentResult.statistics.dataMetrics.dataTypes.strings}</div>
                          <div>Numbers: {currentResult.statistics.dataMetrics.dataTypes.numbers}</div>
                          <div>Booleans: {currentResult.statistics.dataMetrics.dataTypes.booleans}</div>
                          <div>Nulls: {currentResult.statistics.dataMetrics.dataTypes.nulls}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Quality Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Quality Score: {currentResult.analysis?.qualityScore || 'N/A'}/100</div>
                          <div>Processing Time: {currentResult.statistics.processingTime.toFixed(2)}ms</div>
                          <div>Compression: {(currentResult.statistics.compressionRatio * 100).toFixed(1)}%</div>
                          <div>Encoding: {currentResult.statistics.dataMetrics.encoding}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {currentResult.analysis &&
                      (currentResult.analysis.suggestedImprovements.length > 0 ||
                        currentResult.analysis.dataIssues.length > 0) && (
                        <div className="space-y-4">
                          {currentResult.analysis.suggestedImprovements.length > 0 && (
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-blue-700">Suggested Improvements</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="text-sm space-y-1">
                                  {currentResult.analysis.suggestedImprovements.map((suggestion, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <CheckCircle2 className="h-3 w-3 text-blue-600" />
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}

                          {currentResult.analysis.dataIssues.length > 0 && (
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-red-700">Data Issues</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="text-sm space-y-1">
                                  {currentResult.analysis.dataIssues.map((issue, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <AlertCircle className="h-3 w-3 text-red-600" />
                                      {issue}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Convert data in the Converter tab to see detailed analysis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  CSV ⇄ JSON Templates
                </CardTitle>
                <CardDescription>Common data formats and conversion examples</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {conversionTemplates.map((template) => (
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
                            <div className="text-xs font-medium mb-1">CSV Format:</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded max-h-24 overflow-y-auto">
                              {template.csvExample}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">JSON Format:</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded max-h-24 overflow-y-auto">
                              {template.jsonExample}
                            </div>
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
                Conversion Settings
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
                      <SelectItem value="txt">Text Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="json-indent" className="text-sm font-medium">
                    JSON Indentation: {settings.jsonIndentation}
                  </Label>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="8"
                      step="1"
                      value={settings.jsonIndentation}
                      onChange={(e) => setSettings((prev) => ({ ...prev, jsonIndentation: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {batches.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      const allResults = batches.flatMap((batch) => batch.results)
                      exportResults(allResults, 'txt', 'csv-json-statistics.txt')
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
const CsvToJson = () => {
  return (
    <CSVJSONErrorBoundary>
      <CSVJSONCore />
    </CSVJSONErrorBoundary>
  )
}

export default CsvToJson
