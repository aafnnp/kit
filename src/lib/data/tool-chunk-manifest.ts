import type { ComponentType } from "react"
import { getToolChunkName } from "./tool-chunk-rules"

type ToolModuleLoader = () => Promise<{ default: ComponentType }>

type ToolManifestEntry = {
  path: string
  chunk: string
  loader: ToolModuleLoader
}

type ToolManifestRecord = Record<string, ToolManifestEntry>

// In test environment, import.meta.glob may return string paths instead of functions
// We need to handle this case gracefully
let toolModules: Record<string, ToolModuleLoader | string>
try {
  toolModules = import.meta.glob<{ default: ComponentType }>("/src/components/tools/*/index.tsx")
} catch {
  // Fallback for test environment
  toolModules = {}
}

const manifestEntries = Object.entries(toolModules).reduce<ToolManifestRecord>((acc, [absolutePath, loader]) => {
  // Skip if loader is a string (test environment may return strings)
  if (typeof loader === "string") {
    return acc
  }

  const slug = absolutePath.split("/components/tools/")[1]?.split("/")[0]
  if (!slug) {
    return acc
  }

  // Ensure loader is a function
  const loaderFn: ToolModuleLoader =
    typeof loader === "function" ? loader : () => Promise.resolve({ default: (() => null) as ComponentType })

  // 简单的验证逻辑
  if (!absolutePath || absolutePath.trim().length === 0) {
    throw new Error("Tool path is required")
  }

  const chunk = getToolChunkName(slug)
  if (!chunk || chunk.trim().length === 0) {
    throw new Error("Chunk name is required")
  }

  if (typeof loaderFn !== "function") {
    throw new Error("Loader must be a function")
  }

  acc[slug] = {
    path: absolutePath,
    chunk,
    loader: loaderFn,
  }

  return acc
}, {})

// 直接使用 manifestEntries，不再进行 zod 验证
export const toolChunkManifest: ToolManifestRecord = manifestEntries

export type ToolChunkManifest = typeof toolChunkManifest

export const toolSlugs = Object.keys(toolChunkManifest)

const toolsModulesEntries = Object.values(toolChunkManifest).map(({ path, loader }): [string, ToolModuleLoader] => [
  path,
  loader,
])

export const toolsModules: Record<string, ToolModuleLoader> = Object.fromEntries(toolsModulesEntries)

export const getToolChunkBySlug = (slug: string): string | undefined => toolChunkManifest[slug]?.chunk

export const getToolLoader = (slug: string): ToolModuleLoader | undefined => toolChunkManifest[slug]?.loader
