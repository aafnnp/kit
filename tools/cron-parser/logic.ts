interface CronField {
  values: Set<number>
  all: boolean
}

interface ParsedCron {
  minute: CronField
  hour: CronField
  day: CronField
  month: CronField
  weekday: CronField
}

const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
}

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const WEEKDAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

function expandNames(token: string, names: string[], offset: number): string {
  return token.replace(/[A-Za-z]{3,}/g, (name) => {
    const index = names.indexOf(name.toUpperCase())
    if (index === -1) throw new Error(`Unknown cron name: ${name}`)
    return String(index + offset)
  })
}

const FIELD_RANGES = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
] as const
// Eight years so leap-day schedules such as `30 2 29 2 *` still resolve.
const MAX_SEARCH_YEARS = 8
const MAX_STEPS = 1_000_000

function parseField(token: string, minimum: number, maximum: number, sundayAlias = false): CronField {
  const values = new Set<number>()
  const parts = token.split(",")
  if (!token || parts.some((part) => !part)) throw new Error("Cron fields cannot be empty.")

  for (const part of parts) {
    const [rangeToken, stepToken, extra] = part.split("/")
    if (extra !== undefined) throw new Error(`Invalid cron field: ${part}`)
    const step = stepToken === undefined ? 1 : Number(stepToken)
    if (!Number.isInteger(step) || step < 1) throw new Error(`Invalid step in cron field: ${part}`)

    let start = minimum
    let end = maximum
    if (rangeToken !== "*") {
      const range = rangeToken!.split("-")
      if (range.length > 2) throw new Error(`Invalid range in cron field: ${part}`)
      start = Number(range[0])
      end = range.length === 2 ? Number(range[1]) : stepToken === undefined ? start : maximum
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < minimum ||
        end > maximum ||
        start > end
      ) {
        throw new Error(`Value is outside the allowed range in cron field: ${part}`)
      }
    }

    for (let value = start; value <= end; value += step) {
      values.add(sundayAlias && value === 7 ? 0 : value)
    }
  }

  const normalizedMaximum = sundayAlias ? maximum - 1 : maximum
  let all = true
  for (let value = minimum; value <= normalizedMaximum; value += 1) {
    if (!values.has(value)) {
      all = false
      break
    }
  }
  return { values, all }
}

function parseCron(expression: string): ParsedCron {
  const source = MACROS[expression.trim().toLowerCase()] ?? expression
  const parts = source.trim().split(/\s+/)
  if (parts.length !== 5) throw new Error("Use five fields: minute hour day-of-month month day-of-week.")
  const fields = parts.map((part, index) => {
    const [minimum, maximum] = FIELD_RANGES[index]!
    const token = index === 3
      ? expandNames(part, MONTH_NAMES, 1)
      : index === 4
        ? expandNames(part, WEEKDAY_NAMES, 0)
        : part
    return parseField(token === "?" ? "*" : token, minimum, maximum, index === 4)
  })
  return {
    minute: fields[0]!,
    hour: fields[1]!,
    day: fields[2]!,
    month: fields[3]!,
    weekday: fields[4]!,
  }
}

function matchesDay(date: Date, cron: ParsedCron): boolean {
  const dayOfMonthMatches = cron.day.values.has(date.getDate())
  const dayOfWeekMatches = cron.weekday.values.has(date.getDay())
  return cron.day.all
    ? dayOfWeekMatches
    : cron.weekday.all
      ? dayOfMonthMatches
      : dayOfMonthMatches || dayOfWeekMatches
}

export function nextCronRuns(expression: string, from: Date, count = 5): Date[] {
  if (!Number.isFinite(from.getTime())) throw new Error("Start time must be a valid date.")
  if (!Number.isInteger(count) || count < 1 || count > 10) throw new Error("Choose between 1 and 10 occurrences.")
  const cron = parseCron(expression)
  const candidate = new Date(from)
  candidate.setSeconds(0, 0)
  candidate.setMinutes(candidate.getMinutes() + 1)

  const limit = new Date(from)
  limit.setFullYear(limit.getFullYear() + MAX_SEARCH_YEARS)

  const results: Date[] = []
  for (let step = 0; step < MAX_STEPS && results.length < count && candidate <= limit; step += 1) {
    if (!cron.month.values.has(candidate.getMonth() + 1)) {
      candidate.setMonth(candidate.getMonth() + 1, 1)
      candidate.setHours(0, 0, 0, 0)
      continue
    }
    if (!matchesDay(candidate, cron)) {
      candidate.setDate(candidate.getDate() + 1)
      candidate.setHours(0, 0, 0, 0)
      continue
    }
    if (!cron.hour.values.has(candidate.getHours())) {
      candidate.setHours(candidate.getHours() + 1, 0, 0, 0)
      continue
    }
    if (!cron.minute.values.has(candidate.getMinutes())) {
      candidate.setMinutes(candidate.getMinutes() + 1, 0, 0)
      continue
    }
    results.push(new Date(candidate))
    candidate.setMinutes(candidate.getMinutes() + 1, 0, 0)
  }
  if (results.length !== count) throw new Error("No matching occurrence found within the next eight years.")
  return results
}

export function formatCronDate(date: Date): string {
  const twoDigits = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())} ${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`
}
