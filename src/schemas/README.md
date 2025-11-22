# Tool Type Schemas

本目录包含所有工具类型的 Zod schema 定义。

## 已转换的类型文件

- ✅ `common.schema.ts` - 通用类型
- ✅ `shared.schema.ts` - 共享类型
- ✅ `ip-info.schema.ts` - IP 信息工具
- ✅ `user-agent.schema.ts` - User Agent 工具
- ✅ `url-parser.schema.ts` - URL 解析工具
- ✅ `qr-generator.schema.ts` - QR 码生成工具
- ✅ `mime-search.schema.ts` - MIME 类型搜索工具
- ✅ `uuid-generator.schema.ts` - UUID 生成工具
- ✅ `base64-encode.schema.ts` - Base64 编码工具
- ✅ `audio-convert.schema.ts` - 音频转换工具
- ✅ `csv-to-json.schema.ts` - CSV/JSON 转换工具
- ✅ `json-pretty.schema.ts` - JSON 格式化工具
- ✅ `password-generator.schema.ts` - 密码生成工具
- ✅ `hex-rgb.schema.ts` - 颜色转换工具
- ✅ `image-compress.schema.ts` - 图片压缩工具
- ✅ `jwt-generator.schema.ts` - JWT 生成工具
- ✅ `markdown-preview.schema.ts` - Markdown 预览工具
- ✅ `shadow-generator.schema.ts` - 阴影生成工具
- ✅ `time-diff.schema.ts` - 时间差计算工具
- ✅ `unix-timestamp.schema.ts` - Unix 时间戳工具
- ✅ `word-count.schema.ts` - 字数统计工具
- ✅ `char-case.schema.ts` - 字符大小写转换工具
- ✅ `bcrypt-hash.schema.ts` - Bcrypt 哈希工具

## 使用方式

### 方式 1: 从 schemas 直接导入（推荐）

```typescript
import type { IPLookupResult, IPInfo } from "@/schemas/ip-info.schema"
import { ipLookupResultSchema } from "@/schemas/ip-info.schema"

// 使用 schema 进行验证
const result = ipLookupResultSchema.parse(data)
```

### 方式 2: 从统一导出导入（仅限通用类型）

```typescript
// 只导入通用类型（common, shared）
import type { BaseFile, BaseStats } from "@/schemas"

// 工具特定类型请直接从各自的文件导入
import type { IPLookupResult } from "@/schemas/ip-info.schema"
import type { UserAgentProcessingResult } from "@/schemas/user-agent.schema"
```

**注意**: 由于不同工具可能有相同名称的类型（如 `ExportFormat`, `BatchStatistics` 等），统一导出文件不导出工具特定的类型，以避免命名冲突。

### 方式 3: 从原始类型文件导入（向后兼容）

```typescript
// 这些导入仍然有效，但会从 schemas 重新导出
import type { IPLookupResult } from "@/schemas/ip-info.schema"
```

## 转换指南

要将新的类型文件转换为 Zod schemas，请遵循以下步骤：

### 1. 创建 schema 文件

在 `src/schemas/` 目录下创建对应的 `.schema.ts` 文件。

### 2. 转换规则

- **interface** → `z.object({ ... })`
- **type (union)** → `z.enum([...])` 或 `z.union([...])`
- **type (literal)** → `z.literal(...)`
- **可选字段** → `.optional()`
- **数组** → `z.array(...)`
- **Record** → `z.record(z.string(), ...)`
- **Date** → `z.date()`
- **File** → `z.instanceof(File)`

### 3. 导出类型

在文件末尾使用 `z.infer<typeof schema>` 导出类型：

```typescript
export type MyType = z.infer<typeof myTypeSchema>
```

### 4. 更新原始类型文件

将原始类型文件改为从 schemas 重新导出：

```typescript
/**
 * 类型声明
 * 这些类型现在从 zod schemas 导出以保持向后兼容
 */
export * from "./schemas/my-type.schema"
```

### 5. 更新统一导出

在 `src/schemas/index.ts` 中添加新的导出：

```typescript
export * from "./my-type.schema"
```

## 示例

### 原始类型定义

```typescript
export interface MyResult {
  id: string
  name: string
  count: number
  tags: string[]
  createdAt: Date
  isValid: boolean
  error?: string
}

export type Status = 'pending' | 'processing' | 'completed'
```

