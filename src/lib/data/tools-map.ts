import { getToolChunkBySlug, getToolLoader, toolChunkManifest, toolsModules } from "./tool-chunk-manifest"

// 统一的工具组件加载映射，供路由与预加载共用
export { toolsModules }

export function getToolLoaderBySlug(slug: string) {
  return getToolLoader(slug)
}

export function getToolChunkNameBySlug(slug: string) {
  return getToolChunkBySlug(slug)
}

export function hasTool(slug: string) {
  return Boolean(toolChunkManifest[slug])
}

export function listToolSlugs() {
  return Object.keys(toolChunkManifest)
}
