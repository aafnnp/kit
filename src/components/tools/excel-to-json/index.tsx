import React, { useCallback, useState, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Download,
  Upload,
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
  ArrowRight,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Braces,
  Layers,
  BarChart3,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  ExcelProcessingResult,
  SheetData,
  ProcessingStatistics,
  DataTypeDistribution,
  ExcelAnalysis,
  SheetAnalysis,
  ProcessingBatch,
  BatchStatistics,
  ProcessingSettings,
  ExcelTemplate,
  FileValidation,
  ExportFormat,
  SheetSelection,
} from "@/components/tools/excel-to-json/schema"
import { formatFileSize } from "@/lib/utils"

// Dynamic import for xlsx to reduce initial bundle size
let xlsxModule: typeof import("xlsx") | null = null
const loadXLSX = async (): Promise<typeof import("xlsx")> => {
  if (!xlsxModule) {
    xlsxModule = await import("xlsx")
  }
  return xlsxModule
}
// Utility functions

const detectDataType = (value: any): string => {
  if (value === null || value === undefined || value === "") return "empty"
  if (typeof value === "boolean") return "boolean"
  if (typeof value === "number") return "number"
  if (value instanceof Date) return "date"
  if (typeof value === "string") {
    // Check if it's a date string
    if (!isNaN(Date.parse(value)) && value.match(/^\d{4}-\d{2}-\d{2}/)) return "date"
    // Check if it's a number string
    if (!isNaN(Number(value)) && value.trim() !== "") return "number"
    // Check if it's a formula
    if (value.startsWith("=")) return "formula"
    // Check if it's an error
    if (value.startsWith("#")) return "error"
    return "string"
  }
  return "unknown"
}

// Excel processing functions
const processExcelFile = async (file: File, settings: ProcessingSettings): Promise<ExcelProcessingResult> => {
  const startTime = performance.now()

  try {
    const XLSX = await loadXLSX()
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
      cellFormula: settings.preserveFormulas,
      cellDates: true,
      cellNF: false,
      cellStyles: false,
    })

    const sheets: SheetData[] = []
    let totalRows = 0
    let totalColumns = 0
    let totalCells = 0

    // Process sheets based on selection
    const sheetsToProcess = await getSelectedSheets(workbook, settings.sheetSelection)

    for (const sheetName of sheetsToProcess) {
      const worksheet = workbook.Sheets[sheetName]
      if (!worksheet) continue

      // Convert sheet to JSON with options
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: settings.headerRow > 1 ? settings.headerRow - 1 : 1,
        defval: settings.includeEmptyRows ? null : undefined,
        blankrows: settings.includeEmptyRows,
        raw: false,
        dateNF: settings.dateFormat,
      })

      // Analyze sheet structure
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1")
      const rowCount = range.e.r - range.s.r + 1
      const columnCount = range.e.c - range.s.c + 1

      // Extract headers
      const headers = await extractHeaders(worksheet, settings.headerRow)

      // Analyze data types
      const dataTypes = analyzeDataTypes(jsonData)

      const sheetData: SheetData = {
        name: sheetName,
        data: jsonData,
        headers,
        rowCount: jsonData.length,
        columnCount: headers.length,
        isEmpty: jsonData.length === 0,
        hasHeaders: headers.length > 0,
        dataTypes,
      }

      sheets.push(sheetData)
      totalRows += rowCount
      totalColumns += columnCount
      totalCells += rowCount * columnCount
    }

    const endTime = performance.now()
    const processingTime = endTime - startTime

    // Calculate statistics
    const statistics: ProcessingStatistics = {
      fileSize: file.size,
      totalSheets: sheets.length,
      totalRows,
      totalColumns,
      totalCells,
      emptySheets: sheets.filter((sheet) => sheet.isEmpty).length,
      processingTime,
      memoryUsage: estimateMemoryUsage(sheets),
      compressionRatio: calculateCompressionRatio(file.size, sheets),
    }

    // Perform analysis
    const analysis = analyzeExcelData(sheets)

    return {
      id: nanoid(),
      fileName: file.name,
      fileSize: file.size,
      sheets,
      isValid: true,
      statistics,
      analysis,
      createdAt: new Date(),
    }
  } catch (error) {
    const endTime = performance.now()
    const processingTime = endTime - startTime

    return {
      id: nanoid(),
      fileName: file.name,
      fileSize: file.size,
      sheets: [],
      isValid: false,
      error: error instanceof Error ? error.message : "Processing failed",
      statistics: {
        fileSize: file.size,
        totalSheets: 0,
        totalRows: 0,
        totalColumns: 0,
        totalCells: 0,
        emptySheets: 0,
        processingTime,
        memoryUsage: 0,
        compressionRatio: 0,
      },
      createdAt: new Date(),
    }
  }
}

