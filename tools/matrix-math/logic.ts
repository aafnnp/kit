export type Matrix = number[][]
export type MatrixOperation = "add" | "subtract" | "multiply" | "transpose"

export function parseMatrix(input: string): Matrix {
  const rows = input.trim().split(/[\n;]+/).map((line) => line.trim()).filter(Boolean)
  if (!rows.length) throw new Error("Enter at least one matrix row.")
  const matrix = rows.map((row) => {
    const values = row.split(/[,\s]+/).filter(Boolean).map(Number)
    if (!values.length || values.some((value) => !Number.isFinite(value))) {
      throw new Error("Matrix entries must be finite numbers.")
    }
    return values
  })
  if (matrix.some((row) => row.length !== matrix[0]!.length)) {
    throw new Error("Every row must have the same number of columns.")
  }
  return matrix
}

export function calculateMatrix(left: Matrix, right: Matrix | null, operation: MatrixOperation): Matrix {
  if (operation === "transpose") return left[0]!.map((_, column) => left.map((row) => row[column]!))
  if (!right) throw new Error("Enter a second matrix.")

  if (operation === "add" || operation === "subtract") {
    if (left.length !== right.length || left[0]!.length !== right[0]!.length) {
      throw new Error("Addition and subtraction require matrices with matching dimensions.")
    }
    const sign = operation === "add" ? 1 : -1
    return left.map((row, i) => row.map((value, j) => value + sign * right[i]![j]!))
  }

  if (left[0]!.length !== right.length) {
    throw new Error("The first matrix's column count must match the second matrix's row count.")
  }
  return left.map((row) =>
    right[0]!.map((_, column) =>
      row.reduce((sum, value, index) => sum + value * right[index]![column]!, 0),
    ),
  )
}

export function formatMatrix(matrix: Matrix): string {
  return matrix.map((row) => row.map((value) => Number(value.toPrecision(10)).toString()).join("\t")).join("\n")
}
