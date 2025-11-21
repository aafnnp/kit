import React, { useCallback, useState, useMemo, useEffect } from "react"
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
  RotateCcw,
  Settings,
  FileText,
  BookOpen,
  Eye,
  Clock,
  Code,
  Grid,
  BarChart3,
  TreePine,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  JSONVisualization,
  ChartConfig,
  VisualizationMetadata,
  JSONTemplate,
  JSONValidation,
  TreeNode,
  ChartData,
  VisualizationType,
  ExportFormat,
  ViewMode,
} from "@/types/json-plot"
import { formatFileSize } from "@/lib/utils"
// Utility functions

// JSON analysis and visualization functions
const analyzeJSON = (data: any): VisualizationMetadata => {
  const startTime = performance.now()
  const rawJSON = JSON.stringify(data)

  const metadata: VisualizationMetadata = {
    dataSize: rawJSON.length,
    dataDepth: calculateDepth(data),
    dataKeys: countKeys(data),
    dataTypes: countDataTypes(data),
    arrayCount: countArrays(data),
    objectCount: countObjects(data),
    primitiveCount: countPrimitives(data),
    processingTime: 0,
    memoryUsage: rawJSON.length * 2, // Rough estimation
  }

  const endTime = performance.now()
  metadata.processingTime = endTime - startTime

  return metadata
}

const calculateDepth = (obj: any, currentDepth = 0): number => {
  if (obj === null || typeof obj !== "object") return currentDepth

  if (Array.isArray(obj)) {
    return Math.max(currentDepth, ...obj.map((item) => calculateDepth(item, currentDepth + 1)))
  }

  const depths = Object.values(obj).map((value) => calculateDepth(value, currentDepth + 1))
  return depths.length > 0 ? Math.max(currentDepth, ...depths) : currentDepth
}

const countKeys = (obj: any): number => {
  if (obj === null || typeof obj !== "object") return 0

  if (Array.isArray(obj)) {
    return obj.reduce((count, item) => count + countKeys(item), 0)
  }

  return Object.keys(obj).length + Object.values(obj).reduce((count: number, value: any) => count + countKeys(value), 0)
}

const countDataTypes = (obj: any): Record<string, number> => {
  const types: Record<string, number> = {
    string: 0,
    number: 0,
    boolean: 0,
    null: 0,
    undefined: 0,
    object: 0,
    array: 0,
  }

  const countType = (value: any) => {
    if (value === null) {
      types.null++
    } else if (value === undefined) {
      types.undefined++
    } else if (Array.isArray(value)) {
      types.array++
      value.forEach(countType)
    } else if (typeof value === "object") {
      types.object++
      Object.values(value).forEach(countType)
    } else {
      types[typeof value]++
    }
  }

  countType(obj)
  return types
}

const countArrays = (obj: any): number => {
  if (obj === null || typeof obj !== "object") return 0

  let count = 0
  if (Array.isArray(obj)) {
    count = 1
    obj.forEach((item) => (count += countArrays(item)))
  } else {
    Object.values(obj).forEach((value) => (count += countArrays(value)))
  }

  return count
}

const countObjects = (obj: any): number => {
  if (obj === null || typeof obj !== "object") return 0

  let count = Array.isArray(obj) ? 0 : 1

  if (Array.isArray(obj)) {
    obj.forEach((item) => (count += countObjects(item)))
  } else {
    Object.values(obj).forEach((value) => (count += countObjects(value)))
  }

  return count
}

const countPrimitives = (obj: any): number => {
  if (obj === null || typeof obj !== "object") return 1

  let count = 0
  if (Array.isArray(obj)) {
    obj.forEach((item) => (count += countPrimitives(item)))
  } else {
    Object.values(obj).forEach((value) => (count += countPrimitives(value)))
  }

  return count
}

// Tree visualization functions
const buildTreeNodes = (data: any, path = "", level = 0, parent?: TreeNode): TreeNode[] => {
  if (data === null || typeof data !== "object") {
    return []
  }

  const nodes: TreeNode[] = []

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const key = `[${index}]`
      const currentPath = path ? `${path}${key}` : key
      const hasChildren = item !== null && typeof item === "object"

      const node: TreeNode = {
        id: nanoid(),
        key,
        value: item,
        type: getValueType(item),
        path: currentPath,
        level,
        isExpanded: level < 2, // Auto-expand first 2 levels
        hasChildren,
        children: [],
        parent,
      }

      if (hasChildren) {
        node.children = buildTreeNodes(item, currentPath + ".", level + 1, node)
      }

      nodes.push(node)
    })
  } else {
    Object.entries(data).forEach(([key, value]) => {
      const currentPath = path ? `${path}${key}` : key
      const hasChildren = value !== null && typeof value === "object"

      const node: TreeNode = {
        id: nanoid(),
        key,
        value,
        type: getValueType(value),
        path: currentPath,
        level,
        isExpanded: level < 2, // Auto-expand first 2 levels
        hasChildren,
        children: [],
        parent,
      }

      if (hasChildren) {
        node.children = buildTreeNodes(value, currentPath + ".", level + 1, node)
      }

      nodes.push(node)
    })
  }

  return nodes
}

