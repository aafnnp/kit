import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { compareJson, formatJsonValue, type JsonDiffResult } from "./logic"

const LEFT_SAMPLE = '{\n  "name": "Kit",\n  "version": 1,\n  "features": ["json", "text"]\n}'
const RIGHT_SAMPLE = '{\n  "name": "Kit",\n  "version": 2,\n  "features": ["json", "text", "encoding"]\n}'

export default function JsonDiff() {
  const left = signal(LEFT_SAMPLE)
  const right = signal(RIGHT_SAMPLE)
  const result = signal<JsonDiffResult | null>(null)
  const error = signal("")

  const compare = () => {
    try {
      result.set(compareJson(left(), right()))
      error.set("")
    } catch (failure) {
      result.set(null)
      error.set(failure instanceof Error ? failure.message : String(failure))
    }
  }

  const output = () => (result()?.differences ?? []).map((difference) => {
    const oldValue = difference.kind === "added" ? "" : `  ${L("原值", "before")}: ${formatJsonValue(difference.before)}`
    const newValue = difference.kind === "removed" ? "" : `  ${L("新值", "after")}: ${formatJsonValue(difference.after)}`
    return `${difference.kind.toUpperCase()} ${difference.path}\n${oldValue}${oldValue && newValue ? "\n" : ""}${newValue}`
  }).join("\n\n")

  return (
    <View class="gap-4">
      <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={L("原始 JSON", "Original JSON")} />
          <TextInput value={left()} onChange={(value) => left.set(value)} multiline height={260} mono testID="json-diff-left" />
        </Card>
        <Card>
          <CardHeader title={L("对比 JSON", "Compare JSON")} />
          <TextInput value={right()} onChange={(value) => right.set(value)} multiline height={260} mono testID="json-diff-right" />
        </Card>
      </View>
      <View class="flex-row flex-wrap gap-2">
        <Button tone="primary" onPress={compare} testID="json-diff-compare">{L("比较", "Compare")}</Button>
        <Button tone="ghost" onPress={() => { left.set(LEFT_SAMPLE); right.set(RIGHT_SAMPLE); result.set(null); error.set("") }}>
          {L("重置示例", "Reset sample")}
        </Button>
      </View>
      {error() ? <ErrorBanner message={error()} /> : null}
      {result() ? (
        <Card testID="json-diff-result">
          <CardHeader
            title={L("差异", "Differences")}
            description={`${L("新增", "Added")} ${result()!.added} · ${L("删除", "Removed")} ${result()!.removed} · ${L("修改", "Changed")} ${result()!.changed}`}
            right={<CopyButton value={output} testID="json-diff-copy" />}
          />
          {result()!.differences.length ? (
            <Text class="select-text font-mono text-xs text-foreground" testID="json-diff-output">{output()}</Text>
          ) : <Text class="text-sm text-muted-foreground">{L("两个 JSON 完全相同。", "The JSON values are identical.")}</Text>}
        </Card>
      ) : null}
    </View>
  )
}
