/**
 * SVG 消毒工具。
 *
 * 用于「把字符串形式的 SVG 交给 DOM / dangerouslySetInnerHTML 渲染」的场景
 * （例如 `resource-optimizer.mountSprite`、icon-spriter 的图标预览）。
 * 直接写入 innerHTML 会让 SVG 内的 <script>、事件属性或 javascript: 链接拥有
 * 与页面同源的执行权限 —— 在 Tauri 桌面端还意味着可以访问原生 IPC。
 *
 * 处理策略：严格按 XML 解析 → 移除危险标签 / 事件属性 / 危险协议 → 重新序列化。
 * 解析失败时返回空串（宁可什么都不渲染，也不渲染未消毒的内容）。
 */

/** 允许保留的 SVG 标签之外的这些标签一律移除。 */
const FORBIDDEN_TAGS = new Set([
  "script",
  "foreignobject",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "base",
  "audio",
  "video",
  "source",
  "track",
])

/** 属性值中允许出现的 data: 图片类型（其余 data: 一律移除）。 */
const SAFE_DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp|avif);/i

/** 危险协议。 */
const DANGEROUS_PROTOCOL = /^[\s\u0000-\u001f]*(javascript|vbscript|data):/i

/** 需要做「仅允许同文档引用」校验的属性。 */
const URL_ATTRIBUTES = new Set(["href", "xlink:href", "src", "action", "formaction"])

function isAllowedUrl(value: string): boolean {
  const trimmed = value.trim()

  // 同文档引用（如 <use href="#icon">）与安全的内嵌图片
  if (trimmed.startsWith("#")) return true
  if (SAFE_DATA_IMAGE.test(trimmed)) return true

  return !DANGEROUS_PROTOCOL.test(trimmed)
}

function sanitizeElement(element: Element): void {
  const tagName = element.tagName.toLowerCase()

  if (FORBIDDEN_TAGS.has(tagName)) {
    element.remove()
    return
  }

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase()
    const value = attribute.value

    // 事件处理器属性（onload / onclick / onbegin ...）
    if (name.startsWith("on")) {
      element.removeAttribute(attribute.name)
      continue
    }

    if (URL_ATTRIBUTES.has(name) || name.endsWith(":href")) {
      if (!isAllowedUrl(value)) {
        element.removeAttribute(attribute.name)
      }
      continue
    }

    // 其它属性里内联的危险协议（如 style 中的 url(javascript:...)）
    if (DANGEROUS_PROTOCOL.test(value) && !SAFE_DATA_IMAGE.test(value.trim())) {
      element.removeAttribute(attribute.name)
    }
  }
}

/**
 * 消毒 SVG 标记。
 *
 * @param markup 原始 SVG 字符串（不可信）
 * @returns 可安全写入 DOM 的 SVG 字符串；无法安全处理时返回 `""`
 */
export function sanitizeSvgMarkup(markup: unknown): string {
  if (typeof markup !== "string" || markup.trim() === "") {
    return ""
  }

  // 没有 DOM（SSR / 测试环境）时不做任何猜测，直接拒绝
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return ""
  }

  let doc: Document
  try {
    doc = new DOMParser().parseFromString(markup, "image/svg+xml")
  } catch {
    return ""
  }

  // 严格 XML 解析：格式非法（含未闭合标签）会被拒绝
  if (doc.getElementsByTagName("parsererror").length > 0) {
    return ""
  }

  const root = doc.documentElement
  if (!root || root.tagName.toLowerCase() !== "svg") {
    return ""
  }

  sanitizeElement(root)

  // 子树逐层处理（sanitizeElement 可能移除节点，因此每轮重新查询）
  const descendants = Array.from(root.querySelectorAll("*"))
  for (const element of descendants) {
    sanitizeElement(element)
  }

  try {
    return new XMLSerializer().serializeToString(root)
  } catch {
    return ""
  }
}
