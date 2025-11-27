import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { preloader } from "../data/preloader"

const { loaderSpies, knownSlugs, mockedHasTool, mockedGetToolLoaderBySlug } = vi.hoisted(() => {
  const spies: Record<string, ReturnType<typeof vi.fn>> = {}
  const slugs = ["json-pretty", "base64-encode", "url-encode", "color-picker", "uuid-generator", "word-count"]
  const hasToolMock = vi.fn((slug: string) => slugs.includes(slug))
  const getLoaderMock = vi.fn((slug: string) => {
    if (!spies[slug]) {
      spies[slug] = vi.fn(() => Promise.resolve({ default: slug }))
    }
    return spies[slug]
  })

  return {
    loaderSpies: spies,
    knownSlugs: slugs,
    mockedHasTool: hasToolMock,
    mockedGetToolLoaderBySlug: getLoaderMock,
  }
})

vi.mock("../data/tools-map", () => ({
  hasTool: mockedHasTool,
  getToolLoaderBySlug: mockedGetToolLoaderBySlug,
}))

global.performance = {
  now: vi.fn(() => Date.now()),
} as any

const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

Object.defineProperty(window, "localStorage", {
  value: createLocalStorageMock(),
  writable: true,
})

describe("PreloadManager", () => {
  beforeEach(() => {
    Object.keys(loaderSpies).forEach((key) => delete loaderSpies[key])
    mockedHasTool.mockImplementation((slug: string) => knownSlugs.includes(slug))
    mockedGetToolLoaderBySlug.mockImplementation((slug: string) => {
      if (!loaderSpies[slug]) {
        loaderSpies[slug] = vi.fn(() => Promise.resolve({ default: slug }))
      }
      return loaderSpies[slug]
    })
    window.localStorage.clear()
    preloader.cleanup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    preloader.cleanup()
  })

  describe("preload", () => {
    it("shares a lazy promise across repeated calls", async () => {
      const promiseA = preloader.preload("json-pretty")
      const promiseB = preloader.preload("json-pretty")
      expect(promiseA).toBe(promiseB)
      await promiseA
      expect(loaderSpies["json-pretty"]).toHaveBeenCalledTimes(1)
    })

    it("handles missing loaders gracefully", async () => {
      mockedHasTool.mockReturnValueOnce(true)
      mockedGetToolLoaderBySlug.mockReturnValueOnce(undefined as any)
      await expect(preloader.preload("ghost-tool")).resolves.toBeUndefined()
      const stats = preloader.getStats()
      expect(stats.misses).toBe(1)
    })

    it("counts hits after the initial load", async () => {
      await preloader.preload("json-pretty")
      await preloader.preload("json-pretty")
      const stats = preloader.getStats()
      expect(stats.hits).toBe(1)
    })
  })

  describe("preloadBatch", () => {
    it("preloads multiple tools in parallel", async () => {
      await preloader.preloadBatch(["json-pretty", "base64-encode"])
      expect(loaderSpies["json-pretty"]).toHaveBeenCalledTimes(1)
      expect(loaderSpies["base64-encode"]).toHaveBeenCalledTimes(1)
    })
  })

  describe("preloadByPriority", () => {
    it("respects priority registration", async () => {
      vi.useFakeTimers()
      try {
        preloader.register("json-pretty", { priority: "high" })
        preloader.register("base64-encode", { priority: "medium" })
        await preloader.preloadByPriority()
        vi.runAllTimers()
      } finally {
        vi.useRealTimers()
      }
      expect(loaderSpies["json-pretty"]).toHaveBeenCalledTimes(1)
      expect(loaderSpies["base64-encode"]).toHaveBeenCalledTimes(1)
    })

    it("skips tools that fail conditions", async () => {
      preloader.register("json-pretty", { priority: "high", condition: () => false })
      await preloader.preloadByPriority()
      expect(loaderSpies["json-pretty"]).toBeUndefined()
    })
  })

  describe("preloadCommonTools", () => {
    it("registers high-frequency tools and schedules preload", () => {
      vi.useFakeTimers()
      preloader.preloadCommonTools()
      vi.runAllTimers()
      const stats = preloader.getStats()
      expect(stats.total).toBeGreaterThan(0)
      vi.useRealTimers()
    })
  })

  describe("usage tracking", () => {
    it("records usage and predicts related tools", () => {
      preloader.recordUsage("json-pretty")
      preloader.recordUsage("base64-encode")
      const related = preloader.predictRelated("json-pretty")
      expect(Array.isArray(related)).toBe(true)
    })
  })

  describe("dynamic scheduling", () => {
    it("schedules tools with derived priority", () => {
      preloader.recordUsage("json-pretty")
      preloader.scheduleToolsWithDynamicPriority(["json-pretty", "base64-encode"])
      const stats = preloader.getStats()
      expect(stats.total).toBeGreaterThan(0)
    })
  })

  describe("maintenance helpers", () => {
    it("resets stats", () => {
      preloader.resetStats()
      const stats = preloader.getStats()
      expect(stats.preloadedModules).toBe(0)
      expect(stats.hits).toBe(0)
    })

    it("cleans up internal state", () => {
      preloader.register("json-pretty", { priority: "high" })
      preloader.cleanup()
      const stats = preloader.getStats()
      expect(stats.total).toBe(0)
      expect(stats.loaded).toBe(0)
    })
  })
})
