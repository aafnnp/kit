import { browser } from "wxt/browser"

export type TargetBrowser = "chrome" | "firefox" | "safari" | "edge" | "opera" | "unknown"

/** 构建目标浏览器（WXT 在构建期注入） */
export const TARGET_BROWSER = (import.meta.env.BROWSER ?? "chrome") as TargetBrowser

export const IS_FIREFOX = TARGET_BROWSER === "firefox"
export const IS_CHROME = TARGET_BROWSER === "chrome"

/** 目标 manifest 版本，本项目统一 MV3 */
export const MANIFEST_VERSION = import.meta.env.MANIFEST_VERSION ?? 3

export const IS_DEV = import.meta.env.DEV

/** 扩展版本号，取自 manifest（构建期由根 package.json 注入） */
export function getExtensionVersion(): string {
  try {
    return browser.runtime.getManifest().version
  } catch {
    return "0.0.0"
  }
}

/** 判断某个 WebExtension API 命名空间在当前浏览器是否可用 */
export function hasApi(namespace: string): boolean {
  return Boolean((browser as unknown as Record<string, unknown>)[namespace])
}
