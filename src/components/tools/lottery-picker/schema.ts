// ==================== Lottery Picker Types ====================

/**
 * Selection Mode type
 */
export type selectionMode = "single" | "multiple" | "weighted" | "tournament" | "elimination" | "round-robin"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml" | "yaml"

/**
 * Sort By type
 */
export type sortBy = "alphabetical" | "weight" | "category" | "random"

/**
 * Sort Order type
 */
export type sortOrder = "asc" | "desc"

/**
 * Lottery Item type
 */
export interface lotteryItem {
  id: string,
  value: string,
  weight: number
  category?: string
  description?: string
  isSelected: boolean,
  selectionCount: number
  lastSelected?: Date
}

/**
 * Filter Settings type
 */
export interface filterSettings {
  enabled: boolean,
  minLength: number,
  maxLength: number,
  excludePatterns: string[],
  includePatterns: string[],
  caseSensitive: boolean,
}

/**
 * Sort Settings type
 */
export interface sortSettings {
  enabled: boolean,
  sortBy: sortBy,
  sortOrder: sortOrder,
}

/**
 * Lottery Settings type
 */
export interface lotterySettings {
  selectionMode: selectionMode,
  selectionCount: number,
  allowDuplicates: boolean,
  useWeights: boolean,
  excludePrevious: boolean,
  animationEnabled: boolean,
  soundEnabled: boolean,
  customSeparators: string[],
  filterSettings: filterSettings,
  sortSettings: sortSettings,
}

/**
 * Lottery Statistics type
 */
export interface lotteryStatistics {
  totalItems: number,
  totalSelections: number,
  averageWeight: number,
  selectionDistribution: Record<string, number>,
  categoryDistribution: Record<string, number>,
  fairnessScore: number,
  randomnessScore: number,
}

/**
 * Lottery Result type
 */
export interface lotteryResult {
  id: string,
  items: lotteryItem[],
  selectedItems: lotteryItem[],
  selectionMode: selectionMode,
  timestamp: Date,
  settings: lotterySettings,
  statistics: lotteryStatistics,
}

/**
 * Batch Settings type
 */
export interface batchSettings {
  baseSettings: lotterySettings,
  iterations: number,
  namingPattern: string,
  exportFormat: exportFormat,
  includeAnalysis: boolean,
  trackHistory: boolean,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalIterations: number,
  successfulIterations: number,
  failedIterations: number,
  averageFairnessScore: number,
  averageRandomnessScore: number,
  totalProcessingTime: number,
  averageProcessingTime: number,
  itemFrequency: Record<string, number>,
}

/**
 * Lottery Batch type
 */
export interface lotteryBatch {
  id: string,
  name: string,
  results: lotteryResult[],
  settings: batchSettings,
  status: "pending"| "processing" | "completed" | "failed",
  progress: number,
  statistics: batchStatistics,
  createdAt: Date
  completedAt?: Date
}

/**
 * Lottery Template type
 */
export interface lotteryTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  items: string[],
  settings: lotterySettings,
  useCase: string[],
  examples: string[]
  preview?: string
}

/**
 * Lottery Error type
 */
export interface lotteryError {
  message: string,
  type: "items"| "settings" | "weights" | "selection",
  severity: "error"| "warning" | "info",
}

/**
 * Lottery Validation type
 */
export interface lotteryValidation {
  isValid: boolean,
  errors: lotteryError[],
  warnings: string[],
  suggestions: string[],
  qualityScore: number,
}

// ==================== Type Exports ====================

export type SelectionMode = selectionMode
export type ExportFormat = exportFormat
export type SortBy = sortBy
export type SortOrder = sortOrder
export type LotteryItem = lotteryItem
export type FilterSettings = filterSettings
export type SortSettings = sortSettings
export type LotterySettings = lotterySettings
export type LotteryStatistics = lotteryStatistics
export type LotteryResult = lotteryResult
export type BatchSettings = batchSettings
export type BatchStatistics = batchStatistics
export type LotteryBatch = lotteryBatch
export type LotteryTemplate = lotteryTemplate
export type LotteryError = lotteryError
export type LotteryValidation = lotteryValidation
