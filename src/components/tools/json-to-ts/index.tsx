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
  Code,
  BookOpen,
  FileText,
  Search,
  ArrowRight,
  Eye,
  EyeOff,
  Braces,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  TypeScriptGenerationResult,
  ComplexityMetrics,
  TypeCount,
  TypeAnalysis,
  GenerationBatch,
  BatchStatistics,
  GenerationSettings,
  TypeScriptTemplate,
  JSONValidation,
  ExportFormat,
} from "@/schemas/json-to-ts.schema"
import { formatFileSize } from "@/lib/utils"
// Enhanced Types

// Utility functions

// TypeScript generation functions
const inferTypeFromValue = (value: any, settings: GenerationSettings, depth: number = 0): string => {
  if (value === null) {
    return settings.useStrictTypes ? "null" : "any"
  }

  if (value === undefined) {
    return "undefined"
  }

  if (typeof value === "boolean") {
    return settings.useStrictTypes ? (value ? "true" : "false") : "boolean"
  }

  if (typeof value === "number") {
    return settings.useStrictTypes ? value.toString() : "number"
  }

  if (typeof value === "string") {
    return settings.useStrictTypes ? `"${value}"` : "string"
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "any[]"
    }

    // Infer array element type
    const elementTypes = value.map((item) => inferTypeFromValue(item, settings, depth + 1))
    const uniqueTypes = [...new Set(elementTypes)]

    if (uniqueTypes.length === 1) {
      return `${uniqueTypes[0]}[]`
    } else {
      return `(${uniqueTypes.join(" | ")})[]`
    }
  }

  if (typeof value === "object") {
    if (depth > 10) {
      return "any" // Prevent infinite recursion
    }

    const properties = Object.entries(value).map(([key, val]) => {
      const type = inferTypeFromValue(val, settings, depth + 1)
      const optional = settings.useOptionalProperties && (val === null || val === undefined) ? "?" : ""
      const readonly = settings.useReadonly ? "readonly " : ""
      return `  ${readonly}${key}${optional}: ${type};`
    })

    return `{\n${properties.join("\n")}\n}`
  }

  return "any"
}

const generateTypeScriptInterface = (json: string, interfaceName: string, settings: GenerationSettings): string => {
  try {
    const parsed = JSON.parse(json)
    const type = inferTypeFromValue(parsed, settings)

    let result = ""

    // Add comments if enabled
    if (settings.generateComments) {
      result += `/**\n * Generated TypeScript interface from JSON\n * Created: ${new Date().toISOString()}\n */\n`
    }

    // Add export keyword if enabled
    const exportKeyword = settings.exportInterface ? "export " : ""

    // Generate interface
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      result += `${exportKeyword}interface ${interfaceName} ${type}`
    } else if (Array.isArray(parsed)) {
      result += `${exportKeyword}type ${interfaceName} = ${type}`
    } else {
      result += `${exportKeyword}type ${interfaceName} = ${type}`
    }

    // Add utility types if enabled
    if (settings.generateUtilityTypes && typeof parsed === "object" && !Array.isArray(parsed)) {
      result += `\n\n// Utility types\n`
      result += `${exportKeyword}type Partial${interfaceName} = Partial<${interfaceName}>;\n`
      result += `${exportKeyword}type Required${interfaceName} = Required<${interfaceName}>;\n`
      result += `${exportKeyword}type ${interfaceName}Keys = keyof ${interfaceName};`
    }

    return result
  } catch (error) {
    throw new Error("Invalid JSON format")
  }
}

