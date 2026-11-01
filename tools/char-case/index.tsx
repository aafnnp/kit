import { computed, signal, Text, View } from "nsh"
import { Card, CardHeader, CopyButton, OutputBox, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { caseOptions, convertCase, type CaseKind } from "./logic"

const SAMPLE = "kit local toolbox"

export default function CharCase() {
  const input = signal(SAMPLE)
  const kind = signal<CaseKind>("camel")
  const output = computed(() => convertCase(input(), kind()))

  return (
    <View class="gap-4">
      <Card>
        <CardHeader title={L("输入", "Input")} description={L("选择一种格式，结果会实时生成。", "Pick a format; the result updates live.")} />
        <TextInput value={input()} onChange={(value) => input.set(value)} multiline height={160} testID="case-input" />
        <View class="flex-row flex-wrap gap-2">
          {caseOptions.map((option) => (
            <View
              role="button"
              testID={`case-${option.kind}`}
              onPress={() => kind.set(option.kind)}
              class="h-8 flex-row items-center rounded-full border px-3 active:opacity-70"
              classList={{
                "border-primary bg-primary": kind() === option.kind,
                "border-border bg-background hover:bg-muted": kind() !== option.kind,
              }}
            >
              <Text
                class="text-xs font-medium"
                classList={{ "text-primary-foreground": kind() === option.kind, "text-muted-foreground": kind() !== option.kind }}
              >
                {L(option.zh, option.en)}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <CardHeader title={L("结果", "Result")} right={<CopyButton value={() => output()} testID="case-copy" />} />
        <OutputBox value={output()} height={200} testID="case-output" />
      </Card>
    </View>
  )
}
