// Table Sorter 相关类型声明
export interface DataFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  parsedData?: TableData
  sortedData?: TableData
}

export interface TableData {
  headers: string[]
  rows: (string | number)[][]
  metadata: {
    rowCount: number
    columnCount: number
    dataTypes: DataType[]
    hasHeaders: boolean
  }
}

export interface SortConfig {
  column: number
  direction: SortDirection
  dataType: DataType
}

export interface SortSettings {
  multiColumn: boolean
  sortConfigs: SortConfig[]
  caseSensitive: boolean
  nullsFirst: boolean
  customOrder?: string[]
}

export interface TableStatistics {
  totalFiles: number
  totalRows: number
  totalColumns: number
  averageProcessingTime: number
  successfulSorts: number
  failedSorts: number
  dataTypeDistribution: Record<DataType, number>
}

export interface SortPreset {
  id: string
  name: string
  description: string
  settings: Partial<SortSettings>
  example: string
}

// Enums
export type DataType = 'string' | 'number' | 'date' | 'boolean' | 'mixed'
export type SortDirection = 'asc' | 'desc'
export type DataFormat = 'csv' | 'tsv' | 'json' | 'auto'
