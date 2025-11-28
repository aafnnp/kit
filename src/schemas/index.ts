/**
 * Unified export for common and shared schemas
 * 统一导出通用和共享的 schemas
 *
 * 注意：工具特定的 schemas 已经迁移到各自的工具目录中。
 * 请直接从工具目录导入：
 *
 * 例如：
 * import type { IPLookupResult } from "@/components/tools/ip-info/schema"
 * import type { UserAgentProcessingResult } from "@/components/tools/user-agent/schema"
 * import type { UUIDResult } from "@/components/tools/uuid-generator/schema"
 */

// Common schemas (这些是真正共享的类型)
export * from "./common.schema"
export * from "./shared.schema"
