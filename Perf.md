# 项目性能深度分析与优化建议

本报告基于对构建配置（Vite/Terser/TanStack Router 插件/手动分包）、运行时（React 19、TanStack Query、i18n）、性能监控组件、Worker 并行处理、以及多端（Web/Tauri/边缘）部署场景的全面审阅，提供可落地的优化建议与检查清单。

## 结论优先（TL;DR）

- 首屏与交互：已具备良好基础（自动 JSX 运行时、代码分割、Terser 压缩、Query 缓存）；建议补充路由级与工具级的懒加载边界与骨架屏，并记录 TTI/交互耗时。
- 体积分割：手动 `manualChunks` 已覆盖核心依赖，但建议引入“工具区块”按需拆分、并开启 `build.dynamicImportVars` 场景排查与预拉取策略。
- Worker：`WorkerManager` 具备并行、优先级与超时控制；建议补充“同源复用、失败熔断、内存压测守卫、Backpressure”机制与调度可视化事件。
- 资源与缓存：利用 TanStack Query 的 `staleTime/gcTime`；建议增加 `prefetchQuery`、离线缓存、Cache Storage 策略与 ETag/ETag Weak 验证流程。
- 监控与可观测性：`perfBus` 已提供 TTI/工具/Worker 事件；建议扩展 FID/INP/LCP/CLS、内存快照、长任务切片、以及路由切换指标；构建时集成 Bundle 可视化基准与回归监控。

---

## 构建与体积优化

- 手动分包策略
  - 保留现有分组：`react-vendor`、`router-vendor`、`ui-vendor`、`utils-vendor`、`i18n-vendor`。
  - 建议新增：
    - 工具区块：将 `src/components/tools/` 下每个工具以入口分包，配合现有 `chunkFileNames` 中的专用命名，确保按路由懒加载。
    - 重资源分组：如 `mermaid`、`xlsx`、`@ffmpeg/*`、`pdf-lib` 等重型库独立分包，避免首屏拖拽。
  - 检查动态导入语句：统一使用 `import('...')`，避免隐式引用导致并入主包。

- 压缩与 Tree-Shaking
  - Terser 已开启 `drop_console/drop_debugger/dead_code`；建议确认三方库 ESM 入口（package.json module 字段）以启用更彻底的 Tree-Shaking。
  - 若存在可选导入的 icon 集合，优先使用“按图标导入”或自动摇树配置，减少 `lucide-react` 体积。

- 资源提示与预取
  - 在路由层对“下一步高概率页面”注入 `<link rel="prefetch" as="script">` 或使用 router 的 `load`/`preloadCode` 钩子，缩短后续导航 TTI。
  - 对大体积工具（如绘图、视频处理、表格导入）采用“交互前置预拉取”：光标悬停、视窗接近或按钮可见时触发 `import()`。

- 构建分析基线
  - 保留 `ANALYZE=1` 工作流，存档 `stats.html` 于 CI 工件；合并 `scripts/build-optimizer.mjs` 输出成为基线，PR 对比异常增量（>10%）即失败。

## 运行时与交互性能

- React 与路由
  - 在重型列表、图表、长文编辑器等组件中使用 `React.lazy` + `Suspense` + 骨架屏。
  - 路由切换前预获取关键数据（Query `prefetchQuery`），在页面加载阶段保持"数据已就绪"，降低首渲染瀑布。

- TanStack Query
  - 现有 `staleTime=5min`、`gcTime=30min`：
    - 对“频繁交互但数据稳定”的查询可提高 `staleTime`，对“瞬时态数据”降低并关掉自动重试。
    - 针对慢接口添加 `placeholderData` 与 `select` 映射，减少深拷贝与渲染波动。
    - 使用 `keepPreviousData` 平滑分页/筛选切换。

- 虚拟化与批量渲染
  - 对可能超过 200 行的列表接入 `@tanstack/react-virtual` 或现有 `react-virtual`，将渲染限制在可视窗口。
  - 采用“分帧渲染”策略：对上千节点的 DOM 生成，拆分为 `requestIdleCallback`/`postMessage` 批次推进，避免主线程长任务。

## Web Worker 并行与内存

- Worker 管理增强
  - 复用策略：同脚本创建的 Worker 优先复用，避免过度实例化；闲置一定时间自动终止以回收内存。
  - 熔断与退避：连续 N 次失败或超时时，指数退避暂停该类型任务，并发降低至 1 直至恢复。
  - Backpressure：当 `queueLength > K` 或“主线程帧时长 > 阈值”时暂停入队或转低优先级。
  - 粒度与批量：提供 `mapChunk` 与 `reduce` 风格的批处理 API，使大任务切块以提高进度反馈与可中断性。

