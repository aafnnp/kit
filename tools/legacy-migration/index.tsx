import { Image, Picker, signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, Field, OutputBox, TextInput } from "../../components/ui"
import { L, language, pick } from "../../lib/locale"
import { activeSlug } from "../../lib/state"
import { legacyToolMeta } from "./catalog"
import { encodeBase64Bytes, runLegacyTool } from "./logic"

const DEFAULT_INPUTS: Record<string, string> = {
  "api-tester": '{"method":"GET","url":"https://example.test/items","headers":{"Accept":"application/json"}}',
  "audio-convert": "input.wav,mp3",
  "code-formatter": '{"kit":true,"tools":[1,2]}',
  "currency-convert": "25 USD EUR",
  "file-hash": "Kit toolbox",
  "favicon-generator": "K, #6b705c, #ffffff",
  "image-crop": "0,0,640,480",
  "image-resize": "1600",
  "json-plot": '[{"label":"A","value":12},{"label":"B","value":24}]',
  "lorem-image": "640,360,Placeholder,#e8e4d8,#45473d",
  "markdown-mermaid": "graph TD\nA[Start] --> B[Finish]",
  "performance-tester": "10000",
  "video-trim": "input.mp4,0,10",
}

const IMAGE_TOOLS = new Set([
  "base64-image", "exif-viewer", "image-compress", "image-convert", "image-crop", "image-resize", "image-to-pdf",
])

function primaryLabel(slug: string): string {
  switch (slug) {
    case "api-tester": return L("请求定义（JSON）", "Request definition (JSON)")
    case "audio-convert": return L("输入文件名,目标格式", "Input filename,target format")
    case "benchmark-tester":
    case "performance-tester":
    case "uuid-batch": return L("次数 / 数量", "Iterations / count")
    case "code-formatter": return L("源代码", "Source code")
    case "currency-convert": return L("金额 FROM TO", "Amount FROM TO")
    case "dns-lookup": return L("域名", "Hostname")
    case "excel-to-json": return L("制表符分隔表格", "Tab-separated table")
    case "favicon-generator": return L("文字, 背景色, 前景色", "Text, background, foreground")
    case "file-hash": return L("文本；Base64 请加前缀 base64:", "Text; prefix Base64 with base64:")
    case "gif-split": return L("GIF 文件名", "GIF filename")
    case "image-crop": return L("x,y,width,height", "x,y,width,height")
    case "image-resize": return L("最长边像素", "Maximum image dimension")
    case "ip-info": return L("IPv4 地址或 CIDR", "IPv4 address or CIDR")
    case "json-plot": return L("JSON 数组", "JSON array")
    case "jwt-generator": return L("JWT payload JSON", "JWT payload JSON")
    case "lorem-image": return L("宽,高,标签,背景色,文字色", "Width,height,label,background,text color")
    case "markdown-mermaid":
    case "markdown-preview": return L("Markdown / Mermaid 文本", "Markdown / Mermaid text")
    case "merge-pdf": return L("PDF Base64，每行一个文件", "PDF Base64, one file per line")
    case "performance-analyzer": return L("待检查源码", "Source to inspect")
    case "qr-generator": return L("文本（最多 17 个 UTF-8 字节）", "Text (up to 17 UTF-8 bytes)")
    case "text-to-pdf": return L("PDF 文本（单页，Latin-1）", "PDF text (one page, Latin-1)")
    case "user-agent": return "User-Agent"
    case "video-trim": return L("文件名,开始时间,结束时间", "Filename,start time,end time")
    case "yaml-to-json": return "YAML"
    default: return L("输入内容", "Input")
  }
}

function primaryPlaceholder(slug: string): string {
  switch (slug) {
    case "bcrypt-hash": return "$2b$12$..."
    case "color-picker": return "#4a6b55"
    case "dns-lookup": return "example.com"
    case "ip-info": return "192.168.1.42/24"
    case "jwt-generator": return '{"sub":"123","role":"reader"}'
    case "password-strength": return L("仅在本地分析，不会保存", "Analyzed locally; never stored")
    case "qr-generator": return "https://example.test"
    case "svg-minify": return '<svg viewBox="0 0 24 24">...</svg>'
    case "text-to-pdf": return "Hello, Kit!"
    case "user-agent": return "Mozilla/5.0 ..."
    case "yaml-to-json": return "name: Kit\nitems:\n  - clipboard\n  - formatter"
    default: return ""
  }
}

function secondaryConfig(slug: string): { label: string; placeholder: string } | null {
  switch (slug) {
    case "code-formatter": return { label: L("语言", "Language"), placeholder: "json / css / html / xml" }
    case "file-hash": return { label: L("算法", "Algorithm"), placeholder: "sha256" }
    case "json-plot": return { label: L("标签键,数值键", "Label key,value key"), placeholder: "label,value" }
    case "jwt-generator": return { label: L("签名密钥", "Signing secret"), placeholder: L("请勿使用生产密钥", "Never use a production secret") }
    default: return null
  }
}

