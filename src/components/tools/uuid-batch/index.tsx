import { useCallback, useState } from "react"
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
  Zap,
  Settings,
  BookOpen,
  Eye,
  Activity,
  Layers,
  Play,
  Pause,
  Square,
  Grid,
  List,
  BarChart3,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  BatchUUID,
  UUIDAnalysis,
  UUIDStructure,
  UUIDSecurity,
  UUIDQuality,
  UUIDCompatibility,
  BatchOperation,
  BatchStatistics,
  BatchSettings,
  BatchTemplate,
  BatchValidation,
  UUIDType,
  UUIDFormat,
  ExportFormat,
  ViewMode,
} from "@/types/uuid-batch"

// Utility functions

// UUID generation functions
const generateUUID = (type: UUIDType, settings?: Partial<BatchSettings>): string => {
  switch (type) {
    case "uuid_v1":
      // Simulate UUID v1 (timestamp-based)
      const timestamp = Date.now().toString(16)
      const random = Math.random().toString(16).substring(2, 14)
      return `${timestamp.substring(0, 8)}-${timestamp.substring(8, 12)}-1${random.substring(0, 3)}-${random.substring(3, 7)}-${random.substring(7, 19)}`

    case "uuid_v4":
      // Generate UUID v4 (random)
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0
        const v = c === "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })

    case "uuid_v5":
      // Simulate UUID v5 (namespace + name hash)
      const namespace = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
      const name = "batch-" + Math.random().toString(36).substring(2, 8)
      const hash = btoa(namespace + name)
        .replace(/[^a-f0-9]/gi, "")
        .substring(0, 32)
      return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-5${hash.substring(13, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`

    case "nanoid":
      const length = settings?.customLength || 21
      return nanoid(length)

    case "ulid":
      // Simulate ULID (Universally Unique Lexicographically Sortable Identifier)
      const time = Date.now().toString(36).toUpperCase()
      const randomPart = Math.random().toString(36).substring(2, 18).toUpperCase()
      return time + randomPart

    case "cuid":
      // Simulate CUID (Collision-resistant Unique Identifier)
      const timestamp_cuid = Date.now().toString(36)
      const counter = Math.floor(Math.random() * 1000).toString(36)
      const fingerprint = Math.random().toString(36).substring(2, 6)
      const random_cuid = Math.random().toString(36).substring(2, 6)
      return `c${timestamp_cuid}${counter}${fingerprint}${random_cuid}`

    case "short_uuid":
      // Generate short UUID
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    case "custom":
      const customLength = settings?.customLength || 16
      const customAlphabet =
        settings?.customAlphabet || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
      let result = ""
      for (let i = 0; i < customLength; i++) {
        result += customAlphabet.charAt(Math.floor(Math.random() * customAlphabet.length))
      }
      return result

    default:
      return generateUUID("uuid_v4")
  }
}

const formatUUID = (uuid: string, format: UUIDFormat, settings?: Partial<BatchSettings>): string => {
  let formatted = uuid

  // Apply case formatting
  if (settings?.case === "uppercase") {
    formatted = formatted.toUpperCase()
  } else if (settings?.case === "lowercase") {
    formatted = formatted.toLowerCase()
  }

  // Apply format-specific transformations
  switch (format) {
    case "standard":
      // Keep as-is
      break
    case "compact":
      formatted = formatted.replace(/-/g, "")
      break
    case "braced":
      formatted = `{${formatted}}`
      break
    case "urn":
      formatted = `urn:uuid:${formatted}`
      break
    case "base64":
      try {
        formatted = btoa(formatted)
          .replace(/[^A-Za-z0-9]/g, "")
          .substring(0, 22)
      } catch {
        // Fallback if btoa fails
        formatted = formatted.replace(/[^A-Za-z0-9]/g, "").substring(0, 22)
      }
      break
    case "hex":
      formatted = formatted.replace(/-/g, "").toLowerCase()
      break
  }

  // Apply prefix/suffix
  if (settings?.prefix) {
    formatted = settings.prefix + formatted
  }
  if (settings?.suffix) {
    formatted = formatted + settings.suffix
  }

  return formatted
}

const analyzeUUID = (uuid: string, type: UUIDType): UUIDAnalysis => {
  const structure = analyzeUUIDStructure(uuid)
  const security = analyzeUUIDSecurity(uuid, type)
  const quality = analyzeUUIDQuality(uuid, type)
  const compatibility = analyzeUUIDCompatibility(type)

  const recommendations: string[] = []
  const warnings: string[] = []

  // Generate recommendations based on analysis
  if (security.security_score < 70) {
    recommendations.push("Consider using a more secure UUID type for sensitive applications")
  }

  if (quality.overall_quality < 80) {
    recommendations.push("UUID quality could be improved with better randomness")
  }

  if (structure.total_length < 16) {
    warnings.push("Short UUIDs may have higher collision probability")
  }

  if (security.predictability === "high") {
    warnings.push("UUID may be predictable, avoid for security-sensitive use cases")
  }

  return {
    structure,
    security,
    quality,
    compatibility,
    recommendations,
    warnings,
  }
}

const analyzeUUIDStructure = (uuid: string): UUIDStructure => {
  const segments = uuid.split("-")
  const separators = uuid.match(/-/g) || []
  const hasHyphens = separators.length > 0
  const hasBraces = uuid.startsWith("{") && uuid.endsWith("}")

  // Determine character set
  let characterSet = "unknown"
  if (/^[0-9a-fA-F-{}]+$/.test(uuid)) {
    characterSet = "hexadecimal"
  } else if (/^[A-Za-z0-9_-]+$/.test(uuid)) {
    characterSet = "alphanumeric"
  } else if (/^[A-Za-z0-9]+$/.test(uuid)) {
    characterSet = "alphanumeric_no_special"
  }

  // Determine case format
  let caseFormat: "uppercase" | "lowercase" | "mixed" = "mixed"
  if (uuid === uuid.toUpperCase()) {
    caseFormat = "uppercase"
  } else if (uuid === uuid.toLowerCase()) {
    caseFormat = "lowercase"
  }

  return {
    segments,
    separators: separators.map(() => "-"),
    character_set: characterSet,
    case_format: caseFormat,
    has_hyphens: hasHyphens,
    has_braces: hasBraces,
    total_length: uuid.length,
    data_length: uuid.replace(/[-{}]/g, "").length,
  }
}

const analyzeUUIDSecurity = (uuid: string, type: UUIDType): UUIDSecurity => {
  const dataLength = uuid.replace(/[-{}]/g, "").length
  const entropyBits = dataLength * 4 // Approximate for hex characters

  let predictability: "low" | "medium" | "high" = "low"
  let cryptographicStrength: "weak" | "moderate" | "strong" | "very_strong" = "strong"
  let collisionResistance: "low" | "medium" | "high" | "very_high" = "high"

  // Analyze based on UUID type
  switch (type) {
    case "uuid_v1":
      predictability = "high" // Contains timestamp
      cryptographicStrength = "moderate"
      collisionResistance = "medium"
      break
    case "uuid_v4":
      predictability = "low"
      cryptographicStrength = "strong"
      collisionResistance = "high"
      break
    case "short_uuid":
      collisionResistance = "medium"
      if (dataLength < 16) cryptographicStrength = "moderate"
      break
    case "custom":
      if (dataLength < 12) {
        cryptographicStrength = "weak"
        collisionResistance = "low"
      } else if (dataLength < 16) {
        collisionResistance = "medium"
      } else if (dataLength < 32) {
        collisionResistance = "high"
      } else {
        collisionResistance = "very_high"
      }
      break
    case "nanoid":
      collisionResistance = "high"
      break
    case "ulid":
      collisionResistance = "high"
      break
    case "cuid":
      collisionResistance = "high"
      break
    default:
      collisionResistance = "medium"
      break
  }

  // Calculate security score
  let securityScore = 100
  if (predictability === "high") securityScore -= 30
  // @ts-ignore
  if (predictability === "medium") securityScore -= 15
  if (cryptographicStrength === "weak") securityScore -= 40
  if (cryptographicStrength === "moderate") securityScore -= 20
  if (collisionResistance === "low") {
    securityScore -= 25
  } else if (collisionResistance === "medium") {
    securityScore -= 10
  }
  if (entropyBits < 64) securityScore -= 20

  return {
    predictability,
    entropy_bits: entropyBits,
    cryptographic_strength: cryptographicStrength,
    timing_attack_resistant: type !== "uuid_v1",
    collision_resistance: collisionResistance,
    security_score: Math.max(0, securityScore),
  }
}

const analyzeUUIDQuality = (uuid: string, type: UUIDType): UUIDQuality => {
  const dataLength = uuid.replace(/[-{}]/g, "").length

  // Calculate uniqueness score based on length and entropy
  let uniquenessScore = Math.min(100, (dataLength / 32) * 100)

  // Calculate randomness score
  const chars = uuid.replace(/[-{}]/g, "").split("")
  const charFreq: Record<string, number> = {}
  chars.forEach((char) => {
    charFreq[char] = (charFreq[char] || 0) + 1
  })

  const maxFreq = Math.max(...Object.values(charFreq))
  const randomnessScore = Math.max(0, 100 - (maxFreq / chars.length) * 100)

  // Format compliance score
  let formatCompliance = 100
  if (type === "uuid_v4" && !uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    formatCompliance = 50
  }

  // Readability score
  const readabilityScore = uuid.includes("-") ? 90 : 70

  // Overall quality
  const overallQuality = (uniquenessScore + randomnessScore + formatCompliance + readabilityScore) / 4

  const issues: string[] = []
  const strengths: string[] = []

  if (uniquenessScore < 70) issues.push("Low uniqueness due to short length")
  if (randomnessScore < 70) issues.push("Poor randomness distribution")
  if (formatCompliance < 90) issues.push("Non-standard format")

  if (uniquenessScore >= 90) strengths.push("High uniqueness")
  if (randomnessScore >= 80) strengths.push("Good randomness")
  if (formatCompliance >= 90) strengths.push("Standard compliant")

  return {
    uniqueness_score: uniquenessScore,
    randomness_score: randomnessScore,
    format_compliance: formatCompliance,
    readability_score: readabilityScore,
    overall_quality: overallQuality,
    issues,
    strengths,
  }
}

const analyzeUUIDCompatibility = (type: UUIDType): UUIDCompatibility => {
  const compatibility: UUIDCompatibility = {
    database_systems: [],
    programming_languages: [],
    web_standards: [],
    api_compatibility: [],
    limitations: [],
  }

  switch (type) {
    case "uuid_v4":
      compatibility.database_systems = ["PostgreSQL", "MySQL", "SQL Server", "Oracle", "MongoDB"]
      compatibility.programming_languages = ["JavaScript", "Python", "Java", "C#", "Go", "Rust", "PHP"]
      compatibility.web_standards = ["RFC 4122", "JSON", "XML", "REST APIs"]
      compatibility.api_compatibility = ["GraphQL", "REST", "gRPC", "OpenAPI"]
      break
    case "uuid_v1":
      compatibility.database_systems = ["PostgreSQL", "MySQL", "SQL Server", "Oracle"]
      compatibility.programming_languages = ["JavaScript", "Python", "Java", "C#"]
      compatibility.web_standards = ["RFC 4122"]
      compatibility.limitations = ["Contains timestamp", "May reveal system information"]
      break
    case "nanoid":
      compatibility.database_systems = ["PostgreSQL", "MySQL", "MongoDB", "Redis"]
      compatibility.programming_languages = ["JavaScript", "Python", "Go", "Rust"]
      compatibility.web_standards = ["URL-safe", "JSON"]
      compatibility.api_compatibility = ["REST", "GraphQL"]
      break
    case "ulid":
      compatibility.database_systems = ["PostgreSQL", "MySQL", "MongoDB"]
      compatibility.programming_languages = ["JavaScript", "Python", "Go"]
      compatibility.web_standards = ["Lexicographically sortable"]
      compatibility.limitations = ["Contains timestamp"]
      break
    case "short_uuid":
      compatibility.database_systems = ["Most databases as string"]
      compatibility.programming_languages = ["Most languages"]
      compatibility.limitations = ["Higher collision probability", "Not standard compliant"]
      break
  }

  return compatibility
}

// Batch templates
const batchTemplates: BatchTemplate[] = [
  {
    id: "small-batch",
    name: "Small Batch (100)",
    description: "Generate 100 UUIDs for small-scale applications",
    category: "Small",
    settings: {
      type: "uuid_v4",
      count: 100,
      format: "standard",
      case: "lowercase",
      batchSize: 50,
      enableAnalysis: true,
      enableValidation: true,
      enableDeduplication: true,
    },
    useCase: ["Development testing", "Small datasets", "Prototyping", "Local applications"],
    examples: ["Test data generation", "Development IDs", "Sample datasets"],
    estimatedTime: "< 1 second",
  },
  {
    id: "medium-batch",
    name: "Medium Batch (1,000)",
    description: "Generate 1,000 UUIDs for medium-scale applications",
    category: "Medium",
    settings: {
      type: "uuid_v4",
      count: 1000,
      format: "standard",
      case: "lowercase",
      batchSize: 100,
      enableAnalysis: true,
      enableValidation: true,
      enableDeduplication: true,
    },
    useCase: ["Production systems", "Database seeding", "API testing", "Medium datasets"],
    examples: ["Database records", "API identifiers", "Session tokens"],
    estimatedTime: "1-3 seconds",
  },
  {
    id: "large-batch",
    name: "Large Batch (10,000)",
    description: "Generate 10,000 UUIDs for large-scale applications",
    category: "Large",
    settings: {
      type: "uuid_v4",
      count: 10000,
      format: "standard",
      case: "lowercase",
      batchSize: 500,
      enableAnalysis: false,
      enableValidation: true,
      enableDeduplication: true,
    },
    useCase: ["Enterprise systems", "Big data", "Mass imports", "Large datasets"],
    examples: ["Enterprise records", "Bulk operations", "Data migration"],
    estimatedTime: "5-10 seconds",
  },
  {
    id: "performance-batch",
    name: "Performance Batch (50,000)",
    description: "Generate 50,000 UUIDs optimized for performance",
    category: "Performance",
    settings: {
      type: "nanoid",
      count: 50000,
      format: "standard",
      case: "lowercase",
      batchSize: 1000,
      enableAnalysis: false,
      enableValidation: false,
      enableDeduplication: false,
    },
    useCase: ["High-performance systems", "Bulk generation", "Performance testing", "Mass operations"],
    examples: ["Performance benchmarks", "Stress testing", "Bulk imports"],
    estimatedTime: "10-20 seconds",
  },
  {
    id: "secure-batch",
    name: "Secure Batch (1,000)",
    description: "Generate 1,000 high-security UUIDs with analysis",
    category: "Security",
    settings: {
      type: "uuid_v4",
      count: 1000,
      format: "standard",
      case: "lowercase",
      batchSize: 50,
      enableAnalysis: true,
      enableValidation: true,
      enableDeduplication: true,
      filterCriteria: {
        minSecurity: 80,
        validOnly: true,
      },
    },
    useCase: ["Security tokens", "Cryptographic applications", "High-security systems", "Authentication"],
    examples: ["API keys", "Session tokens", "Security identifiers"],
    estimatedTime: "2-5 seconds",
  },
  {
    id: "custom-batch",
    name: "Custom Batch",
    description: "Generate custom UUIDs with specific requirements",
    category: "Custom",
    settings: {
      type: "custom",
      count: 500,
      format: "standard",
      case: "lowercase",
      customLength: 32,
      customAlphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      batchSize: 100,
      enableAnalysis: true,
      enableValidation: true,
      enableDeduplication: true,
    },
    useCase: ["Specialized applications", "Custom requirements", "Specific formats", "Legacy systems"],
    examples: ["Custom identifiers", "Legacy compatibility", "Specific formats"],
    estimatedTime: "1-3 seconds",
  },
]

// Validation functions
const validateBatchSettings = (settings: BatchSettings): BatchValidation => {
  const validation: BatchValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  // Count validation
  if (settings.count <= 0) {
    validation.isValid = false
    validation.errors.push({
      message: "Count must be greater than 0",
      type: "count",
      severity: "error",
    })
  }

  if (settings.count > 100000) {
    validation.isValid = false
    validation.errors.push({
      message: "Count exceeds maximum limit of 100,000",
      type: "count",
      severity: "error",
    })
  }

  // Performance warnings
  if (settings.count > 10000 && settings.enableAnalysis) {
    validation.warnings.push("Large batch with analysis enabled may impact performance")
    validation.suggestions.push("Consider disabling analysis for better performance")
  }

  if (settings.count > 50000) {
    validation.warnings.push("Very large batch may consume significant memory")
    validation.suggestions.push("Consider processing in smaller chunks")
  }

  // Batch size validation
  if (settings.batchSize > settings.count) {
    validation.warnings.push("Batch size is larger than total count")
    validation.suggestions.push("Reduce batch size for better progress tracking")
  }

  // Custom settings validation
  if (settings.type === "custom") {
    if (!settings.customLength || settings.customLength < 4) {
      validation.errors.push({
        message: "Custom length must be at least 4 characters",
        type: "settings",
        severity: "error",
      })
      validation.isValid = false
    }

    if (!settings.customAlphabet || settings.customAlphabet.length < 2) {
      validation.errors.push({
        message: "Custom alphabet must contain at least 2 characters",
        type: "settings",
        severity: "error",
      })
      validation.isValid = false
    }
  }

  return validation
}

// Custom hooks
const useBatchProcessor = () => {
  const [operations, setOperations] = useState<BatchOperation[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const createBatchOperation = useCallback((name: string, settings: BatchSettings): BatchOperation => {
    const operation: BatchOperation = {
      id: nanoid(),
      name,
      type: settings.type,
      count: settings.count,
      settings,
      uuids: [],
      status: "pending",
      progress: 0,
      statistics: {
        totalGenerated: 0,
        validCount: 0,
        invalidCount: 0,
        uniqueCount: 0,
        duplicateCount: 0,
        averageEntropy: 0,
        averageQuality: 0,
        averageSecurity: 0,
        generationTime: 0,
        collisionRate: 0,
        securityDistribution: {},
        qualityDistribution: {},
        lengthDistribution: {},
      },
      createdAt: new Date(),
    }

    setOperations((prev) => [operation, ...prev])
    return operation
  }, [])

  const processBatchOperation = useCallback(
    async (operationId: string) => {
      setIsProcessing(true)

      try {
        const operation = operations.find((op) => op.id === operationId)
        if (!operation) throw new Error("Operation not found")

        // Update status to processing
        setOperations((prev) =>
          prev.map((op) => (op.id === operationId ? { ...op, status: "processing" as const, progress: 0 } : op))
        )

        const startTime = performance.now()
        const batchUUIDs: BatchUUID[] = []
        const batchSize = operation.settings.batchSize
        const totalBatches = Math.ceil(operation.count / batchSize)

        // Process in batches
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const currentBatchSize = Math.min(batchSize, operation.count - batchIndex * batchSize)

          // Generate UUIDs for current batch
          for (let i = 0; i < currentBatchSize; i++) {
            const globalIndex = batchIndex * batchSize + i

            try {
              const rawUuid = generateUUID(operation.settings.type, operation.settings)
              const formattedUuid = formatUUID(rawUuid, operation.settings.format, operation.settings)

              const batchUuid: BatchUUID = {
                id: nanoid(),
                value: formattedUuid,
                type: operation.settings.type,
                version: getUUIDVersion(operation.settings.type),
                timestamp: new Date(),
                isValid: true,
                selected: false,
                index: globalIndex,
              }

              // Add metadata and analysis if enabled
              if (operation.settings.enableAnalysis) {
                batchUuid.metadata = {
                  length: formattedUuid.length,
                  format: operation.settings.format,
                  encoding: "UTF-8",
                  entropy: formattedUuid.replace(/[-{}]/g, "").length * 4,
                  randomness: calculateRandomness(formattedUuid),
                  collision_probability: calculateCollisionProbability(formattedUuid),
                  security_level: getSecurityLevel(operation.settings.type, formattedUuid.length),
                  use_cases: getUseCases(operation.settings.type),
                  standards_compliance: getStandardsCompliance(operation.settings.type),
                }

                batchUuid.analysis = analyzeUUID(formattedUuid, operation.settings.type)
              }

              batchUUIDs.push(batchUuid)
            } catch (error) {
              const batchUuid: BatchUUID = {
                id: nanoid(),
                value: "",
                type: operation.settings.type,
                timestamp: new Date(),
                isValid: false,
                error: error instanceof Error ? error.message : "Generation failed",
                selected: false,
                index: globalIndex,
              }
              batchUUIDs.push(batchUuid)
            }
          }

          // Update progress
          const progress = ((batchIndex + 1) / totalBatches) * 100
          setOperations((prev) =>
            prev.map((op) => (op.id === operationId ? { ...op, progress, uuids: [...batchUUIDs] } : op))
          )

          // Allow UI to update
          await new Promise((resolve) => setTimeout(resolve, 10))
        }

        const endTime = performance.now()
        const generationTime = endTime - startTime

        // Calculate statistics
        const validUUIDs = batchUUIDs.filter((uuid) => uuid.isValid)
        const uniqueValues = new Set(validUUIDs.map((uuid) => uuid.value))
        const duplicateCount = validUUIDs.length - uniqueValues.size

        const averageEntropy =
          validUUIDs.reduce((sum, uuid) => sum + (uuid.metadata?.entropy || 0), 0) / validUUIDs.length
        const averageQuality =
          validUUIDs.reduce((sum, uuid) => sum + (uuid.analysis?.quality.overall_quality || 0), 0) / validUUIDs.length
        const averageSecurity =
          validUUIDs.reduce((sum, uuid) => sum + (uuid.analysis?.security.security_score || 0), 0) / validUUIDs.length

        // Distribution calculations
        const securityDistribution: Record<string, number> = {}
        const qualityDistribution: Record<string, number> = {}
        const lengthDistribution: Record<string, number> = {}

        validUUIDs.forEach((uuid) => {
          if (uuid.metadata?.security_level) {
            securityDistribution[uuid.metadata.security_level] =
              (securityDistribution[uuid.metadata.security_level] || 0) + 1
          }

          if (uuid.analysis?.quality.overall_quality) {
            const qualityRange = Math.floor(uuid.analysis.quality.overall_quality / 10) * 10
            const key = `${qualityRange}-${qualityRange + 9}`
            qualityDistribution[key] = (qualityDistribution[key] || 0) + 1
          }

          const length = uuid.value.length
          lengthDistribution[length.toString()] = (lengthDistribution[length.toString()] || 0) + 1
        })

        const statistics: BatchStatistics = {
          totalGenerated: batchUUIDs.length,
          validCount: validUUIDs.length,
          invalidCount: batchUUIDs.length - validUUIDs.length,
          uniqueCount: uniqueValues.size,
          duplicateCount,
          averageEntropy: averageEntropy || 0,
          averageQuality: averageQuality || 0,
          averageSecurity: averageSecurity || 0,
          generationTime,
          collisionRate: duplicateCount / batchUUIDs.length,
          securityDistribution,
          qualityDistribution,
          lengthDistribution,
        }

        // Update final operation
        setOperations((prev) =>
          prev.map((op) =>
            op.id === operationId
              ? {
                  ...op,
                  status: "completed" as const,
                  progress: 100,
                  uuids: batchUUIDs,
                  statistics,
                  completedAt: new Date(),
                }
              : op
          )
        )

        return statistics
      } catch (error) {
        setOperations((prev) =>
          prev.map((op) =>
            op.id === operationId
              ? {
                  ...op,
                  status: "failed" as const,
                  error: error instanceof Error ? error.message : "Batch processing failed",
                }
              : op
          )
        )
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [operations]
  )

  const pauseBatchOperation = useCallback((operationId: string) => {
    setOperations((prev) =>
      prev.map((op) =>
        op.id === operationId && op.status === "processing" ? { ...op, status: "paused" as const } : op
      )
    )
  }, [])

  const resumeBatchOperation = useCallback((operationId: string) => {
    setOperations((prev) =>
      prev.map((op) =>
        op.id === operationId && op.status === "paused" ? { ...op, status: "processing" as const } : op
      )
    )
  }, [])

  const cancelBatchOperation = useCallback((operationId: string) => {
    setOperations((prev) =>
      prev.map((op) =>
        op.id === operationId && (op.status === "processing" || op.status === "paused")
          ? { ...op, status: "failed" as const, error: "Cancelled by user" }
          : op
      )
    )
  }, [])

  const removeOperation = useCallback((operationId: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== operationId))
  }, [])

  const clearOperations = useCallback(() => {
    setOperations([])
  }, [])

  return {
    operations,
    isProcessing,
    createBatchOperation,
    processBatchOperation,
    pauseBatchOperation,
    resumeBatchOperation,
    cancelBatchOperation,
    removeOperation,
    clearOperations,
  }
}

// Helper functions
const calculateRandomness = (uuid: string): number => {
  const chars = uuid.replace(/[-{}]/g, "").split("")
  const charFreq: Record<string, number> = {}
  chars.forEach((char) => {
    charFreq[char] = (charFreq[char] || 0) + 1
  })

  const maxFreq = Math.max(...Object.values(charFreq))
  return Math.max(0, 100 - (maxFreq / chars.length) * 100)
}

const calculateCollisionProbability = (uuid: string): number => {
  const dataLength = uuid.replace(/[-{}]/g, "").length
  const entropy = dataLength * 4 // bits for hex characters

  // Simplified collision probability calculation
  return Math.pow(2, -entropy / 2)
}

const getSecurityLevel = (type: UUIDType, length: number): "low" | "medium" | "high" | "very_high" => {
  if (type === "uuid_v1") return "medium" // Predictable timestamp
  if (type === "short_uuid" || length < 16) return "low"
  if (type === "uuid_v4" && length >= 32) return "very_high"
  if (type === "nanoid" || type === "custom") return "high"
  return "medium"
}

const getUseCases = (type: UUIDType): string[] => {
  switch (type) {
    case "uuid_v4":
      return ["Database primary keys", "API identifiers", "Session tokens", "General purpose IDs"]
    case "uuid_v1":
      return ["Time-ordered records", "Database clustering", "Distributed systems"]
    case "nanoid":
      return ["URL slugs", "File names", "Short links", "User-friendly IDs"]
    case "ulid":
      return ["Time-ordered records", "Log entries", "Event sourcing"]
    case "cuid":
      return ["Client-side generation", "Collision-resistant IDs"]
    case "short_uuid":
      return ["Temporary IDs", "Internal references", "Development"]
    case "custom":
      return ["Specialized applications", "Custom requirements"]
    default:
      return ["General purpose"]
  }
}

const getStandardsCompliance = (type: UUIDType): string[] => {
  switch (type) {
    case "uuid_v4":
    case "uuid_v1":
    case "uuid_v5":
      return ["RFC 4122", "ISO/IEC 9834-8"]
    case "nanoid":
      return ["URL-safe", "Base64-compatible"]
    case "ulid":
      return ["Lexicographically sortable", "Crockford Base32"]
    default:
      return ["Custom format"]
  }
}

const getUUIDVersion = (type: UUIDType): number | undefined => {
  switch (type) {
    case "uuid_v1":
      return 1
    case "uuid_v4":
      return 4
    case "uuid_v5":
      return 5
    default:
      return undefined
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
const useBatchExport = () => {
  const exportBatch = useCallback((operation: BatchOperation, format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "json":
        const jsonData = {
          operation: {
            id: operation.id,
            name: operation.name,
            type: operation.type,
            count: operation.count,
            settings: operation.settings,
            status: operation.status,
            statistics: operation.statistics,
            createdAt: operation.createdAt,
            completedAt: operation.completedAt,
          },
          uuids: operation.uuids.map((uuid) => ({
            id: uuid.id,
            value: uuid.value,
            type: uuid.type,
            version: uuid.version,
            timestamp: uuid.timestamp,
            isValid: uuid.isValid,
            error: uuid.error,
            metadata: uuid.metadata,
            analysis: uuid.analysis,
            index: uuid.index,
          })),
        }
        content = JSON.stringify(jsonData, null, 2)
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        const csvHeaders = [
          "Index",
          "UUID",
          "Type",
          "Version",
          "Valid",
          "Length",
          "Security Level",
          "Quality Score",
          "Security Score",
          "Entropy",
          "Timestamp",
        ]
        const csvRows: string[] = []
        operation.uuids.forEach((uuid) => {
          csvRows.push(
            [
              uuid.index.toString(),
              uuid.value,
              uuid.type,
              uuid.version?.toString() || "",
              uuid.isValid ? "Yes" : "No",
              uuid.metadata?.length.toString() || uuid.value.length.toString(),
              uuid.metadata?.security_level || "",
              uuid.analysis?.quality.overall_quality?.toFixed(1) || "",
              uuid.analysis?.security.security_score?.toString() || "",
              uuid.metadata?.entropy?.toString() || "",
              uuid.timestamp.toISOString(),
            ]
              .map((field) => `"${field.replace(/"/g, '""')}"`)
              .join(",")
          )
        })
        content = [csvHeaders.join(","), ...csvRows].join("\n")
        mimeType = "text/csv"
        extension = ".csv"
        break
      case "xml":
        const xmlData = operation.uuids
          .map(
            (uuid) => `
  <uuid>
    <index>${uuid.index}</index>
    <value><![CDATA[${uuid.value}]]></value>
    <type>${uuid.type}</type>
    <version>${uuid.version || ""}</version>
    <valid>${uuid.isValid}</valid>
    <metadata>
      <length>${uuid.metadata?.length || uuid.value.length}</length>
      <securityLevel>${uuid.metadata?.security_level || ""}</securityLevel>
      <entropy>${uuid.metadata?.entropy || 0}</entropy>
    </metadata>
    <analysis>
      <qualityScore>${uuid.analysis?.quality.overall_quality || 0}</qualityScore>
      <securityScore>${uuid.analysis?.security.security_score || 0}</securityScore>
    </analysis>
    <timestamp>${uuid.timestamp.toISOString()}</timestamp>
  </uuid>`
          )
          .join("")
        content = `<?xml version="1.0" encoding="UTF-8"?>\n<batchOperation id="${operation.id}" name="${operation.name}">${xmlData}\n</batchOperation>`
        mimeType = "application/xml"
        extension = ".xml"
        break
      case "txt":
      default:
        content = generateTextFromBatch(operation)
        mimeType = "text/plain"
        extension = ".txt"
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `uuid-batch-${operation.name}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportUUIDs = useCallback((uuids: BatchUUID[], format: ExportFormat, filename?: string) => {
    let content = ""

    switch (format) {
      case "txt":
      default:
        content = uuids.map((uuid) => uuid.value).join("\n")
        break
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || "uuids.txt"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportBatch, exportUUIDs }
}

// Generate text report from batch
const generateTextFromBatch = (operation: BatchOperation): string => {
  return `UUID Batch Operation Report
