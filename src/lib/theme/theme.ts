import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light' | 'system'

const STORAGE_KEY = 'theme'

/**
 * 主题采用模块级单一数据源 + useSyncExternalStore，而不是每个组件各自持有 useState。
 * 这样所有消费者（主题切换器、Toaster 等）共享同一份状态，切换主题时能同步更新。
 */
const listeners = new Set<() => void>()

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light' || value === 'system'
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'system'
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isTheme(stored)) {
      return stored
    }
  } catch {
    // localStorage 在隐私模式或受限 WebView 中可能不可用
  }

  return 'system'
}

let currentTheme: Theme = readStoredTheme()

function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return
  }

  const isDark = theme === 'dark' || (theme === 'system' && prefersDark())

  // 更新 DOM 类名
  document.documentElement.classList.toggle('dark', isDark)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): Theme {
  return currentTheme
}

function getServerSnapshot(): Theme {
  return 'system'
}

/**
 * 设置主题：更新共享状态、写入 DOM 与 localStorage，并通知所有订阅者。
 */
export function setTheme(newTheme: Theme): void {
  currentTheme = newTheme
  applyTheme(newTheme)

  try {
    window.localStorage.setItem(STORAGE_KEY, newTheme)
  } catch {
    // 忽略存储失败，主题在本次会话内依然生效
  }

  listeners.forEach((listener) => listener())
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // 挂载时把当前主题同步到 DOM，避免首帧与存储值不一致
  useEffect(() => {
    applyTheme(currentTheme)
  }, [theme])

  // 监听系统主题变化（仅在 system 模式下生效）
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (currentTheme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // 保持 setTheme 引用稳定，避免下游 effect 依赖它时反复触发
  const setThemeStable = useCallback((newTheme: Theme) => {
    setTheme(newTheme)
  }, [])

  return { theme, setTheme: setThemeStable }
}