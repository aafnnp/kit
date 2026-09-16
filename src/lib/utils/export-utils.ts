/**
 * 导出相关共享工具：转义 + 下载。
 *
 * 背景：此前每个工具各自内联 `"...${value}..."` 之类的拼接与
 * Blob → createObjectURL → anchor → revoke 流程，导致三类系统性缺陷：
 *  1. CSV 未把内嵌引号翻倍（RFC 4180），并存在公式注入风险；
 *  2. XML / HTML / YAML 直接插值用户数据（注入 / XSS）；
 *  3. `click()` 之后同步 `revokeObjectURL`，在 Firefox / Safari 中会取消下载，
 *     以及对象 URL 从未释放造成泄漏。
 *
 * 所有导出路径都应改为复用本模块。
 */

/** CSV 中需要触发公式注入防护的前导字符（Excel / LibreOffice / Sheets）。 */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/

export interface EscapeCsvCellOptions {
  /**
   * 是否对 `=`、`+`、`-`、`@`、制表符、回车 开头的单元格做公式注入防护。
   * 默认开启；关闭可保留原始值（例如需要精确往返的转换工具）。
   */
  sanitizeFormulas?: boolean
}

/**
 * 按 RFC 4180 转义单个 CSV 单元格。
 *
 * - 始终使用双引号包裹，并跳过 `String(null)` / `String(undefined)` 之类的噪音；
 * - 内嵌的 `"` 会翻倍为 `""`；
 * - 默认对公式前缀加单引号，避免在表格软件中被当作公式执行。
 */
export function escapeCsvCell(value: unknown, options: EscapeCsvCellOptions = {}): string {
  const { sanitizeFormulas = true } = options

  let text = value === null || value === undefined ? "" : String(value)

  if (sanitizeFormulas && FORMULA_TRIGGER.test(text)) {
    text = `'${text}`
  }

  return `"${text.replace(/"/g, '""')}"`
}

export interface ToCsvOptions extends EscapeCsvCellOptions {
  /** 列分隔符，默认逗号。 */
  delimiter?: string
  /** 行分隔符，默认 CRLF（Excel 兼容性最好）。 */
  eol?: string
  /** 是否输出 UTF-8 BOM，便于 Excel 正确识别非 ASCII 内容。 */
  includeBom?: boolean
  /** 是否输出表头行（rows 的第一行）。默认 `true`。 */
  includeHeader?: boolean
}

/**
 * 把二维数组序列化为 CSV 文本。
 */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<unknown>>, options: ToCsvOptions = {}): string {
  const { delimiter = ",", eol = "\r\n", includeBom = false, includeHeader = true } = options

  const body = rows
    .map((row, index) => {
      if (index === 0 && !includeHeader) {
        return null
      }
      return row.map((cell) => escapeCsvCell(cell, options)).join(delimiter)
    })
    .filter((line): line is string => line !== null)
    .join(eol)

  return includeBom ? `\uFEFF${body}` : body
}

/**
 * 转义 HTML 文本节点 / 属性值中的危险字符。
 * 用于导出 `.html`、`dangerouslySetInnerHTML` 等场景，阻断 XSS。
 */
export function escapeHtml(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value)

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** 转义 XML 文本内容。与 HTML 类似，但不转义引号以外的实体不做简化处理。 */
export function escapeXmlText(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value)

  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/** 转义 XML 属性值（含引号）。 */
export function escapeXmlAttr(value: unknown): string {
  return escapeXmlText(value).replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

/**
 * 生成 YAML 中安全的标量。
 *
 * 无法用纯量安全表达时（含特殊字符 / 前导指示符 / 空白 / 换行）回退为双引号字符串，
 * 并对 `\` 与 `"` 转义，避免破坏文档结构。
 */
export function escapeYamlScalar(value: unknown): string {
  if (value === null || value === undefined) {
    return "null"
  }

  if (typeof value === "number") {
    // 非有限值（NaN / Infinity）不加引号会被 YAML 当作普通字符串，
    // 与数值类型产生歧义，因此统一转为带引号的字符串
    return Number.isFinite(value) ? String(value) : `"${String(value)}"`
  }

  if (typeof value === "boolean") {
    return String(value)
  }

  const text = String(value)

  if (text === "") {
    return '""'
  }

  // 安全纯量：不含指示符/控制字符，且不是会被误判的类型关键字
  const isPlainSafe =
    /^[A-Za-z0-9_][A-Za-z0-9_\-./ ]*$/.test(text) &&
    !/^(true|false|null|yes|no|on|off|~)$/i.test(text) &&
    text.trim() === text

  if (isPlainSafe) {
    return text
  }

  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")

  return `"${escaped}"`
}

/**
 * 触发浏览器下载并安全释放对象 URL。
 *
 * 关键点：不要在 `click()` 之后同步 `revokeObjectURL`，
 * 否则 Firefox / Safari 会取消尚未真正开始的下载。
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.rel = "noopener"
  link.style.display = "none"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // 延后释放，给浏览器足够时间接管下载
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** 把文本内容包装成 Blob 并下载。 */
export function downloadText(content: string, filename: string, mimeType = "text/plain;charset=utf-8"): void {
  downloadBlob(new Blob([content], { type: mimeType }), filename)
}

/** 下载 CSV（默认带 UTF-8 BOM，便于 Excel 打开中文）。 */
export function downloadCsv(
  rows: ReadonlyArray<ReadonlyArray<unknown>>,
  filename: string,
  options: ToCsvOptions = {},
): void {
  const csv = toCsv(rows, { includeBom: true, ...options })
  downloadText(csv, filename, "text/csv;charset=utf-8")
}

/** 把任意文本组装为完整 HTML 文档（调用方仍需自行 escapeHtml 插值内容）。 */
export function createHtmlDocument(title: string, body: string, head = ""): string {
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(title)}</title>`,
    head,
    "</head>",
    "<body>",
    body,
    "</body>",
    "</html>",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
