import { describe, it, expect } from "vitest"
import { defineToolMeta } from "./tool-meta"

describe("defineToolMeta", () => {
  it("returns meta with valid category", () => {
    const meta = defineToolMeta({ slug: "foo", name: "Foo", category: "text-processing" })
    expect(meta.slug).toBe("foo")
    expect(meta.name).toBe("Foo")
    expect(meta.category).toBe("text-processing")
  })

  it("throws on empty category", () => {
    expect(() => defineToolMeta({ slug: "foo", name: "Foo", category: "" })).toThrow(
      /Category is required/,
    )
  })

  it("throws on whitespace-only category", () => {
    expect(() => defineToolMeta({ slug: "foo", name: "Foo", category: "   " })).toThrow(
      /Category is required/,
    )
  })
})
