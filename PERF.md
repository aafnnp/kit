## Kit 性能优化计划

### 背景
- 当前工具集路由把收藏、搜索、预取、广告等逻辑集中在 `src/routes/index.tsx`，重渲染开销与圈复杂度偏高。
- 预加载器直接以绝对路径 `import(/* @vite-ignore */ "/src/...")` 拉取源码，生产构建无法命中真实 chunk，且缓存模块对象导致内存常驻。
- `vite.config.ts` 为 80+ 工具生成 `tool-${slug}` chunk，产生大量小体积请求，延长首屏 TTFB/LCP。
- JSON Formatter 等复杂工具将所有算法内联在组件中，难复用也难测试。
- 测试覆盖仅限收藏/搜索 Hook，缺少预加载、性能监控、工具核心算法等关键路径的保障。
- 工具清单手写于 `src/lib/data/data.ts`，与实际 `components/tools/*` 不一致时无自动校验。

### 关键优化方向
1. **动态加载链路**
   - 只通过 `import.meta.glob` 暴露的 loader 进行预加载，禁止裸 `import("/src/...")`。
   - 将预加载缓存改成惰性映射（例如记录 slug → Promise），避免把模块完整存入内存。
   - 把并发调度提取成独立方法，防止多次调用 `preloadCommonTools` 时重复改写 `preload`。

2. **构建切片策略**
   - 将 `manualChunks` 调整为按“功能域”或“重量级依赖”聚合（文本、图像/FFmpeg、加解密等）。
   - 引入 manifest（`import.meta.glob` + `zod` 校验）记录 slug 对应 chunk，供路由和预加载共享。

3. **首页与组件拆分**
   - 新增 `useToolDashboardState` hook 管理收藏、最近、搜索、副作用。
   - 拆出 `StickyControls`, `ToolGridSection`, `AdSection` 等子组件，降低 `Route component` 的圈复杂度。
   - 使用 `useSyncExternalStore` 或轻量状态容器减少全局刷新。

4. **业务算法下沉**
   - 将 `validateJSON`, `processJSON`, `analyzeJSON` 等迁移至 `src/lib/json/`，暴露纯函数。
   - 其他工具（如图像、加密）同样抽离核心逻辑，组件只处理 UI。

5. **测试与监控**
   - 为预加载管理器、路由守卫、性能总线、新抽离的纯函数补充单元测试。
   - 在 CI 中设定最低覆盖率并输出 bundle/性能报告（沿用 `ci:build:analyze`）。

6. **数据源自动化**
   - 使用 `import.meta.glob` 扫描 `components/tools/*/meta.ts`，自动生成工具清单。
   - 在 CI 加入校验：有目录必须有 meta，meta 中 slug 必须有组件。

### 分阶段执行步骤
| 阶段 | 目标 | 关键动作 |
| --- | --- | --- |
| P0 | 保障生产稳定 | 修复预加载器 import 方式 + 缓存策略；重新分组 `manualChunks`，验证 bundle/瀑布图 |
| P1 | 降低重渲染 | 拆分首页状态与 UI，加入 memo 化子组件；抽离 JSON 逻辑并加单测 |
| P2 | 提升可维护性 | 推出工具 meta 自动生成方案，完善测试矩阵与 CI 守护 |

### 验证指标
- 首屏请求数 < 20，LCP < 2.5s（桌面网络）。
- 工具动态加载命中率 > 80%，无 404 chunk。
- 首页组件圈复杂度 < 10，覆盖率 ≥ 70%。

### 进度追踪
- [x] **P0**：预加载管理器改为 slug→Promise 惰性映射，并引入并发队列；工具 chunk 依业务域聚合（media/data/security/generator/misc），减少 80+ 小 chunk。
- [x] **P1**：首页 Route 状态逻辑下沉到 `useToolDashboardState`，UI 分离为 `DashboardHero/Tabs`，并将 JSON Formatter 的解析/校验算法迁至 `src/lib/json/json-processor.ts`，新增 `json-processor.test.ts` 覆盖关键分支。
- [x] **P2**：完成工具 meta 自动生成与 CI 校验。

