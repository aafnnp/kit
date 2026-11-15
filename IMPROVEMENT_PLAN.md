# Kit 工具改进计划

> 基线：`./scripts/nsh.sh check .` 无报错；`./scripts/nsh.sh test .` 66/66 通过。
> 范围：38 个现代工具 + 41 条 legacy 规格（71 个可见入口，8 个隐藏别名）。
> 当前状态：`check` 通过，`test` 68/68 通过。

## 进度

- [x] 批次 1 · 正确性 P0
- [x] 批次 2 · 交互一致性
- [x] 批次 3 · i18n 与可访问性
- [~] 批次 4 · Legacy 与能力决策（仅剩文件/图片导出需产品决策）
- [~] 批次 5 · 功能深度与性能（diff 算法、草稿持久化与懒加载待续）

---

## 一、横向共性问题

| 级别 | 问题 | 处理方式 |
| --- | --- | --- |
| P0 | JSON→TS 根数组生成重复标识符 | 根数组项命名为 `<Root>Item`，补回归测试 |
| P0 | 正则测试器 ReDoS 可冻结 UI | 嵌套量词/歧义交替静态拦截 + 250ms 时间预算 |
| P1 | `Number("") === 0` 静默出错 | `lib/validation.ts` 增加 `finiteNumberFromText` 并替换 |
| P1 | Unicode/中文语义错误 | 字素簇分段、CJK 标点不计词 |
| P1 | 实时/按钮两种交互混用，改输入后结果陈旧 | 共享运行模型（批次 2） |
| P1 | logic 错误全英文 | 错误码 + 本地化映射（批次 3） |
| P1 | 渲染期副作用与重复计算 | `computed` 记忆化、去掉渲染期 `set` |
| P1 | 预览靠字符串 replace | logic 返回结构化 CSS 与预览样式 |
| P2 | 无草稿保持、无导出、无键盘执行 | 批次 2/5 |
| P2 | 未使用导入、死参数 `option` | 批次 2/4 |

## 二、逐工具问题与改进

### 数据格式

| 工具 | 问题 | 改进 |
| --- | --- | --- |
| json-pretty | 改输入不刷新；`isValidJson` 每渲染解析两次；示例 `"tools": 15` 过期；`Field` 未用 | 防抖实时格式化、行列号错误、动态示例、删未用导入 |
| json-to-ts | 根数组重复 `Root`；`null` 不参与可选合并；无导出风格选项 | 修命名、`null` 合并、选项面板、实时重算 |
| csv-to-json | 选项变更不重跑；无预览表；类型推断漏日期/前导零 | 自动重算、映射预览、空值策略 |
| jwt-decode | 按钮式且结果陈旧；无 `alg` 风险提示；无原始 Base64 | 实时解码、算法/过期徽标、三段视图 |
| json-diff | 数组按下标比对（前插 1 项报 4 处变更）；错误不区分左右；无 Patch | LCS/键匹配、左右标注、RFC 6902 |
| roman-numeral | 按钮式；空值报错不准 | 实时转换、对照表、分步解释 |
| prime-checker | 每渲染重跑 Miller–Rabin；无因数分解 | 记忆化、因数/相邻质数 |
| quadratic-solver | 每渲染求解 6–8 次；`无实数解` 分支不可达 | 单次计算、步骤与根式形式 |
| mime-search | 仅 34 条；xml 重复条目 | 扩充去重、分类筛选 |
| http-status | 仅 29 码；分类名未本地化 | 补齐标准码、规范链接 |
| fake-user | 数据池极小；无种子 | 扩充数据、种子、多格式导出 |
| lottery-picker | 静默去重；仅 `Math.random` | 去重提示、crypto 随机、多轮 |
| matrix-math | 仅加减乘转置 | det/inverse/rank、行列定位错误 |
| table-sorter | 非 ISO 日期按文本；无多列排序 | 类型检测、区域排序、多列 |

### 编码 / 解码

| 工具 | 问题 | 改进 |
| --- | --- | --- |
| base64-encode | 按钮式；错误英文；无换行 | 防抖实时、错误本地化、76 列换行 |
| url-encode | 切换范围不重算；`+` 语义不一致 | 自动重算、`+` 开关、查询参数编辑 |
| url-parser | 按钮式；字段不全；无 hash 参数 | 实时解析、完整字段、hash 参数 |

### 文本

