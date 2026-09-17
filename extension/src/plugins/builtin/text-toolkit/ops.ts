import { tt } from "@/lib/i18n"

export interface TextOp {
  id: string
  group: string
  label: string
  run: (input: string) => string | Promise<string>
}

export const OP_GROUPS: Array<{ id: string; label: string }> = [
  { id: "json", label: "JSON" },
  { id: "encode", label: tt("编码", "Encoding") },
  { id: "time", label: tt("时间", "Time") },
  { id: "text", label: tt("文本", "Text") },
  { id: "hash", label: tt("哈希", "Hash") },
]

function required(input: string): string {
  if (!input.trim()) throw new Error(tt("请先在左侧输入内容", "Enter some text first"))
  return input
}

function parseJson(input: string): unknown {
  try {
    return JSON.parse(required(input))
  } catch (error) {
    throw new Error(`${tt("JSON 解析失败", "Invalid JSON")}: ${(error as Error).message}`)
  }
}

/** UTF-8 安全的 Base64 编码（直接 btoa 会在非 ASCII 字符上抛错） */
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function decodeBase64(value: string): string {
  const normalized = value.trim().replace(/-/g, "+").replace(/_/g, "/")
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error(tt("不是合法的 Base64 内容", "Not valid Base64"))
  }
  const binary = atob(normalized)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function toDateString(input: string): string {
  const raw = required(input).trim()
  const numeric = Number(raw)

  if (!Number.isFinite(numeric)) {
    const parsed = new Date(raw)
    if (Number.isNaN(parsed.getTime())) throw new Error(tt("无法识别的时间", "Unrecognized time"))
    return formatDate(parsed)
  }

  const milliseconds = raw.replace(/[^\d]/g, "").length <= 10 ? numeric * 1000 : numeric
  return formatDate(new Date(milliseconds))
}

function formatDate(date: Date): string {
  const local = date.toLocaleString()
  return `${local}\n${date.toISOString()}\n${Math.floor(date.getTime() / 1000)} (s)`
}

function toTimestamp(input: string, unit: "s" | "ms"): string {
  const parsed = new Date(required(input).trim())
  if (Number.isNaN(parsed.getTime())) throw new Error(tt("无法识别的时间", "Unrecognized time"))
  return String(unit === "s" ? Math.floor(parsed.getTime() / 1000) : parsed.getTime())
}

async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(required(input)))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function describe(input: string): string {
  const value = required(input)
  const lines = value.split(/\r?\n/)
  const cjk = value.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g)?.length ?? 0
  const words = value.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0

  return [
    `${tt("字符", "Characters")}: ${value.length}`,
    `${tt("不含空格", "Without spaces")}: ${value.replace(/\s/g, "").length}`,
    `${tt("行数", "Lines")}: ${lines.length}`,
    `${tt("CJK 字数", "CJK chars")}: ${cjk}`,
    `${tt("英文词数", "Words")}: ${words}`,
    `${tt("UTF-8 字节", "UTF-8 bytes")}: ${new TextEncoder().encode(value).length}`,
  ].join("\n")
}

export const TEXT_OPS: TextOp[] = [
  {
    id: "json-format",
    group: "json",
    label: tt("格式化", "Format"),
    run: (input) => JSON.stringify(parseJson(input), null, 2),
  },
  {
    id: "json-minify",
    group: "json",
    label: tt("压缩", "Minify"),
    run: (input) => JSON.stringify(parseJson(input)),
  },
  {
    id: "json-sort-keys",
    group: "json",
    label: tt("键排序", "Sort keys"),
    run: (input) => JSON.stringify(sortKeys(parseJson(input)), null, 2),
  },
  {
    id: "base64-encode",
    group: "encode",
    label: "Base64 →",
    run: (input) => encodeBase64(required(input)),
  },
  {
    id: "base64-decode",
    group: "encode",
    label: "← Base64",
    run: (input) => decodeBase64(required(input)),
  },
  {
    id: "url-encode",
    group: "encode",
    label: "URL →",
    run: (input) => encodeURIComponent(required(input)),
  },
  {
    id: "url-decode",
    group: "encode",
    label: "← URL",
    run: (input) => decodeURIComponent(required(input)),
  },
  { id: "ts-to-date", group: "time", label: tt("时间戳 → 时间", "Timestamp → date"), run: toDateString },
  { id: "date-to-ts-s", group: "time", label: tt("时间 → 秒", "Date → seconds"), run: (input) => toTimestamp(input, "s") },
  {
    id: "date-to-ts-ms",
    group: "time",
    label: tt("时间 → 毫秒", "Date → milliseconds"),
    run: (input) => toTimestamp(input, "ms"),
  },
  { id: "upper", group: "text", label: tt("大写", "UPPER"), run: (input) => required(input).toUpperCase() },
  { id: "lower", group: "text", label: tt("小写", "lower"), run: (input) => required(input).toLowerCase() },
  {
    id: "title",
    group: "text",
    label: tt("词首大写", "Title Case"),
    run: (input) => required(input).replace(/\b([a-zA-Z])(\w*)/g, (_, first: string, rest: string) => first.toUpperCase() + rest.toLowerCase()),
  },
  {
    id: "sort-lines",
    group: "text",
    label: tt("行排序", "Sort lines"),
    run: (input) => required(input).split(/\r?\n/).sort((a, b) => a.localeCompare(b)).join("\n"),
  },
  {
    id: "dedupe-lines",
    group: "text",
    label: tt("行去重", "Dedupe lines"),
    run: (input) => [...new Set(required(input).split(/\r?\n/))].join("\n"),
  },
  {
    id: "trim-lines",
    group: "text",
    label: tt("去首尾空格", "Trim lines"),
    run: (input) => required(input).split(/\r?\n/).map((line) => line.trim()).join("\n"),
  },
  {
    id: "remove-blank-lines",
    group: "text",
    label: tt("删空行", "Remove blank lines"),
    run: (input) => required(input).split(/\r?\n/).filter((line) => line.trim()).join("\n"),
  },
  { id: "sha256", group: "hash", label: "SHA-256", run: sha256 },
  { id: "stats", group: "hash", label: tt("统计", "Stats"), run: describe },
]

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortKeys(nested)]),
    )
  }
  return value
}

/**
 * 读取页面当前选中的文本。
 * ⚠️ 会被序列化后在页面里执行，必须自包含。
 */
export function collectSelection(): string {
  return String(globalThis.getSelection?.() ?? "").slice(0, 20_000)
}
