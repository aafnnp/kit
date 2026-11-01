import { createHash, randomUUID } from "crypto"
import type { PickImagesOptions } from "nsh"
import type { Localized, ToolMeta } from "../../lib/types"
import { NSH_VERSION } from "../../lib/version"
import { csvToJson } from "../csv-to-json/logic"
import { hashText } from "../hash/logic"
import { passwordStrength } from "../password-generator/logic"
import { integerFromText } from "../../lib/validation"
import { legacyToolMeta } from "./catalog"
import {
  analyzeUserAgent,
  convertSampleCurrency,
  createCode39Svg,
  createFaviconSvg,
  createPlaceholderSvg,
  createQrSvg,
  createRequestPreview,
  decodeBase64,
  formatCode,
  inspectExif,
  inspectHtml,
  inspectIpv4,
  inspectPdfBase64,
  jpegToPdfBase64,
  jsonBarChart,
  makeSvgSprite,
  markdownOutline,
  minifySvg,
  parseMermaid,
  quoteArgument,
  rgbToHsl,
  runStringBenchmark,
  seconds,
  signJwt,
  sourceMetrics,
  textToPdfBase64,
  yamlToJson,
  type LegacyToolResult,
} from "./helpers"

export interface LegacyToolSpec {
  meta: ToolMeta
  defaultInput?: string
  primaryLabel?: Localized
  primaryPlaceholder?: Localized
  secondary?: { label: Localized; placeholder?: Localized; default?: string }
  imagePicker?: boolean
  pickOptions?: (value: string) => PickImagesOptions
  run: (input: string, secondary: string, option: string) => LegacyToolResult
}

type Details = Omit<LegacyToolSpec, "meta">

function imagePickOptions(slug: string, value: string): PickImagesOptions {
  if (slug === "image-resize") {
    const maxDimension = Number(value)
    if (!Number.isInteger(maxDimension) || maxDimension < 1 || maxDimension > 12000) {
      throw new Error("Maximum dimension must be an integer from 1 to 12000.")
    }
    return { multiple: false, format: "current", maxDimension }
  }
  if (slug === "image-compress") return { multiple: false, format: "compatible", maxDimension: 2400, quality: 0.72 }
  if (slug === "image-convert" || slug === "image-to-pdf") return { multiple: false, format: "compatible" }
  return { multiple: false, format: "current" }
}

