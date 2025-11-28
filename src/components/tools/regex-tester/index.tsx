import React, { useCallback, useRef, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Code,
  Upload,
  FileImage,
  Trash2,
  Target,
  Copy,
  Check,
  BarChart3,
  AlertTriangle,
  BookOpen,
  Zap,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  TextFile,
  RegexMatch,
  RegexStatistics,
  RegexSettings,
  RegexPattern,
  RegexTestResult,
} from "@/components/tools/regex-tester/schema"
import { formatFileSize } from "@/lib/utils"
// Types

// Utility functions

const validateRegexPattern = (pattern: string, flags: string): { isValid: boolean; error?: string } => {
  if (!pattern.trim()) {
    return { isValid: false, error: "Pattern cannot be empty" }
  }

  try {
    new RegExp(pattern, flags)
    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid regex pattern",
    }
  }
}

const validateTextFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = [".txt", ".text", ".log", ".csv", ".json", ".md", ".markdown"]

  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 50MB" }
  }

  const extension = "." + file.name.split(".").pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: "Only text files are supported (.txt, .log, .csv, .json, .md)" }
  }

  return { isValid: true }
}

// Common regex patterns library
const regexPatterns: RegexPattern[] = [
  {
    name: "Email Address",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    description: "Matches email addresses",
    category: "Common",
    flags: "gi",
    example: "user@example.com",
  },
  {
    name: "Phone Number (US)",
    pattern: "\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})",
    description: "Matches US phone numbers",
    category: "Common",
    flags: "g",
    example: "(555) 123-4567",
  },
  {
    name: "URL",
    pattern:
      "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
    description: "Matches HTTP/HTTPS URLs",
    category: "Web",
    flags: "gi",
    example: "https://www.example.com",
  },
  {
    name: "IPv4 Address",
    pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
    description: "Matches IPv4 addresses",
    category: "Network",
    flags: "g",
    example: "192.168.1.1",
  },
  {
    name: "Credit Card",
    pattern: "\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\\b",
    description: "Matches major credit card numbers",
    category: "Financial",
    flags: "g",
    example: "4111111111111111",
  },
  {
    name: "Date (YYYY-MM-DD)",
    pattern: "\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b",
    description: "Matches dates in YYYY-MM-DD format",
    category: "Date/Time",
    flags: "g",
    example: "2023-12-25",
  },
  {
    name: "Time (24-hour)",
    pattern: "\\b(?:[01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?\\b",
    description: "Matches time in 24-hour format",
    category: "Date/Time",
    flags: "g",
    example: "14:30:00",
  },
  {
    name: "Hex Color",
    pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
    description: "Matches hexadecimal color codes",
    category: "Web",
    flags: "gi",
    example: "#FF5733",
  },
  {
    name: "HTML Tag",
    pattern: "<\\/?[a-zA-Z][a-zA-Z0-9]*(?:\\s[^>]*)?>",
    description: "Matches HTML tags",
    category: "Web",
    flags: "gi",
    example: '<div class="example">',
  },
  {
    name: "Word Boundaries",
    pattern: "\\b\\w+\\b",
    description: "Matches whole words",
    category: "Text",
    flags: "g",
    example: "word",
  },
]

