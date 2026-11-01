import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, ErrorBanner, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { formatCronDate, nextCronRuns } from "./logic"

export default function CronParser() {
  const expression = signal("*/15 * * * *")
  const count = signal("5")
  const output = signal<string[]>([])
  const error = signal("")

  const calculate = () => {
    try {
      output.set(nextCronRuns(expression(), new Date(), Number(count())).map(formatCronDate))
      error.set("")
    } catch (failure) {
      output.set([])
      error.set(failure instanceof Error ? failure.message : String(failure))
    }
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("Cron 表达式解析", "Cron expression parser")}
          description={L("支持标准五字段数字语法；结果按设备本地时区计算。", "Supports standard five-field numeric syntax; results use the device's local time zone.")}
        />
        <View class="flex-row flex-wrap items-end gap-3">
          <View class="min-w-52 flex-1 gap-1">
            <Text class="text-xs font-medium text-muted-foreground">{L("分 时 日 月 周", "Minute Hour Day Month Weekday")}</Text>
            <TextInput value={expression()} onChange={(value) => expression.set(value)} mono testID="cron-expression" placeholder="*/15 * * * *" />
          </View>
          <View class="w-24 gap-1">
            <Text class="text-xs font-medium text-muted-foreground">{L("次数", "Count")}</Text>
            <TextInput value={count()} onChange={(value) => count.set(value)} mono testID="cron-count" />
          </View>
          <Button tone="primary" onPress={calculate} testID="cron-calculate">{L("计算", "Calculate")}</Button>
        </View>
        <Text class="text-[11px] text-muted-foreground">{L("支持 *、列表、范围与步长；星期日使用 0 或 7。", "Supports *, lists, ranges and steps; Sunday is 0 or 7.")}</Text>
        {error() ? <ErrorBanner message={error()} /> : null}
      </Card>
      {output().length ? (
        <Card>
          <CardHeader title={L("下次运行时间", "Next occurrences")} description={L("最多搜索未来一年。", "Searches up to one year ahead.")} />
          <View class="gap-1">
            {output().map((date, index) => (
              <Text class="rounded-md bg-muted/30 px-3 py-2 font-mono text-xs text-foreground" testID={index === 0 ? "cron-next-run" : undefined}>
                {date}
              </Text>
            ))}
          </View>
        </Card>
      ) : null}
    </View>
  )
}
