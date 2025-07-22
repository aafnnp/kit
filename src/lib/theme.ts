import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // 从本地存储获取主题设置
    const storedTheme = localStorage.getItem('theme') as Theme | null
    return storedTheme || 'system'
  })

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme('system')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // 初始化和主题变化时更新 DOM
  useEffect(() => {
    updateTheme(theme)
  }, [theme])

  // 更新主题
  function updateTheme(newTheme: Theme) {
    const root = document.documentElement
    const isDark = 
      newTheme === 'dark' || 
      (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    // 更新 DOM 类名
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // 保存到本地存储
    localStorage.setItem('theme', newTheme)
  }

  return { theme, setTheme }
}