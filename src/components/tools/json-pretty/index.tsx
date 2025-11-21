import { useCallback, useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
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
  Code,
  BookOpen,
  FileText,
  Search,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  JSONProcessingResult,
  JSONStatistics,
  JSONBatch,
  JSONBatchStatistics,
  JSONSettings,
  JSONTemplate,
  JSONValidation,
  JSONOperation,
  ExportFormat,
} from "@/types/json-pretty"
import { formatFileSize } from "@/lib/utils"
// Utility functions

// JSON processing functions
const validateJSON = (input: string): JSONValidation => {
  const validation: JSONValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!input.trim()) {
    validation.isValid = false
    validation.errors.push({ message: "JSON input cannot be empty" })
    return validation
  }

  try {
    JSON.parse(input)
  } catch (error) {
    validation.isValid = false
    if (error instanceof SyntaxError) {
      const match = error.message.match(/at position (\d+)/)
      const position = match ? parseInt(match[1]) : undefined

      let line: number | undefined
      let column: number | undefined

      if (position !== undefined) {
        const lines = input.substring(0, position).split("\n")
        line = lines.length
        column = lines[lines.length - 1].length + 1
      }

      validation.errors.push({
        message: error.message,
        line,
        column,
      })
    } else {
      validation.errors.push({ message: "Unknown JSON parsing error" })
    }
    return validation
  }

  // Additional validations and suggestions
  if (input.includes("\t")) {
    validation.warnings.push("Contains tab characters - consider using spaces for indentation")
  }

  if (input.length > 1000000) {
    validation.warnings.push("Large JSON file - processing may be slow")
  }

  // Check for potential issues
  if (input.includes("undefined")) {
    validation.suggestions.push('Contains "undefined" strings - ensure these are intentional')
  }

  if (input.includes("NaN")) {
    validation.suggestions.push('Contains "NaN" strings - these are not valid JSON values')
  }

  return validation
}

// Analyze JSON structure and generate statistics
const analyzeJSON = (input: string): JSONStatistics => {
  const stats: JSONStatistics = {
    size: new Blob([input]).size,
    lines: input.split("\n").length,
    depth: 0,
    keys: 0,
    arrays: 0,
    objects: 0,
    primitives: 0,
    nullValues: 0,
    booleans: 0,
    numbers: 0,
    strings: 0,
    duplicateKeys: [],
    circularReferences: false,
  }

  try {
    const parsed = JSON.parse(input)
    analyzeValue(parsed, stats, 0, new Set(), new Map())
  } catch (error) {
    // Return basic stats for invalid JSON
    return stats
  }

  return stats
}

const analyzeValue = (
  value: any,
  stats: JSONStatistics,
  depth: number,
  visited: Set<any>,
  keyCount: Map<string, number>,
  path: string = ""
): void => {
  stats.depth = Math.max(stats.depth, depth)

  if (value === null) {
    stats.nullValues++
    stats.primitives++
  } else if (typeof value === "boolean") {
    stats.booleans++
    stats.primitives++
  } else if (typeof value === "number") {
    stats.numbers++
    stats.primitives++
  } else if (typeof value === "string") {
    stats.strings++
    stats.primitives++
  } else if (Array.isArray(value)) {
    stats.arrays++

    if (visited.has(value)) {
      stats.circularReferences = true
      return
    }
    visited.add(value)

    value.forEach((item, index) => {
      analyzeValue(item, stats, depth + 1, visited, keyCount, `${path}[${index}]`)
    })

    visited.delete(value)
  } else if (typeof value === "object") {
    stats.objects++

    if (visited.has(value)) {
      stats.circularReferences = true
      return
    }
    visited.add(value)

    Object.keys(value).forEach((key) => {
      stats.keys++

      // Track duplicate keys
      const count = keyCount.get(key) || 0
      keyCount.set(key, count + 1)
      if (count === 1) {
        stats.duplicateKeys.push(key)
      }

      analyzeValue(value[key], stats, depth + 1, visited, keyCount, `${path}.${key}`)
    })

    visited.delete(value)
  }
}

// Process JSON with different operations
const processJSON = (input: string, operation: JSONOperation, settings: JSONSettings): JSONProcessingResult => {
  try {
    const validation = validateJSON(input)

    if (!validation.isValid) {
      return {
        id: nanoid(),
        input,
        output: "",
        operation,
        isValid: false,
        error: validation.errors.map((e) => e.message).join("; "),
        statistics: analyzeJSON(input),
        createdAt: new Date(),
      }
    }

    const parsed = JSON.parse(input)
    let output = ""

    switch (operation) {
      case "format":
        if (settings.sortKeys) {
          output = JSON.stringify(sortObjectKeys(parsed), null, settings.indentSize)
        } else {
          output = JSON.stringify(parsed, null, settings.indentSize)
        }
        break

      case "minify":
        output = JSON.stringify(parsed)
        break

      case "validate":
        output = "Valid JSON ✓"
        break

      case "analyze":
        const stats = analyzeJSON(input)
        output = JSON.stringify(stats, null, 2)
        break

      case "escape":
        output = JSON.stringify(input)
        break

      case "unescape":
        try {
          output = JSON.parse(input)
        } catch {
          output = input // Return original if not a JSON string
        }
        break

      default:
        output = JSON.stringify(parsed, null, settings.indentSize)
    }

    return {
      id: nanoid(),
      input,
      output,
      operation,
      isValid: true,
      statistics: analyzeJSON(input),
      createdAt: new Date(),
    }
  } catch (error) {
    return {
      id: nanoid(),
      input,
      output: "",
      operation,
      isValid: false,
      error: error instanceof Error ? error.message : "Processing failed",
      statistics: analyzeJSON(input),
      createdAt: new Date(),
    }
  }
}

