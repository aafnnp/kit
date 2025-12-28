// ==================== JSON Plot Types ====================

/**
 * Visualization Type type
 */
export type VisualizationType = "tree" | "table" | "chart" | "graph" | "raw" | "formatted"

/**
 * Export Format type
 */
export type ExportFormat = "json" | "csv" | "txt" | "xml" | "yaml" | "svg" | "png" | "pdf"

/**
 * View Mode type
 */
export type ViewMode = "compact" | "expanded" | "minimal" | "detailed"

/**
 * Theme type
 */
export type Theme = "light" | "dark" | "auto"

/**
 * Chart Config type
 */
export interface ChartConfig {
  title: string,
  width: number,
  height: number,
  theme: Theme,
  colors: string[],
  showLegend: boolean,
  showGrid: boolean,
  showTooltip: boolean,
  animation: boolean,
  responsive: boolean
  xAxisKey?: string
  yAxisKey?: string
  valueKey?: string
  labelKey?: string
  groupKey?: string
}

/**
 * Visualization Metadata type
 */
export interface VisualizationMetadata {
  dataSize: number,
  dataDepth: number,
  dataKeys: number,
  dataTypes: Record<string, number>,
  arrayCount: number,
  objectCount: number,
  primitiveCount: number,
  processingTime: number,
  memoryUsage: number,
}

/**
 * JSON Visualization type
 */
export interface JSONVisualization {
  id: string,
  name: string,
  data: any,
  rawJSON: string,
  visualizationType: VisualizationType,
  chartConfig: ChartConfig,
  metadata: VisualizationMetadata,
  timestamp: Date,
}

/**
 * JSON Template type
 */
export interface JSONTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  data: any,
  visualizationType: VisualizationType
  chartConfig?: Partial<ChartConfig>
  useCase: string[],
}

/**
 * JSON Error type
 */
export interface JSONError {
  message: string,
  type: "syntax"| "structure" | "performance" | "visualization",
  severity: "error"| "warning" | "info"
  position?: number
}

/**
 * JSON Validation type
 */
export interface JSONValidation {
  isValid: boolean,
  errors: JSONError[],
  warnings: string[],
  suggestions: string[],
  qualityScore: number,
}

/**
 * TreeNode type (recursive)
 */
export interface TreeNode {
  id: string,
  key: string,
  value: any,
  type: string,
  path: string,
  level: number,
  isExpanded: boolean,
  hasChildren: boolean,
  children: TreeNode[]
  parent?: TreeNode
}

/**
 * Chart Dataset type
 */
export interface ChartDataset {
  label: string,
  data: number[],
  backgroundColor: string[],
  borderColor: string[],
  borderWidth: number,
}

/**
 * Chart Data type
 */
export interface ChartData {
  labels: string[],
  datasets: ChartDataset[],
  metadata: {
    totalPoints: number,
  dataRange: [number, number],
    categories: string[],
  }
}

// ==================== Type Exports ====================

