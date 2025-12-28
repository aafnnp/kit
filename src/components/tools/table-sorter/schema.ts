// ==================== Table Sorter Types ====================

/**
 * Data Type type
 */
export type dataType = "string" | "number" | "date" | "boolean" | "mixed"

/**
 * Sort Direction type
 */
export type sortDirection = "asc" | "desc"

/**
 * Data Format type
 */
export type dataFormat = "csv" | "tsv" | "json" | "auto"

/**
 * Table Data Metadata type
 */
export interface tableDataMetadata {
  rowCount: number,
  columnCount: number,
  dataTypes: dataType[],
  hasHeaders: boolean,
}

/**
 * Table Data type
 */
export interface tableData {
  headers: string[],
  rows: (string | number)[][],
  metadata: tableDataMetadata,
}

/**
 * Sort Config type
 */
export interface sortConfig {
  column: number,
  direction: sortDirection,
  dataType: dataType,
}

/**
 * Sort Settings type
 */
export interface sortSettings {
  multiColumn: boolean,
  sortConfigs: sortConfig[],
  caseSensitive: boolean,
  nullsFirst: boolean
  customOrder?: string[]
}

/**
 * Data File type
 */
export interface dataFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  parsedData?: tableData
  sortedData?: tableData
}

/**
 * Table Statistics type
 */
export interface tableStatistics {
  totalFiles: number,
  totalRows: number,
  totalColumns: number,
  averageProcessingTime: number,
  successfulSorts: number,
  failedSorts: number,
  dataTypeDistribution: Record<string, number>,
}

/**
 * Sort Preset type
 */
export interface sortPreset {
  id: string,
  name: string,
  description: string,
  settings: sortSettings,
  example: string,
}

// ==================== Type Exports ====================

export type DataType = dataType
export type SortDirection = sortDirection
export type DataFormat = dataFormat
export type TableDataMetadata = tableDataMetadata
export type TableData = tableData
export type SortConfig = sortConfig
export type SortSettings = sortSettings
export type DataFile = dataFile
export type TableStatistics = tableStatistics
export type SortPreset = sortPreset
