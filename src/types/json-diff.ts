// JSON Diff 相关类型声明
export interface JSONDiffResult {
  id: string
  leftJSON: any
  rightJSON: any
  leftText: string
  rightText: string
  differences: JSONDifference[]
  summary: DiffSummary
  metadata: DiffMetadata
  timestamp: Date
}

export interface JSONDifference {
  path: string
  type: DiffType
  leftValue?: any
  rightValue?: any
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface DiffSummary {
  totalDifferences: number
  added: number
  removed: number
  modified: number
  moved: number
  unchanged: number
  similarity: number
  complexity: number
}

export interface DiffMetadata {
  leftSize: number
  rightSize: number
  leftDepth: number
  rightDepth: number
  leftKeys: number
  rightKeys: number
  processingTime: number
  memoryUsage: number
}

export interface DiffOptions {
  ignoreCase: boolean
  ignoreWhitespace: boolean
  ignoreArrayOrder: boolean
  ignoreExtraKeys: boolean
  showUnchanged: boolean
  maxDepth: number
  precision: number
  customComparator?: (a: any, b: any) => boolean
}

export interface DiffTemplate {
  id: string
  name: string
  description: string
  leftJSON: string
  rightJSON: string
  category: string
  useCase: string[]
  expectedDifferences: number
}

export interface DiffValidation {
  isValid: boolean
  errors: DiffError[]
  warnings: string[]
  suggestions: string[]
  qualityScore: number
}

export interface DiffError {
  message: string
  type: 'syntax' | 'structure' | 'performance' | 'logic'
  severity: 'error' | 'warning' | 'info'
  position?: string
}

// Enums
export type DiffType = 'added' | 'removed' | 'modified' | 'moved' | 'unchanged'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'yaml' | 'html'
