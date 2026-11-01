export type Root = { real: number; imaginary: number }

export type QuadraticResult =
  | { kind: "quadratic"; discriminant: number; roots: Root[] }
  | { kind: "linear"; roots: Root[] }
  | { kind: "identity" }
  | { kind: "inconsistent" }
  | { kind: "invalid"; error: string }

export function solveQuadratic(a: number, b: number, c: number): QuadraticResult {
  if (![a, b, c].every(Number.isFinite)) {
    return { kind: "invalid", error: "All coefficients must be finite numbers." }
  }
  if (a === 0) {
    if (b === 0) return c === 0 ? { kind: "identity" } : { kind: "inconsistent" }
    const root = -c / b
    return Number.isFinite(root)
      ? { kind: "linear", roots: [{ real: root, imaginary: 0 }] }
      : { kind: "invalid", error: "The result exceeds the numeric range." }
  }

  const discriminant = b * b - 4 * a * c
  if (!Number.isFinite(discriminant)) {
    return { kind: "invalid", error: "The discriminant exceeds the numeric range." }
  }
  if (discriminant === 0) {
    return { kind: "quadratic", discriminant, roots: [{ real: -b / (2 * a), imaginary: 0 }] }
  }
  if (discriminant < 0) {
    const real = -b / (2 * a)
    const imaginary = Math.sqrt(-discriminant) / (2 * a)
    return { kind: "quadratic", discriminant, roots: [{ real, imaginary }, { real, imaginary: -imaginary }] }
  }

  const squareRoot = Math.sqrt(discriminant)
  const q = -0.5 * (b + (b < 0 ? -squareRoot : squareRoot))
  const roots = q === 0
    ? [{ real: (-b + squareRoot) / (2 * a), imaginary: 0 }, { real: (-b - squareRoot) / (2 * a), imaginary: 0 }]
    : [{ real: q / a, imaginary: 0 }, { real: c / q, imaginary: 0 }]
  if (roots.some((root) => !Number.isFinite(root.real))) {
    return { kind: "invalid", error: "A root exceeds the numeric range." }
  }
  roots.sort((left, right) => left.real - right.real)
  return { kind: "quadratic", discriminant, roots }
}

export function formatRoot(root: Root): string {
  const real = Number(root.real.toPrecision(12)).toString()
  if (root.imaginary === 0) return real
  const imaginary = Number(Math.abs(root.imaginary).toPrecision(12)).toString()
  if (root.real === 0) return `${root.imaginary < 0 ? "-" : ""}${imaginary}i`
  return `${real} ${root.imaginary < 0 ? "−" : "+"} ${imaginary}i`
}