### Zod Schema 定义

```typescript
import { z } from "zod"

export const statusSchema = z.enum(['pending', 'processing', 'completed'])

export const myResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number(),
  tags: z.array(z.string()),
  createdAt: z.date(),
  isValid: z.boolean(),
  error: z.string().optional(),
})

export type Status = z.infer<typeof statusSchema>
export type MyResult = z.infer<typeof myResultSchema>
```

## 待转换的类型文件

以下类型文件尚未转换，需要按照上述指南进行转换（已转换 83 个，全部完成）：

- [x] `api-tester.ts` ✅
- [x] `audio-convert.ts` ✅
- [x] `barcode-generator.ts` ✅
- [x] `base64-image.ts` ✅
- [x] `bcrypt-hash.ts` ✅
- [x] `border-radius.ts` ✅
- [x] `char-case.ts` ✅
- [x] `code-formatter.ts` ✅
- [x] `color-picker.ts` ✅
- [x] `cron-parser.ts` ✅
- [x] `css-clamp.ts` ✅
- [x] `csv-to-json.ts` ✅
- [x] `currency-convert.ts` ✅
- [x] `diff-viewer.ts` ✅
- [x] `dns-lookup.ts` ✅
- [x] `excel-to-json.ts` ✅
- [x] `exif-viewer.ts` ✅
- [x] `fake-user.ts` ✅
- [x] `favicon-generator.ts` ✅
- [x] `file-hash.ts` ✅
- [x] `gif-split.ts` ✅
- [x] `git-helper.ts` ✅
- [x] `gradient-maker.ts` ✅
- [x] `hex-rgb.ts` ✅
- [x] `html-preview.ts` ✅
- [x] `icon-spriter.ts` ✅
- [x] `image-compress.ts` ✅
- [x] `image-convert.ts` ✅
- [x] `image-crop.ts` ✅
- [x] `image-resize.ts` ✅
- [x] `image-to-pdf.ts` ✅
- [x] `json-diff.ts` ✅
- [x] `json-plot.ts` ✅
- [x] `json-pretty.ts` ✅
- [x] `json-to-ts.ts` ✅
- [x] `jwt-decode.ts` ✅
- [x] `jwt-generator.ts` ✅
- [x] `lorem-image.ts` ✅
- [x] `lorem-ipsum.ts` ✅
- [x] `lottery-picker.ts` ✅
- [x] `markdown-mermaid.ts` ✅
- [x] `markdown-preview.ts` ✅
- [x] `markdown-toc.ts` ✅
- [x] `matrix-math.ts` ✅
- [x] `md5-hash.ts` ✅
- [x] `merge-pdf.ts` ✅
- [x] `password-generator.ts` ✅
- [x] `password-strength.ts` ✅
- [x] `performance-analyzer.ts` ✅
- [x] `performance-tester.ts` ✅
- [x] `prime-checker.ts` ✅
- [x] `quadratic-solver.ts` ✅
- [x] `random-color.ts` ✅
- [x] `regex-cheatsheet.ts` ✅
- [x] `regex-tester.ts` ✅
- [x] `roman-numeral.ts` ✅
- [x] `sha256-hash.ts` ✅
- [x] `shadow-generator.ts` ✅
- [x] `svg-minify.ts` ✅
- [x] `table-sorter.ts` ✅
- [x] `text-to-pdf.ts` ✅
- [x] `time-diff.ts` ✅
- [x] `timezone-convert.ts` ✅
- [x] `unix-timestamp.ts` ✅
- [x] `url-encode.ts` ✅
- [x] `video-trim.ts` ✅
- [x] `word-count.ts` ✅
- [x] `yaml-to-json.ts` ✅

## 注意事项

1. **保持向后兼容**: 原始类型文件应该从 schemas 重新导出，确保现有代码不受影响
2. **类型推断**: 使用 `z.infer<typeof schema>` 从 schema 推断类型
3. **验证功能**: Zod schemas 不仅提供类型定义，还可以用于运行时验证
4. **复杂类型**: 对于复杂的类型（如函数、React 组件），可以使用 `z.custom<T>()`
5. **Date 处理**: 如果数据来自 JSON，可能需要使用 `z.string().transform()` 或 `z.coerce.date()`