- 大文件与二进制
  - 采用 `Transferable`（ArrayBuffer）在主线程与 Worker 之间转移所有权，避免拷贝。
  - 使用 `fflate`/`CompressionStream` 流式压缩，降低内存峰值；大于阈值时落盘到 OPFS（浏览器）或 Tauri FS。

- 性能遥测
  - 已通过 `perfBus.emit('worker_task', ...)` 记录耗时；建议补充：任务大小、字节数、Chunk 数、内存峰值、是否命中缓存（见下）。

## 缓存、预加载与离线

- 应用级缓存
  - Query 层：为关键接口建立 `prefetchQuery` 路由钩子，结合 `staleTime` 形成感知式预取。
  - 资源层：使用 Cache Storage 针对大静态资源（字体/图表引擎/ffmpeg wasm）做版本化缓存，命中优先于网络。

- 离线与持久化
  - 若需要离线：引入轻量 Service Worker（仅静态与 wasm 热点缓存），避免复杂路由兜底；使用 `workbox-window` 的最小化配置。
  - Query 持久化：结合 `@tanstack/query-persist-client-core` + `localforage`，对只读类数据在 Tab 之间复用，减少冷启动网络压力。

- 协议优化
  - 为可缓存接口启用 ETag/If-None-Match 或 Weak ETag；对超大 JSON 建议采用 `gzip`/`br` 并考虑 NDJSON/分页。

## 指标与可观测性

- 页面与交互指标
  - 在 `perfBus` 基础上增加：LCP、CLS、FID/INP、TTFB 采集（可用 `web-vitals`）。
  - 路由级指标：记录 `route:start`→`route:interactive`，包含数据准备时间、代码下载时间和渲染耗时。
  - 长任务监控：PerformanceObserver 监听 `longtask` 已有；补充将 ≥50ms 的任务记录到 `perfBus`，统计 95/99 分位并上报。

- 资源与错误
  - 捕获 `resource` 条目（大图、字体、wasm 加载耗时），识别异常慢资源并落库。
  - 错误事件：Worker 错误、Task 超时、路由 chunk 加载失败均统一上报，配合重试/降级策略。

## UI/UX 体验优化

- 骨架与渐进增强
  - 所有懒加载页面与工具提供 Skeleton；大图/图表先以占位图/低分辨率渐进呈现。
- 网络自适应
  - 结合 `Network Information API`：在 `saveData`/低带宽时加载轻量替代实现（简单图替代动画图等）。
- 动画与过渡
  - `motion` 动画上限：限制帧时长与节点数量，低端设备禁用高成本滤镜与模糊。

## Tauri/边缘部署注意

- Tauri
  - 关闭未使用的插件；Worker 路径指向本地 `asset:` 协议，避免网络依赖。
  - 文件处理走 Rust 后端可获得更稳定的内存与性能，尤其是 ffmpeg 与大型压缩。

- Vercel/Cloudflare
  - 服务端接口若部署在边缘：确保响应头缓存策略与 CORS 一致；对二进制流采用 `stream()`，减少 TTFB。

## 落地清单（可分迭代实施）

- 分包与懒加载
  - 为 `mermaid`、`xlsx`、`@ffmpeg/*`、`pdf-lib` 建单独 chunk，并改为按需 `import()`。
  - 工具区块统一懒加载，补充 Skeleton。

- 预取与数据准备
  - 路由钩子加入 `prefetchQuery`；对下一跳高概率路由注入 `rel=prefetch`。

- Worker 强化
  - 复用与空闲终止、失败熔断、Backpressure、Chunk 化处理与 Transferable。

- 监控指标
  - 集成 `web-vitals`；扩展 `perfBus` 事件；构建分析基线纳入 CI。

- 缓存与离线
  - Cache Storage 版本化静态资源；可选 Service Worker 热点缓存；Query 持久化。

---

## 参考实现指引（片段）

- 路由懒加载示例：

```tsx
const ToolsPage = React.lazy(() => import('@/routes/tool.$tool'))
```

- 预取下一路由 chunk（示意）：

```tsx
link rel="prefetch" as="script" href="/chunks/xxx-[hash].js"
```

- 采集 web-vitals：

```ts
import { onCLS, onINP, onLCP } from 'web-vitals'

onLCP((m) => perfBus.emit('lcp', { value: m.value, ts: Date.now() }))
```

如需我直接落地实现上述关键点（分包、懒加载、Worker 增强、监控接入），请告知优先级与目标页面/工具，我将按迭代提交对应编辑。
