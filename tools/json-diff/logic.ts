export interface JsonDifference {
  path: string
  kind: "added" | "removed" | "changed"
  before?: unknown
  after?: unknown
}

export interface JsonDiffResult {
  differences: JsonDifference[]
  added: number
  removed: number
  changed: number
}

const MAX_DEPTH = 100

function childPath(path: string, key: string | number): string {
  return `${path}[${JSON.stringify(key)}]`
}

export function compareJson(leftText: string, rightText: string): JsonDiffResult {
  const left: unknown = JSON.parse(leftText)
  const right: unknown = JSON.parse(rightText)
  const differences: JsonDifference[] = []

  const compare = (before: unknown, after: unknown, path: string, depth: number): void => {
    if (Object.is(before, after)) return

    if (depth >= MAX_DEPTH) {
      differences.push({ path: path || "$", kind: "changed", before, after })
      return
    }

    const beforeArray = Array.isArray(before)
    const afterArray = Array.isArray(after)
    if (beforeArray !== afterArray || (beforeArray && afterArray && before === after)) {
      differences.push({ path: path || "$", kind: "changed", before, after })
      return
    }

    if (beforeArray && afterArray) {
      const leftArray = before as unknown[]
      const rightArray = after as unknown[]
      for (let index = 0; index < Math.max(leftArray.length, rightArray.length); index += 1) {
        const itemPath = childPath(path || "$", index)
        if (index >= leftArray.length) differences.push({ path: itemPath, kind: "added", after: rightArray[index] })
        else if (index >= rightArray.length) differences.push({ path: itemPath, kind: "removed", before: leftArray[index] })
        else compare(leftArray[index], rightArray[index], itemPath, depth + 1)
      }
      return
    }

    const beforeObject = before !== null && typeof before === "object"
    const afterObject = after !== null && typeof after === "object"
    if (beforeObject && afterObject) {
      const leftObject = before as Record<string, unknown>
      const rightObject = after as Record<string, unknown>
      const keys = [...new Set([...Object.keys(leftObject), ...Object.keys(rightObject)])].sort()
      for (const key of keys) {
        const itemPath = childPath(path || "$", key)
        if (!(key in leftObject)) differences.push({ path: itemPath, kind: "added", after: rightObject[key] })
        else if (!(key in rightObject)) differences.push({ path: itemPath, kind: "removed", before: leftObject[key] })
        else compare(leftObject[key], rightObject[key], itemPath, depth + 1)
      }
      return
    }

    differences.push({ path: path || "$", kind: "changed", before, after })
  }

  compare(left, right, "", 0)
  return {
    differences,
    added: differences.filter((difference) => difference.kind === "added").length,
    removed: differences.filter((difference) => difference.kind === "removed").length,
    changed: differences.filter((difference) => difference.kind === "changed").length,
  }
}

export function formatJsonValue(value: unknown): string {
  return JSON.stringify(value)
}
