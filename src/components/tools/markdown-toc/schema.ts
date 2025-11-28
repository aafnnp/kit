import { z } from "zod"

// ==================== Markdown TOC Schemas ====================

/**
 * TOC Format schema
 */
export const tocFormatSchema = z.enum(["markdown", "html", "json", "plain", "numbered"])

/**
 * Indent Style schema
 */
export const indentStyleSchema = z.enum(["spaces", "tabs", "none"])

/**
 * Bullet Style schema
 */
export const bulletStyleSchema = z.enum(["dash", "asterisk", "plus", "number", "custom"])

/**
 * Case Style schema
 */
export const caseStyleSchema = z.enum(["original", "lowercase", "uppercase", "title", "sentence"])

/**
 * Heading schema
 */
export const headingSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    level: z.number(),
    text: z.string(),
    anchor: z.string(),
    line: z.number(),
    children: z.array(headingSchema),
  })
)

/**
 * TOC Statistics schema
 */
export const tocStatisticsSchema = z.object({
  totalHeadings: z.number(),
  headingsByLevel: z.record(z.string(), z.number()),
  maxDepth: z.number(),
  averageDepth: z.number(),
  duplicateAnchors: z.array(z.string()),
  processingTime: z.number(),
})

/**
 * TOC Settings schema
 */
export const tocSettingsSchema = z.object({
  format: tocFormatSchema,
  maxDepth: z.number(),
  minDepth: z.number(),
  includeLinks: z.boolean(),
  customPrefix: z.string(),
  indentStyle: indentStyleSchema,
  bulletStyle: bulletStyleSchema,
  caseStyle: caseStyleSchema,
  removeNumbers: z.boolean(),
  removeSpecialChars: z.boolean(),
  customAnchorPrefix: z.string(),
})

/**
 * TOC Result schema
 */
export const tocResultSchema = z.object({
  toc: z.string(),
  headings: z.array(headingSchema),
  statistics: tocStatisticsSchema,
  format: tocFormatSchema,
  settings: tocSettingsSchema,
})

/**
 * Markdown File schema
 */
export const markdownFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  processedAt: z.date().optional(),
  tocResult: tocResultSchema.optional(),
})

/**
 * TOC Template schema
 */
export const tocTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  settings: tocSettingsSchema.partial(),
  example: z.string(),
})

// ==================== Type Exports ====================

export type TOCFormat = z.infer<typeof tocFormatSchema>
export type IndentStyle = z.infer<typeof indentStyleSchema>
export type BulletStyle = z.infer<typeof bulletStyleSchema>
export type CaseStyle = z.infer<typeof caseStyleSchema>
export type Heading = z.infer<typeof headingSchema>
export type TOCStatistics = z.infer<typeof tocStatisticsSchema>
export type TOCSettings = z.infer<typeof tocSettingsSchema>
export type TOCResult = z.infer<typeof tocResultSchema>
export type MarkdownFile = z.infer<typeof markdownFileSchema>
export type TOCTemplate = z.infer<typeof tocTemplateSchema>
