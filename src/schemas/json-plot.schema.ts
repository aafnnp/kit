import { z } from "zod"

// ==================== JSON Plot Schemas ====================

/**
 * Visualization Type schema
 */
export const visualizationTypeSchema = z.enum(["tree", "table", "chart", "graph", "raw", "formatted"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml", "yaml", "svg", "png", "pdf"])

/**
 * View Mode schema
 */
export const viewModeSchema = z.enum(["compact", "expanded", "minimal", "detailed"])

/**
 * Theme schema
 */
export const themeSchema = z.enum(["light", "dark", "auto"])

/**
 * Chart Config schema
 */
export const chartConfigSchema = z.object({
  title: z.string(),
  width: z.number(),
  height: z.number(),
  theme: themeSchema,
  colors: z.array(z.string()),
  showLegend: z.boolean(),
  showGrid: z.boolean(),
  showTooltip: z.boolean(),
  animation: z.boolean(),
  responsive: z.boolean(),
  xAxisKey: z.string().optional(),
  yAxisKey: z.string().optional(),
  valueKey: z.string().optional(),
  labelKey: z.string().optional(),
  groupKey: z.string().optional(),
})

/**
 * Visualization Metadata schema
 */
export const visualizationMetadataSchema = z.object({
  dataSize: z.number(),
  dataDepth: z.number(),
  dataKeys: z.number(),
  dataTypes: z.record(z.string(), z.number()),
  arrayCount: z.number(),
  objectCount: z.number(),
  primitiveCount: z.number(),
  processingTime: z.number(),
  memoryUsage: z.number(),
})

/**
 * JSON Visualization schema
 */
export const jsonVisualizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z.any(),
  rawJSON: z.string(),
  visualizationType: visualizationTypeSchema,
  chartConfig: chartConfigSchema,
  metadata: visualizationMetadataSchema,
  timestamp: z.date(),
})

/**
 * JSON Template schema
 */
export const jsonTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  data: z.any(),
  visualizationType: visualizationTypeSchema,
  chartConfig: chartConfigSchema.partial(),
  useCase: z.array(z.string()),
})

/**
 * JSON Error schema
 */
export const jsonErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["syntax", "structure", "performance", "visualization"]),
  severity: z.enum(["error", "warning", "info"]),
  position: z.number().optional(),
})

/**
 * JSON Validation schema
 */
export const jsonValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(jsonErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  qualityScore: z.number(),
})

/**
 * TreeNode schema (recursive)
 */
export const treeNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    key: z.string(),
    value: z.any(),
    type: z.string(),
    path: z.string(),
    level: z.number(),
    isExpanded: z.boolean(),
    hasChildren: z.boolean(),
    children: z.array(treeNodeSchema),
    parent: treeNodeSchema.optional(),
  })
)

/**
 * Chart Dataset schema
 */
export const chartDatasetSchema = z.object({
  label: z.string(),
  data: z.array(z.number()),
  backgroundColor: z.array(z.string()),
  borderColor: z.array(z.string()),
  borderWidth: z.number(),
})

/**
 * Chart Data schema
 */
export const chartDataSchema = z.object({
  labels: z.array(z.string()),
  datasets: z.array(chartDatasetSchema),
  metadata: z.object({
    totalPoints: z.number(),
    dataRange: z.tuple([z.number(), z.number()]),
    categories: z.array(z.string()),
  }),
})

// ==================== Type Exports ====================

export type VisualizationType = z.infer<typeof visualizationTypeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ViewMode = z.infer<typeof viewModeSchema>
export type Theme = z.infer<typeof themeSchema>
export type ChartConfig = z.infer<typeof chartConfigSchema>
export type VisualizationMetadata = z.infer<typeof visualizationMetadataSchema>
export type JSONVisualization = z.infer<typeof jsonVisualizationSchema>
export type JSONTemplate = z.infer<typeof jsonTemplateSchema>
export type JSONError = z.infer<typeof jsonErrorSchema>
export type JSONValidation = z.infer<typeof jsonValidationSchema>
export type TreeNode = z.infer<typeof treeNodeSchema>
export type ChartDataset = z.infer<typeof chartDatasetSchema>
export type ChartData = z.infer<typeof chartDataSchema>
