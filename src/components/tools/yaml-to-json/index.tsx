import { useCallback, useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Code,
  BookOpen,
  FileText,
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  ConversionResult,
  ComplexityMetrics,
  YAMLFeatures,
  ConversionBatch,
  BatchStatistics,
  ConversionSettings,
  ConversionTemplate,
  ValidationResult,
  DataFormat,
  ExportFormat,
} from "@/components/tools/yaml-to-json/schema"
import { formatFileSize } from "@/lib/utils"

// Advanced YAML parsing functions
const parseYAMLValue = (value: string): any => {
  // Handle null values
  if (value === "null" || value === "~" || value === "") {
    return null
  }

  // Handle boolean values
  if (value === "true" || value === "yes" || value === "on") {
    return true
  }
  if (value === "false" || value === "no" || value === "off") {
    return false
  }

  // Handle numbers
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10)
  }
  if (/^-?\d*\.\d+$/.test(value)) {
    return parseFloat(value)
  }

  // Handle quoted strings
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }

  // Return as string
  return value
}

const parseYAMLToJSON = (yaml: string): any => {
  const lines = yaml.split(/\r?\n/)
  const result: any = {}
  const stack: Array<{ obj: any; indent: number }> = [{ obj: result, indent: -1 }]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    // Calculate indentation
    const indent = line.length - line.trimStart().length

    // Pop stack to correct level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    const current = stack[stack.length - 1].obj

    // Handle key-value pairs
    const keyValueMatch = trimmed.match(/^([^:]+):\s*(.*)$/)
    if (keyValueMatch) {
      const key = keyValueMatch[1].trim()
      const value = keyValueMatch[2].trim()

      if (value === "") {
        // Empty value, might be an object
        current[key] = {}
        stack.push({ obj: current[key], indent })
      } else if (value.startsWith("[") && value.endsWith("]")) {
        // Inline array
        try {
          current[key] = JSON.parse(value)
        } catch {
          current[key] = value
        }
      } else if (value.startsWith("{") && value.endsWith("}")) {
        // Inline object
        try {
          current[key] = JSON.parse(value)
        } catch {
          current[key] = value
        }
      } else {
        // Regular value
        current[key] = parseYAMLValue(value)
      }
    } else if (trimmed.startsWith("- ")) {
      // Array item
      const value = trimmed.substring(2).trim()
      if (!Array.isArray(current)) {
        // Convert current object to array if needed
        const parent = stack[stack.length - 2]?.obj
        if (parent) {
          const keys = Object.keys(parent)
          const lastKey = keys[keys.length - 1]
          parent[lastKey] = []
          stack[stack.length - 1].obj = parent[lastKey]
        }
      }
      if (Array.isArray(current)) {
        current.push(parseYAMLValue(value))
      }
    }
  }

  return result
}

const convertJSONToYAML = (json: string, settings: ConversionSettings): string => {
  try {
    const obj = JSON.parse(json)
    return objectToYAML(obj, 0, settings)
  } catch (error) {
    throw new Error("Invalid JSON format")
  }
}

const objectToYAML = (obj: any, indent: number = 0, settings: ConversionSettings): string => {
  const indentStr = " ".repeat(indent * settings.yamlIndentSize)

  if (obj === null) {
    return "null"
  }

  if (typeof obj === "boolean") {
    return obj.toString()
  }

  if (typeof obj === "number") {
    return obj.toString()
  }

  if (typeof obj === "string") {
    // Quote strings that contain special characters
    if (obj.includes("\n") || obj.includes(":") || obj.includes("#") || obj.includes("[") || obj.includes("{")) {
      return `"${obj.replace(/"/g, '\\"')}"`
    }
    return obj
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return "[]"
    }
    return obj.map((item) => `${indentStr}- ${objectToYAML(item, indent + 1, settings)}`).join("\n")
  }

  if (typeof obj === "object") {
    const keys = settings.sortKeys ? Object.keys(obj).sort() : Object.keys(obj)
    if (keys.length === 0) {
      return "{}"
    }

    return keys
      .map((key) => {
        const value = obj[key]
        const yamlValue = objectToYAML(value, indent + 1, settings)

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          return `${indentStr}${key}:\n${yamlValue}`
        } else if (Array.isArray(value) && value.length > 0) {
          return `${indentStr}${key}:\n${yamlValue}`
        } else {
          return `${indentStr}${key}: ${yamlValue}`
        }
      })
      .join("\n")
  }

  return String(obj)
}

