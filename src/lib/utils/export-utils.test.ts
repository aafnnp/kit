import { describe, it, expect } from "vitest"
import {
  escapeCsvCell,
  toCsv,
  escapeHtml,
  escapeXmlText,
  escapeXmlAttr,
  escapeYamlScalar,
} from "./export-utils"

describe("escapeCsvCell", () => {
  it("wraps plain values in quotes", () => {
    expect(escapeCsvCell("hello")).toBe('"hello"')
  })

  it("doubles embedded quotes (RFC 4180)", () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""')
  })

  it("keeps delimiters and newlines inside the quoted cell", () => {
    expect(escapeCsvCell("a,b\nc")).toBe('"a,b\nc"')
  })

  it("normalizes null and undefined to an empty cell", () => {
    expect(escapeCsvCell(null)).toBe('""')
    expect(escapeCsvCell(undefined)).toBe('""')
  })

  it("sanitizes formula triggers by default", () => {
    expect(escapeCsvCell("=cmd|'/c calc'!A1")).toBe('"\'=cmd|\'/c calc\'!A1"')
    expect(escapeCsvCell("+1")).toBe('"\'+1"')
    expect(escapeCsvCell("@SUM(A1)")).toBe('"\'@SUM(A1)"')
  })

  it("can opt out of formula sanitizing", () => {
    expect(escapeCsvCell("+1", { sanitizeFormulas: false })).toBe('"+1"')
  })
})

describe("toCsv", () => {
  it("joins rows with CRLF by default", () => {
    expect(
      toCsv([
        ["a", "b"],
        [1, 2],
      ]),
    ).toBe('"a","b"\r\n"1","2"')
  })

  it("can omit the header row", () => {
    expect(
      toCsv(
        [
          ["a", "b"],
          [1, 2],
        ],
        { includeHeader: false },
      ),
    ).toBe('"1","2"')
  })

  it("supports a custom delimiter", () => {
    expect(toCsv([["a", "b"]], { delimiter: ";" })).toBe('"a";"b"')
  })

  it("prepends a BOM when requested", () => {
    expect(toCsv([["a"]], { includeBom: true })).toBe('\uFEFF"a"')
  })
})

describe("escapeHtml", () => {
  it("escapes tags and quotes", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    )
  })

  it("escapes ampersands first so entities are not double-decoded", () => {
    expect(escapeHtml("a&b")).toBe("a&amp;b")
    expect(escapeHtml("&lt;")).toBe("&amp;lt;")
  })

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s")
  })
})

describe("escapeXmlText / escapeXmlAttr", () => {
  it("escapes markup characters", () => {
    expect(escapeXmlText("</title><script>")).toBe("&lt;/title&gt;&lt;script&gt;")
  })

  it("escapes both quote styles in attributes", () => {
    expect(escapeXmlAttr(`a"b'c`)).toBe("a&quot;b&apos;c")
  })
})

describe("escapeYamlScalar", () => {
  it("keeps safe plain scalars unquoted", () => {
    expect(escapeYamlScalar("hello")).toBe("hello")
    expect(escapeYamlScalar("a-b/c.d")).toBe("a-b/c.d")
  })

  it("quotes values that would otherwise change meaning", () => {
    expect(escapeYamlScalar("true")).toBe('"true"')
    expect(escapeYamlScalar("null")).toBe('"null"')
    expect(escapeYamlScalar("- item")).toBe('"- item"')
    expect(escapeYamlScalar("key: value")).toBe('"key: value"')
    expect(escapeYamlScalar(" padded ")).toBe('" padded "')
  })

  it("escapes newlines inside quoted scalars", () => {
    expect(escapeYamlScalar("a\nb")).toBe('"a\\nb"')
  })

  it("renders numbers and booleans natively", () => {
    expect(escapeYamlScalar(42)).toBe("42")
    expect(escapeYamlScalar(true)).toBe("true")
  })

  it("renders null and undefined as null", () => {
    expect(escapeYamlScalar(null)).toBe("null")
    expect(escapeYamlScalar(undefined)).toBe("null")
  })

  it("does not emit NaN", () => {
    expect(escapeYamlScalar(Number.NaN)).toBe('"NaN"')
  })
})