const getValueType = (value: any): string => {
  if (value === null) return "null"
  if (value === undefined) return "undefined"
  if (Array.isArray(value)) return "array"
  return typeof value
}

// Chart data extraction functions
const extractChartData = (data: any): ChartData | null => {
  try {
    if (Array.isArray(data)) {
      return extractFromArray(data)
    } else if (typeof data === "object" && data !== null) {
      return extractFromObject(data)
    }
    return null
  } catch (error) {
    console.error("Error extracting chart data:", error)
    return null
  }
}

const extractFromArray = (data: any[]): ChartData => {
  // Handle array of objects (most common case)
  if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
    const keys = Object.keys(data[0])
    const numericKeys = keys.filter((key) => data.every((item) => typeof item[key] === "number"))
    const stringKeys = keys.filter((key) => data.every((item) => typeof item[key] === "string"))

    if (numericKeys.length > 0 && stringKeys.length > 0) {
      const labelKey = stringKeys[0]
      const valueKey = numericKeys[0]

      return {
        labels: data.map((item) => String(item[labelKey])),
        datasets: [
          {
            label: valueKey,
            data: data.map((item) => Number(item[valueKey])),
            backgroundColor: generateColors(data.length),
            borderColor: generateColors(data.length, 0.8),
            borderWidth: 2,
          },
        ],
        metadata: {
          totalPoints: data.length,
          dataRange: getDataRange(data.map((item) => Number(item[valueKey]))),
          categories: [...new Set(data.map((item) => String(item[labelKey])))],
        },
      }
    }
  }

  // Handle array of numbers
  if (data.every((item) => typeof item === "number")) {
    return {
      labels: data.map((_, index) => `Item ${index + 1}`),
      datasets: [
        {
          label: "Values",
          data: data,
          backgroundColor: generateColors(data.length),
          borderColor: generateColors(data.length, 0.8),
          borderWidth: 2,
        },
      ],
      metadata: {
        totalPoints: data.length,
        dataRange: getDataRange(data),
        categories: data.map((_, index) => `Item ${index + 1}`),
      },
    }
  }

  // Handle array of strings (frequency count)
  if (data.every((item) => typeof item === "string")) {
    const frequency = data.reduce(
      (acc, item) => {
        acc[item] = (acc[item] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const labels = Object.keys(frequency)
    const values = Object.values(frequency)

    return {
      labels,
      datasets: [
        {
          label: "Frequency",
          data: values,
          backgroundColor: generateColors(labels.length),
          borderColor: generateColors(labels.length, 0.8),
          borderWidth: 2,
        },
      ],
      metadata: {
        totalPoints: labels.length,
        dataRange: getDataRange(values),
        categories: labels,
      },
    }
  }

  throw new Error("Unable to extract chart data from array")
}

const extractFromObject = (data: Record<string, any>): ChartData => {
  const entries = Object.entries(data)

  // Handle object with numeric values
  const numericEntries = entries.filter(([_, value]) => typeof value === "number")
  if (numericEntries.length > 0) {
    const labels = numericEntries.map(([key]) => key)
    const values = numericEntries.map(([_, value]) => value)

    return {
      labels,
      datasets: [
        {
          label: "Values",
          data: values,
          backgroundColor: generateColors(labels.length),
          borderColor: generateColors(labels.length, 0.8),
          borderWidth: 2,
        },
      ],
      metadata: {
        totalPoints: labels.length,
        dataRange: getDataRange(values),
        categories: labels,
      },
    }
  }

  throw new Error("Unable to extract chart data from object")
}

const generateColors = (count: number, alpha = 0.6): string[] => {
  const colors = [
    `rgba(255, 99, 132, ${alpha})`,
    `rgba(54, 162, 235, ${alpha})`,
    `rgba(255, 205, 86, ${alpha})`,
    `rgba(75, 192, 192, ${alpha})`,
    `rgba(153, 102, 255, ${alpha})`,
    `rgba(255, 159, 64, ${alpha})`,
    `rgba(199, 199, 199, ${alpha})`,
    `rgba(83, 102, 255, ${alpha})`,
    `rgba(255, 99, 255, ${alpha})`,
    `rgba(99, 255, 132, ${alpha})`,
  ]

  const result = []
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length])
  }
  return result
}

const getDataRange = (data: number[]): [number, number] => {
  if (data.length === 0) return [0, 0]
  return [Math.min(...data), Math.max(...data)]
}

