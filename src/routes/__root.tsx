import { createRootRoute, Outlet } from '@tanstack/react-router'
import '../App.css'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { PerformanceMonitor } from '@/components/performance-monitor'
import { codeSplittingManager } from '@/lib/code-splitting'
import { useEffect, useState } from 'react'

export const Route = createRootRoute({
  component: () => {
    const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)

    useEffect(() => {
      // 初始化代码分割系统
      if (typeof window !== 'undefined') {
        codeSplittingManager.setupLazyLoading()
        
        // 智能预加载常用工具
        const initializeCodeSplitting = async () => {
          try {
            const recentTools = JSON.parse(localStorage.getItem('recent_tools') || '[]')
            const favoriteTools = JSON.parse(localStorage.getItem('favorite_tools') || '[]')
            
            await codeSplittingManager.smartPreload(recentTools, favoriteTools)
          } catch (error) {
            console.warn('Failed to initialize code splitting:', error)
          }
        }

        // 延迟初始化，避免影响初始页面加载
        setTimeout(initializeCodeSplitting, 1000)
      }
    }, [])
    
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
        
        <PerformanceMonitor 
          isOpen={showPerformanceMonitor} 
          onClose={() => setShowPerformanceMonitor(false)} 
        />
        
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
