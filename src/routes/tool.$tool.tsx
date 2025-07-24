import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useEffect, useState } from 'react'
import { cache } from '@/lib/cache'
import { preloader } from '@/lib/preloader'
import { codeSplittingManager, useLazyTool, useCodeSplitting } from '@/lib/code-splitting'
import tools from '@/lib/data'
import ToolNotFound from '@/components/tools/404'
import { ToolLoading } from '@/components/ui/loading'

export const Route = createFileRoute('/tool/$tool')({
  component: RouteComponent,
})

function RouteComponent() {
  const { tool: toolSlug } = Route.useParams()
  const { component: ToolComponent, loading, error, retry } = useLazyTool(toolSlug)
  const { smartPreload, getStats } = useCodeSplitting()
  
  // 查找工具信息
  const toolInfo = tools.flatMap((category: any) => category.tools).find((t: any) => t.slug === toolSlug)

  useEffect(() => {
    if (!toolInfo) return

    // 智能预加载相关工具
    const recentTools = JSON.parse(localStorage.getItem('recent_tools') || '[]')
    const favoriteTools = JSON.parse(localStorage.getItem('favorite_tools') || '[]')
    
    // 找到当前工具所属分类
    const currentCategory = toolInfo.category || 'text-processing'
    
    smartPreload(recentTools, favoriteTools, currentCategory)

    // 记录工具使用历史
    const updatedRecent = [toolSlug, ...recentTools.filter((t: string) => t !== toolSlug)].slice(0, 10)
    localStorage.setItem('recent_tools', JSON.stringify(updatedRecent))
  }, [toolSlug, toolInfo, smartPreload])

  // 性能监控
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const stats = getStats()
      console.log('Code splitting stats:', stats)
    }
  }, [getStats])

  if (!toolInfo) {
    return <ToolNotFound toolSlug={toolSlug} />
  }

  if (loading) {
    return <ToolLoading toolName={toolInfo.name} />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-destructive">加载失败: {error.message}</p>
        <button 
          onClick={retry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          重试
        </button>
      </div>
    )
  }

  if (!ToolComponent) {
    return <ToolNotFound toolSlug={toolSlug} />
  }

  return (
    <Suspense fallback={<ToolLoading toolName={toolInfo.name} />}>
      <ToolComponent />
    </Suspense>
  )
}
