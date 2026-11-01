import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { convertColor } from "./logic"

export default function HexRgb() {
  const input = signal("#6B2DD1")
  const result = signal<ReturnType<typeof convertColor> | null>(null)
  const error = signal("")

  const convert = () => {
    try {
      result.set(convertColor(input()))
      error.set("")
    } catch (failure) {
      result.set(null)
      error.set(failure instanceof Error ? failure.message : String(failure))
    }
  }
  const output = () => {
    const color = result()
    if (!color) return ""
    return [
      `HEX: ${color.hex}`,
      `RGB: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`,
      `HSL: ${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%`,
      `HSV: ${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%`,
      `CMYK: ${color.cmyk.c}%, ${color.cmyk.m}%, ${color.cmyk.y}%, ${color.cmyk.k}%`,
    ].join("\n")
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("颜色格式转换", "Color format converter")}
          description={L("输入 HEX 或 RGB，查看 HEX、RGB、HSL、HSV、CMYK 与文字对比度。", "Enter HEX or RGB to inspect HEX, RGB, HSL, HSV, CMYK and text contrast.")}
        />
        <View class="flex-row flex-wrap items-end gap-3">
          <View class="min-w-48 flex-1">
            <TextInput value={input()} onChange={(value) => input.set(value)} mono testID="color-input" placeholder="#6B2DD1" />
          </View>
          <Button tone="primary" onPress={convert} testID="color-convert">{L("转换", "Convert")}</Button>
        </View>
        {error() ? <ErrorBanner message={error()} /> : null}
      </Card>
      {result() ? (
        <Card testID="color-result">
          <CardHeader title={L("转换结果", "Conversions")} right={<CopyButton value={output} testID="color-copy" />} />
          <View class="flex-row items-center gap-3">
            <View class="h-10 w-10 rounded-md border border-border" style={{ backgroundColor: result()!.hex }} />
            <Text class="font-mono text-sm text-foreground">{result()!.hex}</Text>
          </View>
          <View class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ColorRow label="RGB" value={`${result()!.rgb.r}, ${result()!.rgb.g}, ${result()!.rgb.b}`} />
            <ColorRow label="HSL" value={`${result()!.hsl.h}°, ${result()!.hsl.s}%, ${result()!.hsl.l}%`} />
            <ColorRow label="HSV" value={`${result()!.hsv.h}°, ${result()!.hsv.s}%, ${result()!.hsv.v}%`} />
            <ColorRow label="CMYK" value={`${result()!.cmyk.c}%, ${result()!.cmyk.m}%, ${result()!.cmyk.y}%, ${result()!.cmyk.k}%`} />
          </View>
          <Text class="text-xs text-muted-foreground">
            {L("文字对比度", "Text contrast")}: {L("黑色", "black")} {result()!.contrastBlack}:1 · {L("白色", "white")} {result()!.contrastWhite}:1 · {L("建议", "recommended")}: {result()!.recommendedText}
          </Text>
        </Card>
      ) : null}
    </View>
  )
}

function ColorRow(props: { label: string; value: string }) {
  return (
    <View class="flex-row items-center justify-between rounded-md bg-muted/30 px-3 py-2">
      <Text class="text-xs font-medium text-muted-foreground">{props.label}</Text>
      <Text class="font-mono text-xs text-foreground">{props.value}</Text>
    </View>
  )
}
