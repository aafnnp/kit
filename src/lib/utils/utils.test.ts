import { describe, it, expect } from "vitest"
import { formatFileSize, cn, safeDivide, safePercent, safeAverage } from "./utils"

describe("formatFileSize", () => {
  it("returns 0 Bytes for zero", () => {
    expect(formatFileSize(0)).toBe("0 Bytes")
  })

  it("returns 1 Bytes for one byte", () => {
    expect(formatFileSize(1)).toBe("1 Bytes")
  })

  it("shows small values as KB", () => {
    expect(formatFileSize(512)).toBe("0.5 KB")
    expect(formatFileSize(100)).toBe("0.1 KB")
  })

  it("handles the 1 KB boundary", () => {
    expect(formatFileSize(1024)).toBe("1 KB")
    expect(formatFileSize(1023)).toBe("1 KB")
  })

  it("handles larger units", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB")
    expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe("2 GB")
  })

  it("trims trailing zeros", () => {
    expect(formatFileSize(1500)).toBe("1.46 KB")
  })
})

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("ignores falsy values", () => {
    expect(cn("a", false && "b", null, undefined, "c")).toBe("a c")
  })

  it("merges objects and arrays", () => {
    expect(cn({ a: true, b: false }, ["c"])).toBe("a c")
  })
})

describe("safeDivide", () => {
  it("divides normally", () => {
    expect(safeDivide(10, 4)).toBe(2.5)
  })

  it("returns the fallback instead of NaN/Infinity", () => {
    expect(safeDivide(1, 0)).toBe(0)
    expect(safeDivide(0, 0)).toBe(0)
    expect(safeDivide(0, 0, 42)).toBe(42)
    expect(safeDivide(1, Number.NaN)).toBe(0)
    expect(safeDivide(Number.NaN, 2)).toBe(0)
    expect(safeDivide(Number.POSITIVE_INFINITY, 2)).toBe(0)
  })
})

describe("safePercent", () => {
  it("computes a percentage", () => {
    expect(safePercent(3, 4)).toBe(75)
  })

  it("returns the fallback for an empty denominator", () => {
    expect(safePercent(0, 0)).toBe(0)
    expect(safePercent(3, 0, 12)).toBe(12)
  })

  it("never yields NaN", () => {
    expect(Number.isNaN(safePercent(1, 0))).toBe(false)
    expect(Number.isNaN(safePercent(Number.NaN, 0))).toBe(false)
  })
})

describe("safeAverage", () => {
  it("averages values", () => {
    expect(safeAverage([1, 2, 3])).toBe(2)
  })

  it("returns the fallback for an empty array instead of NaN", () => {
    expect(safeAverage([])).toBe(0)
    expect(safeAverage([], 5)).toBe(5)
    expect(Number.isNaN(safeAverage([]))).toBe(false)
  })

  it("ignores non-finite entries", () => {
    // 分母只统计有效值：4 / 2 = 2（而不是 4 / 3）
    expect(safeAverage([1, Number.NaN, 3])).toBe(2)
    expect(safeAverage([Number.POSITIVE_INFINITY, 2])).toBe(2)
  })
})
