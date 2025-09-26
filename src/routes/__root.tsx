import { createRootRoute, Outlet } from '@tanstack/react-router'
import '../App.css'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { PerformanceMonitor } from '@/components/performance-monitor'
import { isTauri } from '@/lib/utils'
import { useState } from 'react'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        name: 'keywords',
        content: 'AI 工具箱，提供各种 AI 工具和资源，帮助你提高工作效率。',
      },
      {
        name: 'description',
        content: 'AI 工具箱，提供各种 AI 工具和资源，帮助你提高工作效率。',
      },
      { title: 'Kit | Tools' },
      { name: 'author', content: 'Kit' },
      { property: 'og:site_name', content: 'Kit' },
      { property: 'og:image', content: '/logo.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    // scripts: !isTauri()
    //   ? [
    //       {
    //         async: true,
    //         src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3854566314387093',
    //         crossOrigin: 'anonymous',
    //       },
    //     ]
    //   : [],
  }),
  component: () => {
    const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
    return (
      <>
        {!isTauri() && (
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ADSENSE_PUBLISHER_ID"
            crossOrigin="anonymous"
          ></script>
        )}

        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <main className="flex-1 p-4">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>

        <PerformanceMonitor isVisible={showPerformanceMonitor} onToggle={() => setShowPerformanceMonitor(false)} />

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
      </>
    )
  },
})
