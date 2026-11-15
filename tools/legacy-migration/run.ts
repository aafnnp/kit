import { legacyToolSpecBySlug } from "./specs"
import { guardInput } from "../../lib/validation"
import type { LegacyToolResult } from "./helpers"

export function runLegacyTool(slug: string, input: string, secondary = ""): LegacyToolResult {
  guardInput(input)
  guardInput(secondary)
  const spec = legacyToolSpecBySlug.get(slug)
  if (!spec) throw new Error(`No implementation is registered for legacy tool "${slug}".`)
  return spec.run(input, secondary)
}
