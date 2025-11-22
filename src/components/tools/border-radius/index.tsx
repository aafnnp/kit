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
  Code,
  Upload,
  FileImage,
  Trash2,
  Target,
  Copy,
  Check,
  Eye,
  Shuffle,
  RotateCcw,
  Zap,
  Square,
  Circle,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  BorderRadius,
  BorderRadiusCorners,
  BorderRadiusAccessibility,
  BorderRadiusSettings,
  BorderRadiusTemplate,
  BorderRadiusType,
  BorderRadiusUnit,
  ExportFormat,
  BorderRadiusFile,
} from "@/schemas/border-radius.schema"
import { formatFileSize } from "@/lib/utils"

// Utility functions

const validateBorderRadiusFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [".json", ".css", ".scss", ".txt"]

  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 10MB" }
  }

  const extension = "." + file.name.split(".").pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: "Only JSON, CSS, SCSS, and TXT files are supported" }
  }

  return { isValid: true }
}

// Border radius generation functions
const generateUniformBorderRadius = (radius: number, unit: BorderRadiusUnit): string => {
  return `border-radius: ${radius}${unit};`
}

const generateIndividualBorderRadius = (corners: BorderRadiusCorners): string => {
  const { topLeft, topRight, bottomRight, bottomLeft, unit } = corners

  // Check if all corners are the same
  if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
    return `border-radius: ${topLeft}${unit};`
  }

  // Use shorthand when possible
  if (topLeft === bottomRight && topRight === bottomLeft) {
    return `border-radius: ${topLeft}${unit} ${topRight}${unit};`
  }

  return `border-radius: ${topLeft}${unit} ${topRight}${unit} ${bottomRight}${unit} ${bottomLeft}${unit};`
}

const generatePercentageBorderRadius = (corners: BorderRadiusCorners): string => {
  const { topLeft, topRight, bottomRight, bottomLeft } = corners

  // Convert to percentage values (assuming max 50% for circular)
  const maxRadius = 50
  const tl = Math.min(topLeft, maxRadius)
  const tr = Math.min(topRight, maxRadius)
  const br = Math.min(bottomRight, maxRadius)
  const bl = Math.min(bottomLeft, maxRadius)

  if (tl === tr && tr === br && br === bl) {
    return `border-radius: ${tl}%;`
  }

  if (tl === br && tr === bl) {
    return `border-radius: ${tl}% ${tr}%;`
  }

  return `border-radius: ${tl}% ${tr}% ${br}% ${bl}%;`
}

const analyzeBorderRadiusAccessibility = (corners: BorderRadiusCorners): BorderRadiusAccessibility => {
  const { topLeft, topRight, bottomRight, bottomLeft } = corners
  const values = [topLeft, topRight, bottomRight, bottomLeft]

  // Check uniformity
  const uniqueValues = [...new Set(values)]
  const uniformity = uniqueValues.length === 1 ? "uniform" : "mixed"

  // Determine readability impact
  const maxRadius = Math.max(...values)
  let readabilityImpact: "none" | "minimal" | "moderate" = "none"

  if (maxRadius > 50) readabilityImpact = "moderate"
  else if (maxRadius > 20) readabilityImpact = "minimal"

  // Design consistency
  let designConsistency: "consistent" | "varied" | "chaotic" = "consistent"
  const variance = Math.max(...values) - Math.min(...values)

  if (variance > 30) designConsistency = "chaotic"
  else if (variance > 10) designConsistency = "varied"

  // Usability score (0-100)
  let usabilityScore = 100
  if (readabilityImpact === "minimal") usabilityScore -= 10
  if (readabilityImpact === "moderate") usabilityScore -= 25
  if (designConsistency === "varied") usabilityScore -= 10
  if (designConsistency === "chaotic") usabilityScore -= 30

  return {
    uniformity,
    readabilityImpact,
    designConsistency,
    usabilityScore: Math.max(0, usabilityScore),
  }
}

