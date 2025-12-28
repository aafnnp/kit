import type { Tool, ToolCategory } from "@/schemas/tool.schema"
import type { TFunction } from "i18next"

// ==================== Tool Card Types ====================

/**
 * Tool card props type
 * 工具卡片属性类型定义
 */
export interface ToolCardProps {
  tool: Tool
  showFavoriteButton?: boolean
  onClick?: () => void
}

// ==================== Search Bar Types ====================

/**
 * Search bar props type
 * 搜索栏属性类型定义
 */
export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// ==================== Virtual Tool Grid Types ====================

/**
 * Virtual tool grid props type
 * 虚拟滚动工具网格属性类型定义
 */
export interface VirtualToolGridProps {
  categories: ToolCategory[]
  showFavoriteButton?: boolean
  onToolClick: (tool: Tool) => void
  t: TFunction
  className?: string
  /**
   * 触发虚拟滚动的工具数量阈值
   * @default 50
   */
  threshold?: number
}

// ==================== Category Manager Types ====================

/**
 * Category manager props type
 * 分类管理器属性类型定义
 */
export interface CategoryManagerProps {
  allTools: any[]
  onCategoryChange?: () => void
}

/**
 * Sortable category card props type
 * 可排序分类卡片属性类型定义
 */
export interface SortableCategoryCardProps {
  category: any
  locale: string
  allTools: any[]
  onEdit: (category: any) => void
  onDelete: (categoryId: string) => void
  onAddTool: (categoryId: string, toolSlug: string) => void
  onRemoveTool: (categoryId: string, toolSlug: string) => void
  t: any
}

// ==================== Settings Dialog Types ====================

/**
 * Settings dialog props type
 * 设置对话框属性类型定义
 */
export interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
