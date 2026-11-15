import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { createLiveRun } from "../../lib/tool-run"
import { convertColor, type ColorAnalysis } from "./logic"

export default function HexRgb() {
  const input = signal("#6B2DD1")
  const compute = () => convertColor(input())
  const result = createLiveRun<ColorAnalysis | null>({ initial: null, compute, inputs: [input], delay: 200 })
  const color = result.output

  const alphaHex = () => Math.round(color()!.alpha * 255).toString(16).padStart(2, "0").toUpperCase()
  const output = () => {
    const current = color()
    if (!current) return ""
    const lines = [
      `HEX: ${current.hex}`,
      current.alpha < 1 ? `HEX8: ${current.hex}${alphaHex()}` : "",
      `RGB: ${current.rgb.r}, ${current.rgb.g}, ${current.rgb.b}`,
      `HSL: ${current.hsl.h}, ${current.hsl.s}%, ${current.hsl.l}%`,
      `HSV: ${current.hsv.h}, ${current.hsv.s}%, ${current.hsv.v}%`,
      `CMYK: ${current.cmyk.c}%, ${current.cmyk.m}%, ${current.cmyk.y}%, ${current.cmyk.k}%`,
    ]
    if (current.alpha < 1) lines.push(`Alpha: ${Number(current.alpha.toFixed(2))}`)
    return lines.filter(Boolean).join("\n")
  }
  const contrast = () => Math.max(color()!.contrastBlack, color()!.contrastWhite)
  const wcag = () => (contrast() >= 7 ? "AAA" : contrast() >= 4.5 ? "AA" : L("不满足 AA", "Below AA"))

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("颜色格式转换", "Color format converter")}
          description={L("输入 HEX、rgb()、hsl() 或 CSS 颜色名，查看各格式、透明度与文字对比度。", "Enter HEX, rgb(), hsl() or a CSS color name to inspect formats, alpha and text contrast.")}
        />
        <View class="flex-row flex-wrap items-end gap-3">
          <View class="min-w-48 flex-1">
            <TextInput value={input()} onChange={(value) => input.set(value)} mono testID="color-input" placeholder="#6B2DD1" />
          </View>
          <Button tone="primary" onPress={() => result.run(compute)} testID="color-convert">{L("转换", "Convert")}</Button>
        </View>
        {result.error() ? <ErrorBanner message={result.error()} /> : null}
      </Card>
      {color() ? (
        <Card testID="color-result">
          <CardHeader title={L("转换结果", "Conversions")} right={<CopyButton value={output} testID="color-copy" />} />
          <View class="flex-row items-center gap-3">
            <View class="h-10 w-10 rounded-md border border-border" style={{ backgroundColor: color()!.hex }} />
            <Text class="font-mono text-sm text-foreground">{color()!.hex}</Text>
          </View>
          <View
            class="rounded-md border border-border p-4"
            style={{ backgroundColor: `rgba(${color()!.rgb.r}, ${color()!.rgb.g}, ${color()!.rgb.b}, ${color()!.alpha})` }}
          >
            <Text
              class="text-sm font-medium"
              style={{ color: color()!.recommendedText === "black" ? "#000000" : "#FFFFFF" }}
            >
              {L("示例文字 Sample text", "Sample text")}
            </Text>
          </View>
          <View class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ColorRow label="RGB" value={`${color()!.rgb.r}, ${color()!.rgb.g}, ${color()!.rgb.b}`} />
            <ColorRow label="HSL" value={`${color()!.hsl.h}°, ${color()!.hsl.s}%, ${color()!.hsl.l}%`} />
            <ColorRow label="HSV" value={`${color()!.hsv.h}°, ${color()!.hsv.s}%, ${color()!.hsv.v}%`} />
            <ColorRow label="CMYK" value={`${color()!.cmyk.c}%, ${color()!.cmyk.m}%, ${color()!.cmyk.y}%, ${color()!.cmyk.k}%`} />
            {color()!.alpha < 1 ? <ColorRow label="Alpha" value={String(Number(color()!.alpha.toFixed(2)))} /> : null}
          </View>
          <Text class="text-xs text-muted-foreground">
            {L("文字对比度", "Text contrast")}: {L("黑色", "black")} {color()!.contrastBlack}:1 · {L("白色", "white")} {color()!.contrastWhite}:1 · {L("建议", "recommended")}: {color()!.recommendedText} · WCAG {wcag()}
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
