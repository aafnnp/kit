import { z } from "zod"

// ==================== Markdown Mermaid Schemas ====================

/**
 * Mermaid Diagram Type schema
 */
export const mermaidDiagramTypeSchema = z.enum([
  "flowchart",
  "sequence",
  "classDiagram",
  "stateDiagram",
  "entityRelationship",
  "userJourney",
  "gantt",
  "pie",
  "gitgraph",
  "mindmap",
  "timeline",
  "quadrantChart",
  "requirementDiagram",
  "c4Context",
])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["svg", "png", "pdf", "markdown", "html", "json"])

/**
 * View Mode schema
 */
export const viewModeSchema = z.enum(["split", "editor", "preview", "fullscreen"])

/**
 * Theme schema
 */
export const themeSchema = z.enum(["default", "dark", "forest", "neutral", "base"])

/**
 * Curve schema
 */
export const curveSchema = z.enum(["basis", "linear", "cardinal"])

/**
 * Diagram Metadata schema
 */
export const diagramMetadataSchema = z.object({
  codeSize: z.number(),
  svgSize: z.number(),
  nodeCount: z.number(),
  edgeCount: z.number(),
  complexity: z.number(),
  renderTime: z.number(),
  memoryUsage: z.number(),
  diagramDepth: z.number(),
})

/**
 * Flowchart Config schema
 */
export const flowchartConfigSchema = z.object({
  diagramPadding: z.number(),
  htmlLabels: z.boolean(),
  nodeSpacing: z.number(),
  rankSpacing: z.number(),
  curve: curveSchema,
  padding: z.number(),
  useMaxWidth: z.boolean(),
})

/**
 * Sequence Config schema
 */
export const sequenceConfigSchema = z.object({
  diagramMarginX: z.number(),
  diagramMarginY: z.number(),
  actorMargin: z.number(),
  width: z.number(),
  height: z.number(),
  boxMargin: z.number(),
  boxTextMargin: z.number(),
  noteMargin: z.number(),
  messageMargin: z.number(),
  mirrorActors: z.boolean(),
  bottomMarginAdj: z.number(),
  useMaxWidth: z.boolean(),
  rightAngles: z.boolean(),
})

/**
 * Gantt Config schema
 */
export const ganttConfigSchema = z.object({
  titleTopMargin: z.number(),
  barHeight: z.number(),
  barGap: z.number(),
  topPadding: z.number(),
  leftPadding: z.number(),
  gridLineStartPadding: z.number(),
  fontSize: z.number(),
  fontFamily: z.string(),
  numberSectionStyles: z.number(),
  axisFormat: z.string(),
  topAxis: z.boolean(),
  displayMode: z.string(),
})

/**
 * Journey Config schema
 */
export const journeyConfigSchema = z.object({
  diagramMarginX: z.number(),
  diagramMarginY: z.number(),
  leftMargin: z.number(),
  width: z.number(),
  height: z.number(),
  boxMargin: z.number(),
  boxTextMargin: z.number(),
  noteMargin: z.number(),
  messageMargin: z.number(),
  bottomMarginAdj: z.number(),
  useMaxWidth: z.boolean(),
  rightAngles: z.boolean(),
})

/**
 * Pie Config schema
 */
export const pieConfigSchema = z.object({
  textPosition: z.number(),
  useMaxWidth: z.boolean(),
})

/**
 * Gitgraph Config schema
 */
export const gitgraphConfigSchema = z.object({
  diagramPadding: z.number(),
  nodeLabel: z.object({
    width: z.number(),
    height: z.number(),
    x: z.number(),
    y: z.number(),
  }),
  mainBranchName: z.string(),
  showBranches: z.boolean(),
  showCommitLabel: z.boolean(),
  rotateCommitLabel: z.boolean(),
})

/**
 * Mermaid Config schema
 */
export const mermaidConfigSchema = z.object({
  theme: themeSchema,
  fontFamily: z.string(),
  fontSize: z.number(),
  primaryColor: z.string(),
  primaryTextColor: z.string(),
  primaryBorderColor: z.string(),
  lineColor: z.string(),
  secondaryColor: z.string(),
  tertiaryColor: z.string(),
  background: z.string(),
  mainBkg: z.string(),
  secondBkg: z.string(),
  tertiaryBkg: z.string(),
  flowchart: flowchartConfigSchema,
  sequence: sequenceConfigSchema,
  gantt: ganttConfigSchema,
  journey: journeyConfigSchema,
  pie: pieConfigSchema,
  gitgraph: gitgraphConfigSchema,
})

/**
 * Mermaid Diagram schema
 */
export const mermaidDiagramSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: mermaidDiagramTypeSchema,
  code: z.string(),
  svg: z.string(),
  markdown: z.string(),
  metadata: diagramMetadataSchema,
  config: mermaidConfigSchema,
  timestamp: z.date(),
})

/**
 * Diagram Template schema
 */
export const diagramTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: mermaidDiagramTypeSchema,
  category: z.string(),
  code: z.string(),
  useCase: z.array(z.string()),
  complexity: z.enum(["simple", "medium", "complex"]),
})

/**
 * Diagram Error schema
 */
export const diagramErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["syntax", "structure", "performance", "rendering"]),
  severity: z.enum(["error", "warning", "info"]),
  line: z.number().optional(),
  column: z.number().optional(),
})

/**
 * Diagram Validation schema
 */
export const diagramValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(diagramErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  qualityScore: z.number(),
})

// ==================== Type Exports ====================

export type MermaidDiagramType = z.infer<typeof mermaidDiagramTypeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ViewMode = z.infer<typeof viewModeSchema>
export type Theme = z.infer<typeof themeSchema>
export type Curve = z.infer<typeof curveSchema>
export type DiagramMetadata = z.infer<typeof diagramMetadataSchema>
export type FlowchartConfig = z.infer<typeof flowchartConfigSchema>
export type SequenceConfig = z.infer<typeof sequenceConfigSchema>
export type GanttConfig = z.infer<typeof ganttConfigSchema>
export type JourneyConfig = z.infer<typeof journeyConfigSchema>
export type PieConfig = z.infer<typeof pieConfigSchema>
export type GitgraphConfig = z.infer<typeof gitgraphConfigSchema>
export type MermaidConfig = z.infer<typeof mermaidConfigSchema>
export type MermaidDiagram = z.infer<typeof mermaidDiagramSchema>
export type DiagramTemplate = z.infer<typeof diagramTemplateSchema>
export type DiagramError = z.infer<typeof diagramErrorSchema>
export type DiagramValidation = z.infer<typeof diagramValidationSchema>
