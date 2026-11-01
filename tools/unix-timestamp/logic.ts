export type TimeUnit = "seconds" | "milliseconds"

export interface DateParts {
  timestamp: number
  iso: string
  utc: string
  local: string
  relative: string
}

export function fromTimestamp(value: number, unit: TimeUnit = "seconds"): DateParts | null {
  const milliseconds = unit === "seconds" ? value * 1000 : value
  const date = new Date(milliseconds)
  if (Number.isNaN(date.getTime())) return null
  return {
    timestamp: Math.floor(milliseconds / 1000),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toString(),
    relative: relativeTime(date),
  }
}

export function parseDate(input: string): DateParts | null {
  const value = input.trim()
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return {
    timestamp: Math.floor(date.getTime() / 1000),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toString(),
    relative: relativeTime(date),
  }
}

export function relativeTime(date: Date, now = Date.now()): string {
  const delta = Math.round((date.getTime() - now) / 1000)
  const abs = Math.abs(delta)
  const unit = abs < 60 ? "second" : abs < 3600 ? "minute" : abs < 86400 ? "hour" : abs < 2592000 ? "day" : abs < 31536000 ? "month" : "year"
  const amount = abs < 60 ? abs : abs < 3600 ? Math.round(abs / 60) : abs < 86400 ? Math.round(abs / 3600) : abs < 2592000 ? Math.round(abs / 86400) : abs < 31536000 ? Math.round(abs / 2592000) : Math.round(abs / 31536000)
  if (amount === 0) return "just now"
  return delta < 0 ? `${amount} ${unit}${amount === 1 ? "" : "s"} ago` : `in ${amount} ${unit}${amount === 1 ? "" : "s"}`
}

export function nowParts(now = Date.now()): DateParts {
  const date = new Date(now)
  return {
    timestamp: Math.floor(now / 1000),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toString(),
    relative: "now",
  }
}
