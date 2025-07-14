import React, { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Settings,
  CheckCircle2,
  AlertCircle,
  FileText,
  BookOpen,
  Search,
  Fingerprint,
  Layers,
  Code,
} from 'lucide-react'
import { nanoid } from 'nanoid'

// Enhanced Types
interface UUIDResult {
  id: string
  value: string
  type: UUIDType
  version?: number
  variant?: string
  timestamp?: Date
  isValid: boolean
  error?: string
  metadata?: UUIDMetadata
  analysis?: UUIDAnalysis
  createdAt: Date
}

interface UUIDMetadata {
  length: number
  format: string
  encoding: string
  entropy: number
  randomness: number
  collision_probability: number
  security_level: 'low' | 'medium' | 'high' | 'very_high'
  use_cases: string[]
  standards_compliance: string[]
}

interface UUIDAnalysis {
  structure: UUIDStructure
  security: UUIDSecurity
  quality: UUIDQuality
  compatibility: UUIDCompatibility
  recommendations: string[]
  warnings: string[]
}

interface UUIDStructure {
  segments: string[]
  separators: string[]
  character_set: string
  case_format: 'uppercase' | 'lowercase' | 'mixed'
  has_hyphens: boolean
  has_braces: boolean
  total_length: number
  data_length: number
}

interface UUIDSecurity {
  predictability: 'low' | 'medium' | 'high'
  entropy_bits: number
  cryptographic_strength: 'weak' | 'moderate' | 'strong' | 'very_strong'
  timing_attack_resistant: boolean
  collision_resistance: 'low' | 'medium' | 'high' | 'very_high'
  security_score: number
}

interface UUIDQuality {
  uniqueness_score: number
  randomness_score: number
  format_compliance: number
  readability_score: number
  overall_quality: number
  issues: string[]
  strengths: string[]
}

interface UUIDCompatibility {
  database_systems: string[]
  programming_languages: string[]
  web_standards: string[]
  api_compatibility: string[]
  limitations: string[]
}

interface GenerationBatch {
  id: string
  uuids: UUIDResult[]
  count: number
  type: UUIDType
  settings: GenerationSettings
  createdAt: Date
  statistics: BatchStatistics
}

interface BatchStatistics {
  totalGenerated: number
  uniqueCount: number
  duplicateCount: number
  averageEntropy: number
  averageQuality: number
  generationTime: number
  collisionRate: number
  securityDistribution: Record<string, number>
}

interface GenerationSettings {
  type: UUIDType
  count: number
  format: UUIDFormat
  case: 'uppercase' | 'lowercase'
  includeBraces: boolean
  includeHyphens: boolean
  customLength?: number
  customAlphabet?: string
  prefix?: string
  suffix?: string
  exportFormat: ExportFormat
}

interface UUIDTemplate {
  id: string
  name: string
  description: string
  category: string
  type: UUIDType
  settings: Partial<GenerationSettings>
  useCase: string[]
  examples: string[]
}

interface UUIDValidation {
  isValid: boolean
  errors: UUIDError[]
  warnings: string[]
  suggestions: string[]
  detectedType?: UUIDType
}

interface UUIDError {
  message: string
  type: 'format' | 'length' | 'character' | 'structure' | 'version'
  severity: 'error' | 'warning' | 'info'
}

// Enums
type UUIDType = 'uuid_v1' | 'uuid_v4' | 'uuid_v5' | 'nanoid' | 'ulid' | 'cuid' | 'short_uuid' | 'custom'
type UUIDFormat = 'standard' | 'compact' | 'braced' | 'urn' | 'base64' | 'hex'
type ExportFormat = 'txt' | 'json' | 'csv' | 'xml'

// Utility functions
const generateId = (): string => Math.random().toString(36).substring(2, 11)

