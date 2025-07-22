import { createRootRoute, Outlet } from '@tanstack/react-router'
import '../App.css'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useEffect } from 'react'

export const Route = createRootRoute({
  component: () => {
    // 初始化时检查系统主题偏好
    useEffect(() => {
      // 从本地存储获取主题设置
      const storedTheme = localStorage.getItem('theme')
      const root = document.documentElement
      
      if (storedTheme === 'dark' || 
          (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }, [])
    
    return (
      <>
        {/* 无障碍跳转链接 */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          跳转到内容
        </a>
        
        <SidebarProvider
          style={
            {
              '--sidebar-width': 'calc(var(--spacing) * 72)',
              '--header-height': 'calc(var(--spacing) * 12)',
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <main id="main-content" className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <Outlet />
                </main>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </>
    )
  },
})
