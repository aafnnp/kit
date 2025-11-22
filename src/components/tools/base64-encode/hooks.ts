import { useCallback, useState, useMemo, useRef } from "react"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import {
  Base64File,
  EncodingResult,
  EncodingTemplate,
  EncodingOperation,
  EncodingFormat,
  ExportFormat,
} from "@/schemas/base64-encode.schema"
import { formatFileSize } from "@/lib/utils"

// Utility functions

export const validateEncodingFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [".txt", ".json", ".csv", ".xml", ".html", ".js", ".css"]

  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 10MB" }
  }

  const extension = "." + file.name.split(".").pop()?.toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: "Only text-based files are supported" }
  }

  return { isValid: true }
}

// Encoding functions
const encodeBase64 = (input: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(input)))
  } catch (error) {
    throw new Error("Failed to encode to Base64")
  }
}

const decodeBase64 = (input: string): string => {
  try {
    return decodeURIComponent(escape(atob(input)))
  } catch (error) {
    throw new Error("Invalid Base64 string")
  }
}

const encodeURL = (input: string): string => {
  try {
    return encodeURIComponent(input)
  } catch (error) {
    throw new Error("Failed to encode URL")
  }
}

const decodeURL = (input: string): string => {
  try {
    return decodeURIComponent(input)
  } catch (error) {
    throw new Error("Invalid URL encoded string")
  }
}

const encodeHex = (input: string): string => {
  try {
    return Array.from(new TextEncoder().encode(input))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  } catch (error) {
    throw new Error("Failed to encode to Hex")
  }
}

const decodeHex = (input: string): string => {
  try {
    const cleanInput = input.replace(/\s/g, "")
    if (cleanInput.length % 2 !== 0) {
      throw new Error("Invalid hex string length")
    }

    const bytes = []
    for (let i = 0; i < cleanInput.length; i += 2) {
      bytes.push(parseInt(cleanInput.substr(i, 2), 16))
    }

    return new TextDecoder().decode(new Uint8Array(bytes))
  } catch (error) {
    throw new Error("Invalid Hex string")
  }
}

const encodeBinary = (input: string): string => {
  try {
    return Array.from(new TextEncoder().encode(input))
      .map((byte) => byte.toString(2).padStart(8, "0"))
      .join(" ")
  } catch (error) {
    throw new Error("Failed to encode to Binary")
  }
}

const decodeBinary = (input: string): string => {
  try {
    const binaryArray = input.split(/\s+/).filter((bin) => bin.length > 0)
    const bytes = binaryArray.map((bin) => {
      if (bin.length !== 8 || !/^[01]+$/.test(bin)) {
        throw new Error("Invalid binary format")
      }
      return parseInt(bin, 2)
    })

    return new TextDecoder().decode(new Uint8Array(bytes))
  } catch (error) {
    throw new Error("Invalid Binary string")
  }
}

// Main encoding function
export const performEncoding = (
  input: string,
  operation: EncodingOperation,
  inputFormat: EncodingFormat,
  outputFormat: EncodingFormat
): EncodingResult => {
  const startTime = performance.now()
  const inputSize = new Blob([input]).size

  try {
    let output = ""

    if (operation === "encode") {
      switch (outputFormat) {
        case "base64":
          output = encodeBase64(input)
          break
        case "url":
          output = encodeURL(input)
          break
        case "hex":
          output = encodeHex(input)
          break
        case "binary":
          output = encodeBinary(input)
          break
        default:
          output = input
      }
    } else {
      switch (inputFormat) {
        case "base64":
          output = decodeBase64(input)
          break
        case "url":
          output = decodeURL(input)
          break
        case "hex":
          output = decodeHex(input)
          break
        case "binary":
          output = decodeBinary(input)
          break
        default:
          output = input
      }
    }

    const outputSize = new Blob([output]).size
    const processingTime = performance.now() - startTime
    const compressionRatio = inputSize > 0 ? outputSize / inputSize : 1

    return {
      id: nanoid(),
      operation,
      input,
      output,
      inputFormat,
      outputFormat,
      metadata: {
        inputSize,
        outputSize,
        compressionRatio,
        processingTime,
        isValid: true,
        encoding: operation === "encode" ? outputFormat : inputFormat,
      },
    }
  } catch (error) {
    const processingTime = performance.now() - startTime

    return {
      id: nanoid(),
      operation,
      input,
      output: "",
      inputFormat,
      outputFormat,
      metadata: {
        inputSize,
        outputSize: 0,
        compressionRatio: 0,
        processingTime,
        isValid: false,
        encoding: operation === "encode" ? outputFormat : inputFormat,
      },
    }
  }
}