// Create complete border radius object
const createBorderRadius = (type: BorderRadiusType, corners: BorderRadiusCorners): BorderRadius => {
  const id = nanoid()

  let css = ""
  switch (type) {
    case "uniform":
      css = generateUniformBorderRadius(corners.topLeft, corners.unit)
      break
    case "individual":
      css = generateIndividualBorderRadius(corners)
      break
    case "percentage":
      css = generatePercentageBorderRadius(corners)
      break
  }

  const borderRadius: BorderRadius = {
    id,
    type,
    corners,
    css,
    accessibility: analyzeBorderRadiusAccessibility(corners),
  }

  return borderRadius
}

// Border radius templates
const borderRadiusTemplates: BorderRadiusTemplate[] = [
  {
    id: "none",
    name: "None",
    description: "No border radius",
    category: "Basic",
    borderRadius: {
      type: "uniform",
      corners: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0, unit: "px" },
    },
    preview: "0px",
  },
  {
    id: "small",
    name: "Small",
    description: "Small rounded corners",
    category: "Basic",
    borderRadius: {
      type: "uniform",
      corners: { topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4, unit: "px" },
    },
    preview: "4px",
  },
  {
    id: "medium",
    name: "Medium",
    description: "Medium rounded corners",
    category: "Basic",
    borderRadius: {
      type: "uniform",
      corners: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8, unit: "px" },
    },
    preview: "8px",
  },
  {
    id: "large",
    name: "Large",
    description: "Large rounded corners",
    category: "Basic",
    borderRadius: {
      type: "uniform",
      corners: { topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16, unit: "px" },
    },
    preview: "16px",
  },
  {
    id: "xl",
    name: "Extra Large",
    description: "Extra large rounded corners",
    category: "Basic",
    borderRadius: {
      type: "uniform",
      corners: { topLeft: 24, topRight: 24, bottomRight: 24, bottomLeft: 24, unit: "px" },
    },
    preview: "24px",
  },
  {
    id: "full",
    name: "Full",
    description: "Fully rounded (circular)",
    category: "Special",
    borderRadius: {
      type: "percentage",
      corners: { topLeft: 50, topRight: 50, bottomRight: 50, bottomLeft: 50, unit: "%" },
    },
    preview: "50%",
  },
  {
    id: "pill",
    name: "Pill",
    description: "Pill-shaped (9999px)",
    category: "Special",
    borderRadius: {
      type: "uniform",
      corners: { topLeft: 9999, topRight: 9999, bottomRight: 9999, bottomLeft: 9999, unit: "px" },
    },
    preview: "9999px",
  },
  {
    id: "top-only",
    name: "Top Only",
    description: "Rounded top corners only",
    category: "Individual",
    borderRadius: {
      type: "individual",
      corners: { topLeft: 12, topRight: 12, bottomRight: 0, bottomLeft: 0, unit: "px" },
    },
    preview: "12px 12px 0 0",
  },
  {
    id: "bottom-only",
    name: "Bottom Only",
    description: "Rounded bottom corners only",
    category: "Individual",
    borderRadius: {
      type: "individual",
      corners: { topLeft: 0, topRight: 0, bottomRight: 12, bottomLeft: 12, unit: "px" },
    },
    preview: "0 0 12px 12px",
  },
  {
    id: "left-only",
    name: "Left Only",
    description: "Rounded left corners only",
    category: "Individual",
    borderRadius: {
      type: "individual",
      corners: { topLeft: 12, topRight: 0, bottomRight: 0, bottomLeft: 12, unit: "px" },
    },
    preview: "12px 0 0 12px",
  },
  {
    id: "right-only",
    name: "Right Only",
    description: "Rounded right corners only",
    category: "Individual",
    borderRadius: {
      type: "individual",
      corners: { topLeft: 0, topRight: 12, bottomRight: 12, bottomLeft: 0, unit: "px" },
    },
    preview: "0 12px 12px 0",
  },
  {
    id: "asymmetric",
    name: "Asymmetric",
    description: "Different radius for each corner",
    category: "Creative",
    borderRadius: {
      type: "individual",
      corners: { topLeft: 20, topRight: 5, bottomRight: 15, bottomLeft: 10, unit: "px" },
    },
    preview: "20px 5px 15px 10px",
  },
]

