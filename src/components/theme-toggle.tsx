import { IconMoon, IconSun, IconDeviceDesktop } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTheme } from '@/lib/theme'
import { useTranslation } from 'react-i18next'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return t('theme.light', '浅色模式')
      case 'dark': return t('theme.dark', '深色模式')
      case 'system': return t('theme.system', '系统模式')
      default: return t('theme.toggle', '切换主题')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full hover:bg-accent/80 dark:hover:bg-accent/60 transition-all duration-300 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`${t('theme.toggle', '切换主题')} - ${t('theme.current', '当前')}: ${getThemeLabel()}`}
          aria-haspopup="menu"
          aria-expanded={false}
        >
          <IconSun className="h-4 w-4 rotate-0 scale-100 transition-all duration-500 ease-in-out dark:rotate-180 dark:scale-0 text-amber-500 dark:text-amber-400" aria-hidden="true" />
          <IconMoon className="absolute h-4 w-4 rotate-180 scale-0 transition-all duration-500 ease-in-out dark:rotate-0 dark:scale-100 text-slate-700 dark:text-blue-300" aria-hidden="true" />
          <span className="sr-only">{getThemeLabel()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 dark:bg-popover/95 dark:backdrop-blur-sm dark:border-border/50"
        role="menu"
        aria-label={t('theme.menu', '主题选择菜单')}
      >
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={`cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
            theme === 'light' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/80 dark:hover:bg-accent/60'
          }`}
          role="menuitemradio"
          aria-checked={theme === 'light'}
          tabIndex={0}
        >
          <IconSun className="mr-2 h-4 w-4 text-amber-500" aria-hidden="true" />
          <span>{t('theme.light', '浅色')}</span>
          {theme === 'light' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={`cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
            theme === 'dark' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/80 dark:hover:bg-accent/60'
          }`}
          role="menuitemradio"
          aria-checked={theme === 'dark'}
          tabIndex={0}
        >
          <IconMoon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-300" aria-hidden="true" />
          <span>{t('theme.dark', '深色')}</span>
          {theme === 'dark' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={`cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
            theme === 'system' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/80 dark:hover:bg-accent/60'
          }`}
          role="menuitemradio"
          aria-checked={theme === 'system'}
          tabIndex={0}
        >
          <IconDeviceDesktop className="mr-2 h-4 w-4 text-slate-600 dark:text-slate-300" aria-hidden="true" />
          <span>{t('theme.system', '系统')}</span>
          {theme === 'system' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
