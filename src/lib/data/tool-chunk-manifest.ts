import type { ComponentType } from "react"
import { z } from "zod"
import { getToolChunkName } from "./tool-chunk-rules"

type ToolModuleLoader = () => Promise<{ default: ComponentType }>

const toolModules = import.meta.glob<ToolModuleLoader>("/src/components/tools/*/index.tsx")

const manifestEntries = Object.entries(toolModules).reduce<
  Record<string, { path: string; chunk: string; loader: ToolModuleLoader }>
>((acc, [absolutePath, loader]) => {
  const slug = absolutePath.split("/components/tools/")[1]?.split("/")[0]
  if (!slug) {
    return acc
  }

  acc[slug] = {
    path: absolutePath,
    chunk: getToolChunkName(slug),
    loader,
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

export const toolChunkManifest = manifestSchema.parse(manifestEntries)

export type ToolChunkManifest = typeof toolChunkManifest

export const toolSlugs = Object.keys(toolChunkManifest)

export const toolsModules = Object.fromEntries(
  Object.values(toolChunkManifest).map(({ path, loader }) => [path, loader])
)

export const getToolChunkBySlug = (slug: string): string | undefined => toolChunkManifest[slug]?.chunk

export const getToolLoader = (slug: string): ToolModuleLoader | undefined => toolChunkManifest[slug]?.loader


