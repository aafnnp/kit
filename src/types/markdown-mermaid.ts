// Markdown Mermaid 相关类型声明
export interface MermaidDiagram {
  id: string
  name: string
  type: MermaidDiagramType
  code: string
  svg: string
  markdown: string
  metadata: DiagramMetadata
  config: MermaidConfig
  timestamp: Date
}

export interface DiagramMetadata {
  codeSize: number
  svgSize: number
  nodeCount: number
  edgeCount: number
  complexity: number
  renderTime: number
  memoryUsage: number
  diagramDepth: number
}

export interface MermaidConfig {
  theme: 'default' | 'dark' | 'forest' | 'neutral' | 'base'
  fontFamily: string
  fontSize: number
  primaryColor: string
  primaryTextColor: string
  primaryBorderColor: string
  lineColor: string
  secondaryColor: string
  tertiaryColor: string
  background: string
  mainBkg: string
  secondBkg: string
  tertiaryBkg: string
  flowchart: FlowchartConfig
  sequence: SequenceConfig
  gantt: GanttConfig
  journey: JourneyConfig
  pie: PieConfig
  gitgraph: GitgraphConfig
}

export interface FlowchartConfig {
  diagramPadding: number
  htmlLabels: boolean
  nodeSpacing: number
  rankSpacing: number
  curve: 'basis' | 'linear' | 'cardinal'
  padding: number
  useMaxWidth: boolean
}

export interface SequenceConfig {
  diagramMarginX: number
  diagramMarginY: number
  actorMargin: number
  width: number
  height: number
  boxMargin: number
  boxTextMargin: number
  noteMargin: number
  messageMargin: number
  mirrorActors: boolean
  bottomMarginAdj: number
  useMaxWidth: boolean
  rightAngles: boolean
}

export interface GanttConfig {
  titleTopMargin: number
  barHeight: number
  barGap: number
  topPadding: number
  leftPadding: number
  gridLineStartPadding: number
  fontSize: number
  fontFamily: string
  numberSectionStyles: number
  axisFormat: string
  topAxis: boolean
  displayMode: string
}

export interface JourneyConfig {
  diagramMarginX: number
  diagramMarginY: number
  leftMargin: number
  width: number
  height: number
  boxMargin: number
  boxTextMargin: number
  noteMargin: number
  messageMargin: number
  bottomMarginAdj: number
  useMaxWidth: boolean
  rightAngles: boolean
}

export interface PieConfig {
  textPosition: number
  useMaxWidth: boolean
}

export interface GitgraphConfig {
  diagramPadding: number
  nodeLabel: {
    width: number
    height: number
    x: number
    y: number
  }
  mainBranchName: string
  showBranches: boolean
  showCommitLabel: boolean
  rotateCommitLabel: boolean
}

export interface DiagramTemplate {
  id: string
  name: string
  description: string
  type: MermaidDiagramType
  category: string
  code: string
  useCase: string[]
  complexity: 'simple' | 'medium' | 'complex'
}

export interface DiagramValidation {
  isValid: boolean
  errors: DiagramError[]
  warnings: string[]
  suggestions: string[]
  qualityScore: number
}

export interface DiagramError {
  message: string
  type: 'syntax' | 'structure' | 'performance' | 'rendering'
  severity: 'error' | 'warning' | 'info'
  line?: number
  column?: number
}

export type MermaidDiagramType =
  | 'flowchart'
  | 'sequence'
  | 'classDiagram'
  | 'stateDiagram'
  | 'entityRelationship'
  | 'userJourney'
  | 'gantt'
  | 'pie'
  | 'gitgraph'
  | 'mindmap'
  | 'timeline'
  | 'quadrantChart'
  | 'requirementDiagram'
  | 'c4Context'

export type ExportFormat = 'svg' | 'png' | 'pdf' | 'markdown' | 'html' | 'json'
export type ViewMode = 'split' | 'editor' | 'preview' | 'fullscreen'
