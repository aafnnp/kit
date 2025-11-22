import React, { useCallback, useRef, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import {
  Download,
  FileText,
  Loader2,
  RefreshCw,
  ArrowUpDown,
  Code,
  Upload,
  FileImage,
  Trash2,
  Settings,
  Target,
  Copy,
  Check,
  BarChart3,
  SortAsc,
  SortDesc,
  Database,
  Grid,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  DataFile,
  TableData,
  SortConfig,
  SortSettings,
  TableStatistics,
  SortPreset,
  DataType,
  SortDirection,
  DataFormat,
} from "@/schemas/table-sorter.schema"
import { formatFileSize } from "@/lib/utils"
// Types

// Utility functions

const validateDataFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = [".csv", ".tsv", ".txt", ".json", ".xlsx", ".xls"]

  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 50MB" }
  }

  const extension = "." + file.name.split(".").pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: "Only CSV, TSV, TXT, JSON, and Excel files are supported" }
  }

  return { isValid: true }
}

// Data type detection
const detectDataType = (values: (string | number)[]): DataType => {
  if (values.length === 0) return "string"

  const nonEmptyValues = values.filter((v) => v !== "" && v != null)
  if (nonEmptyValues.length === 0) return "string"

  let numberCount = 0
  let dateCount = 0
  let booleanCount = 0

  for (const value of nonEmptyValues) {
    const strValue = String(value).trim().toLowerCase()

    // Check boolean
    if (strValue === "true" || strValue === "false" || strValue === "1" || strValue === "0") {
      booleanCount++
      continue
    }

    // Check number
    if (!isNaN(Number(strValue)) && strValue !== "") {
      numberCount++
      continue
    }

    // Check date
    const dateValue = new Date(strValue)
    if (!isNaN(dateValue.getTime()) && strValue.length > 4) {
      dateCount++
      continue
    }
  }

  const total = nonEmptyValues.length
  const threshold = 0.8 // 80% threshold for type detection

  if (numberCount / total >= threshold) return "number"
  if (dateCount / total >= threshold) return "date"
  if (booleanCount / total >= threshold) return "boolean"
  if ((numberCount + dateCount + booleanCount) / total < 0.5) return "string"

  return "mixed"
}

// Data parsing functions
const parseCSV = (content: string, delimiter: string = ","): TableData => {
  const lines = content.trim().split(/\r?\n/)
  if (lines.length === 0) {
    throw new Error("Empty file")
  }

  const rows = lines.map((line) => {
    // Simple CSV parsing - in production, use a proper CSV parser
    const cells = line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ""))
    return cells
  })

  const headers = rows[0]
  const dataRows = rows.slice(1)

  // Convert data types
  const processedRows: (string | number)[][] = dataRows.map((row) =>
    row.map((cell) => {
      const trimmed = cell.trim()
      if (trimmed === "") return ""

      // Try to convert to number
      const num = Number(trimmed)
      if (!isNaN(num) && trimmed !== "") {
        return num
      }

      return trimmed
    })
  )

  // Detect data types for each column
  const dataTypes: DataType[] = headers.map((_, index) => {
    const columnValues = processedRows.map((row) => row[index])
    return detectDataType(columnValues)
  })

  return {
    headers,
    rows: processedRows,
    metadata: {
      rowCount: processedRows.length,
      columnCount: headers.length,
      dataTypes,
      hasHeaders: true,
    },
  }
}

