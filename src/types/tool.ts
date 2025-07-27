// 工具类型定义，供所有工具组件复用
export interface I18nText {
  zh: string
  en: string
}

export interface Tool {
  slug: string
  name: string
  desc: I18nText
  icon?: string
  href?: string
}

export interface ToolGroup {
  type: I18nText
  tools: Tool[]
}
