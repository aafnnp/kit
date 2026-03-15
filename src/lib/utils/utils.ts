import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  if (bytes === 1) return "1 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"]

  // For values less than 1 KB (but > 1), show as decimal KB
  if (bytes > 1 && bytes < k) {
    const kbValue = bytes / k
    const formatted = kbValue.toFixed(2).replace(/\.?0+$/, "")
    return `${formatted} KB`
  }

  // For values >= 1 KB, calculate the appropriate unit
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const sizeIndex = Math.min(i, sizes.length - 1)
  const value = bytes / Math.pow(k, sizeIndex)

  // Round values close to integers (e.g., 1023 -> 1 KB, 1025 -> 1 KB)
  if (value < 1.1 && sizeIndex > 0) {
    return `1 ${sizes[sizeIndex]}`
  }

  // Format with appropriate precision, remove trailing zeros
  const formatted = value.toFixed(2).replace(/\.?0+$/, "")
  return `${formatted} ${sizes[sizeIndex]}`
}

// 判断是 safari
export function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

/**
 * 判断当前是否为桌面应用环境（Tauri）
 */
export function isDesktopApp(): boolean {
  try {
    // 检查 Tauri 全局对象
    const isTauri = typeof window !== "undefined" && typeof (window as any).__TAURI__ !== "undefined"
    return isTauri
  } catch {
    return false
  }
}

type DesktopApiType = NonNullable<Window["desktopApi"]>

let cachedDesktopApi: (DesktopApiType & { __source?: "tauri" }) | null = null

/**
 * 创建基于 Tauri 的 desktopApi 实现
 */
function createTauriDesktopApi(): DesktopApiType | null {
  if (typeof window === "undefined") {
    return null
  }

  const anyWindow = window as any
  const tauri = anyWindow.__TAURI__

  if (!tauri || !tauri.core || !tauri.event) {
    return null
  }

  const invoke: (cmd: string, args?: Record<string, unknown>) => Promise<any> = tauri.core.invoke
  const listen: (event: string, handler: (event: { payload: any }) => void) => Promise<() => void> = tauri.event.listen
  const relaunchProcess: (() => Promise<void>) | undefined = tauri.process?.relaunch

  const desktopApi: DesktopApiType = {
    relaunch: async () => {
      if (relaunchProcess) {
        await relaunchProcess()
        return
      }
      await invoke("relaunch")
    },
    openExternal: async (url: string) => {
      await invoke("open_external", { url })
    },
    window: {
      minimize: () => invoke("window_minimize"),
      maximize: () => invoke("window_maximize_toggle"),
      close: () => invoke("window_close"),
      isMaximized: () => invoke("window_is_maximized"),
    },
    updater: {
      check: async () => {
        const result = await invoke("updater_check")
        if (!result) return null
        return {
          version: result.version,
          date: result.date,
          body: result.body,
        }
      },
      downloadAndInstall: (cb: (event: any) => void) => {
        return new Promise<void>(async (resolve, reject) => {
          let isResolved = false
          let unlisten: (() => void) | null = null

          const clear = () => {
            if (unlisten) {
              try {
                unlisten()
              } catch {
                // ignore
              }
              unlisten = null
            }
          }

          try {
            unlisten = await listen("updater:progress", (event) => {
              try {
                const payload = event.payload
                // 将 Rust 侧事件转换为与 Tauri Updater 类似的结构
                const mapped =
                  payload && typeof payload === "object"
                    ? (() => {
                        const evt = String(payload.event || "")
                        const data = payload.data || {}
                        if (evt === "Started") {
                          return {
                            event: "Started",
                            data: {
                              contentLength: data.content_length ?? data.contentLength ?? 0,
                            },
                          }
                        }
                        if (evt === "Progress") {
                          return {
                            event: "Progress",
                            data: {
                              downloaded: data.downloaded ?? 0,
                              contentLength: data.content_length ?? data.contentLength ?? 0,
                              chunkLength: data.chunkLength ?? 0,
                            },
                          }
                        }
                        if (evt === "Finished") {
                          return {
                            event: "Finished",
                            data: {},
                          }
                        }
                        return payload
                      })()
                    : payload

                cb(mapped)

                if (mapped && mapped.event === "Finished" && !isResolved) {
                  isResolved = true
                  clear()
                  resolve()
                }
              } catch (error) {
                if (!isResolved) {
                  isResolved = true
                  clear()
                  reject(error)
                }
              }
            })

            await invoke("updater_download_and_install")

            // 防止长时间无响应导致挂起
            setTimeout(() => {
              if (!isResolved) {
                isResolved = true
                clear()
                reject(new Error("Download timeout: No progress events received"))
              }
            }, 300000)
          } catch (error) {
            if (!isResolved) {
              isResolved = true
              clear()
              reject(error)
            }
          }
        })
      },
      install: () => invoke("updater_install"),
    },
  }

  return desktopApi
}

/**
 * 获取统一的桌面端 API 封装：
 * - 优先返回 Tauri 实现
 * - Web 环境返回 null
 */
export function getDesktopApi() {
  if (cachedDesktopApi) {
    return cachedDesktopApi
  }

  if (typeof window === "undefined") {
    return null
  }

  // 优先 Tauri
  const tauriApi = createTauriDesktopApi()
  if (tauriApi) {
    cachedDesktopApi = Object.assign(tauriApi, { __source: "tauri" as const })
    return cachedDesktopApi
  }

  return null
}

/**
 * Debounce function - delays execution until after wait time has passed
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Format number with locale-specific formatting
 */
export function formatNumber(
  num: number,
  options?: { locale?: string; minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  const { locale = "en-US", minimumFractionDigits, maximumFractionDigits } = options || {}
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num)
}

/**
 * Format number with scientific notation for very large or very small numbers
 */
export function formatNumberWithPrecision(num: number, precision: number = 6): string {
  if (Math.abs(num) < 1e-10) return "0"
  if (Math.abs(num) > 1e6 || Math.abs(num) < 1e-3) {
    return num.toExponential(precision)
  }
  return parseFloat(num.toFixed(precision)).toString()
}

// Re-export logger for convenience
export { logger } from "../data/logger"
