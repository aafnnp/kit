import { signal, Text, View } from "nsh"
import { Card, CardHeader, CopyButton, Segmented, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { generateBorderRadius, type RadiusCorners, type RadiusUnit } from "./logic"

export default function BorderRadius() {
  const corners = signal<RadiusCorners>({ topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 })
  const unit = signal<RadiusUnit>("px")
  const current = () => corners()
  const output = () => {
    try {
      return generateBorderRadius(current(), unit())
    } catch {
      return ""
    }
  }
  const previewStyle = () => {
    const scale = unit() === "rem" ? 16 : unit() === "%" ? 0.96 : 1
    const currentCorners = current()
    return {
      borderTopLeftRadius: currentCorners.topLeft * scale,
      borderTopRightRadius: currentCorners.topRight * scale,
      borderBottomRightRadius: currentCorners.bottomRight * scale,
      borderBottomLeftRadius: currentCorners.bottomLeft * scale,
    }
  }

  const update = (corner: keyof RadiusCorners, value: string) => {
    corners.set({ ...current(), [corner]: value.trim() === "" ? Number.NaN : Number(value) })
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("圆角生成器", "Border radius generator")}
          description={L("设置四个角，自动压缩成最短的 CSS 简写。", "Set each corner and generate the shortest CSS shorthand.")}
        />
        <Segmented
          value={unit()}
          onChange={(value) => unit.set(value)}
          testID="radius-unit"
          options={[
            { value: "px", label: "px" },
            { value: "rem", label: "rem" },
            { value: "%", label: "%" },
          ]}
        />
        <View class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CornerField label={L("左上", "Top left")} value={current().topLeft} onChange={(value) => update("topLeft", value)} testID="radius-top-left" />
          <CornerField label={L("右上", "Top right")} value={current().topRight} onChange={(value) => update("topRight", value)} testID="radius-top-right" />
          <CornerField label={L("右下", "Bottom right")} value={current().bottomRight} onChange={(value) => update("bottomRight", value)} testID="radius-bottom-right" />
          <CornerField label={L("左下", "Bottom left")} value={current().bottomLeft} onChange={(value) => update("bottomLeft", value)} testID="radius-bottom-left" />
        </View>
      </Card>
      <Card>
        <CardHeader title={L("预览与 CSS", "Preview & CSS")} right={output() ? <CopyButton value={output} testID="radius-copy" /> : undefined} />
        {output() ? (
          <View class="gap-3">
            <View class="h-24 w-40 border border-border bg-primary/20" style={previewStyle()} />
            <Text class="select-text font-mono text-sm text-foreground" testID="radius-output">{output()}</Text>
          </View>
        ) : <Text class="text-xs text-destructive">{L("请输入有效的圆角值。", "Enter valid corner values.")}</Text>}
      </Card>
    </View>
  )
}

function CornerField(props: { label: string; value: number; onChange: (value: string) => void; testID: string }) {
  return (
    <View class="gap-1">
      <Text class="text-xs font-medium text-muted-foreground">{props.label}</Text>
      <TextInput value={Number.isNaN(props.value) ? "" : String(props.value)} onChange={props.onChange} mono testID={props.testID} />
    </View>
  )
}