// Sort object keys recursively
const sortObjectKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  } else if (obj !== null && typeof obj === "object") {
    const sorted: any = {}
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObjectKeys(obj[key])
      })
    return sorted
  }
  return obj
}

// JSON templates for common use cases
const jsonTemplates: JSONTemplate[] = [
  {
    id: "simple-object",
    name: "Simple Object",
    description: "Basic JSON object structure",
    category: "Basic",
    content: `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "active": true
}`,
    useCase: ["API responses", "Configuration files", "Data modeling"],
  },
  {
    id: "array-of-objects",
    name: "Array of Objects",
    description: "JSON array containing multiple objects",
    category: "Collections",
    content: `[
  {
    "id": 1,
    "name": "Product A",
    "price": 29.99,
    "inStock": true
  },
  {
    "id": 2,
    "name": "Product B",
    "price": 39.99,
    "inStock": false
  }
]`,
    useCase: ["Product catalogs", "User lists", "API collections"],
  },
  {
    id: "nested-structure",
    name: "Nested Structure",
    description: "Complex nested JSON with multiple levels",
    category: "Complex",
    content: `{
  "user": {
    "profile": {
      "personal": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "contact": {
        "email": "jane@example.com",
        "phone": "+1-555-0123"
      }
    },
    "preferences": {
      "theme": "dark",
      "notifications": {
        "email": true,
        "push": false
      }
    }
  }
}`,
    useCase: ["User profiles", "Configuration systems", "Complex data structures"],
  },
  {
    id: "api-response",
    name: "API Response",
    description: "Typical REST API response format",
    category: "API",
    content: `{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "123",
        "username": "johndoe",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10
  }
}`,
    useCase: ["REST APIs", "GraphQL responses", "Microservices"],
  },
  {
    id: "config-file",
    name: "Configuration File",
    description: "Application configuration structure",
    category: "Configuration",
    content: `{
  "app": {
    "name": "MyApp",
    "version": "1.0.0",
    "environment": "production"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp_db"
  },
  "features": {
    "authentication": true,
    "logging": {
      "level": "info",
      "file": "/var/log/app.log"
    }
  }
}`,
    useCase: ["App configuration", "Environment settings", "Feature flags"],
  },
  {
    id: "geojson",
    name: "GeoJSON",
    description: "Geographic data in JSON format",
    category: "Specialized",
    content: `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]
      },
      "properties": {
        "name": "San Francisco",
        "population": 883305
      }
    }
  ]
}`,
    useCase: ["Mapping applications", "Location data", "Geographic APIs"],
  },
]

// Custom hooks
const useJSONProcessing = () => {
  const processSingle = useCallback(
    (input: string, operation: JSONOperation, settings: JSONSettings): JSONProcessingResult => {
      return processJSON(input, operation, settings)
    },
    []
  )

  const processBatch = useCallback(
    (inputs: Array<{ content: string; operation: JSONOperation }>, settings: JSONSettings): JSONBatch => {
      try {
        const results = inputs.map((input) => processJSON(input.content, input.operation, settings))

        const validCount = results.filter((result) => result.isValid).length
        const invalidCount = results.length - validCount

        const totalSize = results.reduce((sum, result) => sum + result.statistics.size, 0)
        const averageSize = results.length > 0 ? totalSize / results.length : 0

        const operationDistribution = results.reduce(
          (acc, result) => {
            acc[result.operation] = (acc[result.operation] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )

        const statistics: JSONBatchStatistics = {
          totalProcessed: results.length,
          validCount,
          invalidCount,
          averageSize,
          totalSize,
          operationDistribution,
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
        console.error("Batch processing error:", error)
        throw new Error(error instanceof Error ? error.message : "Batch processing failed")
      }
    },
    []
  )

  return { processSingle, processBatch }
}

// Real-time validation hook
const useRealTimeValidation = (input: string) => {
  return useMemo(() => {
    if (!input.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = validateJSON(input)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
    }
  }, [input])
}

// JSON search and filter hook
const useJSONSearch = (jsonString: string, searchTerm: string) => {
  return useMemo(() => {
    if (!searchTerm.trim() || !jsonString.trim()) {
      return {
        matches: [],
        highlightedJSON: jsonString,
      }
    }

    try {
      const parsed = JSON.parse(jsonString)
      const matches: Array<{ path: string; value: any; line?: number }> = []

      const searchInValue = (value: any, path: string = "") => {
        if (typeof value === "string" && value.toLowerCase().includes(searchTerm.toLowerCase())) {
          matches.push({ path, value })
        } else if (typeof value === "object" && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              searchInValue(item, `${path}[${index}]`)
            })
          } else {
            Object.keys(value).forEach((key) => {
              if (key.toLowerCase().includes(searchTerm.toLowerCase())) {
                matches.push({ path: `${path}.${key}`, value: value[key] })
              }
              searchInValue(value[key], `${path}.${key}`)
            })
          }
        }
      }

      searchInValue(parsed)

      // Simple highlighting (could be enhanced)
      const highlightedJSON = jsonString.replace(new RegExp(searchTerm, "gi"), `<mark>$&</mark>`)

      return {
        matches,
        highlightedJSON,
      }
    } catch {
      return {
        matches: [],
        highlightedJSON: jsonString,
      }
    }
  }, [jsonString, searchTerm])
}

