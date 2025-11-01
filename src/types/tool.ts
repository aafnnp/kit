// 工具类型定义，供所有工具组件复用
export interface I18nText {
  zh: string
  en: string
}

// 基础工具类型（用于工具卡片和列表）
export interface Tool {
  slug: string
  name: string
  desc?: string | I18nText // 可以是字符串或 I18nText 对象
  icon?: string
  href?: string
}

// 工具分类类型（用于数据组织）
export interface ToolCategory {
  id: string
  tools: Tool[]
}

// 工具组类型（用于 i18n）
export interface ToolGroup {
  type: I18nText
  tools: Tool[]
}

// 工具数据结构的类型（与 data.ts 匹配）
export type ToolsData = ToolCategory[]
