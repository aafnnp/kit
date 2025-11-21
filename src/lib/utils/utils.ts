import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// 判断是 safari
export function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

export function isDesktopApp(): boolean {
  try {
    // Check if running in Electron by checking userAgent
    const isElectron = typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent)
    // Also check for desktopApi as a fallback
    const hasDesktopApi = typeof window !== "undefined" && typeof window.desktopApi !== "undefined"
    return isElectron || hasDesktopApi
  } catch {
    return false
  }
}

export function getDesktopApi() {
  if (typeof window !== "undefined" && window.desktopApi) {
    return window.desktopApi
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

// Re-export logger for convenience
export { logger } from "../data/logger"