// Validation functions
const validateJSONInput = (input: string): JSONValidation => {
  const validation: JSONValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 100,
  }

  if (!input || input.trim().length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: "JSON input cannot be empty",
      type: "syntax",
      severity: "error",
    })
    validation.qualityScore = 0
    return validation
  }

  try {
    const parsed = JSON.parse(input)

    // Check for potential visualization issues
    const size = input.length
    if (size > 1000000) {
      // 1MB
      validation.warnings.push("Large JSON file may impact visualization performance")
      validation.suggestions.push("Consider breaking down large JSON files for better visualization")
      validation.qualityScore -= 10
    }

    const depth = calculateDepth(parsed)
    if (depth > 15) {
      validation.warnings.push("Very deep JSON structure detected")
      validation.suggestions.push("Deep nesting may make tree visualization difficult to read")
      validation.qualityScore -= 15
    }

    const keys = countKeys(parsed)
    if (keys > 1000) {
      validation.warnings.push("High number of keys detected")
      validation.suggestions.push("Large number of keys may impact visualization performance")
      validation.qualityScore -= 10
    }

    // Check for chart visualization potential
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0] === "object" && parsed[0] !== null) {
        const firstKeys = Object.keys(parsed[0])
        const hasNumericData = firstKeys.some((key) => parsed.every((item) => typeof item[key] === "number"))
        if (hasNumericData) {
          validation.suggestions.push("This data appears suitable for chart visualization")
        }
      }
    }
  } catch (error) {
    validation.isValid = false
    validation.errors.push({
      message: error instanceof Error ? error.message : "Invalid JSON syntax",
      type: "syntax",
      severity: "error",
    })
    validation.qualityScore -= 50
  }

  // Quality suggestions
  if (validation.qualityScore >= 90) {
    validation.suggestions.push("Excellent JSON structure for visualization")
  } else if (validation.qualityScore >= 70) {
    validation.suggestions.push("Good JSON structure with minor visualization considerations")
  } else if (validation.qualityScore >= 50) {
    validation.suggestions.push("JSON structure may need optimization for better visualization")
  } else {
    validation.suggestions.push("JSON structure has significant issues for visualization")
  }

  return validation
}

// JSON Templates
const jsonTemplates: JSONTemplate[] = [
  {
    id: "sales-data",
    name: "Sales Data",
    description: "Monthly sales data with multiple metrics",
    category: "Business",
    data: {
      sales: [
        { month: "Jan", revenue: 45000, units: 120, profit: 12000 },
        { month: "Feb", revenue: 52000, units: 140, profit: 15000 },
        { month: "Mar", revenue: 48000, units: 130, profit: 13500 },
        { month: "Apr", revenue: 61000, units: 165, profit: 18000 },
        { month: "May", revenue: 55000, units: 150, profit: 16000 },
        { month: "Jun", revenue: 67000, units: 180, profit: 20000 },
      ],
      summary: {
        totalRevenue: 328000,
        totalUnits: 885,
        totalProfit: 94500,
        averageMonthly: 54667,
      },
    },
    visualizationType: "chart",
    chartConfig: {
      title: "Monthly Sales Performance",
      xAxisKey: "month",
      yAxisKey: "revenue",
      showLegend: true,
      showGrid: true,
    },
    useCase: ["Business analytics", "Sales reporting", "Performance tracking"],
  },
  {
    id: "user-analytics",
    name: "User Analytics",
    description: "Website user analytics and demographics",
    category: "Analytics",
    data: {
      users: {
        total: 15420,
        active: 12350,
        new: 2890,
        returning: 9460,
      },
      demographics: [
        { age: "18-24", count: 3200, percentage: 20.8 },
        { age: "25-34", count: 4850, percentage: 31.4 },
        { age: "35-44", count: 3920, percentage: 25.4 },
        { age: "45-54", count: 2180, percentage: 14.1 },
        { age: "55+", count: 1270, percentage: 8.2 },
      ],
      traffic: {
        organic: 8500,
        direct: 3200,
        social: 2100,
        referral: 1620,
      },
    },
    visualizationType: "chart",
    chartConfig: {
      title: "User Demographics",
      labelKey: "age",
      valueKey: "count",
      showLegend: true,
    },
    useCase: ["Web analytics", "User research", "Marketing insights"],
  },
  {
    id: "product-catalog",
    name: "Product Catalog",
    description: "E-commerce product catalog with categories",
    category: "E-commerce",
    data: {
      categories: [
        {
          id: 1,
          name: "Electronics",
          products: [
            { id: 101, name: "Smartphone", price: 699, stock: 45, rating: 4.5 },
            { id: 102, name: "Laptop", price: 1299, stock: 23, rating: 4.7 },
            { id: 103, name: "Headphones", price: 199, stock: 67, rating: 4.3 },
          ],
        },
        {
          id: 2,
          name: "Clothing",
          products: [
            { id: 201, name: "T-Shirt", price: 29, stock: 120, rating: 4.2 },
            { id: 202, name: "Jeans", price: 79, stock: 85, rating: 4.4 },
            { id: 203, name: "Sneakers", price: 129, stock: 56, rating: 4.6 },
          ],
        },
      ],
      metadata: {
        totalProducts: 6,
        totalCategories: 2,
        averagePrice: 409,
        totalStock: 396,
      },
    },
    visualizationType: "tree",
    chartConfig: {
      title: "Product Catalog Structure",
      showLegend: false,
      responsive: true,
    },
    useCase: ["Product management", "Inventory tracking", "Catalog organization"],
  },
  {
    id: "api-response",
    name: "API Response",
    description: "Typical REST API response structure",
    category: "Development",
    data: {
      status: "success",
      code: 200,
      message: "Data retrieved successfully",
      data: {
        users: [
          { id: 1, name: "John Doe", email: "john@example.com", active: true },
          { id: 2, name: "Jane Smith", email: "jane@example.com", active: false },
          { id: 3, name: "Bob Johnson", email: "bob@example.com", active: true },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          hasNext: false,
          hasPrev: false,
        },
      },
      meta: {
        timestamp: "2023-12-01T10:30:00Z",
        version: "1.0",
        requestId: "req_123456789",
      },
    },
    visualizationType: "tree",
    chartConfig: {
      title: "API Response Structure",
      responsive: true,
      showGrid: false,
    },
    useCase: ["API development", "Response validation", "Documentation"],
  },
  {
    id: "survey-results",
    name: "Survey Results",
    description: "Customer satisfaction survey results",
    category: "Research",
    data: [
      { question: "Overall Satisfaction", score: 4.2, responses: 150 },
      { question: "Product Quality", score: 4.5, responses: 148 },
      { question: "Customer Service", score: 3.8, responses: 145 },
      { question: "Value for Money", score: 4.0, responses: 152 },
      { question: "Recommendation Likelihood", score: 4.3, responses: 149 },
    ],
    visualizationType: "chart",
    chartConfig: {
      title: "Customer Satisfaction Survey",
      xAxisKey: "question",
      yAxisKey: "score",
      showLegend: false,
      showGrid: true,
    },
    useCase: ["Survey analysis", "Customer feedback", "Quality assessment"],
  },
]

