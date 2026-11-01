import { computed, signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, Field, OutputBox, TextInput, Toggle } from "../../components/ui"
import { L } from "../../lib/locale"
import { generateLorem } from "./logic"

export default function LoremIpsum() {
  const paragraphs = signal(3)
  const sentences = signal(4)
  const startWithLorem = signal(true)
  const seed = signal(20261030)

  const output = computed(() =>
    generateLorem({
      paragraphs: paragraphs(),
      sentencesPerParagraph: sentences(),
      startWithLorem: startWithLorem(),
      seed: seed(),
    }),
  )

  const setNumber = (setter: (value: number) => void, min: number, max: number) => (value: string) => {
    const parsed = Number(value.replace(/[^0-9]/g, ""))
    if (!Number.isFinite(parsed)) return
    setter(Math.max(min, Math.min(max, parsed)))
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader title={L("生成选项", "Options")} description={L("用于设计稿与排版的占位文本。", "Placeholder text for mockups and layouts.")} />
        <View class="flex-row flex-wrap items-end gap-3">
          <View class="w-28">
            <Field label={L("段落数", "Paragraphs")}>
              <TextInput value={String(paragraphs())} onChange={setNumber(paragraphs.set, 1, 20)} testID="lorem-paragraphs" />
            </Field>
          </View>
          <View class="w-28">
            <Field label={L("每段句子", "Sentences")}>
              <TextInput value={String(sentences())} onChange={setNumber(sentences.set, 1, 12)} testID="lorem-sentences" />
            </Field>
          </View>
          <Toggle label={L("以 Lorem ipsum 开头", "Start with Lorem ipsum")} checked={startWithLorem()} onChange={(value) => startWithLorem.set(value)} />
          <Button tone="primary" onPress={() => seed.set(seed() + 1)} testID="lorem-regenerate">
            {L("重新生成", "Regenerate")}
          </Button>
        </View>
      </Card>

      <Card>
        <CardHeader
          title={L("结果", "Result")}
          description={L(`${output().split(/\n\s*\n/).length} 段 · ${output().length} 个字符`, `${output().split(/\n\s*\n/).length} paragraphs · ${output().length} characters`)}
          right={<CopyButton value={() => output()} testID="lorem-copy" />}
        />
        <OutputBox value={output()} height={320} testID="lorem-output" />
      </Card>
    </View>
  )
}
