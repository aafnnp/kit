// ==================== JSON Diff Types ====================

/**
 * Diff Type type
 */
export type diffType = "added" | "removed" | "modified" | "moved" | "unchanged"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml" | "yaml" | "html"

/**
 * JSON Difference type
 */
export interface jsonDifference {
  path: string,
  type: diffType
  leftValue?: any
  rightValue?: any
  description: string,
  severity: "low"| "medium" | "high",
}

/**
 * Diff Summary type
 */
export interface diffSummary {
  totalDifferences: number,
  added: number,
  removed: number,
  modified: number,
  moved: number,
  unchanged: number,
  similarity: number,
  complexity: number,
}

/**
 * Diff Metadata type
 */
export interface diffMetadata {
  leftSize: number,
  rightSize: number,
  leftDepth: number,
  rightDepth: number,
  leftKeys: number,
  rightKeys: number,
  processingTime: number,
  memoryUsage: number,
}

/**
 * JSON Diff Result type
 */
export interface jsonDiffResult {
  id: string,
  leftJSON: any,
  rightJSON: any,
  leftText: string,
  rightText: string,
  differences: jsonDifference[],
  summary: diffSummary,
  metadata: diffMetadata,
  timestamp: Date,
}

/**
 * Diff Options type
 */
export interface diffOptions {
  ignoreCase: boolean,
  ignoreWhitespace: boolean,
  ignoreArrayOrder: boolean,
  ignoreExtraKeys: boolean,
  showUnchanged: boolean,
  maxDepth: number,
  precision: number
  customComparator?: (a: any, b: any) => boolean
}

/**
 * Diff Template type
 */
export interface diffTemplate {
  id: string,
  name: string,
  description: string,
  leftJSON: string,
  rightJSON: string,
  category: string,
  useCase: string[],
  expectedDifferences: number,
}

/**
 * Diff Error type
 */
export interface diffError {
  message: string,
  type: "syntax"| "structure" | "performance" | "logic",
  severity: "error"| "warning" | "info"
  position?: string
}

/**
 * Diff Validation type
 */
export interface diffValidation {
  isValid: boolean,
  errors: diffError[],
  warnings: string[],
  suggestions: string[],
  qualityScore: number,
}

// ==================== Type Exports ====================

export type DiffType = diffType
export type ExportFormat = exportFormat
export type JSONDifference = jsonDifference
export type DiffSummary = diffSummary
export type DiffMetadata = diffMetadata
export type JSONDiffResult = jsonDiffResult
export type DiffOptions = diffOptions
export type DiffTemplate = diffTemplate
export type DiffError = diffError
export type DiffValidation = diffValidation
export type JsonDifference = jsonDifference
export type JsonDiffResult = jsonDiffResult
