import { describe, expect, it } from "vitest"
import { analyzeJSON, processJSON, validateJSON } from "../json-processor"
import type { JSONSettings } from "@/schemas/json-pretty.schema"

const baseSettings: JSONSettings = {
  indentSize: 2,
  sortKeys: false,
  removeComments: false,
  validateSchema: false,
  showStatistics: true,
  realTimeProcessing: false,
  exportFormat: "json",
  maxDepth: 64,
  maxSize: 1024 * 1024,
}

describe("json-processor", () => {
  it("validates empty input as invalid", () => {
    const validation = validateJSON("")
    expect(validation.isValid).toBe(false)
    expect(validation.errors[0]?.message).toContain("cannot be empty")
  })

  it("formats JSON with sorted keys when enabled", () => {
    const input = '{"b":1,"a":2}'
    const result = processJSON(
      input,
      "format",
      {
        ...baseSettings,
        sortKeys: true,
      }
    )
    expect(result.isValid).toBe(true)
    expect(result.output).toBe(`{
  "a": 2,
  "b": 1
}`)
  })

  it("returns error for invalid JSON", () => {
    const result = processJSON("{ invalid }", "format", baseSettings)
    expect(result.isValid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it("analyzes structure depth and counts", () => {
    const stats = analyzeJSON('{"users":[{"id":1},{"id":2}]}')
    expect(stats.depth).toBeGreaterThan(0)
    expect(stats.arrays).toBe(1)
    expect(stats.objects).toBeGreaterThanOrEqual(3)
  })
})