const getSelectedSheets = async (workbook: any, selection: SheetSelection): Promise<string[]> => {
  const XLSX = await loadXLSX()
  const allSheets = workbook.SheetNames

  switch (selection) {
    case "first":
      return allSheets.slice(0, 1)
    case "non-empty":
      return allSheets.filter((name: string) => {
        const sheet = workbook.Sheets[name]
        const jsonData = XLSX.utils.sheet_to_json(sheet)
        return jsonData.length > 0
      })
    case "all":
    default:
      return allSheets
  }
}

const extractHeaders = async (worksheet: any, headerRow: number): Promise<string[]> => {
  const XLSX = await loadXLSX()
  const headers: string[] = []
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1")

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow - 1, c: col })
    const cell = worksheet[cellAddress]
    const value = cell ? XLSX.utils.format_cell(cell) : `Column_${col + 1}`
    headers.push(value)
  }

  return headers
}

const analyzeDataTypes = (data: any[]): DataTypeDistribution => {
  const distribution: DataTypeDistribution = {
    strings: 0,
    numbers: 0,
    dates: 0,
    booleans: 0,
    formulas: 0,
    errors: 0,
    empty: 0,
  }

  data.forEach((row) => {
    Object.values(row).forEach((value) => {
      const type = detectDataType(value)
      switch (type) {
        case "string":
          distribution.strings++
          break
        case "number":
          distribution.numbers++
          break
        case "date":
          distribution.dates++
          break
        case "boolean":
          distribution.booleans++
          break
        case "formula":
          distribution.formulas++
          break
        case "error":
          distribution.errors++
          break
        case "empty":
          distribution.empty++
          break
      }
    })
  })

  return distribution
}

const estimateMemoryUsage = (sheets: SheetData[]): number => {
  // Rough estimation of memory usage in bytes
  let totalSize = 0

  sheets.forEach((sheet) => {
    const jsonString = JSON.stringify(sheet.data)
    totalSize += new Blob([jsonString]).size
  })

  return totalSize
}

const calculateCompressionRatio = (originalSize: number, sheets: SheetData[]): number => {
  const jsonSize = estimateMemoryUsage(sheets)
  return originalSize > 0 ? jsonSize / originalSize : 0
}

// Analysis functions
const analyzeExcelData = (sheets: SheetData[]): ExcelAnalysis => {
  const analysis: ExcelAnalysis = {
    hasMultipleSheets: sheets.length > 1,
    hasFormulas: false,
    hasErrors: false,
    hasEmptySheets: sheets.some((sheet) => sheet.isEmpty),
    hasInconsistentHeaders: false,
    suggestedImprovements: [],
    dataIssues: [],
    qualityScore: 100,
    sheetAnalysis: [],
  }

  // Analyze each sheet
  sheets.forEach((sheet) => {
    const sheetAnalysis: SheetAnalysis = {
      sheetName: sheet.name,
      dataQuality: 100,
      headerConsistency: true,
      hasEmptyRows: false,
      hasEmptyColumns: false,
      dataTypeConsistency: true,
      recommendations: [],
    }

    // Check for formulas and errors
    if (sheet.dataTypes.formulas > 0) {
      analysis.hasFormulas = true
      sheetAnalysis.recommendations.push("Consider evaluating formulas before export")
    }

    if (sheet.dataTypes.errors > 0) {
      analysis.hasErrors = true
      analysis.dataIssues.push(`Sheet "${sheet.name}" contains ${sheet.dataTypes.errors} error cells`)
      sheetAnalysis.dataQuality -= 20
    }

    // Check for empty data
    const emptyRatio = sheet.dataTypes.empty / (sheet.rowCount * sheet.columnCount)
    if (emptyRatio > 0.5) {
      sheetAnalysis.hasEmptyRows = true
      sheetAnalysis.recommendations.push("Consider removing empty rows and columns")
      sheetAnalysis.dataQuality -= 10
    }

    // Check data type consistency
    const totalValues = Object.values(sheet.dataTypes).reduce((sum, count) => sum + count, 0)
    const stringRatio = sheet.dataTypes.strings / totalValues
    if (stringRatio > 0.8) {
      sheetAnalysis.dataTypeConsistency = false
      sheetAnalysis.recommendations.push("Most data appears to be text - check for proper data types")
    }

    analysis.sheetAnalysis.push(sheetAnalysis)
  })

  // Generate overall suggestions
  if (analysis.hasEmptySheets) {
    analysis.suggestedImprovements.push("Remove empty sheets to reduce file size")
  }

  if (analysis.hasMultipleSheets) {
    analysis.suggestedImprovements.push("Consider processing sheets individually for better organization")
  }

  if (analysis.hasFormulas) {
    analysis.suggestedImprovements.push("Formulas will be preserved as text - consider evaluating them first")
  }

  // Calculate overall quality score
  const averageSheetQuality =
    analysis.sheetAnalysis.reduce((sum, sheet) => sum + sheet.dataQuality, 0) / analysis.sheetAnalysis.length
  analysis.qualityScore = averageSheetQuality || 100

  return analysis
}