// Default chart configuration
const createDefaultChartConfig = (): ChartConfig => ({
  title: "JSON Visualization",
  width: 800,
  height: 400,
  theme: "auto",
  colors: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#F97316", "#06B6D4", "#84CC16"],
  showLegend: true,
  showGrid: true,
  showTooltip: true,
  animation: true,
  responsive: true,
})

// Custom hooks
const useJSONVisualization = () => {
  const [visualizations, setVisualizations] = useState<JSONVisualization[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const createVisualization = useCallback(
    async (
      rawJSON: string,
      visualizationType: VisualizationType,
      chartConfig?: Partial<ChartConfig>
    ): Promise<JSONVisualization> => {
      setIsProcessing(true)
      try {
        const data = JSON.parse(rawJSON)
        const metadata = analyzeJSON(data)
        const fullChartConfig = { ...createDefaultChartConfig(), ...chartConfig }

        const visualization: JSONVisualization = {
          id: nanoid(),
          name: `Visualization ${new Date().toLocaleTimeString()}`,
          data,
          rawJSON,
          visualizationType,
          chartConfig: fullChartConfig,
          metadata,
          timestamp: new Date(),
        }

        setVisualizations((prev) => [visualization, ...prev.slice(0, 99)]) // Keep last 100 visualizations
        return visualization
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const clearVisualizations = useCallback(() => {
    setVisualizations([])
  }, [])

  const removeVisualization = useCallback((id: string) => {
    setVisualizations((prev) => prev.filter((viz) => viz.id !== id))
  }, [])

  return {
    visualizations,
    isProcessing,
    createVisualization,
    clearVisualizations,
    removeVisualization,
  }
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

// Export functionality
const useJSONPlotExport = () => {
  const exportVisualization = useCallback(
    (visualization: JSONVisualization, format: ExportFormat, filename?: string) => {
      let content = ""
      let mimeType = "text/plain"
      let extension = ".txt"

      switch (format) {
        case "json":
          content = JSON.stringify(visualization.data, null, 2)
          mimeType = "application/json"
          extension = ".json"
          break
        case "csv":
          content = generateCSVFromVisualization(visualization)
          mimeType = "text/csv"
          extension = ".csv"
          break
        case "txt":
          content = generateTextFromVisualization(visualization)
          mimeType = "text/plain"
          extension = ".txt"
          break
        case "xml":
          content = generateXMLFromVisualization(visualization)
          mimeType = "application/xml"
          extension = ".xml"
          break
        case "yaml":
          content = generateYAMLFromVisualization(visualization)
          mimeType = "text/yaml"
          extension = ".yaml"
          break
        default:
          content = JSON.stringify(visualization.data, null, 2)
          break
      }

      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename || `json-visualization-${visualization.id}${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    []
  )

  return { exportVisualization }
}

// Helper functions for export formats
const generateCSVFromVisualization = (visualization: JSONVisualization): string => {
  try {
    if (Array.isArray(visualization.data)) {
      if (visualization.data.length > 0 && typeof visualization.data[0] === "object") {
        const headers = Object.keys(visualization.data[0])
        const rows = visualization.data.map((item) => headers.map((header) => JSON.stringify(item[header] || "")))
        return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
      }
    }

    // Fallback for non-tabular data
    return `Key,Value\n${Object.entries(visualization.data)
      .map(([key, value]) => `"${key}","${JSON.stringify(value)}"`)
      .join("\n")}`
  } catch (error) {
    return "Error generating CSV format"
  }
}

const generateTextFromVisualization = (visualization: JSONVisualization): string => {
  return `JSON Visualization Report - ${visualization.timestamp.toLocaleString()}

=== METADATA ===
Name: ${visualization.name}
Type: ${visualization.visualizationType}
Data Size: ${formatFileSize(visualization.metadata.dataSize)}
Data Depth: ${visualization.metadata.dataDepth}
Total Keys: ${visualization.metadata.dataKeys}
Processing Time: ${visualization.metadata.processingTime.toFixed(2)}ms

=== DATA TYPES ===
${Object.entries(visualization.metadata.dataTypes)
  .filter(([_, count]) => count > 0)
  .map(([type, count]) => `${type}: ${count}`)
  .join("\n")}

=== JSON DATA ===
${JSON.stringify(visualization.data, null, 2)}`
}

const generateXMLFromVisualization = (visualization: JSONVisualization): string => {
  const jsonToXml = (obj: any, indent = 0): string => {
    const spaces = "  ".repeat(indent)

    if (Array.isArray(obj)) {
      return obj
        .map((item, index) => `${spaces}<item index="${index}">\n${jsonToXml(item, indent + 1)}\n${spaces}</item>`)
        .join("\n")
    } else if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj)
        .map(([key, value]) => {
          const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_")
          if (typeof value === "object") {
            return `${spaces}<${safeKey}>\n${jsonToXml(value, indent + 1)}\n${spaces}</${safeKey}>`
          } else {
            return `${spaces}<${safeKey}>${String(value)}</${safeKey}>`
          }
        })
        .join("\n")
    } else {
      return `${spaces}${String(obj)}`
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<jsonVisualization id="${visualization.id}" timestamp="${visualization.timestamp.toISOString()}">
  <metadata>
    <name>${visualization.name}</name>
    <type>${visualization.visualizationType}</type>
    <dataSize>${visualization.metadata.dataSize}</dataSize>
    <dataDepth>${visualization.metadata.dataDepth}</dataDepth>
    <dataKeys>${visualization.metadata.dataKeys}</dataKeys>
  </metadata>
  <data>
${jsonToXml(visualization.data, 2)}
  </data>
</jsonVisualization>`
}

const generateYAMLFromVisualization = (visualization: JSONVisualization): string => {
  const jsonToYaml = (obj: any, indent = 0): string => {
    const spaces = "  ".repeat(indent)

    if (Array.isArray(obj)) {
      return obj
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            return `${spaces}- ${jsonToYaml(item, indent + 1).trim()}`
          } else {
            return `${spaces}- ${JSON.stringify(item)}`
          }
        })
        .join("\n")
    } else if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj)
        .map(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            return `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`
          } else {
            return `${spaces}${key}: ${JSON.stringify(value)}`
          }
        })
        .join("\n")
    } else {
      return String(obj)
    }
  }

  return `id: ${visualization.id}
timestamp: ${visualization.timestamp.toISOString()}
metadata:
  name: ${visualization.name}
  type: ${visualization.visualizationType}
  dataSize: ${visualization.metadata.dataSize}
  dataDepth: ${visualization.metadata.dataDepth}
  dataKeys: ${visualization.metadata.dataKeys}
data:
${jsonToYaml(visualization.data, 1)}`
}

