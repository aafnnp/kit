// JSON Pretty 相关类型声明
export interface JSONProcessingResult {
  id: string
  input: string
  output: string
  operation: JSONOperation
  isValid: boolean
  error?: string
  statistics: JSONStatistics
  schema?: JSONSchema
  createdAt: Date
}

export interface JSONStatistics {
  size: number
  lines: number
  depth: number
  keys: number
  arrays: number
  objects: number
  primitives: number
  nullValues: number
  booleans: number
  numbers: number
  strings: number
  duplicateKeys: string[]
  circularReferences: boolean
}

export interface JSONSchema {
  type: string
  properties?: Record<string, any>
  items?: any
  required?: string[]
  additionalProperties?: boolean
  description?: string
}

export interface JSONBatch {
  id: string
  results: JSONProcessingResult[]
  count: number
  settings: JSONSettings
  createdAt: Date
  statistics: JSONBatchStatistics
}

export interface JSONBatchStatistics {
  totalProcessed: number
  validCount: number
  invalidCount: number
  averageSize: number
  totalSize: number
  operationDistribution: Record<string, number>
  successRate: number
}

export interface JSONSettings {
  indentSize: number
  sortKeys: boolean
  removeComments: boolean
  validateSchema: boolean
  showStatistics: boolean
  realTimeProcessing: boolean
  exportFormat: ExportFormat
  maxDepth: number
  maxSize: number
}

export interface JSONTemplate {
  id: string
  name: string
  description: string
  category: string
  content: string
  useCase: string[]
}

export interface JSONValidation {
  isValid: boolean
  errors: JSONError[]
  warnings: string[]
  suggestions: string[]
}

export interface JSONError {
  message: string
  line?: number
  column?: number
  path?: string
}

export type JSONOperation = 'format' | 'minify' | 'validate' | 'analyze' | 'escape' | 'unescape'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml'
