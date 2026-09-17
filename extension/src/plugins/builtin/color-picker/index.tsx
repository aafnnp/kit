import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react"
import { Button, Card, EmptyState } from "@/components/ui"
import { tt } from "@/lib/i18n"
import { definePlugin } from "@/plugins/define"
import type { PluginPanelProps } from "@/plugins/types"
import { meta } from "./meta"

interface PickedColor {
  hex: string
  rgb: string
  x: number
  y: number
}

/** EyeDropper 目前只有 Chromium 系提供，用局部类型声明避免污染全局 */
type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> }

function getEyeDropper(): EyeDropperCtor | undefined {
  return (globalThis as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper
}

function hexFromRgb(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`
}

export default definePlugin({
  meta,
  Panel: ColorPickerPanel,
})

function ColorPickerPanel({ ctx }: PluginPanelProps) {
  const [shot, setShot] = useState("")
  const [color, setColor] = useState<PickedColor | null>(null)
  const [history, setHistory] = useState<PickedColor[]>([])
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(false)

  const imageRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    void (async () => {
      setHistory(await ctx.storage.get<PickedColor[]>("history", []))
    })()
  }, [ctx])

  const remember = useCallback(
    (picked: PickedColor) => {
      setColor(picked)
      setHistory((previous) => {
        const next = [picked, ...previous.filter((item) => item.hex !== picked.hex)].slice(0, 12)
        void ctx.storage.set("history", next)
        return next
      })
    },
    [ctx],
  )

  const capture = useCallback(async () => {
    setLoading(true)
    try {
      const dataUrl = await ctx.captureVisibleTab()
      if (!dataUrl) {
        ctx.notify(tt("截图失败，请确认已授予当前页面权限", "Capture failed — check page permission"), {
          type: "error",
        })
        return
      }
      setShot(dataUrl)
      setColor(null)
    } finally {
      setLoading(false)
    }
  }, [ctx])

  const handlePick = (event: MouseEvent<HTMLImageElement>) => {
    const image = imageRef.current
    if (!image) return

    const rect = image.getBoundingClientRect()
    const scaleX = image.naturalWidth / rect.width
    const scaleY = image.naturalHeight / rect.height
    const x = Math.min(image.naturalWidth - 1, Math.max(0, Math.floor((event.clientX - rect.left) * scaleX)))
    const y = Math.min(image.naturalHeight - 1, Math.max(0, Math.floor((event.clientY - rect.top) * scaleY)))

    const canvas = canvasRef.current ?? document.createElement("canvas")
    canvasRef.current = canvas
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return

    context.drawImage(image, 0, 0)
    const [r = 0, g = 0, b = 0] = context.getImageData(x, y, 1, 1).data

    remember({ hex: hexFromRgb(r, g, b), rgb: `rgb(${r}, ${g}, ${b})`, x, y })
  }

  const useEyeDropper = async () => {
    const Ctor = getEyeDropper()
    if (!Ctor) {
      ctx.notify(tt("当前浏览器不支持系统吸管，请使用截屏取色", "System eyedropper unavailable, use screenshot"), {
        type: "info",
      })
      return
    }

    try {
      const result = await new Ctor().open()
      remember({ hex: result.sRGBHex, rgb: hexToRgb(result.sRGBHex), x: -1, y: -1 })
    } catch {
      // 用户取消取色
    }
  }

  if (!shot) {
    return (
      <EmptyState
        icon="🎨"
        title={tt("从页面取色", "Pick a color from the page")}
        hint={tt(
          "先截取当前可见区域，再点击图片上的位置取色",
          "Capture the visible area, then click a pixel to pick its color",
        )}
        action={
          <div className="kit-row">
            <Button variant="primary" size="sm" loading={loading} onClick={() => void capture()}>
              {tt("截取并取色", "Capture")}
            </Button>
            {getEyeDropper() ? (
              <Button size="sm" onClick={() => void useEyeDropper()}>
                {tt("系统吸管", "Eyedropper")}
              </Button>
            ) : null}
          </div>
        }
      />
    )
  }

  return (
    <>
      <Card>
        <div className="kit-picker">
          <img
            ref={imageRef}
            src={shot}
            alt={tt("页面截图", "Page screenshot")}
            style={{ width: `${zoom * 100}%` }}
            onClick={handlePick}
          />
        </div>
        <div className="kit-row" style={{ marginTop: 8 }}>
          <Button size="sm" loading={loading} onClick={() => void capture()}>
            {tt("重新截取", "Recapture")}
          </Button>
          <Button size="sm" onClick={() => setZoom((value) => (value >= 3 ? 1 : value + 1))}>
            {zoom}×
          </Button>
          {getEyeDropper() ? (
            <Button size="sm" onClick={() => void useEyeDropper()}>
              {tt("系统吸管", "Eyedropper")}
            </Button>
          ) : null}
        </div>
      </Card>

      {color ? (
        <Card>
          <div className="kit-row" style={{ alignItems: "center" }}>
            <span className="kit-picker__swatch" style={{ background: color.hex }} />
            <span className="kit-mono" style={{ fontWeight: 600 }}>
              {color.hex}
            </span>
            <span className="kit-mono" style={{ color: "var(--kit-muted)" }}>
              {color.rgb}
            </span>
            {color.x >= 0 ? (
              <span style={{ color: "var(--kit-muted)", fontSize: 11 }}>
                {color.x},{color.y}
              </span>
            ) : null}
          </div>
          <div className="kit-row" style={{ marginTop: 8 }}>
            <Button
              size="sm"
              variant="primary"
              onClick={() => void ctx.copyText(color.hex, tt("HEX 已复制", "HEX copied"))}
            >
              {tt("复制 HEX", "Copy HEX")}
            </Button>
            <Button size="sm" onClick={() => void ctx.copyText(color.rgb, tt("RGB 已复制", "RGB copied"))}>
              {tt("复制 RGB", "Copy RGB")}
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <p style={{ margin: 0, color: "var(--kit-muted)" }}>
            {tt("点击上方图片任意位置取色", "Click anywhere on the image to pick a color")}
          </p>
        </Card>
      )}

      {history.length > 0 ? (
        <Card>
          <div style={{ color: "var(--kit-muted)", fontSize: 11, marginBottom: 6 }}>
            {tt("最近使用", "Recent")}
          </div>
          <div className="kit-swatches">
            {history.map((item) => (
              <button
                key={item.hex}
                type="button"
                className="kit-swatch"
                style={{ background: item.hex }}
                title={item.hex}
                aria-label={item.hex}
                onClick={() => void ctx.copyText(item.hex, `${item.hex} ${tt("已复制", "copied")}`)}
              />
            ))}
          </div>
        </Card>
      ) : null}
    </>
  )
}

function hexToRgb(hex: string): string {
  const value = hex.replace("#", "")
  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  return `rgb(${r}, ${g}, ${b})`
}