/**
 * Enhanced JSON Plot & Visualization Tool
 * Features: Advanced JSON visualization, multiple chart types, interactive plotting, and data analysis
 */
const JSONPlotCore = () => {
  const [activeTab, setActiveTab] = useState<"visualize" | "history" | "templates" | "settings">("visualize")
  const [jsonInput, setJsonInput] = useState("")
  const [currentVisualization, setCurrentVisualization] = useState<JSONVisualization | null>(null)
  const [visualizationType, setVisualizationType] = useState<VisualizationType>("tree")
  const [chartConfig, setChartConfig] = useState<ChartConfig>(createDefaultChartConfig())
  const [viewMode, setViewMode] = useState<ViewMode>("expanded")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([])

  const { visualizations, isProcessing, createVisualization, clearVisualizations, removeVisualization } =
    useJSONVisualization()
  const { exportVisualization } = useJSONPlotExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = jsonTemplates.find((t) => t.id === templateId)
    if (template) {
      setJsonInput(JSON.stringify(template.data, null, 2))
      setVisualizationType(template.visualizationType)
      setChartConfig((prev) => ({ ...prev, ...template.chartConfig }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Create visualization
  const handleVisualize = useCallback(async () => {
    if (!jsonInput.trim()) {
      toast.error("Please enter JSON data")
      return
    }

    const validation = validateJSONInput(jsonInput)
    if (!validation.isValid) {
      toast.error(`JSON error: ${validation.errors[0]?.message}`)
      return
    }

    try {
      const visualization = await createVisualization(jsonInput, visualizationType, chartConfig)
      setCurrentVisualization(visualization)

      // Build tree nodes for tree visualization
      if (visualizationType === "tree") {
        const nodes = buildTreeNodes(visualization.data)
        setTreeNodes(nodes)
      }

      toast.success("JSON visualization created successfully")
    } catch (error) {
      toast.error("Failed to create visualization")
      console.error(error)
    }
  }, [jsonInput, visualizationType, chartConfig, createVisualization])

  // Auto-visualize when inputs change (debounced)
  useEffect(() => {
    if (jsonInput.trim()) {
      const timer = setTimeout(() => {
        handleVisualize()
      }, 1000)

      return () => clearTimeout(timer)
    } else {
      setCurrentVisualization(null)
      setTreeNodes([])
    }
  }, [jsonInput, visualizationType, handleVisualize])

  // Toggle tree node expansion
  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setTreeNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, isExpanded: !node.isExpanded } : node)))
  }, [])

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
              <BarChart3 className="h-5 w-5" />
              JSON Plot & Visualization Tool
            </CardTitle>
            <CardDescription>
              Advanced JSON visualization and analysis tool with multiple chart types, interactive plotting, and
              comprehensive data analysis. Transform JSON data into beautiful visualizations with tree views, charts,
              and detailed analytics. Use keyboard navigation: Tab to move between controls, Enter or Space to activate
              buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "visualize" | "history" | "templates" | "settings")}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="visualize"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Visualize
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* JSON Visualization Tab */}
          <TabsContent
            value="visualize"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* JSON Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    JSON Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="json-input"
                      className="text-sm font-medium"
                    >
                      JSON Data
                    </Label>
                    <Textarea
                      id="json-input"
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder="Enter your JSON data here..."
                      className="mt-2 font-mono text-xs"
                      rows={12}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="visualization-type"
                        className="text-sm font-medium"
                      >
                        Visualization Type
                      </Label>
                      <Select
                        value={visualizationType}
                        onValueChange={(value) => setVisualizationType(value as VisualizationType)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tree">Tree View</SelectItem>
                          <SelectItem value="table">Table View</SelectItem>
                          <SelectItem value="chart">Chart View</SelectItem>
                          <SelectItem value="raw">Raw JSON</SelectItem>
                          <SelectItem value="formatted">Formatted JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label
                        htmlFor="view-mode"
                        className="text-sm font-medium"
                      >
                        View Mode
                      </Label>
                      <Select
                        value={viewMode}
                        onValueChange={(value) => setViewMode(value as ViewMode)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="expanded">Expanded</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleVisualize}
                      disabled={isProcessing || !jsonInput.trim()}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <BarChart3 className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? "Processing..." : "Visualize JSON"}
                    </Button>
                    <Button
                      onClick={() => {
                        setJsonInput("")
                        setCurrentVisualization(null)
                        setTreeNodes([])
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {/* Quick Templates */}
                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-sm font-medium">Quick Templates</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {jsonTemplates.slice(0, 4).map((template) => (
                        <Button
                          key={template.id}
                          onClick={() => applyTemplate(template.id)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visualization Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentVisualization ? (
                    <div className="space-y-4">
                      {/* Metadata */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {formatFileSize(currentVisualization.metadata.dataSize)}
                          </div>
                          <div className="text-xs text-muted-foreground">Data Size</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {currentVisualization.metadata.dataDepth}
                          </div>
                          <div className="text-xs text-muted-foreground">Depth</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {currentVisualization.metadata.dataKeys}
                          </div>
                          <div className="text-xs text-muted-foreground">Keys</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {currentVisualization.metadata.processingTime.toFixed(1)}ms
                          </div>
                          <div className="text-xs text-muted-foreground">Processing</div>
                        </div>
                      </div>

                      {/* Data Types */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Data Types</Label>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          {Object.entries(currentVisualization.metadata.dataTypes)
                            .filter(([_, count]) => count > 0)
                            .map(([type, count]) => (
                              <div
                                key={type}
                                className="text-center p-2 bg-muted rounded"
                              >
                                <div className="font-medium">{count}</div>
                                <div className="text-muted-foreground capitalize">{type}</div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Export Options */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => exportVisualization(currentVisualization, "json")}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                        <Button
                          onClick={() => exportVisualization(currentVisualization, "csv")}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button
                          onClick={() =>
                            copyToClipboard(JSON.stringify(currentVisualization.data, null, 2), "JSON Data")
                          }
                          variant="outline"
                          size="sm"
                        >
                          {copiedText === "JSON Data" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Visualization</h3>
                      <p className="text-muted-foreground">Enter JSON data to see the visualization</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Visualization */}
            {currentVisualization && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {visualizationType === "tree" && <TreePine className="h-5 w-5" />}
                    {visualizationType === "table" && <Grid className="h-5 w-5" />}
                    {visualizationType === "chart" && <BarChart3 className="h-5 w-5" />}
                    {visualizationType === "raw" && <Code className="h-5 w-5" />}
                    {visualizationType === "formatted" && <FileText className="h-5 w-5" />}
                    {visualizationType.charAt(0).toUpperCase() + visualizationType.slice(1)} View
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-auto">
                    {visualizationType === "tree" && (
                      <TreeVisualization
                        nodes={treeNodes}
                        onToggleExpansion={toggleNodeExpansion}
                        viewMode={viewMode}
                      />
                    )}
                    {visualizationType === "table" && (
                      <TableVisualization
                        data={currentVisualization.data}
                        viewMode={viewMode}
                      />
                    )}
                    {visualizationType === "chart" && (
                      <ChartVisualization
                        data={currentVisualization.data}
                        config={chartConfig}
                      />
                    )}
                    {visualizationType === "raw" && (
                      <RawVisualization
                        data={currentVisualization.rawJSON}
                        viewMode={viewMode}
                      />
                    )}
                    {visualizationType === "formatted" && (
                      <FormattedVisualization
                        data={currentVisualization.data}
                        viewMode={viewMode}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent
            value="history"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visualization History</CardTitle>
                <CardDescription>View and manage your JSON visualization history</CardDescription>
              </CardHeader>
              <CardContent>
                {visualizations.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {visualizations.length} visualization{visualizations.length !== 1 ? "s" : ""} in history
                      </span>
                      <Button
                        onClick={clearVisualizations}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear History
                      </Button>
                    </div>

                    {visualizations.map((visualization) => (
                      <div
                        key={visualization.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">
                            {visualization.name} - {visualization.timestamp.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-muted rounded">
                              {visualization.visualizationType}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeVisualization(visualization.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-4 text-xs text-center">
                            <div>
                              <div className="font-medium">{formatFileSize(visualization.metadata.dataSize)}</div>
                              <div className="text-muted-foreground">Size</div>
                            </div>
                            <div>
                              <div className="font-medium">{visualization.metadata.dataDepth}</div>
                              <div className="text-muted-foreground">Depth</div>
                            </div>
                            <div>
                              <div className="font-medium">{visualization.metadata.dataKeys}</div>
                              <div className="text-muted-foreground">Keys</div>
                            </div>
                            <div>
                              <div className="font-medium">{visualization.metadata.processingTime.toFixed(1)}ms</div>
                              <div className="text-muted-foreground">Processing</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setJsonInput(visualization.rawJSON)
                              setVisualizationType(visualization.visualizationType)
                              setCurrentVisualization(visualization)
                              setActiveTab("visualize")
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportVisualization(visualization, "json")}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(visualization.rawJSON, "JSON Data")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History</h3>
                    <p className="text-muted-foreground">Create some JSON visualizations to see them here</p>
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
                <CardTitle className="text-lg">Visualization Templates</CardTitle>
                <CardDescription>Pre-built JSON examples for different visualization types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jsonTemplates.map((template) => (
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
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                              {template.visualizationType}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div>
                          <div className="text-xs font-medium mb-1">Use Cases:</div>
                          <div className="text-xs text-muted-foreground">{template.useCase.join(", ")}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent
            value="settings"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visualization Settings</CardTitle>
                <CardDescription>Configure how JSON visualization is displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Chart Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Chart Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="chart-title"
                        className="text-sm"
                      >
                        Chart Title
                      </Label>
                      <Input
                        id="chart-title"
                        value={chartConfig.title}
                        onChange={(e) => setChartConfig((prev) => ({ ...prev, title: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="chart-theme"
                        className="text-sm"
                      >
                        Theme
                      </Label>
                      <Select
                        value={chartConfig.theme}
                        onValueChange={(value) =>
                          setChartConfig((prev) => ({ ...prev, theme: value as "light" | "dark" | "auto" }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="chart-width"
                        className="text-sm"
                      >
                        Width (px)
                      </Label>
                      <Input
                        id="chart-width"
                        type="number"
                        min="200"
                        max="2000"
                        value={chartConfig.width}
                        onChange={(e) =>
                          setChartConfig((prev) => ({ ...prev, width: parseInt(e.target.value) || 800 }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="chart-height"
                        className="text-sm"
                      >
                        Height (px)
                      </Label>
                      <Input
                        id="chart-height"
                        type="number"
                        min="200"
                        max="1000"
                        value={chartConfig.height}
                        onChange={(e) =>
                          setChartConfig((prev) => ({ ...prev, height: parseInt(e.target.value) || 400 }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Display Options */}
                <div className="space-y-4">
                  <h4 className="font-medium">Display Options</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        id="show-legend"
                        type="checkbox"
                        checked={chartConfig.showLegend}
                        onChange={(e) => setChartConfig((prev) => ({ ...prev, showLegend: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="show-legend"
                        className="text-sm"
                      >
                        Show legend
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="show-grid"
                        type="checkbox"
                        checked={chartConfig.showGrid}
                        onChange={(e) => setChartConfig((prev) => ({ ...prev, showGrid: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="show-grid"
                        className="text-sm"
                      >
                        Show grid
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="show-tooltip"
                        type="checkbox"
                        checked={chartConfig.showTooltip}
                        onChange={(e) => setChartConfig((prev) => ({ ...prev, showTooltip: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="show-tooltip"
                        className="text-sm"
                      >
                        Show tooltip
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="enable-animation"
                        type="checkbox"
                        checked={chartConfig.animation}
                        onChange={(e) => setChartConfig((prev) => ({ ...prev, animation: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="enable-animation"
                        className="text-sm"
                      >
                        Enable animation
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Reset Settings */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => setChartConfig(createDefaultChartConfig())}
                    variant="outline"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Visualization Components
const TreeVisualization: React.FC<{
  nodes: TreeNode[]
  onToggleExpansion: (nodeId: string) => void
  viewMode: ViewMode
}> = ({ nodes, onToggleExpansion, viewMode }) => {
  const renderNode = (node: TreeNode): React.ReactNode => {
    const indent = node.level * 20
    const isCompact = viewMode === "compact" || viewMode === "minimal"

    return (
      <div
        key={node.id}
        style={{ marginLeft: `${indent}px` }}
        className="mb-1"
      >
        <div className="flex items-center gap-2">
          {node.hasChildren && (
            <button
              onClick={() => onToggleExpansion(node.id)}
              className="w-4 h-4 flex items-center justify-center text-xs border rounded hover:bg-muted"
            >
              {node.isExpanded ? "−" : "+"}
            </button>
          )}
          <span
            className={`font-mono text-sm ${
              node.type === "string"
                ? "text-green-600"
                : node.type === "number"
                  ? "text-blue-600"
                  : node.type === "boolean"
                    ? "text-purple-600"
                    : node.type === "null"
                      ? "text-gray-500"
                      : "text-orange-600"
            }`}
          >
            {node.key}:
          </span>
          {!node.hasChildren && (
            <span className="text-sm">{node.type === "string" ? `"${node.value}"` : String(node.value)}</span>
          )}
          {!isCompact && <span className="text-xs text-muted-foreground">({node.type})</span>}
        </div>
        {node.hasChildren && node.isExpanded && <div className="ml-4">{node.children.map(renderNode)}</div>}
      </div>
    )
  }

  return <div className="font-mono text-sm">{nodes.map(renderNode)}</div>
}

const TableVisualization: React.FC<{
  data: any
  viewMode: ViewMode
}> = ({ data, viewMode }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Data is not suitable for table visualization</div>
  }

  const firstItem = data[0]
  if (typeof firstItem !== "object" || firstItem === null) {
    return (
      <div className="text-center py-8 text-muted-foreground">Array items must be objects for table visualization</div>
    )
  }

  const headers = Object.keys(firstItem)
  const isCompact = viewMode === "compact" || viewMode === "minimal"

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-muted">
            {headers.map((header) => (
              <th
                key={header}
                className="border border-gray-300 px-2 py-1 text-left text-sm font-medium"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, isCompact ? 10 : 100).map((item, index) => (
            <tr
              key={index}
              className="hover:bg-muted/50"
            >
              {headers.map((header) => (
                <td
                  key={header}
                  className="border border-gray-300 px-2 py-1 text-sm"
                >
                  {typeof item[header] === "object" ? JSON.stringify(item[header]) : String(item[header] || "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > (isCompact ? 10 : 100) && (
        <div className="text-center py-2 text-sm text-muted-foreground">
          Showing {isCompact ? 10 : 100} of {data.length} rows
        </div>
      )}
    </div>
  )
}

const ChartVisualization: React.FC<{
  data: any
  config: ChartConfig
}> = ({ data, config }) => {
  const chartData = useMemo(() => extractChartData(data), [data])

  if (!chartData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="mx-auto h-12 w-12 mb-4" />
        <p>Data is not suitable for chart visualization</p>
        <p className="text-xs mt-2">Try using array of objects with numeric values or object with numeric properties</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-medium">{config.title}</h3>
        <p className="text-sm text-muted-foreground">{chartData.metadata.totalPoints} data points</p>
      </div>

      {/* Simple bar chart representation */}
      <div className="space-y-2">
        {chartData.labels.map((label, index) => {
          const value = chartData.datasets[0]?.data[index] || 0
          const maxValue = Math.max(...(chartData.datasets[0]?.data || [1]))
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

          return (
            <div
              key={index}
              className="flex items-center gap-2 text-sm"
            >
              <div className="w-20 text-right truncate">{label}:</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">{value}</span>
              </div>
            </div>
          )
        })}
      </div>

      {config.showLegend && (
        <div className="text-xs text-muted-foreground text-center">
          Range: {chartData.metadata.dataRange[0]} - {chartData.metadata.dataRange[1]}
        </div>
      )}
    </div>
  )
}

const RawVisualization: React.FC<{
  data: string
  viewMode: ViewMode
}> = ({ data, viewMode }) => {
  const isCompact = viewMode === "compact" || viewMode === "minimal"
  const displayData = isCompact ? data.slice(0, 1000) + (data.length > 1000 ? "..." : "") : data

  return <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-4 rounded overflow-auto">{displayData}</pre>
}

const FormattedVisualization: React.FC<{
  data: any
  viewMode: ViewMode
}> = ({ data, viewMode }) => {
  const formattedData = JSON.stringify(data, null, 2)
  const isCompact = viewMode === "compact" || viewMode === "minimal"
  const displayData = isCompact
    ? formattedData.slice(0, 2000) + (formattedData.length > 2000 ? "..." : "")
    : formattedData

  return <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-4 rounded overflow-auto">{displayData}</pre>
}

// Main component with error boundary
const JsonPlot = () => {
  return <JSONPlotCore />
}

export default JsonPlot