// Analysis functions
const analyzeJSON = (json: string): TypeAnalysis => {
  try {
    const parsed = JSON.parse(json)
    const analysis: TypeAnalysis = {
      rootType: Array.isArray(parsed) ? "array" : typeof parsed,
      hasNestedObjects: false,
      hasArrays: false,
      hasOptionalProperties: false,
      hasUnionTypes: false,
      hasComplexTypes: false,
      suggestedImprovements: [],
      typeIssues: [],
    }

    const analyzeValue = (value: any, path: string = "") => {
      if (Array.isArray(value)) {
        analysis.hasArrays = true
        value.forEach((item, index) => analyzeValue(item, `${path}[${index}]`))

        // Check for mixed types in array
        const types = value.map((item) => typeof item)
        const uniqueTypes = [...new Set(types)]
        if (uniqueTypes.length > 1) {
          analysis.hasUnionTypes = true
          analysis.hasComplexTypes = true
        }
      } else if (typeof value === "object" && value !== null) {
        analysis.hasNestedObjects = true

        Object.entries(value).forEach(([key, val]) => {
          if (val === null || val === undefined) {
            analysis.hasOptionalProperties = true
          }
          analyzeValue(val, path ? `${path}.${key}` : key)
        })
      }
    }

    analyzeValue(parsed)

    // Generate suggestions
    if (analysis.hasOptionalProperties) {
      analysis.suggestedImprovements.push("Consider using optional properties for null/undefined values")
    }

    if (analysis.hasUnionTypes) {
      analysis.suggestedImprovements.push("Consider using union types for mixed array elements")
    }

    if (analysis.hasNestedObjects) {
      analysis.suggestedImprovements.push("Consider extracting nested objects into separate interfaces")
    }

    return analysis
  } catch {
    return {
      rootType: "unknown",
      hasNestedObjects: false,
      hasArrays: false,
      hasOptionalProperties: false,
      hasUnionTypes: false,
      hasComplexTypes: false,
      suggestedImprovements: ["Fix JSON syntax errors first"],
      typeIssues: ["Invalid JSON format"],
    }
  }
}

// Calculate complexity metrics
const calculateComplexity = (json: string): ComplexityMetrics => {
  const complexity: ComplexityMetrics = {
    depth: 0,
    totalProperties: 0,
    nestedObjects: 0,
    arrays: 0,
    optionalProperties: 0,
    unionTypes: 0,
  }

  try {
    const parsed = JSON.parse(json)

    const analyzeComplexity = (value: any, currentDepth: number = 0) => {
      complexity.depth = Math.max(complexity.depth, currentDepth)

      if (Array.isArray(value)) {
        complexity.arrays++
        value.forEach((item) => analyzeComplexity(item, currentDepth + 1))

        // Check for union types in arrays
        const types = value.map((item) => typeof item)
        const uniqueTypes = [...new Set(types)]
        if (uniqueTypes.length > 1) {
          complexity.unionTypes++
        }
      } else if (typeof value === "object" && value !== null) {
        complexity.nestedObjects++

        Object.entries(value).forEach(([_, val]) => {
          complexity.totalProperties++

          if (val === null || val === undefined) {
            complexity.optionalProperties++
          }

          analyzeComplexity(val, currentDepth + 1)
        })
      }
    }

    analyzeComplexity(parsed)
  } catch {
    // Return default complexity for invalid JSON
  }

  return complexity
}

