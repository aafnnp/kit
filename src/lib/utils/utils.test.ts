import { describe, it, expect } from "vitest"
import { formatFileSize, cn } from "./utils"

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
