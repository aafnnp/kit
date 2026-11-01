import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, OutputBox, Segmented, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { decodeUrl, encodeUrl, parseQuery, type UrlMode } from "./logic"

const SAMPLE = "https://example.com/search?q=kit tools&lang=zh-CN&page=2"

export default function UrlEncode() {
  const input = signal(SAMPLE)
  const mode = signal<"encode" | "decode">("encode")
  const scope = signal<UrlMode>("component")
  const output = signal("")
  const error = signal("")

  const convert = (next = mode()) => {
    try {
      output.set(next === "encode" ? encodeUrl(input(), scope()) : decodeUrl(input(), scope()))
      error.set("")
    } catch (failure) {
      output.set("")
      error.set(failure instanceof Error ? failure.message : String(failure))
    }
  }

  const query = () => {
    try {
      return parseQuery(input())
    } catch {
      return []
    }
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader title={L("URL 编解码", "URL encoder / decoder")} description={L("组件模式编码 ?&= 等保留字符；完整 URL 模式保留 URL 结构。", "Component mode encodes reserved characters. Full-URL mode keeps the URL structure.")} />
        <View class="flex-row flex-wrap items-center gap-2">
          <Segmented
            value={mode()}
            onChange={(value) => { mode.set(value); convert(value) }}
            testID="url-mode"
            options={[
              { value: "encode", label: L("编码", "Encode") },
              { value: "decode", label: L("解码", "Decode") },
            ]}
          />
          <Segmented
            value={scope()}
            onChange={(value) => scope.set(value)}
            testID="url-scope"
            options={[
              { value: "component", label: L("组件", "Component") },
              { value: "full", label: L("完整 URL", "Full URL") },
            ]}
          />
        </View>
      </Card>

      <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={L("输入", "Input")} />
          <TextInput value={input()} onChange={(value) => input.set(value)} multiline height={180} mono testID="url-input" />
        </Card>
        <Card>
          <CardHeader title={L("输出", "Output")} right={<CopyButton value={() => output()} testID="url-copy" />} />
          {error() ? <ErrorBanner message={error()} /> : null}
          <OutputBox value={output()} height={180} testID="url-output" />
        </Card>
      </View>

      {query().length ? (
        <Card>
          <CardHeader title={L("查询参数", "Query parameters")} description={L("自动解析输入中的查询字符串。", "Parsed from the input's query string.")} />
          <View class="gap-1">
            {query().map((pair) => (
              <View class="flex-row items-center gap-3 rounded-md bg-muted/30 px-3 py-2">
                <Text class="w-32 font-mono text-xs text-muted-foreground">{pair.key}</Text>
                <Text class="flex-1 select-text font-mono text-xs text-foreground">{pair.value}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <View class="flex-row flex-wrap gap-2">
        <Button tone="primary" onPress={() => convert()} testID="url-convert">
          {L("转换", "Convert")}
        </Button>
        <Button tone="ghost" onPress={() => { input.set(SAMPLE); output.set(""); error.set("") }}>
          {L("示例", "Sample")}
        </Button>
      </View>
    </View>
  )
}
