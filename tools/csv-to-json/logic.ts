export type Delimiter = "," | ";" | "\t" | "|"

export interface CsvOptions {
  delimiter: Delimiter
  hasHeader: boolean
  inferTypes: boolean
}

/** RFC 4180 parser: quoted fields, escaped quotes and newlines inside quotes. */
export function parseCsv(text: string, delimiter: Delimiter = ","): string[][] {
  const source = text.replace(/^\uFEFF/, "")
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]!

    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === delimiter) {
      row.push(cell)
      cell = ""
    } else if (char === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else if (char === "\r") {
      // Ignored; \r\n is handled by the following \n.
    } else {
      cell += char
    }
  }

  if (quoted) throw new Error("Unterminated quoted field")
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((item) => item.length > 1 || item[0] !== "")
}

function inferValue(value: string): unknown {
  const trimmed = value.trim()
  if (trimmed === "") return ""
  if (trimmed === "null") return null
  if (trimmed === "true") return true
  if (trimmed === "false") return false
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) return Number(trimmed)
  return value
}

export function csvToJson(text: string, options: CsvOptions): { ok: true; output: string; rows: number } | { ok: false; error: string } {
  if (!text.trim()) return { ok: false, error: "Input is empty" }
  let rows: string[][]
  try {
    rows = parseCsv(text, options.delimiter)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
  if (rows.length === 0) return { ok: false, error: "No rows found" }

  const convert = (value: string) => (options.inferTypes ? inferValue(value) : value)

  if (!options.hasHeader) {
    return { ok: true, output: JSON.stringify(rows.map((row) => row.map(convert)), null, 2), rows: rows.length }
  }

  const header = rows[0]!
  const used = new Set<string>()
  const keys = header.map((key, index) => {
    const base = key.trim() || `column_${index + 1}`
    let candidate = base
    let suffix = 2
    while (used.has(candidate)) candidate = `${base}_${suffix++}`
    used.add(candidate)
    return candidate
  })
  const dataRows = rows.slice(1)
  const mismatched = dataRows.findIndex((row) => row.length !== keys.length)
  if (mismatched !== -1) {
    return {
      ok: false,
      error: `Row ${mismatched + 2} has ${dataRows[mismatched]!.length} columns; the header has ${keys.length}`,
    }
  }
  const data = dataRows.map((row) => {
    const record = Object.create(null) as Record<string, unknown>
    keys.forEach((key, column) => {
      record[key] = convert(row[column] ?? "")
    })
    return record
  })

  return { ok: true, output: JSON.stringify(data, null, 2), rows: data.length }
}
