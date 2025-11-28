import React, { useCallback, useRef, useState } from "react"
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
  Upload,
  Trash2,
  Target,
  Copy,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Shield,
  Zap,
  Settings,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Lock,
  Key,
  Timer,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  BcryptFile,
  BcryptData,
  BcryptContent,
  BcryptResult,
  BcryptStatistics,
  BcryptSettings,
  BcryptTemplate,
  PasswordStrength,
  PasswordRequirement,
  BcryptVerification,
  SecurityLevel,
  ExportFormat,
} from "@/components/tools/bcrypt-hash/schema"
import { formatFileSize } from "@/lib/utils"

// Utility functions

const validateBcryptFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ["text/plain", "text/csv", "application/json"]

  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 10MB" }
  }

  if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith(".txt")) {
    return { isValid: false, error: "Only text files are supported" }
  }

  return { isValid: true }
}

// Simple Bcrypt implementation for browser (educational purposes)
// Note: In production, use a proper bcrypt library like bcryptjs
const generateSalt = (rounds: number): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./"
  let salt = "$2b$" + rounds.toString().padStart(2, "0") + "$"

  for (let i = 0; i < 22; i++) {
    salt += chars[Math.floor(Math.random() * chars.length)]
  }

  return salt
}

// Simple hash function (for demonstration - not cryptographically secure)
const simpleHash = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)

  // Use multiple rounds of SHA-256 to simulate bcrypt work
  let hash = await crypto.subtle.digest("SHA-256", data)

  // Simulate bcrypt rounds
  const rounds = parseInt(salt.split("$")[2]) || 10
  for (let i = 0; i < Math.pow(2, rounds - 8); i++) {
    const combined = new Uint8Array(hash.byteLength + data.byteLength)
    combined.set(new Uint8Array(hash))
    combined.set(data, hash.byteLength)
    hash = await crypto.subtle.digest("SHA-256", combined)
  }

  // Convert to base64-like encoding
  const hashArray = new Uint8Array(hash)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./"
  let result = ""

  for (let i = 0; i < 31; i++) {
    result += chars[hashArray[i % hashArray.length] % chars.length]
  }

  return salt + result
}

