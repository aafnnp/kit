# Tool Type Schemas

本目录包含通用和共享的 Zod schema 定义。

## 目录结构

- ✅ `common.schema.ts` - 通用类型（BaseFile, BaseStats 等）
- ✅ `shared.schema.ts` - 共享类型（ExportFormat 等）
- ✅ `tool.schema.ts` - 工具元数据类型
- ✅ `settings.schema.ts` - 设置相关类型

**注意**: 工具特定的 schemas 已经迁移到各自的工具目录中（`src/components/tools/{tool-name}/schema.ts`）。

## 使用方式

### 方式 1: 从工具目录导入工具特定的 schemas（推荐）

```typescript
// 工具特定的 schemas 现在位于各自的工具目录中
import type { IPLookupResult, IPInfo } from "@/components/tools/ip-info/schema"
import { ipLookupResultSchema } from "@/components/tools/ip-info/schema"

// 使用 schema 进行验证
const result = ipLookupResultSchema.parse(data)
```

### 方式 2: 从 schemas 目录导入通用类型

```typescript
// 导入通用类型（common, shared）
import type { BaseFile, BaseStats } from "@/schemas"
import type { ExportFormat } from "@/schemas/shared.schema"

// 导入工具元数据类型
import type { Tool, ToolCategory } from "@/schemas/tool.schema"
```

**注意**: 由于不同工具可能有相同名称的类型（如 `ExportFormat`, `BatchStatistics` 等），工具特定的 schemas 已迁移到各自的工具目录，以避免命名冲突。

## 转换指南

要将新的类型文件转换为 Zod schemas，请遵循以下步骤：

### 1. 创建 schema 文件

在对应的工具目录下创建 `schema.ts` 文件（例如：`src/components/tools/my-tool/schema.ts`）。

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

### 4. 在工具组件中导入

在工具组件中直接从工具目录导入：

```typescript
import type { MyResult } from "./schema"
import { myResultSchema } from "./schema"
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

## 迁移状态

所有工具特定的 schemas 已经迁移到各自的工具目录中。每个工具的 schema 文件位于：

- `src/components/tools/{tool-name}/schema.ts`

以下工具已完成迁移（共 76 个）：

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
