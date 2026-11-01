import { parseCsv } from "../csv-to-json/logic"

export type SortDirection = "ascending" | "descending"

function compareValues(left: string, right: string): number {
  const leftTrimmed = left.trim()
  const rightTrimmed = right.trim()
  const leftNumber = Number(leftTrimmed)
  const rightNumber = Number(rightTrimmed)
  if (leftTrimmed && rightTrimmed && Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber
  }
  return leftTrimmed.toLowerCase() < rightTrimmed.toLowerCase()
    ? -1
    : leftTrimmed.toLowerCase() > rightTrimmed.toLowerCase()
      ? 1
      : 0
}

function escapeCsv(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function sortCsvTable(input: string, columnIndex: number, direction: SortDirection): string[][] {
  const rows = parseCsv(input)
  if (rows.length < 2) throw new Error("Include a header row and at least one data row.")
  const columnCount = rows[0]!.length
  if (!Number.isInteger(columnIndex) || columnIndex < 0 || columnIndex >= columnCount) {
    throw new Error("Choose a column from the header row.")
  }
  if (rows.some((row) => row.length !== columnCount)) throw new Error("Every row must have the same number of columns.")

  const sorted = rows.slice(1).map((row, index) => ({ row, index }))
  sorted.sort((left, right) => {
    const compared = compareValues(left.row[columnIndex]!, right.row[columnIndex]!)
    return compared === 0 ? left.index - right.index : direction === "ascending" ? compared : -compared
  })
  return [rows[0]!, ...sorted.map(({ row }) => row)]
}

export function formatCsvTable(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n")
}
