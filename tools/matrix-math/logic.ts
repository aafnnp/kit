import { guardInput } from "../../lib/validation"

export type Matrix = number[][]
export type MatrixOperation = "add" | "subtract" | "multiply" | "transpose" | "determinant" | "inverse"

export function parseMatrix(input: string): Matrix {
  guardInput(input, "Matrix")
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

function squareSize(matrix: Matrix): number {
  const size = matrix.length
  if (matrix.some((row) => row.length !== size)) throw new Error("This operation requires a square matrix.")
  return size
}

export function determinant(matrix: Matrix): number {
  const size = squareSize(matrix)
  const values = matrix.map((row) => [...row])
  let result = 1

  for (let column = 0; column < size; column += 1) {
    let pivot = column
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(values[row]![column]!) > Math.abs(values[pivot]![column]!)) pivot = row
    }
    if (values[pivot]![column] === 0) return 0
    if (pivot !== column) {
      const swap = values[pivot]!
      values[pivot] = values[column]!
      values[column] = swap
      result = -result
    }
    const pivotValue = values[column]![column]!
    result *= pivotValue
    for (let row = column + 1; row < size; row += 1) {
      const factor = values[row]![column]! / pivotValue
      for (let index = column; index < size; index += 1) {
        values[row]![index] = values[row]![index]! - factor * values[column]![index]!
      }
    }
  }
  return result
}

export function invertMatrix(matrix: Matrix): Matrix {
  const size = squareSize(matrix)
  const values = matrix.map((row, index) => [
    ...row,
    ...Array.from({ length: size }, (_, column) => (column === index ? 1 : 0)),
  ])

  for (let column = 0; column < size; column += 1) {
    let pivot = column
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(values[row]![column]!) > Math.abs(values[pivot]![column]!)) pivot = row
    }
    if (values[pivot]![column] === 0) throw new Error("The matrix is singular and has no inverse.")
    if (pivot !== column) {
      const swap = values[pivot]!
      values[pivot] = values[column]!
      values[column] = swap
    }
    const pivotValue = values[column]![column]!
    values[column] = values[column]!.map((value) => value / pivotValue)
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue
      const factor = values[row]![column]!
      values[row] = values[row]!.map((value, index) => value - factor * values[column]![index]!)
    }
  }

  return values.map((row) => row.slice(size))
}

export function formatMatrix(matrix: Matrix): string {
  return matrix.map((row) => row.map((value) => Number(value.toPrecision(10)).toString()).join("\t")).join("\n")
}
