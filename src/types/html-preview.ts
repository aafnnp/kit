// HTML Preview 相关类型声明
export interface HTMLProcessingResult {
  id: string
  input: string
  isValid: boolean
  error?: string
  statistics: HTMLStatistics
  analysis?: HTMLAnalysis
  createdAt: Date
}

export interface HTMLStatistics {
  inputSize: number
  lineCount: number
  characterCount: number
  processingTime: number
  htmlMetrics: HTMLMetrics
  performanceMetrics: PerformanceMetrics
}

export interface HTMLMetrics {
  elementCount: number
  tagTypes: string[]
  hasDoctype: boolean
  hasHead: boolean
  hasBody: boolean
  hasTitle: boolean
  hasMeta: boolean
  hasCSS: boolean
  hasJavaScript: boolean
  externalResources: ExternalResource[]
  semanticElements: string[]
  accessibilityFeatures: AccessibilityFeature[]
}

export interface ExternalResource {
  type: 'css' | 'js' | 'image' | 'font' | 'other'
  url: string
  isLocal: boolean
}

export interface AccessibilityFeature {
  type: 'alt' | 'aria' | 'role' | 'label' | 'heading' | 'landmark'
  element: string
  description: string
}

export interface PerformanceMetrics {
  renderTime: number
  domComplexity: number
  cssComplexity: number
  jsComplexity: number
  seoScore: number
  accessibilityScore: number
}

export interface HTMLAnalysis {
  isValidHTML: boolean
  hasModernStructure: boolean
  isResponsive: boolean
  hasAccessibilityFeatures: boolean
  hasSEOElements: boolean
  suggestedImprovements: string[]
  htmlIssues: string[]
  qualityScore: number
  securityIssues: string[]
  performanceIssues: string[]
}

export interface ProcessingBatch {
  id: string
  results: HTMLProcessingResult[]
  count: number
  settings: ProcessingSettings
  createdAt: Date
  statistics: BatchStatistics
}

export interface BatchStatistics {
  totalProcessed: number
  validCount: number
  invalidCount: number
  averageQuality: number
  totalInputSize: number
  successRate: number
}

export interface ProcessingSettings {
  previewMode: PreviewMode
  deviceSize: DeviceSize
  showLineNumbers: boolean
  enableSyntaxHighlighting: boolean
  autoRefresh: boolean
  refreshInterval: number
  exportFormat: ExportFormat
  includeCSS: boolean
  includeJS: boolean
  sanitizeHTML: boolean
  validateHTML: boolean
}

export interface HTMLTemplate {
  id: string
  name: string
  description: string
  category: string
  htmlCode: string
  features: string[]
  useCase: string[]
}

export interface HTMLValidation {
  isValid: boolean
  errors: HTMLError[]
  warnings: string[]
  suggestions: string[]
}

export interface HTMLError {
  message: string
  line?: number
  column?: number
  type: 'syntax' | 'structure' | 'accessibility' | 'security'
  severity: 'error' | 'warning' | 'info'
}

// Enums
export type PreviewMode = 'iframe' | 'popup' | 'split' | 'fullscreen'
export type DeviceSize = 'desktop' | 'tablet' | 'mobile' | 'custom'
export type ExportFormat = 'html' | 'pdf' | 'png' | 'json' | 'txt'
