// Diff Viewer 相关类型声明
export interface DiffFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  pairedWith?: string // ID of the file this is compared with
}

export interface DiffPair {
  id: string
  leftFile: DiffFile
  rightFile: DiffFile
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  result?: DiffResult
  processedAt?: Date
}

export interface DiffLine {
  type: 'added' | 'removed' | 'modified' | 'unchanged' | 'context'
  leftLineNumber?: number
  rightLineNumber?: number
  leftContent?: string
  rightContent?: string
  content: string
  wordDiffs?: WordDiff[]
}

export interface WordDiff {
  type: 'added' | 'removed' | 'unchanged'
  content: string
}

export interface DiffResult {
  lines: DiffLine[]
  statistics: DiffStatistics
  algorithm: DiffAlgorithm
  format: DiffFormat
}

export interface DiffStatistics {
  totalLines: number
  addedLines: number
  removedLines: number
  modifiedLines: number
  unchangedLines: number
  addedWords: number
  removedWords: number
  similarity: number // percentage
  executionTime: number
}

export interface DiffSettings {
  algorithm: DiffAlgorithm
  format: DiffFormat
  viewMode: DiffViewMode
  showLineNumbers: boolean
  showWhitespace: boolean
  ignoreWhitespace: boolean
  ignoreCase: boolean
  contextLines: number
  wordLevelDiff: boolean
  syntaxHighlighting: boolean
  wrapLines: boolean
}

export type DiffAlgorithm = 'myers' | 'patience' | 'histogram' | 'minimal'
export type DiffFormat = 'unified' | 'side-by-side' | 'split' | 'inline'
export type DiffViewMode = 'full' | 'changes-only' | 'context'
