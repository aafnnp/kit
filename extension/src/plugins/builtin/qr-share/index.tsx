import { toString as toSvgString, toDataURL } from "qrcode"
import { useEffect, useState } from "react"
import { Button, Card, Field, Spinner } from "@/components/ui"
import { tt } from "@/lib/i18n"
import { dataUrlToBlob, downloadBlob, formatTimestamp } from "@/lib/tabs"
import { definePlugin } from "@/plugins/define"
import type { PluginContext, PluginPanelProps } from "@/plugins/types"
import { meta } from "./meta"

const QR_OPTIONS = { width: 512, margin: 2, errorCorrectionLevel: "M" as const }

export default definePlugin({
  meta,
  actions: {
    /**
     * 纯动作：把当前页面地址生成二维码并复制成图片，
     * 适合绑到右键菜单 / 快捷键（不需要打开 popup）。
     */
    default: async (ctx: PluginContext) => {
      const url = (await ctx.getActiveTab())?.url
      if (!url) {
        ctx.notify(tt("无法获取当前页面地址", "Cannot read the current URL"), { type: "error" })
        return
      }

      const dataUrl = await toDataURL(url, QR_OPTIONS)
      await ctx.copyImage(dataUrlToBlob(dataUrl), tt("二维码已复制", "QR code copied"))
    },
  },
  Panel: QrSharePanel,
})

function QrSharePanel({ ctx }: PluginPanelProps) {
  const [text, setText] = useState("")
  const [dataUrl, setDataUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 默认填充当前标签页地址
  useEffect(() => {
    void (async () => {
      const tab = await ctx.getActiveTab()
      if (tab?.url) setText(tab.url)
    })()
  }, [ctx])

  useEffect(() => {
    const value = text.trim()
    if (!value) {
      setDataUrl("")
      setError(null)
      return
    }

    let alive = true
    setLoading(true)
    setError(null)

    toDataURL(value, QR_OPTIONS)
      .then((result) => {
        if (alive) setDataUrl(result)
      })
      .catch((cause: unknown) => {
        if (alive) setError((cause as Error).message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [text])

  const download = async (format: "png" | "svg") => {
    const value = text.trim()
    if (!value) return

    if (format === "png") {
      downloadBlob(dataUrlToBlob(dataUrl), `kit-qr-${formatTimestamp()}.png`)
      return
    }

    const svg = await toSvgString(value, { margin: 2, width: 256, type: "svg" })
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `kit-qr-${formatTimestamp()}.svg`)
  }

  return (
    <>
      <Card>
        <Field
          label={tt("二维码内容", "QR content")}
          value={text}
          onChange={setText}
          multiline
          rows={3}
          placeholder={tt("输入网址或任意文本", "Enter a URL or any text")}
        />
      </Card>

      <Card>
        <div className="kit-qr">
          {loading ? (
            <div className="kit-empty">
              <Spinner size={18} />
            </div>
          ) : dataUrl ? (
            <img src={dataUrl} alt={tt("二维码预览", "QR preview")} />
          ) : (
            <span style={{ color: "var(--kit-muted)" }}>{tt("暂无内容", "No content")}</span>
          )}
        </div>

        {error ? <p style={{ color: "var(--kit-danger)", marginBottom: 0 }}>{error}</p> : null}

        <div className="kit-row" style={{ marginTop: 8 }}>
          <Button
            size="sm"
            variant="primary"
            disabled={!dataUrl}
            onClick={() => void ctx.copyImage(dataUrlToBlob(dataUrl), tt("二维码已复制", "QR code copied"))}
          >
            {tt("复制图片", "Copy image")}
          </Button>
          <Button size="sm" disabled={!dataUrl} onClick={() => void download("png")}>
            PNG
          </Button>
          <Button size="sm" disabled={!text.trim()} onClick={() => void download("svg")}>
            SVG
          </Button>
        </div>
      </Card>
    </>
  )
}