| 工具 | 问题 | 改进 |
| --- | --- | --- |
| word-count | 中文标点计入词数；阅读时间恒 ≥1；高频词仅拉丁 | 字素/Unicode 分段、CJK 双计、选区统计 |
| char-case | 中文被丢弃；emoji 反转破损 | 字素反转、Unicode 分词、结果列表 |
| diff-viewer | 每次击键全量 LCS（2000×2000 ≈ 43ms/31MB）；无忽略选项 | 防抖 + Myers、忽略空白/大小写、patch |
| regex-tester | ReDoS；缺标志；50 条上限无提示 | 风险拦截 + 时间预算、更多标志、替换预览 |
| regex-cheatsheet | 内容全英文；示例与 pattern 不匹配 | 双语条目、修正示例、跳转测试器 |
| lorem-ipsum | 固定种子导致文本重复；仅段/句 | 随机种子开关、词数模式、HTML 输出 |
| markdown-toc | 不支持 setext；标题内 HTML 进入 slug | setext、剥离行内 HTML、层级选项 |

### 颜色与设计

| 工具 | 问题 | 改进 |
| --- | --- | --- |
| hex-rgb | 拒绝 `#RRGGBBAA`/`rgba()`/`hsl()`；按钮式；无 AA/AAA | 扩展解析、实时、WCAG 徽标 |
| css-clamp | 仅 px；空值生成负偏移；无预览 | 多单位、严格数字解析、视口滑块 |
| border-radius | 错误被吞；`%` 预览用魔法系数 | 结构化错误、单位感知预览 |
| gradient-maker | 预览靠 replace；仅 2 色标 | 结构化返回、N 色标、radial/conic |
| shadow-generator | 预览靠 replace；仅单层 | 结构化返回、多层、预设 |
| random-color | 无历史/对比度/锁定 | 调色板、历史、对比度 |

### 加密与生成器

| 工具 | 问题 | 改进 |
| --- | --- | --- |
| hash | 每击键全量哈希；渲染期两次自检；无 HMAC | 防抖、缓存自检、HMAC/更多算法、摘要比对 |
| uuid-generator | 勾选格式会重新生成 | 格式化现有值、v7、逐条复制 |
| password-generator | 全关闭时静默空密码；熵模型不看选项池 | 错误态、按池计算熵、口令短语 |

### 日期与时间

| 工具 | 问题 | 改进 |
| --- | --- | --- |
| unix-timestamp | 空输入→1970；13 位需手动切换；默认值缺 `Z` | 严格解析、自动单位、本地/UTC 双列 |
| time-diff | 无实时；拒绝 epoch；时长未本地化 | 实时、epoch、ISO 8601 duration |
| timezone-convert | 8 个写死城市；渲染期 `error.set`；DST 手工维护 | `Intl.DateTimeFormat` + IANA、可增删城市、实时钟 |
| cron-parser | 闰日表达式失败（窗口 366 天）；语法子集；仅本地时区 | 窗口 8 年、语法扩展、时区选择 |

### 开发工具

| 工具 | 问题 | 改进 |
| --- | --- | --- |
| git-helper | 仅 18 条；无占位符填充；无危险标识 | 命令扩充、占位符表单、安全徽标 |

### Legacy 工作区（41 条规格）

共享问题：无选项字段（`option` 死参数）、warning 用灰字、图片预览仅 4 个 slug、输出全英文、无导出。

| 工具 | 问题 → 改进 |
| --- | --- |
| api-tester | 仅预览 → cURL/fetch 导出、Header 表格 |
| audio-convert / video-trim / gif-split | FFmpeg 模板 → 参数校验、精度说明 |
| barcode-generator | 仅 Code 39 → 静区/文字开关 |
| base64-image | 仅字节统计 → MIME/尺寸嗅探、导出（需能力决策） |
| bcrypt-hash | 仅格式校验 → cost 估算与安全提示 |
| benchmark-tester / performance-tester | 字符串微基准 → 改名、warmup、ops/sec |
| code-formatter | 无 JS；CSS/HTML 启发式 → 自动识别语言 |
| color-picker | 与 hex-rgb 重复 → 保留别名 |
| currency-convert | 静态示例汇率 → 改名、标注基准日期 |
| dns-lookup | 不发请求 → 可复制 `dig` 命令 |
| excel-to-json | 实为 TSV → 改名、复用 CSV 解析 |
| exif-viewer | 标签少 → Orientation/GPS/原始标签 |
| favicon-generator | 仅 SVG → 多尺寸导出（需能力决策） |
| file-hash | 不读真实文件 → Picker 读文件、移除死参数 |
| html-preview | 正则清洗 → allowlist 分词器、明确非生产级 |
| icon-spriter | id 固定 → 从 id/文件名命名 |
| image-compress / image-convert / image-resize | 依赖选择器、命名易误解 → 合并或改名 |
| image-crop | 必然抛错 → 隐藏或输出参数建议 |
| image-to-pdf | 仅 RGB JPEG 单页 → 限制说明、页尺寸 |
| ip-info | `0.0.0.0/8` 误标 RFC1918；无 IPv6 | 修分类、IPv6、可用主机数 |
| json-plot | 文本柱图 → 刻度/排序/负值图例 |
| jwt-generator | 仅 HS256 → iat/exp 快捷、密钥不回显 |
| lorem-image / markdown-preview / markdown-mermaid | SVG/大纲/启发式 → 改名、补 subgraph |
| merge-pdf | 只检查不合并 → 改名“PDF 检查” |
| qr-generator | 原仅 v1-L ≤17 字节 | 已扩展到 v1–5-L（106 字节），OpenCV 解码验证通过 |
| svg-minify / svg-sprite | 未做属性去重/数值精度 | 精度压缩、metadata 清理 |
| text-to-pdf | Latin-1、单页 50 行 | 多页换行、内嵌字体（需能力决策） |
| user-agent | 正则启发式 | bot/引擎/设备、可疑提示 |
| yaml-to-json | 子集解析 | 块标量、行号错误 |

