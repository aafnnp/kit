// Lottery Picker 相关类型声明
export interface LotteryItem {
  id: string
  value: string
  weight: number
  category?: string
  description?: string
  isSelected: boolean
  selectionCount: number
  lastSelected?: Date
}

export interface LotteryResult {
  id: string
  items: LotteryItem[]
  selectedItems: LotteryItem[]
  selectionMode: SelectionMode
  timestamp: Date
  settings: LotterySettings
  statistics: LotteryStatistics
}

export interface LotterySettings {
  selectionMode: SelectionMode
  selectionCount: number
  allowDuplicates: boolean
  useWeights: boolean
  excludePrevious: boolean
  animationEnabled: boolean
  soundEnabled: boolean
  customSeparators: string[]
  filterSettings: FilterSettings
  sortSettings: SortSettings
}

export interface FilterSettings {
  enabled: boolean
  minLength: number
  maxLength: number
  excludePatterns: string[]
  includePatterns: string[]
  caseSensitive: boolean
}

export interface SortSettings {
  enabled: boolean
  sortBy: 'alphabetical' | 'weight' | 'category' | 'random'
  sortOrder: 'asc' | 'desc'
}

export interface LotteryStatistics {
  totalItems: number
  totalSelections: number
  averageWeight: number
  selectionDistribution: Record<string, number>
  categoryDistribution: Record<string, number>
  fairnessScore: number
  randomnessScore: number
}

export interface LotteryBatch {
  id: string
  name: string
  results: LotteryResult[]
  settings: BatchSettings
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  statistics: BatchStatistics
  createdAt: Date
  completedAt?: Date
}

export interface BatchSettings {
  baseSettings: LotterySettings
  iterations: number
  namingPattern: string
  exportFormat: ExportFormat
  includeAnalysis: boolean
  trackHistory: boolean
}

export interface BatchStatistics {
  totalIterations: number
  successfulIterations: number
  failedIterations: number
  averageFairnessScore: number
  averageRandomnessScore: number
  totalProcessingTime: number
  averageProcessingTime: number
  itemFrequency: Record<string, number>
}

export interface LotteryTemplate {
  id: string
  name: string
  description: string
  category: string
  items: string[]
  settings: Partial<LotterySettings>
  useCase: string[]
  examples: string[]
  preview?: string
}

export interface LotteryValidation {
  isValid: boolean
  errors: LotteryError[]
  warnings: string[]
  suggestions: string[]
  qualityScore: number
}

export interface LotteryError {
  message: string
  type: 'items' | 'settings' | 'weights' | 'selection'
  severity: 'error' | 'warning' | 'info'
}

export type SelectionMode = 'single' | 'multiple' | 'weighted' | 'tournament' | 'elimination' | 'round-robin'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'yaml'
