import { describe, it, expect } from "vitest"
import { sanitizeSvgMarkup } from "./sanitize"

describe("sanitizeSvgMarkup", () => {
  it("returns an empty string for non-string or blank input", () => {
    expect(sanitizeSvgMarkup(null)).toBe("")
    expect(sanitizeSvgMarkup(undefined)).toBe("")
    expect(sanitizeSvgMarkup("   ")).toBe("")
    expect(sanitizeSvgMarkup(42)).toBe("")
  })

  it("keeps a plain svg untouched in substance", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10H0z"/></svg>'
    const result = sanitizeSvgMarkup(svg)

    expect(result).toContain("<path")
    expect(result).toContain('d="M0 0h10v10H0z"')
  })

  it("removes script elements", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0"/></svg>'
    const result = sanitizeSvgMarkup(svg)

    expect(result).not.toContain("<script")
    expect(result).not.toContain("alert(1)")
    expect(result).toContain("<path")
  })

  it("removes event handler attributes", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><path d="M0 0" onclick="steal()"/></svg>'
    const result = sanitizeSvgMarkup(svg)

    expect(result).not.toContain("onload")
    expect(result).not.toContain("onclick")
    expect(result).not.toContain("alert(1)")
  })

  it("removes foreignObject (HTML smuggling)", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><img src=x onerror="alert(1)"/></body></foreignObject></svg>'
    const result = sanitizeSvgMarkup(svg)

    expect(result).not.toContain("foreignObject")
    expect(result).not.toContain("onerror")
  })

  it("drops javascript: urls but keeps fragment references", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><text>x</text></a><use href="#icon-a"/></svg>'
    const result = sanitizeSvgMarkup(svg)

    expect(result).not.toContain("javascript:")
    expect(result).toContain('href="#icon-a"')
  })

  it("keeps safe embedded images but drops data:text/html", () => {
    const safe =
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,AAAA"/></svg>'
    expect(sanitizeSvgMarkup(safe)).toContain("data:image/png")

    const unsafe =
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:text/html;base64,PHNjcmlwdD4="/></svg>'
    expect(sanitizeSvgMarkup(unsafe)).not.toContain("data:text/html")
  })

  it("rejects markup whose root is not an svg element", () => {
    expect(sanitizeSvgMarkup("<div>hello</div>")).toBe("")
    expect(sanitizeSvgMarkup("<html><body>hi</body></html>")).toBe("")
  })
})
