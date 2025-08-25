import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Activity, Zap, Database, Clock, TrendingUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { resourceOptimizer } from '@/lib/resource-optimizer'
import { cache } from '@/lib/cache'
import { preloader } from '@/lib/preloader'
import { useTranslation } from 'react-i18next'

interface PerformanceStats {
  // 代码分割统计
  totalChunks: number
  loadedChunks: number
  failedChunks: number
  loadingChunks: number

  // 缓存统计
  cacheHits: number
  cacheMisses: number
  cacheSize: number
  cacheHitRate: number

  // 资源统计
  loadedResources: number
  loadingResources: number
  cachedIcons: number

  // 预加载统计
  preloadedModules: number
  preloadHits: number
  totalPreloaded: number
  successfulPreloads: number
  failedPreloads: number

  // 性能指标
  averageLoadTime: number
  totalLoadTime: number
  memoryUsage?: number
}

interface PerformanceMonitorProps {
  isOpen: boolean
  onClose: () => void
}

export function PerformanceMonitor({ isOpen, onClose }: PerformanceMonitorProps) {
  const { t } = useTranslation()
  const [stats, setStats] = useState<PerformanceStats>({
    totalChunks: 0,
    loadedChunks: 0,
    failedChunks: 0,
    loadingChunks: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheSize: 0,
    cacheHitRate: 0,
    loadedResources: 0,
    loadingResources: 0,
    cachedIcons: 0,
    preloadedModules: 0,
    preloadHits: 0,
    totalPreloaded: 0,
    successfulPreloads: 0,
    failedPreloads: 0,
    averageLoadTime: 0,
    totalLoadTime: 0,
  })
  const [isRealTime, setIsRealTime] = useState(true)

  // 获取性能统计数据
  const updateStats = () => {
    try {
      const resourceStats = resourceOptimizer.getStats()
      const cacheStats = cache.getStats()
      const preloaderStats = preloader.getStats()

      // 获取内存使用情况（如果支持）
      let memoryUsage: number | undefined
      if ('memory' in performance) {
        const memory = (performance as any).memory
        memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
      }

      // 以真实资源加载条目替代代码分割统计
      const perfResources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const jsResources = perfResources.filter((r) => r.initiatorType === 'script')
      const failedChunks = 0 // 无直接失败指标，保持 0

      setStats({
        totalChunks: jsResources.length,
        loadedChunks: jsResources.length,
        failedChunks,
        loadingChunks: 0,
        cacheHits: cacheStats.hits,
        cacheMisses: cacheStats.misses,
        cacheSize: cacheStats.size,
        cacheHitRate:
          cacheStats.hits + cacheStats.misses > 0 ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100 : 0,
        loadedResources: resourceStats.loadedResources,
        loadingResources: resourceStats.loadingResources,
        cachedIcons: resourceStats.cachedIcons,
        preloadedModules: preloaderStats.preloadedModules,
        preloadHits: preloaderStats.hits,
        totalPreloaded: preloaderStats.total,
        successfulPreloads: preloaderStats.loaded,
        failedPreloads: preloaderStats.total - preloaderStats.loaded,
        averageLoadTime: preloaderStats.averageLoadTime,
        totalLoadTime: preloaderStats.totalLoadTime,
        memoryUsage,
      })
    } catch (error) {
      console.warn('Failed to update performance stats:', error)
    }
  }

  // 实时更新统计数据
  useEffect(() => {
    if (!isOpen || !isRealTime) return

    updateStats()
    const interval = setInterval(updateStats, 1000)
    return () => clearInterval(interval)
  }, [isOpen, isRealTime])

  // 手动刷新
  const handleRefresh = () => {
    updateStats()
  }

  // 清理缓存
  const handleClearCache = () => {
    cache.clear()
    resourceOptimizer.cleanup()
    updateStats()
  }

  // 获取性能等级
  const getPerformanceGrade = () => {
    const { cacheHitRate, averageLoadTime } = stats

    if (cacheHitRate >= 80 && averageLoadTime < 100) return { grade: 'A', color: 'text-green-500' }
    if (cacheHitRate >= 60 && averageLoadTime < 200) return { grade: 'B', color: 'text-blue-500' }
    if (cacheHitRate >= 40 && averageLoadTime < 500) return { grade: 'C', color: 'text-yellow-500' }
    return { grade: 'D', color: 'text-red-500' }
  }

  const performanceGrade = getPerformanceGrade()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background border rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{t('performance.title')}</h2>
                <p className="text-sm text-muted-foreground">{t('performance.desc')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={`${performanceGrade.color} border-current`}>
                {t('performance.level', { level: performanceGrade.grade })}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setIsRealTime(!isRealTime)}>
                {isRealTime ? t('performance.stop') : t('performance.start')}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                {t('performance.refresh')}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-6 space-y-6">
            {/* 概览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('performance.splitSuccessRate')}</CardTitle>
                  <Zap className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalChunks > 0 ? ((stats.loadedChunks / stats.totalChunks) * 100).toFixed(1) : '0'}%
                  </div>
                  <Progress
                    value={stats.totalChunks > 0 ? (stats.loadedChunks / stats.totalChunks) * 100 : 0}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('performance.storageRate')}</CardTitle>
                  <Database className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.cacheHitRate.toFixed(1)}%</div>
                  <Progress value={stats.cacheHitRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('performance.averageLoadTime')}</CardTitle>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageLoadTime.toFixed(0)}ms</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('performance.totalLoadTime')}: {stats.totalLoadTime.toFixed(0)}ms
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('performance.preloadCount')}</CardTitle>
                  <Zap className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.preloadHits}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('performance.preloadedModules')}: {stats.preloadedModules}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('performance.memoryUsage')}</CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.memoryUsage ? `${stats.memoryUsage.toFixed(1)}MB` : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('performance.cacheSize')}: {stats.cacheSize}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 详细统计 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 代码分割统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>{t('performance.codeSplitStats')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance.codeLoaded')}</span>
                    <Badge variant="secondary">{stats.loadedChunks}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance.codeLoading')}</span>
                    <Badge variant="outline">{stats.loadingChunks}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance.codeFailed')}</span>
                    <Badge variant="destructive">{stats.failedChunks}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance.codeTotal')}</span>
                    <Badge variant="secondary">{stats.totalChunks}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 缓存统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>{t('performance.storageStats')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance.storageHits')}</span>
                    <Badge variant="secondary">{stats.cacheHits}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance.storageMisses')}</span>
                    <Badge variant="outline">{stats.cacheMisses}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance.storageTotal')}</span>
                    <Badge variant="secondary">{stats.cacheSize}</Badge>
                  </div>
                  <div className="pt-2">
                    <Button variant="destructive" size="sm" onClick={handleClearCache} className="w-full">
                      {t('performance.clearCache')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 资源统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>{t('performance.resourceStats')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance.resourceLoaded')}</span>
                    <Badge variant="secondary">{stats.loadedResources}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance.resourceLoading')}</span>
                    <Badge variant="outline">{stats.loadingResources}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance.storageIcons')}</span>
                    <Badge variant="secondary">{stats.cachedIcons}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('performance.preloadedModules')}</span>
                    <Badge variant="secondary">{stats.preloadedModules}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 性能建议 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('performance.recommended')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {stats.totalChunks > 0 && stats.loadedChunks / stats.totalChunks < 0.8 && (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <span>⚠️</span>
                      <span>{t('performance.performanceLow')}</span>
                    </div>
                  )}
                  {stats.cacheHitRate < 50 && (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <span>⚠️</span>
                      <span>{t('performance.performanceLow')}</span>
                    </div>
                  )}
                  {stats.averageLoadTime > 500 && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <span>🚨</span>
                      <span>{t('performance.performanceLow')}</span>
                    </div>
                  )}
                  {stats.memoryUsage && stats.memoryUsage > 100 && (
                    <div className="flex items-center space-x-2 text-orange-600">
                      <span>💾</span>
                      <span>{t('performance.performanceLow')}</span>
                    </div>
                  )}
                  {stats.failedChunks > 0 && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <span>❌</span>
                      <span>{t('performance.performanceLow')}</span>
                    </div>
                  )}
                  {stats.cacheHitRate >= 80 && stats.averageLoadTime < 200 && stats.failedChunks === 0 && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <span>✅</span>
                      <span>{t('performance.performanceHight')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PerformanceMonitor
