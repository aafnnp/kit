import { randomUUID } from "crypto"
import { integerInRange } from "../../lib/validation"

export interface UuidOptions {
  count: number
  uppercase: boolean
  braces: boolean
}

export function generateUuids(options: UuidOptions): string[] {
  const count = integerInRange(options.count, 1, 100, "Count")
  const result: string[] = []
  for (let i = 0; i < count; i += 1) {
    let uuid: string = randomUUID()
    if (options.uppercase) uuid = uuid.toUpperCase()
    if (options.braces) uuid = `{${uuid}}`
    result.push(uuid)
  }
  return result
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.replace(/[{}]/g, ""))
}
