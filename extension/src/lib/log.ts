export interface Logger {
  debug(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
}

/**
 * 统一日志前缀，方便在浏览器控制台按 [kit] 过滤。
 * debug 只在开发构建输出，生产构建静默。
 */
export function createLogger(scope: string): Logger {
  const tag = `[kit:${scope}]`

  return {
    debug(...args) {
      if (import.meta.env.DEV) console.debug(tag, ...args)
    },
    info(...args) {
      console.info(tag, ...args)
    },
    warn(...args) {
      console.warn(tag, ...args)
    },
    error(...args) {
      console.error(tag, ...args)
    },
  }
}
