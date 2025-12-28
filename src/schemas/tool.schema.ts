// ==================== Tool Types ====================

/**
 * Tool type
 */
export interface Tool {
  slug: string
  name: string
  icon?: string
  href?: string
}

/**
 * Tool Category type
 */
export interface ToolCategory {
  id: string
  tools: Tool[]
}

/**
 * Tools Data type
 */
export type ToolsData = ToolCategory[]
