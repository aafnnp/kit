/**
 * Unified logger utility
 * Replaces console.log/warn/error with environment-aware logging
 */

const isDev = import.meta.env.DEV

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args)
    }
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args)
    }
    // In production, could send to error monitoring service
    // Example: errorTrackingService?.captureWarning(...args)
  },
  error: (...args: any[]) => {
    // Errors are always logged, even in production
    console.error(...args)
    // In production, send to error monitoring service
    // Example: errorTrackingService?.captureException(...args)
  },
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args)
    }
  },
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args)
    }
  },
}
