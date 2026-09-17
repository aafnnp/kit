import { tt } from "./i18n"
import { createLogger } from "./log"
import { notify } from "./notify"

const log = createLogger("clipboard")

/** 写入纯文本，失败返回 false（不抛异常，方便调用方决定要不要提示） */
export async function writeText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Service Worker 里没有 navigator.clipboard，会在这里被捕获
    log.warn("navigator.clipboard 写入失败，尝试回退方案", error)
  }

  return legacyCopy(text)
}

/** 复制文本并给出统一提示 */
export async function copyText(text: string, label?: string): Promise<boolean> {
  const ok = await writeText(text)
  notify(ok ? (label ?? tt("已复制", "Copied")) : tt("复制失败", "Copy failed"), {
    type: ok ? "success" : "error",
  })
  return ok
}

/** 写入图片（截图 / 二维码），失败返回 false */
export async function writeImage(blob: Blob): Promise<boolean> {
  try {
    const ClipboardItemCtor = globalThis.ClipboardItem as typeof ClipboardItem | undefined
    if (!navigator.clipboard?.write || !ClipboardItemCtor) return false

    const item = new ClipboardItemCtor({ [blob.type]: blob })
    await navigator.clipboard.write([item])
    return true
  } catch (error) {
    log.warn("图片写入剪贴板失败", error)
    return false
  }
}

export async function copyImage(blob: Blob, label?: string): Promise<boolean> {
  const ok = await writeImage(blob)
  notify(ok ? (label ?? tt("已复制图片", "Image copied")) : tt("复制图片失败，请改用下载", "Copy failed, try download"), {
    type: ok ? "success" : "error",
  })
  return ok
}

/**
 * 后台 / 无 clipboard API 时的回退实现。
 * 只在有 DOM 的上下文可用；Service Worker 里直接返回 false。
 */
function legacyCopy(text: string): boolean {
  if (typeof document === "undefined" || !document.body) return false

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.append(textarea)
  textarea.select()

  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}
