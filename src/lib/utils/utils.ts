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

/**
 * Format number with locale-specific formatting
 */
export function formatNumber(num: number, options?: { locale?: string; minimumFractionDigits?: number; maximumFractionDigits?: number }): string {
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
