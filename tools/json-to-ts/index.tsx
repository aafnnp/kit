import { signal, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, Field, OutputBox, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { createLiveRun } from "../../lib/tool-run"
import { persistDraft, restoreDraft } from "../../lib/drafts"
import { APP_VERSION } from "../../lib/version"
import { jsonToTs } from "./logic"

const SAMPLE = `{
  "id": 42,
  "name": "Kit",
  "openSource": true,
  "tags": ["tools", "local"],
  "author": { "name": "Ada", "email": "ada@example.com" },
  "releases": [{ "version": "${APP_VERSION}", "date": "2026-10-30" }]
}`

export default function JsonToTs() {
  const input = signal(SAMPLE)
  restoreDraft("json-to-ts", SAMPLE, input)
  persistDraft("json-to-ts", input)
  const rootName = signal("Kit")
  const compute = () => {
    const result = jsonToTs(input(), rootName() || "Root")
    if (!result.ok) throw new Error(result.error)
    return result.output
  }
  const outcome = createLiveRun({ initial: "", compute, inputs: [input, rootName], delay: 250 })

  return (
    <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title={L("JSON 样本", "JSON sample")} description={L("根据一个真实样本推断接口结构。", "Infer interfaces from a real sample.")} />
        <Field label={L("根类型名称", "Root type name")}>
          <TextInput value={rootName()} onChange={(value) => rootName.set(value)} placeholder="Root" testID="json-ts-root" />
        </Field>
        <TextInput
          value={input()}
          onChange={(value) => input.set(value)}
          multiline
          height={300}
          mono
          testID="json-ts-input"
          placeholder={L("粘贴 JSON…", "Paste JSON…")}
        />
        <View class="flex-row flex-wrap gap-2">
          <Button tone="primary" onPress={() => outcome.run(compute)} testID="json-ts-generate">
            {L("生成类型", "Generate types")}
          </Button>
          <Button tone="ghost" onPress={() => input.set(SAMPLE)}>
            {L("示例", "Sample")}
          </Button>
        </View>
      </Card>

      <Card>
        <CardHeader
          title={L("TypeScript", "TypeScript")}
          description={L("数组对象会合并字段，缺失字段标记为可选。", "Objects in arrays are merged and missing fields become optional.")}
          right={<CopyButton value={outcome.output} testID="json-ts-copy" />}
        />
        {outcome.error() ? <ErrorBanner message={outcome.error()} /> : null}
        <OutputBox value={outcome.output()} height={380} testID="json-ts-output" />
      </Card>
    </View>
  )
}
