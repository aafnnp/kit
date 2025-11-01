# 项目结构说明

本文档详细说明了项目的目录组织结构，帮助开发者快速理解代码的组织方式。

## 📁 目录结构概览

```
src/
├── components/          # React 组件
│   ├── layout/          # 布局组件（侧边栏、头部等）
│   ├── features/        # 功能组件（搜索、工具卡片等）
│   ├── monitoring/      # 监控组件（性能监控、依赖分析等）
│   ├── ads/             # 广告组件
│   ├── common/          # 通用组件（错误边界、文件上传等）
│   ├── tools/           # 工具组件（各种工具的具体实现）
│   └── ui/              # UI 基础组件（按钮、输入框等）
├── lib/                 # 工具库和业务逻辑
│   ├── utils/           # 通用工具函数
│   ├── storage/         # 存储相关（缓存、持久化、收藏等）
│   ├── performance/     # 性能优化相关
│   ├── routing/         # 路由相关
│   ├── theme/           # 主题相关
│   ├── workers/         # Web Worker 管理
│   └── data/            # 数据相关（工具数据、图标加载等）
├── routes/              # 路由配置
├── hooks/               # React Hooks
├── types/               # TypeScript 类型定义
└── locales/             # 国际化资源
```

## 📦 组件目录 (`src/components/`)

### `layout/` - 布局组件
应用的整体布局结构组件，包括：
- `app-sidebar.tsx` - 应用侧边栏
- `site-header.tsx` - 网站头部
- `nav-main.tsx` - 主导航菜单

**使用示例：**
```tsx
import { AppSidebar, SiteHeader } from '@/components/layout'
```

### `features/` - 功能组件
核心功能相关的组件，包括：
- `search-bar.tsx` - 搜索栏
- `tool-card.tsx` - 工具卡片
- `category-manager.tsx` - 分类管理
- `virtual-tool-grid.tsx` - 虚拟工具网格
- `theme-toggle.tsx` - 主题切换
- `settings-dialog.tsx` - 设置对话框

**使用示例：**
```tsx
import { SearchBar, ToolCard } from '@/components/features'
```

### `monitoring/` - 监控组件
性能监控和依赖分析相关组件：
- `performance-monitor.tsx` - 性能监控面板
- `cache-strategy-manager.tsx` - 缓存策略管理
- `dependency-analyzer.tsx` - 依赖分析器
- `resource-optimization.tsx` - 资源优化配置

**使用示例：**
```tsx
import { PerformanceMonitor } from '@/components/monitoring'
```

### `ads/` - 广告组件
广告相关的组件：
- `adsense-ad.tsx` - Google AdSense 广告

**使用示例：**
```tsx
import { AdSenseAd } from '@/components/ads'
```

### `common/` - 通用组件
可复用的通用组件：
- `tool-error-boundary.tsx` - 工具错误边界
- `file-upload-area.tsx` - 文件上传区域
- `enhanced-tool-base.tsx` - 增强的工具基础组件

**使用示例：**
```tsx
import { FileUploadArea } from '@/components/common/file-upload-area'
```

### `tools/` - 工具组件
各个工具的具体实现，每个工具都有自己的目录：
```
tools/
├── json-pretty/
│   ├── index.tsx        # 组件主文件
│   └── __tests__/       # 测试文件
├── image-compress/
│   ├── index.tsx
│   ├── hooks.ts         # 工具相关的 hooks
│   └── types.ts         # 工具特定的类型
└── ...
```

### `ui/` - UI 基础组件
基于 Radix UI 和 Tailwind CSS 的基础 UI 组件库，包括：
- `button.tsx` - 按钮
- `input.tsx` - 输入框
- `card.tsx` - 卡片
- `dialog.tsx` - 对话框
- 等等...

**使用示例：**
```tsx
import { Button, Input, Card } from '@/components/ui/button'
```

## 🛠️ 工具库目录 (`src/lib/`)

### `utils/` - 通用工具函数
- `utils.ts` - 通用工具函数（cn, isTauri, formatFileSize 等）
- `file-utils.ts` - 文件处理工具函数

**使用示例：**
```tsx
import { cn, isTauri, formatFileSize } from '@/lib/utils'
import { readFileAsText, downloadFile } from '@/lib/utils/file-utils'
```

### `storage/` - 存储相关
- `cache.ts` - 内存缓存
- `cache-strategy.ts` - 缓存策略
- `indexeddb.ts` - IndexedDB 封装
- `persistence.ts` - 持久化存储
- `lru.ts` - LRU 缓存实现
- `favorites.ts` - 收藏功能

