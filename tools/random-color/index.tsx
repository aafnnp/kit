import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton } from "../../components/ui"
import { L } from "../../lib/locale"
import { generateRandomColor } from "./logic"

export default function RandomColor() {
  const color = signal("#00A6D0")
  const generate = () => color.set(generateRandomColor())

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("随机颜色", "Random color")}
          description={L("生成随机 HEX 颜色，点击色块即可刷新。", "Generate a random HEX color. Click the swatch to roll another.")}
        />
        <View
          role="button"
          accessibilityLabel={L("生成另一种颜色", "Generate another color")}
          onPress={generate}
          class="h-40 w-full rounded-md border border-border transition-colors active:opacity-80"
          style={{ backgroundColor: color() }}
          testID="random-color-swatch"
        />
        <View class="flex-row items-center justify-between gap-3">
          <Text class="font-mono text-lg font-semibold text-foreground" testID="random-color-value">{color()}</Text>
          <View class="flex-row gap-2">
            <CopyButton value={() => color()} testID="random-color-copy" />
            <Button tone="primary" onPress={generate} testID="random-color-generate">{L("再来一个", "Generate")}</Button>
          </View>
        </View>
      </Card>
    </View>
  )
}