// UUID generation functions
const generateUUID = (type: UUIDType, settings?: Partial<GenerationSettings>): string => {
  switch (type) {
    case 'uuid_v1':
      // Simulate UUID v1 (timestamp-based)
      const timestamp = Date.now().toString(16)
      const random = Math.random().toString(16).substring(2, 14)
      return `${timestamp.substring(0, 8)}-${timestamp.substring(8, 12)}-1${random.substring(0, 3)}-${random.substring(3, 7)}-${random.substring(7, 19)}`

    case 'uuid_v4':
      // Generate UUID v4 (random)
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })

    case 'uuid_v5':
      // Simulate UUID v5 (namespace + name hash)
      const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      const name = 'example'
      const hash = btoa(namespace + name)
        .replace(/[^a-f0-9]/gi, '')
        .substring(0, 32)
      return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-5${hash.substring(13, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`

    case 'nanoid':
      const length = settings?.customLength || 21
      // @ts-ignore
      const alphabet = settings?.customAlphabet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
      return nanoid(length)

    case 'ulid':
      // Simulate ULID (Universally Unique Lexicographically Sortable Identifier)
      const time = Date.now().toString(36).toUpperCase()
      const randomPart = Math.random().toString(36).substring(2, 18).toUpperCase()
      return time + randomPart

    case 'cuid':
      // Simulate CUID (Collision-resistant Unique Identifier)
      const timestamp_cuid = Date.now().toString(36)
      const counter = Math.floor(Math.random() * 1000).toString(36)
      const fingerprint = Math.random().toString(36).substring(2, 6)
      const random_cuid = Math.random().toString(36).substring(2, 6)
      return `c${timestamp_cuid}${counter}${fingerprint}${random_cuid}`

    case 'short_uuid':
      // Generate short UUID
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    case 'custom':
      const customLength = settings?.customLength || 16
      const customAlphabet =
        settings?.customAlphabet || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      let result = ''
      for (let i = 0; i < customLength; i++) {
        result += customAlphabet.charAt(Math.floor(Math.random() * customAlphabet.length))
      }
      return result

    default:
      return generateUUID('uuid_v4')
  }
}

const formatUUID = (uuid: string, format: UUIDFormat, settings?: Partial<GenerationSettings>): string => {
  let formatted = uuid

  // Apply case formatting
  if (settings?.case === 'uppercase') {
    formatted = formatted.toUpperCase()
  } else if (settings?.case === 'lowercase') {
    formatted = formatted.toLowerCase()
  }

  // Apply format-specific transformations
  switch (format) {
    case 'standard':
      // Keep as-is
      break
    case 'compact':
      formatted = formatted.replace(/-/g, '')
      break
    case 'braced':
      formatted = `{${formatted}}`
      break
    case 'urn':
      formatted = `urn:uuid:${formatted}`
      break
    case 'base64':
      try {
        formatted = btoa(formatted)
          .replace(/[^A-Za-z0-9]/g, '')
          .substring(0, 22)
      } catch {
        // Fallback if btoa fails
        formatted = formatted.replace(/[^A-Za-z0-9]/g, '').substring(0, 22)
      }
      break
    case 'hex':
      formatted = formatted.replace(/-/g, '').toLowerCase()
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
    recommendations.push('Consider using a more secure UUID type for sensitive applications')
  }

  if (quality.overall_quality < 80) {
    recommendations.push('UUID quality could be improved with better randomness')
  }

  if (structure.total_length < 16) {
    warnings.push('Short UUIDs may have higher collision probability')
  }

  if (security.predictability === 'high') {
    warnings.push('UUID may be predictable, avoid for security-sensitive use cases')
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
  const segments = uuid.split('-')
  const separators = uuid.match(/-/g) || []
  const hasHyphens = separators.length > 0
  const hasBraces = uuid.startsWith('{') && uuid.endsWith('}')

  // Determine character set
  let characterSet = 'unknown'
  if (/^[0-9a-fA-F-{}]+$/.test(uuid)) {
    characterSet = 'hexadecimal'
  } else if (/^[A-Za-z0-9_-]+$/.test(uuid)) {
    characterSet = 'alphanumeric'
  } else if (/^[A-Za-z0-9]+$/.test(uuid)) {
    characterSet = 'alphanumeric_no_special'
  }

  // Determine case format
  let caseFormat: 'uppercase' | 'lowercase' | 'mixed' = 'mixed'
  if (uuid === uuid.toUpperCase()) {
    caseFormat = 'uppercase'
  } else if (uuid === uuid.toLowerCase()) {
    caseFormat = 'lowercase'
  }

  return {
    segments,
    separators: separators.map(() => '-'),
    character_set: characterSet,
    case_format: caseFormat,
    has_hyphens: hasHyphens,
    has_braces: hasBraces,
    total_length: uuid.length,
    data_length: uuid.replace(/[-{}]/g, '').length,
  }
}

const analyzeUUIDSecurity = (uuid: string, type: UUIDType): UUIDSecurity => {
  const dataLength = uuid.replace(/[-{}]/g, '').length
  const entropyBits = dataLength * 4 // Approximate for hex characters

  let predictability: 'low' | 'medium' | 'high' = 'low'
  let cryptographicStrength: 'weak' | 'moderate' | 'strong' | 'very_strong' = 'strong'
  let collisionResistance: 'low' | 'medium' | 'high' | 'very_high' = 'high'

  // Analyze based on UUID type
  switch (type) {
    case 'uuid_v1':
      predictability = 'high' // Contains timestamp
      cryptographicStrength = 'moderate'
      break
    case 'uuid_v4':
      predictability = 'low'
      cryptographicStrength = 'strong'
      break
    case 'short_uuid':
      collisionResistance = 'medium'
      if (dataLength < 16) cryptographicStrength = 'moderate'
      break
    case 'custom':
      if (dataLength < 12) {
        cryptographicStrength = 'weak'
        collisionResistance = 'low'
      }
      break
  }

  // Calculate security score
  let securityScore = 100
  if (predictability === 'high') securityScore -= 30
  // @ts-ignore
  if (predictability === 'medium') securityScore -= 15
  if (cryptographicStrength === 'weak') securityScore -= 40
  if (cryptographicStrength === 'moderate') securityScore -= 20
  if (collisionResistance === 'low') securityScore -= 25
  if (collisionResistance === 'medium') securityScore -= 10
  if (entropyBits < 64) securityScore -= 20

  return {
    predictability,
    entropy_bits: entropyBits,
    cryptographic_strength: cryptographicStrength,
    timing_attack_resistant: type !== 'uuid_v1',
    collision_resistance: collisionResistance,
    security_score: Math.max(0, securityScore),
  }
}

const analyzeUUIDQuality = (uuid: string, type: UUIDType): UUIDQuality => {
  const dataLength = uuid.replace(/[-{}]/g, '').length

  // Calculate uniqueness score based on length and entropy
  let uniquenessScore = Math.min(100, (dataLength / 32) * 100)

  // Calculate randomness score
  const chars = uuid.replace(/[-{}]/g, '').split('')
  const charFreq: Record<string, number> = {}
  chars.forEach((char) => {
    charFreq[char] = (charFreq[char] || 0) + 1
  })

  const maxFreq = Math.max(...Object.values(charFreq))
  const randomnessScore = Math.max(0, 100 - (maxFreq / chars.length) * 100)

  // Format compliance score
  let formatCompliance = 100
  if (type === 'uuid_v4' && !uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    formatCompliance = 50
  }

  // Readability score
  const readabilityScore = uuid.includes('-') ? 90 : 70

  // Overall quality
  const overallQuality = (uniquenessScore + randomnessScore + formatCompliance + readabilityScore) / 4

  const issues: string[] = []
  const strengths: string[] = []

  if (uniquenessScore < 70) issues.push('Low uniqueness due to short length')
  if (randomnessScore < 70) issues.push('Poor randomness distribution')
  if (formatCompliance < 90) issues.push('Non-standard format')

  if (uniquenessScore >= 90) strengths.push('High uniqueness')
  if (randomnessScore >= 80) strengths.push('Good randomness')
  if (formatCompliance >= 90) strengths.push('Standard compliant')

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
    case 'uuid_v4':
      compatibility.database_systems = ['PostgreSQL', 'MySQL', 'SQL Server', 'Oracle', 'MongoDB']
      compatibility.programming_languages = ['JavaScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP']
      compatibility.web_standards = ['RFC 4122', 'JSON', 'XML', 'REST APIs']
      compatibility.api_compatibility = ['GraphQL', 'REST', 'gRPC', 'OpenAPI']
      break
    case 'uuid_v1':
      compatibility.database_systems = ['PostgreSQL', 'MySQL', 'SQL Server', 'Oracle']
      compatibility.programming_languages = ['JavaScript', 'Python', 'Java', 'C#']
      compatibility.web_standards = ['RFC 4122']
      compatibility.limitations = ['Contains timestamp', 'May reveal system information']
      break
    case 'nanoid':
      compatibility.database_systems = ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis']
      compatibility.programming_languages = ['JavaScript', 'Python', 'Go', 'Rust']
      compatibility.web_standards = ['URL-safe', 'JSON']
      compatibility.api_compatibility = ['REST', 'GraphQL']
      break
    case 'ulid':
      compatibility.database_systems = ['PostgreSQL', 'MySQL', 'MongoDB']
      compatibility.programming_languages = ['JavaScript', 'Python', 'Go']
      compatibility.web_standards = ['Lexicographically sortable']
      compatibility.limitations = ['Contains timestamp']
      break
    case 'short_uuid':
      compatibility.database_systems = ['Most databases as string']
      compatibility.programming_languages = ['Most languages']
      compatibility.limitations = ['Higher collision probability', 'Not standard compliant']
      break
  }

  return compatibility
}

// UUID templates
const uuidTemplates: UUIDTemplate[] = [
  {
    id: 'standard-uuid',
    name: 'Standard UUID v4',
    description: 'RFC 4122 compliant UUID version 4 with high randomness',
    category: 'Standard',
    type: 'uuid_v4',
    settings: {
      type: 'uuid_v4',
      format: 'standard',
      case: 'lowercase',
      includeHyphens: true,
      includeBraces: false,
    },
    useCase: ['Database primary keys', 'API identifiers', 'Session tokens', 'General purpose IDs'],
    examples: ['550e8400-e29b-41d4-a716-446655440000', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'],
  },
  {
    id: 'compact-uuid',
    name: 'Compact UUID',
    description: 'UUID without hyphens for space-efficient storage',
    category: 'Compact',
    type: 'uuid_v4',
    settings: {
      type: 'uuid_v4',
      format: 'compact',
      case: 'lowercase',
      includeHyphens: false,
      includeBraces: false,
    },
    useCase: ['URL parameters', 'Compact storage', 'Mobile applications', 'QR codes'],
    examples: ['550e8400e29b41d4a716446655440000', 'f47ac10b58cc4372a5670e02b2c3d479'],
  },
  {
    id: 'nanoid-url-safe',
    name: 'NanoID URL-Safe',
    description: 'URL-safe identifier with good entropy and readability',
    category: 'Modern',
    type: 'nanoid',
    settings: {
      type: 'nanoid',
      customLength: 21,
      format: 'standard',
      case: 'lowercase',
    },
    useCase: ['URL slugs', 'File names', 'Short links', 'User-friendly IDs'],
    examples: ['V1StGXR8_Z5jdHi6B-myT', 'FyPX0_BsVeUBOALMQF3TF'],
  },
  {
    id: 'ulid-sortable',
    name: 'ULID Sortable',
    description: 'Lexicographically sortable identifier with timestamp',
    category: 'Sortable',
    type: 'ulid',
    settings: {
      type: 'ulid',
      format: 'standard',
      case: 'uppercase',
    },
    useCase: ['Time-ordered records', 'Log entries', 'Event sourcing', 'Distributed systems'],
    examples: ['01ARZ3NDEKTSV4RRFFQ69G5FAV', '01BX5ZZKBKACTAV9WEVGEMMVS0'],
  },
  {
    id: 'short-id',
    name: 'Short ID',
    description: 'Short identifier for non-critical applications',
    category: 'Short',
    type: 'short_uuid',
    settings: {
      type: 'short_uuid',
      format: 'standard',
      case: 'lowercase',
    },
    useCase: ['Temporary IDs', 'Internal references', 'Non-critical systems', 'Development'],
    examples: ['abc123def456', 'xyz789uvw012'],
  },
  {
    id: 'custom-secure',
    name: 'Custom Secure',
    description: 'Custom length identifier with high security',
    category: 'Custom',
    type: 'custom',
    settings: {
      type: 'custom',
      customLength: 32,
      customAlphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      format: 'standard',
      case: 'lowercase',
    },
    useCase: ['Security tokens', 'API keys', 'Cryptographic applications', 'High-security systems'],
    examples: ['a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4'],
  },
]

// Validation functions
const validateUUID = (uuid: string): UUIDValidation => {
  const validation: UUIDValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!uuid || uuid.trim().length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: 'UUID cannot be empty',
      type: 'format',
      severity: 'error',
    })
    return validation
  }

  const trimmedUuid = uuid.trim()

  // Detect UUID type
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmedUuid)) {
    validation.detectedType = 'uuid_v4'
  } else if (/^[A-Za-z0-9_-]{21}$/.test(trimmedUuid)) {
    validation.detectedType = 'nanoid'
  } else if (/^[0-9A-Z]{26}$/.test(trimmedUuid)) {
    validation.detectedType = 'ulid'
  } else if (/^c[0-9a-z]{24}$/.test(trimmedUuid)) {
    validation.detectedType = 'cuid'
  } else if (/^[0-9a-f]{32}$/i.test(trimmedUuid)) {
    validation.detectedType = 'uuid_v4'
    validation.warnings.push('UUID appears to be in compact format (no hyphens)')
  } else {
    validation.detectedType = 'custom'
    validation.warnings.push('Non-standard UUID format detected')
  }

  // Length validation
  if (trimmedUuid.length < 8) {
    validation.warnings.push('UUID is very short, collision probability may be high')
  }

  if (trimmedUuid.length > 100) {
    validation.warnings.push('UUID is very long, may impact performance')
  }

  // Character validation
  if (!/^[A-Za-z0-9_-]+$/.test(trimmedUuid.replace(/-/g, ''))) {
    validation.errors.push({
      message: 'UUID contains invalid characters',
      type: 'character',
      severity: 'error',
    })
    validation.isValid = false
  }

  // Provide suggestions
  if (validation.detectedType === 'custom') {
    validation.suggestions.push('Consider using a standard UUID format for better compatibility')
  }

  if (!trimmedUuid.includes('-') && trimmedUuid.length === 32) {
    validation.suggestions.push('Add hyphens for better readability: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
  }

  return validation
}

// Error boundary component
class UUIDGeneratorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UUID Generator error:', error, errorInfo)
    toast.error('An unexpected error occurred during UUID generation')
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-600">
                <h3 className="font-semibold">Something went wrong</h3>
                <p className="text-sm">Please refresh the page and try again.</p>
              </div>
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Custom hooks
const useUUIDGenerator = () => {
  const [results, setResults] = useState<UUIDResult[]>([])

  const generateSingleUUID = useCallback((type: UUIDType, settings?: Partial<GenerationSettings>): UUIDResult => {
    try {
      const rawUuid = generateUUID(type, settings)
      const formattedUuid = formatUUID(rawUuid, settings?.format || 'standard', settings)

      const metadata: UUIDMetadata = {
        length: formattedUuid.length,
        format: settings?.format || 'standard',
        encoding: 'UTF-8',
        entropy: formattedUuid.replace(/[-{}]/g, '').length * 4,
        randomness: calculateRandomness(formattedUuid),
        collision_probability: calculateCollisionProbability(formattedUuid),
        security_level: getSecurityLevel(type, formattedUuid.length),
        use_cases: getUseCases(type),
        standards_compliance: getStandardsCompliance(type),
      }

      const analysis = analyzeUUID(formattedUuid, type)

      return {
        id: generateId(),
        value: formattedUuid,
        type,
        version: getUUIDVersion(type),
        variant: getUUIDVariant(type),
        timestamp: type === 'uuid_v1' || type === 'ulid' ? new Date() : undefined,
        isValid: true,
        metadata,
        analysis,
        createdAt: new Date(),
      }
    } catch (error) {
      return {
        id: generateId(),
        value: '',
        type,
        isValid: false,
        error: error instanceof Error ? error.message : 'UUID generation failed',
        createdAt: new Date(),
      }
    }
  }, [])

  const generateBatch = useCallback(
    (count: number, type: UUIDType, settings?: Partial<GenerationSettings>): GenerationBatch => {
      const startTime = performance.now()
      const uuids: UUIDResult[] = []

      for (let i = 0; i < count; i++) {
        const result = generateSingleUUID(type, settings)
        uuids.push(result)
      }

      const endTime = performance.now()
      const generationTime = endTime - startTime

      // Calculate statistics
      const validUuids = uuids.filter((uuid) => uuid.isValid)
      const uniqueValues = new Set(validUuids.map((uuid) => uuid.value))
      const duplicateCount = validUuids.length - uniqueValues.size

      const averageEntropy =
        validUuids.reduce((sum, uuid) => sum + (uuid.metadata?.entropy || 0), 0) / validUuids.length
      const averageQuality =
        validUuids.reduce((sum, uuid) => sum + (uuid.analysis?.quality.overall_quality || 0), 0) / validUuids.length

      const securityDistribution: Record<string, number> = {}
      validUuids.forEach((uuid) => {
        const level = uuid.metadata?.security_level || 'unknown'
        securityDistribution[level] = (securityDistribution[level] || 0) + 1
      })

      const statistics: BatchStatistics = {
        totalGenerated: uuids.length,
        uniqueCount: uniqueValues.size,
        duplicateCount,
        averageEntropy,
        averageQuality,
        generationTime,
        collisionRate: duplicateCount / uuids.length,
        securityDistribution,
      }

      const batch: GenerationBatch = {
        id: generateId(),
        uuids,
        count,
        type,
        settings: settings as GenerationSettings,
        createdAt: new Date(),
        statistics,
      }

      setResults((prev) => [...uuids, ...prev])
      return batch
    },
    [generateSingleUUID]
  )

  const clearResults = useCallback(() => {
    setResults([])
  }, [])

  const removeResult = useCallback((id: string) => {
    setResults((prev) => prev.filter((result) => result.id !== id))
  }, [])

  return {
    results,
    generateSingleUUID,
    generateBatch,
    clearResults,
    removeResult,
  }
}

// Helper functions
const calculateRandomness = (uuid: string): number => {
  const chars = uuid.replace(/[-{}]/g, '').split('')
  const charFreq: Record<string, number> = {}
  chars.forEach((char) => {
    charFreq[char] = (charFreq[char] || 0) + 1
  })

  const maxFreq = Math.max(...Object.values(charFreq))
  return Math.max(0, 100 - (maxFreq / chars.length) * 100)
}

const calculateCollisionProbability = (uuid: string): number => {
  const dataLength = uuid.replace(/[-{}]/g, '').length
  const entropy = dataLength * 4 // bits for hex characters

  // Simplified collision probability calculation
  return Math.pow(2, -entropy / 2)
}

const getSecurityLevel = (type: UUIDType, length: number): 'low' | 'medium' | 'high' | 'very_high' => {
  if (type === 'uuid_v1') return 'medium' // Predictable timestamp
  if (type === 'short_uuid' || length < 16) return 'low'
  if (type === 'uuid_v4' && length >= 32) return 'very_high'
  if (type === 'nanoid' || type === 'custom') return 'high'
  return 'medium'
}

const getUseCases = (type: UUIDType): string[] => {
  switch (type) {
    case 'uuid_v4':
      return ['Database primary keys', 'API identifiers', 'Session tokens', 'General purpose IDs']
    case 'uuid_v1':
      return ['Time-ordered records', 'Database clustering', 'Distributed systems']
    case 'nanoid':
      return ['URL slugs', 'File names', 'Short links', 'User-friendly IDs']
    case 'ulid':
      return ['Time-ordered records', 'Log entries', 'Event sourcing']
    case 'cuid':
      return ['Client-side generation', 'Collision-resistant IDs']
    case 'short_uuid':
      return ['Temporary IDs', 'Internal references', 'Development']
    case 'custom':
      return ['Specialized applications', 'Custom requirements']
    default:
      return ['General purpose']
  }
}

const getStandardsCompliance = (type: UUIDType): string[] => {
  switch (type) {
    case 'uuid_v4':
    case 'uuid_v1':
    case 'uuid_v5':
      return ['RFC 4122', 'ISO/IEC 9834-8']
    case 'nanoid':
      return ['URL-safe', 'Base64-compatible']
    case 'ulid':
      return ['Lexicographically sortable', 'Crockford Base32']
    default:
      return ['Custom format']
  }
}

const getUUIDVersion = (type: UUIDType): number | undefined => {
  switch (type) {
    case 'uuid_v1':
      return 1
    case 'uuid_v4':
      return 4
    case 'uuid_v5':
      return 5
    default:
      return undefined
  }
}

const getUUIDVariant = (type: UUIDType): string | undefined => {
  switch (type) {
    case 'uuid_v1':
    case 'uuid_v4':
    case 'uuid_v5':
      return 'RFC 4122'
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
      setCopiedText(label || 'text')
      toast.success(`${label || 'Text'} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return { copyToClipboard, copiedText }
}

// Export functionality
const useUUIDExport = () => {
  const exportResults = useCallback((results: UUIDResult[], format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        const jsonData = results.map((result) => ({
          id: result.id,
          value: result.value,
          type: result.type,
          version: result.version,
          variant: result.variant,
          timestamp: result.timestamp,
          isValid: result.isValid,
          error: result.error,
          metadata: result.metadata,
          analysis: result.analysis,
          createdAt: result.createdAt,
        }))
        content = JSON.stringify(jsonData, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        const csvHeaders = [
          'UUID',
          'Type',
          'Version',
          'Valid',
          'Length',
          'Security Level',
          'Quality Score',
          'Entropy',
          'Created At',
        ]
        const csvRows: string[] = []
        results.forEach((result) => {
          csvRows.push(
            [
              result.value,
              result.type,
              result.version?.toString() || '',
              result.isValid ? 'Yes' : 'No',
              result.metadata?.length.toString() || '',
              result.metadata?.security_level || '',
              result.analysis?.quality.overall_quality?.toFixed(1) || '',
              result.metadata?.entropy?.toString() || '',
              result.createdAt.toISOString(),
            ]
              .map((field) => `"${field.replace(/"/g, '""')}"`)
              .join(',')
          )
        })
        content = [csvHeaders.join(','), ...csvRows].join('\n')
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'xml':
        const xmlData = results
          .map(
            (result) => `
  <uuid>
    <value><![CDATA[${result.value}]]></value>
    <type>${result.type}</type>
    <version>${result.version || ''}</version>
    <valid>${result.isValid}</valid>
    <metadata>
      <length>${result.metadata?.length || 0}</length>
      <securityLevel>${result.metadata?.security_level || ''}</securityLevel>
      <entropy>${result.metadata?.entropy || 0}</entropy>
    </metadata>
    <analysis>
      <qualityScore>${result.analysis?.quality.overall_quality || 0}</qualityScore>
      <securityScore>${result.analysis?.security.security_score || 0}</securityScore>
    </analysis>
    <createdAt>${result.createdAt.toISOString()}</createdAt>
  </uuid>`
          )
          .join('')
        content = `<?xml version="1.0" encoding="UTF-8"?>\n<uuids>${xmlData}\n</uuids>`
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'txt':
      default:
        content = generateTextFromResults(results)
        mimeType = 'text/plain'
        extension = '.txt'
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `uuid-results${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResults }
}

// Generate text report from results
const generateTextFromResults = (results: UUIDResult[]): string => {
  return `UUID Generation Results
======================

Generated: ${new Date().toLocaleString()}
Total UUIDs: ${results.length}
Valid UUIDs: ${results.filter((result) => result.isValid).length}
Invalid UUIDs: ${results.filter((result) => !result.isValid).length}

UUID Results:
${results
  .map((result, i) => {
    return `${i + 1}. UUID: ${result.value}
   Type: ${result.type}
   Version: ${result.version || 'N/A'}
   Valid: ${result.isValid ? 'Yes' : 'No'}
   ${result.error ? `Error: ${result.error}` : ''}

   ${
     result.metadata
       ? `Metadata:
   - Length: ${result.metadata.length}
   - Security Level: ${result.metadata.security_level}
   - Entropy: ${result.metadata.entropy} bits
   - Collision Probability: ${result.metadata.collision_probability.toExponential(2)}
   `
       : 'No metadata'
   }

   ${
     result.analysis
       ? `Analysis:
   - Quality Score: ${result.analysis.quality.overall_quality.toFixed(1)}/100
   - Security Score: ${result.analysis.security.security_score}/100
   - Uniqueness: ${result.analysis.quality.uniqueness_score.toFixed(1)}/100
   - Randomness: ${result.analysis.quality.randomness_score.toFixed(1)}/100
   `
       : 'No analysis'
   }
`
  })
  .join('\n')}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Average Quality Score: ${(results.reduce((sum, result) => sum + (result.analysis?.quality.overall_quality || 0), 0) / results.length).toFixed(1)}
- Average Security Score: ${(results.reduce((sum, result) => sum + (result.analysis?.security.security_score || 0), 0) / results.length).toFixed(1)}
- Average Entropy: ${(results.reduce((sum, result) => sum + (result.metadata?.entropy || 0), 0) / results.length).toFixed(1)} bits
`
}

/**
 * Enhanced UUID Generator & Analysis Tool
 * Features: Advanced UUID generation, analysis, validation, batch processing
 */
const UUIDGeneratorCore = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'batch' | 'analyzer' | 'templates'>('generator')
  const [currentUUID, setCurrentUUID] = useState<UUIDResult | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [batchCount, setBatchCount] = useState(10)
  const [analyzeInput, setAnalyzeInput] = useState('')
  const [settings, setSettings] = useState<GenerationSettings>({
    type: 'uuid_v4',
    count: 1,
    format: 'standard',
    case: 'lowercase',
    includeBraces: false,
    includeHyphens: true,
    exportFormat: 'txt',
  })

  const { results, generateSingleUUID, generateBatch, clearResults, removeResult } = useUUIDGenerator()
  const { exportResults } = useUUIDExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = uuidTemplates.find((t) => t.id === templateId)
    if (template) {
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Generate single UUID
  const handleGenerate = useCallback(() => {
    try {
      const result = generateSingleUUID(settings.type, settings)
      setCurrentUUID(result)

      if (result.isValid) {
        toast.success('UUID generated successfully')
      } else {
        toast.error(result.error || 'UUID generation failed')
      }
    } catch (error) {
      toast.error('Failed to generate UUID')
      console.error(error)
    }
  }, [settings, generateSingleUUID])

  // Generate batch
  const handleGenerateBatch = useCallback(() => {
    if (batchCount < 1 || batchCount > 1000) {
      toast.error('Batch count must be between 1 and 1000')
      return
    }

    try {
      const batch = generateBatch(batchCount, settings.type, settings)
      toast.success(`Generated ${batch.count} UUIDs`)
    } catch (error) {
      toast.error('Failed to generate batch')
      console.error(error)
    }
  }, [batchCount, settings, generateBatch])

  // Analyze UUID
  const handleAnalyze = useCallback(() => {
    if (!analyzeInput.trim()) {
      toast.error('Please enter a UUID to analyze')
      return
    }

    const validation = validateUUID(analyzeInput)
    if (!validation.isValid) {
      toast.error('Invalid UUID format')
      return
    }

    try {
      const analysis = analyzeUUID(analyzeInput, validation.detectedType || 'custom')
      const result: UUIDResult = {
        id: generateId(),
        value: analyzeInput,
        type: validation.detectedType || 'custom',
        isValid: true,
        analysis,
        createdAt: new Date(),
      }
      setCurrentUUID(result)
      toast.success('UUID analyzed successfully')
    } catch (error) {
      toast.error('Failed to analyze UUID')
      console.error(error)
    }
  }, [analyzeInput])

  // Initialize with a UUID
  useEffect(() => {
    if (!currentUUID) {
      handleGenerate()
    }
  }, [currentUUID, handleGenerate])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" aria-hidden="true" />
              UUID Generator & Analysis Tool
            </CardTitle>
            <CardDescription>
              Advanced UUID generation tool with comprehensive analysis, validation, and batch processing. Generate
              various UUID types, analyze existing UUIDs, and export results in multiple formats. Use keyboard
              navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'generator' | 'batch' | 'analyzer' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Batch
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Analyzer
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* UUID Generator Tab */}
          <TabsContent value="generator" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Generator Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    UUID Generator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="uuid-type" className="text-sm font-medium">
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
                      <Label htmlFor="uuid-format" className="text-sm font-medium">
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
                          <SelectItem value="compact">Compact (no hyphens)</SelectItem>
                          <SelectItem value="braced">Braced {'{}'}</SelectItem>
                          <SelectItem value="urn">URN Format</SelectItem>
                          <SelectItem value="base64">Base64</SelectItem>
                          <SelectItem value="hex">Hexadecimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="uuid-case" className="text-sm font-medium">
                        Case
                      </Label>
                      <Select
                        value={settings.case}
                        onValueChange={(value: 'uppercase' | 'lowercase') =>
                          setSettings((prev) => ({ ...prev, case: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lowercase">Lowercase</SelectItem>
                          <SelectItem value="uppercase">Uppercase</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Custom Settings */}
                  {(settings.type === 'custom' || settings.type === 'nanoid') && (
                    <div className="space-y-3 border-t pt-4">
                      <Label className="text-sm font-medium">Custom Settings</Label>

                      <div>
                        <Label htmlFor="custom-length" className="text-xs">
                          Length
                        </Label>
                        <Input
                          id="custom-length"
                          type="number"
                          min="4"
                          max="128"
                          value={settings.customLength || 21}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, customLength: parseInt(e.target.value) || 21 }))
                          }
                          className="mt-1"
                        />
                      </div>

                      {settings.type === 'custom' && (
                        <div>
                          <Label htmlFor="custom-alphabet" className="text-xs">
                            Custom Alphabet
                          </Label>
                          <Input
                            id="custom-alphabet"
                            value={
                              settings.customAlphabet ||
                              '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
                            }
                            onChange={(e) => setSettings((prev) => ({ ...prev, customAlphabet: e.target.value }))}
                            className="mt-1 font-mono text-xs"
                            placeholder="Characters to use for generation"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prefix/Suffix */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Prefix & Suffix</Label>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="prefix" className="text-xs">
                          Prefix
                        </Label>
                        <Input
                          id="prefix"
                          value={settings.prefix || ''}
                          onChange={(e) => setSettings((prev) => ({ ...prev, prefix: e.target.value }))}
                          className="mt-1"
                          placeholder="Optional prefix"
                        />
                      </div>
                      <div>
                        <Label htmlFor="suffix" className="text-xs">
                          Suffix
                        </Label>
                        <Input
                          id="suffix"
                          value={settings.suffix || ''}
                          onChange={(e) => setSettings((prev) => ({ ...prev, suffix: e.target.value }))}
                          className="mt-1"
                          placeholder="Optional suffix"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleGenerate} className="flex-1">
                      <Zap className="mr-2 h-4 w-4" />
                      Generate UUID
                    </Button>
                    <Button onClick={() => setCurrentUUID(null)} variant="outline">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Generated UUID Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Generated UUID
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentUUID ? (
                    <div className="space-y-4">
                      {/* UUID Display */}
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">UUID Value</Label>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(currentUUID.value, 'UUID')}>
                            {copiedText === 'UUID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="font-mono text-lg break-all select-all p-2 bg-background rounded border">
                          {currentUUID.value}
                        </div>
                      </div>

                      {/* UUID Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div>
                            <strong>Type:</strong> {currentUUID.type}
                          </div>
                          <div>
                            <strong>Version:</strong> {currentUUID.version || 'N/A'}
                          </div>
                          <div>
                            <strong>Valid:</strong> {currentUUID.isValid ? '✅ Yes' : '❌ No'}
                          </div>
                        </div>
                        <div>
                          <div>
                            <strong>Length:</strong> {currentUUID.metadata?.length || currentUUID.value.length}
                          </div>
                          <div>
                            <strong>Security:</strong> {currentUUID.metadata?.security_level || 'Unknown'}
                          </div>
                          <div>
                            <strong>Created:</strong> {currentUUID.createdAt.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      {currentUUID.error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-red-800 text-sm">
                            <strong>Error:</strong> {currentUUID.error}
                          </div>
                        </div>
                      )}

                      {/* Quick Analysis */}
                      {currentUUID.analysis && (
                        <div className="space-y-3 border-t pt-4">
                          <Label className="text-sm font-medium">Quick Analysis</Label>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="font-medium">Quality</div>
                              <div className="text-lg">
                                {currentUUID.analysis.quality.overall_quality.toFixed(0)}/100
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    currentUUID.analysis.quality.overall_quality >= 80
                                      ? 'bg-green-500'
                                      : currentUUID.analysis.quality.overall_quality >= 60
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${currentUUID.analysis.quality.overall_quality}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Security</div>
                              <div className="text-lg">{currentUUID.analysis.security.security_score}/100</div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    currentUUID.analysis.security.security_score >= 80
                                      ? 'bg-green-500'
                                      : currentUUID.analysis.security.security_score >= 60
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${currentUUID.analysis.security.security_score}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Uniqueness</div>
                              <div className="text-lg">
                                {currentUUID.analysis.quality.uniqueness_score.toFixed(0)}/100
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    currentUUID.analysis.quality.uniqueness_score >= 80
                                      ? 'bg-green-500'
                                      : currentUUID.analysis.quality.uniqueness_score >= 60
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${currentUUID.analysis.quality.uniqueness_score}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Randomness</div>
                              <div className="text-lg">
                                {currentUUID.analysis.quality.randomness_score.toFixed(0)}/100
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    currentUUID.analysis.quality.randomness_score >= 80
                                      ? 'bg-green-500'
                                      : currentUUID.analysis.quality.randomness_score >= 60
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${currentUUID.analysis.quality.randomness_score}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {currentUUID.analysis.recommendations.length > 0 && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <h5 className="font-medium text-sm mb-2 text-blue-800">Recommendations</h5>
                              <ul className="text-sm space-y-1">
                                {currentUUID.analysis.recommendations.map((rec, index) => (
                                  <li key={index} className="flex items-center gap-2 text-blue-700">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {currentUUID.analysis.warnings.length > 0 && (
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <h5 className="font-medium text-sm mb-2 text-orange-800">Warnings</h5>
                              <ul className="text-sm space-y-1">
                                {currentUUID.analysis.warnings.map((warning, index) => (
                                  <li key={index} className="flex items-center gap-2 text-orange-700">
                                    <AlertCircle className="h-3 w-3" />
                                    {warning}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Fingerprint className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No UUID Generated</h3>
                      <p className="text-muted-foreground mb-4">Click "Generate UUID" to create a new identifier</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Generator Tab */}
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Batch UUID Generator
                </CardTitle>
                <CardDescription>Generate multiple UUIDs at once with batch processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="batch-count" className="text-sm font-medium">
                      Number of UUIDs
                    </Label>
                    <Input
                      id="batch-count"
                      type="number"
                      min="1"
                      max="1000"
                      value={batchCount}
                      onChange={(e) => setBatchCount(parseInt(e.target.value) || 10)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="batch-type" className="text-sm font-medium">
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
                        <SelectItem value="uuid_v4">UUID v4</SelectItem>
                        <SelectItem value="nanoid">NanoID</SelectItem>
                        <SelectItem value="ulid">ULID</SelectItem>
                        <SelectItem value="short_uuid">Short UUID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleGenerateBatch}
                      className="w-full"
                      disabled={batchCount < 1 || batchCount > 1000}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Generate Batch
                    </Button>
                  </div>
                </div>

                {results.length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Generated UUIDs ({results.length})</Label>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => exportResults(results, 'txt')}>
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                        <Button size="sm" variant="outline" onClick={clearResults}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {results.slice(0, 50).map((result) => (
                        <div key={result.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm truncate">{result.value}</div>
                            <div className="text-xs text-muted-foreground">
                              {result.type} • {result.isValid ? 'Valid' : 'Invalid'} • Quality:{' '}
                              {result.analysis?.quality.overall_quality.toFixed(0) || 'N/A'}/100
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result.value, 'UUID')}>
                              {copiedText === 'UUID' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => removeResult(result.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {results.length > 50 && (
                        <div className="text-center text-sm text-muted-foreground py-2">
                          ... and {results.length - 50} more UUIDs
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* UUID Analyzer Tab */}
          <TabsContent value="analyzer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  UUID Analyzer
                </CardTitle>
                <CardDescription>Analyze existing UUIDs for quality, security, and compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="analyze-input" className="text-sm font-medium">
                    UUID to Analyze
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="analyze-input"
                      value={analyzeInput}
                      onChange={(e) => setAnalyzeInput(e.target.value)}
                      placeholder="Enter UUID to analyze..."
                      className="font-mono"
                    />
                    <Button onClick={handleAnalyze} disabled={!analyzeInput.trim()}>
                      <Search className="mr-2 h-4 w-4" />
                      Analyze
                    </Button>
                  </div>
                </div>

                {currentUUID && analyzeInput && (
                  <div className="space-y-4 border-t pt-4">
                    <Label className="text-base font-medium">Analysis Results</Label>

                    {/* Detailed Analysis */}
                    {currentUUID.analysis && (
                      <div className="space-y-4">
                        {/* Structure Analysis */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Structure Analysis</CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm space-y-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="font-medium">Total Length</div>
                                <div>{currentUUID.analysis.structure.total_length}</div>
                              </div>
                              <div>
                                <div className="font-medium">Data Length</div>
                                <div>{currentUUID.analysis.structure.data_length}</div>
                              </div>
                              <div>
                                <div className="font-medium">Character Set</div>
                                <div>{currentUUID.analysis.structure.character_set}</div>
                              </div>
                              <div>
                                <div className="font-medium">Case Format</div>
                                <div>{currentUUID.analysis.structure.case_format}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="font-medium">Has Hyphens</div>
                                <div>{currentUUID.analysis.structure.has_hyphens ? '✅ Yes' : '❌ No'}</div>
                              </div>
                              <div>
                                <div className="font-medium">Has Braces</div>
                                <div>{currentUUID.analysis.structure.has_braces ? '✅ Yes' : '❌ No'}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Security Analysis */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Security Analysis</CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm space-y-2">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div>
                                <div className="font-medium">Security Score</div>
                                <div className="text-lg">{currentUUID.analysis.security.security_score}/100</div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                  <div
                                    className={`h-2 rounded-full ${
                                      currentUUID.analysis.security.security_score >= 80
                                        ? 'bg-green-500'
                                        : currentUUID.analysis.security.security_score >= 60
                                          ? 'bg-orange-500'
                                          : 'bg-red-500'
                                    }`}
                                    style={{ width: `${currentUUID.analysis.security.security_score}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">Entropy</div>
                                <div>{currentUUID.analysis.security.entropy_bits} bits</div>
                              </div>
                              <div>
                                <div className="font-medium">Predictability</div>
                                <div
                                  className={
                                    currentUUID.analysis.security.predictability === 'low'
                                      ? 'text-green-600'
                                      : currentUUID.analysis.security.predictability === 'medium'
                                        ? 'text-orange-600'
                                        : 'text-red-600'
                                  }
                                >
                                  {currentUUID.analysis.security.predictability}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="font-medium">Cryptographic Strength</div>
                                <div>{currentUUID.analysis.security.cryptographic_strength}</div>
                              </div>
                              <div>
                                <div className="font-medium">Collision Resistance</div>
                                <div>{currentUUID.analysis.security.collision_resistance}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Compatibility */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Compatibility</CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="font-medium mb-1">Database Systems</div>
                                <div className="flex flex-wrap gap-1">
                                  {currentUUID.analysis.compatibility.database_systems.map((db, index) => (
                                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                      {db}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium mb-1">Programming Languages</div>
                                <div className="flex flex-wrap gap-1">
                                  {currentUUID.analysis.compatibility.programming_languages.map((lang, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                      {lang}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {currentUUID.analysis.compatibility.limitations.length > 0 && (
                              <div>
                                <div className="font-medium mb-1">Limitations</div>
                                <ul className="text-xs space-y-1">
                                  {currentUUID.analysis.compatibility.limitations.map((limitation, index) => (
                                    <li key={index} className="flex items-center gap-2 text-orange-700">
                                      <AlertCircle className="h-3 w-3" />
                                      {limitation}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  UUID Templates
                </CardTitle>
                <CardDescription>Pre-configured UUID generation templates for common scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uuidTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
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
                            <div className="text-xs font-medium mb-1">Type & Format:</div>
                            <div className="text-xs text-muted-foreground">
                              {template.type} • {template.settings.format} • {template.settings.case}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Use Cases:</div>
                            <div className="text-xs text-muted-foreground">{template.useCase.join(', ')}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Examples:</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {template.examples
                                .slice(0, 1)
                                .map((example) => (example.length > 30 ? example.substring(0, 30) + '...' : example))
                                .join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Options */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => exportResults(results, 'txt')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as Text
                  </Button>
                  <Button variant="outline" onClick={() => exportResults(results, 'json')}>
                    <Code className="mr-2 h-4 w-4" />
                    Export as JSON
                  </Button>
                  <Button variant="outline" onClick={() => exportResults(results, 'csv')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const UuidGenerator = () => {
  return (
    <UUIDGeneratorErrorBoundary>
      <UUIDGeneratorCore />
    </UUIDGeneratorErrorBoundary>
  )
}

export default UuidGenerator