const details: Record<string, Details> = {
  "api-tester": {
    defaultInput: '{"method":"GET","url":"https://example.test/items","headers":{"Accept":"application/json"}}',
    primaryLabel: { zh: "请求定义（JSON）", en: "Request definition (JSON)" },
    run: (input) => ({ output: createRequestPreview(input) }),
  },
  "audio-convert": {
    defaultInput: "input.wav,mp3",
    primaryLabel: { zh: "输入文件名,目标格式", en: "Input filename,target format" },
    run: (input) => {
      const [file = "input.wav", format = "mp3"] = input.split(",").map((part) => part.trim())
      if (!/^(mp3|wav|flac|ogg|aac|m4a|opus)$/i.test(format)) throw new Error("Choose mp3, wav, flac, ogg, aac, m4a or opus.")
      return { output: `ffmpeg -i ${quoteArgument(file)} -vn ${format.toLowerCase() === "mp3" ? "-c:a libmp3lame -q:a 2" : `-f ${format.toLowerCase()}`} ${quoteArgument(`output.${format.toLowerCase()}`)}\n\nThis is a command template only; Kit does not run FFmpeg.` }
    },
  },
  "barcode-generator": {
    defaultInput: "KIT-39",
    run: (input) => ({ output: createCode39Svg(input) }),
  },
  "base64-image": {
    primaryLabel: { zh: "图片 data URL", en: "Image data URL" },
    imagePicker: true,
    pickOptions: (value) => imagePickOptions("base64-image", value),
    run: (input) => {
      if (input.startsWith("data:image/")) {
        const bytes = decodeBase64(input)
        return { output: `Bytes: ${bytes.length}\n\n${input}` }
      }
      const match = input.match(/^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i)
      if (!match) throw new Error("Enter a data:image/...;base64,... URL.")
      const bytes = decodeBase64(match[2]!)
      return { output: `Media type: ${match[1]}\nBytes: ${bytes.length}\nBase64 characters: ${match[2]!.replace(/\s+/g, "").length}\n\n${match[0]}` }
    },
  },
  "bcrypt-hash": {
    defaultInput: "$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234",
    primaryLabel: { zh: "Bcrypt 哈希", en: "Bcrypt hash" },
    primaryPlaceholder: { zh: "$2b$12$...", en: "$2b$12$..." },
    run: (input) => {
      const match = input.trim().match(/^\$2[aby]\$(\d{2})\$[./A-Za-z0-9]{53}$/)
      if (!match) throw new Error("Enter a complete bcrypt hash (60 characters) to inspect its format.")
      return { output: `Valid bcrypt-shaped string\nVariant: ${input.trim().slice(1, 3)}\nCost factor: ${Number(match[1])}\n\nNSH ${NSH_VERSION} has no bcrypt primitive; no hash was generated or verified.` }
    },
  },
  "benchmark-tester": {
    defaultInput: "10000",
    primaryLabel: { zh: "次数 / 数量", en: "Iterations / count" },
    run: (input) => ({ output: runStringBenchmark(input) }),
  },
  "code-formatter": {
    defaultInput: '{"kit":true,"tools":[1,2]}',
    primaryLabel: { zh: "源代码", en: "Source code" },
    secondary: { label: { zh: "语言", en: "Language" }, placeholder: { zh: "json / css / html / xml", en: "json / css / html / xml" }, default: "json" },
    run: (input, secondary) => ({ output: formatCode(input, secondary || "json") }),
  },
  "color-picker": {
    defaultInput: "#4a6b55",
    primaryLabel: { zh: "颜色", en: "Color" },
    primaryPlaceholder: { zh: "#4a6b55", en: "#4a6b55" },
    run: (input) => {
      const hex = input.trim().match(/^#?([\da-f]{3}|[\da-f]{6})$/i)
      if (!hex) throw new Error("Enter a 3- or 6-digit HEX color.")
      const raw = hex[1]!.length === 3 ? [...hex[1]!].map((part) => part + part).join("") : hex[1]!
      const [r, g, b] = [0, 2, 4].map((index) => parseInt(raw.slice(index, index + 2), 16))
      const rgb = `rgb(${r}, ${g}, ${b})`
      return { output: `HEX: #${raw.toUpperCase()}\nRGB: ${rgb}\nHSL: ${rgbToHsl(r!, g!, b!)}` }
    },
  },
  "currency-convert": {
    defaultInput: "25 USD EUR",
    primaryLabel: { zh: "金额 FROM TO", en: "Amount FROM TO" },
    run: (input) => ({ output: convertSampleCurrency(input) }),
  },
  "dns-lookup": {
    defaultInput: "example.com",
    primaryLabel: { zh: "域名", en: "Hostname" },
    primaryPlaceholder: { zh: "example.com", en: "example.com" },
    run: (input) => {
      const host = input.trim().replace(/\.$/, "").toLowerCase()
      if (host.length > 253 || !host.includes(".") || host.split(".").some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))) throw new Error("Enter a valid fully qualified domain name.")
      return { output: `Domain: ${host}\nQuery types: A, AAAA, CNAME, MX, NS, TXT\n\nOffline mode: Kit does not contact a DNS resolver or disclose this domain.` }
    },
  },
  "excel-to-json": {
    defaultInput: "name\tage\nAda\t36",
    primaryLabel: { zh: "制表符分隔表格", en: "Tab-separated table" },
    run: (input) => {
      const rows = input.replace(/^\uFEFF/, "").trim().split(/\r?\n/).map((row) => row.split("\t"))
      if (rows.length < 2) throw new Error("Paste a tab-separated table with a header row and at least one data row.")
      const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")
      const result = csvToJson(csv, { delimiter: ",", hasHeader: true, inferTypes: true })
      if (!result.ok) throw new Error(result.error)
      return { output: result.output }
    },
  },
  "exif-viewer": {
    primaryLabel: { zh: "JPEG data URL", en: "JPEG data URL" },
    imagePicker: true,
    pickOptions: (value) => imagePickOptions("exif-viewer", value),
    run: (input) => ({ output: inspectExif(input) }),
  },
  "favicon-generator": {
    defaultInput: "K, #6b705c, #ffffff",
    primaryLabel: { zh: "文字, 背景色, 前景色", en: "Text, background, foreground" },
    run: (input) => ({ output: createFaviconSvg(input || "K, #6b705c, #ffffff") }),
  },
  "file-hash": {
    defaultInput: "Kit toolbox",
    primaryLabel: { zh: "文本；Base64 请加前缀 base64:", en: "Text; prefix Base64 with base64:" },
    secondary: { label: { zh: "算法", en: "Algorithm" }, placeholder: { zh: "sha256", en: "sha256" }, default: "sha256" },
    run: (input, secondary, option) => {
      const algorithm = (secondary || "sha256").trim().toLowerCase()
      if (!["md5", "sha1", "sha256", "sha384", "sha512"].includes(algorithm)) throw new Error("Choose md5, sha1, sha256, sha384 or sha512.")
      const base64Input = option.toLowerCase() === "base64" || /^base64:/i.test(input)
      const content = base64Input ? decodeBase64(input.replace(/^base64:/i, "")) : input
      return { output: createHash(algorithm).update(content).digest("hex") }
    },
  },
  "gif-split": {
    defaultInput: "input.gif",
    primaryLabel: { zh: "GIF 文件名", en: "GIF filename" },
    run: (input) => {
      const file = input.trim() || "input.gif"
      return { output: `ffmpeg -i ${quoteArgument(file)} -vsync 0 frame-%04d.png\n\nThis command template requires FFmpeg and is not executed by Kit.` }
    },
  },
  "html-preview": {
    defaultInput: '<p>Hello</p><script>alert(1)</script>',
    primaryLabel: { zh: "HTML 源码", en: "HTML source" },
    run: (input) => {
      const result = inspectHtml(input)
      return { output: `Removed unsafe elements/attributes: ${result.removed}\n\nHeuristically cleaned source (not rendered or executed; not a production sanitizer):\n${result.html}` }
    },
  },
  "icon-spriter": {
    defaultInput: '<svg viewBox="0 0 24 24"><rect width="24" height="24"/></svg>\n\n<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
    primaryLabel: { zh: "SVG 文档（可粘贴多个）", en: "SVG documents (one or more)" },
    run: (input) => ({ output: makeSvgSprite(input) }),
  },
  "image-compress": {
    primaryLabel: { zh: "最长边像素（可选）", en: "Maximum dimension (optional)" },
    imagePicker: true,
    pickOptions: (value) => imagePickOptions("image-compress", value),
    run: (input) => {
      if (!input.startsWith("data:image/")) throw new Error("Pick an image first using the system image picker.")
      return { output: input, warning: "The image was prepared by the system picker. Copy the output as a data URL to transfer it." }
    },
  },
  "image-convert": {
    primaryLabel: { zh: "最长边像素（可选）", en: "Maximum dimension (optional)" },
    imagePicker: true,
    pickOptions: (value) => imagePickOptions("image-convert", value),
    run: (input) => {
      if (!input.startsWith("data:image/")) throw new Error("Use the system image picker to convert unsupported photos to JPEG.")
      return { output: input, warning: "The image was prepared by the system picker. Copy the output as a data URL to transfer it." }
    },
  },
  "image-crop": {
    defaultInput: "0,0,640,480",
    primaryLabel: { zh: "x,y,width,height", en: "x,y,width,height" },
    run: (input) => {
      const values = input.split(",").map(Number)
      if (values.length !== 4 || values.some((value) => !Number.isFinite(value) || value < 0)) throw new Error("Enter crop values as x,y,width,height using non-negative numbers.")
      if (values[2] === 0 || values[3] === 0) throw new Error("Crop width and height must be greater than zero.")
      throw new Error("The current NSH cross-platform image API does not expose pixel cropping. The crop rectangle was valid, but no image was changed.")
    },
  },
  "image-resize": {
    defaultInput: "1600",
    primaryLabel: { zh: "最长边像素", en: "Maximum image dimension" },
    imagePicker: true,
    pickOptions: (value) => imagePickOptions("image-resize", value),
    run: (input) => {
      if (!input.startsWith("data:image/")) throw new Error("Pick an image first using the system image picker.")
      return { output: input, warning: "The image was prepared by the system picker. Copy the output as a data URL to transfer it." }
    },
  },
  "image-to-pdf": {
    primaryLabel: { zh: "JPEG data URL", en: "JPEG data URL" },
    imagePicker: true,
    pickOptions: (value) => imagePickOptions("image-to-pdf", value),
    run: (input) => ({ output: jpegToPdfBase64(input) }),
  },
  "ip-info": {
    defaultInput: "192.168.1.42/24",
    primaryLabel: { zh: "IPv4 地址或 CIDR", en: "IPv4 address or CIDR" },
    primaryPlaceholder: { zh: "192.168.1.42/24", en: "192.168.1.42/24" },
    run: (input) => ({ output: inspectIpv4(input) }),
  },
  "json-plot": {
    defaultInput: '[{"label":"A","value":12},{"label":"B","value":24}]',
    primaryLabel: { zh: "JSON 数组", en: "JSON array" },
    secondary: { label: { zh: "标签键,数值键", en: "Label key,value key" }, placeholder: { zh: "label,value", en: "label,value" }, default: "label,value" },
    run: (input, secondary, option) => ({
      output: jsonBarChart(input, (secondary || "label").split(",")[0]!.trim(), (secondary || "label,value").split(",")[1]?.trim() || option || "value"),
    }),
  },
  "jwt-generator": {
    defaultInput: '{"sub":"123","role":"reader"}',
    primaryLabel: { zh: "JWT payload JSON", en: "JWT payload JSON" },
    primaryPlaceholder: { zh: '{"sub":"123","role":"reader"}', en: '{"sub":"123","role":"reader"}' },
    secondary: { label: { zh: "签名密钥", en: "Signing secret" }, placeholder: { zh: "请勿使用生产密钥", en: "Never use a production secret" }, default: "local-test-key" },
    run: (input, secondary) => ({ output: signJwt(input, secondary) }),
  },
  "lorem-image": {
    defaultInput: "640,360,Placeholder,#e8e4d8,#45473d",
    primaryLabel: { zh: "宽,高,标签,背景色,文字色", en: "Width,height,label,background,text color" },
    run: (input) => ({ output: createPlaceholderSvg(input || "640,360,Placeholder,#e8e4d8,#45473d") }),
  },
  "markdown-mermaid": {
    defaultInput: "graph TD\nA[Start] --> B[Finish]",
    primaryLabel: { zh: "Markdown / Mermaid 文本", en: "Markdown / Mermaid text" },
    run: (input) => ({ output: parseMermaid(input) }),
  },
  "markdown-preview": {
    defaultInput: "# Hello\n\n- one\n- two",
    primaryLabel: { zh: "Markdown / Mermaid 文本", en: "Markdown / Mermaid text" },
    run: (input) => ({ output: markdownOutline(input) }),
  },
  "md5-hash": {
    defaultInput: "abc",
    primaryLabel: { zh: "文本", en: "Text" },
    run: (input) => ({ output: hashText(input, "md5") }),
  },
  "merge-pdf": {
    primaryLabel: { zh: "PDF Base64，每行一个文件", en: "PDF Base64, one file per line" },
    run: (input) => ({
      output: `${inspectPdfBase64(input)}\n\nInspection only: merging arbitrary PDFs requires a PDF object parser and file export API, neither of which is available in this portable NSH build.`,
      warning: "PDF files were inspected, not merged.",
    }),
  },
  "password-strength": {
    defaultInput: "correct horse battery staple",
    primaryLabel: { zh: "密码", en: "Password" },
    primaryPlaceholder: { zh: "仅在本地分析，不会保存", en: "Analyzed locally; never stored" },
    run: (input) => {
      const result = passwordStrength(input)
      return { output: `Estimated entropy: ${result.bits} bits\nStrength: ${result.label}\nScore: ${result.percent}/100\n\nThis estimate is approximate and does not model dictionary attacks.` }
    },
  },
  "performance-analyzer": {
    defaultInput: "function greet(name) {\n  if (!name) return \"\";\n  return `Hello, ${name}`;\n}",
    primaryLabel: { zh: "待检查源码", en: "Source to inspect" },
    run: (input) => ({ output: sourceMetrics(input) }),
  },
  "performance-tester": {
    defaultInput: "10000",
    primaryLabel: { zh: "次数 / 数量", en: "Iterations / count" },
    run: (input) => ({ output: runStringBenchmark(input) }),
  },
  "qr-generator": {
    defaultInput: "Kit",
    primaryLabel: { zh: "文本（最多 17 个 UTF-8 字节）", en: "Text (up to 17 UTF-8 bytes)" },
    primaryPlaceholder: { zh: "https://example.test", en: "https://example.test" },
    run: (input) => ({ output: createQrSvg(input) }),
  },
  "sha256-hash": {
    defaultInput: "abc",
    primaryLabel: { zh: "文本", en: "Text" },
    run: (input) => ({ output: hashText(input, "sha256") }),
  },
  "svg-minify": {
    defaultInput: '<svg viewBox="0 0 24 24">\n  <rect width="24" height="24"/>\n</svg>',
    primaryLabel: { zh: "SVG 源码", en: "SVG source" },
    primaryPlaceholder: { zh: '<svg viewBox="0 0 24 24">...</svg>', en: '<svg viewBox="0 0 24 24">...</svg>' },
    run: (input) => ({ output: minifySvg(input) }),
  },
  "text-to-pdf": {
    defaultInput: "Hello, Kit!",
    primaryLabel: { zh: "PDF 文本（单页，Latin-1）", en: "PDF text (one page, Latin-1)" },
    primaryPlaceholder: { zh: "Hello, Kit!", en: "Hello, Kit!" },
    run: (input) => ({ output: `data:application/pdf;base64,${textToPdfBase64(input)}` }),
  },
  "user-agent": {
    defaultInput: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    primaryLabel: { zh: "User-Agent", en: "User-Agent" },
    primaryPlaceholder: { zh: "Mozilla/5.0 ...", en: "Mozilla/5.0 ..." },
    run: (input) => ({ output: analyzeUserAgent(input) }),
  },
  "uuid-batch": {
    defaultInput: "5",
    primaryLabel: { zh: "次数 / 数量", en: "Iterations / count" },
    run: (input) => {
      const count = integerFromText(input, 1, 100, "Count")
      return { output: Array.from({ length: count }, () => randomUUID()).join("\n") }
    },
  },
  "video-trim": {
    defaultInput: "input.mp4,0,10",
    primaryLabel: { zh: "文件名,开始时间,结束时间", en: "Filename,start time,end time" },
    run: (input) => {
      const [file = "input.mp4", startText = "0", endText = "10"] = input.split(",").map((part) => part.trim())
      const start = seconds(startText)
      const end = seconds(endText)
      if (end <= start) throw new Error("End time must be later than start time.")
      return { output: `ffmpeg -ss ${start} -to ${end} -i ${quoteArgument(file)} -c copy ${quoteArgument("trimmed.mp4")}\n\nThis command template requires FFmpeg and is not executed by Kit.` }
    },
  },
  "yaml-to-json": {
    defaultInput: "name: Kit\nitems:\n  - clipboard\n  - formatter\nactive: true",
    primaryLabel: { zh: "YAML", en: "YAML" },
    primaryPlaceholder: { zh: "name: Kit\nitems:\n  - clipboard\n  - formatter", en: "name: Kit\nitems:\n  - clipboard\n  - formatter" },
    run: (input) => ({ output: yamlToJson(input) }),
  },
}

export const legacyToolSpecs: LegacyToolSpec[] = legacyToolMeta.map((meta) => {
  const detail = details[meta.slug]
  if (!detail) throw new Error(`Missing legacy tool specification for ${meta.slug}`)
  return { ...detail, meta }
})

export const legacyToolSpecBySlug = new Map(legacyToolSpecs.map((spec) => [spec.meta.slug, spec]))
