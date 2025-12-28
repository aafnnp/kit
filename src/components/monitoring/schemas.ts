// ==================== Performance Monitor Types ====================

/**
 * Performance metrics type
 * 性能指标类型定义
 */
export interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  itemCount: number
  strategy: string
  timestamp: number
}

/**
 * Network info type
 * 网络信息类型定义
 */
export interface NetworkInfo {
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}

/**
 * Device info type
 * 设备信息类型定义
 */
export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  userAgent: string
}

/**
 * Performance monitor props type
 * 性能监控组件属性类型定义
 */
export interface PerformanceMonitorProps {
  isVisible?: boolean
  onToggle?: () => void
  className?: string
}

/**
 * Performance stats type
 * 性能统计类型定义
 */
export interface PerformanceStats {
  avgRenderTime: number
  maxRenderTime: number
  minRenderTime: number
  avgMemoryUsage: number
  maxMemoryUsage: number
  totalRecords: number
}

// ==================== Dependency Analyzer Types ====================

/**
 * Dependency analysis type
 * 依赖分析类型定义
 */
export interface DependencyAnalysis {
  heavy: string[]
  optimizable: string[]
  light: string[]
  recommendations: string[]
}

/**
 * Optimization stats type for dependency analyzer
 * 依赖分析器优化统计类型定义
 */
export interface DependencyOptimizationStats {
  totalDependencies: number
  heavyDependencies: number
  optimizableDependencies: number
  lightDependencies: number
  potentialSavings: string
}

/**
 * Audit totals type
 * 审计总计类型定义
 */
export interface AuditTotals {
  low: number
  moderate: number
  high: number
  critical: number
  total: number
}

/**
 * Audit issues by package type
 * 按包分组的审计问题类型定义
 */
export type AuditIssuesByPkg = Record<
  string,
  {
    highestSeverity: "low" | "moderate" | "high" | "critical"
    count: number
    titles: string[]
  }
>

/**
 * Replacement plan item type
 * 替换计划项类型定义
 */
export interface ReplacementPlanItem {
  from: string
  to: string
  reason: string
  severity?: string // Can be "low" | "moderate" | "high" | "critical" but allowing string for flexibility
}

// ==================== Resource Optimization Types ====================

/**
 * Optimization stats type for resource optimization
 * 资源优化统计类型定义
 */
export interface ResourceOptimizationStats {
  iconsLoaded: number
  iconsCached: number
  resourcesPreloaded: number
  dependenciesAnalyzed: number
  potentialSavings: string
  optimizationScore: number
}

// ==================== Cache Strategy Manager Types ====================

/**
 * Cache config type
 * 缓存配置类型定义
 */
export interface CacheConfig {
  maxMemoryUsage: number // MB
  maxDiskUsage: number // MB
  compressionEnabled: boolean
  persistentCacheEnabled: boolean
  autoCleanupInterval: number // minutes
}

/**
 * Memory stats type
 * 内存统计类型定义
 */
export interface MemoryStats {
  usedMemory: number
  totalMemory: number
  cacheMemory: number
  heapUsed: number
  heapTotal: number
}

/**
 * Cache strategy stats type
 * 缓存策略统计类型定义
 */
export interface CacheStrategyStats {
  memoryStats: MemoryStats
  diskCacheSize: number
  compressionRatio: number
  cleanupCount: number
  lastCleanup: number
  persistentCacheHits: number
  persistentCacheMisses: number
}

/**
 * Cache strategy manager props type
 * 缓存策略管理器属性类型定义
 */
export interface CacheStrategyManagerProps {
  className?: string
}
