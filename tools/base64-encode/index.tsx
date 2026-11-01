import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, Field, OutputBox, Segmented, TextInput, Toggle } from "../../components/ui"
import { L } from "../../lib/locale"
import { decodeBase64, encodeBase64 } from "./logic"

export default function Base64Encode() {
  const input = signal("Kit · 本地工具箱 🧰")
  const mode = signal<"encode" | "decode">("encode")
  const urlSafe = signal(false)
  const output = signal("")
  const error = signal("")

  const convert = (next = mode()) => {
    try {
      output.set(next === "encode" ? encodeBase64(input(), urlSafe()) : decodeBase64(input(), urlSafe()))
      error.set("")
    } catch (failure) {
      output.set("")
      error.set(failure instanceof Error ? failure.message : String(failure))
    }
  }

  const swap = () => {
    const current = output()
    output.set(input())
    input.set(current)
    mode.set(mode() === "encode" ? "decode" : "encode")
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("Base64", "Base64")}
          description={L("按 UTF-8 处理文本，URL 安全模式会去掉填充并替换 +/。", "UTF-8 text. URL-safe mode replaces +/ and drops padding.")}
        />
        <View class="flex-row flex-wrap items-center gap-2">
          <Segmented
            value={mode()}
            onChange={(value) => { mode.set(value); convert(value) }}
            testID="base64-mode"
            options={[
              { value: "encode", label: L("编码", "Encode") },
              { value: "decode", label: L("解码", "Decode") },
            ]}
          />
          <Toggle label={L("URL 安全", "URL-safe")} checked={urlSafe()} onChange={(value) => { urlSafe.set(value); convert() }} />
        </View>
      </Card>

      <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={L("输入", "Input")} />
          <TextInput value={input()} onChange={(value) => input.set(value)} multiline height={220} mono testID="base64-input" />
        </Card>
        <Card>
          <CardHeader title={L("输出", "Output")} right={<CopyButton value={() => output()} testID="base64-copy" />} />
          {error() ? <ErrorBanner message={error()} /> : null}
          <OutputBox value={output()} height={220} testID="base64-output" />
        </Card>
      </View>

      <View class="flex-row flex-wrap gap-2">
        <Button tone="primary" onPress={() => convert()} testID="base64-convert">
          {L("转换", "Convert")}
        </Button>
        <Button onPress={swap} testID="base64-swap">
          {L("交换输入输出", "Swap")}
        </Button>
      </View>
    </View>
  )
}
