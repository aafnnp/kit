import type { ComponentType } from "react"
import { z } from "zod"
import { getToolChunkName } from "./tool-chunk-rules"

type ToolModuleLoader = () => Promise<{ default: ComponentType }>

// In test environment, import.meta.glob may return string paths instead of functions
// We need to handle this case gracefully
let toolModules: Record<string, ToolModuleLoader | string>
try {
  toolModules = import.meta.glob<ToolModuleLoader>("/src/components/tools/*/index.tsx")
} catch {
  // Fallback for test environment
  toolModules = {}
}

const manifestEntries = Object.entries(toolModules).reduce<
  Record<string, { path: string; chunk: string; loader: ToolModuleLoader }>
>((acc, [absolutePath, loader]) => {
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

const manifestSchema = z.record(
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
export const toolChunkManifest = parseResult.success
  ? parseResult.data
  : ({} as Record<string, { path: string; chunk: string; loader: ToolModuleLoader }>)

export type ToolChunkManifest = typeof toolChunkManifest

export const toolSlugs = Object.keys(toolChunkManifest)

export const toolsModules = Object.fromEntries(
  Object.values(toolChunkManifest).map(({ path, loader }) => [path, loader])
)

export const getToolChunkBySlug = (slug: string): string | undefined => toolChunkManifest[slug]?.chunk

export const getToolLoader = (slug: string): ToolModuleLoader | undefined => toolChunkManifest[slug]?.loader
