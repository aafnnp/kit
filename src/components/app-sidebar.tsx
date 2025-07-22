import * as React from 'react'
import { IconInnerShadowTop, IconSettings } from '@tabler/icons-react'

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
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu className="flex flex-row justify-between">
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              className="data-[slot=sidebar-menu-button]:!p-1.5 transition-colors hover:bg-primary/10 dark:hover:bg-primary/20"
            >
              <Link to="/" aria-label={t('首页')}>
                <IconInnerShadowTop className="!size-5 text-primary" />
                <span className="text-base font-semibold">Kit.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              className="data-[slot=sidebar-menu-button]:!p-1.5 transition-colors hover:bg-primary/10 dark:hover:bg-primary/20"
            >
              <Link to="/settings" aria-label={t('设置')}>
                <IconSettings className="!size-5 text-primary" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  )
}