function pickOptions(slug: string, value: string): {
  multiple: false
  format: "compatible" | "current"
  maxDimension?: number
  quality?: number
} {
  if (slug === "image-resize") {
    const maxDimension = Number(value)
    if (!Number.isInteger(maxDimension) || maxDimension < 1 || maxDimension > 12000) {
      throw new Error(L("最长边必须是 1–12000 的整数。", "Maximum dimension must be an integer from 1 to 12000."))
    }
    return { multiple: false, format: "current", maxDimension }
  }
  if (slug === "image-compress") return { multiple: false, format: "compatible", maxDimension: 2400, quality: 0.72 }
  if (slug === "image-convert") return { multiple: false, format: "compatible" }
  return { multiple: false, format: "current" }
}

export default function LegacyMigrationTool() {
  const slug = activeSlug() ?? ""
  const meta = legacyToolMeta.find((item) => item.slug === slug)
  const input = signal(DEFAULT_INPUTS[slug] ?? "")
  const secondary = signal(slug === "code-formatter" ? "json" : slug === "file-hash" ? "sha256" : slug === "json-plot" ? "label,value" : "")
  const output = signal("")
  const error = signal("")
  const pickedImage = signal("")
  const secondaryField = secondaryConfig(slug)
  const usesImagePicker = IMAGE_TOOLS.has(slug)

  const run = () => {
    error.set("")
    try {
      const source = pickedImage() && ["base64-image", "image-compress", "image-convert", "image-resize", "image-to-pdf", "exif-viewer"].includes(slug)
        ? pickedImage()
        : input()
      const result = runLegacyTool(slug, source, secondary())
      output.set(result.output)
      if (result.warning) error.set(result.warning)
    } catch (cause) {
      error.set(cause instanceof Error ? cause.message : String(cause))
      output.set("")
    }
  }

  const chooseImage = async () => {
    error.set("")
    try {
      const images = await Picker.pickImages(pickOptions(slug, input()))
      const image = images[0]
      if (!image) return
      if (image.file.size > 8 * 1024 * 1024) throw new Error(L("图片超过 8 MiB；请先缩小后再处理。", "Image exceeds 8 MiB; resize it before processing."))
      const bytes = new Uint8Array(await image.file.arrayBuffer())
      const dataUrl = `data:${image.file.type || "image/jpeg"};base64,${encodeBase64Bytes(bytes)}`
      pickedImage.set(dataUrl)
      output.set("")
      error.set(`${image.file.name || L("已选择图片", "Image selected")} · ${image.file.type || "image/unknown"} · ${image.size.width}×${image.size.height} · ${image.file.size} B`)
    } catch (cause) {
      error.set(cause instanceof Error ? cause.message : String(cause))
    }
  }

  if (!meta) {
    return <Card><Text>{L("此工具尚未配置。", "This tool is not configured.")}</Text></Card>
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader title={pick(meta.name)} description={pick(meta.description)} />
        <Field label={primaryLabel(slug)}>
          <TextInput
            value={input()}
            onChange={(value) => input.set(value)}
            multiline
            height={220}
            mono
            testID="migration-tool-input"
            placeholder={primaryPlaceholder(slug)}
          />
        </Field>
        {secondaryField ? (
          <Field label={secondaryField.label}>
            <TextInput
              value={secondary()}
              onChange={(value) => secondary.set(value)}
              testID="migration-tool-secondary"
              placeholder={secondaryField.placeholder}
            />
          </Field>
        ) : null}
        <View class="flex-row flex-wrap gap-2">
          {usesImagePicker ? (
            <Button onPress={() => { void chooseImage() }} testID="migration-tool-pick-image">
              {L("选择图片…", "Choose image…")}
            </Button>
          ) : null}
          <Button tone="primary" onPress={run} testID="migration-tool-run">
            {L("处理", "Process")}
          </Button>
        </View>
        {error() ? <Text class="text-xs text-muted-foreground" testID="migration-tool-message">{error()}</Text> : null}
      </Card>
      {pickedImage() && (slug === "image-compress" || slug === "image-convert" || slug === "image-resize" || slug === "base64-image") ? (
        <Card>
          <CardHeader title={L("已选择图片", "Selected image")} description={L("预览在本机显示；图片数据不会上传。", "Preview is shown locally; image data is not uploaded.")} />
          <Image src={pickedImage()} resizeMode="contain" style={{ width: 240, height: 180 }} />
        </Card>
      ) : null}
      {output() ? (
        <Card>
          <CardHeader
            title={L("结果", "Result")}
            right={<CopyButton value={() => output()} testID="migration-tool-copy" />}
          />
          <OutputBox value={output()} height={300} testID="migration-tool-output" />
        </Card>
      ) : null}
      <Text class="text-[11px] text-muted-foreground">
        {language() === "zh" ? "离线处理 · 不会自动访问网络或执行本机命令" : "Offline processing · no automatic network requests or local commands"}
      </Text>
    </View>
  )
}
