import { z } from "zod"

// ==================== Table Sorter Schemas ====================

/**
 * Data Type schema
 */
export const dataTypeSchema = z.enum(["string", "number", "date", "boolean", "mixed"])

/**
 * Sort Direction schema
 */
export const sortDirectionSchema = z.enum(["asc", "desc"])

/**
 * Data Format schema
 */
export const dataFormatSchema = z.enum(["csv", "tsv", "json", "auto"])

/**
 * Table Data Metadata schema
 */
export const tableDataMetadataSchema = z.object({
  rowCount: z.number(),
  columnCount: z.number(),
  dataTypes: z.array(dataTypeSchema),
  hasHeaders: z.boolean(),
})

/**
 * Table Data schema
 */
export const tableDataSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.union([z.string(), z.number()]))),
  metadata: tableDataMetadataSchema,
})

/**
 * Sort Config schema
 */
export const sortConfigSchema = z.object({
  column: z.number(),
  direction: sortDirectionSchema,
  dataType: dataTypeSchema,
})

/**
 * Sort Settings schema
 */
export const sortSettingsSchema = z.object({
  multiColumn: z.boolean(),
  sortConfigs: z.array(sortConfigSchema),
  caseSensitive: z.boolean(),
  nullsFirst: z.boolean(),
  customOrder: z.array(z.string()).optional(),
})

/**
 * Data File schema
 */
export const dataFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  parsedData: tableDataSchema.optional(),
  sortedData: tableDataSchema.optional(),
})

/**
 * Table Statistics schema
 */
export const tableStatisticsSchema = z.object({
  totalFiles: z.number(),
  totalRows: z.number(),
  totalColumns: z.number(),
  averageProcessingTime: z.number(),
  successfulSorts: z.number(),
  failedSorts: z.number(),
  dataTypeDistribution: z.record(dataTypeSchema, z.number()),
})

/**
 * Sort Preset schema
 */
export const sortPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  settings: sortSettingsSchema.partial(),
  example: z.string(),
})

// ==================== Type Exports ====================

export type DataType = z.infer<typeof dataTypeSchema>
export type SortDirection = z.infer<typeof sortDirectionSchema>
export type DataFormat = z.infer<typeof dataFormatSchema>
export type TableDataMetadata = z.infer<typeof tableDataMetadataSchema>
export type TableData = z.infer<typeof tableDataSchema>
export type SortConfig = z.infer<typeof sortConfigSchema>
export type SortSettings = z.infer<typeof sortSettingsSchema>
export type DataFile = z.infer<typeof dataFileSchema>
export type TableStatistics = z.infer<typeof tableStatisticsSchema>
export type SortPreset = z.infer<typeof sortPresetSchema>
