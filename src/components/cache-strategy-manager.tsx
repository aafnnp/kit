/**
 * 缓存策略管理组件 - 提供缓存配置和监控界面
 */
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cacheStrategy, type CacheConfig, type CacheStrategyStats } from '@/lib/cache-strategy'
import { cache } from '@/lib/cache'
import { Database, HardDrive, MemoryStick, Settings, Trash2, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react'

interface CacheStrategyManagerProps {
  className?: string
}

export function CacheStrategyManager({ className }: CacheStrategyManagerProps) {
  const [config, setConfig] = useState<CacheConfig>(cacheStrategy.getConfig())
  const [stats, setStats] = useState<CacheStrategyStats>(cacheStrategy.getStats())
  const [memoryStats, setMemoryStats] = useState(cache.getStats())
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 更新统计数据
  const updateStats = () => {
    setStats(cacheStrategy.getStats())
    setMemoryStats(cache.getStats())
    setSuggestions(cacheStrategy.getOptimizationSuggestions())
  }

  // 定期更新统计数据
  useEffect(() => {
    updateStats()
    const interval = setInterval(updateStats, 2000)
    return () => clearInterval(interval)
  }, [])

  // 更新配置
  const handleConfigUpdate = (key: keyof CacheConfig, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    cacheStrategy.updateConfig(newConfig)
  }

  // 清理所有缓存
  const handleClearAll = async () => {
    setIsLoading(true)
    try {
      await cacheStrategy.clearAll()
      updateStats()
    } catch (error) {
      console.error('Failed to clear cache:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 手动清理
  const handleManualCleanup = async () => {
    setIsLoading(true)
    try {
      cache.cleanup()
      updateStats()
    } catch (error) {
      console.error('Failed to cleanup cache:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
  }

  // 计算缓存命中率
  const hitRate =
    memoryStats.hits + memoryStats.misses > 0
      ? ((memoryStats.hits / (memoryStats.hits + memoryStats.misses)) * 100).toFixed(1)
      : '0'

  // 计算持久化缓存命中率
  const persistentHitRate =
    stats.persistentCacheHits + stats.persistentCacheMisses > 0
      ? ((stats.persistentCacheHits / (stats.persistentCacheHits + stats.persistentCacheMisses)) * 100).toFixed(1)
      : '0'

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内存使用</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memoryStats.usedMemory.toFixed(1)} MB</div>
            <Progress value={(stats.memoryStats.usedMemory / config.maxMemoryUsage) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">限制: {config.maxMemoryUsage} MB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">磁盘缓存</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.diskCacheSize.toFixed(1)} MB</div>
            <Progress value={(stats.diskCacheSize / config.maxDiskUsage) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">限制: {config.maxDiskUsage} MB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">缓存命中率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hitRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              命中: {memoryStats.hits} / 未命中: {memoryStats.misses}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">缓存条目</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryStats.size}</div>
            <p className="text-xs text-muted-foreground mt-1">最大: {memoryStats.maxSize}</p>
          </CardContent>
        </Card>
      </div>

      {/* 优化建议 */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              优化建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">
                    建议
                  </Badge>
                  <p className="text-sm text-muted-foreground">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 详细配置和统计 */}
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">缓存配置</TabsTrigger>
          <TabsTrigger value="stats">详细统计</TabsTrigger>
          <TabsTrigger value="actions">操作面板</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                缓存策略配置
              </CardTitle>
              <CardDescription>调整缓存策略以优化应用性能</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxMemoryUsage">最大内存使用 (MB)</Label>
                  <Input
                    id="maxMemoryUsage"
                    type="number"
                    value={config.maxMemoryUsage}
                    onChange={(e) => handleConfigUpdate('maxMemoryUsage', parseInt(e.target.value))}
                    min="10"
                    max="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDiskUsage">最大磁盘使用 (MB)</Label>
                  <Input
                    id="maxDiskUsage"
                    type="number"
                    value={config.maxDiskUsage}
                    onChange={(e) => handleConfigUpdate('maxDiskUsage', parseInt(e.target.value))}
                    min="50"
                    max="5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoCleanupInterval">自动清理间隔 (分钟)</Label>
                  <Input
                    id="autoCleanupInterval"
                    type="number"
                    value={config.autoCleanupInterval}
                    onChange={(e) => handleConfigUpdate('autoCleanupInterval', parseInt(e.target.value))}
                    min="5"
                    max="120"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>启用压缩</Label>
                    <p className="text-sm text-muted-foreground">压缩缓存数据以节省磁盘空间</p>
                  </div>
                  <Switch
                    checked={config.compressionEnabled}
                    onCheckedChange={(checked) => handleConfigUpdate('compressionEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>启用持久化缓存</Label>
                    <p className="text-sm text-muted-foreground">将缓存数据保存到本地存储</p>
                  </div>
                  <Switch
                    checked={config.persistentCacheEnabled}
                    onCheckedChange={(checked) => handleConfigUpdate('persistentCacheEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>内存统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">堆内存使用:</span>
                  <span className="text-sm font-medium">{stats.memoryStats.heapUsed.toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">堆内存总量:</span>
                  <span className="text-sm font-medium">{stats.memoryStats.heapTotal.toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">缓存内存:</span>
                  <span className="text-sm font-medium">{stats.memoryStats.cacheMemory.toFixed(1)} MB</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>缓存统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">内存缓存命中率:</span>
                  <span className="text-sm font-medium">{hitRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">持久化缓存命中率:</span>
                  <span className="text-sm font-medium">{persistentHitRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">压缩比率:</span>
                  <span className="text-sm font-medium">{(stats.compressionRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">清理次数:</span>
                  <span className="text-sm font-medium">{stats.cleanupCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">上次清理:</span>
                  <span className="text-sm font-medium">{formatTime(stats.lastCleanup)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>缓存操作</CardTitle>
              <CardDescription>管理和优化缓存数据</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={updateStats} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新统计
                </Button>

                <Button onClick={handleManualCleanup} variant="outline" className="w-full" disabled={isLoading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  清理过期缓存
                </Button>

                <Button onClick={handleClearAll} variant="destructive" className="w-full" disabled={isLoading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  清空所有缓存
                </Button>
              </div>

              {isLoading && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">正在处理...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CacheStrategyManager
