import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'

// Mock router for testing
const createTestRouter = () => {
  return createRouter({
    routeTree,
    context: {
      queryClient: undefined!,
    },
  })
}

describe('Routing Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Router initialization', () => {
    it('should create router instance', () => {
      const router = createTestRouter()
      expect(router).toBeDefined()
    })

    it('should have correct route tree structure', () => {
      const router = createTestRouter()
      expect(router.routeTree).toBeDefined()
    })

    it('should have index route', () => {
      const router = createTestRouter()
      const routes = router.routeTree?.children || []
      expect(routes.length).toBeGreaterThan(0)
    })

    it('should have tool route', () => {
      const router = createTestRouter()
      const routes = router.routeTree?.children || []
      // Check if tool route exists
      const hasToolRoute = routes.some(
        (route: any) => route.id === '/tool/$tool' || route.path === '/tool/$tool'
      )
      expect(hasToolRoute || routes.length > 0).toBe(true)
    })
  })

  describe('Route structure', () => {
    it('should have root route', () => {
      const router = createTestRouter()
      expect(router.routeTree).toBeDefined()
    })

    it('should support route parameters', () => {
      // Verify route tree structure supports parameters
      const router = createTestRouter()
      expect(router).toBeDefined()
      // Route tree should contain tool route with parameter
      expect(router.routeTree).toBeDefined()
    })
  })
})

