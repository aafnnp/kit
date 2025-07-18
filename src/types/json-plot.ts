// JSON Plot 相关类型声明
export interface JSONVisualization {
  id: string
  name: string
  data: any
  rawJSON: string
  visualizationType: VisualizationType
  chartConfig: ChartConfig
  metadata: VisualizationMetadata
  timestamp: Date
}

export interface ChartConfig {
  title: string
  width: number
  height: number
  theme: 'light' | 'dark' | 'auto'
  colors: string[]
  showLegend: boolean
  showGrid: boolean
  showTooltip: boolean
  animation: boolean
  responsive: boolean
  xAxisKey?: string
  yAxisKey?: string
  valueKey?: string
  labelKey?: string
  groupKey?: string
}

export interface VisualizationMetadata {
  dataSize: number
  dataDepth: number
  dataKeys: number
  dataTypes: Record<string, number>
  arrayCount: number
  objectCount: number
  primitiveCount: number
  processingTime: number
  memoryUsage: number
}

export interface JSONTemplate {
  id: string
  name: string
  description: string
  category: string
  data: any
  visualizationType: VisualizationType
  chartConfig: Partial<ChartConfig>
  useCase: string[]
}

export interface JSONValidation {
  isValid: boolean
  errors: JSONError[]
  warnings: string[]
  suggestions: string[]
  qualityScore: number
}

export interface JSONError {
  message: string
  type: 'syntax' | 'structure' | 'performance' | 'visualization'
  severity: 'error' | 'warning' | 'info'
  position?: number
}

export interface TreeNode {
  id: string
  key: string
  value: any
  type: string
  path: string
  level: number
  isExpanded: boolean
  hasChildren: boolean
  children: TreeNode[]
  parent?: TreeNode
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
  metadata: {
    totalPoints: number
    dataRange: [number, number]
    categories: string[]
  }
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor: string[]
  borderColor: string[]
  borderWidth: number
}

export type VisualizationType = 'tree' | 'table' | 'chart' | 'graph' | 'raw' | 'formatted'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'yaml' | 'svg' | 'png' | 'pdf'
export type ViewMode = 'compact' | 'expanded' | 'minimal' | 'detailed'
