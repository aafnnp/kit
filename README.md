# Kit｜本地优先的跨平台工具箱

<p align="center">
  <img src="./icon.png" width="120" alt="Kit Logo" />
</p>

> 🧰 使用 [Native Shell (NSH)](https://nsh.dev) 构建的原生工具箱，支持 **macOS、Windows、Linux 与 Web**。所有处理都在本机完成。

[中文](./README.md) | [English](./README_EN.md)

---

## ✨ 特点

- **一套代码，四个平台**：macOS（AppKit）、Windows（Win32 / Direct2D）、Linux（GTK 4）、Web（HTML + WebAssembly）。
- **原生 UI**：NSH 以各平台自己的视图、文本输入和交互方式渲染，不使用 WebView，也没有 React / 虚拟 DOM。
- **本地优先**：无账户、无上传、无遥测；加密、压缩、文件等重活交给 NSH 的 Rust 标准模块。
- **自动更新**：桌面版启动时通过 `nsh/updater` 检查 GitHub Releases，设置页可查看更新说明、下载进度并就地替换重启；Web 版随站点部署更新。
- **DevToys 式工作区**：左侧可搜索、可折叠的分类导航，右侧欢迎页与工具页；支持收藏、最近使用、深浅色与中英文切换；可在设置中显式开启工具草稿（默认关闭）。
- **纯逻辑可测试**：每个工具的 `logic.ts` 与 UI 分离，使用 `nsh test` 做无头单元测试与交互测试。

> 本项目**只支持 macOS、Windows、Linux、Web**，不包含 iOS / Android。

## 🧩 当前工具（71 个可见入口；8 个旧入口作为隐藏别名保留）

| 分类 | 工具 |
| --- | --- |
| 数据格式 | JSON 格式化、JSON 转 TypeScript、CSV/TSV 转 JSON、YAML 转 JSON、JSON 图表、表格排序、JWT 解码、JSON 差异、质数检查、二次方程、罗马数字、MIME 查询、HTTP 状态码、虚拟用户、随机抽选、矩阵计算 |
| 编码 / 解码 | Base64 编解码、图片 Base64 检查、URL 编解码、URL 检查器 |
| 文本工具 | 字数统计、大小写转换、文本差异对比、正则测试器、正则速查、Lorem Ipsum、Markdown 目录、Markdown 结构预览、Mermaid 图表检查 |
| 颜色与设计 | HEX/RGB/HSL/HSV/CMYK、随机颜色、CSS clamp、圆角、渐变、阴影、SVG 压缩、SVG Sprite、favicon、Code 39 条码、QR Code、SVG 占位图 |
| 加密与生成器 | 统一哈希（MD5/SHA-1/SHA-256/384/512）、bcrypt 格式检查、JWT HS256 签名、UUID 生成、密码生成与强度分析 |
| 日期与时间 | Unix 时间戳、时间差、时区转换、Cron 解析、离线示例汇率换算 |
| 开发工具 | Git 命令助手、代码格式化、HTML 安全检查、API 请求检查、本地基准测试、源码复杂度分析 |
| 网络工具 | DNS 查询构造、IPv4/CIDR 检查、User-Agent 解析 |
| 图像与媒体 | 图片压缩、兼容转换与缩放、裁剪参数检查、JPEG EXIF、JPEG 转 PDF、PDF 检查、文本转 PDF、GIF/音频/视频 FFmpeg 命令 |

## 🎨 配色

界面配色取自应用图标 [icon.png](./icon.png)：深色石板 `#0d1117` 的底、内嵌 `#161b22` 的浅格，以及青 `#00a6d0`、紫 `#6b2dd1`、橙 `#f16511` 三根竖条。

| 角色 | 深色 | 浅色 | 用在哪 |
| --- | --- | --- | --- |
| 画布 / 卡片 | `#0d1117` / `#161b22` | `#f5f7fa` / `#ffffff` | 页面背景与卡片，深色沿用图标底色 |
| 侧栏 | `#080b10` | `#e9eef5` | 与画布分层，深色时更暗、浅色时更深 |
| 主色（紫） | `#7c3aed` | `#6b2dd1` | 主按钮、选中态、焦点环 |
| 强调（青） | `#2cc4e6` | `#0091b5` | 输入框聚焦、悬停与图标底衬 |
| 提示（橙） | `#ff8a3d` | `#d9560b` | 收藏星标、警告徽标 |

主题令牌定义在 [theme.json](./theme.json)。除语义色外新增了 `brand-cyan` / `brand-violet` / `brand-orange`（随明暗模式变化的读数友好色）、`ink-*`（固定用于深色横幅）、`ink-surface`（欢迎横幅底板）；分类侧栏与欢迎页的色条由 [lib/types.ts](./lib/types.ts) 的 `accentBar` 按分类映射，侧栏徽标与欢迎横幅使用 [components/brand.tsx](./components/brand.tsx) 的三竖条图标复刻。

## 🖥️ 平台要求

| 平台 | 开发 / 打包环境 | 运行要求 |
| --- | --- | --- |
| macOS | macOS + Xcode 命令行工具 | macOS 14+（arm64 与 x86_64 分别构建） |
| Windows | Windows | Windows 10 1809+（x64 与 ARM64） |
| Linux | Linux | GTK 4.14+（x86_64 与 aarch64） |
| Web | 任意平台 | 现代浏览器（WebAssembly） |

## 🚀 开发

项目固定使用 **NSH 0.5.1**。`scripts/nsh.sh`（Windows 为 `scripts/nsh.ps1`）会在首次运行时把对应平台的 CLI 下载到 `.tools/`，避免误用系统里较旧的 `nsh`。

```bash
# 版本一致性检查
./scripts/check-version.sh

# 类型检查
./scripts/nsh.sh check .

# 无头测试（逻辑 + UI 交互）
./scripts/nsh.sh test .

# 本机原生运行
./scripts/nsh.sh run . --target macos     # macOS
./scripts/nsh.sh run . --target linux     # Linux
./scripts/nsh.sh run . --target windows   # Windows
./scripts/nsh.sh run . --target web       # 浏览器

# 打包
./scripts/nsh.sh package . --target macos --arch arm64
./scripts/nsh.sh package . --target web
```

Windows PowerShell：

```powershell
.\scripts\nsh.ps1 check .
.\scripts\nsh.ps1 test .
.\scripts\nsh.ps1 run . --target windows
.\scripts\nsh.ps1 package . --target windows
```

`nsh package` 的原始产物在 `.nsh/out/`。发布用的文件由 `scripts/package-release.sh`（Windows 为 `scripts/package-release.ps1`）整理：

```bash
# linux：tar.gz + deb；macos：zip + dmg；web：tar.gz
./scripts/package-release.sh linux 0.9.0 x86_64 dist
./scripts/package-release.sh macos 0.9.0 arm64 dist
./scripts/package-release.sh web 0.9.0 '' dist
```

Windows PowerShell：

```powershell
# windows：便携 zip + Inno Setup 安装包
.\scripts\package-release.ps1 -Target windows -Version 0.9.0 -Arch x86_64 -OutDir dist
```

本机已验证 Web 与 macOS 打包；Windows/Linux 需要对应 NSH runner，本机当前未安装。

## 📦 发布

推送 `v*` 标签后，`.github/workflows/release.yml` 在 7 个平台上打包，产物按 `<平台>-<架构>` 命名：

| 平台 | 架构 | 文件 |
| --- | --- | --- |
| macOS | arm64、x86_64 | `kit-<版本>-macos-<架构>.zip`、`.dmg` |
| Windows | x86_64、arm64 | `kit-<版本>-windows-<架构>.zip`、`-setup.exe` |
| Linux | x86_64、aarch64 | `kit-<版本>-linux-<架构>.tar.gz`、`kit_<版本>_amd64/arm64.deb` |
| Web | — | `kit-<版本>-web.tar.gz` |
| 自动更新 | 全部桌面平台 | `kit-<版本>-<平台>-aarch64/x86_64.tar.gz`（Windows 为 `.zip`）、`latest.json` |

`nsh package` 还会按 `nsh.json` 的 `updater.github` 为每个平台写出自动更新包：macOS/Linux 为 `kit-<版本>-<平台>-aarch64|x86_64.tar.gz`，Windows 为 `kit-<版本>-windows-aarch64|x86_64.zip`。`publish` 任务用 `nsh update-manifest` 生成 `latest.json`（含更新说明与各平台包的 SHA-256），再连同 `SHA256SUMS.txt` 与发布说明提交到 GitHub Release。`.dmg`、`.deb` 与 `-setup.exe` 仅用于手动安装。

应用启动时会读取 `latest.json`；桌面版下载后校验应用 id、可执行文件与 macOS 代码签名，然后替换并重启。macOS 发布包使用 ad-hoc 签名，正式分发请先用 Developer ID 签名并公证。

```bash
git tag v0.9.0
git push origin v0.9.0

# 本地预览发布说明
./scripts/release-notes.sh v0.9.0 aafnnp/kit
```

## 🗂️ 结构

```
App.tsx                  应用入口：侧栏 + 工作区 + 状态栏
components/
  sidebar.tsx            DevToys 式分类导航、搜索、收藏、最近
  welcome.tsx            欢迎页与工具卡片
  tool-page.tsx          工具页头、收藏、错误边界
  tool-host.tsx          按 slug 只挂载一个工具
  settings.tsx           外观、语言、数据、快捷键、关于
  ui.tsx                 共享 UI 原语
lib/
  state.ts               路由、搜索、收藏、最近、持久化、快捷键
  locale.ts              中英文与本地化文本
  platform.ts            平台能力与快捷键修饰键
  updater.ts             自动更新状态机与 nsh/updater 封装
  styles.ts              共享 Tailwind 类
  version.ts             应用与 NSH 版本常量
  validation.ts          共享输入上限与整数校验
tools/
  registry.ts            唯一工具元数据源 + 搜索
  <slug>/logic.ts        核心工具的纯逻辑，可单测
  legacy-migration/      旧工具规格表、共享离线逻辑与通用 NSH 界面
tests/logic.test.ts      纯逻辑测试
tests/updater.test.ts    自动更新控制器测试
App.test.tsx             应用级交互测试
theme.json               shadcn 风格设计令牌（浅色 / 深色）
nsh.json                 应用元数据、图标、能力声明
AGENTS.md                NSH 项目贡献与 AI 协作约定
```

全部 78 个旧工具均已接入 NSH 注册与页面路由；侧栏与搜索展示 71 个可见入口，8 个重复旧入口保留为隐藏别名，旧收藏/最近记录仍可打开。部分旧工具因 NSH 0.5.1 的跨平台能力而提供透明标注的离线替代：API/DNS 不发请求，汇率仅为示例，音视频与 GIF 工具只生成 FFmpeg 命令，PDF 合并仅检查输入，像素裁剪仅校验参数，bcrypt 只检查哈希格式。图片压缩、兼容转换和缩放通过系统图片选择器处理。应用不伪装这些受限功能已经执行。本机 `nsh build .` 输出约 417 KB JavaScript。

## 🔐 安全与隐私

- 仅声明了剪贴板（`clipboard`）、系统图片选择器（`picker`）与打开外部链接（`openUrl`）能力；没有任意文件系统、网络或进程执行权限，图片仅在用户主动选择时经系统选择器读取。
- 所有文本处理在本地完成；哈希使用 NSH 的 Rust `crypto` 模块。
- 收藏、最近使用、语言与外观通过 NSH `Storage` 持久化在设备上。
- 自动更新只向 `nsh.json` 声明的 GitHub Releases 来源请求清单与安装包，地址由构建时的配置固定，应用代码无法指定；请求使用平台自身网络栈，不需要 `network` 能力。

## 🔁 从 React + Tauri 迁移

v0.6.0 已将应用从 React 19 + Vite + Tauri 2 替换为 NSH 0.3.0。78 / 78 个原有工具现已拥有 NSH 页面；统一哈希工具作为合并后的额外工具继续保留。

- 旧实现保留在 Git 历史中（提交 `26d2146`），可随时对照。
- 跨平台限制：NSH 当前构建未声明网络、进程或通用文件访问权限；可能改变设备状态或访问第三方的工具因此只提供离线检查/命令模板，除图片系统选择器外不上传或执行文件。
- 迁移原则：核心计算保持纯逻辑，界面使用 NSH 原语；不要重新引入 DOM / React 依赖。

## 📄 许可

[MIT](./LICENSE)
