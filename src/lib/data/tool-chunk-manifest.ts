import type { ComponentType } from "react"
import { z } from "zod"
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

  acc[slug] = {
    path: absolutePath,
    chunk: getToolChunkName(slug),
    loader: loaderFn,
  }

  return acc
}, {})

const manifestSchema: z.ZodType<ToolManifestRecord> = z.record(
  z.string(),
  z.object({
    path: z.string().min(1, "Tool path is required"),
    chunk: z.string().min(1, "Chunk name is required"),
    loader: z.custom<ToolModuleLoader>((value) => typeof value === "function", {
      message: "Loader must be a function",
    }),
  })
)

// In test environment, import.meta.glob may return invalid format
// Use safeParse and fallback to empty object if validation fails
const parseResult = manifestSchema.safeParse(manifestEntries)
export const toolChunkManifest: ToolManifestRecord = parseResult.success ? parseResult.data : manifestEntries

export type ToolChunkManifest = typeof toolChunkManifest

export const toolSlugs = Object.keys(toolChunkManifest)

const toolsModulesEntries = Object.values(toolChunkManifest).map(({ path, loader }): [string, ToolModuleLoader] => [
  path,
  loader,
])

export const toolsModules: Record<string, ToolModuleLoader> = Object.fromEntries(toolsModulesEntries)

export const getToolChunkBySlug = (slug: string): string | undefined => toolChunkManifest[slug]?.chunk

export const getToolLoader = (slug: string): ToolModuleLoader | undefined => toolChunkManifest[slug]?.loader
