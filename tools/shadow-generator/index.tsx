import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, Segmented, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { createLiveRun } from "../../lib/tool-run"
import { numberFromText } from "../../lib/validation"
import { generateBoxShadow } from "./logic"

export default function ShadowGenerator() {
  const x = signal("0")
  const y = signal("8")
  const blur = signal("24")
  const spread = signal("0")
  const color = signal("#0D1117")
  const opacity = signal("18")
  const inset = signal(false)
  const compute = () =>
    generateBoxShadow({
      x: numberFromText(x(), "X offset"),
      y: numberFromText(y(), "Y offset"),
      blur: numberFromText(blur(), "Blur"),
      spread: numberFromText(spread(), "Spread"),
      color: color(),
      opacity: numberFromText(opacity(), "Opacity"),
      inset: inset(),
    })
  const outcome = createLiveRun({ initial: "", compute, inputs: [x, y, blur, spread, color, opacity, inset] })

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("阴影生成器", "Box shadow generator")}
          description={L("调整偏移、模糊、扩展和透明度，实时预览 CSS 阴影。", "Tune offsets, blur, spread and opacity, then preview the CSS shadow.")}
        />
        <View class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ShadowField label={L("水平偏移", "X offset")} value={x()} update={(value) => x.set(value)} id="shadow-x" />
          <ShadowField label={L("垂直偏移", "Y offset")} value={y()} update={(value) => y.set(value)} id="shadow-y" />
          <ShadowField label={L("模糊", "Blur")} value={blur()} update={(value) => blur.set(value)} id="shadow-blur" />
          <ShadowField label={L("扩展", "Spread")} value={spread()} update={(value) => spread.set(value)} id="shadow-spread" />
          <ShadowField label={L("颜色", "Color")} value={color()} update={(value) => color.set(value)} id="shadow-color" />
          <ShadowField label={L("透明度 (%)", "Opacity (%)")} value={opacity()} update={(value) => opacity.set(value)} id="shadow-opacity" />
        </View>
        <Segmented
          value={inset() ? "inset" : "outer"}
          onChange={(value) => inset.set(value === "inset")}
          testID="shadow-inset"
          options={[
            { value: "outer", label: L("外阴影", "Outer") },
            { value: "inset", label: L("内阴影", "Inset") },
          ]}
        />
        {outcome.error() ? <ErrorBanner message={outcome.error()} /> : null}
        <Button tone="primary" onPress={() => outcome.run(compute)} testID="shadow-generate">{L("生成预览", "Generate preview")}</Button>
      </Card>
      {outcome.output() ? (
        <Card>
          <CardHeader title={L("CSS 预览", "CSS preview")} right={<CopyButton value={outcome.output} testID="shadow-copy" />} />
          <View class="flex-row items-center justify-center rounded-md bg-muted/40 p-8">
            <View class="h-20 w-40 rounded-md border border-border bg-card" style={{ boxShadow: outcome.output().replace("box-shadow: ", "").replace(";", "") }} />
          </View>
          <Text class="select-text font-mono text-xs text-foreground" testID="shadow-output">{outcome.output()}</Text>
        </Card>
      ) : null}
    </View>
  )
}

function ShadowField(props: { label: string; value: string; update: (value: string) => void; id: string }) {
  return (
    <View class="gap-1">
      <Text class="text-xs font-medium text-muted-foreground">{props.label}</Text>
      <TextInput value={props.value} onChange={(value) => props.update(value)} mono testID={props.id} />
    </View>
  )
}
