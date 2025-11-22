import { z } from "zod"
import type { ToolCategory } from "@/schemas/tool.schema"

// ==================== App Sidebar Schemas ====================

/**
 * App sidebar props schema
 * 应用侧边栏属性类型定义
 */
export const appSidebarPropsSchema = z.object({
  // Extends React.ComponentProps<typeof Sidebar>
  // Using z.any() for complex React component props
  className: z.string().optional(),
  defaultOpen: z.boolean().optional(),
  open: z.boolean().optional(),
  onOpenChange: z.custom<(open: boolean) => void>().optional(),
})

// ==================== Site Header Schemas ====================

/**
 * Site header props schema
 * 站点头部属性类型定义
 * Note: SiteHeader has no props currently
 */
export const siteHeaderPropsSchema = z.object({})

// ==================== Custom Title Bar Schemas ====================

/**
 * Custom title bar props schema
 * 自定义标题栏属性类型定义
 * Note: CustomTitleBar has no props currently
 */
export const customTitleBarPropsSchema = z.object({})

/**
 * Drag style schema
 * 拖拽样式类型定义
 */
export const dragStyleSchema = z.object({
  WebkitAppRegion: z.literal("drag").optional(),
  appRegion: z.literal("drag").optional(),
  WebkitUserSelect: z.literal("none").optional(),
  userSelect: z.literal("none").optional(),
  pointerEvents: z.literal("auto").optional(),
  cursor: z.literal("default").optional(),
})

/**
 * No drag style schema
 * 非拖拽样式类型定义
 */
export const noDragStyleSchema = z.object({
  WebkitAppRegion: z.literal("no-drag").optional(),
  appRegion: z.literal("no-drag").optional(),
})

// ==================== Nav Main Schemas ====================

/**
 * Nav main props schema
 * 导航主组件属性类型定义
 */
export const navMainPropsSchema = z.object({
  items: z.custom<ToolCategory[]>(),
})

/**
 * Open map schema
 * 展开状态映射类型定义
 */
export const openMapSchema = z.record(z.string(), z.boolean())

/**
 * Icon components map schema
 * 图标组件映射类型定义
 */
export const iconComponentsMapSchema = z.record(z.string(), z.custom<React.ComponentType<any> | null>())

// ==================== Type Exports ====================

/**
 * Type inference from zod schemas
 * 从 zod schemas 推断 TypeScript 类型
 */

// App Sidebar Types
export type AppSidebarProps = z.infer<typeof appSidebarPropsSchema>

// Site Header Types
export type SiteHeaderProps = z.infer<typeof siteHeaderPropsSchema>

// Custom Title Bar Types
export type CustomTitleBarProps = z.infer<typeof customTitleBarPropsSchema>
export type DragStyle = z.infer<typeof dragStyleSchema>
export type NoDragStyle = z.infer<typeof noDragStyleSchema>

// Nav Main Types
export type NavMainProps = z.infer<typeof navMainPropsSchema>
export type OpenMap = z.infer<typeof openMapSchema>
export type IconComponentsMap = z.infer<typeof iconComponentsMapSchema>
