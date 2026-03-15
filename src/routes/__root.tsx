import { createRootRoute, Outlet } from "@tanstack/react-router"
import "../App.css"
import { CustomTitleBar } from "@/components/layout"
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

        <div className="flex min-h-screen flex-1 flex-col">
          <main className="flex-1 p-0">
            <Outlet />
          </main>
        </div>

        <PerformanceMonitor
          isVisible={showPerformanceMonitor}
          onToggle={() => setShowPerformanceMonitor(false)}
        />

        {!showPerformanceMonitor && (
          <button
            onClick={() => setShowPerformanceMonitor(true)}
            className="fixed bottom-4 right-4 inline-flex h-9 items-center justify-center rounded-full border border-border bg-background/90 px-3 text-xs font-medium text-muted-foreground shadow-sm hover:border-primary/40 hover:text-primary transition-colors z-40"
            title={t("routes.root.open-performance-monitor")}
          >
            📊
          </button>
        )}
      </>
    )
  },
})
