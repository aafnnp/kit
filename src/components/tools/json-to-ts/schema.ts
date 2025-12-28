// ==================== JSON to TS Types ====================

/**
 * Export Format type
 */
export type exportFormat = "ts" | "json" | "csv" | "txt"

/**
 * Complexity Metrics type
 */
export interface complexityMetrics {
  depth: number,
  totalProperties: number,
  nestedObjects: number,
  arrays: number,
  optionalProperties: number,
  unionTypes: number,
}

/**
 * Type Count type
 */
export interface typeCount {
  primitives: number,
  objects: number,
  arrays: number,
  unions: number,
  literals: number,
  any: number,
}

/**
 * Generation Statistics type
 */
export interface generationStatistics {
  inputSize: number,
  outputSize: number,
  inputLines: number,
  outputLines: number,
  processingTime: number,
  complexity: complexityMetrics,
  typeCount: typeCount,
}

/**
 * Type Analysis type
 */
export interface typeAnalysis {
  rootType: string,
  hasNestedObjects: boolean,
  hasArrays: boolean,
  hasOptionalProperties: boolean,
  hasUnionTypes: boolean,
  hasComplexTypes: boolean,
  suggestedImprovements: string[],
  typeIssues: string[],
}

/**
 * TypeScript Generation Result type
 */
export interface typeScriptGenerationResult {
  id: string,
  input: string,
  output: string,
  interfaceName: string,
  isValid: boolean
  error?: string,
  statistics: generationStatistics
  analysis?: typeAnalysis,
  createdAt: Date,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalGenerated: number,
  validCount: number,
  invalidCount: number,
  averageComplexity: number,
  totalInputSize: number,
  totalOutputSize: number,
  successRate: number,
}

/**
 * Generation Settings type
 */
export interface generationSettings {
  interfaceName: string,
  useOptionalProperties: boolean,
  generateComments: boolean,
  useStrictTypes: boolean,
  exportInterface: boolean,
  realTimeGeneration: boolean,
  exportFormat: exportFormat,
  indentSize: number,
  useReadonly: boolean,
  generateUtilityTypes: boolean,
}

/**
 * Generation Batch type
 */
export interface generationBatch {
  id: string,
  results: typeScriptGenerationResult[],
  count: number,
  settings: generationSettings,
  createdAt: Date,
  statistics: batchStatistics,
}

/**
 * TypeScript Template type
 */
export interface typeScriptTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  jsonExample: string,
  expectedOutput: string,
  useCase: string[],
}

/**
 * JSON Error type
 */
export interface jsonError {
  message: string
  line?: number,
  column?: number,
  path?: string,
}

/**
 * JSON Validation type
 */
export interface jsonValidation {
  isValid: boolean,
  errors: jsonError[],
  warnings: string[],
  suggestions: string[],
}

// ==================== Type Exports ====================

export type ExportFormat = exportFormat
export type ComplexityMetrics = complexityMetrics
export type TypeCount = typeCount
export type GenerationStatistics = generationStatistics
export type TypeAnalysis = typeAnalysis
export type TypeScriptGenerationResult = typeScriptGenerationResult
export type BatchStatistics = batchStatistics
export type GenerationSettings = generationSettings
export type GenerationBatch = generationBatch
export type TypeScriptTemplate = typeScriptTemplate
export type JSONError = jsonError
export type JSONValidation = jsonValidation
export type JsonError = jsonError
export type JsonValidation = jsonValidation
