import * as React from "react"
import { IconInnerShadowTop } from "@tabler/icons-react"

import { NavMain } from "@/components/layout"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link } from "@tanstack/react-router"
import tools from "@/lib/data"
import { useTranslation } from "react-i18next"
import { isDesktopApp } from "@/lib/utils"

const data = {
  navMain: tools,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  const isDesktop = isDesktopApp()

  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
      role="navigation"
      className="sidebar-tablet lg:sidebar-desktop"
    >
      {!isDesktop && (
        <SidebarHeader
          className={`p-3 sm:p-4 ${isDesktop ? "pt-[calc(32px+0.75rem)]" : ""}`}
          role="banner"
        >
          <SidebarMenu className="flex flex-row justify-between">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5! transition-colors hover:bg-primary/10 dark:hover:bg-primary/20 h-9 sm:h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Link
                  to="/"
                  className="flex items-center gap-2"
                >
                  <IconInnerShadowTop className="size-4! sm:size-5! text-primary shrink-0" />
                  <span className="text-sm sm:text-base font-semibold truncate">Kit.</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      )}
      <SidebarContent
        className={`px-2 sm:px-3 ${isDesktop ? "pt-[calc(32px+0.75rem)]" : ""}`}
        role="main"
      >
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  )
}
