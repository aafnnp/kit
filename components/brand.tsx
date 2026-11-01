import { View } from "nsh"

const ICON_INK = "#0d1117"
const ICON_PLINTH = "#161b22"
const ICON_BARS = ["#00a6d0", "#6b2dd1", "#f16511"]
const BAR_HEIGHTS = [0.58, 0.54, 0.58]

function Bar(props: { color: string; size: number; scale: number }) {
  const width = () => Math.max(2, Math.round(props.size * 0.125))
  return (
    <View
      style={{
        width: width(),
        height: Math.round(props.size * props.scale),
        borderRadius: width() / 2,
        backgroundColor: props.color,
      }}
    />
  )
}

export function BrandMark(props: { size?: number; testID?: string }) {
  const size = () => props.size ?? 36
  return (
    <View
      class="items-center justify-center overflow-hidden"
      testID={props.testID}
      style={{ width: size(), height: size(), borderRadius: Math.round(size() * 0.23), backgroundColor: ICON_INK }}
    >
      <View
        class="absolute"
        style={{
          width: Math.round(size() * 0.66),
          height: Math.round(size() * 0.66),
          borderRadius: Math.round(size() * 0.14),
          backgroundColor: ICON_PLINTH,
        }}
      />
      <View class="flex-row items-center" style={{ gap: Math.max(1, Math.round(size() * 0.045)) }}>
        <Bar color={ICON_BARS[0]} size={size()} scale={BAR_HEIGHTS[0]} />
        <Bar color={ICON_BARS[1]} size={size()} scale={BAR_HEIGHTS[1]} />
        <Bar color={ICON_BARS[2]} size={size()} scale={BAR_HEIGHTS[2]} />
      </View>
    </View>
  )
}
