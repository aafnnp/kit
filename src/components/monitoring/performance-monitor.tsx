import React, { useState, useEffect } from "react"
import { perfBus } from "@/lib/performance"
import { motion } from "motion/react"
import { Activity, Monitor, Zap, Smartphone, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  itemCount: number
  strategy: string
  timestamp: number
}

interface NetworkInfo {
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}

interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  userAgent: string
}

interface PerformanceMonitorProps {
  isVisible?: boolean
  onToggle?: () => void
  className?: string
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false,
  onToggle,
  className = "",
}) => {
  const { t } = useTranslation()
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  // 由 perf.ts 统一上报长任务，无需本地 Observer

  // 订阅 perf 事件（TTI/工具交互/Worker 任务/WebVitals/长任务）
  useEffect(() => {
    if (!isRecording) return
    const offTTI = perfBus.on("tti", ({ ms }) => {
      setMetrics((prev) => [
        { renderTime: ms, memoryUsage: 0, itemCount: 0, strategy: "TTI", timestamp: Date.now() },
        ...prev,
      ])
    })
    const offTool = perfBus.on("tool_interactive", ({ slug, ms }) => {
      setMetrics((prev) => [
        { renderTime: ms, memoryUsage: 0, itemCount: 0, strategy: `tool:${slug}`, timestamp: Date.now() },
        ...prev,
      ])
    })
    const offWorker = perfBus.on("worker_task", ({ type, ms }) => {
      setMetrics((prev) => [
        { renderTime: ms, memoryUsage: 0, itemCount: 0, strategy: `worker:${type}`, timestamp: Date.now() },
        ...prev,
      ])
    })
    const offLCP = perfBus.on("lcp", ({ value }) => {
      setMetrics((prev) => [
        { renderTime: value, memoryUsage: 0, itemCount: 0, strategy: "LCP", timestamp: Date.now() },
        ...prev,
      ])
    })
    const offCLS = perfBus.on("cls", ({ value }) => {
      setMetrics((prev) => [
        { renderTime: value, memoryUsage: 0, itemCount: 0, strategy: "CLS", timestamp: Date.now() },
        ...prev,
      ])
    })
    const offINP = perfBus.on("inp", ({ value }) => {
      setMetrics((prev) => [
        { renderTime: value, memoryUsage: 0, itemCount: 0, strategy: "INP", timestamp: Date.now() },
        ...prev,
      ])
    })
    const offLong = perfBus.on("longtask", ({ duration }) => {
      setMetrics((prev) => [
        { renderTime: duration, memoryUsage: 0, itemCount: 0, strategy: "longtask", timestamp: Date.now() },
        ...prev,
      ])
    })
    return () => {
      offTTI()
      offTool()
      offWorker()
      offLCP()
      offCLS()
      offINP()
      offLong()
    }
  }, [isRecording])

  // 获取网络信息
  useEffect(() => {
    if (typeof navigator === "undefined") return

    const updateNetworkInfo = () => {
      const connection =
        (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

      if (connection) {
        setNetworkInfo({
          effectiveType: connection.effectiveType || "unknown",
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false,
        })
      }
    }

    updateNetworkInfo()

    // 监听网络变化
    const connection = (navigator as any).connection
    if (connection && connection.addEventListener) {
      connection.addEventListener("change", updateNetworkInfo)
      return () => {
        connection.removeEventListener("change", updateNetworkInfo)
      }
    }
  }, [])

  // 获取设备信息
  useEffect(() => {
    if (typeof window === "undefined") return

    const width = window.innerWidth
    const userAgent = navigator.userAgent

    setDeviceInfo({
      isMobile: width < 768 || /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
      isTablet: (width >= 768 && width < 1024) || /ipad|android(?!.*mobile)/i.test(userAgent),
      isDesktop: width >= 1024,
      userAgent: userAgent.substring(0, 50) + "...",
    })
  }, [])

  // 本地独立 PerformanceObserver 已由 perf.ts 统一上报，无需重复监听
  // 保留 ref 以兼容早期实现，但不再使用

  // 记录性能指标（内部使用）
  // const recordMetrics = useCallback((newMetrics: Omit<PerformanceMetrics, 'timestamp'>) => {
  //   const metric: PerformanceMetrics = {
  //     ...newMetrics,
  //     timestamp: Date.now(),
  //   }

  //   setMetrics((prev) => {
  //     const updated = [...prev, metric].slice(-10) // 保留最近10条记录
  //     return updated
  //   })
  // }, [])

  // 清除记录
  const clearMetrics = () => {
    setMetrics([])
  }

  // 获取性能统计
  const getStats = () => {
    if (metrics.length === 0) return null

    const renderTimes = metrics.map((m) => m.renderTime)
    const memoryUsages = metrics.map((m) => m.memoryUsage)

    return {
      avgRenderTime: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length,
      maxRenderTime: Math.max(...renderTimes),
      minRenderTime: Math.min(...renderTimes),
      avgMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      maxMemoryUsage: Math.max(...memoryUsages),
      totalRecords: metrics.length,
    }
  }

  const stats = getStats()

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className={`fixed bottom-4 right-4 z-50 ${className}`}
        aria-label={t("performanceMonitor.open-monitor")}
      >
        <Monitor className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-auto ${className}`}
    >
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t("performanceMonitor.title")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsRecording(!isRecording)}
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                className="h-6 px-2 text-xs"
              >
                {isRecording ? t("common.stop") : t("common.start")}
              </Button>
              <Button
                onClick={onToggle}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          {/* 设备信息 */}
          {deviceInfo && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                {t("performanceMonitor.device-info")}
              </h4>
              <div className="space-y-1 text-muted-foreground">
                <div>
                  {t("common.type")}:{" "}
                  {deviceInfo.isMobile
                    ? t("performanceMonitor.device-type-mobile")
                    : deviceInfo.isTablet
                      ? t("performanceMonitor.device-type-tablet")
                      : t("performanceMonitor.device-type-desktop")}
                </div>
                <div>
                  {t("performanceMonitor.screen-size")}: {window.innerWidth}×{window.innerHeight}
                </div>
                <div className="truncate">UA: {deviceInfo.userAgent}</div>
              </div>
            </div>
          )}

          {/* 网络信息 */}
          {networkInfo && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-1">
                {networkInfo.saveData ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                {t("performanceMonitor.network-status")}
              </h4>
              <div className="space-y-1 text-muted-foreground">
                <div>类型: {networkInfo.effectiveType}</div>
                <div>下行: {networkInfo.downlink} Mbps</div>
                <div>延迟: {networkInfo.rtt} ms</div>
                <div>
                  {t("performanceMonitor.data-saver")}:{" "}
                  {networkInfo.saveData
                    ? t("performanceMonitor.data-saver-on")
                    : t("performanceMonitor.data-saver-off")}
                </div>
              </div>
            </div>
          )}

          {/* 性能统计 */}
          {stats && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {t("performanceMonitor.performance-stats")}
              </h4>
              <div className="space-y-1 text-muted-foreground">
                <div>
                  {t("performanceMonitor.avg-render")}: {stats.avgRenderTime.toFixed(2)}ms
                </div>
                <div>
                  {t("performanceMonitor.max-render")}: {stats.maxRenderTime.toFixed(2)}ms
                </div>
                <div>
                  {t("performanceMonitor.avg-memory")}: {(stats.avgMemoryUsage / 1024 / 1024).toFixed(2)}MB
                </div>
                <div>
                  {t("performanceMonitor.record-count")}: {stats.totalRecords}
                </div>
              </div>
            </div>
          )}

          {/* 最近记录 */}
          {metrics.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{t("performanceMonitor.recent-records")}</h4>
                <Button
                  onClick={clearMetrics}
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-xs"
                >
                  {t("performanceMonitor.clear-records")}
                </Button>
              </div>
              <div className="space-y-1 max-h-20 overflow-auto">
                {metrics
                  .slice(-5)
                  .reverse()
                  .map((metric) => (
                    <div
                      key={metric.timestamp}
                      className="text-muted-foreground text-xs"
                    >
                      {metric.strategy}: {metric.renderTime.toFixed(1)}ms |{metric.itemCount}项 |
                      {(metric.memoryUsage / 1024 / 1024).toFixed(1)}MB
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 使用说明 */}
          <div className="text-muted-foreground text-xs border-t pt-2">
            <div>• {t("performanceMonitor.instruction-1")}</div>
            <div>• {t("performanceMonitor.instruction-2")}</div>
            <div>• {t("performanceMonitor.instruction-3")}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// 导出用于记录性能指标的函数
export const recordPerformanceMetrics = (
  renderTime: number,
  memoryUsage: number,
  itemCount: number,
  strategy: string
) => {
  // 这个函数可以被其他组件调用来记录性能指标
  if (typeof window !== "undefined" && (window as any).__performanceMonitor) {
    ;(window as any).__performanceMonitor.recordMetrics({
      renderTime,
      memoryUsage,
      itemCount,
      strategy,
    })
  }
}

export default PerformanceMonitor
