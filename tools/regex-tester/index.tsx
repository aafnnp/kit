import { computed, signal, Text, View } from "nsh"
import { Card, CardHeader, ErrorBanner, Field, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { flagOptions, runRegex } from "./logic"

const SAMPLE_TEXT = `Contact ada@example.com or grace@navy.mil.
Backup: linus@kernel.org`
const SAMPLE_PATTERN = "\\b([\\w.+-]+)@([\\w-]+)\\.(\\w{2,})\\b"

export default function RegexTester() {
  const pattern = signal(SAMPLE_PATTERN)
  const flags = signal("g")
  const text = signal(SAMPLE_TEXT)

  const outcome = computed(() => runRegex(pattern(), flags(), text()))
  const ok = computed(() => outcome().ok)
  const error = computed(() => {
    const current = outcome()
    return current.ok ? "" : current.error
  })
  const matches = computed(() => {
    const current = outcome()
    return current.ok ? current.result.matches : []
  })
  const segments = computed(() => {
    const current = outcome()
    return current.ok ? current.result.segments : []
  })

  const toggleFlag = (flag: string) => {
    flags.set(flags().includes(flag) ? flags().replace(flag, "") : `${flags()}${flag}`)
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader title={L("模式", "Pattern")} description={L("实时匹配，捕获组与命名组会列在下方。", "Matches live; capture and named groups are listed below.")} />
        <View class="flex-row items-center gap-2">
          <Text class="font-mono text-sm text-muted-foreground">/</Text>
          <View class="flex-1">
            <TextInput value={pattern()} onChange={(value) => pattern.set(value)} mono testID="regex-pattern" placeholder="pattern" />
          </View>
          <Text class="font-mono text-sm text-muted-foreground">/{flags()}</Text>
        </View>
        <View class="flex-row flex-wrap gap-1.5">
          {flagOptions.map((option) => (
            <View
              role="button"
              testID={`regex-flag-${option.flag}`}
              onPress={() => toggleFlag(option.flag)}
              class="h-7 flex-row items-center gap-1 rounded-full border px-2.5 active:opacity-70"
              classList={{
                "border-primary bg-primary": flags().includes(option.flag),
                "border-border bg-background": !flags().includes(option.flag),
              }}
            >
              <Text class="font-mono text-[11px]" classList={{ "text-primary-foreground": flags().includes(option.flag), "text-muted-foreground": !flags().includes(option.flag) }}>
                {option.flag}
              </Text>
              <Text class="text-[10px]" classList={{ "text-primary-foreground": flags().includes(option.flag), "text-muted-foreground": !flags().includes(option.flag) }}>
                {L(option.zh, option.en)}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <CardHeader title={L("测试文本", "Test text")} />
        <TextInput value={text()} onChange={(value) => text.set(value)} multiline height={170} mono testID="regex-text" />
      </Card>

      {ok() ? (
        <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title={L("高亮预览", "Highlighted")} description={L(`${matches().length} 个匹配`, `${matches().length} matches`)} />
            <View class="min-h-28 rounded-(--radius) border border-border bg-muted/30 p-3" testID="regex-preview">
              <Text class="select-text font-mono text-xs leading-5 text-foreground">
                {segments().map((segment) =>
                  segment.match ? (
                    <Text class="rounded bg-primary/20 font-mono text-xs text-primary">{segment.text}</Text>
                  ) : (
                    <Text class="font-mono text-xs text-foreground">{segment.text}</Text>
                  ),
                )}
              </Text>
            </View>
          </Card>

          <Card>
            <CardHeader title={L("匹配详情", "Matches")} description={L("显示索引与捕获组。", "Index and capture groups.")} />
            <View class="gap-1">
              {matches().slice(0, 50).map((match) => (
                <View class="rounded-md bg-muted/30 px-3 py-2">
                  <View class="flex-row items-center justify-between gap-2">
                    <Text class="font-mono text-xs text-foreground">{match.value || "∅"}</Text>
                    <Text class="text-[10px] text-muted-foreground">@{match.index}</Text>
                  </View>
                  {match.groups.length ? (
                    <Text class="mt-1 select-text font-mono text-[10px] text-muted-foreground">
                      {match.groups.map((group, index) => `${index + 1}: ${group ?? "undefined"}`).join("  ")}
                    </Text>
                  ) : null}
                </View>
              ))}
              {!matches().length ? <Text class="text-xs text-muted-foreground">{L("没有匹配。", "No matches.")}</Text> : null}
            </View>
          </Card>
        </View>
      ) : (
        <ErrorBanner message={error()} />
      )}
    </View>
  )
}
