export interface PageInfo {
  url: string
  title: string
  description: string
  canonical: string
  siteName: string
  author: string
  publishedTime: string
  ogImage: string
  favicon: string
  lang: string
  faviconCount: number
  h1: string
  headings: number
  links: number
  externalLinks: number
  images: number
  imagesMissingAlt: number
  forms: number
  scripts: number
  wordCount: number
  readingMinutes: number
  selectionLength: number
  jsonLdTypes: string[]
}

/**
 * 采集当前页面信息。
 *
 * ⚠️ 这个函数会被 `scripting.executeScript` 序列化成字符串后在**页面里**执行，
 * 因此：不能引用任何 import / 模块作用域变量 / 闭包变量；
 * 返回值必须是可结构化克隆的普通数据。
 */
export function collectPageInfo(): PageInfo {
  const meta = (selector: string): string => {
    const node = document.querySelector(selector)
    return (node?.getAttribute("content") ?? "").trim()
  }

  const bodyText = (document.body?.innerText ?? "").replace(/\s+/g, " ").trim()
  const cjkCount = bodyText.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g)?.length ?? 0
  const wordCount = bodyText.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0
  const totalWords = cjkCount + wordCount

  const images = Array.from(document.images)
  const links = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[]
  const origin = location.origin

  const jsonLdTypes: string[] = []
  document.querySelectorAll('script[type="application/ld+json"]').forEach((node) => {
    try {
      const parsed: unknown = JSON.parse(node.textContent ?? "null")
      const entries = Array.isArray(parsed) ? parsed : [parsed]
      for (const entry of entries) {
        const type = entry && typeof entry === "object" ? (entry as Record<string, unknown>)["@type"] : null
        if (typeof type === "string" && !jsonLdTypes.includes(type)) jsonLdTypes.push(type)
      }
    } catch {
      // 页面上的 JSON-LD 不合法时直接忽略
    }
  })

  return {
    url: location.href,
    title: document.title.trim(),
    description: meta('meta[name="description"]') || meta('meta[property="og:description"]'),
    canonical: (document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null)?.href ?? "",
    siteName: meta('meta[property="og:site_name"]'),
    author: meta('meta[name="author"]') || meta('meta[property="article:author"]'),
    publishedTime: meta('meta[property="article:published_time"]'),
    ogImage: meta('meta[property="og:image"]'),
    favicon: (document.querySelector('link[rel~="icon"]') as HTMLLinkElement | null)?.href ?? "",
    lang: document.documentElement.lang || "",
    faviconCount: document.querySelectorAll('link[rel~="icon"]').length,
    h1: (document.querySelector("h1")?.textContent ?? "").trim(),
    headings: document.querySelectorAll("h1, h2, h3").length,
    links: links.length,
    externalLinks: links.filter((anchor) => anchor.href.startsWith("http") && !anchor.href.startsWith(origin)).length,
    images: images.length,
    imagesMissingAlt: images.filter((image) => !image.alt.trim() && !image.getAttribute("aria-hidden")).length,
    forms: document.forms.length,
    scripts: document.scripts.length,
    wordCount: totalWords,
    readingMinutes: totalWords === 0 ? 0 : Math.max(1, Math.round(totalWords / 300)),
    selectionLength: String(globalThis.getSelection?.() ?? "").trim().length,
    jsonLdTypes,
  }
}
