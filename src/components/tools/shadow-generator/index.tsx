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
  Plus,
  Minus,
  RotateCcw,
  Layers,
  Zap,
  Square,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  ShadowFile,
  Shadow,
  ShadowLayer,
  ShadowAccessibility,
  ShadowSettings,
  ShadowTemplate,
  ShadowType,
  ExportFormat,
} from "@/schemas/shadow-generator.schema"
import { formatFileSize } from "@/lib/utils"
// Types

// Utility functions

const validateShadowFile = (file: File): { isValid: boolean; error?: string } => {
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

// Shadow generation functions
const generateBoxShadow = (layers: ShadowLayer[], unit: string = "px"): string => {
  if (layers.length === 0) return "none"

  return layers
    .map((layer) => {
      const insetStr = layer.inset ? "inset " : ""
      const spreadStr = layer.spread !== undefined ? ` ${layer.spread}${unit}` : ""
      const color = layer.opacity < 1 ? hexToRgba(layer.color, layer.opacity) : layer.color

      return `${insetStr}${layer.x}${unit} ${layer.y}${unit} ${layer.blur}${unit}${spreadStr} ${color}`
    })
    .join(", ")
}

const generateTextShadow = (layers: ShadowLayer[], unit: string = "px"): string => {
  if (layers.length === 0) return "none"

  return layers
    .map((layer) => {
      const color = layer.opacity < 1 ? hexToRgba(layer.color, layer.opacity) : layer.color
      return `${layer.x}${unit} ${layer.y}${unit} ${layer.blur}${unit} ${color}`
    })
    .join(", ")
}

const generateDropShadow = (layers: ShadowLayer[], unit: string = "px"): string => {
  if (layers.length === 0) return "none"

  // drop-shadow only supports single shadow, use first layer
  const layer = layers[0]
  const color = layer.opacity < 1 ? hexToRgba(layer.color, layer.opacity) : layer.color

  return `drop-shadow(${layer.x}${unit} ${layer.y}${unit} ${layer.blur}${unit} ${color})`
}

// Color utility functions
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex

  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const calculateLuminance = (hex: string): number => {
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!rgb) return 0

  const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((c) => {
    const val = parseInt(c, 16) / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const calculateContrastRatio = (color1: string, color2: string): number => {
  const lum1 = calculateLuminance(color1)
  const lum2 = calculateLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

const analyzeShadowAccessibility = (
  layers: ShadowLayer[],
  backgroundColor: string = "#ffffff"
): ShadowAccessibility => {
  if (layers.length === 0) {
    return {
      contrastRatio: 1,
      visibility: "low",
      readabilityImpact: "none",
      wcagCompliant: false,
    }
  }

  // Calculate average contrast ratio
  const avgContrastRatio =
    layers.reduce((sum, layer) => {
      return sum + calculateContrastRatio(layer.color, backgroundColor)
    }, 0) / layers.length

  // Determine visibility based on blur and opacity
  const avgBlur = layers.reduce((sum, layer) => sum + layer.blur, 0) / layers.length
  const avgOpacity = layers.reduce((sum, layer) => sum + layer.opacity, 0) / layers.length

  let visibility: "high" | "medium" | "low" = "low"
  if (avgOpacity > 0.7 && avgBlur < 10) visibility = "high"
  else if (avgOpacity > 0.4 && avgBlur < 20) visibility = "medium"

  // Determine readability impact
  let readabilityImpact: "none" | "minimal" | "moderate" | "significant" = "none"
  if (avgBlur > 20 || avgOpacity > 0.8) readabilityImpact = "significant"
  else if (avgBlur > 10 || avgOpacity > 0.5) readabilityImpact = "moderate"
  else if (avgBlur > 5 || avgOpacity > 0.2) readabilityImpact = "minimal"

  const wcagCompliant = avgContrastRatio >= 3 && readabilityImpact !== "significant"

  return {
    contrastRatio: Math.round(avgContrastRatio * 100) / 100,
    visibility,
    readabilityImpact,
    wcagCompliant,
  }
}

// Create complete shadow object
const createShadow = (type: ShadowType, layers: ShadowLayer[], unit: string = "px"): Shadow => {
  const id = nanoid()

  let css = ""
  switch (type) {
    case "box-shadow":
      css = `box-shadow: ${generateBoxShadow(layers, unit)};`
      break
    case "text-shadow":
      css = `text-shadow: ${generateTextShadow(layers, unit)};`
      break
    case "drop-shadow":
      css = `filter: ${generateDropShadow(layers, unit)};`
      break
  }

  const shadow: Shadow = {
    id,
    type,
    layers,
    css,
    accessibility: analyzeShadowAccessibility(layers),
  }

  return shadow
}

// Shadow templates
const shadowTemplates: ShadowTemplate[] = [
  {
    id: "subtle",
    name: "Subtle",
    description: "Light, barely visible shadow",
    category: "Basic",
    shadow: {
      type: "box-shadow",
      layers: [{ id: "1", x: 0, y: 1, blur: 3, spread: 0, color: "#000000", opacity: 0.12, inset: false }],
    },
    preview: "0 1px 3px rgba(0, 0, 0, 0.12)",
  },
  {
    id: "soft",
    name: "Soft",
    description: "Gentle, diffused shadow",
    category: "Basic",
    shadow: {
      type: "box-shadow",
      layers: [{ id: "1", x: 0, y: 4, blur: 6, spread: -1, color: "#000000", opacity: 0.1, inset: false }],
    },
    preview: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  {
    id: "medium",
    name: "Medium",
    description: "Balanced shadow for cards",
    category: "Basic",
    shadow: {
      type: "box-shadow",
      layers: [{ id: "1", x: 0, y: 10, blur: 15, spread: -3, color: "#000000", opacity: 0.1, inset: false }],
    },
    preview: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  },
  {
    id: "large",
    name: "Large",
    description: "Prominent shadow for modals",
    category: "Basic",
    shadow: {
      type: "box-shadow",
      layers: [{ id: "1", x: 0, y: 25, blur: 50, spread: -12, color: "#000000", opacity: 0.25, inset: false }],
    },
    preview: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
  {
    id: "inner",
    name: "Inner",
    description: "Inset shadow for depth",
    category: "Inset",
    shadow: {
      type: "box-shadow",
      layers: [{ id: "1", x: 0, y: 2, blur: 4, spread: 0, color: "#000000", opacity: 0.06, inset: true }],
    },
    preview: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
  },
  {
    id: "colored",
    name: "Colored",
    description: "Blue colored shadow",
    category: "Colored",
    shadow: {
      type: "box-shadow",
      layers: [{ id: "1", x: 0, y: 8, blur: 25, spread: 0, color: "#3b82f6", opacity: 0.3, inset: false }],
    },
    preview: "0 8px 25px rgba(59, 130, 246, 0.3)",
  },
  {
    id: "layered",
    name: "Layered",
    description: "Multiple shadow layers",
    category: "Complex",
    shadow: {
      type: "box-shadow",
      layers: [
        { id: "1", x: 0, y: 1, blur: 3, spread: 0, color: "#000000", opacity: 0.12, inset: false },
        { id: "2", x: 0, y: 1, blur: 2, spread: 0, color: "#000000", opacity: 0.24, inset: false },
      ],
    },
    preview: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
  },
  {
    id: "text-glow",
    name: "Text Glow",
    description: "Glowing text effect",
    category: "Text",
    shadow: {
      type: "text-shadow",
      layers: [{ id: "1", x: 0, y: 0, blur: 10, color: "#3b82f6", opacity: 0.8, inset: false }],
    },
    preview: "0 0 10px rgba(59, 130, 246, 0.8)",
  },
]

// Real-time shadow preview hook
const useRealTimeShadow = (type: ShadowType, layers: ShadowLayer[], unit: string = "px") => {
  return useMemo(() => {
    if (!layers.length) {
      return {
        shadow: null,
        error: null,
        isEmpty: true,
      }
    }

    try {
      const shadow = createShadow(type, layers, unit)
      return {
        shadow,
        error: null,
        isEmpty: false,
      }
    } catch (error) {
      return {
        shadow: null,
        error: error instanceof Error ? error.message : "Shadow generation failed",
        isEmpty: false,
      }
    }
  }, [type, layers, unit])
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<ShadowFile> => {
    const validation = validateShadowFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const shadowFile: ShadowFile = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type || "text/plain",
            status: "pending",
          }

          resolve(shadowFile)
        } catch (error) {
          reject(new Error("Failed to process file"))
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<ShadowFile[]> => {
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
const useShadowExport = () => {
  const exportShadow = useCallback((shadow: Shadow, format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "css":
        content = `.shadow {\n  ${shadow.css}\n}`
        mimeType = "text/css"
        extension = ".css"
        break
      case "scss":
        content = `$shadow: ${shadow.css.split(": ")[1]};\n\n.shadow {\n  ${shadow.type}: $shadow;\n}`
        mimeType = "text/scss"
        extension = ".scss"
        break
      case "tailwind":
        content = generateTailwindClasses(shadow)
        mimeType = "text/plain"
        extension = ".txt"
        break
      case "json":
        content = JSON.stringify(
          {
            id: shadow.id,
            type: shadow.type,
            layers: shadow.layers,
            css: shadow.css,
            accessibility: shadow.accessibility,
          },
          null,
          2
        )
        mimeType = "application/json"
        extension = ".json"
        break
      default:
        content = shadow.css
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `shadow${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: ShadowFile[]) => {
      const completedFiles = files.filter((f) => f.shadowData)

      if (completedFiles.length === 0) {
        toast.error("No shadows to export")
        return
      }

      completedFiles.forEach((file) => {
        if (file.shadowData) {
          file.shadowData.shadows.forEach((shadow, index) => {
            const baseName = file.name.replace(/\.[^/.]+$/, "")
            exportShadow(shadow, "css", `${baseName}-shadow-${index + 1}.css`)
          })
        }
      })

      toast.success(`Exported shadows from ${completedFiles.length} file(s)`)
    },
    [exportShadow]
  )

  const exportStatistics = useCallback((files: ShadowFile[]) => {
    const stats = files
      .filter((f) => f.shadowData)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.size),
        totalShadows: file.shadowData!.statistics.totalShadows,
        averageLayers: file.shadowData!.statistics.averageLayers.toFixed(1),
        averageBlur: file.shadowData!.statistics.averageBlur.toFixed(1),
        averageOpacity: file.shadowData!.statistics.averageOpacity.toFixed(2),
        accessibilityScore: file.shadowData!.statistics.accessibilityScore.toFixed(1),
        processingTime: `${file.shadowData!.statistics.processingTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      [
        "Filename",
        "Original Size",
        "Total Shadows",
        "Avg Layers",
        "Avg Blur",
        "Avg Opacity",
        "Accessibility Score",
        "Processing Time",
        "Status",
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.totalShadows.toString(),
        stat.averageLayers,
        stat.averageBlur,
        stat.averageOpacity,
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
    link.download = "shadow-statistics.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Statistics exported")
  }, [])

  return { exportShadow, exportBatch, exportStatistics }
}

// Generate Tailwind classes
const generateTailwindClasses = (shadow: Shadow): string => {
  // Simplified Tailwind class generation
  const layer = shadow.layers[0]
  if (!layer) return "shadow-none"

  if (layer.blur <= 3) return "shadow-sm"
  if (layer.blur <= 6) return "shadow"
  if (layer.blur <= 10) return "shadow-md"
  if (layer.blur <= 15) return "shadow-lg"
  if (layer.blur <= 25) return "shadow-xl"
  return "shadow-2xl"
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
 * Enhanced Shadow Generator Tool
 * Features: Real-time shadow generation, multiple types, batch processing, accessibility analysis
 */
const ShadowGeneratorCore = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "files">("generator")
  const [shadowType, setShadowType] = useState<ShadowType>("box-shadow")
  const [layers, setLayers] = useState<ShadowLayer[]>([
    { id: "1", x: 0, y: 4, blur: 6, spread: 0, color: "#000000", opacity: 0.1, inset: false },
  ])
  const [files, setFiles] = useState<ShadowFile[]>([])
  const [_, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("subtle")
  const [settings, setSettings] = useState<ShadowSettings>({
    defaultType: "box-shadow",
    maxLayers: 10,
    includeAccessibility: true,
    optimizeOutput: false,
    exportFormat: "css",
    unit: "px",
  })

  const { exportShadow } = useShadowExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Real-time shadow generation
  const shadowPreview = useRealTimeShadow(shadowType, layers, settings.unit)

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
    const template = shadowTemplates.find((t) => t.id === templateId)
    if (template && template.shadow) {
      if (template.shadow.type) setShadowType(template.shadow.type)
      if (template.shadow.layers) setLayers(template.shadow.layers)

      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Layer management
  const addLayer = useCallback(() => {
    if (layers.length < settings.maxLayers) {
      setLayers((prev) => [
        ...prev,
        {
          id: nanoid(),
          x: 0,
          y: 4,
          blur: 6,
          spread: 0,
          color: "#000000",
          opacity: 0.1,
          inset: false,
        },
      ])
    }
  }, [layers.length, settings.maxLayers])

  const removeLayer = useCallback(
    (id: string) => {
      if (layers.length > 1) {
        setLayers((prev) => prev.filter((l) => l.id !== id))
      }
    },
    [layers.length]
  )

  const updateLayer = useCallback((id: string, updates: Partial<ShadowLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)))
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
              <Square className="h-5 w-5" />
              Shadow Generator
            </CardTitle>
            <CardDescription>
              Advanced shadow generator with support for box-shadow, text-shadow, and drop-shadow effects, accessibility
              analysis, and batch processing. Use keyboard navigation: Tab to move between controls, Enter or Space to
              activate buttons.
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
              <Square className="h-4 w-4" />
              Shadow Generator
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Shadow Generator Tab */}
          <TabsContent
            value="generator"
            className="space-y-4"
          >
            {/* Shadow Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Shadow Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {shadowTemplates.map((template) => (
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
                          style={{ boxShadow: template.preview }}
                          title={template.preview}
                        />
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shadow Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shadow Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shadow-type">Shadow Type</Label>
                    <Select
                      value={shadowType}
                      onValueChange={(value: ShadowType) => setShadowType(value)}
                    >
                      <SelectTrigger id="shadow-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="box-shadow">Box Shadow</SelectItem>
                        <SelectItem value="text-shadow">Text Shadow</SelectItem>
                        <SelectItem value="drop-shadow">Drop Shadow (Filter)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={settings.unit}
                      onValueChange={(value: "px" | "rem" | "em") => setSettings((prev) => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger id="unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="px">Pixels (px)</SelectItem>
                        <SelectItem value="rem">Root EM (rem)</SelectItem>
                        <SelectItem value="em">EM (em)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                    Shadow Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {shadowPreview.error ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <Square className="h-4 w-4" />
                        <span className="font-medium">Shadow Generation Error</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{shadowPreview.error}</p>
                    </div>
                  ) : shadowPreview.shadow ? (
                    <div className="space-y-4">
                      {/* Shadow Display */}
                      <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        {shadowType === "text-shadow" ? (
                          <div
                            className="text-4xl font-bold text-gray-800 dark:text-gray-200"
                            style={{ textShadow: shadowPreview.shadow.css.split(": ")[1].replace(";", "") }}
                          >
                            Sample Text
                          </div>
                        ) : (
                          <div
                            className="w-32 h-32 bg-white dark:bg-gray-800 rounded-lg border"
                            style={{
                              boxShadow:
                                shadowType === "box-shadow"
                                  ? shadowPreview.shadow.css.split(": ")[1].replace(";", "")
                                  : undefined,
                              filter:
                                shadowType === "drop-shadow"
                                  ? shadowPreview.shadow.css.split(": ")[1].replace(";", "")
                                  : undefined,
                            }}
                          />
                        )}
                      </div>

                      {/* CSS Output */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">CSS Code</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(shadowPreview.shadow!.css, "CSS shadow")}
                          >
                            {copiedText === "CSS shadow" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Textarea
                          value={shadowPreview.shadow.css}
                          readOnly
                          className="font-mono text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Square className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Configure shadow settings to see preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Shadow Layers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Shadow Layers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Layers ({layers.length}/{settings.maxLayers})
                    </Label>
                    <Button
                      size="sm"
                      onClick={addLayer}
                      disabled={layers.length >= settings.maxLayers}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Layer
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {layers.map((layer, index) => (
                      <div
                        key={layer.id}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Layer {index + 1}</span>
                          <div className="flex items-center gap-2">
                            {shadowType === "box-shadow" && (
                              <div className="flex items-center space-x-2">
                                <input
                                  id={`inset-${layer.id}`}
                                  type="checkbox"
                                  checked={layer.inset}
                                  onChange={(e) => updateLayer(layer.id, { inset: e.target.checked })}
                                  className="rounded border-input"
                                />
                                <Label
                                  htmlFor={`inset-${layer.id}`}
                                  className="text-xs"
                                >
                                  Inset
                                </Label>
                              </div>
                            )}
                            {layers.length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeLayer(layer.id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">X Offset</Label>
                            <Input
                              type="number"
                              value={layer.x}
                              onChange={(e) => updateLayer(layer.id, { x: Number(e.target.value) })}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Y Offset</Label>
                            <Input
                              type="number"
                              value={layer.y}
                              onChange={(e) => updateLayer(layer.id, { y: Number(e.target.value) })}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Blur Radius</Label>
                            <Input
                              type="number"
                              min="0"
                              value={layer.blur}
                              onChange={(e) => updateLayer(layer.id, { blur: Number(e.target.value) })}
                              className="text-sm"
                            />
                          </div>
                          {shadowType === "box-shadow" && (
                            <div className="space-y-2">
                              <Label className="text-xs">Spread Radius</Label>
                              <Input
                                type="number"
                                value={layer.spread || 0}
                                onChange={(e) => updateLayer(layer.id, { spread: Number(e.target.value) })}
                                className="text-sm"
                              />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Color</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="color"
                                value={layer.color}
                                onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={layer.color}
                                onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                                placeholder="#000000"
                                className="font-mono text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Opacity: {Math.round(layer.opacity * 100)}%</Label>
                            <Input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={layer.opacity}
                              onChange={(e) => updateLayer(layer.id, { opacity: Number(e.target.value) })}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const randomLayers = layers.map((l) => ({
                          ...l,
                          color:
                            "#" +
                            Math.floor(Math.random() * 16777215)
                              .toString(16)
                              .padStart(6, "0"),
                        }))
                        setLayers(randomLayers)
                      }}
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                      Random Colors
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLayers([
                          {
                            id: nanoid(),
                            x: 0,
                            y: 4,
                            blur: 6,
                            spread: 0,
                            color: "#000000",
                            opacity: 0.1,
                            inset: false,
                          },
                        ])
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Analysis */}
            {shadowPreview.shadow && settings.includeAccessibility && (
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
                        <Label className="text-sm font-medium">Contrast Ratio</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span className="font-mono text-lg">
                            {shadowPreview.shadow.accessibility.contrastRatio}:1
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Visibility</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span
                            className={`font-medium ${
                              shadowPreview.shadow.accessibility.visibility === "high"
                                ? "text-green-600"
                                : shadowPreview.shadow.accessibility.visibility === "medium"
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {shadowPreview.shadow.accessibility.visibility.charAt(0).toUpperCase() +
                              shadowPreview.shadow.accessibility.visibility.slice(1)}{" "}
                            Visibility
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">WCAG Compliance</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span
                            className={`font-medium ${shadowPreview.shadow.accessibility.wcagCompliant ? "text-green-600" : "text-red-600"}`}
                          >
                            {shadowPreview.shadow.accessibility.wcagCompliant ? "WCAG Compliant" : "Not WCAG Compliant"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Readability Impact</Label>
                        <div className="mt-2 p-3 bg-muted/30 rounded">
                          <span
                            className={`font-medium ${
                              shadowPreview.shadow.accessibility.readabilityImpact === "none"
                                ? "text-green-600"
                                : shadowPreview.shadow.accessibility.readabilityImpact === "minimal"
                                  ? "text-green-600"
                                  : shadowPreview.shadow.accessibility.readabilityImpact === "moderate"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                            }`}
                          >
                            {shadowPreview.shadow.accessibility.readabilityImpact.charAt(0).toUpperCase() +
                              shadowPreview.shadow.accessibility.readabilityImpact.slice(1)}{" "}
                            Impact
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Actions */}
            {shadowPreview.shadow && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={() => exportShadow(shadowPreview.shadow!, "css")}
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSS
                    </Button>

                    <Button
                      onClick={() => exportShadow(shadowPreview.shadow!, "scss")}
                      variant="outline"
                    >
                      <Code className="mr-2 h-4 w-4" />
                      Export SCSS
                    </Button>

                    <Button
                      onClick={() => exportShadow(shadowPreview.shadow!, "tailwind")}
                      variant="outline"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Tailwind Classes
                    </Button>

                    <Button
                      onClick={() => exportShadow(shadowPreview.shadow!, "json")}
                      variant="outline"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>

                    <Button
                      onClick={() => copyToClipboard(shadowPreview.shadow!.css, "shadow CSS")}
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
                  <h3 className="text-lg font-semibold mb-2">Upload Shadow Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your shadow configuration files here, or click to select files
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
                            {file.status === "completed" && file.shadowData && (
                              <div className="mt-2 text-xs">
                                {file.shadowData.statistics.totalShadows} shadows processed
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
const ShadowGenerator = () => {
  return <ShadowGeneratorCore />
}

export default ShadowGenerator
