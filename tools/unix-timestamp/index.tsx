import { cleanup, signal, Text, View } from "nsh"
import { Badge, Card, CardHeader, CopyButton, Field, Segmented, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { fromTimestamp, nowParts, parseDate, type DateParts, type TimeUnit } from "./logic"

export default function UnixTimestamp() {
  const now = signal(Date.now())
  const unit = signal<TimeUnit>("seconds")
  const timestampInput = signal(String(Math.floor(Date.now() / 1000)))
  const dateInput = signal(new Date().toISOString().slice(0, 19))

  const timer = setInterval(() => now.set(Date.now()), 1000)
  cleanup(() => clearInterval(timer))

  const current = () => nowParts(now())
  const fromStamp = (): DateParts | null => {
    const value = Number(timestampInput().trim())
    return Number.isFinite(value) ? fromTimestamp(value, unit()) : null
  }
  const fromDate = (): DateParts | null => parseDate(dateInput())

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("当前时间", "Now")}
          description={L("每秒刷新；点击时间戳可直接复制。", "Updates every second; press the timestamp to copy it.")}
          right={<Badge tone="up">live</Badge>}
        />
        <View class="flex-row flex-wrap items-end gap-4">
          <View class="gap-1">
            <Text class="text-[11px] uppercase tracking-wide text-muted-foreground">{L("Unix 秒", "Unix seconds")}</Text>
            <View class="flex-row items-center gap-2">
              <Text class="select-text font-mono text-2xl font-semibold text-foreground" testID="now-timestamp">{String(current().timestamp)}</Text>
              <CopyButton value={() => String(current().timestamp)} label="" />
            </View>
          </View>
          <View class="flex-1 gap-1">
            <Text class="text-[11px] uppercase tracking-wide text-muted-foreground">ISO 8601</Text>
            <Text class="select-text font-mono text-xs text-foreground">{current().iso}</Text>
            <Text class="text-[11px] text-muted-foreground">{current().local}</Text>
          </View>
        </View>
      </Card>

      <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={L("时间戳 → 日期", "Timestamp → date")} description={L("按秒或毫秒解析。", "Parsed as seconds or milliseconds.")} />
          <View class="flex-row flex-wrap items-end gap-3">
            <View class="flex-1">
              <Field label={L("时间戳", "Timestamp")}>
                <TextInput value={timestampInput()} onChange={(value) => timestampInput.set(value)} mono testID="timestamp-input" />
              </Field>
            </View>
            <Segmented
              value={unit()}
              onChange={(value) => unit.set(value)}
              testID="timestamp-unit"
              options={[
                { value: "seconds", label: "s" },
                { value: "milliseconds", label: "ms" },
              ]}
            />
          </View>
          {fromStamp() ? (
            <DateRows parts={fromStamp()!} />
          ) : (
            <Text class="text-xs text-destructive">{L("无效的时间戳", "Invalid timestamp")}</Text>
          )}
        </Card>

        <Card>
          <CardHeader title={L("日期 → 时间戳", "Date → timestamp")} description={L("接受 ISO 8601 或浏览器可解析的日期。", "Accepts ISO 8601 or dates the runtime can parse.")} />
          <Field label={L("日期", "Date")}>
            <TextInput value={dateInput()} onChange={(value) => dateInput.set(value)} mono testID="date-input" placeholder="2026-10-30T12:00:00Z" />
          </Field>
          {fromDate() ? (
            <DateRows parts={fromDate()!} />
          ) : (
            <Text class="text-xs text-destructive">{L("无效的日期", "Invalid date")}</Text>
          )}
        </Card>
      </View>
    </View>
  )
}

function DateRows(props: { parts: DateParts }) {
  return (
    <View class="gap-1">
      <Row label={L("秒", "Seconds")} value={String(props.parts.timestamp)} />
      <Row label={L("ISO", "ISO")} value={props.parts.iso} />
      <Row label={L("本地", "Local")} value={props.parts.local} />
      <Row label={L("相对", "Relative")} value={props.parts.relative} />
    </View>
  )
}

function Row(props: { label: string; value: string }) {
  return (
    <View class="flex-row items-start justify-between gap-3 rounded-md bg-muted/30 px-3 py-1.5">
      <Text class="w-16 text-[11px] text-muted-foreground">{props.label}</Text>
      <Text class="flex-1 select-text font-mono text-[11px] text-foreground">{props.value}</Text>
    </View>
  )
}
