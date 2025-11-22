import { z } from "zod"

// ==================== Performance Monitor Schemas ====================

/**
 * Performance metrics schema
 * 性能指标类型定义
 */
export const performanceMetricsSchema = z.object({
  renderTime: z.number(),
  memoryUsage: z.number(),
  itemCount: z.number(),
  strategy: z.string(),
  timestamp: z.number(),
})

/**
 * Network info schema
 * 网络信息类型定义
 */
export const networkInfoSchema = z.object({
  effectiveType: z.string(),
  downlink: z.number(),
  rtt: z.number(),
  saveData: z.boolean(),
})

/**
 * Device info schema
 * 设备信息类型定义
 */
export const deviceInfoSchema = z.object({
  isMobile: z.boolean(),
  isTablet: z.boolean(),
  isDesktop: z.boolean(),
  userAgent: z.string(),
})

/**
 * Performance monitor props schema
 * 性能监控组件属性类型定义
 */
export const performanceMonitorPropsSchema = z.object({
  isVisible: z.boolean().optional(),
  onToggle: z.custom<() => void>().optional(),
  className: z.string().optional(),
})

/**
 * Performance stats schema
 * 性能统计类型定义
 */
export const performanceStatsSchema = z.object({
  avgRenderTime: z.number(),
  maxRenderTime: z.number(),
  minRenderTime: z.number(),
  avgMemoryUsage: z.number(),
  maxMemoryUsage: z.number(),
  totalRecords: z.number(),
})

// ==================== Dependency Analyzer Schemas ====================

/**
 * Dependency analysis schema
 * 依赖分析类型定义
 */
export const dependencyAnalysisSchema = z.object({
  heavy: z.array(z.string()),
  optimizable: z.array(z.string()),
  light: z.array(z.string()),
  recommendations: z.array(z.string()),
})

/**
 * Optimization stats schema for dependency analyzer
 * 依赖分析器优化统计类型定义
 */
export const dependencyOptimizationStatsSchema = z.object({
  totalDependencies: z.number(),
  heavyDependencies: z.number(),
  optimizableDependencies: z.number(),
  lightDependencies: z.number(),
  potentialSavings: z.string(),
})

/**
 * Audit totals schema
 * 审计总计类型定义
 */
export const auditTotalsSchema = z.object({
  low: z.number(),
  moderate: z.number(),
  high: z.number(),
  critical: z.number(),
  total: z.number(),
})

/**
 * Audit issues by package schema
 * 按包分组的审计问题类型定义
 */
export const auditIssuesByPkgSchema = z.record(
  z.string(),
  z.object({
    highestSeverity: z.enum(["low", "moderate", "high", "critical"]),
    count: z.number(),
    titles: z.array(z.string()),
  })
)

/**
 * Replacement plan item schema
 * 替换计划项类型定义
 */
export const replacementPlanItemSchema = z.object({
  from: z.string(),
  to: z.string(),
  reason: z.string(),
  severity: z.string().optional(), // Can be "low" | "moderate" | "high" | "critical" but allowing string for flexibility
})

// ==================== Resource Optimization Schemas ====================

/**
 * Optimization stats schema for resource optimization
 * 资源优化统计类型定义
 */
export const resourceOptimizationStatsSchema = z.object({
  iconsLoaded: z.number(),
  iconsCached: z.number(),
  resourcesPreloaded: z.number(),
  dependenciesAnalyzed: z.number(),
  potentialSavings: z.string(),
  optimizationScore: z.number(),
})

// ==================== Cache Strategy Manager Schemas ====================

/**
 * Cache config schema
 * 缓存配置类型定义
 */
export const cacheConfigSchema = z.object({
  maxMemoryUsage: z.number(), // MB
  maxDiskUsage: z.number(), // MB
  compressionEnabled: z.boolean(),
  persistentCacheEnabled: z.boolean(),
  autoCleanupInterval: z.number(), // minutes
})

/**
 * Memory stats schema
 * 内存统计类型定义
 */
export const memoryStatsSchema = z.object({
  usedMemory: z.number(),
  totalMemory: z.number(),
  cacheMemory: z.number(),
  heapUsed: z.number(),
  heapTotal: z.number(),
})

/**
 * Cache strategy stats schema
 * 缓存策略统计类型定义
 */
export const cacheStrategyStatsSchema = z.object({
  memoryStats: memoryStatsSchema,
  diskCacheSize: z.number(),
  compressionRatio: z.number(),
  cleanupCount: z.number(),
  lastCleanup: z.number(),
  persistentCacheHits: z.number(),
  persistentCacheMisses: z.number(),
})

/**
 * Cache strategy manager props schema
 * 缓存策略管理器属性类型定义
 */
export const cacheStrategyManagerPropsSchema = z.object({
  className: z.string().optional(),
})

// ==================== Type Exports ====================

/**
 * Type inference from zod schemas
 * 从 zod schemas 推断 TypeScript 类型
 */

// Performance Monitor Types
export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>
export type NetworkInfo = z.infer<typeof networkInfoSchema>
export type DeviceInfo = z.infer<typeof deviceInfoSchema>
export type PerformanceMonitorProps = z.infer<typeof performanceMonitorPropsSchema>
export type PerformanceStats = z.infer<typeof performanceStatsSchema>

// Dependency Analyzer Types
export type DependencyAnalysis = z.infer<typeof dependencyAnalysisSchema>
export type DependencyOptimizationStats = z.infer<typeof dependencyOptimizationStatsSchema>
export type AuditTotals = z.infer<typeof auditTotalsSchema>
export type AuditIssuesByPkg = z.infer<typeof auditIssuesByPkgSchema>
export type ReplacementPlanItem = z.infer<typeof replacementPlanItemSchema>

// Resource Optimization Types
export type ResourceOptimizationStats = z.infer<typeof resourceOptimizationStatsSchema>

// Cache Strategy Manager Types
export type CacheConfig = z.infer<typeof cacheConfigSchema>
export type MemoryStats = z.infer<typeof memoryStatsSchema>
export type CacheStrategyStats = z.infer<typeof cacheStrategyStatsSchema>
export type CacheStrategyManagerProps = z.infer<typeof cacheStrategyManagerPropsSchema>