// TypeScript generation templates
const typeScriptTemplates: TypeScriptTemplate[] = [
  {
    id: "simple-object",
    name: "Simple Object",
    description: "Basic object with primitive properties",
    category: "Basic",
    jsonExample: `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "active": true
}`,
    expectedOutput: `interface User {
  name: string;
  age: number;
  email: string;
  active: boolean;
}`,
    useCase: ["User profiles", "Configuration objects", "Simple data models"],
  },
  {
    id: "nested-object",
    name: "Nested Object",
    description: "Object with nested properties and sub-objects",
    category: "Complex",
    jsonExample: `{
  "user": {
    "profile": {
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "settings": {
      "theme": "dark",
      "notifications": true
    }
  },
  "metadata": {
    "createdAt": "2024-01-15T10:30:00Z",
    "version": 1
  }
}`,
    expectedOutput: `interface RootObject {
  user: {
    profile: {
      firstName: string;
      lastName: string;
    };
    settings: {
      theme: string;
      notifications: boolean;
    };
  };
  metadata: {
    createdAt: string;
    version: number;
  };
}`,
    useCase: ["Complex data structures", "API responses", "Configuration files"],
  },
  {
    id: "array-of-objects",
    name: "Array of Objects",
    description: "Array containing objects with consistent structure",
    category: "Arrays",
    jsonExample: `[
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
    expectedOutput: `type ProductArray = {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}[]`,
    useCase: ["Product catalogs", "User lists", "Data collections"],
  },
  {
    id: "mixed-types",
    name: "Mixed Types",
    description: "Object with various data types and optional properties",
    category: "Complex",
    jsonExample: `{
  "id": 123,
  "name": "Sample",
  "tags": ["typescript", "json", "conversion"],
  "metadata": null,
  "config": {
    "enabled": true,
    "options": [1, 2, 3]
  },
  "optional": undefined
}`,
    expectedOutput: `interface MixedObject {
  id: number;
  name: string;
  tags: string[];
  metadata: null;
  config: {
    enabled: boolean;
    options: number[];
  };
  optional?: undefined;
}`,
    useCase: ["API responses", "Configuration objects", "Dynamic data"],
  },
  {
    id: "api-response",
    name: "API Response",
    description: "Typical REST API response structure",
    category: "API",
    jsonExample: `{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "123",
        "username": "johndoe",
        "email": "john@example.com",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "hasMore": false
  }
}`,
    expectedOutput: `interface ApiResponse {
  status: string;
  data: {
    users: {
      id: string;
      username: string;
      email: string;
      createdAt: string;
    }[];
  };
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}`,
    useCase: ["REST APIs", "GraphQL responses", "Microservices"],
  },
]

// Validation functions
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

  if (input.length > 100000) {
    validation.warnings.push("Large JSON file - processing may be slow")
  }

  return validation
}

// Custom hooks
const useTypeScriptGeneration = () => {
  const generateSingle = useCallback(
    (input: string, interfaceName: string, settings: GenerationSettings): TypeScriptGenerationResult => {
      const startTime = performance.now()

      try {
        const output = generateTypeScriptInterface(input, interfaceName, settings)
        const analysis = analyzeJSON(input)
        const complexity = calculateComplexity(input)

        const endTime = performance.now()
        const processingTime = endTime - startTime

        const inputSize = new Blob([input]).size
        const outputSize = new Blob([output]).size

        // Count types
        const typeCount: TypeCount = {
          primitives: (output.match(/: (string|number|boolean);/g) || []).length,
          objects: (output.match(/: \{/g) || []).length,
          arrays: (output.match(/\[\]/g) || []).length,
          unions: (output.match(/\|/g) || []).length,
          literals: (output.match(/: "[^"]*"/g) || []).length,
          any: (output.match(/: any/g) || []).length,
        }

        return {
          id: nanoid(),
          input,
          output,
          interfaceName,
          isValid: true,
          statistics: {
            inputSize,
            outputSize,
            inputLines: input.split("\n").length,
            outputLines: output.split("\n").length,
            processingTime,
            complexity,
            typeCount,
          },
          analysis,
          createdAt: new Date(),
        }
      } catch (error) {
        const endTime = performance.now()
        const processingTime = endTime - startTime

        return {
          id: nanoid(),
          input,
          output: "",
          interfaceName,
          isValid: false,
          error: error instanceof Error ? error.message : "Generation failed",
          statistics: {
            inputSize: new Blob([input]).size,
            outputSize: 0,
            inputLines: input.split("\n").length,
            outputLines: 0,
            processingTime,
            complexity: {
              depth: 0,
              totalProperties: 0,
              nestedObjects: 0,
              arrays: 0,
              optionalProperties: 0,
              unionTypes: 0,
            },
            typeCount: { primitives: 0, objects: 0, arrays: 0, unions: 0, literals: 0, any: 0 },
          },
          createdAt: new Date(),
        }
      }
    },
    []
  )

  const generateBatch = useCallback(
    (inputs: Array<{ content: string; interfaceName: string }>, settings: GenerationSettings): GenerationBatch => {
      try {
        const results = inputs.map((input) => generateSingle(input.content, input.interfaceName, settings))

        const validCount = results.filter((result) => result.isValid).length
        const invalidCount = results.length - validCount

        const totalInputSize = results.reduce((sum, result) => sum + result.statistics.inputSize, 0)
        const totalOutputSize = results.reduce((sum, result) => sum + result.statistics.outputSize, 0)
        const averageComplexity =
          results.length > 0
            ? results.reduce((sum, result) => sum + result.statistics.complexity.depth, 0) / results.length
            : 0

        const statistics: BatchStatistics = {
          totalGenerated: results.length,
          validCount,
          invalidCount,
          averageComplexity,
          totalInputSize,
          totalOutputSize,
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
        console.error("Batch generation error:", error)
        throw new Error(error instanceof Error ? error.message : "Batch generation failed")
      }
    },
    [generateSingle]
  )

  return { generateSingle, generateBatch }
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

// Export functionality
const useTypeScriptExport = () => {
  const exportResults = useCallback(
    (results: TypeScriptGenerationResult[], format: ExportFormat, filename?: string) => {
      let content = ""
      let mimeType = "text/plain"
      let extension = ".txt"

      switch (format) {
        case "ts":
          content = results.map((result) => result.output).join("\n\n")
          mimeType = "text/typescript"
          extension = ".ts"
          break
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
      link.download = filename || `typescript-interfaces${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    []
  )

  const exportBatch = useCallback(
    (batch: GenerationBatch) => {
      exportResults(batch.results, "ts", `typescript-batch-${batch.id}.ts`)
      toast.success(`Exported ${batch.results.length} TypeScript interfaces`)
    },
    [exportResults]
  )

  const exportStatistics = useCallback((batches: GenerationBatch[]) => {
    const stats = batches.map((batch) => ({
      batchId: batch.id,
      resultCount: batch.count,
      validCount: batch.statistics.validCount,
      invalidCount: batch.statistics.invalidCount,
      averageComplexity: batch.statistics.averageComplexity.toFixed(2),
      successRate: batch.statistics.successRate.toFixed(2),
      totalInputSize: formatFileSize(batch.statistics.totalInputSize),
      totalOutputSize: formatFileSize(batch.statistics.totalOutputSize),
      createdAt: batch.createdAt.toISOString(),
    }))

    const csvContent = [
      [
        "Batch ID",
        "Result Count",
        "Valid Count",
        "Invalid Count",
        "Avg Complexity",
        "Success Rate (%)",
        "Total Input Size",
        "Total Output Size",
        "Created At",
      ],
      ...stats.map((stat) => [
        stat.batchId,
        stat.resultCount.toString(),
        stat.validCount.toString(),
        stat.invalidCount.toString(),
        stat.averageComplexity,
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
    link.download = "typescript-statistics.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Statistics exported")
  }, [])

  return { exportResults, exportBatch, exportStatistics }
}

// Generate export formats
const generateTextFromResults = (results: TypeScriptGenerationResult[]): string => {
  return `TypeScript Interface Generation Report
=====================================

Generated: ${new Date().toLocaleString()}
Total Results: ${results.length}
Valid Results: ${results.filter((result) => result.isValid).length}
Invalid Results: ${results.filter((result) => !result.isValid).length}

Results:
${results
  .map((result, i) => {
    return `${i + 1}. Interface: ${result.interfaceName}
   Status: ${result.isValid ? "Valid" : "Invalid"}
   ${result.error ? `Error: ${result.error}` : ""}
   Input Size: ${formatFileSize(result.statistics.inputSize)}
   Output Size: ${formatFileSize(result.statistics.outputSize)}
   Processing Time: ${result.statistics.processingTime.toFixed(2)}ms
   Complexity: ${result.statistics.complexity.depth} levels, ${result.statistics.complexity.totalProperties} properties
   Types: ${result.statistics.typeCount.primitives} primitives, ${result.statistics.typeCount.objects} objects
`
  })
  .join("\n")}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Average Complexity: ${(results.reduce((sum, result) => sum + result.statistics.complexity.depth, 0) / results.length).toFixed(1)} levels
`
}

const generateCSVFromResults = (results: TypeScriptGenerationResult[]): string => {
  const rows = [
    [
      "Interface Name",
      "Valid",
      "Error",
      "Input Size (bytes)",
      "Output Size (bytes)",
      "Processing Time (ms)",
      "Complexity Depth",
      "Total Properties",
      "Primitive Types",
      "Object Types",
      "Created At",
    ],
  ]

  results.forEach((result) => {
    rows.push([
      result.interfaceName,
      result.isValid ? "Yes" : "No",
      result.error || "",
      result.statistics.inputSize.toString(),
      result.statistics.outputSize.toString(),
      result.statistics.processingTime.toFixed(2),
      result.statistics.complexity.depth.toString(),
      result.statistics.complexity.totalProperties.toString(),
      result.statistics.typeCount.primitives.toString(),
      result.statistics.typeCount.objects.toString(),
      result.createdAt.toISOString(),
    ])
  })

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
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
 * Enhanced JSON to TypeScript Interface Generator
 * Features: Advanced TypeScript generation, validation, analysis, batch processing, comprehensive type inference
 */
const JSONToTSCore = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "batch" | "analyzer" | "templates">("generator")
  const [jsonInput, setJsonInput] = useState("")
  const [currentResult, setCurrentResult] = useState<TypeScriptGenerationResult | null>(null)
  const [batches, setBatches] = useState<GenerationBatch[]>([])
  const [batchInput, setBatchInput] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [settings, setSettings] = useState<GenerationSettings>({
    interfaceName: "GeneratedInterface",
    useOptionalProperties: true,
    generateComments: true,
    useStrictTypes: false,
    exportInterface: true,
    realTimeGeneration: true,
    exportFormat: "ts",
    indentSize: 2,
    useReadonly: false,
    generateUtilityTypes: false,
  })

  const { generateSingle, generateBatch } = useTypeScriptGeneration()
  const { exportResults, exportBatch, exportStatistics } = useTypeScriptExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const inputValidation = useRealTimeValidation(jsonInput)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = typeScriptTemplates.find((t) => t.id === templateId)
    if (template) {
      setJsonInput(template.jsonExample)
      setSelectedTemplate(templateId)

      // Extract interface name from template
      const interfaceMatch = template.expectedOutput.match(/interface (\w+)/)
      const typeMatch = template.expectedOutput.match(/type (\w+)/)
      const name = interfaceMatch?.[1] || typeMatch?.[1] || "GeneratedInterface"

      setSettings((prev) => ({
        ...prev,
        interfaceName: name,
      }))
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single generation
  const handleGenerateSingle = useCallback(async () => {
    if (!jsonInput.trim()) {
      toast.error("Please enter JSON content to generate TypeScript interface")
      return
    }

    setIsProcessing(true)
    try {
      const result = generateSingle(jsonInput, settings.interfaceName, settings)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success("TypeScript interface generated successfully")
      } else {
        toast.error(result.error || "Generation failed")
      }
    } catch (error) {
      toast.error("Failed to generate TypeScript interface")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [jsonInput, settings, generateSingle])

  // Handle batch processing
  const handleGenerateBatch = useCallback(async () => {
    const lines = batchInput.split("\n").filter((line) => line.trim())

    if (lines.length === 0) {
      toast.error("Please enter JSON content to process")
      return
    }

    // Parse batch input format: interfaceName:jsonContent
    const inputs = lines
      .map((line, index) => {
        const colonIndex = line.indexOf(":")
        if (colonIndex === -1) {
          return {
            content: line.trim(),
            interfaceName: `Interface${index + 1}`,
          }
        }

        const interfaceName = line.substring(0, colonIndex).trim() || `Interface${index + 1}`
        const content = line.substring(colonIndex + 1).trim()

        return { content, interfaceName }
      })
      .filter((input) => input.content)

    if (inputs.length === 0) {
      toast.error("No valid JSON content found")
      return
    }

    setIsProcessing(true)
    try {
      const batch = generateBatch(inputs, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Generated ${batch.results.length} TypeScript interfaces`)
    } catch (error) {
      toast.error("Failed to process batch")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, settings, generateBatch])

  // Auto-generate when real-time generation is enabled
  useEffect(() => {
    if (settings.realTimeGeneration && jsonInput.trim() && inputValidation.isValid) {
      const timer = setTimeout(() => {
        handleGenerateSingle()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [jsonInput, inputValidation.isValid, settings.realTimeGeneration, handleGenerateSingle])

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
              <Braces className="h-5 w-5" />
              JSON to TypeScript Interface Generator
            </CardTitle>
            <CardDescription>
              Advanced JSON to TypeScript interface generator with type inference, validation, analysis, and batch
              processing capabilities. Generate TypeScript interfaces from JSON with comprehensive type analysis and
              error reporting. Use keyboard navigation: Tab to move between controls, Enter or Space to activate
              buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "generator" | "batch" | "analyzer" | "templates")}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="generator"
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              Generator
            </TabsTrigger>
            <TabsTrigger
              value="batch"
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
            <TabsTrigger
              value="analyzer"
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Type Analyzer
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Generator Tab */}
          <TabsContent
            value="generator"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    JSON Input
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
                    {settings.realTimeGeneration && jsonInput && (
                      <div className="mt-2 text-sm">
                        {inputValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid JSON
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

                  <div>
                    <Label
                      htmlFor="interface-name"
                      className="text-sm font-medium"
                    >
                      Interface Name
                    </Label>
                    <Input
                      id="interface-name"
                      value={settings.interfaceName}
                      onChange={(e) => setSettings((prev) => ({ ...prev, interfaceName: e.target.value }))}
                      placeholder="GeneratedInterface"
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id="real-time-generation"
                        type="checkbox"
                        checked={settings.realTimeGeneration}
                        onChange={(e) => setSettings((prev) => ({ ...prev, realTimeGeneration: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="real-time-generation"
                        className="text-sm"
                      >
                        Real-time generation
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="use-optional"
                        type="checkbox"
                        checked={settings.useOptionalProperties}
                        onChange={(e) => setSettings((prev) => ({ ...prev, useOptionalProperties: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="use-optional"
                        className="text-sm"
                      >
                        Use optional properties for null/undefined
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="generate-comments"
                        type="checkbox"
                        checked={settings.generateComments}
                        onChange={(e) => setSettings((prev) => ({ ...prev, generateComments: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="generate-comments"
                        className="text-sm"
                      >
                        Generate comments
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="export-interface"
                        type="checkbox"
                        checked={settings.exportInterface}
                        onChange={(e) => setSettings((prev) => ({ ...prev, exportInterface: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="export-interface"
                        className="text-sm"
                      >
                        Export interface
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="use-strict-types"
                        type="checkbox"
                        checked={settings.useStrictTypes}
                        onChange={(e) => setSettings((prev) => ({ ...prev, useStrictTypes: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="use-strict-types"
                        className="text-sm"
                      >
                        Use strict literal types
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="generate-utility-types"
                        type="checkbox"
                        checked={settings.generateUtilityTypes}
                        onChange={(e) => setSettings((prev) => ({ ...prev, generateUtilityTypes: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="generate-utility-types"
                        className="text-sm"
                      >
                        Generate utility types
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateSingle}
                      disabled={!jsonInput.trim() || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      Generate Interface
                    </Button>
                    <Button
                      onClick={() => {
                        setJsonInput("")
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

              {/* Output Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    TypeScript Interface
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-2">Interface: {currentResult.interfaceName}</div>
                        <div className="text-sm">
                          <div>
                            <strong>Status:</strong> {currentResult.isValid ? "Success" : "Failed"}
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
                          {/* Generated TypeScript */}
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="font-medium text-sm">Generated TypeScript</Label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(currentResult.output, "TypeScript Interface")}
                                >
                                  {copiedText === "TypeScript Interface" ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setShowAnalysis(!showAnalysis)}
                                >
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
                            <Label className="font-medium text-sm mb-3 block">Generation Statistics</Label>
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
                                  <strong>Complexity:</strong> {currentResult.statistics.complexity.depth} levels
                                </div>
                                <div>
                                  <strong>Properties:</strong> {currentResult.statistics.complexity.totalProperties}
                                </div>
                                <div>
                                  <strong>Nested Objects:</strong> {currentResult.statistics.complexity.nestedObjects}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Primitives:</strong> {currentResult.statistics.typeCount.primitives}
                                </div>
                                <div>
                                  <strong>Objects:</strong> {currentResult.statistics.typeCount.objects}
                                </div>
                                <div>
                                  <strong>Arrays:</strong> {currentResult.statistics.typeCount.arrays}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Type Analysis */}
                          {showAnalysis && currentResult.analysis && (
                            <div className="border rounded-lg p-3">
                              <Label className="font-medium text-sm mb-3 block">Type Analysis</Label>
                              <div className="space-y-2 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div>
                                      <strong>Root Type:</strong> {currentResult.analysis.rootType}
                                    </div>
                                    <div>
                                      <strong>Has Nested Objects:</strong>{" "}
                                      {currentResult.analysis.hasNestedObjects ? "Yes" : "No"}
                                    </div>
                                    <div>
                                      <strong>Has Arrays:</strong> {currentResult.analysis.hasArrays ? "Yes" : "No"}
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Has Optional Properties:</strong>{" "}
                                      {currentResult.analysis.hasOptionalProperties ? "Yes" : "No"}
                                    </div>
                                    <div>
                                      <strong>Has Union Types:</strong>{" "}
                                      {currentResult.analysis.hasUnionTypes ? "Yes" : "No"}
                                    </div>
                                    <div>
                                      <strong>Has Complex Types:</strong>{" "}
                                      {currentResult.analysis.hasComplexTypes ? "Yes" : "No"}
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

                                {currentResult.analysis.typeIssues.length > 0 && (
                                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                                    <div className="text-sm text-red-800">
                                      <strong>Type Issues:</strong>
                                      <ul className="list-disc list-inside mt-1">
                                        {currentResult.analysis.typeIssues.map((issue, index) => (
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
                            <span className="font-medium">Generation Error</span>
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
                            Export Interface
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Braces className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Interface Generated</h3>
                      <p className="text-muted-foreground mb-4">
                        Enter JSON content and generate an interface to see results
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
                  Batch TypeScript Generation
                </CardTitle>
                <CardDescription>
                  Generate multiple TypeScript interfaces at once (interfaceName:jsonContent per line)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="batch-input"
                      className="text-sm font-medium"
                    >
                      Interface Definitions (interfaceName:jsonContent per line)
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder='User:{"name": "John", "age": 30}&#10;Product:{"id": 1, "name": "Item", "price": 29.99}&#10;Config:{"theme": "dark", "enabled": true}'
                      className="mt-2 min-h-[120px] font-mono"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">
                      Format: <code>interfaceName:jsonContent</code> (one per line)
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateBatch}
                      disabled={!batchInput.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Generate Batch
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
                            <h4 className="font-medium">{batch.count} interfaces generated</h4>
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
                            <span className="font-medium">Avg Complexity:</span>{" "}
                            {batch.statistics.averageComplexity.toFixed(1)}
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
                                  <span className="font-mono truncate flex-1 mr-2">{result.interfaceName}</span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      result.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {result.isValid ? "Valid" : "Invalid"}
                                  </span>
                                </div>
                                {result.isValid && (
                                  <div className="text-muted-foreground mt-1">
                                    Complexity: {result.statistics.complexity.depth} levels • Properties:{" "}
                                    {result.statistics.complexity.totalProperties} • Time:{" "}
                                    {result.statistics.processingTime.toFixed(2)}ms
                                  </div>
                                )}
                                {result.error && <div className="text-red-600 mt-1">{result.error}</div>}
                              </div>
                            ))}
                            {batch.results.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.results.length - 5} more interfaces
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
          <TabsContent
            value="analyzer"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  TypeScript Type Analyzer
                </CardTitle>
                <CardDescription>Detailed analysis of generated TypeScript types and complexity</CardDescription>
              </CardHeader>
              <CardContent>
                {currentResult && currentResult.isValid ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Type Structure</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Root Type: {currentResult.analysis?.rootType}</div>
                          <div>Complexity: {currentResult.statistics.complexity.depth} levels</div>
                          <div>Total Properties: {currentResult.statistics.complexity.totalProperties}</div>
                          <div>Nested Objects: {currentResult.statistics.complexity.nestedObjects}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Type Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Primitives: {currentResult.statistics.typeCount.primitives}</div>
                          <div>Objects: {currentResult.statistics.typeCount.objects}</div>
                          <div>Arrays: {currentResult.statistics.typeCount.arrays}</div>
                          <div>Unions: {currentResult.statistics.typeCount.unions}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Advanced Features</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Optional Properties: {currentResult.statistics.complexity.optionalProperties}</div>
                          <div>Union Types: {currentResult.statistics.complexity.unionTypes}</div>
                          <div>Literal Types: {currentResult.statistics.typeCount.literals}</div>
                          <div>Any Types: {currentResult.statistics.typeCount.any}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {currentResult.analysis &&
                      (currentResult.analysis.suggestedImprovements.length > 0 ||
                        currentResult.analysis.typeIssues.length > 0) && (
                        <div className="space-y-4">
                          {currentResult.analysis.suggestedImprovements.length > 0 && (
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-blue-700">Suggested Improvements</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="text-sm space-y-1">
                                  {currentResult.analysis.suggestedImprovements.map((suggestion, index) => (
                                    <li
                                      key={index}
                                      className="flex items-center gap-2"
                                    >
                                      <CheckCircle2 className="h-3 w-3 text-blue-600" />
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}

                          {currentResult.analysis.typeIssues.length > 0 && (
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-red-700">Type Issues</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="text-sm space-y-1">
                                  {currentResult.analysis.typeIssues.map((issue, index) => (
                                    <li
                                      key={index}
                                      className="flex items-center gap-2"
                                    >
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
                      Generate a TypeScript interface in the Generator tab to see detailed analysis
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
                  TypeScript Generation Templates
                </CardTitle>
                <CardDescription>Common JSON structures and their TypeScript interface equivalents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {typeScriptTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
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
                            <div className="text-xs font-medium mb-1">JSON Input:</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded max-h-24 overflow-y-auto">
                              {template.jsonExample}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">TypeScript Output:</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded max-h-24 overflow-y-auto">
                              {template.expectedOutput}
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
                Generation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <SelectItem value="ts">TypeScript (.ts)</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="txt">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="indent-size"
                    className="text-sm font-medium"
                  >
                    Indent Size: {settings.indentSize}
                  </Label>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={settings.indentSize}
                      onChange={(e) => setSettings((prev) => ({ ...prev, indentSize: parseInt(e.target.value) }))}
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
const JsonToTs = () => {
  return <JSONToTSCore />
}

export default JsonToTs
