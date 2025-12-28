import type { ErrorSeverity } from "@/lib/utils/error-handler"
import type React from "react"

// ==================== Enhanced Tool Base Types ====================

/**
 * Tool tab type
 * 工具标签页类型定义
 */
export interface ToolTab {
  id: string
  label: string
  icon: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
  badge?: string | number
}

/**
 * Tool action type
 * 工具操作按钮类型定义
 */
export interface ToolAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  disabled?: boolean
  loading?: boolean
}

/**
 * Template panel props type
 * 模板面板属性类型定义
 */
export interface TemplatePanelPropsType {
  templateManager: any // ReturnType is complex, using any
  onTemplateApply?: (template: any) => void
}

/**
 * Settings panel props type
 * 设置面板属性类型定义
 */
export interface SettingsPanelPropsType {
  settingsManager: any // ReturnType is complex, using any
  onSettingsChange?: (settings: any) => void
}

/**
 * History panel props type
 * 历史面板属性类型定义
 */
export interface HistoryPanelProps {
  toolName: string
}

// ==================== Tool Base Types ====================

/**
 * Tab type for tool base
 * 工具基础标签页类型定义
 */
export interface Tab {
  id: string
  label: string
  icon: React.ReactNode
  content: React.ReactNode
}

/**
 * Tool base props type
 * 工具基础组件属性类型定义
 */
export interface ToolBaseProps {
  toolName: string
  icon: React.ReactNode
  description: string
  children: React.ReactNode
  tabs?: Tab[]
}

// ==================== File Upload Area Types ====================

/**
 * File upload area props type
 * 文件上传区域属性类型定义
 */
export interface FileUploadAreaProps {
  onFilesSelected: (files: File[]) => void
  isProcessing?: boolean
  accept?: string
  multiple?: boolean
  title?: string
  description?: string
  buttonText?: string
  supportedFormatsText?: string
  config?: any // DragDropConfig from types/common
  icon?: React.ReactNode
}

// ==================== Tool Error Boundary Types ====================

/**
 * Tool error boundary props type
 * 工具错误边界属性类型定义
 */
export interface ToolErrorBoundaryProps {
  toolName: string
  children: React.ReactNode
}

/**
 * Tool error boundary state type
 * 工具错误边界状态类型定义
 */
export interface ToolErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: any // React.ErrorInfo
  recoverySuggestions?: string[]
  errorSeverity?: ErrorSeverity
}

// ==================== Tool Not Found Types ====================

/**
 * Tool not found props type
 * 工具未找到属性类型定义
 */
export interface ToolNotFoundProps {
  toolSlug?: string
}
