export type JsonResult = { ok: true; output: string } | { ok: false; error: string }

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue)
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(source).sort()) sorted[key] = sortValue(source[key])
    return sorted
  }
  return value
}

export function formatJson(input: string, indent: number | "\t" = 2, sortKeys = false): JsonResult {
  if (!input.trim()) return { ok: false, error: "Input is empty" }
  try {
    const parsed: unknown = JSON.parse(input)
    const value = sortKeys ? sortValue(parsed) : parsed
    return { ok: true, output: JSON.stringify(value, null, indent) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function minifyJson(input: string, sortKeys = false): JsonResult {
  if (!input.trim()) return { ok: false, error: "Input is empty" }
  try {
    const parsed: unknown = JSON.parse(input)
    const value = sortKeys ? sortValue(parsed) : parsed
    return { ok: true, output: JSON.stringify(value) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/** `true` when the text is valid JSON, for live validation in the UI. */
export function isValidJson(input: string): boolean {
  if (!input.trim()) return false
  try {
    JSON.parse(input)
    return true
  } catch {
    return false
  }
}
