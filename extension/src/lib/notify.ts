import { browser } from "wxt/browser"
import { settingsItem } from "./storage"

export type ToastType = "info" | "success" | "error"

export interface ToastPayload {
  id: string
  message: string
  type: ToastType
  timeout: number
}

type ToastListener = (toast: ToastPayload) => void

/**
 * 通知在扩展里有两种归宿：
 * - 有 DOM 的上下文（popup / options）：交给 <ToastHost /> 内联展示
 * - 后台 Service Worker：没有 DOM，降级为系统通知
 *
 * 这样插件调用 `ctx.notify()` 时不需要关心自己跑在哪里。
 */
const listeners = new Set<ToastListener>()

export function subscribeToasts(listener: ToastListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

let seq = 0

export function notify(message: string, options?: { type?: ToastType; timeout?: number }): void {
  const payload: ToastPayload = {
    id: `toast-${Date.now()}-${seq++}`,
    message,
    type: options?.type ?? "info",
    timeout: options?.timeout ?? 2600,
  }

  if (listeners.size > 0) {
    for (const listener of listeners) listener(payload)
    return
  }

  // 后台上下文：没有 UI 订阅者，用系统通知兜底（受偏好设置控制）
  void showSystemNotification(payload).catch(() => {
    console.info("[kit:notify]", message)
  })
}

async function showSystemNotification(payload: ToastPayload): Promise<void> {
  if (!browser.notifications?.create) return

  const settings = await settingsItem.getValue()
  if (settings?.systemNotifications === false) return

  await browser.notifications.create(payload.id, {
    type: "basic",
    iconUrl: browser.runtime.getURL("/icon-128.png"),
    title: "Kit",
    message: payload.message,
  })
}
