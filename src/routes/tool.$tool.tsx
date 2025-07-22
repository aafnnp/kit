import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { preloader } from '@/lib/preloader'
import { cache } from '@/lib/cache'
import { motion } from 'motion/react'

// 加载状态组件
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <motion.div
      className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  </div>
)

// 错误状态组件
const ErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-foreground mb-2">加载失败</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        重试
      </button>
    </div>
  </div>
)

const Tool = () => {
  const { tool } = Route.useParams()
  const [DynamicTool, setDynamicTool] = useState<React.ComponentType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadTool = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const modulePath = `/src/components/tools/${tool}.tsx`
      const cacheKey = `tool_${tool}`
      
      // 尝试从缓存获取
      let toolModule = cache.get(cacheKey)
      
      if (!toolModule) {
        // 尝试从预加载器获取
        try {
          toolModule = await preloader.preload(modulePath)
        } catch {
          // 如果预加载失败，使用动态导入
          toolModule = await import(`@/components/tools/${tool}.tsx`)
        }
        
        // 缓存模块
        cache.set(cacheKey, toolModule, 30 * 60 * 1000) // 缓存30分钟
      }
      
      setDynamicTool(() => (toolModule as any).default)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTool()
  }, [tool])

  const retry = () => {
    loadTool()
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorFallback error={error} retry={retry} />
  }

  if (!DynamicTool) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">工具未找到</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4"
      >
        <DynamicTool />
      </motion.div>
    </ErrorBoundary>
  )
}

export const Route = createFileRoute('/tool/$tool')({
  component: Tool,
})
