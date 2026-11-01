import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { generateCssClamp } from "./logic"

export default function CssClamp() {
  const property = signal("font-size")
  const minValue = signal("16")
  const maxValue = signal("32")
  const minViewport = signal("360")
  const maxViewport = signal("1440")
  const output = signal("")
  const error = signal("")

  const generate = () => {
    try {
      output.set(generateCssClamp(property(), Number(minValue()), Number(maxValue()), Number(minViewport()), Number(maxViewport())))
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
          title={L("流体尺寸 clamp()", "Fluid sizing with clamp()")}
          description={L("按视口宽度在最小值与最大值之间平滑缩放。", "Scale smoothly between minimum and maximum values as the viewport changes.")}
        />
        <View class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputField label={L("CSS 属性", "CSS property")} value={property()} update={(value) => property.set(value)} id="clamp-property" />
          <InputField label={L("最小值 (px)", "Minimum (px)")} value={minValue()} update={(value) => minValue.set(value)} id="clamp-min" />
          <InputField label={L("最大值 (px)", "Maximum (px)")} value={maxValue()} update={(value) => maxValue.set(value)} id="clamp-max" />
          <InputField label={L("最小视口 (px)", "Minimum viewport (px)")} value={minViewport()} update={(value) => minViewport.set(value)} id="clamp-min-viewport" />
          <InputField label={L("最大视口 (px)", "Maximum viewport (px)")} value={maxViewport()} update={(value) => maxViewport.set(value)} id="clamp-max-viewport" />
        </View>
        {error() ? <ErrorBanner message={error()} /> : null}
        <Button tone="primary" onPress={generate} testID="clamp-generate">{L("生成 CSS", "Generate CSS")}</Button>
      </Card>
      {output() ? (
        <Card>
          <CardHeader title={L("CSS 声明", "CSS declaration")} right={<CopyButton value={() => output()} testID="clamp-copy" />} />
          <Text class="select-text font-mono text-sm text-foreground" testID="clamp-output">{output()}</Text>
        </Card>
      ) : null}
    </View>
  )
}

function InputField(props: { label: string; value: string; update: (value: string) => void; id: string }) {
  return (
    <View class="gap-1">
      <Text class="text-xs font-medium text-muted-foreground">{props.label}</Text>
      <TextInput value={props.value} onChange={(value) => props.update(value)} mono testID={props.id} />
    </View>
  )
}
