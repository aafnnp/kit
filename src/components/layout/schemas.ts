import type { ToolCategory } from "@/schemas/tool.schema"
import type React from "react"

// ==================== App Sidebar Types ====================

/**
 * App sidebar props type
 * 应用侧边栏属性类型定义
 */
export interface AppSidebarProps {
  // Extends React.ComponentProps<typeof Sidebar>
  // Using any for complex React component props
  className?: string
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// ==================== Site Header Types ====================

/**
 * Site header props type
 * 站点头部属性类型定义
 * Note: SiteHeader has no props currently
 */
export interface SiteHeaderProps {}

// ==================== Custom Title Bar Types ====================

/**
 * Custom title bar props type
 * 自定义标题栏属性类型定义
 * Note: CustomTitleBar has no props currently
 */
export interface CustomTitleBarProps {}

/**
 * Drag style type
 * 拖拽样式类型定义
 */
export interface DragStyle {
  WebkitAppRegion?: "drag"
  appRegion?: "drag"
  WebkitUserSelect?: "none"
  userSelect?: "none"
  pointerEvents?: "auto"
  cursor?: "default"
}

/**
 * No drag style type
 * 非拖拽样式类型定义
 */
export interface NoDragStyle {
  WebkitAppRegion?: "no-drag"
  appRegion?: "no-drag"
}

// ==================== Nav Main Types ====================

/**
 * Nav main props type
 * 导航主组件属性类型定义
 */
export interface NavMainProps {
  items: ToolCategory[]
}

/**
 * Open map type
 * 展开状态映射类型定义
 */
export type OpenMap = Record<string, boolean>

/**
 * Icon components map type
 * 图标组件映射类型定义
 */
export type IconComponentsMap = Record<string, React.ComponentType<any> | null>
