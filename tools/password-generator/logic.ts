import { randomInt } from "crypto"

export interface PasswordOptions {
  length: number
  lowercase: boolean
  uppercase: boolean
  digits: boolean
  symbols: boolean
  avoidAmbiguous: boolean
}

const SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
}

const AMBIGUOUS = new Set("Il1O0o`'\"|")

function pool(options: PasswordOptions): string {
  let value = ""
  if (options.lowercase) value += SETS.lowercase
  if (options.uppercase) value += SETS.uppercase
  if (options.digits) value += SETS.digits
  if (options.symbols) value += SETS.symbols
  if (options.avoidAmbiguous) value = [...value].filter((char) => !AMBIGUOUS.has(char)).join("")
  return value
}

export function generatePassword(options: PasswordOptions): string {
  const characters = pool(options)
  if (!characters) return ""

  const length = Math.max(4, Math.min(128, Math.floor(options.length)))
  const required: string[] = []
  if (options.lowercase) required.push(pick(SETS.lowercase, options.avoidAmbiguous))
  if (options.uppercase) required.push(pick(SETS.uppercase, options.avoidAmbiguous))
  if (options.digits) required.push(pick(SETS.digits, options.avoidAmbiguous))
  if (options.symbols) required.push(pick(SETS.symbols, options.avoidAmbiguous))

  const result = required.slice(0, length)
  while (result.length < length) result.push(characters[randomInt(characters.length)]!)
  return shuffle(result).join("")
}

function pick(set: string, avoidAmbiguous: boolean): string {
  const characters = avoidAmbiguous ? [...set].filter((char) => !AMBIGUOUS.has(char)) : [...set]
  return characters[randomInt(characters.length)]!
}

function shuffle(values: string[]): string[] {
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    ;[values[i], values[j]] = [values[j]!, values[i]!]
  }
  return values
}

export interface PasswordStrength {
  bits: number
  label: "weak" | "fair" | "strong" | "excellent"
  percent: number
}

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { bits: 0, label: "weak", percent: 0 }
  let alphabet = 0
  if (/[a-z]/.test(password)) alphabet += 26
  if (/[A-Z]/.test(password)) alphabet += 26
  if (/[0-9]/.test(password)) alphabet += 10
  if (/[^A-Za-z0-9]/.test(password)) alphabet += 30
  const bits = Math.round(password.length * Math.log2(Math.max(2, alphabet)))
  const label = bits < 40 ? "weak" : bits < 64 ? "fair" : bits < 96 ? "strong" : "excellent"
  return { bits, label, percent: Math.min(100, Math.round((bits / 128) * 100)) }
}
