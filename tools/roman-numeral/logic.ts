const ROMAN_VALUES = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
] as const

export function numberToRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) {
    throw new Error("Enter a whole number from 1 to 3999.")
  }

  let remaining = value
  let result = ""
  for (const [amount, symbol] of ROMAN_VALUES) {
    while (remaining >= amount) {
      result += symbol
      remaining -= amount
    }
  }
  return result
}

export function romanToNumber(input: string): number {
  const roman = input.trim().toUpperCase()
  if (!roman || !/^[IVXLCDM]+$/.test(roman)) {
    throw new Error("Enter a Roman numeral using I, V, X, L, C, D or M.")
  }

  let value = 0
  for (let index = 0; index < roman.length; index += 1) {
    const current = ROMAN_VALUES.find(([, symbol]) => symbol === roman[index])?.[0]
    const next = ROMAN_VALUES.find(([, symbol]) => symbol === roman[index + 1])?.[0] ?? 0
    if (current === undefined) throw new Error("Invalid Roman numeral.")
    value += current < next ? -current : current
  }

  if (value < 1 || value > 3999 || numberToRoman(value) !== roman) {
    throw new Error("That is not a valid canonical Roman numeral.")
  }
  return value
}
