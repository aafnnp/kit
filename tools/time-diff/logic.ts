export interface TimeDifference {
  start: number
  end: number
  direction: "forward" | "backward"
  totalMilliseconds: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}

/** Accepts ISO dates, Unix seconds (10 digits) and Unix milliseconds (13 digits). */
export function parseInstant(input: string): number {
  const text = input.trim()
  if (!text) return Number.NaN
  if (/^-?\d{10}$/.test(text)) return Number(text) * 1000
  if (/^-?\d{13}$/.test(text)) return Number(text)
  return Date.parse(text)
}

export function calculateTimeDifference(startInput: string, endInput: string):
  | { ok: true; difference: TimeDifference }
  | { ok: false; error: string } {
  const start = parseInstant(startInput)
  const end = parseInstant(endInput)
  if (!startInput.trim() || !endInput.trim() || !Number.isFinite(start) || !Number.isFinite(end)) {
    return { ok: false, error: "Enter two valid dates or timestamps." }
  }

  let remaining = Math.abs(end - start)
  const totalMilliseconds = remaining
  const days = Math.floor(remaining / 86_400_000)
  remaining %= 86_400_000
  const hours = Math.floor(remaining / 3_600_000)
  remaining %= 3_600_000
  const minutes = Math.floor(remaining / 60_000)
  remaining %= 60_000
  const seconds = Math.floor(remaining / 1_000)
  const milliseconds = remaining % 1_000

  return {
    ok: true,
    difference: {
      start,
      end,
      direction: end >= start ? "forward" : "backward",
      totalMilliseconds,
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
    },
  }
}
