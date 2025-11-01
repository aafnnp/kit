/**
 * 统一的工具类型定义
 * 为所有工具提供统一的类型系统
 */

// CSV/JSON 行数据类型
export type CSVRowValue = string | number | boolean | null
export type CSVRow = Record<string, CSVRowValue>

// JSON 数据数组类型
export type JSONArray = Record<string, unknown>[]

// 工具输入输出类型
export interface ToolInput<T = unknown> {
  type: string
  data: T
  metadata?: Record<string, unknown>
}

export interface ToolOutput<T = unknown> {
  type: string
  data: T
  metadata?: Record<string, unknown>
}

// 工具配置类型
export interface ToolConfig {
  [key: string]: unknown
}

// 工具状态类型
export interface ToolState {
  isLoading: boolean
  isProcessing: boolean
  error: string | null
  progress: number
}

// 工具结果类型
export interface ToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  metadata?: Record<string, unknown>
}

// 工具验证结果
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}