const parseJSON = (content: string): TableData => {
  try {
    const data = JSON.parse(content)

    if (!Array.isArray(data)) {
      throw new Error("JSON must be an array of objects")
    }

    if (data.length === 0) {
      throw new Error("Empty JSON array")
    }

    // Extract headers from first object
    const headers = Object.keys(data[0])

    // Convert objects to rows
    const rows: (string | number)[][] = data.map((obj) =>
      headers.map((header) => {
        const value = obj[header]
        if (value == null) return ""
        if (typeof value === "number") return value
        return String(value)
      })
    )

    // Detect data types
    const dataTypes: DataType[] = headers.map((_, index) => {
      const columnValues = rows.map((row) => row[index])
      return detectDataType(columnValues)
    })

    return {
      headers,
      rows,
      metadata: {
        rowCount: rows.length,
        columnCount: headers.length,
        dataTypes,
        hasHeaders: true,
      },
    }
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Auto-detect format and parse
const parseData = (content: string, format: DataFormat = "auto"): TableData => {
  if (format === "auto") {
    // Try to detect format
    const trimmed = content.trim()

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      return parseJSON(content)
    }

    // Check for tab-separated values
    if (trimmed.includes("\t")) {
      return parseCSV(content, "\t")
    }

    // Default to CSV
    return parseCSV(content, ",")
  }

  switch (format) {
    case "csv":
      return parseCSV(content, ",")
    case "tsv":
      return parseCSV(content, "\t")
    case "json":
      return parseJSON(content)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

// Sorting algorithms
const compareValues = (
  a: string | number,
  b: string | number,
  dataType: DataType,
  caseSensitive: boolean = true
): number => {
  // Handle null/empty values
  if (a === "" || a == null) return b === "" || b == null ? 0 : -1
  if (b === "" || b == null) return 1

  switch (dataType) {
    case "number":
      const numA = typeof a === "number" ? a : parseFloat(String(a))
      const numB = typeof b === "number" ? b : parseFloat(String(b))
      if (isNaN(numA)) return isNaN(numB) ? 0 : -1
      if (isNaN(numB)) return 1
      return numA - numB

    case "date":
      const dateA = new Date(String(a))
      const dateB = new Date(String(b))
      if (isNaN(dateA.getTime())) return isNaN(dateB.getTime()) ? 0 : -1
      if (isNaN(dateB.getTime())) return 1
      return dateA.getTime() - dateB.getTime()

    case "boolean":
      const boolA = String(a).toLowerCase() === "true" || String(a) === "1"
      const boolB = String(b).toLowerCase() === "true" || String(b) === "1"
      return boolA === boolB ? 0 : boolA ? 1 : -1

    case "string":
    case "mixed":
    default:
      const strA = String(a)
      const strB = String(b)
      if (caseSensitive) {
        return strA.localeCompare(strB)
      } else {
        return strA.toLowerCase().localeCompare(strB.toLowerCase())
      }
  }
}

const sortTableData = (data: TableData, settings: SortSettings): TableData => {
  if (settings.sortConfigs.length === 0) {
    return data
  }

  const sortedRows = [...data.rows].sort((rowA, rowB) => {
    for (const config of settings.sortConfigs) {
      const { column, direction, dataType } = config

      if (column >= rowA.length || column >= rowB.length) continue

      const valueA = rowA[column]
      const valueB = rowB[column]

      let comparison = compareValues(valueA, valueB, dataType, settings.caseSensitive)

      if (direction === "desc") {
        comparison = -comparison
      }

      if (comparison !== 0) {
        return comparison
      }
    }

    return 0
  })

  return {
    ...data,
    rows: sortedRows,
  }
}

// Sort presets
const sortPresets: SortPreset[] = [
  {
    id: "alphabetical",
    name: "Alphabetical (A-Z)",
    description: "Sort by first column alphabetically",
    settings: {
      multiColumn: false,
      sortConfigs: [{ column: 0, direction: "asc", dataType: "string" }],
      caseSensitive: false,
    },
    example: "Names, products, categories",
  },
  {
    id: "numerical",
    name: "Numerical (Low to High)",
    description: "Sort by first column numerically",
    settings: {
      multiColumn: false,
      sortConfigs: [{ column: 0, direction: "asc", dataType: "number" }],
      caseSensitive: true,
    },
    example: "Prices, quantities, scores",
  },
  {
    id: "date",
    name: "Date (Oldest First)",
    description: "Sort by first column as dates",
    settings: {
      multiColumn: false,
      sortConfigs: [{ column: 0, direction: "asc", dataType: "date" }],
      caseSensitive: true,
    },
    example: "Created dates, deadlines, timestamps",
  },
  {
    id: "multi-column",
    name: "Multi-Column Sort",
    description: "Sort by multiple columns with priority",
    settings: {
      multiColumn: true,
      sortConfigs: [
        { column: 0, direction: "asc", dataType: "string" },
        { column: 1, direction: "asc", dataType: "number" },
      ],
      caseSensitive: false,
    },
    example: "Category then price, name then date",
  },
  {
    id: "reverse",
    name: "Reverse Order",
    description: "Reverse the current order",
    settings: {
      multiColumn: false,
      sortConfigs: [{ column: 0, direction: "desc", dataType: "string" }],
      caseSensitive: false,
    },
    example: "Z-A, newest first, highest to lowest",
  },
]

// Custom hooks
const useTableProcessing = () => {
  const processTable = useCallback((content: string, format: DataFormat = "auto"): TableData => {
    try {
      return parseData(content, format)
    } catch (error) {
      console.error("Table processing error:", error)
      throw new Error(error instanceof Error ? error.message : "Table processing failed")
    }
  }, [])

  const sortTable = useCallback((data: TableData, settings: SortSettings): TableData => {
    try {
      return sortTableData(data, settings)
    } catch (error) {
      console.error("Table sorting error:", error)
      throw new Error(error instanceof Error ? error.message : "Table sorting failed")
    }
  }, [])

  const processBatch = useCallback(
    async (files: DataFile[], settings: SortSettings): Promise<DataFile[]> => {
      return Promise.all(
        files.map(async (file) => {
          if (file.status !== "pending") return file

          try {
            const parsedData = processTable(file.content)
            const sortedData = sortTable(parsedData, settings)

            return {
              ...file,
              status: "completed" as const,
              parsedData,
              sortedData,
              processedAt: new Date(),
            }
          } catch (error) {
            return {
              ...file,
              status: "error" as const,
              error: error instanceof Error ? error.message : "Processing failed",
            }
          }
        })
      )
    },
    [processTable, sortTable]
  )

  return { processTable, sortTable, processBatch }
}

// Real-time table preview hook
const useRealTimeTablePreview = (content: string, settings: SortSettings, format: DataFormat = "auto") => {
  return useMemo(() => {
    if (!content.trim()) {
      return {
        originalData: null,
        sortedData: null,
        statistics: {
          rowCount: 0,
          columnCount: 0,
          dataTypes: [],
          processingTime: 0,
        },
        error: null,
      }
    }

    try {
      const startTime = performance.now()
      const originalData = parseData(content, format)
      const sortedData = sortTableData(originalData, settings)
      const processingTime = performance.now() - startTime

      return {
        originalData,
        sortedData,
        statistics: {
          rowCount: originalData.metadata.rowCount,
          columnCount: originalData.metadata.columnCount,
          dataTypes: originalData.metadata.dataTypes,
          processingTime,
        },
        error: null,
      }
    } catch (error) {
      return {
        originalData: null,
        sortedData: null,
        statistics: {
          rowCount: 0,
          columnCount: 0,
          dataTypes: [],
          processingTime: 0,
        },
        error: error instanceof Error ? error.message : "Processing failed",
      }
    }
  }, [content, settings, format])
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<DataFile> => {
    const validation = validateDataFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const dataFile: DataFile = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type || "text/plain",
            status: "pending",
          }

          resolve(dataFile)
        } catch (error) {
          reject(new Error("Failed to process file"))
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<DataFile[]> => {
      const results = await Promise.allSettled(files.map((file) => processFile(file)))

      return results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value
        } else {
          return {
            id: nanoid(),
            name: files[index].name,
            content: "",
            size: files[index].size,
            type: files[index].type || "text/plain",
            status: "error" as const,
            error: result.reason.message || "Processing failed",
          }
        }
      })
    },
    [processFile]
  )

  return { processFile, processBatch }
}

