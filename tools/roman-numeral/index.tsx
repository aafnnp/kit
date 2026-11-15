import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, OutputBox, Segmented, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { createLiveRun } from "../../lib/tool-run"
import { numberFromText } from "../../lib/validation"
import { numberToRoman, romanToNumber } from "./logic"

export default function RomanNumeral() {
  const input = signal("2025")
  const mode = signal<"to-roman" | "from-roman">("to-roman")
  const compute = () =>
    mode() === "to-roman"
      ? String(numberToRoman(numberFromText(input(), "Number")))
      : String(romanToNumber(input()))
  const outcome = createLiveRun({ initial: "", compute, inputs: [input, mode], delay: 200 })

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("罗马数字转换", "Roman numeral converter")}
          description={L("支持 1–3999，并验证标准减法记数格式。", "Convert values from 1 to 3999 and validate canonical notation.")}
        />
        <Segmented
          value={mode()}
          onChange={(value) => mode.set(value)}
          testID="roman-mode"
          label={L("转换方向", "Direction")}
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
        {outcome.error() ? <ErrorBanner message={outcome.error()} /> : null}
        <View class="flex-row items-center gap-2">
          <Button tone="primary" onPress={() => outcome.run(compute)} testID="roman-convert">{L("转换", "Convert")}</Button>
          <Text class="text-xs text-muted-foreground">{L("最大支持 3999（MMMCMXCIX）。", "Maximum supported value: 3999 (MMMCMXCIX).")}</Text>
        </View>
      </Card>
      {outcome.output() ? (
        <Card>
          <CardHeader title={L("结果", "Result")} right={<CopyButton value={outcome.output} testID="roman-copy" />} />
          <OutputBox value={outcome.output()} height={96} testID="roman-output" />
        </Card>
      ) : null}
    </View>
  )
}
