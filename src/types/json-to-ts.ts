// JSON to TS 相关类型声明
export interface TypeScriptGenerationResult {
  id: string
  input: string
  output: string
  interfaceName: string
  isValid: boolean
  error?: string
  statistics: GenerationStatistics
  analysis?: TypeAnalysis
  createdAt: Date
}

export interface GenerationStatistics {
  inputSize: number
  outputSize: number
  inputLines: number
  outputLines: number
  processingTime: number
  complexity: ComplexityMetrics
  typeCount: TypeCount
}

export interface ComplexityMetrics {
  depth: number
  totalProperties: number
  nestedObjects: number
  arrays: number
  optionalProperties: number
  unionTypes: number
}

export interface TypeCount {
  primitives: number
  objects: number
  arrays: number
  unions: number
  literals: number
  any: number
}

export interface TypeAnalysis {
  rootType: string
  hasNestedObjects: boolean
  hasArrays: boolean
  hasOptionalProperties: boolean
  hasUnionTypes: boolean
  hasComplexTypes: boolean
  suggestedImprovements: string[]
  typeIssues: string[]
}

export interface GenerationBatch {
  id: string
  results: TypeScriptGenerationResult[]
  count: number
  settings: GenerationSettings
  createdAt: Date
  statistics: BatchStatistics
}

export interface BatchStatistics {
  totalGenerated: number
  validCount: number
  invalidCount: number
  averageComplexity: number
  totalInputSize: number
  totalOutputSize: number
  successRate: number
}

export interface GenerationSettings {
  interfaceName: string
  useOptionalProperties: boolean
  generateComments: boolean
  useStrictTypes: boolean
  exportInterface: boolean
  realTimeGeneration: boolean
  exportFormat: ExportFormat
  indentSize: number
  useReadonly: boolean
  generateUtilityTypes: boolean
}

export interface TypeScriptTemplate {
  id: string
  name: string
  description: string
  category: string
  jsonExample: string
  expectedOutput: string
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

export type ExportFormat = 'ts' | 'json' | 'csv' | 'txt'