// Export functionality
const useTableExport = () => {
  const exportCSV = useCallback((data: TableData, filename?: string) => {
    const csvContent = [
      data.headers.join(","),
      ...data.rows.map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell)
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
              return `"${cellStr.replace(/"/g, '""')}"`
            }
            return cellStr
          })
          .join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || "sorted-table.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportJSON = useCallback((data: TableData, filename?: string) => {
    const jsonData = data.rows.map((row) => {
      const obj: Record<string, string | number> = {}
      data.headers.forEach((header, index) => {
        obj[header] = row[index] || ""
      })
      return obj
    })

    const jsonContent = JSON.stringify(jsonData, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || "sorted-table.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportTSV = useCallback((data: TableData, filename?: string) => {
    const tsvContent = [
      data.headers.join("\t"),
      ...data.rows.map((row) => row.map((cell) => String(cell)).join("\t")),
    ].join("\n")

    const blob = new Blob([tsvContent], { type: "text/tab-separated-values;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || "sorted-table.tsv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: DataFile[]) => {
      const completedFiles = files.filter((f) => f.sortedData)

      if (completedFiles.length === 0) {
        toast.error("No sorted tables to export")
        return
      }

      completedFiles.forEach((file) => {
        if (file.sortedData) {
          const baseName = file.name.replace(/\.[^/.]+$/, "")
          exportCSV(file.sortedData, `${baseName}-sorted.csv`)
        }
      })

      toast.success(`Exported ${completedFiles.length} sorted table(s)`)
    },
    [exportCSV]
  )

  const exportStatistics = useCallback((files: DataFile[]) => {
    const stats = files
      .filter((f) => f.sortedData)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.size),
        rows: file.sortedData!.metadata.rowCount,
        columns: file.sortedData!.metadata.columnCount,
        dataTypes: file.sortedData!.metadata.dataTypes.join(", "),
        status: file.status,
      }))

    const csvContent = [
      ["Filename", "Original Size", "Rows", "Columns", "Data Types", "Status"],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.rows.toString(),
        stat.columns.toString(),
        stat.dataTypes,
        stat.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "table-sorting-statistics.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Statistics exported")
  }, [])

  return { exportCSV, exportJSON, exportTSV, exportBatch, exportStatistics }
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

  const copyTableAsCSV = useCallback(
    async (data: TableData, label?: string) => {
      const csvContent = [
        data.headers.join(","),
        ...data.rows.map((row) => row.map((cell) => String(cell)).join(",")),
      ].join("\n")

      await copyToClipboard(csvContent, label || "table data")
    },
    [copyToClipboard]
  )

  return { copyToClipboard, copyTableAsCSV, copiedText }
}

