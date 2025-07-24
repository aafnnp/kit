import { SidebarTrigger } from '@/components/ui/sidebar'
import { IconSettings } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export function SiteHeader() {
  const { t } = useTranslation()
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-1 p-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            aria-label={t('navigation.settings', '打开设置页面')}
            className="flex items-center justify-center"
          >
            <IconSettings className="!size-4 sm:!size-5 text-primary shrink-0" aria-hidden="true" />
            <span className="sr-only">{t('navigation.settings', '设置')}</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
