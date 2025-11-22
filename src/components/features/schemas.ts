import { z } from "zod"
import type { Tool, ToolCategory } from "@/schemas/tool.schema"

// ==================== Tool Card Schemas ====================

/**
 * Tool card props schema
 * 工具卡片属性类型定义
 */
export const toolCardPropsSchema = z.object({
  tool: z.custom<Tool>(),
  showFavoriteButton: z.boolean().optional(),
  onClick: z.custom<() => void>().optional(),
})

// ==================== Search Bar Schemas ====================

/**
 * Search bar props schema
 * 搜索栏属性类型定义
 */
export const searchBarPropsSchema = z.object({
  value: z.string(),
  onChange: z.custom<(value: string) => void>(),
  placeholder: z.string().optional(),
})

// ==================== Virtual Tool Grid Schemas ====================

/**
 * Virtual tool grid props schema
 * 虚拟滚动工具网格属性类型定义
 */
export const virtualToolGridPropsSchema = z.object({
  categories: z.custom<ToolCategory[]>(),
  showFavoriteButton: z.boolean().optional(),
  onToolClick: z.custom<(tool: Tool) => void>(),
  t: z.custom<import("i18next").TFunction>(),
  className: z.string().optional(),
  /**
   * 触发虚拟滚动的工具数量阈值
   * @default 50
   */
  threshold: z.number().optional(),
})

// ==================== Category Manager Schemas ====================

/**
 * Category manager props schema
 * 分类管理器属性类型定义
 */
export const categoryManagerPropsSchema = z.object({
  allTools: z.array(z.any()),
  onCategoryChange: z.custom<() => void>().optional(),
})

/**
 * Sortable category card props schema
 * 可排序分类卡片属性类型定义
 */
export const sortableCategoryCardPropsSchema = z.object({
  category: z.any(),
  locale: z.string(),
  allTools: z.array(z.any()),
  onEdit: z.custom<(category: any) => void>(),
  onDelete: z.custom<(categoryId: string) => void>(),
  onAddTool: z.custom<(categoryId: string, toolSlug: string) => void>(),
  onRemoveTool: z.custom<(categoryId: string, toolSlug: string) => void>(),
  t: z.any(),
})

// ==================== Settings Dialog Schemas ====================

/**
 * Settings dialog props schema
 * 设置对话框属性类型定义
 */
export const settingsDialogPropsSchema = z.object({
  open: z.boolean(),
  onOpenChange: z.custom<(open: boolean) => void>(),
})

// ==================== Type Exports ====================

/**
 * Type inference from zod schemas
 * 从 zod schemas 推断 TypeScript 类型
 */

// Tool Card Types
export type ToolCardProps = z.infer<typeof toolCardPropsSchema>

// Search Bar Types
export type SearchBarProps = z.infer<typeof searchBarPropsSchema>

// Virtual Tool Grid Types
export type VirtualToolGridProps = z.infer<typeof virtualToolGridPropsSchema>

// Category Manager Types
export type CategoryManagerProps = z.infer<typeof categoryManagerPropsSchema>
export type SortableCategoryCardProps = z.infer<typeof sortableCategoryCardPropsSchema>

// Settings Dialog Types
export type SettingsDialogProps = z.infer<typeof settingsDialogPropsSchema>
