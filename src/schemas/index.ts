/**
 * Unified export for all tool type schemas
 * 统一导出所有工具类型 schemas
 *
 * 注意：由于不同工具可能有相同名称的类型（如 ExportFormat, BatchStatistics 等），
 * 建议直接从各自的 schema 文件导入，而不是从这个统一导出导入。
 *
 * 例如：
 * import type { IPLookupResult } from "@/schemas/ip-info.schema"
 * import type { UserAgentProcessingResult } from "@/schemas/user-agent.schema"
 */

// Common schemas (这些是真正共享的类型)
export * from "./common.schema"
export * from "./shared.schema"

// 工具 schemas 不在这里统一导出，避免命名冲突
// 请直接从各自的文件导入：
// - ./ip-info.schema
// - ./user-agent.schema
// - ./url-parser.schema
// - ./qr-generator.schema
// - ./mime-search.schema
// - ./uuid-generator.schema
// - ./base64-encode.schema