// Real-time border radius preview hook
const useRealTimeBorderRadius = (type: BorderRadiusType, corners: BorderRadiusCorners) => {
  return useMemo(() => {
    try {
      const borderRadius = createBorderRadius(type, corners)
      return {
        borderRadius,
        error: null,
        isEmpty: false,
      }
    } catch (error) {
      return {
        borderRadius: null,
        error: error instanceof Error ? error.message : "Border radius generation failed",
        isEmpty: false,
      }
    }
  }, [type, corners])
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<BorderRadiusFile> => {
    const validation = validateBorderRadiusFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const borderRadiusFile: BorderRadiusFile = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type || "text/plain",
            status: "pending",
          }

          resolve(borderRadiusFile)
        } catch (error) {
          reject(new Error("Failed to process file"))
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<BorderRadiusFile[]> => {
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
const useBorderRadiusExport = () => {
  const exportBorderRadius = useCallback((borderRadius: BorderRadius, format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "css":
        content = `.border-radius {\n  ${borderRadius.css}\n}`
        mimeType = "text/css"
        extension = ".css"
        break
      case "scss":
        content = `$border-radius: ${borderRadius.css.split(": ")[1]};\n\n.border-radius {\n  border-radius: $border-radius;\n}`
        mimeType = "text/scss"
        extension = ".scss"
        break
      case "tailwind":
        content = generateTailwindClasses(borderRadius)
        mimeType = "text/plain"
        extension = ".txt"
        break
      case "json":
        content = JSON.stringify(
          {
            id: borderRadius.id,
            type: borderRadius.type,
            corners: borderRadius.corners,
            css: borderRadius.css,
            accessibility: borderRadius.accessibility,
          },
          null,
          2
        )
        mimeType = "application/json"
        extension = ".json"
        break
      default:
        content = borderRadius.css
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `border-radius${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: BorderRadiusFile[]) => {
      const completedFiles = files.filter((f) => f.borderRadiusData)

      if (completedFiles.length === 0) {
        toast.error("No border radius configurations to export")
        return
      }

      completedFiles.forEach((file) => {
        if (file.borderRadiusData) {
          file.borderRadiusData.borderRadii.forEach((borderRadius, index) => {
            const baseName = file.name.replace(/\.[^/.]+$/, "")
            exportBorderRadius(borderRadius, "css", `${baseName}-border-radius-${index + 1}.css`)
          })
        }
      })

      toast.success(`Exported border radius from ${completedFiles.length} file(s)`)
    },
    [exportBorderRadius]
  )

  const exportStatistics = useCallback((files: BorderRadiusFile[]) => {
    const stats = files
      .filter((f) => f.borderRadiusData)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.size),
        totalBorderRadii: file.borderRadiusData!.statistics.totalBorderRadii,
        averageRadius: file.borderRadiusData!.statistics.averageRadius.toFixed(1),
        uniformityRatio: (file.borderRadiusData!.statistics.uniformityRatio * 100).toFixed(1) + "%",
        accessibilityScore: file.borderRadiusData!.statistics.accessibilityScore.toFixed(1),
        processingTime: `${file.borderRadiusData!.statistics.processingTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      [
        "Filename",
        "Original Size",
        "Total Border Radii",
        "Avg Radius",
        "Uniformity Ratio",
        "Accessibility Score",
        "Processing Time",
        "Status",
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.totalBorderRadii.toString(),
        stat.averageRadius,
        stat.uniformityRatio,
        stat.accessibilityScore,
        stat.processingTime,
        stat.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "border-radius-statistics.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Statistics exported")
  }, [])

  return { exportBorderRadius, exportBatch, exportStatistics }
}

// Generate Tailwind classes
const generateTailwindClasses = (borderRadius: BorderRadius): string => {
  const { corners } = borderRadius

  // Simplified Tailwind class generation
  if (
    corners.topLeft === corners.topRight &&
    corners.topRight === corners.bottomRight &&
    corners.bottomRight === corners.bottomLeft
  ) {
    // Uniform radius
    const radius = corners.topLeft
    if (radius === 0) return "rounded-none"
    if (radius <= 2) return "rounded-sm"
    if (radius <= 4) return "rounded"
    if (radius <= 6) return "rounded-md"
    if (radius <= 8) return "rounded-lg"
    if (radius <= 12) return "rounded-xl"
    if (radius <= 16) return "rounded-2xl"
    if (radius <= 24) return "rounded-3xl"
    if (radius >= 9999) return "rounded-full"
    return `rounded-[${radius}px]`
  }

  // Individual corners - use arbitrary values
  return `rounded-[${corners.topLeft}px_${corners.topRight}px_${corners.bottomRight}px_${corners.bottomLeft}px]`
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

      const files = Array.from(e.dataTransfer.files).filter((file) => file.name.match(/\.(json|css|scss|txt)$/i))

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error("Please drop only JSON, CSS, SCSS, or TXT files")
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
 * Enhanced Border Radius Tool
 * Features: Real-time border radius generation, multiple types, batch processing, accessibility analysis
 */
const BorderRadiusCore = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "files">("generator")
  const [borderRadiusType, setBorderRadiusType] = useState<BorderRadiusType>("uniform")
  const [corners, setCorners] = useState<BorderRadiusCorners>({
    topLeft: 8,
    topRight: 8,
    bottomRight: 8,
    bottomLeft: 8,
    unit: "px",
  })
  const [files, setFiles] = useState<BorderRadiusFile[]>([])
  const [_, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("medium")
  const [settings, setSettings] = useState<BorderRadiusSettings>({
    defaultType: "uniform",
    defaultUnit: "px",
    maxRadius: 100,
    includeAccessibility: true,
    optimizeOutput: false,
    exportFormat: "css",
  })

  const { exportBorderRadius } = useBorderRadiusExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Real-time border radius generation
  const borderRadiusPreview = useRealTimeBorderRadius(borderRadiusType, corners)

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
    const template = borderRadiusTemplates.find((t) => t.id === templateId)
    if (template && template.borderRadius) {
      if (template.borderRadius.type) setBorderRadiusType(template.borderRadius.type)
      if (template.borderRadius.corners) setCorners(template.borderRadius.corners)

      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Corner management
  const updateCorner = useCallback((corner: keyof Omit<BorderRadiusCorners, "unit">, value: number) => {
    setCorners((prev) => ({ ...prev, [corner]: value }))
  }, [])

  const updateUnit = useCallback((unit: BorderRadiusUnit) => {
    setCorners((prev) => ({ ...prev, unit }))
  }, [])

  const setUniformRadius = useCallback((value: number) => {
    setCorners((prev) => ({
      ...prev,
      topLeft: value,
      topRight: value,
      bottomRight: value,
      bottomLeft: value,
    }))
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
              <Circle className="h-5 w-5" />
              Border Radius Generator
            </CardTitle>
            <CardDescription>
              Advanced border radius generator with support for uniform, individual corners, and percentage values,
              accessibility analysis, and batch processing. Use keyboard navigation: Tab to move between controls, Enter
              or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "generator" | "files")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="generator"
              className="flex items-center gap-2"
            >
              <Circle className="h-4 w-4" />
              Border Radius Generator
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Border Radius Generator Tab */}
          <TabsContent
            value="generator"
            className="space-y-4"
          >
            {/* Border Radius Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Border Radius Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {borderRadiusTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? "default" : "outline"}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div
                          className="w-full h-8 rounded mt-2 border bg-white"
                          style={{ borderRadius: template.preview }}
                          title={template.preview}
                        />
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Border Radius Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Border Radius Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="border-radius-type">Border Radius Type</Label>
                    <Select
                      value={borderRadiusType}
                      onValueChange={(value: BorderRadiusType) => setBorderRadiusType(value)}
                    >
                      <SelectTrigger id="border-radius-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uniform">Uniform</SelectItem>
                        <SelectItem value="individual">Individual Corners</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={corners.unit}
                      onValueChange={(value: BorderRadiusUnit) => updateUnit(value)}
                    >
                      <SelectTrigger id="unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="px">Pixels (px)</SelectItem>
                        <SelectItem value="rem">Root EM (rem)</SelectItem>
                        <SelectItem value="em">EM (em)</SelectItem>
                        <SelectItem value="%">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {borderRadiusType === "uniform" && (
                    <div className="space-y-2">
                      <Label htmlFor="uniform-radius">
                        Radius: {corners.topLeft}
                        {corners.unit}
                      </Label>
                      <Input
                        id="uniform-radius"
                        type="range"
                        min="0"
                        max={corners.unit === "%" ? "50" : "100"}
                        value={corners.topLeft}
                        onChange={(e) => setUniformRadius(Number(e.target.value))}
                        className="w-full"
                      />
                      <Input
                        type="number"
                        min="0"
                        max={corners.unit === "%" ? 50 : 100}
                        value={corners.topLeft}
                        onChange={(e) => setUniformRadius(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}

                  {borderRadiusType === "individual" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="top-left">
                            Top Left: {corners.topLeft}
                            {corners.unit}
                          </Label>
                          <Input
                            id="top-left"
                            type="range"
                            min="0"
                            max={corners.unit === "%" ? "50" : "100"}
                            value={corners.topLeft}
                            onChange={(e) => updateCorner("topLeft", Number(e.target.value))}
                          />
                          <Input
                            type="number"
                            min="0"
                            value={corners.topLeft}
                            onChange={(e) => updateCorner("topLeft", Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="top-right">
                            Top Right: {corners.topRight}
                            {corners.unit}
                          </Label>
                          <Input
                            id="top-right"
                            type="range"
                            min="0"
                            max={corners.unit === "%" ? "50" : "100"}
                            value={corners.topRight}
                            onChange={(e) => updateCorner("topRight", Number(e.target.value))}
                          />
                          <Input
                            type="number"
                            min="0"
                            value={corners.topRight}
                            onChange={(e) => updateCorner("topRight", Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="bottom-left">
                            Bottom Left: {corners.bottomLeft}
                            {corners.unit}
                          </Label>
                          <Input
                            id="bottom-left"
                            type="range"
                            min="0"
                            max={corners.unit === "%" ? "50" : "100"}
                            value={corners.bottomLeft}
                            onChange={(e) => updateCorner("bottomLeft", Number(e.target.value))}
                          />
                          <Input
                            type="number"
                            min="0"
                            value={corners.bottomLeft}
                            onChange={(e) => updateCorner("bottomLeft", Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bottom-right">
                            Bottom Right: {corners.bottomRight}
                            {corners.unit}
                          </Label>
                          <Input
                            id="bottom-right"
                            type="range"
                            min="0"
                            max={corners.unit === "%" ? "50" : "100"}
                            value={corners.bottomRight}
                            onChange={(e) => updateCorner("bottomRight", Number(e.target.value))}
                          />
                          <Input
                            type="number"
                            min="0"
                            value={corners.bottomRight}
                            onChange={(e) => updateCorner("bottomRight", Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {borderRadiusType === "percentage" && (
                    <div className="space-y-2">
                      <Label htmlFor="percentage-radius">Radius: {corners.topLeft}%</Label>
                      <Input
                        id="percentage-radius"
                        type="range"
                        min="0"
                        max="50"
                        value={corners.topLeft}
                        onChange={(e) => setUniformRadius(Number(e.target.value))}
                        className="w-full"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={corners.topLeft}
                        onChange={(e) => setUniformRadius(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      id="accessibility"
                      type="checkbox"
                      checked={settings.includeAccessibility}
                      onChange={(e) => setSettings((prev) => ({ ...prev, includeAccessibility: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="accessibility"
                      className="text-sm"
                    >
                      Include Accessibility Analysis
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Border Radius Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {borderRadiusPreview.error ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <Circle className="h-4 w-4" />
                        <span className="font-medium">Border Radius Generation Error</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{borderRadiusPreview.error}</p>
                    </div>
                  ) : borderRadiusPreview.borderRadius ? (
                    <div className="space-y-4">
                      {/* Border Radius Display */}
                      <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div
                          className="w-32 h-32 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600"
                          style={{
                            borderRadius: borderRadiusPreview.borderRadius.css.split(": ")[1].replace(";", ""),
                          }}
                        />
                      </div>

                      {/* CSS Output */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">CSS Code</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(borderRadiusPreview.borderRadius!.css, "CSS border radius")}
                          >
                            {copiedText === "CSS border radius" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Textarea
                          value={borderRadiusPreview.borderRadius.css}
                          readOnly
                          className="font-mono text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Configure border radius settings to see preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const randomRadius = Math.floor(Math.random() * 50)
                      setUniformRadius(randomRadius)
                    }}
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Random
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCorners({ topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0, unit: "px" })
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCorners((prev) => ({
                        ...prev,
                        topLeft: 50,
                        topRight: 50,
                        bottomRight: 50,
                        bottomLeft: 50,
                        unit: "%",
                      }))
                      setBorderRadiusType("percentage")
                    }}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Make Circle
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Analysis */}
            {borderRadiusPreview.borderRadius && settings.includeAccessibility && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Accessibility Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Uniformity</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span
                            className={`font-medium ${borderRadiusPreview.borderRadius.accessibility.uniformity === "uniform" ? "text-green-600" : "text-yellow-600"}`}
                          >
                            {borderRadiusPreview.borderRadius.accessibility.uniformity === "uniform"
                              ? "Uniform"
                              : "Mixed"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Design Consistency</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span
                            className={`font-medium ${
                              borderRadiusPreview.borderRadius.accessibility.designConsistency === "consistent"
                                ? "text-green-600"
                                : borderRadiusPreview.borderRadius.accessibility.designConsistency === "varied"
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {borderRadiusPreview.borderRadius.accessibility.designConsistency.charAt(0).toUpperCase() +
                              borderRadiusPreview.borderRadius.accessibility.designConsistency.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Readability Impact</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span
                            className={`font-medium ${
                              borderRadiusPreview.borderRadius.accessibility.readabilityImpact === "none"
                                ? "text-green-600"
                                : borderRadiusPreview.borderRadius.accessibility.readabilityImpact === "minimal"
                                  ? "text-green-600"
                                  : "text-yellow-600"
                            }`}
                          >
                            {borderRadiusPreview.borderRadius.accessibility.readabilityImpact.charAt(0).toUpperCase() +
                              borderRadiusPreview.borderRadius.accessibility.readabilityImpact.slice(1)}{" "}
                            Impact
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Usability Score</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-lg">
                              {borderRadiusPreview.borderRadius.accessibility.usabilityScore}%
                            </span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${borderRadiusPreview.borderRadius.accessibility.usabilityScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Actions */}
            {borderRadiusPreview.borderRadius && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={() => exportBorderRadius(borderRadiusPreview.borderRadius!, "css")}
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSS
                    </Button>

                    <Button
                      onClick={() => exportBorderRadius(borderRadiusPreview.borderRadius!, "scss")}
                      variant="outline"
                    >
                      <Code className="mr-2 h-4 w-4" />
                      Export SCSS
                    </Button>

                    <Button
                      onClick={() => exportBorderRadius(borderRadiusPreview.borderRadius!, "tailwind")}
                      variant="outline"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Tailwind Classes
                    </Button>

                    <Button
                      onClick={() => exportBorderRadius(borderRadiusPreview.borderRadius!, "json")}
                      variant="outline"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>

                    <Button
                      onClick={() => copyToClipboard(borderRadiusPreview.borderRadius!.css, "border radius CSS")}
                      variant="outline"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy CSS
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
                  <h3 className="text-lg font-semibold mb-2">Upload Border Radius Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your border radius configuration files here, or click to select files
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
                    Supports JSON, CSS, SCSS, and TXT files • Max 10MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".json,.css,.scss,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

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
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Size:</span> {formatFileSize(file.size)}
                            </div>
                            {file.status === "completed" && file.borderRadiusData && (
                              <div className="mt-2 text-xs">
                                {file.borderRadiusData.statistics.totalBorderRadii} border radius configurations
                                processed
                              </div>
                            )}
                            {file.error && <div className="text-red-600 text-sm">Error: {file.error}</div>}
                          </div>
                          <div className="shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
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
const BorderRadius = () => {
  return <BorderRadiusCore />
}

export default BorderRadius
