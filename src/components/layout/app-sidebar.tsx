import * as React from "react"

import { NavMain } from "@/components/layout"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import tools from "@/lib/data"
import { isDesktopApp } from "@/lib/utils"

const data = {
  navMain: tools,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isDesktop = isDesktopApp()

  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
      role="navigation"
      className="sidebar-tablet lg:sidebar-desktop"
    >
      <SidebarContent
        className={`px-2 sm:px-3 ${isDesktop ? "pt-[calc(32px+0.75rem)]" : ""}`}
        role="main"
      >
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  )
}
