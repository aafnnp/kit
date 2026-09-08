import { describe, expect, it } from "vitest"
import { findTool, findToolCategory, findToolLocation, getAllTools } from "./tool-catalog"
import type { ToolsData } from "@/schemas/tool.schema"

const tools: ToolsData = [
  {
    id: "text",
    tools: [
      { slug: "word-count", name: "Word Count" },
      { slug: "case-converter", name: "Case Converter" },
    ],
  },
  {
    id: "color",
    tools: [{ slug: "color-picker", name: "Color Picker" }],
  },
]

describe("tool catalog", () => {
  it("flattens tools while preserving category order", () => {
    expect(getAllTools(tools).map((tool) => tool.slug)).toEqual(["word-count", "case-converter", "color-picker"])
  })

  it("finds a tool and its category", () => {
    expect(findTool(tools, "color-picker")?.name).toBe("Color Picker")
    expect(findToolCategory(tools, "color-picker")?.id).toBe("color")
  })

  it("returns a combined location for an existing tool", () => {
    expect(findToolLocation(tools, "word-count")).toEqual({
      tool: { slug: "word-count", name: "Word Count" },
      category: tools[0],
    })
  })

  it("returns undefined for an unknown tool", () => {
    expect(findToolLocation(tools, "missing")).toBeUndefined()
  })
})
