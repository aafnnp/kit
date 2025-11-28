import { nanoid } from "nanoid"
import type { JSONOperation, JSONProcessingResult, JSONSettings, JSONStatistics, JSONValidation } from "@/components/tools/json-pretty/schema"

export const validateJSON = (input: string): JSONValidation => {
  const validation: JSONValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!input.trim()) {
    validation.isValid = false
    validation.errors.push({ message: "JSON input cannot be empty" })
    return validation
  }

  try {
    JSON.parse(input)
  } catch (error) {
    validation.isValid = false
    if (error instanceof SyntaxError) {
      const match = error.message.match(/at position (\d+)/)
      const position = match ? parseInt(match[1]) : undefined

      let line: number | undefined
      let column: number | undefined

      if (position !== undefined) {
        const lines = input.substring(0, position).split("\n")
        line = lines.length
        column = lines[lines.length - 1].length + 1
      }

      validation.errors.push({
        message: error.message,
        line,
        column,
      })
    } else {
      validation.errors.push({ message: "Unknown JSON parsing error" })
    }
    return validation
  }

  if (input.includes("\t")) {
    validation.warnings.push("Contains tab characters - consider using spaces for indentation")
  }

  if (input.length > 1000000) {
    validation.warnings.push("Large JSON file - processing may be slow")
  }

  if (input.includes("undefined")) {
    validation.suggestions.push('Contains "undefined" strings - ensure these are intentional')
  }

  if (input.includes("NaN")) {
    validation.suggestions.push('Contains "NaN" strings - these are not valid JSON values')
  }

  return validation
}

export const analyzeJSON = (input: string): JSONStatistics => {
  const stats: JSONStatistics = {
    size: new Blob([input]).size,
    lines: input.split("\n").length,
    depth: 0,
    keys: 0,
    arrays: 0,
    objects: 0,
    primitives: 0,
    nullValues: 0,
    booleans: 0,
    numbers: 0,
    strings: 0,
    duplicateKeys: [],
    circularReferences: false,
  }

  try {
    const parsed = JSON.parse(input)
    analyzeValue(parsed, stats, 0, new Set(), new Map())
  } catch {
    return stats
  }

  return stats
}

const analyzeValue = (
  value: any,
  stats: JSONStatistics,
  depth: number,
  visited: Set<any>,
  keyCount: Map<string, number>,
  path: string = ""
): void => {
  stats.depth = Math.max(stats.depth, depth)

  if (value === null) {
    stats.nullValues++
    stats.primitives++
    return
  }

  if (typeof value === "boolean") {
    stats.booleans++
    stats.primitives++
    return
  }

  if (typeof value === "number") {
    stats.numbers++
    stats.primitives++
    return
  }

  if (typeof value === "string") {
    stats.strings++
    stats.primitives++
    return
  }

  if (Array.isArray(value)) {
    stats.arrays++

    if (visited.has(value)) {
      stats.circularReferences = true
      return
    }
    visited.add(value)

    value.forEach((item, index) => {
      analyzeValue(item, stats, depth + 1, visited, keyCount, `${path}[${index}]`)
    })

    visited.delete(value)
    return
  }

  if (typeof value === "object") {
    stats.objects++

    if (visited.has(value)) {
      stats.circularReferences = true
      return
    }
    visited.add(value)

    Object.keys(value).forEach((key) => {
      stats.keys++

      const count = keyCount.get(key) || 0
      keyCount.set(key, count + 1)
      if (count === 1) {
        stats.duplicateKeys.push(key)
      }

      analyzeValue(value[key], stats, depth + 1, visited, keyCount, `${path}.${key}`)
    })

    visited.delete(value)
  }
}

const sortObjectKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }
  if (obj !== null && typeof obj === "object") {
    const sorted: Record<string, unknown> = {}
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObjectKeys(obj[key])
      })
    return sorted
  }
  return obj
}

export const processJSON = (
  input: string,
  operation: JSONOperation,
  settings: JSONSettings
): JSONProcessingResult => {
  try {
    const validation = validateJSON(input)

    if (!validation.isValid) {
      return {
        id: nanoid(),
        input,
        output: "",
        operation,
        isValid: false,
        error: validation.errors.map((e) => e.message).join("; "),
        statistics: analyzeJSON(input),
        createdAt: new Date(),
      }
    }

    const parsed = JSON.parse(input)
    let output = ""

    switch (operation) {
      case "format":
        if (settings.sortKeys) {
          output = JSON.stringify(sortObjectKeys(parsed), null, settings.indentSize)
        } else {
          output = JSON.stringify(parsed, null, settings.indentSize)
        }
        break
      case "minify":
        output = JSON.stringify(parsed)
        break
      case "validate":
        output = "Valid JSON ✓"
        break
      case "analyze":
        output = JSON.stringify(analyzeJSON(input), null, 2)
        break
      case "escape":
        output = JSON.stringify(input)
        break
      case "unescape":
        try {
          output = JSON.parse(input)
        } catch {
          output = input
        }
        break
      default:
        output = JSON.stringify(parsed, null, settings.indentSize)
    }

    return {
      id: nanoid(),
      input,
      output,
      operation,
      isValid: true,
      statistics: analyzeJSON(input),
      createdAt: new Date(),
    }
  } catch (error) {
    return {
      id: nanoid(),
      input,
      output: "",
      operation,
      isValid: false,
      error: error instanceof Error ? error.message : "Processing failed",
      statistics: analyzeJSON(input),
      createdAt: new Date(),
    }
  }
}


