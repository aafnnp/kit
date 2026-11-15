import { computed, signal, Scroll, Text, View } from "nsh"
import { Badge, Card, CardHeader, ErrorBanner, TextInput, Toggle } from "../../components/ui"
import { L } from "../../lib/locale"
import { persistDraft, restoreDraft } from "../../lib/drafts"
import { diffLines, type DiffResult } from "./logic"

const BEFORE = `Hello world
Kit is a toolbox
Local processing
No accounts`

const AFTER = `Hello world
Kit is a local-first toolbox
No accounts
Open source`

type Outcome = { ok: true; result: DiffResult } | { ok: false; error: string }

export default function DiffViewer() {
  const before = signal(BEFORE)
  const after = signal(AFTER)
  restoreDraft("diff-viewer:before", BEFORE, before)
  persistDraft("diff-viewer:before", before)
  restoreDraft("diff-viewer:after", AFTER, after)
  persistDraft("diff-viewer:after", after)
  const ignoreWhitespace = signal(false)
  const ignoreCase = signal(false)

  const outcome = computed<Outcome>(() => {
    try {
      return { ok: true, result: diffLines(before(), after(), { ignoreWhitespace: ignoreWhitespace(), ignoreCase: ignoreCase() }) }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
  const ok = computed(() => outcome().ok)
  const error = computed(() => {
    const current = outcome()
    return current.ok ? "" : current.error
  })
  const lines = computed(() => {
    const current = outcome()
    return current.ok ? current.result.lines : []
  })
  const added = computed(() => {
    const current = outcome()
    return current.ok ? current.result.added : 0
  })
  const removed = computed(() => {
    const current = outcome()
    return current.ok ? current.result.removed : 0
  })
  const unchanged = computed(() => {
    const current = outcome()
    return current.ok ? current.result.unchanged : 0
  })

  return (
    <View class="gap-4">
      <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={L("原始文本", "Before")} />
          <TextInput value={before()} onChange={(value) => before.set(value)} multiline height={200} mono testID="diff-before" />
        </Card>
        <Card>
          <CardHeader title={L("新文本", "After")} />
          <TextInput value={after()} onChange={(value) => after.set(value)} multiline height={200} mono testID="diff-after" />
        </Card>
      </View>

      <Card>
        <CardHeader
          title={L("差异", "Diff")}
          description={L("逐行 LCS 对比；绿色为新增，红色为删除。", "Line-by-line LCS diff. Green is added, red is removed.")}
          right={
            <View class="flex-row gap-1.5">
              <Badge tone="up">+{added()}</Badge>
              <Badge tone="down">-{removed()}</Badge>
              <Badge>{unchanged()}</Badge>
            </View>
          }
        />
        <View class="flex-row flex-wrap gap-2">
          <Toggle label={L("忽略空白", "Ignore whitespace")} checked={ignoreWhitespace()} onChange={(value) => ignoreWhitespace.set(value)} testID="diff-ignore-whitespace" />
          <Toggle label={L("忽略大小写", "Ignore case")} checked={ignoreCase()} onChange={(value) => ignoreCase.set(value)} testID="diff-ignore-case" />
        </View>
        {ok() ? (
          <View class="max-h-80 overflow-hidden rounded-(--radius) border border-border" testID="diff-output">
            <Scroll class="flex-1">
              <View class="p-2">
                {lines().map((line) => (
                  <View
                    class="flex-row gap-2 rounded px-2 py-0.5"
                    classList={{
                      "bg-up/10": line.kind === "add",
                      "bg-destructive/10": line.kind === "remove",
                      "bg-transparent": line.kind === "same",
                    }}
                  >
                    <Text class="w-8 text-right font-mono text-[10px] text-muted-foreground">{line.kind === "remove" ? line.oldLine : line.newLine}</Text>
                    <Text class="w-4 font-mono text-xs text-muted-foreground">{line.kind === "add" ? "+" : line.kind === "remove" ? "-" : " "}</Text>
                    <Text
                      class="flex-1 select-text font-mono text-xs"
                      classList={{
                        "text-up": line.kind === "add",
                        "text-destructive": line.kind === "remove",
                        "text-foreground": line.kind === "same",
                      }}
                    >
                      {line.value || " "}
                    </Text>
                  </View>
                ))}
              </View>
            </Scroll>
          </View>
        ) : (
          <ErrorBanner message={error()} />
        )}
      </Card>
    </View>
  )
}
