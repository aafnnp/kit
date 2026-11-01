import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, Field, OutputBox, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { jsonToTs } from "./logic"

const SAMPLE = `{
  "id": 42,
  "name": "Kit",
  "openSource": true,
  "tags": ["tools", "local"],
  "author": { "name": "Ada", "email": "ada@example.com" },
  "releases": [{ "version": "0.6.0", "date": "2026-10-30" }]
}`

export default function JsonToTs() {
  const input = signal(SAMPLE)
  const rootName = signal("Kit")
  const output = signal("")
  const error = signal("")

  const generate = () => {
    const result = jsonToTs(input(), rootName() || "Root")
    if (result.ok) {
      output.set(result.output)
      error.set("")
    } else {
      output.set("")
      error.set(result.error)
    }
  }

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
          <Button tone="primary" onPress={generate} testID="json-ts-generate">
            {L("生成类型", "Generate types")}
          </Button>
          <Button tone="ghost" onPress={() => { input.set(SAMPLE); output.set(""); error.set("") }}>
            {L("示例", "Sample")}
          </Button>
        </View>
      </Card>

      <Card>
        <CardHeader
          title={L("TypeScript", "TypeScript")}
          description={L("数组对象会合并字段，缺失字段标记为可选。", "Objects in arrays are merged and missing fields become optional.")}
          right={<CopyButton value={() => output()} testID="json-ts-copy" />}
        />
        {error() ? <ErrorBanner message={error()} /> : null}
        <OutputBox value={output()} height={380} testID="json-ts-output" />
      </Card>
    </View>
  )
}
