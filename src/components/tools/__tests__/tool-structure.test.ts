// @vitest-environment node
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { toolMetaSchema } from "@/lib/data/tool-meta"

type MetaModule = {
  default?: unknown
  [key: string]: unknown
}

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const toolsDir = path.resolve(currentDir, "..")

const collectToolDirs = (): string[] =>
  fs
    .readdirSync(toolsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "__tests__")
    .map((entry) => entry.name)
    .sort()

const slugFromGlobPath = (globPath: string): string => {
  const match = globPath.match(/\.\.\/([^/]+)\//)
  if (!match) {
    throw new Error(`Unable to extract slug from path: ${globPath}`)
  }

  return match[1]!
}

const metaModules = import.meta.glob("../*/meta.ts", { eager: true })
const schemaModules = import.meta.glob("../*/schema.ts", { eager: true })

const metasBySlug = new Map<string, unknown>()
const schemasBySlug = new Map<string, Record<string, unknown>>()

Object.entries(metaModules).forEach(([resourcePath, module]) => {
  const slug = slugFromGlobPath(resourcePath)
  const resolved = (module as MetaModule).default ?? module
  metasBySlug.set(slug, resolved)
})

Object.entries(schemaModules).forEach(([resourcePath, module]) => {
  const slug = slugFromGlobPath(resourcePath)
  schemasBySlug.set(slug, module as Record<string, unknown>)
})

const toolDirs = collectToolDirs()

describe("Tool folder structure", () => {
  it("should discover available tool directories", () => {
    expect(toolDirs.length).toBeGreaterThan(0)
  })

  describe.each(toolDirs)("tool %s", (slug) => {
    const toolDir = path.join(toolsDir, slug)

    it("has a valid meta definition", () => {
      const meta = metasBySlug.get(slug)
      expect(meta, `meta.ts is missing for ${slug}`).toBeTruthy()

      if (!meta) {
        return
      }

      const parsedMeta = toolMetaSchema.parse(meta)
      expect(parsedMeta.slug).toBe(slug)
      expect(parsedMeta.name.length).toBeGreaterThan(0)
      expect(parsedMeta.category.length).toBeGreaterThan(0)
    })

    it("exposes at least one zod schema", () => {
      const schemaModule = schemasBySlug.get(slug)
      expect(schemaModule, `schema.ts is missing for ${slug}`).toBeTruthy()

      if (!schemaModule) {
        return
      }

      const exportValues = Object.values(schemaModule)
      expect(exportValues.length).toBeGreaterThan(0)

      const hasSchema = exportValues.some((value) => {
        if (typeof value !== "object" || value === null) {
          return false
        }

        return typeof (value as { safeParse?: unknown }).safeParse === "function"
      })

      expect(hasSchema).toBe(true)
    })

    it("contains a non-empty index entry point", () => {
      const indexPath = path.join(toolDir, "index.tsx")
      const exists = fs.existsSync(indexPath)
      expect(exists, `index.tsx is missing for ${slug}`).toBe(true)

      if (!exists) {
        return
      }

      const stats = fs.statSync(indexPath)
      expect(stats.size).toBeGreaterThan(0)
    })
  })
})
