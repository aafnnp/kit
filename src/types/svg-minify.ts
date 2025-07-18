// SVG Minify 相关类型声明
export interface SvgFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  svgData?: SvgData
}

export interface SvgData {
  original: SvgContent
  optimized: SvgContent
  statistics: SvgStatistics
  settings: SvgSettings
}

export interface SvgContent {
  content: string
  size: number
  elements: SvgElement[]
  attributes: SvgAttribute[]
  metadata: SvgMetadata
}

export interface SvgElement {
  tag: string
  count: number
  attributes: string[]
  hasChildren: boolean
}

export interface SvgAttribute {
  name: string
  count: number
  totalLength: number
  canOptimize: boolean
}

export interface SvgMetadata {
  viewBox: string
  width: string
  height: string
  xmlns: string
  version: string
  hasComments: boolean
  hasWhitespace: boolean
  hasUnusedElements: boolean
}

export interface SvgStatistics {
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  spaceSaved: number
  elementsRemoved: number
  attributesOptimized: number
  commentsRemoved: number
  whitespaceRemoved: number
  processingTime: number
}

export interface SvgSettings {
  optimizationLevel: OptimizationLevel
  removeComments: boolean
  removeWhitespace: boolean
  removeUnusedElements: boolean
  optimizeAttributes: boolean
  simplifyPaths: boolean
  removeMetadata: boolean
  exportFormat: ExportFormat
  preserveAccessibility: boolean
}

export interface SvgTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<SvgSettings>
  optimizations: OptimizationType[]
}

// Enums
export type OptimizationLevel = 'basic' | 'aggressive' | 'custom'
export type ExportFormat = 'svg' | 'minified' | 'gzipped' | 'base64'
export type OptimizationType = 'comments' | 'whitespace' | 'attributes' | 'paths' | 'metadata' | 'unused'
