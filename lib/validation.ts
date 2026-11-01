export const MAX_INPUT_LENGTH = 8 * 1024 * 1024

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export function guardInput(value: string, label = "Input"): void {
  if (value.length > MAX_INPUT_LENGTH) throw new Error(`${label} exceeds the 8 MiB processing limit.`)
}

export function integerInRange(value: number, minimum: number, maximum: number, label: string): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be a whole number from ${minimum} to ${maximum}.`)
  }
  return value
}

export function integerFromText(value: string, minimum: number, maximum: number, label: string): number {
  const text = value.trim()
  if (!/^[+-]?\d+$/.test(text)) throw new Error(`${label} must be a whole number from ${minimum} to ${maximum}.`)
  return integerInRange(Number(text), minimum, maximum, label)
}
