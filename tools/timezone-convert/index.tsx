import { signal, Text, View } from "nsh"
import { Card, CardHeader, CopyButton, ErrorBanner, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { convertTimeZones } from "./logic"

const ZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
]

export default function TimezoneConvert() {
  const input = signal("2025-01-01T12:00:00Z")
  const error = signal("")
  const times = () => {
    try {
      error.set("")
      return convertTimeZones(input(), ZONES)
    } catch (failure) {
      error.set(failure instanceof Error ? failure.message : String(failure))
      return []
    }
  }
  const rows = () => times()
  const allTimes = () => rows().map((row) => `${row.timeZone}: ${row.formatted} ${row.offsetLabel}`).join("\n")

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("时区转换", "Time zone converter")}
          description={L("输入一个 ISO 日期时间，同时查看常用城市的当地时间。", "Enter an ISO date and time to see the local time in common cities.")}
        />
        <TextInput value={input()} onChange={(value) => input.set(value)} mono testID="timezone-input" placeholder="2025-01-01T12:00:00Z" />
        {error() ? <ErrorBanner message={error()} /> : null}
      </Card>
      <Card>
        <CardHeader
          title={L("世界时钟", "World clock")}
          description={L("支持常用时区（2008–2035）；会根据日期应用夏令时规则。", "Common zones are supported for 2008–2035, with daylight-saving rules applied by date.")}
          right={<CopyButton value={allTimes} testID="timezone-copy" />}
        />
        <View class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows().map((row) => (
            <View class="flex-row items-center justify-between gap-3 rounded-md bg-muted/30 px-3 py-2">
              <View class="min-w-0 flex-1 gap-0.5">
                <Text class="truncate text-xs font-medium text-foreground">{row.timeZone}</Text>
                <Text class="font-mono text-xs text-muted-foreground">{row.formatted}</Text>
              </View>
              <Text class="shrink-0 font-mono text-xs text-primary">{row.offsetLabel}</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  )
}
