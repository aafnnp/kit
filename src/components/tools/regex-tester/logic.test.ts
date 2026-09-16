import { describe, it, expect } from "vitest"
import { highlightMatches } from "./logic"
import type { RegexMatch } from "./schema"

const match = (index: number, length: number, value: string): RegexMatch => ({
  index,
  length,
  match: value,
  groups: [],
})

describe("highlightMatches", () => {
  it("escapes the whole text when highlighting is disabled", () => {
    const text = '<img src=x onerror="alert(1)">'
    const result = highlightMatches(text, [match(0, 3, "<im")], false)

    // 回归防线：此处返回值会进入 dangerouslySetInnerHTML
    expect(result).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;")
    expect(result).not.toContain("<img")
  })

  it("escapes the whole text when there are no matches", () => {
    expect(highlightMatches("<script>alert(1)</script>", [], true)).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    )
  })

  it("wraps matches in mark tags and escapes the surrounding text", () => {
    const text = "<b>hello</b>"
    // 选中 "hello"（索引 3..8）
    const result = highlightMatches(text, [match(3, 5, "hello")], true)

    expect(result).toBe('&lt;b&gt;<mark class="bg-yellow-200 dark:bg-yellow-800" data-match="0">hello</mark>&lt;/b&gt;')
  })

  it("escapes the matched text itself", () => {
    const text = "x<script>y"
    // 匹配 "<script>"（索引 1..9）
    const result = highlightMatches(text, [match(1, 8, "<script>")], true)

    expect(result).not.toContain("<script>")
    expect(result).toContain("&lt;script&gt;")
  })

  it("handles out-of-order matches without corrupting the text", () => {
    const text = "abcdef"
    const result = highlightMatches(text, [match(3, 3, "def"), match(0, 1, "a")], true)

    expect(result).toBe(
      '<mark class="bg-yellow-200 dark:bg-yellow-800" data-match="0">a</mark>bc<mark class="bg-yellow-200 dark:bg-yellow-800" data-match="1">def</mark>',
    )
  })

  it("skips overlapping matches instead of producing nested/broken markup", () => {
    const text = "abcdef"
    const result = highlightMatches(text, [match(0, 3, "abc"), match(1, 3, "bcd")], true)

    // 第二个匹配与第一个重叠，应被丢弃；文本仍完整保留一次
    expect(result).toBe(
      '<mark class="bg-yellow-200 dark:bg-yellow-800" data-match="0">abc</mark>def',
    )
    expect(result.match(/abc/g)).toHaveLength(1)
  })

  it("ignores matches with invalid indices or zero length", () => {
    const text = "abc"
    const result = highlightMatches(text, [match(-1, 2, "ab"), match(1, 0, ""), match(99, 2, "zz")], true)

    expect(result).toBe("abc")
  })

  it("clamps a match that overruns the end of the text", () => {
    const text = "abc"
    const result = highlightMatches(text, [match(1, 99, "bc")], true)

    expect(result).toBe(
      'a<mark class="bg-yellow-200 dark:bg-yellow-800" data-match="0">bc</mark>',
    )
  })
})