// Export functionality
const useJSONExport = () => {
  const exportResults = useCallback((results: JSONProcessingResult[], format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "json":
        content = JSON.stringify(results, null, 2)
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        content = generateCSVFromResults(results)
        mimeType = "text/csv"
        extension = ".csv"
        break
      case "xml":
        content = generateXMLFromResults(results)
        mimeType = "application/xml"
        extension = ".xml"
        break
      case "txt":
      default:
        content = generateTextFromResults(results)
        mimeType = "text/plain"
        extension = ".txt"
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `json-processing${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (batch: JSONBatch) => {
      exportResults(batch.results, "json", `json-batch-${batch.id}.json`)
      toast.success(`Exported ${batch.results.length} JSON processing results`)
    },
    [exportResults]
  )

  const exportStatistics = useCallback((batches: JSONBatch[]) => {
    const stats = batches.map((batch) => ({
      batchId: batch.id,
      resultCount: batch.count,
      validCount: batch.statistics.validCount,
      invalidCount: batch.statistics.invalidCount,
      averageSize: batch.statistics.averageSize.toFixed(2),
      successRate: batch.statistics.successRate.toFixed(2),
      createdAt: batch.createdAt.toISOString(),
    }))

    const csvContent = [
      [
        "Batch ID",
        "Result Count",
        "Valid Count",
        "Invalid Count",
        "Average Size (bytes)",
        "Success Rate (%)",
        "Created At",
      ],
      ...stats.map((stat) => [
        stat.batchId,
        stat.resultCount.toString(),
        stat.validCount.toString(),
        stat.invalidCount.toString(),
        stat.averageSize,
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
    link.download = "json-statistics.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Statistics exported")
  }, [])

  return { exportResults, exportBatch, exportStatistics }
}

// Generate export formats
const generateTextFromResults = (results: JSONProcessingResult[]): string => {
  return `JSON Processing Report
=====================

Generated: ${new Date().toLocaleString()}
Total Results: ${results.length}
Valid Results: ${results.filter((result) => result.isValid).length}
Invalid Results: ${results.filter((result) => !result.isValid).length}

Results:
${results
  .map((result, i) => {
    return `${i + 1}. Operation: ${result.operation}
   Status: ${result.isValid ? "Valid" : "Invalid"}
   ${result.error ? `Error: ${result.error}` : ""}
   Size: ${formatFileSize(result.statistics.size)}
   Lines: ${result.statistics.lines}
   Depth: ${result.statistics.depth}
   Objects: ${result.statistics.objects}
   Arrays: ${result.statistics.arrays}
   Keys: ${result.statistics.keys}
`
  })
  .join("\n")}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
`
}

const generateCSVFromResults = (results: JSONProcessingResult[]): string => {
  const rows = [
    ["Operation", "Valid", "Error", "Size (bytes)", "Lines", "Depth", "Objects", "Arrays", "Keys", "Created At"],
  ]

  results.forEach((result) => {
    rows.push([
      result.operation,
      result.isValid ? "Yes" : "No",
      result.error || "",
      result.statistics.size.toString(),
      result.statistics.lines.toString(),
      result.statistics.depth.toString(),
      result.statistics.objects.toString(),
      result.statistics.arrays.toString(),
      result.statistics.keys.toString(),
      result.createdAt.toISOString(),
    ])
  })

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}

const generateXMLFromResults = (results: JSONProcessingResult[]): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jsonProcessingResults>
  <metadata>
    <generated>${new Date().toISOString()}</generated>
    <count>${results.length}</count>
    <validCount>${results.filter((result) => result.isValid).length}</validCount>
  </metadata>
  <results>
    ${results
      .map(
        (result) => `
    <result>
      <operation>${result.operation}</operation>
      <valid>${result.isValid}</valid>
      ${result.error ? `<error>${result.error}</error>` : ""}
      <statistics>
        <size>${result.statistics.size}</size>
        <lines>${result.statistics.lines}</lines>
        <depth>${result.statistics.depth}</depth>
        <objects>${result.statistics.objects}</objects>
        <arrays>${result.statistics.arrays}</arrays>
        <keys>${result.statistics.keys}</keys>
      </statistics>
      <createdAt>${result.createdAt.toISOString()}</createdAt>
    </result>`
      )
      .join("")}
  </results>
</jsonProcessingResults>`
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
 * Enhanced JSON Pretty Tool
 * Features: Advanced JSON processing, validation, analysis, batch processing, comprehensive formatting
 */
const JSONPrettyCore = () => {
  const { i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<"processor" | "batch" | "analyzer" | "templates">("processor")
  const [input, setInput] = useState("")
  const [currentResult, setCurrentResult] = useState<JSONProcessingResult | null>(null)
  const [batches, setBatches] = useState<JSONBatch[]>([])
  const [batchInput, setBatchInput] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)
  const [settings, setSettings] = useState<JSONSettings>({
    indentSize: 2,
    sortKeys: false,
    removeComments: false,
    validateSchema: false,
    showStatistics: true,
    realTimeProcessing: true,
    exportFormat: "json",
    maxDepth: 100,
    maxSize: 10485760, // 10MB
  })

  const { processSingle, processBatch } = useJSONProcessing()
  const { exportResults, exportBatch, exportStatistics } = useJSONExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const realTimeValidation = useRealTimeValidation(input)
  const searchResults = useJSONSearch(currentResult?.output || "", searchTerm)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = jsonTemplates.find((t) => t.id === templateId)
    if (template) {
      setInput(template.content)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single processing
  const handleProcessSingle = useCallback(
    async (operation: JSONOperation) => {
      if (!input.trim()) {
        toast.error("Please enter JSON content to process")
        return
      }

      setIsProcessing(true)
      try {
        const result = processSingle(input, operation, settings)
        setCurrentResult(result)

        if (result.isValid) {
          toast.success(`JSON ${operation} completed successfully`)
        } else {
          toast.error(result.error || `${operation} failed`)
        }
      } catch (error) {
        toast.error(`Failed to ${operation} JSON`)
        console.error(error)
      } finally {
        setIsProcessing(false)
      }
    },
    [input, settings, processSingle]
  )

  // Handle batch processing
  const handleProcessBatch = useCallback(async () => {
    const lines = batchInput.split("\n").filter((line) => line.trim())

    if (lines.length === 0) {
      toast.error("Please enter JSON content to process")
      return
    }

    const inputs = lines.map((line) => ({
      content: line.trim(),
      operation: "format" as JSONOperation,
    }))

    setIsProcessing(true)
    try {
      const batch = processBatch(inputs, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Processed ${batch.results.length} JSON items`)
    } catch (error) {
      toast.error("Failed to process batch")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, settings, processBatch])

  // Auto-process when real-time processing is enabled
  useEffect(() => {
    if (settings.realTimeProcessing && input.trim() && realTimeValidation.isValid) {
      const timer = setTimeout(() => {
        handleProcessSingle("format")
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [input, realTimeValidation.isValid, settings.realTimeProcessing, handleProcessSingle])

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
              <Code className="h-5 w-5" />
              {i18n.language.startsWith("en") ? "JSON Formatter & Analyzer" : "JSON 格式化与分析工具"}
            </CardTitle>
            <CardDescription>
              {i18n.language.startsWith("en")
                ? "Advanced JSON processing tool with formatting, validation, analysis, and batch processing capabilities. Format, minify, validate, and analyze JSON with comprehensive error reporting and statistics. Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons."
                : "高级 JSON 处理工具，具有格式化、验证、分析和批处理功能。格式化、压缩、验证和分析 JSON，提供全面的错误报告和统计信息。使用键盘导航：Tab 键在控件之间移动，Enter 或空格键激活按钮。"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "processor" | "batch" | "analyzer" | "templates")}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="processor"
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              {i18n.language.startsWith("en") ? "JSON Processor" : "JSON 处理器"}
            </TabsTrigger>
            <TabsTrigger
              value="batch"
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              {i18n.language.startsWith("en") ? "Batch Processing" : "批量处理"}
            </TabsTrigger>
            <TabsTrigger
              value="analyzer"
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {i18n.language.startsWith("en") ? "JSON Analyzer" : "JSON 分析器"}
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              {i18n.language.startsWith("en") ? "Templates" : "模板"}
            </TabsTrigger>
          </TabsList>

          {/* JSON Processor Tab */}
          <TabsContent
            value="processor"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {i18n.language.startsWith("en") ? "JSON Input" : "JSON 输入"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="json-input"
                      className="text-sm font-medium"
                    >
                      {i18n.language.startsWith("en") ? "JSON Content" : "JSON 内容"}
                    </Label>
                    <Textarea
                      id="json-input"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        i18n.language.startsWith("en")
                          ? "Enter or paste your JSON here..."
                          : "在此输入或粘贴您的 JSON..."
                      }
                      className="mt-2 min-h-[200px] font-mono"
                    />
                    {settings.realTimeProcessing && input && (
                      <div className="mt-2 text-sm">
                        {realTimeValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            {i18n.language.startsWith("en") ? "Valid JSON" : "有效的 JSON"}
                          </div>
                        ) : realTimeValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {i18n.language.startsWith("en")
                              ? realTimeValidation.error
                              : realTimeValidation.error
                                  .replace("JSON input cannot be empty", "JSON 输入不能为空")
                                  .replace("Unknown JSON parsing error", "未知的 JSON 解析错误")}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id="real-time-processing"
                        type="checkbox"
                        checked={settings.realTimeProcessing}
                        onChange={(e) => setSettings((prev) => ({ ...prev, realTimeProcessing: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="real-time-processing"
                        className="text-sm"
                      >
                        {i18n.language.startsWith("en") ? "Real-time processing" : "实时处理"}
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="sort-keys"
                        type="checkbox"
                        checked={settings.sortKeys}
                        onChange={(e) => setSettings((prev) => ({ ...prev, sortKeys: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="sort-keys"
                        className="text-sm"
                      >
                        {i18n.language.startsWith("en") ? "Sort object keys alphabetically" : "按字母顺序排序对象键"}
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="show-statistics"
                        type="checkbox"
                        checked={settings.showStatistics}
                        onChange={(e) => setSettings((prev) => ({ ...prev, showStatistics: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="show-statistics"
                        className="text-sm"
                      >
                        {i18n.language.startsWith("en") ? "Show detailed statistics" : "显示详细统计信息"}
                      </Label>
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="indent-size"
                      className="text-sm font-medium"
                    >
                      {i18n.language.startsWith("en")
                        ? `Indent Size: ${settings.indentSize}`
                        : `缩进大小: ${settings.indentSize}`}
                    </Label>
                    <div className="mt-2 flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="1"
                        value={settings.indentSize}
                        onChange={(e) => setSettings((prev) => ({ ...prev, indentSize: parseInt(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-8">{settings.indentSize}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Button
                      onClick={() => handleProcessSingle("format")}
                      disabled={!input.trim() || isProcessing}
                      size="sm"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2" />
                      ) : (
                        <Maximize2 className="mr-2 h-3 w-3" />
                      )}
                      {i18n.language.startsWith("en") ? "Format" : "格式化"}
                    </Button>
                    <Button
                      onClick={() => handleProcessSingle("minify")}
                      disabled={!input.trim() || isProcessing}
                      size="sm"
                      variant="outline"
                    >
                      <Minimize2 className="mr-2 h-3 w-3" />
                      {i18n.language.startsWith("en") ? "Minify" : "最小化"}
                    </Button>
                    <Button
                      onClick={() => handleProcessSingle("validate")}
                      disabled={!input.trim() || isProcessing}
                      size="sm"
                      variant="outline"
                    >
                      <CheckCircle2 className="mr-2 h-3 w-3" />
                      {i18n.language.startsWith("en") ? "Validate" : "验证"}
                    </Button>
                    <Button
                      onClick={() => handleProcessSingle("analyze")}
                      disabled={!input.trim() || isProcessing}
                      size="sm"
                      variant="outline"
                    >
                      <Search className="mr-2 h-3 w-3" />
                      {i18n.language.startsWith("en") ? "Analyze" : "分析"}
                    </Button>
                    <Button
                      onClick={() => handleProcessSingle("escape")}
                      disabled={!input.trim() || isProcessing}
                      size="sm"
                      variant="outline"
                    >
                      <Code className="mr-2 h-3 w-3" />
                      {i18n.language.startsWith("en") ? "Escape" : "转义"}
                    </Button>
                    <Button
                      onClick={() => {
                        setInput("")
                        setCurrentResult(null)
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="mr-2 h-3 w-3" />
                      {i18n.language.startsWith("en") ? "Clear" : "清除"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    {i18n.language.startsWith("en") ? "Processing Results" : "处理结果"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-2">
                          {i18n.language.startsWith("en") ? "Operation" : "操作"}: {currentResult.operation}
                        </div>
                        <div className="text-sm">
                          <div>
                            <strong>{i18n.language.startsWith("en") ? "Status" : "状态"}:</strong>{" "}
                            {currentResult.isValid
                              ? i18n.language.startsWith("en")
                                ? "Success"
                                : "成功"
                              : i18n.language.startsWith("en")
                                ? "Failed"
                                : "失败"}
                          </div>
                          {currentResult.error && (
                            <div className="text-red-600 mt-1">
                              <strong>{i18n.language.startsWith("en") ? "Error" : "错误"}:</strong>
                              {i18n.language.startsWith("en")
                                ? currentResult.error
                                : typeof currentResult.error === "string"
                                  ? currentResult.error
                                      .replace("JSON input cannot be empty", "JSON 输入不能为空")
                                      .replace("Unknown JSON parsing error", "未知的 JSON 解析错误")
                                  : currentResult.error}
                            </div>
                          )}
                        </div>
                      </div>

                      {currentResult.isValid ? (
                        <div className="space-y-4">
                          {/* Output */}
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="font-medium text-sm">
                                {i18n.language.startsWith("en") ? "Output" : "输出"}
                              </Label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(currentResult.output, "JSON Output")}
                                >
                                  {copiedText === "JSON Output" ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setShowStatistics(!showStatistics)}
                                >
                                  {showStatistics ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            <Textarea
                              value={currentResult.output}
                              readOnly
                              className="min-h-[200px] font-mono text-sm"
                            />
                          </div>

                          {/* Statistics */}
                          {settings.showStatistics && showStatistics && (
                            <div className="border rounded-lg p-3">
                              <Label className="font-medium text-sm mb-3 block">
                                {i18n.language.startsWith("en") ? "JSON Statistics" : "JSON 统计信息"}
                              </Label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <div>
                                    <strong>{i18n.language.startsWith("en") ? "Size" : "大小"}:</strong>{" "}
                                    {formatFileSize(currentResult.statistics.size)}
                                  </div>
                                  <div>
                                    <strong>{i18n.language.startsWith("en") ? "Lines" : "行数"}:</strong>{" "}
                                    {currentResult.statistics.lines}
                                  </div>
                                  <div>
                                    <strong>{i18n.language.startsWith("en") ? "Depth" : "深度"}:</strong>{" "}
                                    {currentResult.statistics.depth}
                                  </div>
                                </div>
                                <div>
                                  <div>
                                    <strong>{i18n.language.startsWith("en") ? "Objects" : "对象"}:</strong>{" "}
                                    {currentResult.statistics.objects}
                                  </div>
                                  <div>
                                    <strong>{i18n.language.startsWith("en") ? "Arrays" : "数组"}:</strong>{" "}
                                    {currentResult.statistics.arrays}
                                  </div>
                                  <div>
                                    <strong>{i18n.language.startsWith("en") ? "Keys" : "键"}:</strong>{" "}
                                    {currentResult.statistics.keys}
                                  </div>
                                </div>
                                <div>
                                  <div>
                                    <strong>{i18n.language.startsWith("en") ? "Strings" : "字符串"}:</strong>{" "}
                                    {currentResult.statistics.strings}
                                  </div>
                                  <div>
                                    <strong>{i18n.language.startsWith("en") ? "Numbers" : "数字"}:</strong>{" "}
                                    {currentResult.statistics.numbers}
                                  </div>
                                  <div>
                                    <strong>{i18n.language.startsWith("en") ? "Booleans" : "布尔值"}:</strong>{" "}
                                    {currentResult.statistics.booleans}
                                  </div>
                                </div>
                              </div>
                              {currentResult.statistics.duplicateKeys.length > 0 && (
                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <div className="text-sm text-yellow-800">
                                    <strong>{i18n.language.startsWith("en") ? "Duplicate Keys" : "重复键"}:</strong>{" "}
                                    {currentResult.statistics.duplicateKeys.join(", ")}
                                  </div>
                                </div>
                              )}
                              {currentResult.statistics.circularReferences && (
                                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                                  <div className="text-sm text-red-800">
                                    <strong>{i18n.language.startsWith("en") ? "Warning" : "警告"}:</strong>{" "}
                                    {i18n.language.startsWith("en") ? "Circular references detected" : "检测到循环引用"}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Search */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-2 block">
                              {i18n.language.startsWith("en") ? "Search in JSON" : "在 JSON 中搜索"}
                            </Label>
                            <Input
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder={
                                i18n.language.startsWith("en") ? "Search for keys or values..." : "搜索键或值..."
                              }
                              className="mb-2"
                            />
                            {searchResults.matches.length > 0 && (
                              <div className="text-sm">
                                <div className="font-medium mb-2">
                                  {i18n.language.startsWith("en")
                                    ? `Found ${searchResults.matches.length} matches:`
                                    : `找到 ${searchResults.matches.length} 个匹配项：`}
                                </div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {searchResults.matches.slice(0, 10).map((match, index) => (
                                    <div
                                      key={index}
                                      className="text-xs bg-muted p-1 rounded"
                                    >
                                      <strong>{i18n.language.startsWith("en") ? "Path" : "路径"}:</strong>{" "}
                                      {match.path || (i18n.language.startsWith("en") ? "root" : "根")} →{" "}
                                      <strong>{i18n.language.startsWith("en") ? "Value" : "值"}:</strong>{" "}
                                      {JSON.stringify(match.value)}
                                    </div>
                                  ))}
                                  {searchResults.matches.length > 10 && (
                                    <div className="text-xs text-muted-foreground">
                                      {i18n.language.startsWith("en")
                                        ? `... and ${searchResults.matches.length - 10} more matches`
                                        : `... 还有 ${searchResults.matches.length - 10} 个更多匹配项`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">
                              {i18n.language.startsWith("en") ? "Processing Error" : "处理错误"}
                            </span>
                          </div>
                          <div className="text-red-700 text-sm mt-1">
                            {currentResult.error &&
                              (i18n.language.startsWith("en")
                                ? currentResult.error
                                : currentResult.error
                                    .replace("JSON input cannot be empty", "JSON 输入不能为空")
                                    .replace("Unknown JSON parsing error", "未知的 JSON 解析错误"))}
                          </div>
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
                            {i18n.language.startsWith("en") ? "Export Result" : "导出结果"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Code className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {i18n.language.startsWith("en") ? "No JSON Processed" : "未处理 JSON"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {i18n.language.startsWith("en")
                          ? "Enter JSON content and select an operation to see results"
                          : "输入 JSON 内容并选择一个操作以查看结果"}
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
                  {i18n.language.startsWith("en") ? "Batch JSON Processing" : "批量 JSON 处理"}
                </CardTitle>
                <CardDescription>
                  {i18n.language.startsWith("en")
                    ? "Process multiple JSON items at once (one per line)"
                    : "一次处理多个 JSON 项（每行一个）"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="batch-input"
                      className="text-sm font-medium"
                    >
                      {i18n.language.startsWith("en") ? "JSON Items (one per line)" : "JSON 项（每行一个）"}
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder='{"name": "Item 1"}&#10;{"name": "Item 2"}&#10;{"name": "Item 3"}'
                      className="mt-2 min-h-[120px] font-mono"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleProcessBatch}
                      disabled={!batchInput.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      {i18n.language.startsWith("en") ? "Process Batch" : "处理批量"}
                    </Button>
                    <Button
                      onClick={() => setBatchInput("")}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {i18n.language.startsWith("en") ? "Clear" : "清除"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Batch Results */}
            {batches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {i18n.language.startsWith("en")
                      ? `Batch Results (${batches.length})`
                      : `批量结果 (${batches.length})`}
                  </CardTitle>
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
                            <h4 className="font-medium">
                              {i18n.language.startsWith("en")
                                ? `${batch.count} items processed`
                                : `已处理 ${batch.count} 个项目`}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              {batch.createdAt.toLocaleString()} •{" "}
                              {i18n.language.startsWith("en")
                                ? `${batch.statistics.successRate.toFixed(1)}% success rate`
                                : `${batch.statistics.successRate.toFixed(1)}% 成功率`}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportBatch(batch)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {i18n.language.startsWith("en") ? "Export" : "导出"}
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
                            <span className="font-medium">{i18n.language.startsWith("en") ? "Valid" : "有效"}:</span>{" "}
                            {batch.statistics.validCount}
                          </div>
                          <div>
                            <span className="font-medium">{i18n.language.startsWith("en") ? "Invalid" : "无效"}:</span>{" "}
                            {batch.statistics.invalidCount}
                          </div>
                          <div>
                            <span className="font-medium">
                              {i18n.language.startsWith("en") ? "Avg Size" : "平均大小"}:
                            </span>{" "}
                            {formatFileSize(batch.statistics.averageSize)}
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.results.slice(0, 5).map((result) => (
                              <div
                                key={result.id}
                                className="text-xs border rounded p-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">
                                    {result.input.substring(0, 50)}...
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      result.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {result.isValid
                                      ? i18n.language.startsWith("en")
                                        ? "Valid"
                                        : "有效"
                                      : i18n.language.startsWith("en")
                                        ? "Invalid"
                                        : "无效"}
                                  </span>
                                </div>
                                {result.isValid && (
                                  <div className="text-muted-foreground mt-1">
                                    {i18n.language.startsWith("en") ? "Size" : "大小"}:{" "}
                                    {formatFileSize(result.statistics.size)} •
                                    {i18n.language.startsWith("en") ? "Objects" : "对象"}: {result.statistics.objects} •
                                    {i18n.language.startsWith("en") ? "Arrays" : "数组"}: {result.statistics.arrays}
                                  </div>
                                )}
                                {result.error && (
                                  <div className="text-red-600 mt-1">
                                    {i18n.language.startsWith("en")
                                      ? result.error
                                      : typeof result.error === "string"
                                        ? result.error
                                            .replace("JSON input cannot be empty", "JSON 输入不能为空")
                                            .replace("Unknown JSON parsing error", "未知的 JSON 解析错误")
                                        : result.error}
                                  </div>
                                )}
                              </div>
                            ))}
                            {batch.results.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ...{" "}
                                {i18n.language.startsWith("en")
                                  ? `and ${batch.results.length - 5} more items`
                                  : `还有 ${batch.results.length - 5} 个项目`}
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

          {/* JSON Analyzer Tab */}
          <TabsContent
            value="analyzer"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  {i18n.language.startsWith("en") ? "JSON Structure Analyzer" : "JSON结构分析器"}
                </CardTitle>
                <CardDescription>
                  {i18n.language.startsWith("en")
                    ? "Detailed analysis of JSON structure and content"
                    : "JSON结构和内容的详细分析"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentResult && currentResult.isValid ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            {i18n.language.startsWith("en") ? "Structure" : "结构"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>
                            {i18n.language.startsWith("en") ? "Size" : "大小"}:{" "}
                            {formatFileSize(currentResult.statistics.size)}
                          </div>
                          <div>
                            {i18n.language.startsWith("en") ? "Lines" : "行数"}: {currentResult.statistics.lines}
                          </div>
                          <div>
                            {i18n.language.startsWith("en") ? "Depth" : "深度"}: {currentResult.statistics.depth}
                          </div>
                          <div>
                            {i18n.language.startsWith("en") ? "Keys" : "键"}: {currentResult.statistics.keys}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            {i18n.language.startsWith("en") ? "Objects & Arrays" : "对象和数组"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>
                            {i18n.language.startsWith("en") ? "Objects" : "对象"}: {currentResult.statistics.objects}
                          </div>
                          <div>
                            {i18n.language.startsWith("en") ? "Arrays" : "数组"}: {currentResult.statistics.arrays}
                          </div>
                          <div>
                            {i18n.language.startsWith("en") ? "Primitives" : "基本类型"}:{" "}
                            {currentResult.statistics.primitives}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            {i18n.language.startsWith("en") ? "Data Types" : "数据类型"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>
                            {i18n.language.startsWith("en") ? "Strings" : "字符串"}: {currentResult.statistics.strings}
                          </div>
                          <div>
                            {i18n.language.startsWith("en") ? "Numbers" : "数字"}: {currentResult.statistics.numbers}
                          </div>
                          <div>
                            {i18n.language.startsWith("en") ? "Booleans" : "布尔值"}:{" "}
                            {currentResult.statistics.booleans}
                          </div>
                          <div>
                            {i18n.language.startsWith("en") ? "Nulls" : "空值"}: {currentResult.statistics.nullValues}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {(currentResult.statistics.duplicateKeys.length > 0 ||
                      currentResult.statistics.circularReferences) && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-yellow-700">
                            {i18n.language.startsWith("en") ? "Potential Issues" : "潜在问题"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {currentResult.statistics.duplicateKeys.length > 0 && (
                            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="text-sm text-yellow-800">
                                <strong>{i18n.language.startsWith("en") ? "Duplicate Keys" : "重复键"}:</strong>{" "}
                                {currentResult.statistics.duplicateKeys.join(", ")}
                              </div>
                            </div>
                          )}
                          {currentResult.statistics.circularReferences && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded">
                              <div className="text-sm text-red-800">
                                <strong>{i18n.language.startsWith("en") ? "Circular References" : "循环引用"}:</strong>
                                {i18n.language.startsWith("en")
                                  ? "Detected in the JSON structure"
                                  : "在JSON结构中检测到"}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {i18n.language.startsWith("en") ? "No Analysis Available" : "无可用分析"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {i18n.language.startsWith("en")
                        ? "Process valid JSON in the Processor tab to see detailed analysis"
                        : "在处理器选项卡中处理有效的JSON以查看详细分析"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                  {i18n.language.startsWith("en") ? "JSON Templates" : "JSON模板"}
                </CardTitle>
                <CardDescription>
                  {i18n.language.startsWith("en")
                    ? "Common JSON structures for various use cases"
                    : "适用于各种用例的常见JSON结构"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jsonTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            {i18n.language.startsWith("en") ? template.name : template.name}
                          </h4>
                          <span className="text-xs px-2 py-1 bg-muted rounded">
                            {i18n.language.startsWith("en") ? template.category : template.category}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {i18n.language.startsWith("en") ? template.description : template.description}
                        </div>
                        <div className="font-mono text-xs bg-muted p-2 rounded max-h-32 overflow-y-auto">
                          {template.content}
                        </div>
                        {template.useCase.length > 0 && (
                          <div className="text-xs">
                            <strong>{i18n.language.startsWith("en") ? "Use cases" : "用例"}:</strong>{" "}
                            {template.useCase.join(", ")}
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
                {i18n.language.startsWith("en") ? "Processing Settings" : "处理设置"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="export-format"
                    className="text-sm font-medium"
                  >
                    {i18n.language.startsWith("en") ? "Export Format" : "导出格式"}
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
                      <SelectItem value="txt">{i18n.language.startsWith("en") ? "Text" : "文本"}</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="max-depth"
                    className="text-sm font-medium"
                  >
                    {i18n.language.startsWith("en")
                      ? `Max Depth: ${settings.maxDepth}`
                      : `最大深度: ${settings.maxDepth}`}
                  </Label>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={settings.maxDepth}
                      onChange={(e) => setSettings((prev) => ({ ...prev, maxDepth: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {batches.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => exportStatistics(batches)}
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {i18n.language.startsWith("en") ? "Export Statistics" : "导出统计信息"}
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
const JSONFormatter = () => {
  return <JSONPrettyCore />
}

export default JSONFormatter
