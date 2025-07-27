// 所有类型声明均从 yaml-to-json.tsx 迁移
export interface ConversionResult {
  id: string
  input: string
  output: string
  inputFormat: DataFormat
  outputFormat: DataFormat
  isValid: boolean
  error?: string
  statistics: ConversionStatistics
  createdAt: Date
}

export interface ConversionStatistics {
  inputSize: number
  outputSize: number
  inputLines: number
  outputLines: number
  compressionRatio: number
  processingTime: number
  complexity: ComplexityMetrics
}

export interface ComplexityMetrics {
  depth: number
  keys: number
  arrays: number
  objects: number
  primitives: number
  yamlFeatures?: YAMLFeatures
}

export interface YAMLFeatures {
  hasComments: boolean
  hasMultilineStrings: boolean
  hasAnchors: boolean
  hasReferences: boolean
  hasDocumentSeparators: boolean
  hasDirectives: boolean
}

export interface ConversionBatch {
  id: string
  conversions: ConversionResult[]
  count: number
  settings: ConversionSettings
  createdAt: Date
  statistics: BatchStatistics
}

export interface BatchStatistics {
  totalConversions: number
  validCount: number
  invalidCount: number
  averageCompressionRatio: number
  totalInputSize: number
  totalOutputSize: number
  formatDistribution: Record<string, number>
  successRate: number
}

export interface ConversionSettings {
  yamlIndentSize: number
  jsonIndentSize: number
  preserveComments: boolean
  sortKeys: boolean
  flowStyle: boolean
  realTimeConversion: boolean
  validateOutput: boolean
  exportFormat: ExportFormat
  maxFileSize: number
}

export interface ConversionTemplate {
  id: string
  name: string
  description: string
  category: string
  yamlContent: string
  jsonContent: string
  useCase: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: string[]
  suggestions: string[]
}

export interface ValidationError {
  message: string
  line?: number
  column?: number
  path?: string
}

// Enums
export type DataFormat = 'yaml' | 'json'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
