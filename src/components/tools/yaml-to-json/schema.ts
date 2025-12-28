// ==================== YAML to JSON Types ====================

/**
 * Data Format type
 */
export type DataFormat = "yaml" | "json"

/**
 * Export Format type
 */
export type ExportFormat = "json" | "csv" | "txt" | "xml"

/**
 * YAML Features type
 */
export interface YAMLFeatures {
  hasComments: boolean,
  hasMultilineStrings: boolean,
  hasAnchors: boolean,
  hasReferences: boolean,
  hasDocumentSeparators: boolean,
  hasDirectives: boolean,
}

/**
 * Complexity Metrics type
 */
export interface ComplexityMetrics {
  depth: number,
  keys: number,
  arrays: number,
  objects: number,
  primitives: number
  yamlFeatures?: YAMLFeatures
}

/**
 * Conversion Statistics type
 */
export interface ConversionStatistics {
  inputSize: number,
  outputSize: number,
  inputLines: number,
  outputLines: number,
  compressionRatio: number,
  processingTime: number,
  complexity: ComplexityMetrics,
}

/**
 * Conversion Result type
 */
export interface ConversionResult {
  id: string,
  input: string,
  output: string,
  inputFormat: DataFormat,
  outputFormat: DataFormat,
  isValid: boolean
  error?: string
  statistics: ConversionStatistics,
  createdAt: Date,
}

/**
 * Batch Statistics type
 */
export interface BatchStatistics {
  totalConversions: number,
  validCount: number,
  invalidCount: number,
  averageCompressionRatio: number,
  totalInputSize: number,
  totalOutputSize: number,
  formatDistribution: Record<string, number>,
  successRate: number,
}

/**
 * Conversion Settings type
 */
export interface ConversionSettings {
  yamlIndentSize: number,
  jsonIndentSize: number,
  preserveComments: boolean,
  sortKeys: boolean,
  flowStyle: boolean,
  realTimeConversion: boolean,
  validateOutput: boolean,
  exportFormat: ExportFormat,
  maxFileSize: number,
}

/**
 * Conversion Batch type
 */
export interface ConversionBatch {
  id: string,
  conversions: ConversionResult[],
  count: number,
  settings: ConversionSettings,
  createdAt: Date,
  statistics: BatchStatistics,
}

/**
 * Conversion Template type
 */
export interface ConversionTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  yamlContent: string,
  jsonContent: string,
  useCase: string[],
}

/**
 * Validation Error type
 */
export interface ValidationError {
  message: string
  line?: number
  column?: number
  path?: string
}

/**
 * Validation Result type
 */
export interface ValidationResult {
  isValid: boolean,
  errors: ValidationError[],
  warnings: string[],
  suggestions: string[],
}

// ==================== Type Exports ====================

