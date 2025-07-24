import * as React from 'react'
import { IconInnerShadowTop } from '@tabler/icons-react'

import { NavMain } from '@/components/nav-main'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Link } from '@tanstack/react-router'
import tools from '@/lib/data'
import { useTranslation } from 'react-i18next'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/logo.png',
  },
  navMain: tools,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()

  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
      role="navigation"
      aria-label={t('sidebar.navigation', '主导航')}
      className="sidebar-tablet lg:sidebar-desktop"
    >
      <SidebarHeader className="p-3 sm:p-4" role="banner">
        <SidebarMenu className="flex flex-row justify-between">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 transition-colors hover:bg-primary/10 dark:hover:bg-primary/20 h-9 sm:h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Link to="/" aria-label={t('navigation.home', '返回首页')} className="flex items-center gap-2">
                <IconInnerShadowTop className="!size-4 sm:!size-5 text-primary shrink-0" aria-hidden="true" />
                <span className="text-sm sm:text-base font-semibold truncate">Kit.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 sm:px-3" role="main" aria-label={t('sidebar.tools', '工具列表')}>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  )
}
