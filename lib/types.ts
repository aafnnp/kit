export type Lang = "zh" | "en"

export interface Localized {
  zh: string
  en: string
}

export type CategoryId = "data" | "encoding" | "text" | "design" | "crypto" | "datetime" | "developer" | "network" | "media"

export type BrandAccent = "cyan" | "violet" | "orange"

export interface Category {
  id: CategoryId
  icon: string
  accent: BrandAccent
  name: Localized
}

export const accentBar: Record<BrandAccent, string> = {
  cyan: "bg-brand-cyan",
  violet: "bg-brand-violet",
  orange: "bg-brand-orange",
}

export interface ToolMeta {
  slug: string
  category: CategoryId
  icon: string
  name: Localized
  description: Localized
  keywords: string[]
  /** Kept for old favorites/recent entries, but not listed or searched. */
  hidden?: boolean
}
