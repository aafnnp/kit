import { z } from "zod"

// ==================== Tool Schemas ====================

/**
 * Tool schema
 */
export const toolSchema = z.object({
  slug: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  href: z.string().optional(),
})

/**
 * Tool Category schema
 */
export const toolCategorySchema = z.object({
  id: z.string(),
  tools: z.array(toolSchema),
})

/**
 * Tools Data schema
 */
export const toolsDataSchema = z.array(toolCategorySchema)

// ==================== Type Exports ====================

export type Tool = z.infer<typeof toolSchema>
export type ToolCategory = z.infer<typeof toolCategorySchema>
export type ToolsData = z.infer<typeof toolsDataSchema>
