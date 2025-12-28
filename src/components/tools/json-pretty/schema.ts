// ==================== JSON Pretty Types ====================

/**
 * JSON Operation type
 */
export type JSONOperation = "format" | "minify" | "validate" | "analyze" | "escape" | "unescape"

/**
 * Export Format type
 */
export type ExportFormat = "json" | "csv" | "txt" | "xml"

/**
 * JSON Statistics type
 */
export interface JSONStatistics {
  size: number,
  lines: number,
  depth: number,
  keys: number,
  arrays: number,
  objects: number,
  primitives: number,
  nullValues: number,
  booleans: number,
  numbers: number,
  strings: number,
  duplicateKeys: string[],
  circularReferences: boolean,
}

/**
 * JSON Schema type
 */
export interface JSONSchema {
  type: string
  properties?: Record<string, any>
  items?: any
  required?: string[]
  additionalProperties?: boolean
  description?: string
}

/**
 * JSON Processing Result type
 */
export interface JSONProcessingResult {
  id: string,
  input: string,
  output: string,
  operation: JSONOperation,
  isValid: boolean
  error?: string
  statistics: JSONStatistics
  schema?: JSONSchema
  createdAt: Date,
}

/**
 * JSON Batch Statistics type
 */
export interface JSONBatchStatistics {
  totalProcessed: number,
  validCount: number,
  invalidCount: number,
  averageSize: number,
  totalSize: number,
  operationDistribution: Record<string, number>,
  successRate: number,
}

/**
 * JSON Settings type
 */
export interface JSONSettings {
  indentSize: number,
  sortKeys: boolean,
  removeComments: boolean,
  validateSchema: boolean,
  showStatistics: boolean,
  realTimeProcessing: boolean,
  exportFormat: ExportFormat,
  maxDepth: number,
  maxSize: number,
}

/**
 * JSON Batch type
 */
export interface JSONBatch {
  id: string,
  results: JSONProcessingResult[],
  count: number,
  settings: JSONSettings,
  createdAt: Date,
  statistics: JSONBatchStatistics,
}

/**
 * JSON Template type
 */
export interface JSONTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  content: string,
  useCase: string[],
}

/**
 * JSON Error type
 */
export interface JSONError {
  message: string
  line?: number
  column?: number
  path?: string
}

/**
 * JSON Validation type
 */
export interface JSONValidation {
  isValid: boolean,
  errors: JSONError[],
  warnings: string[],
  suggestions: string[],
}

// ==================== Type Exports ====================