// Regex execution engine
const executeRegex = (pattern: string, text: string, settings: RegexSettings): RegexTestResult => {
  const startTime = performance.now()

  try {
    // Build flags string
    const flags = Object.entries(settings.flags)
      .filter(([_, enabled]) => enabled)
      .map(([flag, _]) => {
        switch (flag) {
          case "global":
            return "g"
          case "ignoreCase":
            return "i"
          case "multiline":
            return "m"
          case "dotAll":
            return "s"
          case "unicode":
            return "u"
          case "sticky":
            return "y"
          default:
            return ""
        }
      })
      .join("")

    const regex = new RegExp(pattern, flags)
    const matches: RegexMatch[] = []
    const matchPositions: number[] = []
    const uniqueMatches = new Set<string>()

    let match: RegExpExecArray | null
    let matchCount = 0

    // Reset regex lastIndex for global patterns
    regex.lastIndex = 0

    while ((match = regex.exec(text)) !== null && matchCount < settings.maxMatches) {
      const regexMatch: RegexMatch = {
        match: match[0],
        index: match.index,
        groups: match.slice(1),
        namedGroups: match.groups || {},
        input: match.input || text,
        length: match[0].length,
      }

      matches.push(regexMatch)
      matchPositions.push(match.index)
      uniqueMatches.add(match[0])
      matchCount++

      // Prevent infinite loops with zero-width matches
      if (match[0].length === 0) {
        regex.lastIndex++
      }

      // Break if not global to prevent infinite loop
      if (!settings.flags.global) {
        break
      }
    }

    const executionTime = performance.now() - startTime

    // Calculate statistics
    const totalMatchLength = matches.reduce((sum, m) => sum + m.length, 0)
    const coverage = text.length > 0 ? (totalMatchLength / text.length) * 100 : 0

    const statistics: RegexStatistics = {
      totalMatches: matches.length,
      uniqueMatches: uniqueMatches.size,
      averageMatchLength: matches.length > 0 ? totalMatchLength / matches.length : 0,
      matchPositions,
      captureGroups: matches.length > 0 ? matches[0].groups.length : 0,
      namedGroups: matches.length > 0 ? Object.keys(matches[0].namedGroups) : [],
      executionTime,
      textLength: text.length,
      coverage,
    }

    // Handle replacement if enabled
    let replacementResult: string | undefined
    if (settings.enableReplacement && settings.replacementText !== undefined) {
      try {
        replacementResult = text.replace(regex, settings.replacementText)
      } catch (error) {
        // Replacement failed, but we can still return the matches
      }
    }

    return {
      isValid: true,
      matches,
      statistics,
      replacementResult,
    }
  } catch (error) {
    return {
      isValid: false,
      matches: [],
      statistics: {
        totalMatches: 0,
        uniqueMatches: 0,
        averageMatchLength: 0,
        matchPositions: [],
        captureGroups: 0,
        namedGroups: [],
        executionTime: performance.now() - startTime,
        textLength: text.length,
        coverage: 0,
      },
      error: error instanceof Error ? error.message : "Regex execution failed",
    }
  }
}

// Highlight matches in text
const highlightMatches = (text: string, matches: RegexMatch[], highlightEnabled: boolean): string => {
  if (!highlightEnabled || matches.length === 0) {
    return text
  }

  // Sort matches by index in descending order to avoid index shifting
  const sortedMatches = [...matches].sort((a, b) => b.index - a.index)

  let highlightedText = text

  sortedMatches.forEach((match, index) => {
    const before = highlightedText.substring(0, match.index)
    const matchText = highlightedText.substring(match.index, match.index + match.length)
    const after = highlightedText.substring(match.index + match.length)

    highlightedText =
      before + `<mark class="bg-yellow-200 dark:bg-yellow-800" data-match="${index}">${matchText}</mark>` + after
  })

  return highlightedText
}