==========================

Operation Details:
- ID: ${operation.id}
- Name: ${operation.name}
- Type: ${operation.type}
- Count: ${operation.count}
- Status: ${operation.status}
- Created: ${operation.createdAt.toLocaleString()}
- Completed: ${operation.completedAt?.toLocaleString() || "N/A"}

Statistics:
- Total Generated: ${operation.statistics.totalGenerated}
- Valid UUIDs: ${operation.statistics.validCount}
- Invalid UUIDs: ${operation.statistics.invalidCount}
- Unique UUIDs: ${operation.statistics.uniqueCount}
- Duplicate UUIDs: ${operation.statistics.duplicateCount}
- Generation Time: ${operation.statistics.generationTime.toFixed(2)}ms
- Collision Rate: ${(operation.statistics.collisionRate * 100).toFixed(4)}%
- Average Quality: ${operation.statistics.averageQuality.toFixed(1)}/100
- Average Security: ${operation.statistics.averageSecurity.toFixed(1)}/100
- Average Entropy: ${operation.statistics.averageEntropy.toFixed(1)} bits

Generated UUIDs:
${operation.uuids
  .map((uuid, i) => {
    return `${i + 1}. ${uuid.value}${uuid.isValid ? "" : " (INVALID)"}`
  })
  .join("\n")}