## 三、批次计划

### 批次 1 · 正确性 P0

- [x] `json-to-ts` 根数组命名 + 回归测试
- [x] 正则 ReDoS 静态拦截 + 时间预算 + 测试
- [x] `finiteNumberFromText` 并替换 css-clamp / gradient / shadow / cron / unix
- [x] cron 搜索窗口 8 年 + 闰日测试
- [x] 字数统计 CJK 标点、大小写工具 Unicode/字素修复 + 测试

验收：`check` 与 `test` 全绿，新增用例在修复前会失败。

### 批次 2 · 交互一致性

- [x] `lib/tool-run.ts`：`createToolRun` / `createLiveRun` / `resetOnChange`
- [x] 17 个按钮式工具迁移到 150–400 ms 防抖实时计算，保留按钮用于立即重算
- [x] 12 个文本入口补上 8 MiB 输入上限（legacy 仍由 `guardInput` 覆盖）
- [x] 删除 12 处未使用导入、修正 `json-pretty` 过期示例与 `unix-timestamp` 默认值

### 批次 3 · i18n 与可访问性

- [x] `lib/errors.ts` 集中本地化常见校验/解析/限流错误，`ErrorBanner` 与 legacy 消息统一走映射
- [x] regex-cheatsheet 双语、json-diff 输出本地化
- [x] `CopyButton`/`Segmented` 补 role、label；收藏命中区提升到 32×32
- [x] 去掉时区转换渲染期 `set`，hash / markdown-toc / quadratic 改为按需计算

### 批次 4 · Legacy 与能力决策

- [x] EXIF 标签扩充（曝光/分辨率/镜头等）、有理数值、方向名称
- [x] IP 分类与可用主机数、QR 超限提示带字节数
- [x] QR 版本 1–5-L（106 字节），并用 OpenCV 解码器逐长度验证
- [x] 移除 legacy `option` 死参数
- [ ] 图片/PDF/文件导出（需产品决策）

### 批次 5 · 功能深度与性能

- [x] hex-rgb 支持 3/4/6/8 位 HEX、rgb()/rgba()、hsl()/hsla()、CSS 颜色名、透明度与 WCAG 等级
- [x] markdown-toc 最大层级/编号、cron 宏与月份/星期名、timezone 扩展到 16 个城市
- [x] matrix 行列式/逆矩阵、diff 忽略空白/大小写、time-diff 接受秒/毫秒时间戳、URL 查询串模式
- [ ] timezone 完整 IANA（运行时 `Intl` 不可用）、diff Myers + 虚拟滚动
- [x] 每工具草稿持久化（设置中显式开启，默认关闭，覆盖 11 个文本工具）
- [ ] bundle 懒加载调研

## 四、剩余事项与原因

已完成批次 1–3 与批次 4/5 的可验证部分。以下事项需要额外条件，未在本轮修改：

1. **图片 / PDF / 文件导出**：新增 file-system 类 capability，需产品决策。
2. **真实网络与外部命令执行**：当前一律离线，改为联网需要重做工具定位。
3. **Diff Myers + 虚拟滚动**：当前 `Scroll` 没有暴露可视窗口信息，无法安全做窗口化；Myers 需在运行时验证后再替换 LCS。
5. **Bundle 懒加载**：NSH 动态模块加载未在本项目验证，直接改动可能破坏四端构建。
6. **timezone 完整 IANA**：NSH 运行时没有 `Intl` 时区数据库，已用 16 个城市的精确规则覆盖常用场景。
