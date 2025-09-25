# 项目性能分析与优化建议（Kit）

## 1. 项目概览

- 技术栈：React 19 + TanStack Router + React Query + Tailwind CSS，构建由 Vite 7 驱动，并集成 Tauri 桌面端打包。
- 资源治理：`src/lib/resource-optimizer.ts`、`src/lib/preloader.ts`、`src/lib/cache-strategy.ts` 等模块提供预加载、缓存、资源分片等高级能力。
- 构建策略：`vite.config.ts` 配置了手动分包、Terser 压缩、依赖预构建以及按需的可视化分析插件；`npm run build:analyze` 与 `scripts/build-optimizer.mjs` 支撑体积诊断。
- 产物现状：`build-report.json` 显示前端 bundle 约 7 MB（gzip 后 2 MB），Tauri 目标目录 1.2 GB，主要来自静态与动态库产物。

## 2. 现有性能手段评估

- **懒加载与代码分割**：路由级懒加载（`routeTree.gen.ts`）、工具页动态导入以及 Vite `manualChunks` 有效降低首屏脚本压力。
- **预加载体系**：`usePreload`/`useSmartPreload` 提供常用工具预热、基于行为的动态优先级；`resourceOptimizer` 管理图标与静态资源缓存。
- **缓存与存储**：`cache`（内存 LRU）、`cacheStrategy`（本地/压缩缓存）和 IndexedDB 持久化联动，为离线和重复访问场景提供基础。
- **多线程与重型任务隔离**：`WorkerManager` + `/public/workers` 将图像、音视频及矩阵计算迁移至 Web Worker，降低主线程阻塞风险。
- **监控与可视化**：`PerformanceMonitor` 组件可实时查看缓存命中率、预加载命中、资源加载等指标。

## 3. 主要性能痛点与改进建议

| 优先级 | 问题 & 影响 | 建议改动 | ------ | ------ | ------ |
| 高 | **全量导入 `lucide-react`**：`NavMain` 通过 `import * as Icons` + 运行时选择，导致 Vite 无法 tree-shake，`lucide-react` 全量 (~600 KB gzip) 被纳入主 chunk。 | 使用编译期映射（如生成 `iconMap`，逐条 `import { IconName }`）或启用 `lucide-react/dynamicIconImports`；必要时自建轻量 SVG 集或迁移到 iconfont 并结合 `resourceOptimizer` sprite。 |
| 高 | **Worker 进度上报缺陷**：`/public/workers/processing-worker.js` 中 `multiplyMatricesOptimized` 等函数使用 `arguments[0]` 传递 `taskId`，实际上传入的是矩阵对象，导致主线程无法匹配任务进度，阻碍 UI 反馈。 | 在封装函数调用时显式捕获 `taskId`（通过闭包或将 `taskId` 作为参数传入）并统一进度消息结构；同时复用 `WorkerManager` 的超时处理以避免僵尸任务。 |
| 高 | **工具网格渲染开销**：主页一次性渲染所有分类/工具卡片（`src/routes/index.tsx`），在工具数量接近百级时引发初始渲染及重排压力。 | 引入虚拟列表（如 `react-virtualized`/`@tanstack/react-virtual`）或按分类懒加载；移动端可默认折叠非首屏分类，结合 IntersectionObserver 触发渲染。 |
| 中 | **预加载策略缺乏网络自适应**：`preloadCommonTools()` 仅检测 `effectiveType` 与 `saveData`，缺少 RTT/Downlink 等指标，且未在 `navigator.connection` 变化时动态收敛。 | 扩展网络监测（监听 `connectionchange` 事件），在弱网降级预加载；对常用工具采用 `requestIdleCallback` + 最大并发限制，避免在冷启动阶段抢占带宽。 |
| 中 | **资源雪碧图 404**：`resourceOptimizer.mountSpriteFromUrl('/sprite.svg')` 在资源目录中缺少对应文件，导致每次访问触发一次失败请求。 | 提供实际的 sprite 资源，或在初始化前检测文件是否存在；若计划动态生成，应在 build 阶段产出并写入 `/public`。 |
| 中 | **缓存策略守护进程常驻**：`cache`, `cacheStrategy`, `fileMemoryOptimizer` 在模块初始化时分别启动 `setInterval`（5s/30min），无论功能是否使用都会常驻。 | 加入按需启动/停止机制（如惰性单例 + 当有监听者时再启动）；在浏览器退出或组件卸载时清理 timer，避免内存泄漏。 |
| 中 | **Mermaid 等重型依赖加载体验差**：`markdown-mermaid` 组件同步 `import mermaid`，首次打开时主线程需要解析全部 800 KB JS。 | 改为按需动态导入（`const { default: mermaid } = await import('mermaid')`）并结合 `Worker` 渲染或 `offscreen canvas`；可提供骨架屏与缓存渲染结果。 |
| 低 | **控制台输出与无意义渲染**：`NavMain` 等组件仍残留 `console.log` 与在渲染中创建匿名函数，会触发额外 diff。 | 清理调试输出，使用 `useCallback`/`memo` 优化；同时检查 `tool` 数据更新策略，避免重复计算 `flatMap`。 |
| 低 | **Query 缓存策略未调整**：默认的 React Query 配置 `staleTime=0`，高频请求工具可能重复发起网络调用。 | 为静态工具元数据设定合理 `staleTime/cacheTime`，对体积较大的工具结果开启 `select`/`initialData` 减少重复解析。 |

## 4. 构建与部署优化

- **生产构建流程**：建议默认使用 `npm run build:production`，并在 CI 中增加 `ANALYZE=1 npm run build` 输出 `stats.html`，便于跟踪 bundle 演变。
- **Tauri 目标瘦身**：
  - 在 CI 中执行 `cargo clean -p kit` 或配置 `TAURI_BUILD_TARGET_DIR` 指向缓存目录，避免工作区堆积旧产物。
  - 继续使用 `profile.release` 的 `lto="fat"`/`opt-level="z"`，同时评估是否可以移除 `staticlib` crate 类型，以减少生成的 `.a` 文件。
- **依赖体积治理**：结合 `scripts/deps-replacer.mjs` 维护依赖映射，定期检查 `@ffmpeg/ffmpeg`, `pdf-lib`, `xlsx` 的使用频率，考虑拆分到独立可选扩展或替换为 WebAssembly 轻量实现。

## 5. 监控与测试建议

- 建立关键路径指标：首屏渲染总耗时（TTI）、工具打开到可交互时间、Worker 任务完成时间等，并在 `PerformanceMonitor` 中展示。
- 在开发过程中使用 Chrome DevTools Coverage/Performance Insights，配合 `rollup-plugin-visualizer` 定期回归。
- 为 Worker 与预加载模块编写单元/集成测试，确保在弱网与低端设备上的退化逻辑可靠。

## 6. 优先级路线图

1. **P0**：修复 Worker 进度上报、重构 icon 导入模式、引入工具列表虚拟化。
2. **P1**：完善预加载与缓存守护策略，补齐 sprite 资源并优化 Mermaid 加载路径。
3. **P2**：持续迭代构建监控（CI 分析报告、依赖瘦身）与数据缓存策略，准备性能基准测试脚本。

---

通过以上优化，预期可显著降低首屏 JS 体积、提升复杂工具加载响应，并避免后台定时任务造成的资源浪费，为 Web 与 Tauri 双端提供更稳定的性能基线。
