// ==================== Diff Viewer Types ====================

/**
 * Diff Algorithm type
 */
export type diffAlgorithm = "myers" | "patience" | "histogram" | "minimal"

/**
 * Diff Format type
 */
export type diffFormat = "unified" | "side-by-side" | "split" | "inline"

/**
 * Diff View Mode type
 */
export type diffViewMode = "full" | "changes-only" | "context"

/**
 * Diff File type
 */
export interface diffFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  pairedWith?: string
}

/**
 * Word Diff type
 */
export interface wordDiff {
  type: "added"| "removed" | "unchanged",
  content: string,
}

/**
 * Diff Line type
 */
export interface diffLine {
  type: "added"| "removed" | "modified" | "unchanged" | "context"
  leftLineNumber?: number
  rightLineNumber?: number
  leftContent?: string
  rightContent?: string
  content: string
  wordDiffs?: wordDiff[]
}

/**
 * Diff Statistics type
 */
export interface diffStatistics {
  totalLines: number,
  addedLines: number,
  removedLines: number,
  modifiedLines: number,
  unchangedLines: number,
  addedWords: number,
  removedWords: number,
  similarity: number,
  executionTime: number,
}

/**
 * Diff Result type
 */
export interface diffResult {
  lines: diffLine[],
  statistics: diffStatistics,
  algorithm: diffAlgorithm,
  format: diffFormat,
}

/**
 * Diff Pair type
 */
export interface diffPair {
  id: string,
  leftFile: diffFile,
  rightFile: diffFile,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  result?: diffResult
  processedAt?: Date
}

/**
 * Diff Settings type
 */
export interface diffSettings {
  algorithm: diffAlgorithm,
  format: diffFormat,
  viewMode: diffViewMode,
  showLineNumbers: boolean,
  showWhitespace: boolean,
  ignoreWhitespace: boolean,
  ignoreCase: boolean,
  contextLines: number,
  wordLevelDiff: boolean,
  syntaxHighlighting: boolean,
  wrapLines: boolean,
}

// ==================== Type Exports ====================

export type DiffAlgorithm = diffAlgorithm
export type DiffFormat = diffFormat
export type DiffViewMode = diffViewMode
export type DiffFile = diffFile
export type WordDiff = wordDiff
export type DiffLine = diffLine
export type DiffStatistics = diffStatistics
export type DiffResult = diffResult
export type DiffPair = diffPair
export type DiffSettings = diffSettings
