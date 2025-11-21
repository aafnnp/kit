import React, { useCallback, useRef, useState, useMemo } from "react"
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
  FileText,
  Loader2,
  RefreshCw,
  FileDown,
  Code,
  Upload,
  FileImage,
  Trash2,
  Settings,
  Target,
  Copy,
  Check,
  BarChart3,
  BookOpen,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  TextFile,
  PDFResult,
  PDFSettings,
  PDFStatistics,
  PDFTemplate,
  PageSize,
  FontFamily,
  TextAlign,
} from "@/types/text-to-pdf"
import { formatFileSize } from "@/lib/utils"

// Utility functions

const validateTextFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = [
    ".txt",
    ".text",
    ".log",
    ".csv",
    ".json",
    ".md",
    ".markdown",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".h",
    ".css",
    ".html",
    ".xml",
    ".yaml",
    ".yml",
  ]

  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 50MB" }
  }

  const extension = "." + file.name.split(".").pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: "Only text files are supported" }
  }

  return { isValid: true }
}

// PDF Templates
const pdfTemplates: PDFTemplate[] = [
  {
    id: "default",
    name: "Default",
    description: "Standard document with basic formatting",
    settings: {
      pageSize: "A4",
      orientation: "portrait",
      font: { family: "Arial", size: 12, lineHeight: 1.5 },
      styling: {
        textAlign: "left",
        textColor: "#000000",
        backgroundColor: "#ffffff",
        enableSyntaxHighlighting: false,
      },
    },
    preview: "Simple, clean layout with standard margins",
  },
  {
    id: "report",
    name: "Report",
    description: "Professional report with headers and footers",
    settings: {
      pageSize: "A4",
      orientation: "portrait",
      font: { family: "Times", size: 11, lineHeight: 1.6 },
      header: { enabled: true, text: "Report Title", fontSize: 14, alignment: "center" },
      footer: { enabled: true, text: "Confidential", fontSize: 9, alignment: "center", showPageNumbers: true },
      tableOfContents: { enabled: true, title: "Table of Contents", maxDepth: 3 },
    },
    preview: "Professional layout with headers, footers, and table of contents",
  },
  {
    id: "code",
    name: "Code Documentation",
    description: "Optimized for code and technical documentation",
    settings: {
      pageSize: "A4",
      orientation: "portrait",
      font: { family: "Courier", size: 10, lineHeight: 1.4 },
      styling: {
        textAlign: "left",
        enableSyntaxHighlighting: true,
        textColor: "",
        backgroundColor: "",
      },
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
    },
    preview: "Monospace font with syntax highlighting for code",
  },
  {
    id: "book",
    name: "Book",
    description: "Book-style layout with justified text",
    settings: {
      pageSize: "A5",
      orientation: "portrait",
      font: { family: "Georgia", size: 11, lineHeight: 1.8 },
      styling: {
        textAlign: "justify",
        textColor: "",
        backgroundColor: "",
        enableSyntaxHighlighting: false,
      },
      margins: { top: 25, right: 20, bottom: 25, left: 25 },
      footer: { enabled: true, text: "", fontSize: 9, alignment: "center", showPageNumbers: true },
    },
    preview: "Book-style layout with justified text and page numbers",
  },
  {
    id: "presentation",
    name: "Presentation",
    description: "Large text for presentations and handouts",
    settings: {
      pageSize: "A4",
      orientation: "landscape",
      font: { family: "Helvetica", size: 16, lineHeight: 2.0 },
      styling: {
        textAlign: "center",
        textColor: "",
        backgroundColor: "",
        enableSyntaxHighlighting: false,
      },
      margins: { top: 30, right: 30, bottom: 30, left: 30 },
    },
    preview: "Large text in landscape orientation for presentations",
  },
]