Security Distribution:
${Object.entries(operation.statistics.securityDistribution)
  .map(
    ([level, count]) => `- ${level}: ${count} (${((count / operation.statistics.totalGenerated) * 100).toFixed(1)}%)`
  )
  .join("\n")}

Quality Distribution:
${Object.entries(operation.statistics.qualityDistribution)
  .map(
    ([range, count]) => `- ${range}: ${count} (${((count / operation.statistics.totalGenerated) * 100).toFixed(1)}%)`
  )
  .join("\n")}
`
}

/**
 * Enhanced UUID Batch Generator & Management Tool
 * Features: Advanced batch processing, analysis, filtering, and export capabilities
 */
const UUIDBatchCore = () => {
  const [activeTab, setActiveTab] = useState<"batch" | "operations" | "analytics" | "templates">("batch")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [settings, setSettings] = useState<BatchSettings>({
    type: "uuid_v4",
    count: 100,
    format: "standard",
    case: "lowercase",
    includeBraces: false,
    includeHyphens: true,
    batchSize: 50,
    enableAnalysis: true,
    enableValidation: true,
    enableDeduplication: true,
    sortOrder: "none",
    exportFormat: "txt",
  })

  const {
    operations,
    isProcessing,
    createBatchOperation,
    processBatchOperation,
    pauseBatchOperation,
    resumeBatchOperation,
    cancelBatchOperation,
    removeOperation,
    clearOperations,
  } = useBatchProcessor()

  const { exportBatch, exportUUIDs } = useBatchExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = batchTemplates.find((t) => t.id === templateId)
    if (template) {
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Start batch operation
  const handleStartBatch = useCallback(async () => {
    const validation = validateBatchSettings(settings)
    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        toast.error(error.message)
      })
      return
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        toast.warning(warning)
      })
    }

    try {
      const operationName = `Batch ${settings.count} ${settings.type}`
      const operation = createBatchOperation(operationName, settings)
      await processBatchOperation(operation.id)
      toast.success(`Batch operation completed: ${settings.count} UUIDs generated`)
    } catch (error) {
      toast.error(`Batch operation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }, [settings, createBatchOperation, processBatchOperation])

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
              <Layers className="h-5 w-5" />
              UUID Batch Generator & Management Tool
            </CardTitle>
            <CardDescription>
              Advanced batch UUID generation tool with comprehensive analysis, filtering, and management capabilities.
              Generate thousands of UUIDs efficiently, analyze quality and security, and export in multiple formats. Use
              keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "batch" | "operations" | "analytics" | "templates")}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="batch"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Batch Generator
            </TabsTrigger>
            <TabsTrigger
              value="operations"
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Operations
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Batch Generator Tab */}
          <TabsContent
            value="batch"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Batch Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Batch Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="batch-count"
                        className="text-sm font-medium"
                      >
                        Count
                      </Label>
                      <Input
                        id="batch-count"
                        type="number"
                        min="1"
                        max="100000"
                        value={settings.count}
                        onChange={(e) => setSettings((prev) => ({ ...prev, count: parseInt(e.target.value) || 100 }))}
                        className="mt-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">Maximum: 100,000 UUIDs</div>
                    </div>

                    <div>
                      <Label
                        htmlFor="batch-type"
                        className="text-sm font-medium"
                      >
                        UUID Type
                      </Label>
                      <Select
                        value={settings.type}
                        onValueChange={(value: UUIDType) => setSettings((prev) => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uuid_v4">UUID v4 (Random)</SelectItem>
                          <SelectItem value="uuid_v1">UUID v1 (Timestamp)</SelectItem>
                          <SelectItem value="uuid_v5">UUID v5 (Namespace)</SelectItem>
                          <SelectItem value="nanoid">NanoID</SelectItem>
                          <SelectItem value="ulid">ULID</SelectItem>
                          <SelectItem value="cuid">CUID</SelectItem>
                          <SelectItem value="short_uuid">Short UUID</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="batch-format"
                        className="text-sm font-medium"
                      >
                        Format
                      </Label>
                      <Select
                        value={settings.format}
                        onValueChange={(value: UUIDFormat) => setSettings((prev) => ({ ...prev, format: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="braced">Braced</SelectItem>
                          <SelectItem value="urn">URN</SelectItem>
                          <SelectItem value="base64">Base64</SelectItem>
                          <SelectItem value="hex">Hexadecimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="batch-size"
                        className="text-sm font-medium"
                      >
                        Batch Size
                      </Label>
                      <Input
                        id="batch-size"
                        type="number"
                        min="10"
                        max="1000"
                        value={settings.batchSize}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, batchSize: parseInt(e.target.value) || 50 }))
                        }
                        className="mt-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">Processing chunk size</div>
                    </div>
                  </div>

                  {/* Custom Settings */}
                  {settings.type === "custom" && (
                    <div className="space-y-3 border-t pt-4">
                      <Label className="text-sm font-medium">Custom Settings</Label>

                      <div>
                        <Label
                          htmlFor="custom-length"
                          className="text-xs"
                        >
                          Length
                        </Label>
                        <Input
                          id="custom-length"
                          type="number"
                          min="4"
                          max="128"
                          value={settings.customLength || 32}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, customLength: parseInt(e.target.value) || 32 }))
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="custom-alphabet"
                          className="text-xs"
                        >
                          Custom Alphabet
                        </Label>
                        <Textarea
                          id="custom-alphabet"
                          value={
                            settings.customAlphabet || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
                          }
                          onChange={(e) => setSettings((prev) => ({ ...prev, customAlphabet: e.target.value }))}
                          className="mt-1 font-mono text-xs"
                          rows={2}
                          placeholder="Characters to use for generation"
                        />
                      </div>
                    </div>
                  )}

                  {/* Processing Options */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Processing Options</Label>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="enable-analysis"
                          type="checkbox"
                          checked={settings.enableAnalysis}
                          onChange={(e) => setSettings((prev) => ({ ...prev, enableAnalysis: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="enable-analysis"
                          className="text-xs"
                        >
                          Enable quality and security analysis
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="enable-validation"
                          type="checkbox"
                          checked={settings.enableValidation}
                          onChange={(e) => setSettings((prev) => ({ ...prev, enableValidation: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="enable-validation"
                          className="text-xs"
                        >
                          Enable UUID validation
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="enable-deduplication"
                          type="checkbox"
                          checked={settings.enableDeduplication}
                          onChange={(e) => setSettings((prev) => ({ ...prev, enableDeduplication: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label
                          htmlFor="enable-deduplication"
                          className="text-xs"
                        >
                          Enable duplicate detection
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartBatch}
                      disabled={isProcessing || settings.count <= 0}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Generate Batch
                    </Button>
                    <Button
                      onClick={() =>
                        setSettings({
                          type: "uuid_v4",
                          count: 100,
                          format: "standard",
                          case: "lowercase",
                          includeBraces: false,
                          includeHyphens: true,
                          batchSize: 50,
                          enableAnalysis: true,
                          enableValidation: true,
                          enableDeduplication: true,
                          sortOrder: "none",
                          exportFormat: "txt",
                        })
                      }
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Quick Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {operations.length > 0 && operations[0].status === "completed" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Latest Batch ({operations[0].uuids.length} UUIDs)</Label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                          >
                            {viewMode === "list" ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportUUIDs(operations[0].uuids, "txt")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div
                        className={`max-h-96 overflow-y-auto ${
                          viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-2" : "space-y-2"
                        }`}
                      >
                        {operations[0].uuids.slice(0, 50).map((uuid) => (
                          <div
                            key={uuid.id}
                            className={`flex items-center justify-between p-2 border rounded ${
                              viewMode === "grid" ? "text-xs" : "text-sm"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-mono truncate">{uuid.value}</div>
                              {viewMode === "list" && (
                                <div className="text-xs text-muted-foreground">
                                  {uuid.type} • {uuid.isValid ? "Valid" : "Invalid"}
                                  {uuid.analysis &&
                                    ` • Quality: ${uuid.analysis.quality.overall_quality.toFixed(0)}/100`}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(uuid.value, "UUID")}
                            >
                              {copiedText === "UUID" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        ))}
                        {operations[0].uuids.length > 50 && (
                          <div className="text-center text-sm text-muted-foreground py-2">
                            ... and {operations[0].uuids.length - 50} more UUIDs
                          </div>
                        )}
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4">
                        <div>
                          <div className="font-medium">Total</div>
                          <div className="text-lg">{operations[0].statistics.totalGenerated}</div>
                        </div>
                        <div>
                          <div className="font-medium">Valid</div>
                          <div className="text-lg text-green-600">{operations[0].statistics.validCount}</div>
                        </div>
                        <div>
                          <div className="font-medium">Unique</div>
                          <div className="text-lg text-blue-600">{operations[0].statistics.uniqueCount}</div>
                        </div>
                        <div>
                          <div className="font-medium">Time</div>
                          <div className="text-lg">{operations[0].statistics.generationTime.toFixed(0)}ms</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Batch Generated</h3>
                      <p className="text-muted-foreground mb-4">
                        Configure settings and generate a batch to see preview
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent
            value="operations"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Batch Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {operations.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Operations ({operations.length})</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearOperations}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {operations.map((operation) => (
                        <div
                          key={operation.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-medium text-sm">{operation.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {operation.count} UUIDs • {operation.createdAt.toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  operation.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : operation.status === "failed"
                                      ? "bg-red-100 text-red-800"
                                      : operation.status === "processing"
                                        ? "bg-blue-100 text-blue-800"
                                        : operation.status === "paused"
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {operation.status}
                              </span>

                              {operation.status === "processing" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => pauseBatchOperation(operation.id)}
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                              )}

                              {operation.status === "paused" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => resumeBatchOperation(operation.id)}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}

                              {(operation.status === "processing" || operation.status === "paused") && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => cancelBatchOperation(operation.id)}
                                >
                                  <Square className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeOperation(operation.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {operation.status === "processing" && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>Processing...</span>
                                <span>{operation.progress.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${operation.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Operation Statistics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <div>
                                <strong>Generated:</strong> {operation.statistics.totalGenerated}
                              </div>
                              <div>
                                <strong>Valid:</strong> {operation.statistics.validCount}
                              </div>
                            </div>
                            <div>
                              <div>
                                <strong>Unique:</strong> {operation.statistics.uniqueCount}
                              </div>
                              <div>
                                <strong>Duplicates:</strong> {operation.statistics.duplicateCount}
                              </div>
                            </div>
                            <div>
                              <div>
                                <strong>Avg Quality:</strong> {operation.statistics.averageQuality.toFixed(1)}
                              </div>
                              <div>
                                <strong>Avg Security:</strong> {operation.statistics.averageSecurity.toFixed(1)}
                              </div>
                            </div>
                            <div>
                              <div>
                                <strong>Time:</strong> {operation.statistics.generationTime.toFixed(0)}ms
                              </div>
                              <div>
                                <strong>Collision Rate:</strong> {(operation.statistics.collisionRate * 100).toFixed(4)}
                                %
                              </div>
                            </div>
                          </div>

                          {/* Export Options */}
                          {operation.status === "completed" && (
                            <div className="flex gap-2 mt-3 pt-3 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportBatch(operation, "txt")}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Export TXT
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportBatch(operation, "json")}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Export JSON
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportBatch(operation, "csv")}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Operations</h3>
                    <p className="text-muted-foreground mb-4">Start a batch operation to see it here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent
            value="analytics"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Batch Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {operations.length > 0 ? (
                  <div className="space-y-6">
                    {/* Overall Statistics */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">Overall Statistics</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="text-2xl font-bold">
                            {operations.reduce((sum, op) => sum + op.statistics.totalGenerated, 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total UUIDs Generated</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {operations.reduce((sum, op) => sum + op.statistics.validCount, 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Valid UUIDs</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {operations.reduce((sum, op) => sum + op.statistics.uniqueCount, 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Unique UUIDs</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="text-2xl font-bold">
                            {operations.filter((op) => op.status === "completed").length}
                          </div>
                          <div className="text-sm text-muted-foreground">Completed Operations</div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">Performance Metrics</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="text-lg font-bold">
                            {(
                              operations.reduce((sum, op) => sum + op.statistics.generationTime, 0) / operations.length
                            ).toFixed(0)}
                            ms
                          </div>
                          <div className="text-sm text-muted-foreground">Average Generation Time</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="text-lg font-bold">
                            {(
                              (operations.reduce((sum, op) => sum + op.statistics.collisionRate, 0) /
                                operations.length) *
                              100
                            ).toFixed(4)}
                            %
                          </div>
                          <div className="text-sm text-muted-foreground">Average Collision Rate</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="text-lg font-bold">
                            {(
                              operations.reduce((sum, op) => sum + op.statistics.averageQuality, 0) / operations.length
                            ).toFixed(1)}
                            /100
                          </div>
                          <div className="text-sm text-muted-foreground">Average Quality Score</div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Operations */}
                    <div>
                      <Label className="text-base font-medium mb-4 block">Recent Operations</Label>
                      <div className="space-y-2">
                        {operations.slice(0, 5).map((operation) => (
                          <div
                            key={operation.id}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <div>
                              <div className="font-medium text-sm">{operation.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {operation.statistics.totalGenerated} UUIDs •{" "}
                                {operation.statistics.generationTime.toFixed(0)}ms
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                Quality: {operation.statistics.averageQuality.toFixed(1)}/100
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(
                                  (operation.statistics.validCount / operation.statistics.totalGenerated) *
                                  100
                                ).toFixed(1)}
                                % valid
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
                    <p className="text-muted-foreground mb-4">Generate some batches to see analytics</p>
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
                  Batch Templates
                </CardTitle>
                <CardDescription>Pre-configured batch settings for common scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {batchTemplates.map((template) => (
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
                            <div className="text-xs font-medium mb-1">Settings:</div>
                            <div className="text-xs text-muted-foreground">
                              {template.settings.count} {template.settings.type} • {template.settings.format} • Batch
                              size: {template.settings.batchSize} • Analysis:{" "}
                              {template.settings.enableAnalysis ? "Yes" : "No"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Use Cases:</div>
                            <div className="text-xs text-muted-foreground">{template.useCase.join(", ")}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Estimated Time:</div>
                            <div className="text-xs text-muted-foreground">{template.estimatedTime}</div>
                          </div>
                        </div>
                        {template.examples.length > 0 && (
                          <div className="text-xs">
                            <strong>Examples:</strong> {template.examples.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
const UuidBatch = () => {
  return <UUIDBatchCore />
}

export default UuidBatch
