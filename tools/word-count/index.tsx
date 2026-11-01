import { computed, signal, Text, View } from "nsh"
import { Card, CardHeader, Stat, TextInput } from "../../components/ui"
import { L, n } from "../../lib/locale"
import { textStats, topWords } from "./logic"

const SAMPLE = `Kit is a local-first toolbox for everyday workflows.

Everything runs on your device: no uploads, no accounts, no tracking.
打开工具箱，选择你需要的小工具，然后开始工作。`

export default function WordCount() {
  const text = signal(SAMPLE)
  const stats = computed(() => textStats(text()))
  const frequent = computed(() => topWords(text(), 5))

  return (
    <View class="gap-4">
      <Card>
        <CardHeader title={L("文本", "Text")} description={L("输入或粘贴文本，统计会实时更新。", "Type or paste text; the counts update live.")} />
        <TextInput value={text()} onChange={(value) => text.set(value)} multiline height={260} testID="word-input" />
      </Card>

      <View class="flex-row flex-wrap gap-2">
        <Stat label={L("字符", "Characters")} value={n(stats().characters)} testID="stat-characters" />
        <Stat label={L("不含空格", "No spaces")} value={n(stats().charactersNoSpaces)} />
        <Stat label={L("词 / 字", "Words")} value={n(stats().words)} testID="stat-words" />
        <Stat label={L("行", "Lines")} value={n(stats().lines)} />
        <Stat label={L("句子", "Sentences")} value={n(stats().sentences)} />
        <Stat label={L("段落", "Paragraphs")} value={n(stats().paragraphs)} />
        <Stat label={L("阅读时间", "Reading time")} value={L(`${stats().readingMinutes} 分钟`, `${stats().readingMinutes} min`)} />
      </View>

      <Card>
        <CardHeader title={L("高频词", "Frequent words")} description={L("忽略常见停用词，统计前 5 个词。", "Top five words, common stop words excluded.")} />
        {frequent().length ? (
          <View class="gap-2">
            {frequent().map((item) => (
              <View class="flex-row items-center gap-3">
                <Text class="w-32 font-mono text-xs text-foreground">{item.word}</Text>
                <View class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <View class="h-2 rounded-full bg-primary" style={{ width: `${Math.max(8, (item.count / frequent()[0]!.count) * 100)}%` }} />
                </View>
                <Text class="w-8 text-right text-xs text-muted-foreground">{item.count}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text class="text-xs text-muted-foreground">{L("文本中没有可统计的拉丁词。", "No Latin words to count.")}</Text>
        )}
      </Card>
    </View>
  )
}
