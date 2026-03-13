import { describe, it, expect } from "vitest"
import { generateDiff, validateTextFile } from "./logic"
import type { DiffSettings } from "./schema"

const baseSettings: DiffSettings = {
  algorithm: "myers",
  format: "side-by-side",
  viewMode: "full",
  showLineNumbers: true,
  showWhitespace: false,
  ignoreWhitespace: false,
  ignoreCase: false,
  contextLines: 3,
  wordLevelDiff: true,
  syntaxHighlighting: false,
  wrapLines: true,
}

describe("diff-viewer logic", () => {
  it("should treat identical texts as 100% similar", () => {
    const left = "line1\nline2\nline3"
    const right = "line1\nline2\nline3"

    const result = generateDiff(left, right, baseSettings)

    expect(result.statistics.totalLines).toBe(3)
    expect(result.statistics.addedLines).toBe(0)
    expect(result.statistics.removedLines).toBe(0)
    expect(result.statistics.modifiedLines).toBe(0)
    expect(result.statistics.unchangedLines).toBe(3)
    expect(result.statistics.similarity).toBe(100)
  })

  it("should detect added and removed lines", () => {
    const left = "a\nb\nc"
    const right = "a\nb\nc\nd"

    const result = generateDiff(left, right, baseSettings)

    expect(result.statistics.totalLines).toBeGreaterThanOrEqual(4)
    expect(result.statistics.addedLines).toBeGreaterThanOrEqual(1)
  })

  it("should respect ignoreCase setting", () => {
    const left = "Hello"
    const right = "hello"

    const caseSensitive = generateDiff(left, right, { ...baseSettings, ignoreCase: false })
    const caseInsensitive = generateDiff(left, right, { ...baseSettings, ignoreCase: true })

    expect(caseSensitive.statistics.unchangedLines).toBe(0)
    expect(caseInsensitive.statistics.unchangedLines).toBeGreaterThanOrEqual(1)
  })

  it("should validate text files by size and extension", () => {
    const ok = new File(["hello"], "a.txt", { type: "text/plain" })
    const badExt = new File(["hello"], "a.bin", { type: "application/octet-stream" })

    expect(validateTextFile(ok).isValid).toBe(true)
    expect(validateTextFile(badExt).isValid).toBe(false)
  })
}

