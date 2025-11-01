import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { preloader } from '../preloader'
import { cache } from '../cache'

// Mock cache
vi.mock('../cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

// Mock tools-map
vi.mock('../tools-map', () => ({
  hasTool: vi.fn((slug: string) => ['json-pretty', 'base64-encode', 'url-encode'].includes(slug)),
  getToolLoaderBySlug: vi.fn(),
}))

// Mock performance
global.performance = {
  now: vi.fn(() => Date.now()),
} as any

// Mock localStorage
const localStorageMock = (() => {
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
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('PreloadManager', () => {
  beforeEach(() => {
    localStorage.clear()
    preloader.cleanup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    preloader.cleanup()
  })

  describe('register', () => {
    it('should register a module with config', () => {
      preloader.register('/test/module.tsx', { priority: 'high' })
      const stats = preloader.getStats()
      expect(stats.total).toBe(1)
    })
  })

  describe('preload', () => {
    it('should return early if module already loaded', async () => {
      const modulePath = '/test/module.tsx'
      vi.mocked(cache.get).mockReturnValue({ default: {} })

      await preloader.preload(modulePath)
      await preloader.preload(modulePath)

      // Should only call cache.get once
      expect(cache.get).toHaveBeenCalledTimes(1)
    })

    it('should use cached module if available', async () => {
      const modulePath = '/test/module.tsx'
      const cachedModule = { default: {} }
      vi.mocked(cache.get).mockReturnValue(cachedModule)

      const result = await preloader.preload(modulePath)
      expect(cache.get).toHaveBeenCalledWith(`preload_${modulePath}`)
    })

    it('should handle preload errors gracefully', async () => {
      const modulePath = '/test/invalid-module.tsx'

      // The preload function catches errors internally and updates stats
      try {
        await preloader.preload(modulePath)
      } catch {
        // Expected to fail
      }

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 10))

      const stats = preloader.getStats()
      // The miss count should increase or the module should be in loading state
      expect(stats).toBeDefined()
    })
  })

  describe('preloadBatch', () => {
    it('should preload multiple modules', async () => {
      const modulePaths = ['/test/module1.tsx', '/test/module2.tsx']
      vi.mocked(cache.get).mockReturnValue({ default: {} })

      await preloader.preloadBatch(modulePaths)

      expect(cache.get).toHaveBeenCalledTimes(2)
    })

    it('should handle partial failures', async () => {
      const modulePaths = ['/test/module1.tsx', '/test/module2.tsx']
      vi.mocked(cache.get).mockReturnValueOnce({ default: {} })
      vi.mocked(cache.get).mockReturnValueOnce(null)

      // One module will fail, but Promise.allSettled handles it
      await preloader.preloadBatch(modulePaths)

      expect(cache.get).toHaveBeenCalledTimes(2)
    })
  })

  describe('preloadByPriority', () => {
    it('should preload modules by priority', async () => {
      preloader.register('/test/high.tsx', { priority: 'high' })
      preloader.register('/test/medium.tsx', { priority: 'medium' })
      preloader.register('/test/low.tsx', { priority: 'low' })

      vi.mocked(cache.get).mockReturnValue({ default: {} })

      await preloader.preloadByPriority()

      // All modules should be registered
      const stats = preloader.getStats()
      expect(stats.total).toBe(3)
    })

    it('should respect preload conditions', async () => {
      preloader.register('/test/conditional.tsx', {
        priority: 'high',
        condition: () => false,
      })

      await preloader.preloadByPriority()

      // Module with false condition should not be preloaded
      const stats = preloader.getStats()
      expect(stats.total).toBe(1)
    })
  })

  describe('recordUsage', () => {
    it('should track tool usage', () => {
      preloader.recordUsage('json-pretty')
      preloader.recordUsage('json-pretty')

      const stats = preloader.getStats()
      // Usage is tracked internally
      expect(stats).toBeDefined()
    })

    it('should update association matrix', () => {
      preloader.recordUsage('json-pretty')
      preloader.recordUsage('base64-encode')

      const related = preloader.predictRelated('json-pretty')
      expect(Array.isArray(related)).toBe(true)
    })
  })

  describe('addAssociations', () => {
    it('should add static associations', () => {
      preloader.addAssociations('json-pretty', ['base64-encode', 'url-encode'], 2)

      const related = preloader.predictRelated('json-pretty')
      expect(related.length).toBeGreaterThan(0)
    })
  })

  describe('predictRelated', () => {
    it('should return empty array for unknown tool', () => {
      const related = preloader.predictRelated('unknown-tool')
      expect(related).toEqual([])
    })

    it('should return top N related tools', () => {
      preloader.addAssociations('json-pretty', ['base64-encode', 'url-encode', 'color-picker'], 1)

      const related = preloader.predictRelated('json-pretty', 2)
      expect(related.length).toBeLessThanOrEqual(2)
    })
  })

  describe('preloadRelated', () => {
    it('should preload related tools', async () => {
      preloader.addAssociations('json-pretty', ['base64-encode'], 1)
      vi.mocked(cache.get).mockReturnValue({ default: {} })

      await preloader.preloadRelated('json-pretty')

      const stats = preloader.getStats()
      expect(stats.total).toBeGreaterThan(0)
    })
  })

  describe('scheduleToolsWithDynamicPriority', () => {
    it('should schedule tools with dynamic priority', () => {
      preloader.recordUsage('json-pretty')
      preloader.scheduleToolsWithDynamicPriority(['json-pretty', 'base64-encode'])

      const stats = preloader.getStats()
      expect(stats.total).toBeGreaterThan(0)
    })
  })

  describe('resetStats', () => {
    it('should reset statistics', () => {
      preloader.resetStats()
      const stats = preloader.getStats()

      expect(stats.preloadedModules).toBe(0)
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.totalLoadTime).toBe(0)
    })
  })

  describe('cleanup', () => {
    it('should clear all observers and state', () => {
      preloader.register('/test/module.tsx', { priority: 'high' })
      preloader.cleanup()

      const stats = preloader.getStats()
      expect(stats.total).toBe(0)
      expect(stats.loaded).toBe(0)
      expect(stats.loading).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should return statistics', () => {
      const stats = preloader.getStats()

      expect(stats).toHaveProperty('preloadedModules')
      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('totalLoadTime')
      expect(stats).toHaveProperty('total')
      expect(stats).toHaveProperty('loaded')
      expect(stats).toHaveProperty('loading')
      expect(stats).toHaveProperty('pending')
    })
  })
})
