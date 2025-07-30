import { createRootRoute, Outlet } from '@tanstack/react-router'
import '../App.css'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { PerformanceMonitor } from '@/components/performance-monitor'
import { useState } from 'react'

export const Route = createRootRoute({
  component: () => {
    const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)

    // 移除 codeSplittingManager 相关逻辑

    return (
      <>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <main className="flex-1 p-4">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>

        <PerformanceMonitor isOpen={showPerformanceMonitor} onClose={() => setShowPerformanceMonitor(false)} />

        {/* 性能监控切换按钮 */}
        {!showPerformanceMonitor && (
          <button
            onClick={() => setShowPerformanceMonitor(true)}
            className="fixed bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
            title="打开性能监控"
          >
            📊
          </button>
        )}
        <script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3854566314387093" />
      </>
    )
  },
})