// PDF Generation Engine (using jsPDF as fallback for client-side generation)
const generatePDF = async (content: string, settings: PDFSettings, filename: string): Promise<PDFResult> => {
  const startTime = performance.now()

  try {
    // For now, we'll use the existing API but with enhanced settings
    const BASE_URL = "https://services-iota-sand.vercel.app"

    const requestBody = {
      title: settings.metadata.title || filename,
      content,
      settings: {
        pageSize: settings.pageSize,
        orientation: settings.orientation,
        margins: settings.margins,
        font: settings.font,
        styling: settings.styling,
        header: settings.header,
        footer: settings.footer,
        tableOfContents: settings.tableOfContents,
        metadata: settings.metadata,
      },
    }

    const response = await fetch(`${BASE_URL}/pdf/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.statusText}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    // Estimate page count (rough calculation)
    const wordsPerPage = 250
    const wordCount = content.split(/\s+/).length
    const estimatedPageCount = Math.max(1, Math.ceil(wordCount / wordsPerPage))

    const result: PDFResult = {
      blob,
      url,
      filename,
      size: blob.size,
      pageCount: estimatedPageCount,
      generationTime: performance.now() - startTime,
      settings,
    }

    return result
  } catch (error) {
    console.error("PDF generation error:", error)
    throw new Error(error instanceof Error ? error.message : "PDF generation failed")
  }
}

// Download PDF file
const downloadPDF = (result: PDFResult): void => {
  const link = document.createElement("a")
  link.href = result.url
  link.download = result.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Custom hooks
const usePDFGeneration = () => {
  const generateSinglePDF = useCallback(
    async (content: string, settings: PDFSettings, filename: string): Promise<PDFResult> => {
      try {
        return await generatePDF(content, settings, filename)
      } catch (error) {
        console.error("PDF generation error:", error)
        throw new Error(error instanceof Error ? error.message : "PDF generation failed")
      }
    },
    []
  )

  const generateBatchPDF = useCallback(
    async (files: TextFile[], settings: PDFSettings): Promise<TextFile[]> => {
      return Promise.all(
        files.map(async (file) => {
          if (file.status !== "pending") return file

          try {
            const filename = file.name.replace(/\.[^/.]+$/, ".pdf")
            const result = await generateSinglePDF(file.content, settings, filename)

            return {
              ...file,
              status: "completed" as const,
              pdfResult: result,
              processedAt: new Date(),
            }
          } catch (error) {
            return {
              ...file,
              status: "error" as const,
              error: error instanceof Error ? error.message : "PDF generation failed",
            }
          }
        })
      )
    },
    [generateSinglePDF]
  )

  return { generateSinglePDF, generateBatchPDF }
}

// Real-time PDF preview hook (for statistics and validation)
const useRealTimePDFPreview = (content: string, settings: PDFSettings) => {
  return useMemo(() => {
    if (!content.trim()) {
      return {
        wordCount: 0,
        characterCount: 0,
        lineCount: 0,
        estimatedPages: 0,
        estimatedSize: 0,
        readingTime: 0,
      }
    }

    const words = content.trim().split(/\s+/)
    const wordCount = words.length
    const characterCount = content.length
    const lineCount = content.split("\n").length

    // Estimate pages based on words per page (varies by font size and margins)
    const wordsPerPage = Math.max(200, 400 - (settings.font.size - 10) * 20)
    const estimatedPages = Math.max(1, Math.ceil(wordCount / wordsPerPage))

    // Estimate PDF size (very rough calculation)
    const estimatedSize = Math.max(5000, characterCount * 2 + estimatedPages * 1000)

    // Calculate reading time (average 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200)

    return {
      wordCount,
      characterCount,
      lineCount,
      estimatedPages,
      estimatedSize,
      readingTime,
    }
  }, [content, settings.font.size])
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

// PDF export functionality
const usePDFExport = () => {
  const exportSingle = useCallback((result: PDFResult) => {
    downloadPDF(result)
    toast.success(`PDF exported: ${result.filename}`)
  }, [])

  const exportBatch = useCallback((files: TextFile[]) => {
    const completedFiles = files.filter((f) => f.pdfResult)

    if (completedFiles.length === 0) {
      toast.error("No PDFs to export")
      return
    }

    completedFiles.forEach((file) => {
      if (file.pdfResult) {
        downloadPDF(file.pdfResult)
      }
    })

    toast.success(`Exported ${completedFiles.length} PDF(s)`)
  }, [])

  const exportStatistics = useCallback((files: TextFile[]) => {
    const stats = files
      .filter((f) => f.pdfResult)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.size),
        pdfSize: formatFileSize(file.pdfResult!.size),
        pageCount: file.pdfResult!.pageCount,
        generationTime: `${file.pdfResult!.generationTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      ["Filename", "Original Size", "PDF Size", "Pages", "Generation Time", "Status"],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.pdfSize,
        stat.pageCount.toString(),
        stat.generationTime,
        stat.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "pdf-generation-statistics.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Statistics exported")
  }, [])

  return { exportSingle, exportBatch, exportStatistics }
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
          file.name.match(/\.(txt|text|log|csv|json|md|markdown|js|ts|jsx|tsx|py|java|cpp|c|h|css|html|xml|yaml|yml)$/i)
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
 * Enhanced Text to PDF Tool
 * Features: Real-time preview, file upload, batch processing, customizable templates
 */
const TextToPDFCore = () => {
  const [activeTab, setActiveTab] = useState<"converter" | "files">("converter")
  const [text, setText] = useState(
    "Welcome to the Enhanced Text to PDF Converter!\n\nThis tool allows you to convert text to PDF with advanced customization options including:\n\n• Multiple page sizes and orientations\n• Custom fonts and styling\n• Headers and footers\n• Table of contents\n• Batch processing\n• Professional templates\n\nTry editing this text and see the real-time statistics update!"
  )
  const [files, setFiles] = useState<TextFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("default")
  const [settings, setSettings] = useState<PDFSettings>({
    pageSize: "A4",
    orientation: "portrait",
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
    font: {
      family: "Arial",
      size: 12,
      lineHeight: 1.5,
    },
    styling: {
      textAlign: "left",
      textColor: "#000000",
      backgroundColor: "#ffffff",
      enableSyntaxHighlighting: false,
    },
    header: {
      enabled: false,
      text: "",
      fontSize: 12,
      alignment: "center",
    },
    footer: {
      enabled: false,
      text: "",
      fontSize: 10,
      alignment: "center",
      showPageNumbers: false,
    },
    tableOfContents: {
      enabled: false,
      title: "Table of Contents",
      maxDepth: 3,
    },
    metadata: {
      title: "Document",
      author: "",
      subject: "",
      keywords: "",
    },
  })

  const { generateSinglePDF, generateBatchPDF } = usePDFGeneration()
  const { exportSingle, exportBatch, exportStatistics } = usePDFExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Real-time preview statistics
  const previewStats = useRealTimePDFPreview(text, settings)

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

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = pdfTemplates.find((t) => t.id === templateId)
    if (template) {
      setSettings((prev) => ({
        ...prev,
        ...template.settings,
      }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Generate single PDF
  const handleGeneratePDF = useCallback(async () => {
    if (!text.trim()) {
      toast.error("Please enter some text")
      return
    }

    setIsProcessing(true)
    try {
      const filename = `${settings.metadata.title || "document"}.pdf`
      const result = await generateSinglePDF(text, settings, filename)
      exportSingle(result)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF generation failed")
    } finally {
      setIsProcessing(false)
    }
  }, [text, settings, generateSinglePDF, exportSingle])

  // Process all files
  const processFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === "pending")
    if (pendingFiles.length === 0) {
      toast.error("No files to process")
      return
    }

    setIsProcessing(true)
    try {
      const updatedFiles = await generateBatchPDF(pendingFiles, settings)
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
  }, [files, settings, generateBatchPDF])

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
  const totalStats = useMemo((): PDFStatistics | null => {
    if (files.length === 0) return null

    const completedFiles = files.filter((f) => f.pdfResult)
    const failedFiles = files.filter((f) => f.status === "error")

    return {
      totalFiles: files.length,
      totalPages: completedFiles.reduce((sum, f) => sum + (f.pdfResult?.pageCount || 0), 0),
      totalSize: completedFiles.reduce((sum, f) => sum + (f.pdfResult?.size || 0), 0),
      averageGenerationTime:
        completedFiles.length > 0
          ? completedFiles.reduce((sum, f) => sum + (f.pdfResult?.generationTime || 0), 0) / completedFiles.length
          : 0,
      successfulConversions: completedFiles.length,
      failedConversions: failedFiles.length,
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
              <FileDown className="h-5 w-5" />
              Text to PDF Converter
            </CardTitle>
            <CardDescription>
              Convert text to PDF with advanced customization options, templates, and batch processing. Use keyboard
              navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "converter" | "files")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="converter"
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              Text Converter
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Text Converter Tab */}
          <TabsContent
            value="converter"
            className="space-y-4"
          >
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  PDF Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pdfTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? "default" : "outline"}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.preview}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* PDF Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  PDF Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pageSize">Page Size</Label>
                    <Select
                      value={settings.pageSize}
                      onValueChange={(value: PageSize) => setSettings((prev) => ({ ...prev, pageSize: value }))}
                    >
                      <SelectTrigger id="pageSize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="A5">A5</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                        <SelectItem value="Tabloid">Tabloid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orientation">Orientation</Label>
                    <Select
                      value={settings.orientation}
                      onValueChange={(value: "portrait" | "landscape") =>
                        setSettings((prev) => ({ ...prev, orientation: value }))
                      }
                    >
                      <SelectTrigger id="orientation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Select
                      value={settings.font.family}
                      onValueChange={(value: FontFamily) =>
                        setSettings((prev) => ({
                          ...prev,
                          font: { ...prev.font, family: value },
                        }))
                      }
                    >
                      <SelectTrigger id="fontFamily">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times">Times New Roman</SelectItem>
                        <SelectItem value="Courier">Courier New</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Input
                      id="fontSize"
                      type="number"
                      min="8"
                      max="72"
                      value={settings.font.size}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          font: { ...prev.font, size: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="textAlign">Text Alignment</Label>
                    <Select
                      value={settings.styling.textAlign}
                      onValueChange={(value: TextAlign) =>
                        setSettings((prev) => ({
                          ...prev,
                          styling: { ...prev.styling, textAlign: value },
                        }))
                      }
                    >
                      <SelectTrigger id="textAlign">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="justify">Justify</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lineHeight">Line Height</Label>
                    <Input
                      id="lineHeight"
                      type="number"
                      min="1"
                      max="3"
                      step="0.1"
                      value={settings.font.lineHeight}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          font: { ...prev.font, lineHeight: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Margins */}
                <div className="space-y-2">
                  <Label>Margins (mm)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label
                        htmlFor="marginTop"
                        className="text-xs"
                      >
                        Top
                      </Label>
                      <Input
                        id="marginTop"
                        type="number"
                        min="0"
                        max="50"
                        value={settings.margins.top}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            margins: { ...prev.margins, top: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="marginRight"
                        className="text-xs"
                      >
                        Right
                      </Label>
                      <Input
                        id="marginRight"
                        type="number"
                        min="0"
                        max="50"
                        value={settings.margins.right}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            margins: { ...prev.margins, right: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="marginBottom"
                        className="text-xs"
                      >
                        Bottom
                      </Label>
                      <Input
                        id="marginBottom"
                        type="number"
                        min="0"
                        max="50"
                        value={settings.margins.bottom}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            margins: { ...prev.margins, bottom: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="marginLeft"
                        className="text-xs"
                      >
                        Left
                      </Label>
                      <Input
                        id="marginLeft"
                        type="number"
                        min="0"
                        max="50"
                        value={settings.margins.left}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            margins: { ...prev.margins, left: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Text Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Text Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="text-content">Enter your text content</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(text, "text content")}
                      disabled={!text}
                    >
                      {copiedText === "text content" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Textarea
                    id="text-content"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter your text content here..."
                    className="min-h-[300px] font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Real-time Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Document Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                    <div className="text-lg font-bold text-blue-600">{previewStats.wordCount}</div>
                    <div className="text-xs text-muted-foreground">Words</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded">
                    <div className="text-lg font-bold text-green-600">{previewStats.characterCount}</div>
                    <div className="text-xs text-muted-foreground">Characters</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded">
                    <div className="text-lg font-bold text-purple-600">{previewStats.lineCount}</div>
                    <div className="text-xs text-muted-foreground">Lines</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded">
                    <div className="text-lg font-bold text-orange-600">{previewStats.estimatedPages}</div>
                    <div className="text-xs text-muted-foreground">Est. Pages</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded">
                    <div className="text-lg font-bold text-red-600">{formatFileSize(previewStats.estimatedSize)}</div>
                    <div className="text-xs text-muted-foreground">Est. PDF Size</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                    <div className="text-lg font-bold text-yellow-600">{previewStats.readingTime} min</div>
                    <div className="text-xs text-muted-foreground">Reading Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Document Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={settings.metadata.title}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          metadata: { ...prev.metadata, title: e.target.value },
                        }))
                      }
                      placeholder="Document title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={settings.metadata.author}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          metadata: { ...prev.metadata, author: e.target.value },
                        }))
                      }
                      placeholder="Author name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={settings.metadata.subject}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          metadata: { ...prev.metadata, subject: e.target.value },
                        }))
                      }
                      placeholder="Document subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input
                      id="keywords"
                      value={settings.metadata.keywords}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          metadata: { ...prev.metadata, keywords: e.target.value },
                        }))
                      }
                      placeholder="Comma-separated keywords"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate PDF Button */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center">
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={isProcessing || !text.trim()}
                    size="lg"
                    className="min-w-48"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Generate PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                    Supports TXT, LOG, CSV, JSON, MD, JS, TS, PY and other text files • Max 50MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.log,.csv,.json,.md,.markdown,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.xml,.yaml,.yml"
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
                      <div className="text-2xl font-bold text-green-600">{totalStats.successfulConversions}</div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{totalStats.failedConversions}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalStats.totalPages}</div>
                      <div className="text-sm text-muted-foreground">Total Pages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatFileSize(totalStats.totalSize)}</div>
                      <div className="text-sm text-muted-foreground">Total PDF Size</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {totalStats.averageGenerationTime.toFixed(2)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Generation Time</div>
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
                          Process Files
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => exportBatch(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.pdfResult)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download All PDFs
                    </Button>

                    <Button
                      onClick={() => exportStatistics(files)}
                      variant="outline"
                      disabled={!files.some((f) => f.pdfResult)}
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
                          <div className="flex-shrink-0">
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

                              {file.status === "completed" && file.pdfResult && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium mb-1">PDF Generated:</div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                    <div>{file.pdfResult.pageCount} pages</div>
                                    <div>{formatFileSize(file.pdfResult.size)}</div>
                                    <div>{file.pdfResult.generationTime.toFixed(2)}ms</div>
                                  </div>
                                </div>
                              )}

                              {file.status === "pending" && <div className="text-blue-600">Ready for processing</div>}
                              {file.status === "processing" && (
                                <div className="text-blue-600 flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Processing...
                                </div>
                              )}
                              {file.error && <div className="text-red-600">Error: {file.error}</div>}
                            </div>
                          </div>

                          <div className="flex-shrink-0 flex items-center gap-2">
                            {file.status === "completed" && file.pdfResult && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => exportSingle(file.pdfResult!)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(file.content, file.id)}
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
const TextToPDF = () => {
  return <TextToPDFCore />
}

export default TextToPDF