**使用示例：**
```tsx
import { cache, useFavorites, usePersistence } from '@/lib/storage'
```

### `performance/` - 性能优化
- `perf.ts` - 性能监控工具
- `resource-optimizer.ts` - 资源优化器
- `file-memory-optimizer.ts` - 文件内存优化器

**使用示例：**
```tsx
import { perfBus, mark, measure } from '@/lib/performance'
import { resourceOptimizer } from '@/lib/performance'
```

### `routing/` - 路由相关
- `route-prefetch.ts` - 路由预取工具

**使用示例：**
```tsx
import { useRoutePrefetch } from '@/lib/routing'
```

### `theme/` - 主题相关
- `theme.ts` - 主题管理

**使用示例：**
```tsx
import { useTheme } from '@/lib/theme'
```

### `workers/` - Web Worker 管理
- `worker-manager.ts` - Worker 管理器

**使用示例：**
```tsx
import { getWorkerManager } from '@/lib/workers'
```

### `data/` - 数据相关
- `data.ts` - 工具数据定义
- `tools-map.ts` - 工具映射表
- `custom-categories.ts` - 自定义分类
- `icon-map.ts` - 图标映射
- `icon-loader.ts` - 图标加载器
- `preloader.ts` - 预加载管理器
- `logger.ts` - 日志工具
- `error-handler.ts` - 错误处理器

**使用示例：**
```tsx
import tools from '@/lib/data'
import { getToolLoaderBySlug, loadIconComponent } from '@/lib/data'
import { logger } from '@/lib/data'
```

## 📝 类型定义 (`src/types/`)

类型定义按功能分类，所有类型通过 `index.ts` 统一导出：

- `common.ts` - 通用类型
- `tool.ts` - 工具相关类型
- `tool-types.ts` - 工具类型定义
- `settings.ts` - 设置相关类型
- 以及各个工具特定的类型文件

**使用示例：**
```tsx
import type { Tool, ToolCategory } from '@/types'
import type { DragDropConfig } from '@/types/common'
```

## 🎣 Hooks (`src/hooks/`)

自定义 React Hooks：
- `use-clipboard.ts` - 剪贴板操作
- `use-drag-drop.ts` - 拖放功能
- `use-file-processor.ts` - 文件处理
- `use-history.ts` - 历史记录
- `use-settings-manager.ts` - 设置管理
- 等等...

**使用示例：**
```tsx
import { useClipboard } from '@/hooks/use-clipboard'
import { useDragAndDrop } from '@/hooks/use-drag-drop'
```

## 🛣️ 路由 (`src/routes/`)

使用 TanStack Router 进行路由管理：
- `__root.tsx` - 根路由
- `index.tsx` - 首页路由
- `tool.$tool.tsx` - 工具详情页路由

## 🌍 国际化 (`src/locales/`)

国际化资源文件：
- `translations/zh.ts` - 中文翻译
- `translations/en.ts` - 英文翻译
- `index.ts` - i18n 配置

## 📋 导入路径规范

### 组件导入
```tsx
// ✅ 推荐：从索引文件导入
import { SearchBar, ToolCard } from '@/components/features'
import { AppSidebar } from '@/components/layout'

// ✅ 也可以：从具体文件导入
import { SearchBar } from '@/components/features/search-bar'
```

### 工具库导入
```tsx
// ✅ 推荐：从分类目录导入
import { cn, formatFileSize } from '@/lib/utils'
import { useFavorites, cache } from '@/lib/storage'
import { perfBus } from '@/lib/performance'

// ✅ 也可以：从具体文件导入
import { cn } from '@/lib/utils/utils'
```

### 类型导入
```tsx
// ✅ 推荐：从索引文件导入
import type { Tool, ToolCategory } from '@/types'

// ✅ 也可以：从具体文件导入
import type { Tool } from '@/types/tool'
```

## 🎯 最佳实践

1. **组件组织**：将相关组件放在同一目录下，使用索引文件统一导出
2. **工具函数**：按功能分类，避免在单个文件中堆积过多功能
3. **类型定义**：每个工具可以有独立的类型文件，通用类型放在 `common.ts`
4. **导入路径**：优先使用索引文件导入，保持代码简洁
5. **命名规范**：使用 kebab-case 命名文件，PascalCase 命名组件

## 📚 相关文档

- [组件目录结构说明](.cursor/rules/components-directory.mdc)
- [TypeScript 代码风格约定](.cursor/rules/typescript-style.mdc)
- [Tauri 开发约定](.cursor/rules/tauri.mdc)

