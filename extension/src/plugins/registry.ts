import { validatePlugin, validatePluginMeta } from "./define"
import type { KitPlugin, KitPluginModule, PluginMeta } from "./types"

export interface PluginIssue {
  pluginId: string
  message: string
}

/**
 * 注册表的"双 glob"设计：
 *
 * - `meta.ts`  —— 同步（eager）加载，体积极小、零依赖。popup 只用它渲染插件列表。
 * - `index.tsx` —— 懒加载（代码分割），只有用户真正打开某个插件时才下载/求值。
 *
 * 这就是"插拔式"的底层机制：停用的插件不进内存，未打开的插件不进 bundle 首屏。
 */
const metaModules = import.meta.glob<{ meta?: PluginMeta; default?: PluginMeta }>("./builtin/*/meta.ts", {
  eager: true,
})

const implLoaders = import.meta.glob<KitPluginModule>("./builtin/*/index.{ts,tsx}")

function folderIdFromPath(path: string): string | null {
  return /\/builtin\/([^/]+)\//.exec(path)?.[1] ?? null
}

export const pluginIssues: PluginIssue[] = []

const catalog = new Map<string, PluginMeta>()

for (const [path, mod] of Object.entries(metaModules)) {
  const folderId = folderIdFromPath(path) ?? path
  const meta = mod.meta ?? mod.default
  const problems = validatePluginMeta(meta, folderId)

  if (problems.length > 0 || !meta) {
    pluginIssues.push({ pluginId: folderId, message: problems.join("；") })
    continue
  }

  catalog.set(meta.id, meta)
}

/** 全部可用插件（含未启用），按 order 稳定排序 */
export const pluginCatalog: readonly PluginMeta[] = [...catalog.values()].sort((a, b) => {
  const order = (a.order ?? 100) - (b.order ?? 100)
  return order !== 0 ? order : a.id.localeCompare(b.id)
})

export function listPluginIds(): string[] {
  return pluginCatalog.map((meta) => meta.id)
}

export function getPluginMeta(id: string): PluginMeta | undefined {
  return catalog.get(id)
}

export function hasPlugin(id: string): boolean {
  return catalog.has(id)
}

export function getDefaultEnabledIds(): string[] {
  return pluginCatalog.filter((meta) => meta.defaultEnabled).map((meta) => meta.id)
}

const implIssues = new Set<string>()

/**
 * 懒加载插件实现。返回 null 表示该插件没有实现或实现不合法，
 * 问题会记录到 pluginIssues 供「管理插件」页展示。
 */
export async function loadPlugin(id: string): Promise<KitPlugin | null> {
  const entry = Object.entries(implLoaders).find(([path]) => folderIdFromPath(path) === id)
  if (!entry) {
    if (!implIssues.has(id)) {
      implIssues.add(id)
      pluginIssues.push({ pluginId: id, message: "未找到 index.ts / index.tsx 实现文件" })
    }
    return null
  }

  try {
    const mod = await entry[1]()
    const problems = validatePlugin(mod.default, id)
    if (problems.length > 0) {
      if (!implIssues.has(id)) {
        implIssues.add(id)
        pluginIssues.push({ pluginId: id, message: problems.join("；") })
      }
      return null
    }
    return mod.default
  } catch (error) {
    if (!implIssues.has(id)) {
      implIssues.add(id)
      pluginIssues.push({ pluginId: id, message: `加载失败：${(error as Error).message}` })
    }
    return null
  }
}