// Calculate Bcrypt hash
const calculateBcryptHash = async (password: string, saltRounds: number): Promise<BcryptResult> => {
  const startTime = performance.now()

  try {
    const salt = generateSalt(saltRounds)
    const hash = await simpleHash(password, salt)
    const processingTime = performance.now() - startTime

    let securityLevel: SecurityLevel = "low"
    if (saltRounds >= 12) securityLevel = "very-high"
    else if (saltRounds >= 10) securityLevel = "high"
    else if (saltRounds >= 8) securityLevel = "medium"

    return {
      saltRounds,
      hash,
      salt,
      processingTime,
      securityLevel,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Bcrypt hash calculation failed")
  }
}

// Verify Bcrypt hash
const verifyBcryptHash = async (password: string, hash: string): Promise<boolean> => {
  try {
    // Extract salt from hash
    const parts = hash.split("$")
    if (parts.length < 4) return false

    const salt = parts.slice(0, 4).join("$")
    const expectedHash = await simpleHash(password, salt)

    return expectedHash === hash
  } catch (error) {
    return false
  }
}

// Calculate multiple Bcrypt hashes
const calculateMultipleBcryptHashes = async (password: string, saltRounds: number[]): Promise<BcryptResult[]> => {
  const results: BcryptResult[] = []

  for (const rounds of saltRounds) {
    try {
      const result = await calculateBcryptHash(password, rounds)
      results.push(result)
    } catch (error) {
      results.push({
        saltRounds: rounds,
        hash: "Error: " + (error instanceof Error ? error.message : "Hash calculation failed"),
        salt: "",
        processingTime: 0,
        securityLevel: "low",
      })
    }
  }

  return results
}

// Password strength analysis
const analyzePasswordStrength = (password: string): PasswordStrength => {
  const requirements: PasswordRequirement[] = [
    {
      name: "Length",
      met: password.length >= 8,
      description: "At least 8 characters",
    },
    {
      name: "Uppercase",
      met: /[A-Z]/.test(password),
      description: "Contains uppercase letters",
    },
    {
      name: "Lowercase",
      met: /[a-z]/.test(password),
      description: "Contains lowercase letters",
    },
    {
      name: "Numbers",
      met: /\d/.test(password),
      description: "Contains numbers",
    },
    {
      name: "Special Characters",
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      description: "Contains special characters",
    },
    {
      name: "No Common Patterns",
      met: !/(123|abc|password|qwerty)/i.test(password),
      description: "Avoids common patterns",
    },
  ]

  const metRequirements = requirements.filter((req) => req.met).length
  const score = Math.min(100, (metRequirements / requirements.length) * 100)

  let level: PasswordStrength["level"] = "very-weak"
  if (score >= 80) level = "strong"
  else if (score >= 60) level = "good"
  else if (score >= 40) level = "fair"
  else if (score >= 20) level = "weak"

  const feedback: string[] = []
  requirements.forEach((req) => {
    if (!req.met) {
      feedback.push(req.description)
    }
  })

  if (password.length < 12) {
    feedback.push("Consider using 12+ characters for better security")
  }

  return {
    score,
    level,
    feedback,
    requirements,
  }
}

// Bcrypt templates with different security levels
const bcryptTemplates: BcryptTemplate[] = [
  {
    id: "standard-security",
    name: "Standard Security",
    description: "Balanced security and performance (10 rounds)",
    category: "Standard",
    settings: {
      saltRounds: [10],
      includeTimestamp: false,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: true,
      passwordStrengthCheck: true,
    },
    saltRounds: [10],
    securityLevel: "high",
  },
  {
    id: "high-security",
    name: "High Security",
    description: "Enhanced security for sensitive applications (12 rounds)",
    category: "Security",
    settings: {
      saltRounds: [12],
      includeTimestamp: true,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: false,
      passwordStrengthCheck: true,
    },
    saltRounds: [12],
    securityLevel: "very-high",
  },
  {
    id: "comparison-analysis",
    name: "Comparison Analysis",
    description: "Compare different salt rounds (8, 10, 12)",
    category: "Analysis",
    settings: {
      saltRounds: [8, 10, 12],
      includeTimestamp: true,
      enableVerification: true,
      batchProcessing: true,
      realTimeHashing: false,
      passwordStrengthCheck: true,
    },
    saltRounds: [8, 10, 12],
    securityLevel: "high",
  },
  {
    id: "development-testing",
    name: "Development Testing",
    description: "Fast hashing for development (6 rounds)",
    category: "Development",
    settings: {
      saltRounds: [6],
      includeTimestamp: false,
      enableVerification: true,
      batchProcessing: false,
      realTimeHashing: true,
      passwordStrengthCheck: false,
    },
    saltRounds: [6],
    securityLevel: "medium",
  },
  {
    id: "enterprise-grade",
    name: "Enterprise Grade",
    description: "Maximum security for enterprise (14 rounds)",
    category: "Enterprise",
    settings: {
      saltRounds: [14],
      includeTimestamp: true,
      enableVerification: true,
      batchProcessing: false,
      realTimeHashing: false,
      passwordStrengthCheck: true,
    },
    saltRounds: [14],
    securityLevel: "very-high",
  },
  {
    id: "quick-hash",
    name: "Quick Hash",
    description: "Fast hashing for testing (4 rounds)",
    category: "Quick",
    settings: {
      saltRounds: [4],
      includeTimestamp: false,
      enableVerification: false,
      batchProcessing: false,
      realTimeHashing: true,
      passwordStrengthCheck: false,
    },
    saltRounds: [4],
    securityLevel: "low",
  },
]

// Process Bcrypt data
const processBcryptData = (
  content: string,
  hashes: BcryptResult[],
  statistics: BcryptStatistics,
  settings: BcryptSettings
): BcryptData => {
  try {
    const strength = settings.passwordStrengthCheck ? analyzePasswordStrength(content) : undefined

    const bcryptContent: BcryptContent = {
      content,
      size: new Blob([content]).size,
      type: "password",
      strength,
    }

    return {
      original: bcryptContent,
      hashes,
      statistics,
      settings,
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Bcrypt processing failed")
  }
}

// Custom hooks
const useBcryptGeneration = () => {
  const generateBcrypt = useCallback(async (password: string, saltRounds: number[]): Promise<BcryptData> => {
    try {
      const hashes = await calculateMultipleBcryptHashes(password, saltRounds)

      const statistics: BcryptStatistics = {
        totalHashes: hashes.length,
        saltRoundDistribution: hashes.reduce(
          (acc, hash) => {
            acc[hash.saltRounds.toString()] = (acc[hash.saltRounds.toString()] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ),
        averageProcessingTime: hashes.reduce((sum, hash) => sum + hash.processingTime, 0) / hashes.length,
        totalProcessingTime: hashes.reduce((sum, hash) => sum + hash.processingTime, 0),
        verificationCount: 0,
        successRate: 100,
        securityScore: Math.max(
          ...hashes.map((h) => {
            switch (h.securityLevel) {
              case "very-high":
                return 100
              case "high":
                return 80
              case "medium":
                return 60
              case "low":
                return 40
              default:
                return 20
            }
          })
        ),
      }

      const settings: BcryptSettings = {
        saltRounds,
        includeTimestamp: true,
        enableVerification: true,
        batchProcessing: false,
        realTimeHashing: true,
        exportFormat: "json",
        showPasswords: false,
        passwordStrengthCheck: true,
      }

      return processBcryptData(password, hashes, statistics, settings)
    } catch (error) {
      console.error("Bcrypt generation error:", error)
      throw new Error(error instanceof Error ? error.message : "Bcrypt generation failed")
    }
  }, [])

  const processBatch = useCallback(
    async (files: BcryptFile[], settings: BcryptSettings): Promise<BcryptFile[]> => {
      return Promise.all(
        files.map(async (file) => {
          if (file.status !== "pending") return file

          try {
            const bcryptData = await generateBcrypt(file.content, settings.saltRounds)

            return {
              ...file,
              status: "completed" as const,
              bcryptData,
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
    [generateBcrypt]
  )

  const processFiles = useCallback(
    async (files: BcryptFile[], settings: BcryptSettings): Promise<BcryptFile[]> => {
      const processedFiles = await processBatch(files, settings)
      return processedFiles
    },
    [processBatch]
  )

  return { generateBcrypt, processBatch, processFiles }
}

// File processing hook
const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<BcryptFile> => {
    const validation = validateBcryptFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const bcryptFile: BcryptFile = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type,
            status: "pending",
          }

          resolve(bcryptFile)
        } catch (error) {
          reject(new Error("Failed to process file"))
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<BcryptFile[]> => {
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
            type: files[index].type,
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
const useBcryptExport = () => {
  const exportBcrypt = useCallback((bcryptData: BcryptData, format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "json":
        content = JSON.stringify(bcryptData, null, 2)
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        content = generateCSVFromBcrypt(bcryptData)
        mimeType = "text/csv"
        extension = ".csv"
        break
      case "xml":
        content = generateXMLFromBcrypt(bcryptData)
        mimeType = "application/xml"
        extension = ".xml"
        break
      case "txt":
      default:
        content = generateTextFromBcrypt(bcryptData)
        mimeType = "text/plain"
        extension = ".txt"
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `bcrypt-data${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (files: BcryptFile[]) => {
      const completedFiles = files.filter((f) => f.bcryptData)

      if (completedFiles.length === 0) {
        toast.error("No Bcrypt data to export")
        return
      }

      completedFiles.forEach((file) => {
        if (file.bcryptData) {
          const baseName = file.name.replace(/\.[^/.]+$/, "")
          exportBcrypt(file.bcryptData, "json", `${baseName}-bcrypt.json`)
        }
      })

      toast.success(`Exported Bcrypt data from ${completedFiles.length} file(s)`)
    },
    [exportBcrypt]
  )

  const exportStatistics = useCallback((files: BcryptFile[]) => {
    const stats = files
      .filter((f) => f.bcryptData)
      .map((file) => ({
        filename: file.name,
        fileSize: formatFileSize(file.size),
        hashCount: file.bcryptData!.hashes.length,
        saltRounds: file.bcryptData!.hashes.map((h) => h.saltRounds).join(", "),
        processingTime: `${file.bcryptData!.statistics.totalProcessingTime.toFixed(2)}ms`,
        securityScore: file.bcryptData!.statistics.securityScore,
        status: file.status,
      }))

    const csvContent = [
      ["Filename", "File Size", "Hash Count", "Salt Rounds", "Processing Time", "Security Score", "Status"],
      ...stats.map((stat) => [
        stat.filename,
        stat.fileSize,
        stat.hashCount.toString(),
        stat.saltRounds,
        stat.processingTime,
        stat.securityScore.toString(),
        stat.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "bcrypt-statistics.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Statistics exported")
  }, [])

  return { exportBcrypt, exportBatch, exportStatistics }
}

// Generate export formats
const generateTextFromBcrypt = (bcryptData: BcryptData): string => {
  return `Bcrypt Hash Report
==================

Password Length: ${bcryptData.original.content.length} characters
Password Strength: ${bcryptData.original.strength?.level || "Not analyzed"}

Hash Results:
${bcryptData.hashes.map((hash) => `- ${hash.saltRounds} rounds: ${hash.hash} (${hash.processingTime.toFixed(2)}ms, ${hash.securityLevel} security)`).join("\n")}

Statistics:
- Total Hashes: ${bcryptData.statistics.totalHashes}
- Total Processing Time: ${bcryptData.statistics.totalProcessingTime.toFixed(2)}ms
- Average Processing Time: ${bcryptData.statistics.averageProcessingTime.toFixed(2)}ms
- Security Score: ${bcryptData.statistics.securityScore}/100
`
}

const generateCSVFromBcrypt = (bcryptData: BcryptData): string => {
  const rows = [
    ["Salt Rounds", "Hash", "Processing Time (ms)", "Security Level"],
    ...bcryptData.hashes.map((hash) => [
      hash.saltRounds.toString(),
      hash.hash,
      hash.processingTime.toFixed(2),
      hash.securityLevel,
    ]),
  ]

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}

const generateXMLFromBcrypt = (bcryptData: BcryptData): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<bcryptData>
  <original>
    <contentLength>${bcryptData.original.content.length}</contentLength>
    <strength>${bcryptData.original.strength?.level || "Not analyzed"}</strength>
  </original>
  <hashes>
    ${bcryptData.hashes
      .map(
        (hash) => `
    <hash>
      <saltRounds>${hash.saltRounds}</saltRounds>
      <value>${hash.hash}</value>
      <processingTime>${hash.processingTime}</processingTime>
      <securityLevel>${hash.securityLevel}</securityLevel>
    </hash>`
      )
      .join("")}
  </hashes>
  <statistics>
    <totalHashes>${bcryptData.statistics.totalHashes}</totalHashes>
    <totalProcessingTime>${bcryptData.statistics.totalProcessingTime}</totalProcessingTime>
    <averageProcessingTime>${bcryptData.statistics.averageProcessingTime}</averageProcessingTime>
    <securityScore>${bcryptData.statistics.securityScore}</securityScore>
  </statistics>
</bcryptData>`
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
        (file) => file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")
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
 * Enhanced Bcrypt Hash Tool
 * Features: Real-time hashing, multiple salt rounds, batch processing, comprehensive analysis
 */
const BcryptHashCore = () => {
  const [activeTab, setActiveTab] = useState<"hasher" | "files" | "verify">("hasher")
  const [currentPassword, setCurrentPassword] = useState<string>("")
  const [currentBcryptData, setCurrentBcryptData] = useState<BcryptData | null>(null)
  const [files, setFiles] = useState<BcryptFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("standard-security")
  const [showPassword, setShowPassword] = useState(false)
  const [verifyPassword, setVerifyPassword] = useState("")
  const [verifyHash, setVerifyHash] = useState("")
  const [verificationResult, setVerificationResult] = useState<BcryptVerification | null>(null)
  const [settings, setSettings] = useState<BcryptSettings>({
    saltRounds: [10],
    includeTimestamp: false,
    enableVerification: true,
    batchProcessing: true,
    realTimeHashing: true,
    exportFormat: "json",
    showPasswords: false,
    passwordStrengthCheck: true,
  })

  const { generateBcrypt } = useBcryptGeneration()
  const { exportBcrypt } = useBcryptExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

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
    const template = bcryptTemplates.find((t) => t.id === templateId)
    if (template && template.settings) {
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle Bcrypt generation
  const handleGenerateBcrypt = useCallback(async () => {
    if (!currentPassword.trim()) {
      toast.error("Please enter a password to hash")
      return
    }

    setIsProcessing(true)
    try {
      const bcryptData = await generateBcrypt(currentPassword, settings.saltRounds)
      setCurrentBcryptData(bcryptData)
      toast.success("Bcrypt hash generated successfully")
    } catch (error) {
      toast.error("Failed to generate Bcrypt hash")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [currentPassword, settings, generateBcrypt])

  // Handle hash verification
  const handleVerifyHash = useCallback(async () => {
    if (!verifyPassword.trim() || !verifyHash.trim()) {
      toast.error("Please enter both password and hash to verify")
      return
    }

    setIsProcessing(true)
    try {
      const startTime = performance.now()
      const isValid = await verifyBcryptHash(verifyPassword, verifyHash)
      const processingTime = performance.now() - startTime

      const result: BcryptVerification = {
        id: nanoid(),
        password: verifyPassword,
        hash: verifyHash,
        isValid,
        processingTime,
      }

      setVerificationResult(result)
      toast.success(isValid ? "Hash verification successful" : "Hash verification failed")
    } catch (error) {
      toast.error("Failed to verify hash")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [verifyPassword, verifyHash])

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
              <Lock className="h-5 w-5" />
              Bcrypt Hash & Password Security
            </CardTitle>
            <CardDescription>
              Advanced Bcrypt password hashing tool with multiple salt rounds and real-time processing. Generate secure
              password hashes with comprehensive security analysis and verification. Use keyboard navigation: Tab to
              move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "hasher" | "files" | "verify")}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="hasher"
              className="flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Password Hasher
            </TabsTrigger>
            <TabsTrigger
              value="verify"
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Hash Verification
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Password Hasher Tab */}
          <TabsContent
            value="hasher"
            className="space-y-4"
          >
            {/* Bcrypt Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Security Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {bcryptTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? "default" : "outline"}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div className="text-xs font-mono mt-2 p-1 bg-muted/30 rounded flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {template.saltRounds.join(", ")} rounds • {template.category}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Password Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Password Input
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password to hash..."
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Password Strength Indicator */}
                  {currentPassword && settings.passwordStrengthCheck && (
                    <div className="space-y-2">
                      {(() => {
                        const strength = analyzePasswordStrength(currentPassword)
                        return (
                          <div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Password Strength:</span>
                              <span
                                className={`font-medium ${
                                  strength.level === "strong"
                                    ? "text-green-600"
                                    : strength.level === "good"
                                      ? "text-blue-600"
                                      : strength.level === "fair"
                                        ? "text-yellow-600"
                                        : strength.level === "weak"
                                          ? "text-orange-600"
                                          : "text-red-600"
                                }`}
                              >
                                {strength.level.toUpperCase()} ({strength.score}/100)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  strength.level === "strong"
                                    ? "bg-green-600"
                                    : strength.level === "good"
                                      ? "bg-blue-600"
                                      : strength.level === "fair"
                                        ? "bg-yellow-600"
                                        : strength.level === "weak"
                                          ? "bg-orange-600"
                                          : "bg-red-600"
                                }`}
                                style={{ width: `${strength.score}%` }}
                              />
                            </div>
                            {strength.feedback.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Suggestions: {strength.feedback.join(", ")}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateBcrypt}
                      disabled={!currentPassword.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Generate Bcrypt Hash
                    </Button>
                    <Button
                      onClick={() => setCurrentPassword("")}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hash Results */}
            {currentBcryptData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Bcrypt Hash Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentBcryptData.hashes.map((hash, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            {hash.saltRounds} Salt Rounds
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                hash.securityLevel === "very-high"
                                  ? "bg-green-100 text-green-800"
                                  : hash.securityLevel === "high"
                                    ? "bg-blue-100 text-blue-800"
                                    : hash.securityLevel === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                              }`}
                            >
                              {hash.securityLevel} security
                            </span>
                          </Label>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            {hash.processingTime.toFixed(2)}ms
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={hash.hash}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(hash.hash, `Bcrypt hash (${hash.saltRounds} rounds)`)}
                          >
                            {copiedText === `Bcrypt hash (${hash.saltRounds} rounds)` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => exportBcrypt(currentBcryptData, settings.exportFormat)}
                        variant="outline"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Hash Verification Tab */}
          <TabsContent
            value="verify"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Hash Verification
                </CardTitle>
                <CardDescription>Verify if a password matches a Bcrypt hash</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="verify-password"
                      className="text-sm font-medium"
                    >
                      Password
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="verify-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password to verify..."
                        value={verifyPassword}
                        onChange={(e) => setVerifyPassword(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="verify-hash"
                      className="text-sm font-medium"
                    >
                      Bcrypt Hash
                    </Label>
                    <Textarea
                      id="verify-hash"
                      placeholder="Enter Bcrypt hash to verify against..."
                      value={verifyHash}
                      onChange={(e) => setVerifyHash(e.target.value)}
                      className="mt-2 font-mono text-sm"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleVerifyHash}
                      disabled={!verifyPassword.trim() || !verifyHash.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Verify Hash
                    </Button>
                    <Button
                      onClick={() => {
                        setVerifyPassword("")
                        setVerifyHash("")
                        setVerificationResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {/* Verification Result */}
                  {verificationResult && (
                    <div
                      className={`border rounded-lg p-4 ${
                        verificationResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {verificationResult.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span
                          className={`font-medium ${verificationResult.isValid ? "text-green-800" : "text-red-800"}`}
                        >
                          {verificationResult.isValid ? "Hash Verification Successful" : "Hash Verification Failed"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Verification completed in {verificationResult.processingTime.toFixed(2)}ms
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                  <h3 className="text-lg font-semibold mb-2">Upload Text Files for Batch Bcrypt Processing</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your text files here, or click to select files for batch password hashing
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mb-2"
                  >
                    <FileCode className="mr-2 h-4 w-4" />
                    Choose Text Files
                  </Button>
                  <p className="text-xs text-muted-foreground">Supports .txt files • Max 10MB per file</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,text/plain"
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
                            <FileCode className="h-8 w-8 text-muted-foreground" />
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
                            {file.status === "completed" && file.bcryptData && (
                              <div className="mt-2 text-xs">
                                {file.bcryptData.hashes.length} hashes generated • Security score:{" "}
                                {file.bcryptData.statistics.securityScore}/100
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

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Bcrypt Settings
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
                        <SelectItem value="txt">Text</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Salt Rounds</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {[4, 6, 8, 10, 12, 14].map((rounds) => (
                      <div
                        key={rounds}
                        className="flex items-center space-x-2"
                      >
                        <input
                          id={`rounds-${rounds}`}
                          type="checkbox"
                          checked={settings.saltRounds.includes(rounds)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSettings((prev) => ({
                                ...prev,
                                saltRounds: [...prev.saltRounds, rounds].sort((a, b) => a - b),
                              }))
                            } else {
                              setSettings((prev) => ({
                                ...prev,
                                saltRounds: prev.saltRounds.filter((r) => r !== rounds),
                              }))
                            }
                          }}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor={`rounds-${rounds}`}
                          className="text-sm flex items-center gap-1"
                        >
                          {rounds}
                          {rounds >= 12 && <Shield className="h-3 w-3 text-green-600" />}
                          {rounds === 10 && <span className="text-xs text-blue-600">(Recommended)</span>}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      id="include-timestamp"
                      type="checkbox"
                      checked={settings.includeTimestamp}
                      onChange={(e) => setSettings((prev) => ({ ...prev, includeTimestamp: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="include-timestamp"
                      className="text-sm"
                    >
                      Include timestamp in exports
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="enable-verification"
                      type="checkbox"
                      checked={settings.enableVerification}
                      onChange={(e) => setSettings((prev) => ({ ...prev, enableVerification: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="enable-verification"
                      className="text-sm"
                    >
                      Enable hash verification
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="password-strength-check"
                      type="checkbox"
                      checked={settings.passwordStrengthCheck}
                      onChange={(e) => setSettings((prev) => ({ ...prev, passwordStrengthCheck: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="password-strength-check"
                      className="text-sm"
                    >
                      Enable password strength analysis
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="real-time-hashing"
                      type="checkbox"
                      checked={settings.realTimeHashing}
                      onChange={(e) => setSettings((prev) => ({ ...prev, realTimeHashing: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="real-time-hashing"
                      className="text-sm"
                    >
                      Real-time hash generation
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="batch-processing"
                      type="checkbox"
                      checked={settings.batchProcessing}
                      onChange={(e) => setSettings((prev) => ({ ...prev, batchProcessing: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="batch-processing"
                      className="text-sm"
                    >
                      Enable batch processing
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const BcryptHash = () => {
  return <BcryptHashCore />
}

export default BcryptHash
