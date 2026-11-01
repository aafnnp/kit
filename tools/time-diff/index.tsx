import { signal, Text, View } from "nsh"
import { Card, CardHeader, CopyButton, ErrorBanner, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { calculateTimeDifference } from "./logic"

export default function TimeDiff() {
  const start = signal("2025-01-01T00:00:00Z")
  const end = signal("2025-01-02T03:04:05Z")
  const result = () => {
    const calculation = calculateTimeDifference(start(), end())
    if (!calculation.ok) return { error: calculation.error, duration: "", totalMilliseconds: "", direction: "" }
    const value = calculation.difference
    return {
      error: "",
      duration: `${value.days}d ${value.hours}h ${value.minutes}m ${value.seconds}s ${value.milliseconds}ms`,
      totalMilliseconds: String(value.totalMilliseconds),
      direction: value.direction,
    }
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("时间差计算", "Time difference")}
          description={L("输入两个日期，计算精确经过时长。", "Calculate the exact elapsed duration between two dates.")}
        />
        <View class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <View class="gap-1">
            <Text class="text-xs font-medium text-muted-foreground">{L("开始", "Start")}</Text>
            <TextInput value={start()} onChange={(value) => start.set(value)} mono testID="time-diff-start" placeholder="2025-01-01T00:00:00Z" />
          </View>
          <View class="gap-1">
            <Text class="text-xs font-medium text-muted-foreground">{L("结束", "End")}</Text>
            <TextInput value={end()} onChange={(value) => end.set(value)} mono testID="time-diff-end" placeholder="2025-01-02T00:00:00Z" />
          </View>
        </View>
      </Card>
      <Card testID="time-diff-result">
        <CardHeader
          title={L("经过时长", "Elapsed time")}
          right={!result().error ? <CopyButton value={() => result().duration} testID="time-diff-copy" /> : undefined}
        />
        {!result().error ? (
          <View class="gap-2">
            <Text class="font-mono text-lg font-semibold text-foreground">{result().duration}</Text>
            <Text class="text-xs text-muted-foreground">
              {L("总毫秒数", "Total milliseconds")}: {result().totalMilliseconds} ·
              {" "}{result().direction === "forward" ? L("正向", "forward") : L("反向", "backward")}
            </Text>
          </View>
        ) : <ErrorBanner message={result().error} />}
      </Card>
    </View>
  )
}
