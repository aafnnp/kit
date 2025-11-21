import { createRootRoute, Outlet } from "@tanstack/react-router"
import "../App.css"
import { AppSidebar, SiteHeader, CustomTitleBar } from "@/components/layout"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PerformanceMonitor } from "@/components/monitoring"
import { isDesktopApp } from "@/lib/utils"
import { useState, useEffect } from "react"
import { scheduleTTIMeasure, initWebVitals, initLongTaskObserver } from "@/lib/performance"
import { useTranslation } from "react-i18next"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        name: "keywords",
        content: "AI 工具箱，提供各种 AI 工具和资源，帮助你提高工作效率。",
      },
      {
        name: "description",
        content: "AI 工具箱，提供各种 AI 工具和资源，帮助你提高工作效率。",
      },
      { title: "Kit | Tools" },
      { name: "author", content: "Kit" },
      { property: "og:site_name", content: "Kit" },
      { property: "og:image", content: "/logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const { t } = useTranslation()
    const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
    useEffect(() => {
      scheduleTTIMeasure()
      initWebVitals()
      initLongTaskObserver()
    }, [])
    return (
      <>
        {!isDesktopApp() && (
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3854566314387093"
            crossOrigin="anonymous"
          ></script>
        )}

        <CustomTitleBar />

        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col">
            {!isDesktopApp() && <SiteHeader />}
            <main className="flex-1 p-4">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>

        <PerformanceMonitor
          isVisible={showPerformanceMonitor}
          onToggle={() => setShowPerformanceMonitor(false)}
        />

        {/* 性能监控切换按钮 */}
        {!showPerformanceMonitor && (
          <button
            onClick={() => setShowPerformanceMonitor(true)}
            className="fixed bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
            title={t("routes.root.open-performance-monitor")}
          >
            📊
          </button>
        )}
      </>
    )
  },
})