// Excel templates
const excelTemplates: ExcelTemplate[] = [
  {
    id: "simple-table",
    name: "Simple Data Table",
    description: "Basic table with headers and data rows",
    category: "Basic",
    excelStructure: `A1: Name    B1: Age    C1: Email
A2: John    B2: 30     C2: john@example.com
A3: Jane    B3: 25     C3: jane@example.com`,
    jsonExample: `[
  {
    "Name": "John",
    "Age": 30,
    "Email": "john@example.com"
  },
  {
    "Name": "Jane",
    "Age": 25,
    "Email": "jane@example.com"
  }
]`,
    useCase: ["Contact lists", "Employee data", "Simple databases"],
  },
  {
    id: "financial-data",
    name: "Financial Report",
    description: "Financial data with numbers and dates",
    category: "Business",
    excelStructure: `A1: Date       B1: Revenue   C1: Expenses  D1: Profit
A2: 2024-01-01 B2: 10000     C2: 7000      D2: =B2-C2
A3: 2024-01-02 B3: 12000     C3: 8000      D3: =B3-C3`,
    jsonExample: `[
  {
    "Date": "2024-01-01",
    "Revenue": 10000,
    "Expenses": 7000,
    "Profit": 3000
  },
  {
    "Date": "2024-01-02",
    "Revenue": 12000,
    "Expenses": 8000,
    "Profit": 4000
  }
]`,
    useCase: ["Financial reports", "Budget tracking", "Sales data"],
  },
  {
    id: "multi-sheet",
    name: "Multi-Sheet Workbook",
    description: "Workbook with multiple related sheets",
    category: "Complex",
    excelStructure: `Sheet1 (Users):
A1: ID    B1: Name    C1: Department
A2: 1     B2: John    C2: IT
A3: 2     B3: Jane    C3: HR

Sheet2 (Departments):
A1: ID    B1: Name      C1: Manager
A2: IT    B2: Tech      C2: John
A3: HR    B3: Human     C3: Jane`,
    jsonExample: `{
  "Users": [
    {"ID": 1, "Name": "John", "Department": "IT"},
    {"ID": 2, "Name": "Jane", "Department": "HR"}
  ],
  "Departments": [
    {"ID": "IT", "Name": "Tech", "Manager": "John"},
    {"ID": "HR", "Name": "Human", "Manager": "Jane"}
  ]
}`,
    useCase: ["Complex databases", "Related data sets", "System exports"],
  },
  {
    id: "inventory",
    name: "Inventory Management",
    description: "Product inventory with categories and stock levels",
    category: "Business",
    excelStructure: `A1: SKU     B1: Product    C1: Category  D1: Stock  E1: Price
A2: WID001  B2: Widget A   C2: Hardware  D2: 50     E2: 29.99
A3: WID002  B3: Widget B   C3: Hardware  D3: 25     E3: 39.99`,
    jsonExample: `[
  {
    "SKU": "WID001",
    "Product": "Widget A",
    "Category": "Hardware",
    "Stock": 50,
    "Price": 29.99
  },
  {
    "SKU": "WID002",
    "Product": "Widget B",
    "Category": "Hardware",
    "Stock": 25,
    "Price": 39.99
  }
]`,
    useCase: ["Inventory systems", "Product catalogs", "Stock management"],
  },
  {
    id: "survey-data",
    name: "Survey Responses",
    description: "Survey data with mixed data types",
    category: "Research",
    excelStructure: `A1: ID  B1: Age  C1: Satisfied  D1: Comments        E1: Date
A2: 1   B2: 25   C2: TRUE       D2: Great service   E2: 2024-01-15
A3: 2   B3: 30   C3: FALSE      D3: Needs improvement E3: 2024-01-16`,
    jsonExample: `[
  {
    "ID": 1,
    "Age": 25,
    "Satisfied": true,
    "Comments": "Great service",
    "Date": "2024-01-15"
  },
  {
    "ID": 2,
    "Age": 30,
    "Satisfied": false,
    "Comments": "Needs improvement",
    "Date": "2024-01-16"
  }
]`,
    useCase: ["Survey analysis", "Research data", "Feedback collection"],
  },
]

