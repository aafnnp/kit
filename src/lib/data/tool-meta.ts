import type { Tool } from "@/schemas/tool.schema"

/**
 * Tool Meta type
 * 扩展 Tool 类型，添加 category 字段
 */
export interface ToolMeta extends Tool {
  category: string
}

/**
 * 定义工具元数据
 * 简单的类型断言，不再进行运行时验证
 */
export const defineToolMeta = (meta: ToolMeta): ToolMeta => {
  if (!meta.category || meta.category.trim().length === 0) {
    throw new Error("Category is required")
  }
  return meta
}


