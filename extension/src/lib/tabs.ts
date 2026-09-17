import { browser } from "wxt/browser"
import { createLogger } from "./log"

const log = createLogger("tabs")

export interface TabInfo {
  id: number
  windowId: number
  index: number
  active: boolean
  pinned: boolean
  title: string
  url: string
}

/** 浏览器内部页面无法注入脚本，也无法在 activeTab 之外读取 URL */
const RESTRICTED_PROTOCOLS = [
  "chrome:",
  "chrome-extension:",
  "edge:",
  "about:",
  "brave:",
  "opera:",
  "vivaldi:",
  "moz-extension:",
  "resource:",
  "view-source:",
  "devtools:",
  "safari-extension:",
]

const STORE_PAGES = [
  "chromewebstore.google.com",
  "chrome.google.com/webstore",
  "addons.mozilla.org",
  "microsoftedge.microsoft.com",
]

export function isRestrictedUrl(url?: string): boolean {
  if (!url) return true
  if (RESTRICTED_PROTOCOLS.some((protocol) => url.startsWith(protocol))) return true
  return STORE_PAGES.some((host) => url.includes(host))
}

export function toTabInfo(tab: {
  id?: number
  windowId?: number
  index?: number
  active?: boolean
  pinned?: boolean
  title?: string
  url?: string
}): TabInfo | null {
  if (typeof tab.id !== "number") return null

  return {
    id: tab.id,
    windowId: tab.windowId ?? -1,
    index: tab.index ?? 0,
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    title: tab.title ?? "",
    url: tab.url ?? "",
  }
}

/** 当前窗口的活动标签页（popup / 后台菜单点击都适用） */
export async function getActiveTab(): Promise<TabInfo | null> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    return tab ? toTabInfo(tab) : null
  } catch (error) {
    log.warn("读取活动标签页失败", error)
    return null
  }
}

/** 列出全部标签页。读取非活动标签页的 URL / title 需要 `tabs` 权限 */
export async function listTabs(): Promise<TabInfo[]> {
  try {
    const tabs = await browser.tabs.query({})
    return tabs.map(toTabInfo).filter((tab): tab is TabInfo => tab !== null)
  } catch (error) {
    log.warn("读取标签页列表失败", error)
    return []
  }
}

/** 截取指定窗口的可见区域，返回 dataURL */
export async function captureVisibleTab(windowId?: number): Promise<string | null> {
  try {
    return await browser.tabs.captureVisibleTab(windowId ?? browser.windows.WINDOW_ID_CURRENT, {
      format: "png",
    })
  } catch (error) {
    log.warn("截图失败", error)
    return null
  }
}

/**
 * 在页面里执行一次自包含函数（按需注入，不常驻 content script）。
 *
 * ⚠️ 传给浏览器的是函数的**字符串形式**，因此函数体内不能引用任何模块作用域
 * 的变量或 import —— 参数只能通过 `args` 传入，返回值必须是可结构化克隆的普通数据。
 */
export async function executeInTab<Args extends unknown[], Result>(
  tabId: number,
  func: (...args: Args) => Result,
  args?: Args,
): Promise<Result | undefined> {
  try {
    const results = await browser.scripting.executeScript<Args, Result>({
      target: { tabId },
      func,
      args: args ?? ([] as unknown as Args),
    })
    return results[0]?.result
  } catch (error) {
    log.warn("注入页面脚本失败（可能是浏览器内部页面或未授予页面权限）", error)
    return undefined
  }
}

/** 打开（或复用）扩展的独立页面，如 /options.html */
export async function openExtensionPage(path: `/${string}.html`): Promise<void> {
  const url = browser.runtime.getURL(path as Parameters<typeof browser.runtime.getURL>[0])
  const [existing] = await browser.tabs.query({ url })
  if (existing?.id) {
    await browser.tabs.update(existing.id, { active: true })
    return
  }
  await browser.tabs.create({ url })
}

/** 把 dataURL 转成 Blob（下载 / 复制图片用） */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload] = dataUrl.split(",")
  const mime = /data:([^;]+)/.exec(header ?? "")?.[1] ?? "application/octet-stream"
  const binary = atob(payload ?? "")
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/**
 * 触发下载。
 * 延迟 revoke 是刻意的：Firefox / Safari 在同步 revoke 时会取消下载
 * （与主应用 `lib/utils/export-utils.ts` 的约定保持一致）。
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.rel = "noopener"
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function formatTimestamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}
