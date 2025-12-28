import { afterEach, vi } from "vitest"
import * as React from "react"
import { act } from "react"
import "@testing-library/jest-dom/vitest"

// 修复 React 19 兼容性
// React 19 中 act 已从 react-dom/test-utils 移动到 react 包
// 需要设置全局环境变量以支持 act
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// 确保 React.act 在模块加载时就可用
// @testing-library/react 的 act-compat.js 在导入时检查 React.act
// 必须在任何其他模块导入 @testing-library/react 之前设置
;(React as any).act = act

// Mock react-dom/test-utils 以提供 act（作为回退方案）
// 这必须在导入 @testing-library/react 之前完成
vi.mock("react-dom/test-utils", () => ({
  act,
  default: {
    act,
  },
}))

// 现在才导入 cleanup，此时 React.act 已经设置好
import { cleanup } from "@testing-library/react"

// 清理测试后的 DOM（仅在 jsdom 环境中）
// 检查是否在浏览器环境中（jsdom），Node 环境不需要 cleanup
if (typeof window !== "undefined") {
  afterEach(() => {
    cleanup()
  })

  // Mock window.matchMedia（仅在浏览器环境中）
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock IntersectionObserver（仅在浏览器环境中）
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return []
    }
    unobserve() {}
  } as any

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any

  // Mock window.performance
  Object.defineProperty(window, "performance", {
    writable: true,
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
    },
  })
}

// Mock import.meta.glob for test environment
// In test environment, import.meta.glob may not work as expected
// We need to ensure it returns an empty object or functions, not strings
// This is handled in tool-chunk-manifest.ts by checking the type
