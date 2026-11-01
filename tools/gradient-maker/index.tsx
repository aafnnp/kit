import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { generateLinearGradient } from "./logic"

export default function GradientMaker() {
  const first = signal("#00A6D0")
  const second = signal("#6B2DD1")
  const angle = signal("135")
  const output = signal("")
  const error = signal("")

  const generate = () => {
    try {
      output.set(generateLinearGradient(first(), second(), Number(angle())))
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
          title={L("渐变生成器", "Gradient generator")}
          description={L("输入两个颜色与角度，生成 CSS 线性渐变。", "Generate a CSS linear gradient from two colors and an angle.")}
        />
        <View class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <GradientField label={L("起始颜色", "First color")} value={first()} update={(value) => first.set(value)} id="gradient-first" />
          <GradientField label={L("结束颜色", "Second color")} value={second()} update={(value) => second.set(value)} id="gradient-second" />
          <GradientField label={L("角度 (deg)", "Angle (deg)")} value={angle()} update={(value) => angle.set(value)} id="gradient-angle" />
        </View>
        {error() ? <ErrorBanner message={error()} /> : null}
        <Button tone="primary" onPress={generate} testID="gradient-generate">{L("生成", "Generate")}</Button>
      </Card>
      {output() ? (
        <Card>
          <CardHeader title={L("预览与 CSS", "Preview & CSS")} right={<CopyButton value={() => output()} testID="gradient-copy" />} />
          <View class="h-28 rounded-md border border-border" style={{ backgroundImage: output().replace("background: ", "").replace(";", "") }} />
          <Text class="select-text font-mono text-xs text-foreground" testID="gradient-output">{output()}</Text>
        </Card>
      ) : null}
    </View>
  )
}

function GradientField(props: { label: string; value: string; update: (value: string) => void; id: string }) {
  return (
    <View class="gap-1">
      <Text class="text-xs font-medium text-muted-foreground">{props.label}</Text>
      <TextInput value={props.value} onChange={(value) => props.update(value)} mono testID={props.id} />
    </View>
  )
}
