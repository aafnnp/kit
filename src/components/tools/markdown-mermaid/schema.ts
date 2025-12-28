// ==================== Markdown Mermaid Types ====================

/**
 * Mermaid Diagram Type type
 */
export type mermaidDiagramType = "flowchart" | "sequence" | "classDiagram" | "stateDiagram" | "entityRelationship" | "userJourney" | "gantt" | "pie" | "gitgraph" | "mindmap" | "timeline" | "quadrantChart" | "requirementDiagram" | "c4Context"

/**
 * Export Format type
 */
export type exportFormat = "svg" | "png" | "pdf" | "markdown" | "html" | "json"

/**
 * View Mode type
 */
export type viewMode = "split" | "editor" | "preview" | "fullscreen"

/**
 * Theme type
 */
export type theme = "default" | "dark" | "forest" | "neutral" | "base"

/**
 * Curve type
 */
export type curve = "basis" | "linear" | "cardinal"

/**
 * Diagram Metadata type
 */
export interface diagramMetadata {
  codeSize: number,
  svgSize: number,
  nodeCount: number,
  edgeCount: number,
  complexity: number,
  renderTime: number,
  memoryUsage: number,
  diagramDepth: number,
}

/**
 * Flowchart Config type
 */
export interface flowchartConfig {
  diagramPadding: number,
  htmlLabels: boolean,
  nodeSpacing: number,
  rankSpacing: number,
  curve: curve,
  padding: number,
  useMaxWidth: boolean,
}

/**
 * Sequence Config type
 */
export interface sequenceConfig {
  diagramMarginX: number,
  diagramMarginY: number,
  actorMargin: number,
  width: number,
  height: number,
  boxMargin: number,
  boxTextMargin: number,
  noteMargin: number,
  messageMargin: number,
  mirrorActors: boolean,
  bottomMarginAdj: number,
  useMaxWidth: boolean,
  rightAngles: boolean,
}

/**
 * Gantt Config type
 */
export interface ganttConfig {
  titleTopMargin: number,
  barHeight: number,
  barGap: number,
  topPadding: number,
  leftPadding: number,
  gridLineStartPadding: number,
  fontSize: number,
  fontFamily: string,
  numberSectionStyles: number,
  axisFormat: string,
  topAxis: boolean,
  displayMode: string,
}

/**
 * Journey Config type
 */
export interface journeyConfig {
  diagramMarginX: number,
  diagramMarginY: number,
  leftMargin: number,
  width: number,
  height: number,
  boxMargin: number,
  boxTextMargin: number,
  noteMargin: number,
  messageMargin: number,
  bottomMarginAdj: number,
  useMaxWidth: boolean,
  rightAngles: boolean,
}

/**
 * Pie Config type
 */
export interface pieConfig {
  textPosition: number,
  useMaxWidth: boolean,
}

/**
 * Gitgraph Config type
 */
export interface gitgraphConfig {
  diagramPadding: number,
  nodeLabel: {
    width: number,
    height: number,
    x: number,
    y: number,
  },
  mainBranchName: string,
  showBranches: boolean,
  showCommitLabel: boolean,
  rotateCommitLabel: boolean,
}
/**
 * Mermaid Config type
 */
export interface mermaidConfig {
  theme: theme,
  fontFamily: string,
  fontSize: number,
  primaryColor: string,
  primaryTextColor: string,
  primaryBorderColor: string,
  lineColor: string,
  secondaryColor: string,
  tertiaryColor: string,
  background: string,
  mainBkg: string,
  secondBkg: string,
  tertiaryBkg: string,
  flowchart: flowchartConfig,
  sequence: sequenceConfig,
  gantt: ganttConfig,
  journey: journeyConfig,
  pie: pieConfig,
  gitgraph: gitgraphConfig,
}

/**
 * Mermaid Diagram type
 */
export interface mermaidDiagram {
  id: string,
  name: string,
  type: mermaidDiagramType,
  code: string,
  svg: string,
  markdown: string,
  metadata: diagramMetadata,
  config: mermaidConfig,
  timestamp: Date,
}

/**
 * Diagram Template type
 */
export interface diagramTemplate {
  id: string,
  name: string,
  description: string,
  type: mermaidDiagramType,
  category: string,
  code: string,
  useCase: string[],
  complexity: "simple"| "medium" | "complex",
}

/**
 * Diagram Error type
 */
export interface diagramError {
  message: string,
  type: "syntax"| "structure" | "performance" | "rendering",
  severity: "error"| "warning" | "info"
  line?: number
  column?: number
}

/**
 * Diagram Validation type
 */
export interface diagramValidation {
  isValid: boolean,
  errors: diagramError[],
  warnings: string[],
  suggestions: string[],
  qualityScore: number,
}

// ==================== Type Exports ====================

export type MermaidDiagramType = mermaidDiagramType
export type ExportFormat = exportFormat
export type ViewMode = viewMode
export type Theme = theme
export type Curve = curve
export type DiagramMetadata = diagramMetadata
export type FlowchartConfig = flowchartConfig
export type SequenceConfig = sequenceConfig
export type GanttConfig = ganttConfig
export type JourneyConfig = journeyConfig
export type PieConfig = pieConfig
export type GitgraphConfig = gitgraphConfig
export type MermaidConfig = mermaidConfig
export type MermaidDiagram = mermaidDiagram
export type DiagramTemplate = diagramTemplate
export type DiagramError = diagramError
export type DiagramValidation = diagramValidation