// Validation functions
const validateExcelFile = (file: File): FileValidation => {
  const validation: FileValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  // Check file type
  const validExtensions = [".xlsx", ".xls", ".xlsm", ".xlsb"]
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

  if (!validExtensions.includes(fileExtension)) {
    validation.isValid = false
    validation.errors.push({
      message: "Invalid file format",
      type: "format",
      details: `Supported formats: ${validExtensions.join(", ")}`,
    })
  }

  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    validation.isValid = false
    validation.errors.push({
      message: "File too large",
      type: "size",
      details: `Maximum file size is ${formatFileSize(maxSize)}`,
    })
  }

  // Warnings for large files
  if (file.size > 10 * 1024 * 1024) {
    validation.warnings.push("Large file detected - processing may take longer")
  }

  // Suggestions
  if (fileExtension === ".xls") {
    validation.suggestions.push("Consider converting to .xlsx format for better compatibility")
  }

  return validation
}

// Custom hooks
const useExcelProcessing = () => {
  const processSingle = useCallback(
    async (file: File, settings: ProcessingSettings): Promise<ExcelProcessingResult> => {
      return await processExcelFile(file, settings)
    },
    []
  )

  const processBatch = useCallback(async (files: File[], settings: ProcessingSettings): Promise<ProcessingBatch> => {
    try {
      const results = await Promise.all(files.map((file) => processExcelFile(file, settings)))

      const validCount = results.filter((result) => result.isValid).length
      const invalidCount = results.length - validCount

      const totalFileSize = results.reduce((sum, result) => sum + result.fileSize, 0)
      const totalSheets = results.reduce((sum, result) => sum + result.statistics.totalSheets, 0)
      const averageQuality =
        results.length > 0
          ? results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length
          : 0

      const statistics: BatchStatistics = {
        totalProcessed: results.length,
        validCount,
        invalidCount,
        averageQuality,
        totalFileSize,
        totalSheets,
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
  }, [])

  return { processSingle, processBatch }
}

// File validation hook
const useFileValidation = () => {
  const validateFile = useCallback((file: File | null) => {
    if (!file) {
      return {
        isValid: false,
        error: "No file selected",
        isEmpty: true,
      }
    }

    const validation = validateExcelFile(file)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
    }
  }, [])

  return { validateFile }
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
const useExcelExport = () => {
  const exportResults = useCallback((results: ExcelProcessingResult[], format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "json":
        const jsonData = results.map((result) => ({
          fileName: result.fileName,
          sheets: result.sheets.map((sheet) => ({
            name: sheet.name,
            data: sheet.data,
          })),
        }))
        content = JSON.stringify(jsonData, null, 2)
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        // Export first sheet of first result as CSV
        if (results.length > 0 && results[0].sheets.length > 0) {
          const sheet = results[0].sheets[0]
          const headers = sheet.headers.join(",")
          const rows = sheet.data.map((row) =>
            sheet.headers.map((header) => JSON.stringify(row[header] || "")).join(",")
          )
          content = [headers, ...rows].join("\n")
        }
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
    link.download = filename || `excel-to-json${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResults }
}

// Generate text report from results
const generateTextFromResults = (results: ExcelProcessingResult[]): string => {
  return `Excel to JSON Processing Report
===============================

Generated: ${new Date().toLocaleString()}
Total Files: ${results.length}
Valid Files: ${results.filter((result) => result.isValid).length}
Invalid Files: ${results.filter((result) => !result.isValid).length}

Results:
${results
  .map((result, i) => {
    return `${i + 1}. File: ${result.fileName}
   Status: ${result.isValid ? "Success" : "Failed"}
   ${result.error ? `Error: ${result.error}` : ""}
   File Size: ${formatFileSize(result.fileSize)}
   Sheets: ${result.statistics.totalSheets}
   Total Rows: ${result.statistics.totalRows}
   Total Columns: ${result.statistics.totalColumns}
   Processing Time: ${result.statistics.processingTime.toFixed(2)}ms
   Quality Score: ${result.analysis?.qualityScore || "N/A"}
   Memory Usage: ${formatFileSize(result.statistics.memoryUsage)}
`
  })
  .join("\n")}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Average Quality: ${(results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length).toFixed(1)}
- Total File Size: ${formatFileSize(results.reduce((sum, result) => sum + result.fileSize, 0))}
- Total Sheets Processed: ${results.reduce((sum, result) => sum + result.statistics.totalSheets, 0)}
`
}

/**
 * Enhanced Excel to JSON Converter
 * Features: Advanced Excel processing, multi-sheet support, validation, analysis, batch processing
 */
const ExcelToJSONCore = () => {
  const [activeTab, setActiveTab] = useState<"converter" | "batch" | "analyzer" | "templates">("converter")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentResult, setCurrentResult] = useState<ExcelProcessingResult | null>(null)
  const [batches, setBatches] = useState<ProcessingBatch[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [settings, setSettings] = useState<ProcessingSettings>({
    includeEmptyRows: false,
    includeEmptyColumns: false,
    detectDataTypes: true,
    preserveFormulas: false,
    exportFormat: "json",
    jsonIndentation: 2,
    sheetSelection: "all",
    headerRow: 1,
    dateFormat: "YYYY-MM-DD",
    numberFormat: "auto",
    realTimeProcessing: false,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchFileInputRef = useRef<HTMLInputElement>(null)

  const { processSingle, processBatch } = useExcelProcessing()
  const { exportResults } = useExcelExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const { validateFile } = useFileValidation()

  const fileValidation = useMemo(() => {
    return validateFile(selectedFile)
  }, [selectedFile, validateFile])

  // Handle single file processing
  const handleProcessSingle = useCallback(async () => {
    if (!selectedFile) {
      toast.error("Please select an Excel file to process")
      return
    }

    if (!fileValidation.isValid) {
      toast.error(fileValidation.error || "Invalid file")
      return
    }

    setIsProcessing(true)
    try {
      const result = await processSingle(selectedFile, settings)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success(
          `Excel file processed successfully - ${result.statistics.totalSheets} sheets, ${result.statistics.totalRows} rows`
        )
      } else {
        toast.error(result.error || "Processing failed")
      }
    } catch (error) {
      toast.error("Failed to process Excel file")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedFile, fileValidation, settings, processSingle])

  // Handle batch processing
  const handleProcessBatch = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select Excel files to process")
      return
    }

    setIsProcessing(true)
    try {
      const batch = await processBatch(selectedFiles, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Processed ${batch.results.length} Excel files`)
    } catch (error) {
      toast.error("Failed to process batch")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedFiles, settings, processBatch])

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        setSelectedFile(file)
        setCurrentResult(null)

        if (settings.realTimeProcessing) {
          // Auto-process after a short delay
          setTimeout(() => {
            handleProcessSingle()
          }, 500)
        }
      }
    },
    [settings.realTimeProcessing, handleProcessSingle]
  )

  // Handle batch file selection
  const handleBatchFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
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
              <FileSpreadsheet className="h-5 w-5" />
              Excel to JSON Converter
            </CardTitle>
            <CardDescription>
              Advanced Excel to JSON converter with multi-sheet support, data validation, analysis, and batch processing
              capabilities. Convert Excel files (.xlsx, .xls) to JSON format with comprehensive data analysis and error
              reporting. Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "converter" | "batch" | "analyzer" | "templates")}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="converter"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
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
              value="analyzer"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Data Analyzer
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
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Excel File Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="file-input"
                      className="text-sm font-medium"
                    >
                      Select Excel File
                    </Label>
                    <div className="mt-2">
                      <input
                        ref={fileInputRef}
                        id="file-input"
                        type="file"
                        accept=".xlsx,.xls,.xlsm,.xlsb"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>
                    {selectedFile && (
                      <div className="mt-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span className="font-medium">{selectedFile.name}</span>
                          <span className="text-muted-foreground">({formatFileSize(selectedFile.size)})</span>
                        </div>
                        {fileValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid Excel file
                          </div>
                        ) : fileValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-4 w-4" />
                            {fileValidation.error}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Processing Settings */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Processing Settings</Label>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label
                          htmlFor="sheet-selection"
                          className="text-xs"
                        >
                          Sheet Selection
                        </Label>
                        <Select
                          value={settings.sheetSelection}
                          onValueChange={(value: SheetSelection) =>
                            setSettings((prev) => ({ ...prev, sheetSelection: value }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All sheets</SelectItem>
                            <SelectItem value="first">First sheet only</SelectItem>
                            <SelectItem value="non-empty">Non-empty sheets</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="header-row"
                          className="text-xs"
                        >
                          Header Row
                        </Label>
                        <Select
                          value={settings.headerRow.toString()}
                          onValueChange={(value) => setSettings((prev) => ({ ...prev, headerRow: parseInt(value) }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Row 1</SelectItem>
                            <SelectItem value="2">Row 2</SelectItem>
                            <SelectItem value="3">Row 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="include-empty-rows"
                          type="checkbox"
                          checked={settings.includeEmptyRows}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeEmptyRows: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="include-empty-rows"
                          className="text-xs"
                        >
                          Include empty rows
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-empty-columns"
                          type="checkbox"
                          checked={settings.includeEmptyColumns}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeEmptyColumns: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="include-empty-columns"
                          className="text-xs"
                        >
                          Include empty columns
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="detect-data-types"
                          type="checkbox"
                          checked={settings.detectDataTypes}
                          onChange={(e) => setSettings((prev) => ({ ...prev, detectDataTypes: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="detect-data-types"
                          className="text-xs"
                        >
                          Auto-detect data types
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="preserve-formulas"
                          type="checkbox"
                          checked={settings.preserveFormulas}
                          onChange={(e) => setSettings((prev) => ({ ...prev, preserveFormulas: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="preserve-formulas"
                          className="text-xs"
                        >
                          Preserve formulas
                        </Label>
                      </div>

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
                          className="text-xs"
                        >
                          Real-time processing
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleProcessSingle}
                      disabled={!selectedFile || !fileValidation.isValid || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      Convert to JSON
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedFile(null)
                        setCurrentResult(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {fileValidation.warnings && fileValidation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Warnings:</h4>
                      <div className="text-xs space-y-1">
                        {fileValidation.warnings.map((warning, index) => (
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

                  {fileValidation.suggestions && fileValidation.suggestions.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-blue-800">Suggestions:</h4>
                      <div className="text-xs space-y-1">
                        {fileValidation.suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="text-blue-700"
                          >
                            {suggestion}
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
                    <Braces className="h-5 w-5" />
                    JSON Output
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-2">File: {currentResult.fileName}</div>
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
                          {/* Sheet Selection */}
                          {currentResult.sheets.length > 1 && (
                            <div>
                              <Label
                                htmlFor="sheet-selector"
                                className="text-sm font-medium"
                              >
                                Select Sheet to View
                              </Label>
                              <Select
                                value={selectedSheet || currentResult.sheets[0]?.name || ""}
                                onValueChange={setSelectedSheet}
                              >
                                <SelectTrigger className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {currentResult.sheets.map((sheet) => (
                                    <SelectItem
                                      key={sheet.name}
                                      value={sheet.name}
                                    >
                                      {sheet.name} ({sheet.rowCount} rows)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* JSON Output */}
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="font-medium text-sm">Generated JSON</Label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const currentSheet =
                                      currentResult.sheets.find((s) => s.name === selectedSheet) ||
                                      currentResult.sheets[0]
                                    if (currentSheet) {
                                      copyToClipboard(
                                        JSON.stringify(currentSheet.data, null, settings.jsonIndentation),
                                        "JSON Data"
                                      )
                                    }
                                  }}
                                >
                                  {copiedText === "JSON Data" ? (
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
                              value={JSON.stringify(
                                (currentResult.sheets.find((s) => s.name === selectedSheet) || currentResult.sheets[0])
                                  ?.data || [],
                                null,
                                settings.jsonIndentation
                              )}
                              readOnly
                              className="min-h-[200px] font-mono text-sm bg-muted"
                            />
                          </div>

                          {/* Statistics */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Processing Statistics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>File Size:</strong> {formatFileSize(currentResult.fileSize)}
                                </div>
                                <div>
                                  <strong>Sheets:</strong> {currentResult.statistics.totalSheets}
                                </div>
                                <div>
                                  <strong>Processing Time:</strong> {currentResult.statistics.processingTime.toFixed(2)}
                                  ms
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Total Rows:</strong> {currentResult.statistics.totalRows}
                                </div>
                                <div>
                                  <strong>Total Columns:</strong> {currentResult.statistics.totalColumns}
                                </div>
                                <div>
                                  <strong>Total Cells:</strong> {currentResult.statistics.totalCells}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Memory Usage:</strong> {formatFileSize(currentResult.statistics.memoryUsage)}
                                </div>
                                <div>
                                  <strong>Quality Score:</strong>{" "}
                                  {currentResult.analysis?.qualityScore?.toFixed(1) || "N/A"}
                                </div>
                                <div>
                                  <strong>Empty Sheets:</strong> {currentResult.statistics.emptySheets}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sheet Details */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Sheet Details</Label>
                            <div className="space-y-2">
                              {currentResult.sheets.map((sheet) => (
                                <div
                                  key={sheet.name}
                                  className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4" />
                                    <span className="font-medium">{sheet.name}</span>
                                    {sheet.isEmpty && <span className="text-red-600">(Empty)</span>}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {sheet.rowCount} rows × {sheet.columnCount} cols
                                  </div>
                                </div>
                              ))}
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
                                      <strong>Multiple Sheets:</strong>{" "}
                                      {currentResult.analysis.hasMultipleSheets ? "Yes" : "No"}
                                    </div>
                                    <div>
                                      <strong>Has Formulas:</strong> {currentResult.analysis.hasFormulas ? "Yes" : "No"}
                                    </div>
                                    <div>
                                      <strong>Has Errors:</strong> {currentResult.analysis.hasErrors ? "Yes" : "No"}
                                    </div>
                                  </div>
                                  <div>
                                    <div>
                                      <strong>Empty Sheets:</strong>{" "}
                                      {currentResult.analysis.hasEmptySheets ? "Yes" : "No"}
                                    </div>
                                    <div>
                                      <strong>Inconsistent Headers:</strong>{" "}
                                      {currentResult.analysis.hasInconsistentHeaders ? "Yes" : "No"}
                                    </div>
                                    <div>
                                      <strong>Quality Score:</strong> {currentResult.analysis.qualityScore.toFixed(1)}
                                      /100
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
                            <span className="font-medium">Processing Error</span>
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
                            Export JSON
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No File Processed</h3>
                      <p className="text-muted-foreground mb-4">
                        Select an Excel file and convert it to see JSON results
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
                  Batch Excel Processing
                </CardTitle>
                <CardDescription>Process multiple Excel files simultaneously</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="batch-file-input"
                      className="text-sm font-medium"
                    >
                      Select Multiple Excel Files
                    </Label>
                    <div className="mt-2">
                      <input
                        ref={batchFileInputRef}
                        id="batch-file-input"
                        type="file"
                        accept=".xlsx,.xls,.xlsm,.xlsb"
                        multiple
                        onChange={handleBatchFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 text-sm">
                        <div className="font-medium">{selectedFiles.length} files selected</div>
                        <div className="text-muted-foreground">
                          Total size: {formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleProcessBatch}
                      disabled={selectedFiles.length === 0 || isProcessing}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Process Batch
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedFiles([])
                        if (batchFileInputRef.current) {
                          batchFileInputRef.current.value = ""
                        }
                      }}
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
                            <h4 className="font-medium">{batch.count} files processed</h4>
                            <div className="text-sm text-muted-foreground">
                              {batch.createdAt.toLocaleString()} • {batch.statistics.successRate.toFixed(1)}% success
                              rate
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportResults(batch.results, "json")}
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
                            <span className="font-medium">Avg Quality:</span>{" "}
                            {batch.statistics.averageQuality.toFixed(1)}
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
                                  <span className="font-mono truncate flex-1 mr-2">{result.fileName}</span>
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
                                    Sheets: {result.statistics.totalSheets} • Rows: {result.statistics.totalRows} •
                                    Time: {result.statistics.processingTime.toFixed(2)}ms
                                  </div>
                                )}
                                {result.error && <div className="text-red-600 mt-1">{result.error}</div>}
                              </div>
                            ))}
                            {batch.results.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.results.length - 5} more files
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
          <TabsContent
            value="analyzer"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Excel Data Analyzer
                </CardTitle>
                <CardDescription>Detailed analysis of Excel file structure and data quality</CardDescription>
              </CardHeader>
              <CardContent>
                {currentResult && currentResult.isValid ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">File Structure</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>File Size: {formatFileSize(currentResult.fileSize)}</div>
                          <div>Total Sheets: {currentResult.statistics.totalSheets}</div>
                          <div>Total Rows: {currentResult.statistics.totalRows}</div>
                          <div>Total Columns: {currentResult.statistics.totalColumns}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Data Quality</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Quality Score: {currentResult.analysis?.qualityScore?.toFixed(1) || "N/A"}/100</div>
                          <div>Empty Sheets: {currentResult.statistics.emptySheets}</div>
                          <div>Processing Time: {currentResult.statistics.processingTime.toFixed(2)}ms</div>
                          <div>Memory Usage: {formatFileSize(currentResult.statistics.memoryUsage)}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Data Features</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Has Formulas: {currentResult.analysis?.hasFormulas ? "Yes" : "No"}</div>
                          <div>Has Errors: {currentResult.analysis?.hasErrors ? "Yes" : "No"}</div>
                          <div>Multiple Sheets: {currentResult.analysis?.hasMultipleSheets ? "Yes" : "No"}</div>
                          <div>Empty Sheets: {currentResult.analysis?.hasEmptySheets ? "Yes" : "No"}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Sheet Analysis */}
                    {currentResult.analysis?.sheetAnalysis && currentResult.analysis.sheetAnalysis.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Sheet Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {currentResult.analysis.sheetAnalysis.map((sheet, index) => (
                              <div
                                key={index}
                                className="border rounded p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-sm">{sheet.sheetName}</h4>
                                  <span className="text-xs px-2 py-1 bg-muted rounded">
                                    Quality: {sheet.dataQuality.toFixed(1)}/100
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>Header Consistency: {sheet.headerConsistency ? "Good" : "Issues"}</div>
                                  <div>Data Type Consistency: {sheet.dataTypeConsistency ? "Good" : "Issues"}</div>
                                  <div>Empty Rows: {sheet.hasEmptyRows ? "Present" : "None"}</div>
                                  <div>Empty Columns: {sheet.hasEmptyColumns ? "Present" : "None"}</div>
                                </div>
                                {sheet.recommendations.length > 0 && (
                                  <div className="mt-2 text-xs">
                                    <strong>Recommendations:</strong>
                                    <ul className="list-disc list-inside mt-1 text-muted-foreground">
                                      {sheet.recommendations.map((rec, i) => (
                                        <li key={i}>{rec}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

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

                          {currentResult.analysis.dataIssues.length > 0 && (
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-red-700">Data Issues</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="text-sm space-y-1">
                                  {currentResult.analysis.dataIssues.map((issue, index) => (
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
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Process an Excel file in the Converter tab to see detailed analysis
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
                  Excel Structure Templates
                </CardTitle>
                <CardDescription>Common Excel file structures and their JSON equivalents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {excelTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs font-medium mb-1">Excel Structure:</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded max-h-24 overflow-y-auto whitespace-pre-line">
                              {template.excelStructure}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">JSON Output:</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded max-h-24 overflow-y-auto">
                              {template.jsonExample}
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
                Processing Settings
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
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="txt">Text Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="json-indent"
                    className="text-sm font-medium"
                  >
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
                      exportResults(allResults, "txt", "excel-processing-statistics.txt")
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
const ExcelToJson = () => {
  return <ExcelToJSONCore />
}

export default ExcelToJson
