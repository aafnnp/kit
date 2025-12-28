import type { Tool, ToolsData } from "@/schemas/tool.schema"
import { defineToolMeta, type ToolMeta } from "./tool-meta"

type CategoryId = string
type CategorizedTools = Record<CategoryId, Tool[]>

const CATEGORY_ORDER: CategoryId[] = [
  "text-processing",
  "color-design",
  "image-audio-video",
  "encryption-hashing",
  "date-time",
  "data-format-conversion",
  "network-tools",
  "random-generator",
  "other-development-tools",
  "developer-tools",
]

type ToolMetaModule = { default: ToolMeta }

const metaModules = import.meta.glob<ToolMetaModule>("/src/components/tools/*/meta.ts", {
  eager: true,
})

const groupedTools = Object.entries(metaModules).reduce<CategorizedTools>((acc, [path, mod]) => {
  const meta = defineToolMeta(mod.default as ToolMeta)
  const slugFromPath = path.split("/components/tools/")[1]?.split("/")[0]
  if (slugFromPath && slugFromPath !== meta.slug) {
    throw new Error(`Tool meta slug mismatch for ${path}`)
  }

  const { category, ...tool } = meta
  if (!acc[category]) {
    acc[category] = []
  }
  acc[category]!.push(tool)
  return acc
}, {})

const sortTools = (tools: Tool[]) =>
  [...tools].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))

const orderedCategories: ToolsData = CATEGORY_ORDER.filter((categoryId) => groupedTools[categoryId]?.length).map(
  (categoryId) => ({
    id: categoryId,
    tools: sortTools(groupedTools[categoryId]!),
  })
)

const dynamicCategories = Object.keys(groupedTools)
  .filter((categoryId) => !CATEGORY_ORDER.includes(categoryId))
  .sort()
  .map((categoryId) => ({
    id: categoryId,
    tools: sortTools(groupedTools[categoryId]!),
  }))

const data: ToolsData = [...orderedCategories, ...dynamicCategories]

export default data
