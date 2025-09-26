import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import { ToolCard } from '@/components/tool-card'
import { VirtualToolGrid } from '@/components/virtual-tool-grid'
import { TFunction } from 'i18next'
import { recordPerformanceMetrics } from './performance-monitor'

interface Tool {
  slug: string
  name: string
  icon: string
  href?: string
  desc: string
}

interface Category {
  id: string
  tools: Tool[]
}

interface SmartToolGridProps {
  categories: Category[]
  showFavoriteButton?: boolean
  onToolClick: (tool: Tool) => void
  t: TFunction
  className?: string
  // 渲染策略配置
  forceRenderStrategy?: 'virtual' | 'mobile' | 'traditional' | 'auto'
  // 性能阈值
  virtualThreshold?: number
  mobileThreshold?: number
  // 设备检测
  isMobile?: boolean
  isTablet?: boolean
  // 网络状态
  connectionType?: 'slow-2g' | '2g' | '3g' | '4g' | '5g'
  saveData?: boolean
}

type RenderStrategy = 'virtual' | 'mobile' | 'traditional'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  itemCount: number
  strategy: RenderStrategy
}

export const SmartToolGrid: React.FC<SmartToolGridProps> = ({
  categories,
  showFavoriteButton = true,
  onToolClick,
  t,
  className = '',
  forceRenderStrategy = 'auto',
  virtualThreshold = 50,
  mobileThreshold = 30,
  isMobile = false,
  isTablet = false,
  connectionType = '4g',
  saveData = false,
}) => {
  const [renderStrategy, setRenderStrategy] = useState<RenderStrategy>('traditional')
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // 计算工具总数
  const totalTools = useMemo(() => {
    return categories.reduce((acc, category) => acc + category.tools.length, 0)
  }, [categories])

  // 设备检测
  const deviceInfo = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isTablet: false, isDesktop: true }
    }

    const width = window.innerWidth
    const userAgent = navigator.userAgent.toLowerCase()

    return {
      isMobile:
        isMobile || width < 768 || /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
      isTablet: isTablet || (width >= 768 && width < 1024) || /ipad|android(?!.*mobile)/i.test(userAgent),
      isDesktop: width >= 1024,
    }
  }, [isMobile, isTablet])

  // 网络状态评估
  const networkInfo = useMemo(() => {
    if (typeof navigator === 'undefined') return { isSlow: false, shouldOptimize: false }

    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    const effectiveType = connection?.effectiveType || connectionType
    const downlink = connection?.downlink || 10
    const rtt = connection?.rtt || 50

    const isSlow = effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1 || rtt > 200
    const shouldOptimize = isSlow || saveData || effectiveType === '3g'

    return { isSlow, shouldOptimize, effectiveType, downlink, rtt }
  }, [connectionType, saveData])

  // 智能选择渲染策略
  const determineRenderStrategy = useCallback((): RenderStrategy => {
    if (forceRenderStrategy !== 'auto') {
      return forceRenderStrategy
    }

    // 基于工具数量选择策略
    if (totalTools >= virtualThreshold) {
      return 'virtual'
    }

    // 基于设备类型选择策略
    if (deviceInfo.isMobile || deviceInfo.isTablet) {
      return totalTools >= mobileThreshold ? 'mobile' : 'traditional'
    }

    // 基于网络状态选择策略
    if (networkInfo.shouldOptimize) {
      return totalTools >= mobileThreshold ? 'mobile' : 'traditional'
    }

    // 默认策略
    return 'traditional'
  }, [forceRenderStrategy, totalTools, virtualThreshold, mobileThreshold, deviceInfo, networkInfo])

  // 性能监控
  const measurePerformance = useCallback(
    (strategy: RenderStrategy) => {
      if (typeof window === 'undefined') return

      const startTime = performance.now()
      const startMemory = (performance as any).memory?.usedJSHeapSize || 0

      // 模拟渲染完成
      requestAnimationFrame(() => {
        const endTime = performance.now()
        const endMemory = (performance as any).memory?.usedJSHeapSize || 0

        const metrics = {
          renderTime: endTime - startTime,
          memoryUsage: endMemory - startMemory,
          itemCount: totalTools,
          strategy,
        }

        setPerformanceMetrics(metrics)

        // 记录到性能监控器
        recordPerformanceMetrics(metrics.renderTime, metrics.memoryUsage, metrics.itemCount, metrics.strategy)
      })
    },
    [totalTools]
  )

  // 初始化渲染策略
  useEffect(() => {
    const strategy = determineRenderStrategy()
    setRenderStrategy(strategy)
    setIsInitialized(true)

    // 测量性能
    if (process.env.NODE_ENV === 'development') {
      measurePerformance(strategy)
    }
  }, [determineRenderStrategy, measurePerformance])

  // 渲染策略切换
  const switchStrategy = useCallback(
    (newStrategy: RenderStrategy) => {
      setRenderStrategy(newStrategy)
      measurePerformance(newStrategy)
    },
    [measurePerformance]
  )

  // 渲染传统网格（用于少量工具）
  const renderTraditionalGrid = useCallback(() => {
    return (
      <div className={`space-y-6 sm:space-y-8 ${className}`}>
        {categories.map((category, categoryIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground px-1 sm:px-0">
              {t(`tools.${category.id}`)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 grid-mobile-1 sm:grid-mobile-2 md:grid-tablet-3 lg:grid-desktop-4 xl:grid-desktop-5 2xl:grid-ultrawide-6">
              {category.tools.map((tool, toolIndex) => (
                <motion.div
                  key={tool.slug + toolIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: categoryIndex * 0.1 + toolIndex * 0.05,
                  }}
                >
                  <ToolCard tool={tool} showFavoriteButton={showFavoriteButton} onClick={() => onToolClick(tool)} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    )
  }, [categories, t, showFavoriteButton, onToolClick, className])

  // 渲染策略选择器（开发环境）
  const renderStrategySelector = () => {
    if (process.env.NODE_ENV !== 'development') return null

    return (
      <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">渲染策略调试</span>
          <span className="text-muted-foreground">
            当前: {renderStrategy} | 工具数: {totalTools}
          </span>
        </div>

        <div className="flex gap-2 mb-2">
          {(['traditional', 'mobile', 'virtual'] as const).map((strategy) => (
            <button
              key={strategy}
              onClick={() => switchStrategy(strategy)}
              className={`px-2 py-1 rounded text-xs ${
                renderStrategy === strategy ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {strategy}
            </button>
          ))}
        </div>

        {performanceMetrics && (
          <div className="text-xs text-muted-foreground">
            性能: {performanceMetrics.renderTime.toFixed(2)}ms | 内存:{' '}
            {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-1">
          设备: {deviceInfo.isMobile ? '移动' : deviceInfo.isTablet ? '平板' : '桌面'} | 网络:{' '}
          {networkInfo.effectiveType} | 优化: {networkInfo.shouldOptimize ? '是' : '否'}
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      {renderStrategySelector()}

      {renderStrategy === 'virtual' && (
        <VirtualToolGrid
          categories={categories}
          showFavoriteButton={showFavoriteButton}
          onToolClick={onToolClick}
          t={t}
          className={className}
          isMobile={deviceInfo.isMobile}
          enableVirtualization={true}
          minItemsForVirtualization={virtualThreshold}
        />
      )}

      {renderStrategy === 'traditional' && renderTraditionalGrid()}
    </div>
  )
}

export default SmartToolGrid
