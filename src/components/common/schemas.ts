import { z } from "zod"
import { ErrorSeverity } from "@/lib/utils/error-handler"

// ==================== Enhanced Tool Base Schemas ====================

/**
 * Tool tab schema
 * 工具标签页类型定义
 */
export const toolTabSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.custom<React.ReactNode>(),
  content: z.custom<React.ReactNode>(),
  disabled: z.boolean().optional(),
  badge: z.union([z.string(), z.number()]).optional(),
})

/**
 * Tool action schema
 * 工具操作按钮类型定义
 */
export const toolActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.custom<React.ReactNode>(),
  onClick: z.custom<() => void>(),
  variant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).optional(),
  disabled: z.boolean().optional(),
  loading: z.boolean().optional(),
})

/**
 * Template panel props schema
 * 模板面板属性类型定义
 */
export const templatePanelPropsSchema = z.object({
  templateManager: z.any(), // ReturnType is complex, using z.any()
  onTemplateApply: z.custom<(template: any) => void>().optional(),
})

/**
 * Settings panel props schema
 * 设置面板属性类型定义
 */
export const settingsPanelPropsSchema = z.object({
  settingsManager: z.any(), // ReturnType is complex, using z.any()
  onSettingsChange: z.custom<(settings: any) => void>().optional(),
})

/**
 * History panel props schema
 * 历史面板属性类型定义
 */
export const historyPanelPropsSchema = z.object({
  toolName: z.string(),
})

// ==================== Tool Base Schemas ====================

/**
 * Tab schema for tool base
 * 工具基础标签页类型定义
 */
export const tabSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.custom<React.ReactNode>(),
  content: z.custom<React.ReactNode>(),
})

/**
 * Tool base props schema
 * 工具基础组件属性类型定义
 */
export const toolBasePropsSchema = z.object({
  toolName: z.string(),
  icon: z.custom<React.ReactNode>(),
  description: z.string(),
  children: z.custom<React.ReactNode>(),
  tabs: z.array(tabSchema).optional(),
})

// ==================== File Upload Area Schemas ====================

/**
 * File upload area props schema
 * 文件上传区域属性类型定义
 */
export const fileUploadAreaPropsSchema = z.object({
  onFilesSelected: z.custom<(files: File[]) => void>(),
  isProcessing: z.boolean().optional(),
  accept: z.string().optional(),
  multiple: z.boolean().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  buttonText: z.string().optional(),
  supportedFormatsText: z.string().optional(),
  config: z.any().optional(), // DragDropConfig from types/common
  icon: z.custom<React.ReactNode>().optional(),
})

// ==================== Tool Error Boundary Schemas ====================

/**
 * Tool error boundary props schema
 * 工具错误边界属性类型定义
 */
export const toolErrorBoundaryPropsSchema = z.object({
  toolName: z.string(),
  children: z.custom<React.ReactNode>(),
})

/**
 * Tool error boundary state schema
 * 工具错误边界状态类型定义
 */
export const toolErrorBoundaryStateSchema = z.object({
  hasError: z.boolean(),
  error: z.instanceof(Error).optional(),
  errorInfo: z.any().optional(), // React.ErrorInfo
  recoverySuggestions: z.array(z.string()).optional(),
  errorSeverity: z.nativeEnum(ErrorSeverity).optional(),
})

// ==================== Tool Not Found Schemas ====================

/**
 * Tool not found props schema
 * 工具未找到属性类型定义
 */
export const toolNotFoundPropsSchema = z.object({
  toolSlug: z.string().optional(),
})

// ==================== Type Exports ====================

/**
 * Type inference from zod schemas
 * 从 zod schemas 推断 TypeScript 类型
 */

// Enhanced Tool Base Types
export type ToolTab = z.infer<typeof toolTabSchema>
export type ToolAction = z.infer<typeof toolActionSchema>
export type TemplatePanelPropsType = z.infer<typeof templatePanelPropsSchema>
export type SettingsPanelPropsType = z.infer<typeof settingsPanelPropsSchema>
export type HistoryPanelProps = z.infer<typeof historyPanelPropsSchema>

// Tool Base Types
export type Tab = z.infer<typeof tabSchema>
export type ToolBaseProps = z.infer<typeof toolBasePropsSchema>

// File Upload Area Types
export type FileUploadAreaProps = z.infer<typeof fileUploadAreaPropsSchema>

// Tool Error Boundary Types
export type ToolErrorBoundaryProps = z.infer<typeof toolErrorBoundaryPropsSchema>
export type ToolErrorBoundaryState = z.infer<typeof toolErrorBoundaryStateSchema>

// Tool Not Found Types
export type ToolNotFoundProps = z.infer<typeof toolNotFoundPropsSchema>