// Validation functions
const validateYAML = (yaml: string): ValidationResult => {
  const validation: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!yaml.trim()) {
    validation.isValid = false
    validation.errors.push({ message: "YAML input cannot be empty" })
    return validation
  }

  try {
    parseYAMLToJSON(yaml)
  } catch (error) {
    validation.isValid = false
    validation.errors.push({
      message: error instanceof Error ? error.message : "Invalid YAML format",
    })
    return validation
  }

  // Additional validations
  const lines = yaml.split("\n")
  lines.forEach((line, index) => {
    if (line.includes("\t")) {
      validation.warnings.push(`Line ${index + 1}: Contains tab characters - YAML recommends spaces`)
    }

    if (line.trim().length > 120) {
      validation.warnings.push(`Line ${index + 1}: Very long line - consider breaking it up`)
    }
  })

  return validation
}

const validateJSON = (json: string): ValidationResult => {
  const validation: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!json.trim()) {
    validation.isValid = false
    validation.errors.push({ message: "JSON input cannot be empty" })
    return validation
  }

  try {
    JSON.parse(json)
  } catch (error) {
    validation.isValid = false
    if (error instanceof SyntaxError) {
      const match = error.message.match(/at position (\d+)/)
      const position = match ? parseInt(match[1]) : undefined

      let line: number | undefined
      let column: number | undefined

      if (position !== undefined) {
        const lines = json.substring(0, position).split("\n")
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

  return validation
}

// Conversion templates for common use cases
const conversionTemplates: ConversionTemplate[] = [
  {
    id: "simple-config",
    name: "Simple Configuration",
    description: "Basic configuration file structure",
    category: "Configuration",
    yamlContent: `# Application Configuration
app:
  name: MyApp
  version: 1.0.0
  debug: true

database:
  host: localhost
  port: 5432
  name: myapp_db

features:
  authentication: true
  logging: false`,
    jsonContent: `{
  "app": {
    "name": "MyApp",
    "version": "1.0.0",
    "debug": true
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp_db"
  },
  "features": {
    "authentication": true,
    "logging": false
  }
}`,
    useCase: ["App configuration", "Environment settings", "Service configuration"],
  },
  {
    id: "docker-compose",
    name: "Docker Compose",
    description: "Docker Compose service definition",
    category: "DevOps",
    yamlContent: `version: '3.8'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
    environment:
      - ENV=production

  database:
    image: postgres:13
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:`,
    jsonContent: `{
  "version": "3.8",
  "services": {
    "web": {
      "image": "nginx:latest",
      "ports": ["80:80"],
      "volumes": ["./html:/usr/share/nginx/html"],
      "environment": ["ENV=production"]
    },
    "database": {
      "image": "postgres:13",
      "environment": {
        "POSTGRES_DB": "myapp",
        "POSTGRES_USER": "user",
        "POSTGRES_PASSWORD": "password"
      },
      "volumes": ["db_data:/var/lib/postgresql/data"]
    }
  },
  "volumes": {
    "db_data": null
  }
}`,
    useCase: ["Container orchestration", "Service deployment", "Development environments"],
  },
  {
    id: "kubernetes-deployment",
    name: "Kubernetes Deployment",
    description: "Kubernetes deployment manifest",
    category: "DevOps",
    yamlContent: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80`,
    jsonContent: `{
  "apiVersion": "apps/v1",
  "kind": "Deployment",
  "metadata": {
    "name": "nginx-deployment",
    "labels": {
      "app": "nginx"
    }
  },
  "spec": {
    "replicas": 3,
    "selector": {
      "matchLabels": {
        "app": "nginx"
      }
    },
    "template": {
      "metadata": {
        "labels": {
          "app": "nginx"
        }
      },
      "spec": {
        "containers": [
          {
            "name": "nginx",
            "image": "nginx:1.14.2",
            "ports": [
              {
                "containerPort": 80
              }
            ]
          }
        ]
      }
    }
  }
}`,
    useCase: ["Kubernetes deployments", "Container management", "Cloud native applications"],
  },
  {
    id: "api-response",
    name: "API Response",
    description: "REST API response structure",
    category: "API",
    yamlContent: `status: success
data:
  users:
    - id: 1
      name: John Doe
      email: john@example.com
      active: true
    - id: 2
      name: Jane Smith
      email: jane@example.com
      active: false
meta:
  total: 2
  page: 1
  limit: 10
  has_more: false`,
    jsonContent: `{
  "status": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "active": true
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "active": false
      }
    ]
  },
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "has_more": false
  }
}`,
    useCase: ["REST APIs", "Data exchange", "Service responses"],
  },
  {
    id: "ci-pipeline",
    name: "CI/CD Pipeline",
    description: "Continuous integration pipeline configuration",
    category: "DevOps",
    yamlContent: `name: CI Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build`,
    jsonContent: `{
  "name": "CI Pipeline",
  "on": {
    "push": {
      "branches": ["main", "develop"]
    },
    "pull_request": {
      "branches": ["main"]
    }
  },
  "jobs": {
    "test": {
      "runs-on": "ubuntu-latest",
      "steps": [
        {
          "uses": "actions/checkout@v2"
        },
        {
          "name": "Setup Node.js",
          "uses": "actions/setup-node@v2",
          "with": {
            "node-version": "16"
          }
        },
        {
          "name": "Install dependencies",
          "run": "npm install"
        },
        {
          "name": "Run tests",
          "run": "npm test"
        },
        {
          "name": "Build",
          "run": "npm run build"
        }
      ]
    }
  }
}`,
    useCase: ["GitHub Actions", "CI/CD pipelines", "Automated workflows"],
  },
]

// Custom hooks
const useConversion = () => {
  const convertSingle = useCallback(
    (
      input: string,
      inputFormat: DataFormat,
      outputFormat: DataFormat,
      settings: ConversionSettings
    ): ConversionResult => {
      const startTime = performance.now()

      try {
        let output = ""
        let isValid = true
        let error: string | undefined

        if (inputFormat === "yaml" && outputFormat === "json") {
          const parsed = parseYAMLToJSON(input)
          output = JSON.stringify(parsed, null, settings.jsonIndentSize)
        } else if (inputFormat === "json" && outputFormat === "yaml") {
          output = convertJSONToYAML(input, settings)
        } else {
          throw new Error("Unsupported conversion format")
        }

        // Validate output if enabled
        if (settings.validateOutput) {
          const validation = outputFormat === "json" ? validateJSON(output) : validateYAML(output)
          if (!validation.isValid) {
            isValid = false
            error = validation.errors.map((e) => e.message).join("; ")
          }
        }

        const endTime = performance.now()
        const processingTime = endTime - startTime

        const inputSize = new Blob([input]).size
        const outputSize = new Blob([output]).size
        const compressionRatio = inputSize > 0 ? outputSize / inputSize : 1

        // Analyze complexity
        const complexity = analyzeComplexity(input, inputFormat)

        return {
          id: nanoid(),
          input,
          output,
          inputFormat,
          outputFormat,
          isValid,
          error,
          statistics: {
            inputSize,
            outputSize,
            inputLines: input.split("\n").length,
            outputLines: output.split("\n").length,
            compressionRatio,
            processingTime,
            complexity,
          },
          createdAt: new Date(),
        }
      } catch (error) {
        const endTime = performance.now()
        const processingTime = endTime - startTime

        return {
          id: nanoid(),
          input,
          output: "",
          inputFormat,
          outputFormat,
          isValid: false,
          error: error instanceof Error ? error.message : "Conversion failed",
          statistics: {
            inputSize: new Blob([input]).size,
            outputSize: 0,
            inputLines: input.split("\n").length,
            outputLines: 0,
            compressionRatio: 0,
            processingTime,
            complexity: { depth: 0, keys: 0, arrays: 0, objects: 0, primitives: 0 },
          },
          createdAt: new Date(),
        }
      }
    },
    []
  )

  const convertBatch = useCallback(
    (
      inputs: Array<{ content: string; inputFormat: DataFormat; outputFormat: DataFormat }>,
      settings: ConversionSettings
    ): ConversionBatch => {
      try {
        const conversions = inputs.map((input) =>
          convertSingle(input.content, input.inputFormat, input.outputFormat, settings)
        )

        const validCount = conversions.filter((conv) => conv.isValid).length
        const invalidCount = conversions.length - validCount

        const totalInputSize = conversions.reduce((sum, conv) => sum + conv.statistics.inputSize, 0)
        const totalOutputSize = conversions.reduce((sum, conv) => sum + conv.statistics.outputSize, 0)
        const averageCompressionRatio =
          conversions.length > 0
            ? conversions.reduce((sum, conv) => sum + conv.statistics.compressionRatio, 0) / conversions.length
            : 0

        const formatDistribution = conversions.reduce(
          (acc, conv) => {
            const key = `${conv.inputFormat}-to-${conv.outputFormat}`
            acc[key] = (acc[key] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )

        const statistics: BatchStatistics = {
          totalConversions: conversions.length,
          validCount,
          invalidCount,
          averageCompressionRatio,
          totalInputSize,
          totalOutputSize,
          formatDistribution,
          successRate: (validCount / conversions.length) * 100,
        }

        return {
          id: nanoid(),
          conversions,
          count: conversions.length,
          settings,
          createdAt: new Date(),
          statistics,
        }
      } catch (error) {
        console.error("Batch conversion error:", error)
        throw new Error(error instanceof Error ? error.message : "Batch conversion failed")
      }
    },
    [convertSingle]
  )

  return { convertSingle, convertBatch }
}

// Analyze complexity of input data
const analyzeComplexity = (input: string, format: DataFormat): ComplexityMetrics => {
  const complexity: ComplexityMetrics = {
    depth: 0,
    keys: 0,
    arrays: 0,
    objects: 0,
    primitives: 0,
  }

  try {
    let parsed: any

    if (format === "yaml") {
      parsed = parseYAMLToJSON(input)
      complexity.yamlFeatures = analyzeYAMLFeatures(input)
    } else {
      parsed = JSON.parse(input)
    }

    analyzeValue(parsed, complexity, 0)
  } catch {
    // Return basic complexity for invalid input
  }

  return complexity
}

const analyzeValue = (value: any, complexity: ComplexityMetrics, depth: number): void => {
  complexity.depth = Math.max(complexity.depth, depth)

  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    complexity.primitives++
  } else if (Array.isArray(value)) {
    complexity.arrays++
    value.forEach((item) => analyzeValue(item, complexity, depth + 1))
  } else if (typeof value === "object") {
    complexity.objects++
    Object.keys(value).forEach((key) => {
      complexity.keys++
      analyzeValue(value[key], complexity, depth + 1)
    })
  }
}

const analyzeYAMLFeatures = (yaml: string): YAMLFeatures => {
  return {
    hasComments: yaml.includes("#"),
    hasMultilineStrings: yaml.includes("|") || yaml.includes(">"),
    hasAnchors: yaml.includes("&"),
    hasReferences: yaml.includes("*"),
    hasDocumentSeparators: yaml.includes("---") || yaml.includes("..."),
    hasDirectives: yaml.includes("%"),
  }
}

// Real-time validation hook
const useRealTimeValidation = (input: string, format: DataFormat) => {
  return useMemo(() => {
    if (!input.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = format === "yaml" ? validateYAML(input) : validateJSON(input)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
    }
  }, [input, format])
}

// Export functionality
const useConversionExport = () => {
  const exportConversions = useCallback((conversions: ConversionResult[], format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "json":
        content = JSON.stringify(conversions, null, 2)
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        content = generateCSVFromConversions(conversions)
        mimeType = "text/csv"
        extension = ".csv"
        break
      case "xml":
        content = generateXMLFromConversions(conversions)
        mimeType = "application/xml"
        extension = ".xml"
        break
      case "txt":
      default:
        content = generateTextFromConversions(conversions)
        mimeType = "text/plain"
        extension = ".txt"
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `yaml-json-conversions${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (batch: ConversionBatch) => {
      exportConversions(batch.conversions, "json", `conversion-batch-${batch.id}.json`)
      toast.success(`Exported ${batch.conversions.length} conversion results`)
    },
    [exportConversions]
  )

  const exportStatistics = useCallback((batches: ConversionBatch[]) => {
    const stats = batches.map((batch) => ({
      batchId: batch.id,
      conversionCount: batch.count,
      validCount: batch.statistics.validCount,
      invalidCount: batch.statistics.invalidCount,
      averageCompressionRatio: batch.statistics.averageCompressionRatio.toFixed(3),
      successRate: batch.statistics.successRate.toFixed(2),
      totalInputSize: formatFileSize(batch.statistics.totalInputSize),
      totalOutputSize: formatFileSize(batch.statistics.totalOutputSize),
      createdAt: batch.createdAt.toISOString(),
    }))

    const csvContent = [
      [
        "Batch ID",
        "Conversion Count",
        "Valid Count",
        "Invalid Count",
        "Avg Compression Ratio",
        "Success Rate (%)",
        "Total Input Size",
        "Total Output Size",
        "Created At",
      ],
      ...stats.map((stat) => [
        stat.batchId,
        stat.conversionCount.toString(),
        stat.validCount.toString(),
        stat.invalidCount.toString(),
        stat.averageCompressionRatio,
        stat.successRate,
        stat.totalInputSize,
        stat.totalOutputSize,
        stat.createdAt,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "conversion-statistics.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Statistics exported")
  }, [])

  return { exportConversions, exportBatch, exportStatistics }
}

// Generate export formats
const generateTextFromConversions = (conversions: ConversionResult[]): string => {
  return `YAML ⇄ JSON Conversion Report
===============================

Generated: ${new Date().toLocaleString()}
Total Conversions: ${conversions.length}
Valid Conversions: ${conversions.filter((conv) => conv.isValid).length}
Invalid Conversions: ${conversions.filter((conv) => !conv.isValid).length}

Conversions:
${conversions
  .map((conv, i) => {
    return `${i + 1}. ${conv.inputFormat.toUpperCase()} → ${conv.outputFormat.toUpperCase()}
   Status: ${conv.isValid ? "Valid" : "Invalid"}
   ${conv.error ? `Error: ${conv.error}` : ""}
   Input Size: ${formatFileSize(conv.statistics.inputSize)}
   Output Size: ${formatFileSize(conv.statistics.outputSize)}
   Compression Ratio: ${conv.statistics.compressionRatio.toFixed(3)}
   Processing Time: ${conv.statistics.processingTime.toFixed(2)}ms
   Complexity: ${conv.statistics.complexity.depth} levels, ${conv.statistics.complexity.keys} keys
`
  })
  .join("\n")}

Statistics:
- Success Rate: ${((conversions.filter((conv) => conv.isValid).length / conversions.length) * 100).toFixed(1)}%
- Average Compression Ratio: ${(conversions.reduce((sum, conv) => sum + conv.statistics.compressionRatio, 0) / conversions.length).toFixed(3)}
`
}

const generateCSVFromConversions = (conversions: ConversionResult[]): string => {
  const rows = [
    [
      "Input Format",
      "Output Format",
      "Valid",
      "Error",
      "Input Size (bytes)",
      "Output Size (bytes)",
      "Compression Ratio",
      "Processing Time (ms)",
      "Complexity Depth",
      "Keys",
      "Created At",
    ],
  ]

  conversions.forEach((conv) => {
    rows.push([
      conv.inputFormat,
      conv.outputFormat,
      conv.isValid ? "Yes" : "No",
      conv.error || "",
      conv.statistics.inputSize.toString(),
      conv.statistics.outputSize.toString(),
      conv.statistics.compressionRatio.toFixed(3),
      conv.statistics.processingTime.toFixed(2),
      conv.statistics.complexity.depth.toString(),
      conv.statistics.complexity.keys.toString(),
      conv.createdAt.toISOString(),
    ])
  })

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}

const generateXMLFromConversions = (conversions: ConversionResult[]): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<conversionResults>
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
      <inputFormat>${conv.inputFormat}</inputFormat>
      <outputFormat>${conv.outputFormat}</outputFormat>
      <valid>${conv.isValid}</valid>
      ${conv.error ? `<error>${conv.error}</error>` : ""}
      <statistics>
        <inputSize>${conv.statistics.inputSize}</inputSize>
        <outputSize>${conv.statistics.outputSize}</outputSize>
        <compressionRatio>${conv.statistics.compressionRatio}</compressionRatio>
        <processingTime>${conv.statistics.processingTime}</processingTime>
        <complexity>
          <depth>${conv.statistics.complexity.depth}</depth>
          <keys>${conv.statistics.complexity.keys}</keys>
          <objects>${conv.statistics.complexity.objects}</objects>
          <arrays>${conv.statistics.complexity.arrays}</arrays>
        </complexity>
      </statistics>
      <createdAt>${conv.createdAt.toISOString()}</createdAt>
    </conversion>`
      )
      .join("")}
  </conversions>
</conversionResults>`
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
 * Enhanced YAML ⇄ JSON Converter Tool
 * Features: Advanced YAML/JSON conversion, validation, analysis, batch processing, comprehensive formatting
 */
const YAMLToJSONCore = () => {
  const [activeTab, setActiveTab] = useState<"converter" | "batch" | "templates">("converter")
  const [yamlInput, setYamlInput] = useState("")
  const [jsonInput, setJsonInput] = useState("")
  const [currentResult, setCurrentResult] = useState<ConversionResult | null>(null)
  const [batches, setBatches] = useState<ConversionBatch[]>([])
  const [batchInput, setBatchInput] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<ConversionSettings>({
    yamlIndentSize: 2,
    jsonIndentSize: 2,
    preserveComments: true,
    sortKeys: false,
    flowStyle: false,
    realTimeConversion: true,
    validateOutput: true,
    exportFormat: "json",
    maxFileSize: 10485760, // 10MB
  })

  const { convertSingle, convertBatch } = useConversion()
  const { exportConversions, exportBatch, exportStatistics } = useConversionExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const yamlValidation = useRealTimeValidation(yamlInput, "yaml")
  const jsonValidation = useRealTimeValidation(jsonInput, "json")

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = conversionTemplates.find((t) => t.id === templateId)
    if (template) {
      setYamlInput(template.yamlContent)
      setJsonInput(template.jsonContent)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single conversion
  const handleConvertSingle = useCallback(
    async (inputFormat: DataFormat, outputFormat: DataFormat) => {
      const input = inputFormat === "yaml" ? yamlInput : jsonInput

      if (!input.trim()) {
        toast.error(`Please enter ${inputFormat.toUpperCase()} content to convert`)
        return
      }

      setIsProcessing(true)
      try {
        const result = convertSingle(input, inputFormat, outputFormat, settings)
        setCurrentResult(result)

        // Update the output field
        if (outputFormat === "yaml") {
          setYamlInput(result.output)
        } else {
          setJsonInput(result.output)
        }

        if (result.isValid) {
          toast.success(`${inputFormat.toUpperCase()} → ${outputFormat.toUpperCase()} conversion completed`)
        } else {
          toast.error(result.error || "Conversion failed")
        }
      } catch (error) {
        toast.error(`Failed to convert ${inputFormat.toUpperCase()} to ${outputFormat.toUpperCase()}`)
        console.error(error)
      } finally {
        setIsProcessing(false)
      }
    },
    [yamlInput, jsonInput, settings, convertSingle]
  )

  // Handle batch processing
  const handleConvertBatch = useCallback(async () => {
    const lines = batchInput.split("\n").filter((line) => line.trim())

    if (lines.length === 0) {
      toast.error("Please enter content to process")
      return
    }

    // Parse batch input format: format:content
    const inputs = lines
      .map((line) => {
        const [format, ...contentParts] = line.split(":")
        const content = contentParts.join(":").trim()
        const inputFormat = format.trim().toLowerCase() as DataFormat
        const outputFormat = inputFormat === "yaml" ? "json" : "yaml"

        return { content, inputFormat, outputFormat }
      })
      .filter((input) => ["yaml", "json"].includes(input.inputFormat))

    if (inputs.length === 0) {
      toast.error("No valid format:content pairs found. Use format: yaml:content or json:content")
      return
    }

    setIsProcessing(true)
    try {
      // 修正：将 outputFormat 明确为 DataFormat 类型
      const batch = convertBatch(
        inputs.map((input) => ({
          ...input,
          outputFormat: input.outputFormat as DataFormat,
        })),
        settings
      )
      setBatches((prev) => [batch, ...prev])
      toast.success(`已处理 ${batch.conversions.length} 个转换`)
    } catch (error) {
      toast.error("批量处理失败")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, settings, convertBatch])

  // Auto-convert when real-time conversion is enabled
  useEffect(() => {
    if (settings.realTimeConversion && yamlInput.trim() && yamlValidation.isValid) {
      const timer = setTimeout(() => {
        handleConvertSingle("yaml", "json")
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [yamlInput, yamlValidation.isValid, settings.realTimeConversion, handleConvertSingle])

  useEffect(() => {
    if (settings.realTimeConversion && jsonInput.trim() && jsonValidation.isValid) {
      const timer = setTimeout(() => {
        handleConvertSingle("json", "yaml")
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [jsonInput, jsonValidation.isValid, settings.realTimeConversion, handleConvertSingle])

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
              <ArrowLeftRight className="h-5 w-5" />
              YAML ⇄ JSON Converter
            </CardTitle>
            <CardDescription>
              Advanced YAML and JSON conversion tool with validation, analysis, and batch processing capabilities.
              Convert between YAML and JSON formats with comprehensive error reporting and statistics. Use keyboard
              navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "converter" | "batch" | "templates")}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="converter"
              className="flex items-center gap-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Converter
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
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Converter Tab */}
          <TabsContent
            value="converter"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* YAML Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    YAML Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="yaml-input"
                      className="text-sm font-medium"
                    >
                      YAML Content
                    </Label>
                    <Textarea
                      id="yaml-input"
                      value={yamlInput}
                      onChange={(e) => setYamlInput(e.target.value)}
                      placeholder="Enter or paste your YAML here..."
                      className="mt-2 min-h-[200px] font-mono"
                    />
                    {settings.realTimeConversion && yamlInput && (
                      <div className="mt-2 text-sm">
                        {yamlValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid YAML
                          </div>
                        ) : yamlValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {yamlValidation.error}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConvertSingle("yaml", "json")}
                      disabled={!yamlInput.trim() || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      YAML → JSON
                    </Button>
                    <Button
                      onClick={() => setYamlInput("")}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {yamlValidation.warnings && yamlValidation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Warnings:</h4>
                      <div className="text-xs space-y-1">
                        {yamlValidation.warnings.map((warning, index) => (
                          <div
                            key={index}
                            className="text-yellow-700"
                          >
                            {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* JSON Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    JSON Output
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="json-input"
                      className="text-sm font-medium"
                    >
                      JSON Content
                    </Label>
                    <Textarea
                      id="json-input"
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder="Enter or paste your JSON here..."
                      className="mt-2 min-h-[200px] font-mono"
                    />
                    {settings.realTimeConversion && jsonInput && (
                      <div className="mt-2 text-sm">
                        {jsonValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid JSON
                          </div>
                        ) : jsonValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {jsonValidation.error}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConvertSingle("json", "yaml")}
                      disabled={!jsonInput.trim() || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <ArrowLeft className="mr-2 h-4 w-4" />
                      )}
                      JSON → YAML
                    </Button>
                    <Button
                      onClick={() => setJsonInput("")}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {jsonValidation.warnings && jsonValidation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Warnings:</h4>
                      <div className="text-xs space-y-1">
                        {jsonValidation.warnings.map((warning, index) => (
                          <div
                            key={index}
                            className="text-yellow-700"
                          >
                            {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Conversion Results */}
            {currentResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Conversion Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Conversion</div>
                        <div>
                          {currentResult.inputFormat.toUpperCase()} → {currentResult.outputFormat.toUpperCase()}
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Status</div>
                        <div className={currentResult.isValid ? "text-green-600" : "text-red-600"}>
                          {currentResult.isValid ? "Success" : "Failed"}
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Size Change</div>
                        <div>
                          {formatFileSize(currentResult.statistics.inputSize)} →{" "}
                          {formatFileSize(currentResult.statistics.outputSize)}
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Processing Time</div>
                        <div>{currentResult.statistics.processingTime.toFixed(2)}ms</div>
                      </div>
                    </div>

                    {currentResult.error && (
                      <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">Conversion Error</span>
                        </div>
                        <div className="text-red-700 text-sm mt-1">{currentResult.error}</div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => copyToClipboard(currentResult.output, "Conversion Result")}
                        variant="outline"
                        size="sm"
                      >
                        {copiedText === "Conversion Result" ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Copy Result
                      </Button>
                      <Button
                        onClick={() => exportConversions([currentResult], settings.exportFormat)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Result
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
                  Batch Conversion
                </CardTitle>
                <CardDescription>Process multiple conversions at once (format:content per line)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="batch-input"
                      className="text-sm font-medium"
                    >
                      Conversions (format:content per line)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder='yaml:name: John Doe&#10;json:{"name": "Jane Smith"}&#10;yaml:age: 30'
                      className="mt-2 min-h-[120px] font-mono"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">
                      Format: <code>yaml:content</code> or <code>json:content</code> (one per line)
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleConvertBatch}
                      disabled={!batchInput.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Process Batch
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
                            <h4 className="font-medium">{batch.count} conversions processed</h4>
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
                            <span className="font-medium">Avg Compression:</span>{" "}
                            {batch.statistics.averageCompressionRatio.toFixed(3)}
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.conversions.slice(0, 5).map((conv) => (
                              <div
                                key={conv.id}
                                className="text-xs border rounded p-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">
                                    {conv.inputFormat.toUpperCase()} → {conv.outputFormat.toUpperCase()}:{" "}
                                    {conv.input.substring(0, 40)}...
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      conv.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {conv.isValid ? "Valid" : "Invalid"}
                                  </span>
                                </div>
                                {conv.isValid && (
                                  <div className="text-muted-foreground mt-1">
                                    Size: {formatFileSize(conv.statistics.inputSize)} →{" "}
                                    {formatFileSize(conv.statistics.outputSize)} • Time:{" "}
                                    {conv.statistics.processingTime.toFixed(2)}ms
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

          {/* Templates Tab */}
          <TabsContent
            value="templates"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Conversion Templates
                </CardTitle>
                <CardDescription>Common YAML and JSON structures for various use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {conversionTemplates.map((template) => (
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
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs font-medium mb-1">YAML:</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded max-h-24 overflow-y-auto">
                              {template.yamlContent.split("\n").slice(0, 4).join("\n")}
                              {template.yamlContent.split("\n").length > 4 && "..."}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">JSON:</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded max-h-24 overflow-y-auto">
                              {template.jsonContent.split("\n").slice(0, 4).join("\n")}
                              {template.jsonContent.split("\n").length > 4 && "..."}
                            </div>
                          </div>
                        </div>
                        {template.useCase.length > 0 && (
                          <div className="text-xs">
                            <strong>Use cases:</strong> {template.useCase.join(", ")}
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
                  <Label
                    htmlFor="yaml-indent"
                    className="text-sm font-medium"
                  >
                    YAML Indent Size: {settings.yamlIndentSize}
                  </Label>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={settings.yamlIndentSize}
                      onChange={(e) => setSettings((prev) => ({ ...prev, yamlIndentSize: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="json-indent"
                    className="text-sm font-medium"
                  >
                    JSON Indent Size: {settings.jsonIndentSize}
                  </Label>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="8"
                      step="1"
                      value={settings.jsonIndentSize}
                      onChange={(e) => setSettings((prev) => ({ ...prev, jsonIndentSize: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                  </div>
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
                  <Label
                    htmlFor="real-time-conversion"
                    className="text-sm"
                  >
                    Real-time conversion
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
                    Sort object keys alphabetically
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="validate-output"
                    type="checkbox"
                    checked={settings.validateOutput}
                    onChange={(e) => setSettings((prev) => ({ ...prev, validateOutput: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <Label
                    htmlFor="validate-output"
                    className="text-sm"
                  >
                    Validate output format
                  </Label>
                </div>
              </div>

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
const YamlToJson = () => {
  return <YAMLToJSONCore />
}

export default YamlToJson