// Custom hooks
const useRegexTesting = () => {
  const testRegex = useCallback((pattern: string, text: string, settings: RegexSettings): RegexTestResult => {
    const validation = validateRegexPattern(
      pattern,
      Object.entries(settings.flags)
        .filter(([_, enabled]) => enabled)
        .map(([flag, _]) => {
          switch (flag) {
            case "global":
              return "g"
            case "ignoreCase":
              return "i"
            case "multiline":
              return "m"
            case "dotAll":
              return "s"
            case "unicode":
              return "u"
            case "sticky":
              return "y"
            default:
              return ""
          }
        })
        .join("")
    )

    if (!validation.isValid) {
      return {
        isValid: false,
        matches: [],
        statistics: {
          totalMatches: 0,
          uniqueMatches: 0,
          averageMatchLength: 0,
          matchPositions: [],
          captureGroups: 0,
          namedGroups: [],
          executionTime: 0,
          textLength: text.length,
          coverage: 0,
        },
        error: validation.error,
      }
    }

    return executeRegex(pattern, text, settings)
  }, [])

  const testBatch = useCallback(
    (pattern: string, files: TextFile[], settings: RegexSettings): TextFile[] => {
      return files.map((file) => {
        if (file.status !== "pending") return file

        try {
          const result = testRegex(pattern, file.content, settings)
          return {
            ...file,
            status: "completed" as const,
            matches: result.matches,
            statistics: result.statistics,
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
    },
    [testRegex]
  )

  return { testRegex, testBatch }
}

// Real-time regex testing hook
const useRealTimeRegex = (pattern: string, text: string, settings: RegexSettings) => {
  return useMemo(() => {
    if (!pattern.trim() || !text.trim()) {
      return {
        isValid: true,
        matches: [],
        statistics: {
          totalMatches: 0,
          uniqueMatches: 0,
          averageMatchLength: 0,
          matchPositions: [],
          captureGroups: 0,
          namedGroups: [],
          executionTime: 0,
          textLength: text.length,
          coverage: 0,
        },
        highlightedText: text,
      }
    }

    try {
      const result = executeRegex(pattern, text, settings)
      const highlightedText = highlightMatches(text, result.matches, settings.highlightMatches)

      return {
        ...result,
        highlightedText,
      }
    } catch (error) {
      return {
        isValid: false,
        matches: [],
        statistics: {
          totalMatches: 0,
          uniqueMatches: 0,
          averageMatchLength: 0,
          matchPositions: [],
          captureGroups: 0,
          namedGroups: [],
          executionTime: 0,
          textLength: text.length,
          coverage: 0,
        },
        error: error instanceof Error ? error.message : "Regex execution failed",
        highlightedText: text,
      }
    }
  }, [pattern, text, settings])
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<TextFile> => {
    const validation = validateTextFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const textFile: TextFile = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type || "text/plain",
            status: "pending",
          }

          resolve(textFile)
        } catch (error) {
          reject(new Error("Failed to process file"))
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<TextFile[]> => {
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
const useRegexExport = () => {
  const exportMatches = useCallback((matches: RegexMatch[], filename?: string) => {
    const content = matches
      .map(
        (match, index) =>
          `Match ${index + 1}:\n` +
          `  Text: "${match.match}"\n` +
          `  Position: ${match.index}-${match.index + match.length}\n` +
          `  Length: ${match.length}\n` +
          `  Groups: [${match.groups.join(", ")}]\n` +
          `  Named Groups: ${JSON.stringify(match.namedGroups)}\n`
      )
      .join("\n")

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || "regex-matches.txt"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportTestReport = useCallback((pattern: string, text: string, result: RegexTestResult, filename?: string) => {
    const report = `Regex Test Report
=================

Pattern: ${pattern}
Flags: ${Object.entries(result.statistics || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")}

Text Length: ${text.length} characters
Execution Time: ${result.statistics?.executionTime.toFixed(2)}ms

Results:
--------
Total Matches: ${result.statistics?.totalMatches || 0}
Unique Matches: ${result.statistics?.uniqueMatches || 0}
Average Match Length: ${result.statistics?.averageMatchLength.toFixed(2) || 0}
Text Coverage: ${result.statistics?.coverage.toFixed(2) || 0}%

${result.isValid ? "Matches:" : "Error:"}
${
  result.isValid
    ? result.matches.map((match, index) => `${index + 1}. "${match.match}" at position ${match.index}`).join("\n")
    : result.error || "Unknown error"
}

${result.replacementResult ? `\nReplacement Result:\n${result.replacementResult}` : ""}
`

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || "regex-test-report.txt"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback((files: TextFile[], pattern: string) => {
    const content = files
      .map(
        (file, index) =>
          `File ${index + 1}: ${file.name}\n` +
          `Status: ${file.status}\n` +
          `Size: ${formatFileSize(file.size)}\n` +
          `Matches: ${file.matches?.length || 0}\n` +
          `Statistics: ${file.statistics ? JSON.stringify(file.statistics, null, 2) : "N/A"}\n` +
          `${file.error ? `Error: ${file.error}` : ""}\n` +
          "---\n"
      )
      .join("\n")

    const blob = new Blob([`Batch Regex Test Results\nPattern: ${pattern}\n\n${content}`], {
      type: "text/plain;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "regex-batch-results.txt"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportCSV = useCallback((files: TextFile[]) => {
    const headers = [
      "Filename",
      "Status",
      "File Size",
      "Total Matches",
      "Unique Matches",
      "Average Match Length",
      "Coverage %",
      "Execution Time (ms)",
    ]

    const rows = files.map((file) => [
      file.name,
      file.status,
      formatFileSize(file.size),
      file.statistics?.totalMatches || 0,
      file.statistics?.uniqueMatches || 0,
      file.statistics?.averageMatchLength.toFixed(2) || 0,
      file.statistics?.coverage.toFixed(2) || 0,
      file.statistics?.executionTime.toFixed(2) || 0,
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "regex-test-statistics.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportMatches, exportTestReport, exportBatch, exportCSV }
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

      const files = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.type === "text/plain" ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".log") ||
          file.name.endsWith(".csv") ||
          file.name.endsWith(".json") ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".markdown")
      )

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error("Please drop only text files")
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
 * Enhanced Regex Tester Tool
 * Features: Real-time testing, file upload, batch processing, export capabilities
 */
const RegexTesterCore = () => {
  const [activeTab, setActiveTab] = useState<"tester" | "files">("tester")
  const [pattern, setPattern] = useState("")
  const [testText, setTestText] = useState(
    "The quick brown fox jumps over the lazy dog. Email: test@example.com, Phone: (555) 123-4567"
  )
  const [files, setFiles] = useState<TextFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<RegexSettings>({
    flags: {
      global: true,
      ignoreCase: false,
      multiline: false,
      dotAll: false,
      unicode: false,
      sticky: false,
    },
    highlightMatches: true,
    showCaptureGroups: true,
    showMatchPositions: true,
    maxMatches: 1000,
    timeout: 5000,
    enableReplacement: false,
    replacementText: "",
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState<string>("")

  const { testBatch } = useRegexTesting()
  const { exportMatches, exportTestReport, exportBatch, exportCSV } = useRegexExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // 顶层
  const { processBatch } = useFileProcessing()

  // Real-time regex testing
  const realtimeResult = useRealTimeRegex(pattern, testText, settings)

  // File drag and drop
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    useCallback(
      async (droppedFiles: File[]) => {
        try {
          setIsProcessing(true)
          const processedFiles = await processBatch(droppedFiles)
          setFiles((prev) => [...processedFiles, ...prev])
          toast.success(`Added ${processedFiles.length} file(s)`)
        } catch (error) {
          toast.error("Failed to process files")
        } finally {
          setIsProcessing(false)
        }
      },
      [processBatch]
    )
  )

  // Apply pattern from library
  const applyPattern = useCallback(
    (patternData: RegexPattern) => {
      setPattern(patternData.pattern)
      setSelectedPattern(patternData.name)

      // Apply flags
      const newFlags = { ...settings.flags }
      Object.keys(newFlags).forEach((key) => {
        newFlags[key as keyof typeof newFlags] = false
      })

      if (patternData.flags.includes("g")) newFlags.global = true
      if (patternData.flags.includes("i")) newFlags.ignoreCase = true
      if (patternData.flags.includes("m")) newFlags.multiline = true
      if (patternData.flags.includes("s")) newFlags.dotAll = true
      if (patternData.flags.includes("u")) newFlags.unicode = true
      if (patternData.flags.includes("y")) newFlags.sticky = true

      setSettings((prev) => ({ ...prev, flags: newFlags }))
      toast.success(`Applied pattern: ${patternData.name}`)
    },
    [settings.flags]
  )

  // Test files with current pattern
  const testFiles = useCallback(async () => {
    if (!pattern.trim()) {
      toast.error("Please enter a regex pattern")
      return
    }

    const pendingFiles = files.filter((f) => f.status === "pending")
    if (pendingFiles.length === 0) {
      toast.error("No files to test")
      return
    }

    try {
      setIsProcessing(true)
      const updatedFiles = testBatch(pattern, files, settings)
      setFiles(updatedFiles)
      toast.success("Files tested successfully!")
    } catch (error) {
      toast.error("Failed to test files")
    } finally {
      setIsProcessing(false)
    }
  }, [pattern, files, settings, testBatch])

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
  const totalStats = useMemo(() => {
    const completedFiles = files.filter((f) => f.statistics)
    if (completedFiles.length === 0) return null

    return {
      totalFiles: completedFiles.length,
      totalMatches: completedFiles.reduce((sum, f) => sum + f.statistics!.totalMatches, 0),
      totalUniqueMatches: completedFiles.reduce((sum, f) => sum + f.statistics!.uniqueMatches, 0),
      averageExecutionTime:
        completedFiles.reduce((sum, f) => sum + f.statistics!.executionTime, 0) / completedFiles.length,
      averageCoverage: completedFiles.reduce((sum, f) => sum + f.statistics!.coverage, 0) / completedFiles.length,
      totalTextLength: completedFiles.reduce((sum, f) => sum + f.statistics!.textLength, 0),
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
              <Search className="h-5 w-5" />
              Regex Tester
            </CardTitle>
            <CardDescription>
              Test regular expressions with real-time feedback, file upload, batch processing, and export capabilities.
              Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "tester" | "files")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="tester"
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              Regex Tester
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              File Testing
            </TabsTrigger>
          </TabsList>

          {/* Regex Tester Tab */}
          <TabsContent
            value="tester"
            className="space-y-4"
          >
            {/* Pattern Library */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Pattern Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {regexPatterns.slice(0, 6).map((patternData) => (
                    <Button
                      key={patternData.name}
                      variant={selectedPattern === patternData.name ? "default" : "outline"}
                      onClick={() => applyPattern(patternData)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{patternData.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{patternData.description}</div>
                        <div className="text-xs font-mono mt-1 bg-muted/30 px-1 rounded">{patternData.example}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Regex Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Regex Pattern</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regex-pattern">Pattern</Label>
                  <div className="relative">
                    <Input
                      id="regex-pattern"
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      placeholder="Enter your regex pattern..."
                      className="font-mono"
                    />
                    {pattern && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(pattern, "pattern")}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        {copiedText === "pattern" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Flags */}
                <div className="space-y-2">
                  <Label>Flags</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    <div className="flex items-center space-x-2">
                      <input
                        id="flag-global"
                        type="checkbox"
                        checked={settings.flags.global}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            flags: { ...prev.flags, global: e.target.checked },
                          }))
                        }
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="flag-global"
                        className="text-sm"
                      >
                        g (global)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="flag-ignoreCase"
                        type="checkbox"
                        checked={settings.flags.ignoreCase}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            flags: { ...prev.flags, ignoreCase: e.target.checked },
                          }))
                        }
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="flag-ignoreCase"
                        className="text-sm"
                      >
                        i (ignore case)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="flag-multiline"
                        type="checkbox"
                        checked={settings.flags.multiline}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            flags: { ...prev.flags, multiline: e.target.checked },
                          }))
                        }
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="flag-multiline"
                        className="text-sm"
                      >
                        m (multiline)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="flag-dotAll"
                        type="checkbox"
                        checked={settings.flags.dotAll}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            flags: { ...prev.flags, dotAll: e.target.checked },
                          }))
                        }
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="flag-dotAll"
                        className="text-sm"
                      >
                        s (dot all)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="flag-unicode"
                        type="checkbox"
                        checked={settings.flags.unicode}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            flags: { ...prev.flags, unicode: e.target.checked },
                          }))
                        }
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="flag-unicode"
                        className="text-sm"
                      >
                        u (unicode)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="flag-sticky"
                        type="checkbox"
                        checked={settings.flags.sticky}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            flags: { ...prev.flags, sticky: e.target.checked },
                          }))
                        }
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="flag-sticky"
                        className="text-sm"
                      >
                        y (sticky)
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Advanced Options</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      {showAdvanced ? "Hide" : "Show"} Advanced
                    </Button>
                  </div>

                  {showAdvanced && (
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <input
                            id="highlightMatches"
                            type="checkbox"
                            checked={settings.highlightMatches}
                            onChange={(e) => setSettings((prev) => ({ ...prev, highlightMatches: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label
                            htmlFor="highlightMatches"
                            className="text-sm"
                          >
                            Highlight matches
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            id="showCaptureGroups"
                            type="checkbox"
                            checked={settings.showCaptureGroups}
                            onChange={(e) => setSettings((prev) => ({ ...prev, showCaptureGroups: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label
                            htmlFor="showCaptureGroups"
                            className="text-sm"
                          >
                            Show capture groups
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            id="enableReplacement"
                            type="checkbox"
                            checked={settings.enableReplacement}
                            onChange={(e) => setSettings((prev) => ({ ...prev, enableReplacement: e.target.checked }))}
                            className="rounded border-input"
                          />
                          <Label
                            htmlFor="enableReplacement"
                            className="text-sm"
                          >
                            Enable replacement
                          </Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxMatches">Max Matches</Label>
                          <Input
                            id="maxMatches"
                            type="number"
                            min="1"
                            max="10000"
                            value={settings.maxMatches}
                            onChange={(e) => setSettings((prev) => ({ ...prev, maxMatches: Number(e.target.value) }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timeout">Timeout (ms)</Label>
                          <Input
                            id="timeout"
                            type="number"
                            min="100"
                            max="30000"
                            value={settings.timeout}
                            onChange={(e) => setSettings((prev) => ({ ...prev, timeout: Number(e.target.value) }))}
                          />
                        </div>
                      </div>

                      {settings.enableReplacement && (
                        <div className="space-y-2">
                          <Label htmlFor="replacementText">Replacement Text</Label>
                          <Input
                            id="replacementText"
                            value={settings.replacementText}
                            onChange={(e) => setSettings((prev) => ({ ...prev, replacementText: e.target.value }))}
                            placeholder="Enter replacement text (use $1, $2 for groups)..."
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Text</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-text">Input Text</Label>
                  <Textarea
                    id="test-text"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Enter text to test against your regex pattern..."
                    className="min-h-[120px] font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Real-time Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Live Results
                  {!realtimeResult.isValid && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold text-blue-600">{realtimeResult.statistics.totalMatches}</div>
                    <div className="text-xs text-muted-foreground">Total Matches</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold text-green-600">{realtimeResult.statistics.uniqueMatches}</div>
                    <div className="text-xs text-muted-foreground">Unique Matches</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold text-purple-600">
                      {realtimeResult.statistics.coverage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Coverage</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold text-orange-600">
                      {realtimeResult.statistics.executionTime.toFixed(2)}ms
                    </div>
                    <div className="text-xs text-muted-foreground">Execution Time</div>
                  </div>
                </div>

                {/* Error Display */}
                {!realtimeResult.isValid && realtimeResult.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Regex Error</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">{realtimeResult.error}</p>
                  </div>
                )}

                {/* Highlighted Text */}
                {realtimeResult.isValid && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Text with Matches Highlighted</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(realtimeResult.highlightedText || testText, "highlighted text")}
                      >
                        {copiedText === "highlighted text" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div
                      className="p-4 border rounded-lg bg-background min-h-[120px] font-mono text-sm whitespace-pre-wrap overflow-auto"
                      dangerouslySetInnerHTML={{
                        __html: realtimeResult.highlightedText || testText,
                      }}
                    />
                  </div>
                )}

                {/* Matches List */}
                {realtimeResult.isValid && realtimeResult.matches.length > 0 && (
                  <div className="space-y-2">
                    <Label>Matches ({realtimeResult.matches.length})</Label>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {realtimeResult.matches.slice(0, 20).map((match, index) => (
                        <div
                          key={index}
                          className="p-3 bg-muted/30 rounded border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Match {index + 1}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(match.match, `match-${index}`)}
                            >
                              {copiedText === `match-${index}` ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="font-medium">Text:</span>{" "}
                              <code className="bg-muted px-1 rounded">{match.match}</code>
                            </div>
                            <div>
                              <span className="font-medium">Position:</span> {match.index}-{match.index + match.length}
                            </div>
                            <div>
                              <span className="font-medium">Length:</span> {match.length}
                            </div>
                            {settings.showCaptureGroups && match.groups.length > 0 && (
                              <div>
                                <span className="font-medium">Groups:</span> [
                                {match.groups.map((g) => `"${g}"`).join(", ")}]
                              </div>
                            )}
                            {Object.keys(match.namedGroups).length > 0 && (
                              <div>
                                <span className="font-medium">Named Groups:</span> {JSON.stringify(match.namedGroups)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {realtimeResult.matches.length > 20 && (
                        <div className="text-center text-sm text-muted-foreground py-2">
                          ... and {realtimeResult.matches.length - 20} more matches
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Replacement Result */}
                {settings.enableReplacement && realtimeResult.replacementResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Replacement Result</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(realtimeResult.replacementResult!, "replacement result")}
                      >
                        {copiedText === "replacement result" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="p-4 border rounded-lg bg-background min-h-[80px] font-mono text-sm whitespace-pre-wrap">
                      {realtimeResult.replacementResult}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center pt-4 border-t">
                  <Button
                    onClick={() => exportTestReport(pattern, testText, realtimeResult)}
                    variant="outline"
                    disabled={!realtimeResult.isValid}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>

                  <Button
                    onClick={() => exportMatches(realtimeResult.matches)}
                    variant="outline"
                    disabled={realtimeResult.matches.length === 0}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export Matches
                  </Button>

                  <Button
                    onClick={() => copyToClipboard(pattern, "regex pattern")}
                    variant="outline"
                    disabled={!pattern}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Pattern
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* File Testing Tab */}
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
                  <h3 className="text-lg font-semibold mb-2">Upload Text Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your text files here, or click to select files
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
                    Supports TXT, LOG, CSV, JSON, MD files • Max 50MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.log,.csv,.json,.md,.markdown"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Current Pattern Display */}
            {pattern && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Pattern</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/30 rounded border font-mono text-sm">{pattern}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Flags:{" "}
                    {Object.entries(settings.flags)
                      .filter(([_, enabled]) => enabled)
                      .map(([flag, _]) => {
                        switch (flag) {
                          case "global":
                            return "g"
                          case "ignoreCase":
                            return "i"
                          case "multiline":
                            return "m"
                          case "dotAll":
                            return "s"
                          case "unicode":
                            return "u"
                          case "sticky":
                            return "y"
                          default:
                            return ""
                        }
                      })
                      .join("") || "none"}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            {totalStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalStats.totalFiles}</div>
                      <div className="text-sm text-muted-foreground">Files Tested</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalStats.totalMatches}</div>
                      <div className="text-sm text-muted-foreground">Total Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{totalStats.totalUniqueMatches}</div>
                      <div className="text-sm text-muted-foreground">Unique Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {totalStats.averageExecutionTime.toFixed(2)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Execution Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{totalStats.averageCoverage.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Avg Coverage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {formatFileSize(totalStats.totalTextLength)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Text Size</div>
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
                      onClick={testFiles}
                      disabled={isProcessing || !pattern.trim() || files.every((f) => f.status !== "pending")}
                      className="min-w-32"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Test Files
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => exportBatch(files, pattern)}
                      variant="outline"
                      disabled={!files.some((f) => f.status === "completed")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Results
                    </Button>

                    <Button
                      onClick={() => exportCSV(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.statistics)}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Export Stats
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
                  <CardTitle className="text-lg">Files</CardTitle>
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

                              {file.status === "completed" && file.statistics && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium mb-1">Test Results:</div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div>{file.statistics.totalMatches} matches</div>
                                    <div>{file.statistics.uniqueMatches} unique</div>
                                    <div>{file.statistics.coverage.toFixed(1)}% coverage</div>
                                    <div>{file.statistics.executionTime.toFixed(2)}ms</div>
                                  </div>
                                </div>
                              )}

                              {file.status === "pending" && <div className="text-blue-600">Ready for testing</div>}
                              {file.status === "processing" && (
                                <div className="text-blue-600 flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Testing...
                                </div>
                              )}
                              {file.error && <div className="text-red-600">Error: {file.error}</div>}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {file.status === "completed" && file.matches && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(file.matches!.map((m) => m.match).join("\n"), file.id)}
                                >
                                  {copiedText === file.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    exportMatches(file.matches!, file.name.replace(/\.[^/.]+$/, "-matches.txt"))
                                  }
                                >
                                  <Download className="h-4 w-4" />
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

                        {file.status === "completed" && file.matches && file.matches.length > 0 && (
                          <div className="mt-4">
                            <div className="text-xs font-medium mb-2">Sample Matches (showing first 3):</div>
                            <div className="space-y-1">
                              {file.matches.slice(0, 3).map((match, index) => (
                                <div
                                  key={index}
                                  className="p-2 bg-muted/30 rounded text-xs"
                                >
                                  <div className="font-mono break-all">{match.match}</div>
                                  <div className="text-muted-foreground">
                                    Position: {match.index}-{match.index + match.length}
                                  </div>
                                </div>
                              ))}
                              {file.matches.length > 3 && (
                                <div className="text-xs text-muted-foreground text-center py-1">
                                  ... and {file.matches.length - 3} more matches
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
const RegexTester = () => {
  return <RegexTesterCore />
}

export default RegexTester
