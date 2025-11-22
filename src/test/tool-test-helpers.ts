/**
 * Test helpers for tool testing
 * Common utilities and mocks for testing tools
 */

import { vi } from "vitest"

/**
 * Mock file object for testing file-related functions
 */
export function createMockFile(content: string | Blob, name: string = "test.txt", type: string = "text/plain"): File {
  const blob = typeof content === "string" ? new Blob([content], { type }) : content
  return new File([blob], name, { type })
}

/**
 * Mock large file for testing file size limits
 */
export function createMockLargeFile(sizeInMB: number = 11): File {
  const content = "x".repeat(sizeInMB * 1024 * 1024)
  return createMockFile(content, "large.txt", "text/plain")
}

/**
 * Mock image file
 * Creates a minimal valid image file for testing
 */
export function createMockImageFile(
  _width: number = 100,
  _height: number = 100,
  format: "png" | "jpg" | "gif" = "png"
): File {
  // Create a minimal 1x1 PNG pixel (smallest valid PNG)
  // PNG signature + minimal IHDR + IEND chunks
  const pngSignature = new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    0x00,
    0x00,
    0x00,
    0x0d, // IHDR chunk length
    0x49,
    0x48,
    0x44,
    0x52, // IHDR
    0x00,
    0x00,
    0x00,
    0x01, // width (1 pixel)
    0x00,
    0x00,
    0x00,
    0x01, // height (1 pixel)
    0x08,
    0x02,
    0x00,
    0x00,
    0x00, // bit depth, color type, compression, filter, interlace
    0x90,
    0x77,
    0x53,
    0xde, // CRC
    0x00,
    0x00,
    0x00,
    0x00, // IDAT chunk length
    0x49,
    0x44,
    0x41,
    0x54, // IDAT
    0x78,
    0x9c,
    0x63,
    0x00,
    0x00,
    0x00,
    0x02,
    0x00,
    0x01, // compressed data
    0x00,
    0x00,
    0x00,
    0x0c, // IEND chunk length
    0x49,
    0x45,
    0x4e,
    0x44, // IEND
    0xae,
    0x42,
    0x60,
    0x82, // CRC
  ])

  return new File([pngSignature], `test.${format}`, { type: `image/${format}` })
}

/**
 * Mock clipboard API
 */
export function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined)
  const readText = vi.fn().mockResolvedValue("")

  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText,
      readText,
    },
    writable: true,
    configurable: true,
  })

  return { writeText, readText }
}

/**
 * Mock performance API
 */
export function mockPerformance() {
  const now = vi.fn(() => Date.now())
  const mark = vi.fn()
  const measure = vi.fn()
  const getEntriesByType = vi.fn(() => [])

  Object.defineProperty(window, "performance", {
    value: {
      now,
      mark,
      measure,
      getEntriesByType,
    },
    writable: true,
    configurable: true,
  })

  return { now, mark, measure, getEntriesByType }
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Test data generators
 */
export const testData = {
  // JSON test data
  validJSON: '{"key": "value", "number": 42, "array": [1, 2, 3]}',
  invalidJSON: "{key: value}",
  nestedJSON: '{"a": {"b": {"c": "value"}}}',

  // Base64 test data
  base64String: "SGVsbG8gV29ybGQ=",
  base64Decoded: "Hello World",

  // Color test data
  hexColor: "#FF5733",
  rgbColor: { r: 255, g: 87, b: 51 },

  // UUID test data
  uuidV4: "550e8400-e29b-41d4-a716-446655440000",
  invalidUUID: "not-a-uuid",

  // URL test data
  validURL: "https://example.com/path?query=value",
  invalidURL: "not-a-url",

  // Regex test data
  email: "user@example.com",
  phone: "(555) 123-4567",

  // Text test data
  longText: "a".repeat(1000),
  unicodeText: "你好世界 🌍",
  specialChars: "!@#$%^&*()",
}

/**
 * Assertion helpers
 * Note: These functions should be used within test files that import expect from vitest
 */
export const assertions = {
  /**
   * Assert that a function throws with specific error message
   * @param fn - Function to test
   * @param expectedMessage - Expected error message
   * @param expect - expect function from vitest (must be passed from test file)
   */
  async throwsWithMessage(fn: () => Promise<any> | any, expectedMessage: string | RegExp, expect: any) {
    try {
      await fn()
      throw new Error("Expected function to throw")
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (typeof expectedMessage === "string") {
        expect(message).toContain(expectedMessage)
      } else {
        expect(message).toMatch(expectedMessage)
      }
    }
  },

  /**
   * Assert that a value is a valid file
   * @param file - Value to check
   * @param expect - expect function from vitest (must be passed from test file)
   */
  isValidFile(file: any, expect: any): asserts file is File {
    expect(file).toBeInstanceOf(File)
    expect(file.name).toBeDefined()
    expect(file.size).toBeGreaterThanOrEqual(0)
  },

  /**
   * Assert that a value is within a range
   * @param value - Value to check
   * @param min - Minimum value
   * @param max - Maximum value
   * @param expect - expect function from vitest (must be passed from test file)
   */
  isInRange(value: number, min: number, max: number, expect: any) {
    expect(value).toBeGreaterThanOrEqual(min)
    expect(value).toBeLessThanOrEqual(max)
  },
}