// Encoding templates
export const encodingTemplates: EncodingTemplate[] = [
  {
    id: "text-to-base64",
    name: "Text to Base64",
    description: "Encode plain text to Base64",
    category: "Base64",
    operation: "encode",
    inputFormat: "text",
    outputFormat: "base64",
    example: "Hello World → SGVsbG8gV29ybGQ=",
  },
  {
    id: "base64-to-text",
    name: "Base64 to Text",
    description: "Decode Base64 to plain text",
    category: "Base64",
    operation: "decode",
    inputFormat: "base64",
    outputFormat: "text",
    example: "SGVsbG8gV29ybGQ= → Hello World",
  },
  {
    id: "text-to-url",
    name: "Text to URL Encoded",
    description: "Encode text for URL usage",
    category: "URL",
    operation: "encode",
    inputFormat: "text",
    outputFormat: "url",
    example: "Hello World! → Hello%20World%21",
  },
  {
    id: "url-to-text",
    name: "URL Encoded to Text",
    description: "Decode URL encoded text",
    category: "URL",
    operation: "decode",
    inputFormat: "url",
    outputFormat: "text",
    example: "Hello%20World%21 → Hello World!",
  },
  {
    id: "text-to-hex",
    name: "Text to Hex",
    description: "Convert text to hexadecimal",
    category: "Hex",
    operation: "encode",
    inputFormat: "text",
    outputFormat: "hex",
    example: "Hello → 48656c6c6f",
  },
  {
    id: "hex-to-text",
    name: "Hex to Text",
    description: "Convert hexadecimal to text",
    category: "Hex",
    operation: "decode",
    inputFormat: "hex",
    outputFormat: "text",
    example: "48656c6c6f → Hello",
  },
  {
    id: "text-to-binary",
    name: "Text to Binary",
    description: "Convert text to binary",
    category: "Binary",
    operation: "encode",
    inputFormat: "text",
    outputFormat: "binary",
    example: "Hi → 01001000 01101001",
  },
  {
    id: "binary-to-text",
    name: "Binary to Text",
    description: "Convert binary to text",
    category: "Binary",
    operation: "decode",
    inputFormat: "binary",
    outputFormat: "text",
    example: "01001000 01101001 → Hi",
  },
]

// Real-time encoding hook
export const useRealTimeEncoding = (
  input: string,
  operation: EncodingOperation,
  inputFormat: EncodingFormat,
  outputFormat: EncodingFormat
) => {
  return useMemo(() => {
    if (!input.trim()) {
      return {
        result: null,
        error: null,
        isEmpty: true,
      }
    }

    try {
      const result = performEncoding(input, operation, inputFormat, outputFormat)
      return {
        result,
        error: null,
        isEmpty: false,
      }
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "Encoding failed",
        isEmpty: false,
      }
    }
  }, [input, operation, inputFormat, outputFormat])
}

// File processing hook
export const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<Base64File> => {
    const validation = validateEncodingFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const encodingFile: Base64File = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type || "text/plain",
            status: "pending",
          }

          resolve(encodingFile)
        } catch (error) {
          reject(new Error("Failed to process file"))
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<Base64File[]> => {
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
export const useEncodingExport = () => {
  const exportResult = useCallback((result: EncodingResult, format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "txt":
        content = result.output
        mimeType = "text/plain"
        extension = ".txt"
        break
      case "json":
        content = JSON.stringify(
          {
            id: result.id,
            operation: result.operation,
            input: result.input,
            output: result.output,
            inputFormat: result.inputFormat,
            outputFormat: result.outputFormat,
            metadata: result.metadata,
          },
          null,
          2
        )
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        content = [
          [
            "Operation",
            "Input Format",
            "Output Format",
            "Input Size",
            "Output Size",
            "Compression Ratio",
            "Processing Time",
            "Valid",
          ],
          [
            result.operation,
            result.inputFormat,
            result.outputFormat,
            result.metadata.inputSize.toString(),
            result.metadata.outputSize.toString(),
            result.metadata.compressionRatio.toFixed(2),
            `${result.metadata.processingTime.toFixed(2)}ms`,
            result.metadata.isValid.toString(),
          ],
        ]
          .map((row) => row.map((cell) => `"${cell}"`).join(","))
          .join("\n")
        mimeType = "text/csv"
        extension = ".csv"
        break
      default:
        content = result.output
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `encoding-result${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: Base64File[]) => {
      const completedFiles = files.filter((f) => f.encodingData)

      if (completedFiles.length === 0) {
        toast.error("No encoding results to export")
        return
      }

      completedFiles.forEach((file) => {
        if (file.encodingData) {
          file.encodingData.encodings.forEach((result, index) => {
            const baseName = file.name.replace(/\.[^/.]+$/, "")
            exportResult(result, "txt", `${baseName}-encoded-${index + 1}.txt`)
          })
        }
      })

      toast.success(`Exported results from ${completedFiles.length} file(s)`)
    },
    [exportResult]
  )

  const exportStatistics = useCallback((files: Base64File[]) => {
    const stats = files
      .filter((f) => f.encodingData)
      .map((file) => ({
        filename: file.name,
        originalSize: formatFileSize(file.size),
        totalEncodings: file.encodingData!.statistics.totalEncodings,
        averageCompressionRatio: file.encodingData!.statistics.averageCompressionRatio.toFixed(2),
        averageProcessingTime: `${file.encodingData!.statistics.averageProcessingTime.toFixed(2)}ms`,
        successRate: `${file.encodingData!.statistics.successRate.toFixed(1)}%`,
        processingTime: `${file.encodingData!.statistics.processingTime.toFixed(2)}ms`,
        status: file.status,
      }))

    const csvContent = [
      [
        "Filename",
        "Original Size",
        "Total Encodings",
        "Avg Compression Ratio",
        "Avg Processing Time",
        "Success Rate",
        "Processing Time",
        "Status",
      ],
      ...stats.map((stat) => [
        stat.filename,
        stat.originalSize,
        stat.totalEncodings.toString(),
        stat.averageCompressionRatio,
        stat.averageProcessingTime,
        stat.successRate,
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
    link.download = "encoding-statistics.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Statistics exported")
  }, [])

  return { exportResult, exportBatch, exportStatistics }
}

// Copy to clipboard functionality
export const useCopyToClipboard = () => {
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
export const useDragAndDrop = (onFilesDropped: (files: File[]) => void) => {
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
        (file) => file.type.startsWith("text/") || file.name.match(/\.(txt|json|csv|xml|html|js|css)$/i)
      )

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error("Please drop only text-based files")
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
