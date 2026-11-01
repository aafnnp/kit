export interface ZonedTime {
  timeZone: string
  formatted: string
  offsetMinutes: number
  offsetLabel: string
}

interface ZoneRule {
  standardOffset: number
  daylight: "us" | "europe" | "sydney" | null
}

const ZONE_RULES: Record<string, ZoneRule> = {
  UTC: { standardOffset: 0, daylight: null },
  "America/Los_Angeles": { standardOffset: -480, daylight: "us" },
  "America/New_York": { standardOffset: -300, daylight: "us" },
  "Europe/London": { standardOffset: 0, daylight: "europe" },
  "Europe/Paris": { standardOffset: 60, daylight: "europe" },
  "Asia/Shanghai": { standardOffset: 480, daylight: null },
  "Asia/Tokyo": { standardOffset: 540, daylight: null },
  "Australia/Sydney": { standardOffset: 600, daylight: "sydney" },
}

function nthSunday(year: number, month: number, occurrence: number): number {
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay()
  return 1 + ((7 - firstDay) % 7) + (occurrence - 1) * 7
}

function lastSunday(year: number, month: number): number {
  const lastDay = new Date(Date.UTC(year, month + 1, 0))
  return lastDay.getUTCDate() - lastDay.getUTCDay()
}

function isDaylightTime(timestamp: number, year: number, zone: ZoneRule): boolean {
  if (!zone.daylight) return false

  if (zone.daylight === "us") {
    const start = Date.UTC(year, 2, nthSunday(year, 2, 2), 2 - zone.standardOffset / 60)
    const end = Date.UTC(year, 10, nthSunday(year, 10, 1), 1 - zone.standardOffset / 60)
    return timestamp >= start && timestamp < end
  }

  if (zone.daylight === "europe") {
    const start = Date.UTC(year, 2, lastSunday(year, 2), 1)
    const end = Date.UTC(year, 9, lastSunday(year, 9), 1)
    return timestamp >= start && timestamp < end
  }

  const start = Date.UTC(year, 9, nthSunday(year, 9, 1), 2 - zone.standardOffset / 60)
  const end = Date.UTC(year, 3, nthSunday(year, 3, 1), 3 - (zone.standardOffset + 60) / 60)
  return timestamp >= start || timestamp < end
}

function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "−" : "+"
  const absolute = Math.abs(offsetMinutes)
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0")
  const minutes = String(absolute % 60).padStart(2, "0")
  return `UTC${sign}${hours}:${minutes}`
}

function formatDate(timestamp: number, offsetMinutes: number): string {
  const local = new Date(timestamp + offsetMinutes * 60_000)
  const year = String(local.getUTCFullYear()).padStart(4, "0")
  const month = String(local.getUTCMonth() + 1).padStart(2, "0")
  const day = String(local.getUTCDate()).padStart(2, "0")
  const hour = String(local.getUTCHours()).padStart(2, "0")
  const minute = String(local.getUTCMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hour}:${minute}`
}

export function convertTimeZones(input: string, timeZones: string[]): ZonedTime[] {
  const timestamp = Date.parse(input)
  if (!input.trim() || !Number.isFinite(timestamp)) throw new Error("Enter a valid date and time.")
  if (!timeZones.length) return []

  const year = new Date(timestamp).getUTCFullYear()
  if (year < 2008 || year > 2035) throw new Error("Built-in time-zone rules support years 2008–2035.")
  return timeZones.map((timeZone) => {
    const zone = ZONE_RULES[timeZone]
    if (!zone) throw new Error(`Unsupported time zone: ${timeZone}`)
    const daylight = isDaylightTime(timestamp, year, zone)
    const offsetMinutes = zone.standardOffset + (daylight ? 60 : 0)
    return {
      timeZone,
      formatted: formatDate(timestamp, offsetMinutes),
      offsetMinutes,
      offsetLabel: formatOffset(offsetMinutes),
    }
  })
}
