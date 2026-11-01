import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, OutputBox, Segmented, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { numberToRoman, romanToNumber } from "./logic"

export default function RomanNumeral() {
  const input = signal("2025")
  const mode = signal<"to-roman" | "from-roman">("to-roman")
  const output = signal("")
  const error = signal("")

  const convert = () => {
    try {
      const value = mode() === "to-roman" ? numberToRoman(Number(input().trim())) : romanToNumber(input())
      output.set(String(value))
      error.set("")
    } catch (failure) {
      output.set("")
      error.set(failure instanceof Error ? failure.message : String(failure))
    }
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("罗马数字转换", "Roman numeral converter")}
          description={L("支持 1–3999，并验证标准减法记数格式。", "Convert values from 1 to 3999 and validate canonical notation.")}
        />
        <Segmented
          value={mode()}
          onChange={(value) => { mode.set(value); output.set(""); error.set("") }}
          testID="roman-mode"
          options={[
            { value: "to-roman", label: L("数字 → 罗马", "Number → Roman") },
            { value: "from-roman", label: L("罗马 → 数字", "Roman → number") },
          ]}
        />
        <TextInput
          value={input()}
          onChange={(value) => input.set(value)}
          mono
          testID="roman-input"
          placeholder={mode() === "to-roman" ? "2025" : "MMXXV"}
        />
        {error() ? <ErrorBanner message={error()} /> : null}
        <View class="flex-row items-center gap-2">
          <Button tone="primary" onPress={convert} testID="roman-convert">{L("转换", "Convert")}</Button>
          <Text class="text-xs text-muted-foreground">{L("最大支持 3999（MMMCMXCIX）。", "Maximum supported value: 3999 (MMMCMXCIX).")}</Text>
        </View>
      </Card>
      {output() ? (
        <Card>
          <CardHeader title={L("结果", "Result")} right={<CopyButton value={() => output()} testID="roman-copy" />} />
          <OutputBox value={output()} height={96} testID="roman-output" />
        </Card>
      ) : null}
    </View>
  )
}
