import type { Tool, ToolCategory, ToolsData } from "@/schemas/tool.schema"

export interface ToolLocation {
  tool: Tool
  category: ToolCategory
}

export const getAllTools = (categories: ToolsData): Tool[] => categories.flatMap((category) => category.tools)

export const findTool = (categories: ToolsData, slug: string): Tool | undefined =>
  getAllTools(categories).find((tool) => tool.slug === slug)

export const findToolCategory = (categories: ToolsData, slug: string): ToolCategory | undefined =>
  categories.find((category) => category.tools.some((tool) => tool.slug === slug))

export const findToolLocation = (categories: ToolsData, slug: string): ToolLocation | undefined => {
  const category = findToolCategory(categories, slug)
  const tool = category?.tools.find((item) => item.slug === slug)

  return tool && category ? { tool, category } : undefined
}
