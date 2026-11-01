import { platform } from "nsh"
import { L } from "./locale"

export const isWeb = platform.os === "web"
export const isMac = platform.os === "macos"

export const mod = isMac ? "⌘" : isWeb ? "⌘/Ctrl" : "Ctrl"

export function modKey(key: string): string {
  return `${mod} ${key}`
}

export function modShiftKey(key: string): string {
  return isMac ? `⌘ ⇧ ${key}` : isWeb ? `⌘/Ctrl Shift ${key}` : `Ctrl Shift ${key}`
}

export function platformLabel(): string {
  const labels: Record<string, string> = {
    macos: "macOS",
    windows: "Windows",
    linux: "Linux",
    web: "Web",
    ios: "iOS",
    android: "Android",
  }
  return labels[platform.os] ?? platform.os
}

export function runtimeLabel(): string {
  return L("本地运行时", "Local runtime")
}