// File drag and drop functionality
const useDragAndDrop = (onFilesDropped: (files: File[]) => void) => {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.name.match(/\.(csv|tsv|txt|json|xlsx|xls)$/i)
      )

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error("Please drop only CSV, TSV, TXT, JSON, or Excel files")
      }
    },
    [onFilesDropped]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        onFilesDropped(files)
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [onFilesDropped]
  )

  return {
    dragActive,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileInput,
  }
}

/**
 * Enhanced Table Sorter Tool
 * Features: Real-time sorting, file upload, batch processing, multiple data formats
 */
const TableSorterCore = () => {
  const [activeTab, setActiveTab] = useState<"sorter" | "files">("sorter")
  const [inputData, setInputData] = useState(
    "Name,Age,City,Score\nAlice,25,New York,95\nBob,30,Los Angeles,87\nCharlie,22,Chicago,92\nDiana,28,Houston,89\nEve,35,Phoenix,94"
  )
  const [files, setFiles] = useState<DataFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>("alphabetical")
  const [dataFormat, setDataFormat] = useState<DataFormat>("auto")
  const [settings, setSortSettings] = useState<SortSettings>({
    multiColumn: false,
    sortConfigs: [{ column: 0, direction: "asc", dataType: "string" }],
    caseSensitive: false,
    nullsFirst: false,
  })

  const { processBatch } = useTableProcessing()
  const { exportCSV, exportJSON, exportTSV, exportBatch, exportStatistics } = useTableExport()
  const { copyToClipboard, copyTableAsCSV, copiedText } = useCopyToClipboard()

  // Real-time table preview
  const tablePreview = useRealTimeTablePreview(inputData, settings, dataFormat)

  // File drag and drop
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    useCallback(async (droppedFiles: File[]) => {
      setIsProcessing(true)
      try {
        const { processBatch } = useFileProcessing()
        const processedFiles = await processBatch(droppedFiles)
        setFiles((prev) => [...processedFiles, ...prev])
        toast.success(`Added ${processedFiles.length} file(s)`)
      } catch (error) {
        toast.error("Failed to process files")
      } finally {
        setIsProcessing(false)
      }
    }, [])
  )

  // Apply preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = sortPresets.find((p) => p.id === presetId)
    if (preset) {
      setSortSettings((prev) => ({
        ...prev,
        ...preset.settings,
      }))
      setSelectedPreset(presetId)
      toast.success(`Applied preset: ${preset.name}`)
    }
  }, [])

  // Add sort column
  const addSortColumn = useCallback(() => {
    if (!tablePreview.originalData) return

    setSortSettings((prev) => ({
      ...prev,
      multiColumn: true,
      sortConfigs: [
        ...prev.sortConfigs,
        {
          column: 0,
          direction: "asc",
          dataType: tablePreview.originalData!.metadata.dataTypes[0] || "string",
        },
      ],
    }))
  }, [tablePreview.originalData])

  // Remove sort column
  const removeSortColumn = useCallback((index: number) => {
    setSortSettings((prev) => ({
      ...prev,
      sortConfigs: prev.sortConfigs.filter((_, i) => i !== index),
    }))
  }, [])

  // Update sort column
  const updateSortColumn = useCallback((index: number, updates: Partial<SortConfig>) => {
    setSortSettings((prev) => ({
      ...prev,
      sortConfigs: prev.sortConfigs.map((config, i) => (i === index ? { ...config, ...updates } : config)),
    }))
  }, [])

  // Process all files
  const processFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === "pending")
    if (pendingFiles.length === 0) {
      toast.error("No files to process")
      return
    }

    setIsProcessing(true)
    try {
      const updatedFiles = await processBatch(pendingFiles, settings)
      setFiles((prev) =>
        prev.map((file) => {
          const updated = updatedFiles.find((u) => u.id === file.id)
          return updated || file
        })
      )
      toast.success("Files processed successfully!")
    } catch (error) {
      toast.error("Failed to process files")
    } finally {
      setIsProcessing(false)
    }
  }, [files, settings, processBatch])

  // Clear all files
  const clearAll = useCallback(() => {
    setFiles([])
    toast.success("All files cleared")
  }, [])

  // Remove specific file
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }, [])

  // Statistics calculation for all files
  const totalStats = useMemo((): TableStatistics | null => {
    if (files.length === 0) return null

    const completedFiles = files.filter((f) => f.sortedData)
    const failedFiles = files.filter((f) => f.status === "error")

    const dataTypeDistribution: Record<DataType, number> = {
      string: 0,
      number: 0,
      date: 0,
      boolean: 0,
      mixed: 0,
    }

    completedFiles.forEach((file) => {
      if (file.sortedData) {
        file.sortedData.metadata.dataTypes.forEach((type) => {
          dataTypeDistribution[type]++
        })
      }
    })

    return {
      totalFiles: files.length,
      totalRows: completedFiles.reduce((sum, f) => sum + (f.sortedData?.metadata.rowCount || 0), 0),
      totalColumns: completedFiles.reduce((sum, f) => sum + (f.sortedData?.metadata.columnCount || 0), 0),
      averageProcessingTime: 0, // Would need to track processing times
      successfulSorts: completedFiles.length,
      failedSorts: failedFiles.length,
      dataTypeDistribution,
    }
  }, [files])

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
              <ArrowUpDown className="h-5 w-5" />
              Table Sorter
            </CardTitle>
            <CardDescription>
              Sort and organize tabular data with advanced multi-column sorting, data type detection, and batch
              processing. Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "sorter" | "files")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="sorter"
              className="flex items-center gap-2"
            >
              <Grid className="h-4 w-4" />
              Table Sorter
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Table Sorter Tab */}
          <TabsContent
            value="sorter"
            className="space-y-4"
          >
            {/* Sort Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Sort Presets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortPresets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant={selectedPreset === preset.id ? "default" : "outline"}
                      onClick={() => applyPreset(preset.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{preset.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{preset.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">{preset.example}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="data-format">Data Format</Label>
                    <Select
                      value={dataFormat}
                      onValueChange={(value: DataFormat) => setDataFormat(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="tsv">TSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="input-data">Enter your data</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(inputData, "input data")}
                      disabled={!inputData}
                    >
                      {copiedText === "input data" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Textarea
                    id="input-data"
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    placeholder="Enter CSV, TSV, or JSON data..."
                    className="min-h-[150px] font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sort Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Sort Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Global Settings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      id="multiColumn"
                      type="checkbox"
                      checked={settings.multiColumn}
                      onChange={(e) => setSortSettings((prev) => ({ ...prev, multiColumn: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="multiColumn"
                      className="text-sm"
                    >
                      Multi-column Sort
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="caseSensitive"
                      type="checkbox"
                      checked={settings.caseSensitive}
                      onChange={(e) => setSortSettings((prev) => ({ ...prev, caseSensitive: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="caseSensitive"
                      className="text-sm"
                    >
                      Case Sensitive
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="nullsFirst"
                      type="checkbox"
                      checked={settings.nullsFirst}
                      onChange={(e) => setSortSettings((prev) => ({ ...prev, nullsFirst: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="nullsFirst"
                      className="text-sm"
                    >
                      Nulls First
                    </Label>
                  </div>
                </div>

                {/* Sort Columns */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Sort Columns</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addSortColumn}
                      disabled={
                        !tablePreview.originalData ||
                        settings.sortConfigs.length >= (tablePreview.originalData?.headers.length || 0)
                      }
                    >
                      Add Column
                    </Button>
                  </div>

                  {settings.sortConfigs.map((config, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Column</Label>
                          <Select
                            value={config.column.toString()}
                            onValueChange={(value) => updateSortColumn(index, { column: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {tablePreview.originalData?.headers.map((header, i) => (
                                <SelectItem
                                  key={i}
                                  value={i.toString()}
                                >
                                  {header} ({i})
                                </SelectItem>
                              )) || []}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Direction</Label>
                          <Select
                            value={config.direction}
                            onValueChange={(value: SortDirection) => updateSortColumn(index, { direction: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">
                                <div className="flex items-center gap-2">
                                  <SortAsc className="h-4 w-4" />
                                  Ascending
                                </div>
                              </SelectItem>
                              <SelectItem value="desc">
                                <div className="flex items-center gap-2">
                                  <SortDesc className="h-4 w-4" />
                                  Descending
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Data Type</Label>
                          <Select
                            value={config.dataType}
                            onValueChange={(value: DataType) => updateSortColumn(index, { dataType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">String</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Priority</Label>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{index + 1}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeSortColumn(index)}
                              disabled={settings.sortConfigs.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Table Statistics */}
            {tablePreview.originalData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Table Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                      <div className="text-lg font-bold text-blue-600">{tablePreview.statistics.rowCount}</div>
                      <div className="text-xs text-muted-foreground">Rows</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded">
                      <div className="text-lg font-bold text-green-600">{tablePreview.statistics.columnCount}</div>
                      <div className="text-xs text-muted-foreground">Columns</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded">
                      <div className="text-lg font-bold text-purple-600">
                        {tablePreview.statistics.processingTime.toFixed(2)}ms
                      </div>
                      <div className="text-xs text-muted-foreground">Processing Time</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded">
                      <div className="text-lg font-bold text-orange-600">{settings.sortConfigs.length}</div>
                      <div className="text-xs text-muted-foreground">Sort Columns</div>
                    </div>
                  </div>

                  {/* Data Types */}
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Data Types by Column</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tablePreview.originalData.headers.map((header, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm"
                        >
                          <span className="font-medium">{header}:</span>
                          <span className="text-muted-foreground capitalize">
                            {tablePreview.originalData!.metadata.dataTypes[index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {tablePreview.error && (
              <Card>
                <CardContent className="pt-6">
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">Data Processing Error</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">{tablePreview.error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Table Display */}
            {tablePreview.sortedData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Sorted Table
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyTableAsCSV(tablePreview.sortedData!, "sorted table")}
                      >
                        {copiedText === "sorted table" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {tablePreview.sortedData.headers.map((header, index) => (
                            <TableHead
                              key={index}
                              className="font-semibold"
                            >
                              <div className="flex items-center gap-2">
                                {header}
                                {settings.sortConfigs.find((c) => c.column === index) && (
                                  <div className="flex items-center gap-1">
                                    {settings.sortConfigs.find((c) => c.column === index)?.direction === "asc" ? (
                                      <ChevronUp className="h-3 w-3 text-blue-600" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3 text-blue-600" />
                                    )}
                                    <span className="text-xs text-blue-600 font-medium">
                                      {settings.sortConfigs.findIndex((c) => c.column === index) + 1}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tablePreview.sortedData.rows.slice(0, 100).map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <TableCell
                                key={cellIndex}
                                className="font-mono text-sm"
                              >
                                {String(cell)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                        {tablePreview.sortedData.rows.length > 100 && (
                          <TableRow>
                            <TableCell
                              colSpan={tablePreview.sortedData.headers.length}
                              className="text-center text-muted-foreground py-4"
                            >
                              ... and {tablePreview.sortedData.rows.length - 100} more rows
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Actions */}
            {tablePreview.sortedData && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={() => exportCSV(tablePreview.sortedData!)}
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>

                    <Button
                      onClick={() => exportJSON(tablePreview.sortedData!)}
                      variant="outline"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>

                    <Button
                      onClick={() => exportTSV(tablePreview.sortedData!)}
                      variant="outline"
                    >
                      <Code className="mr-2 h-4 w-4" />
                      Export TSV
                    </Button>

                    <Button
                      onClick={() => copyTableAsCSV(tablePreview.sortedData!, "table data")}
                      variant="outline"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Batch Processing Tab */}
          <TabsContent
            value="files"
            className="space-y-4"
          >
            {/* File Upload */}
            <Card>
              <CardContent className="pt-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Data Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your data files here, or click to select files
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mb-2"
                  >
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports CSV, TSV, TXT, JSON, and Excel files • Max 50MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".csv,.tsv,.txt,.json,.xlsx,.xls"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Batch Statistics */}
            {totalStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalStats.totalFiles}</div>
                      <div className="text-sm text-muted-foreground">Total Files</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{totalStats.successfulSorts}</div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{totalStats.failedSorts}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalStats.totalRows}</div>
                      <div className="text-sm text-muted-foreground">Total Rows</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{totalStats.totalColumns}</div>
                      <div className="text-sm text-muted-foreground">Total Columns</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Object.values(totalStats.dataTypeDistribution).reduce((a, b) => a + b, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Data Types</div>
                    </div>
                  </div>

                  {/* Data Type Distribution */}
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Data Type Distribution</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                      {Object.entries(totalStats.dataTypeDistribution).map(([type, count]) => (
                        <div
                          key={type}
                          className="text-center p-2 bg-muted/30 rounded"
                        >
                          <div className="text-lg font-bold">{count}</div>
                          <div className="text-xs text-muted-foreground capitalize">{type}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {files.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={processFiles}
                      disabled={isProcessing || files.every((f) => f.status !== "pending")}
                      className="min-w-32"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sort Files
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => exportBatch(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.sortedData)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download All
                    </Button>

                    <Button
                      onClick={() => exportStatistics(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.sortedData)}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Export Statistics
                    </Button>

                    <Button
                      onClick={clearAll}
                      variant="destructive"
                      disabled={isProcessing}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File List */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Files ({files.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="shrink-0">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-medium truncate"
                              title={file.name}
                            >
                              {file.name}
                            </h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>
                                <span className="font-medium">Size:</span> {formatFileSize(file.size)} •
                                <span className="font-medium"> Type:</span> {file.type}
                              </div>

                              {file.status === "completed" && file.sortedData && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium mb-1">Table Sorted:</div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div>{file.sortedData.metadata.rowCount} rows</div>
                                    <div>{file.sortedData.metadata.columnCount} columns</div>
                                    <div>{file.sortedData.metadata.dataTypes.join(", ")}</div>
                                    <div>{settings.sortConfigs.length} sort columns</div>
                                  </div>
                                </div>
                              )}

                              {file.status === "pending" && <div className="text-blue-600">Ready for sorting</div>}
                              {file.status === "processing" && (
                                <div className="text-blue-600 flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Processing...
                                </div>
                              )}
                              {file.error && <div className="text-red-600">Error: {file.error}</div>}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {file.status === "completed" && file.sortedData && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    exportCSV(file.sortedData!, file.name.replace(/\.[^/.]+$/, "-sorted.csv"))
                                  }
                                >
                                  <Download className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyTableAsCSV(file.sortedData!, file.id)}
                                >
                                  {copiedText === file.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(file.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const TableSorter = () => {
  return <TableSorterCore />
}

export default TableSorter
