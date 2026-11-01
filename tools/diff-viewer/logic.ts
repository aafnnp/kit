export type DiffKind = "same" | "add" | "remove"

export interface DiffLine {
  kind: DiffKind
  value: string
  oldLine?: number
  newLine?: number
}

export interface DiffResult {
  lines: DiffLine[]
  added: number
  removed: number
  unchanged: number
}

const MAX_CELLS = 4_000_000

export function diffLines(before: string, after: string): DiffResult {
  const a = before === "" ? [] : before.split(/\r?\n/)
  const b = after === "" ? [] : after.split(/\r?\n/)

  if (a.length * b.length > MAX_CELLS) {
    throw new Error("The texts are too large to compare line by line")
  }

  const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i]![j] = a[i] === b[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!)
    }
  }

  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push({ kind: "same", value: a[i]!, oldLine: i + 1, newLine: j + 1 })
      i += 1
      j += 1
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      lines.push({ kind: "remove", value: a[i]!, oldLine: i + 1 })
      i += 1
    } else {
      lines.push({ kind: "add", value: b[j]!, newLine: j + 1 })
      j += 1
    }
  }
  while (i < a.length) {
    lines.push({ kind: "remove", value: a[i]!, oldLine: i + 1 })
    i += 1
  }
  while (j < b.length) {
    lines.push({ kind: "add", value: b[j]!, newLine: j + 1 })
    j += 1
  }

  let added = 0
  let removed = 0
  let unchanged = 0
  for (const line of lines) {
    if (line.kind === "add") added += 1
    else if (line.kind === "remove") removed += 1
    else unchanged += 1
  }

  return { lines, added, removed, unchanged }
}
