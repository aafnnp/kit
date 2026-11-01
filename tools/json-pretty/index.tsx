import { signal, Text, View } from "nsh"
import { Badge, Button, Card, CardHeader, CopyButton, ErrorBanner, Field, OutputBox, Segmented, TextInput, Toggle } from "../../components/ui"
import { L } from "../../lib/locale"
import { formatJson, isValidJson, minifyJson } from "./logic"

const SAMPLE = `{
  "name": "Kit",
  "version": "0.6.0",
  "platforms": ["macos", "windows", "linux", "web"],
  "local": true,
  "tools": 15
}`

export default function JsonPretty() {
  const input = signal(SAMPLE)
  const indent = signal<"2" | "4" | "tab">("2")
  const sortKeys = signal(false)
  const output = signal("")
  const error = signal("")

  const run = (minify: boolean) => {
    const value = minify
      ? minifyJson(input(), sortKeys())
      : formatJson(input(), indent() === "tab" ? "\t" : Number(indent()), sortKeys())
    if (value.ok) {
      output.set(value.output)
      error.set("")
    } else {
      output.set("")
      error.set(value.error)
    }
  }

  return (
    <View class="gap-4">
      <View class="flex-row flex-wrap items-center justify-between gap-2">
        <View class="flex-row flex-wrap items-center gap-2">
          <Badge tone={isValidJson(input()) ? "up" : "warn"}>
            {isValidJson(input()) ? L("JSON 有效", "Valid JSON") : L("等待有效 JSON", "Waiting for valid JSON")}
          </Badge>
          <Toggle label={L("按键排序", "Sort keys")} checked={sortKeys()} onChange={(value) => sortKeys.set(value)} />
        </View>
        <Segmented
          value={indent()}
          onChange={(value) => indent.set(value)}
          testID="json-indent"
          options={[
            { value: "2", label: "2" },
            { value: "4", label: "4" },
            { value: "tab", label: "Tab" },
          ]}
        />
      </View>

      <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={L("输入", "Input")} description={L("粘贴 JSON，支持格式化、压缩与排序。", "Paste JSON to format, minify or sort it.")} />
          <TextInput
            value={input()}
            onChange={(value) => input.set(value)}
            multiline
            height={320}
            mono
            testID="json-input"
            placeholder={L("在这里粘贴 JSON…", "Paste JSON here…")}
          />
          <View class="flex-row flex-wrap gap-2">
            <Button tone="primary" onPress={() => run(false)} testID="json-format">
              {L("格式化", "Format")}
            </Button>
            <Button onPress={() => run(true)} testID="json-minify">
              {L("压缩", "Minify")}
            </Button>
            <Button tone="ghost" onPress={() => { input.set(SAMPLE); output.set(""); error.set("") }}>
              {L("示例", "Sample")}
            </Button>
            <Button tone="ghost" onPress={() => { input.set(""); output.set(""); error.set("") }}>
              {L("清空", "Clear")}
            </Button>
          </View>
        </Card>

        <Card>
          <CardHeader
            title={L("结果", "Result")}
            description={L("结果可选中复制，也可直接复制全部。", "Select the output or copy it all.")}
            right={<CopyButton value={() => output()} testID="json-copy" />}
          />
          {error() ? <ErrorBanner message={error()} /> : null}
          <OutputBox value={output()} height={320} testID="json-output" />
          <Text class="text-[11px] text-muted-foreground">
            {output() ? L(`共 ${[...output()].length} 个字符`, `${[...output()].length} characters`) : L("尚无输出", "No output yet")}
          </Text>
        </Card>
      </View>
    </View>
  )
}
