# 更新日志

本文档记录了项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## v0.4.0

*发布日期: 2026-08-28*

### ✨ Features

- enhance theme and layout with new styles and emojis ([3659eb4](../../commit/3659eb4))
- update Vite configuration for Tauri compatibility and add Vitest configuration file ([4b1e5cd](../../commit/4b1e5cd))

### 🔧 Chores

- 0.4.0 ([ce40e86](../../commit/ce40e86))
- **deps**: update tauri/rust dependencies and migrate shell to opener plugin ([d7def5f](../../commit/d7def5f))
- update deps ([6434889](../../commit/6434889))

### 📊 统计信息

- 总提交数: 5
- 参与开发者: 1
- 新功能: 2
- 问题修复: 0
- 对比版本: [v0.3.0...v0.4.0](../../compare/v0.3.0...v0.4.0)

---

## v0.3.0

*发布日期: 2026-03-16*

### ✨ Features

- Add Cloudflare Workers configuration ([2033f2c](../../commit/2033f2c))

### 👷 Build System

- 添加图标生成脚本并更新构建配置 ([2683a6e](../../commit/2683a6e))

### 💚 Continuous Integration

- **release**: 重构版本更新脚本以增强健壮性 ([cb0de32](../../commit/cb0de32))
- 修复 Cargo.toml 版本替换中的正则表达式捕获组使用 ([b49b73d](../../commit/b49b73d))
- 移除 pnpm install 中的 --no-audit 参数 ([e47cbde](../../commit/e47cbde))
- **workflow**: 更新 Ubuntu 依赖项并调整构建命令 ([a4a77d2](../../commit/a4a77d2))
- 移除 pnpm install 中的 --no-audit 参数 ([0b7fe5c](../../commit/0b7fe5c))
- 在 GitHub Actions 中固定 pnpm 版本为 9 ([4a57033](../../commit/4a57033))

### 🔧 Chores

- remove tauri ignore files ([78cb261](../../commit/78cb261))
- streamline pnpm setup in GitHub Actions workflows ([2be7412](../../commit/2be7412))
- update GitHub Actions workflows for pnpm integration ([2f6d59c](../../commit/2f6d59c))
- update package dependencies and configuration for pnpm ([fb7570e](../../commit/fb7570e))
- test ([194cac1](../../commit/194cac1))

### 📊 统计信息

- 总提交数: 13
- 参与开发者: 2
- 新功能: 1
- 问题修复: 0
- 对比版本: [v0.2.0...v0.3.0](../../compare/v0.2.0...v0.3.0)

---

## v0.2.0

*发布日期: 2025-12-28*

### ✨ Features

- set base path for Electron compatibility ([cd7bfe8](../../commit/cd7bfe8))
- include schemas in build configuration and TypeScript settings ([c67ebd9](../../commit/c67ebd9))
- enhance macOS code signing and build process ([764260e](../../commit/764260e))
- add integration tests for ApiTester and AudioConvert components ([672eec3](../../commit/672eec3))
- introduce Nitro configuration and enhance build scripts ([f285c37](../../commit/f285c37))
- add new tools and schemas for enhanced functionality ([32e8336](../../commit/32e8336))
- integrate Electron support and update project structure ([3b08936](../../commit/3b08936))

### 🐛 Bug Fixes

- update production file loading to handle asar packaging correctly ([87fc12c](../../commit/87fc12c))

### ♻️ Code Refactoring

- simplify URL validation and update IPC handlers ([968dc18](../../commit/968dc18))
- standardize number formatting across currency conversion and prime checker tools ([a4d243a](../../commit/a4d243a))
- update routeTree generation and enhance tool schemas ([3be006c](../../commit/3be006c))
- enhance tool management and introduce chunking strategy ([1f5c5eb](../../commit/1f5c5eb))
- enhance tool preloading and optimize JSON processing ([c307bd7](../../commit/c307bd7))
- simplify AppSidebar component and improve layout structure ([64a3092](../../commit/64a3092))
- enhance code consistency and improve accessibility attributes ([70d520c](../../commit/70d520c))
- simplify padding in CustomTitleBar component ([547aeea](../../commit/547aeea))
- remove migration tasks and update release workflow for Electron ([672adc1](../../commit/672adc1))
- enhance accessibility and improve code consistency ([a559d6b](../../commit/a559d6b))
- clean up accessibility attributes and improve code consistency ([4415d1b](../../commit/4415d1b))
- remove optimization recommendations document and enhance translation keys ([feaf267](../../commit/feaf267))
- update Electron configuration and enhance code organization ([f73e7f9](../../commit/f73e7f9))
- enhance performance and code organization ([49322e6](../../commit/49322e6))

### 📚 Documentation

- update changelog ([1c0a1bc](../../commit/1c0a1bc))

### 🔧 Chores

- remove unused files and update package dependencies ([89aecab](../../commit/89aecab))
- update dependencies and improve testing setup ([94988bc](../../commit/94988bc))
- update dependencies and enhance testing tools ([ffa4a4b](../../commit/ffa4a4b))
- update Electron build configuration for GitHub Actions ([1fb61b3](../../commit/1fb61b3))
- update schemas and remove unused type definitions ([8711954](../../commit/8711954))
- update Electron build configuration and add icon preparation script ([19c76fa](../../commit/19c76fa))
- streamline Electron build process and enhance script functionality ([44a7c89](../../commit/44a7c89))
- update Electron configuration and package metadata ([9c2915f](../../commit/9c2915f))
- add support for feature-electron tag in release workflow ([f9244d9](../../commit/f9244d9))

### 📊 统计信息

- 总提交数: 32
- 参与开发者: 2
- 新功能: 7
- 问题修复: 1
- 对比版本: [v0.1.7...v0.2.0](../../compare/v0.1.7...v0.2.0)

---

## v0.1.7

*发布日期: 2025-11-02*

### ♻️ Code Refactoring

- reorganize project structure and update component imports ([3c2c22a](../../commit/3c2c22a))

### 📚 Documentation

- update changelog ([cfe30e6](../../commit/cfe30e6))

### 💚 Continuous Integration

- **workflows**: 同步 Tauri 配置文件版本号与 package.json 一致 ([9e30b77](../../commit/9e30b77))

### 🔧 Chores

- 0.1.7 ([fd33f3f](../../commit/fd33f3f))
- clean up unused components and dependencies ([9646043](../../commit/9646043))

### 📊 统计信息

- 总提交数: 5
- 参与开发者: 1
- 新功能: 0
- 问题修复: 0
- 对比版本: [v0.1.6...v0.1.7](../../compare/v0.1.6...v0.1.7)

---

## v0.1.6

*发布日期: 2025-11-01*

### ✨ Features

- complete performance optimizations and type safety enhancements ([a29a114](../../commit/a29a114))
- enhance testing coverage and improve error handling ([877215a](../../commit/877215a))
- enhance testing infrastructure and error handling ([e45b58c](../../commit/e45b58c))

### 🔧 Chores

- 0.1.6 ([5c01aaf](../../commit/5c01aaf))
- 0.1.5 ([21d812a](../../commit/21d812a))
- 0.1.4 ([25dd471](../../commit/25dd471))
- update dependencies and remove unused performance report ([db070ab](../../commit/db070ab))
- update TODO.md and tsconfig.json for improved project structure ([94e44b9](../../commit/94e44b9))

### 📊 统计信息

- 总提交数: 8
- 参与开发者: 1
- 新功能: 3
- 问题修复: 0
- 对比版本: [v0.1.5...v0.1.6](../../compare/v0.1.5...v0.1.6)

---

## v0.1.5

*发布日期: 2025-09-27*

### 🐛 Bug Fixes

- update lock json ([fc62561](../../commit/fc62561))

### ♻️ Code Refactoring

- remove unused props from Route component ([c30d3dd](../../commit/c30d3dd))
- remove VirtualToolGrid and simplify SmartToolGrid component ([7965813](../../commit/7965813))

### 📊 统计信息

- 总提交数: 3
- 参与开发者: 1
- 新功能: 0
- 问题修复: 1
- 对比版本: [v0.1.4...v0.1.5](../../compare/v0.1.4...v0.1.5)

---

## v0.1.4

*发布日期: 2025-09-27*

### ✨ Features

- enhance build and performance optimization features ([e997988](../../commit/e997988))
- add @tanstack/react-virtual dependency to enhance virtual list functionality ([f4f7108](../../commit/f4f7108))
- 添加性能分析文档并更新依赖项 ([b06e018](../../commit/b06e018))
- add routing configuration for single-page application support ([b936097](../../commit/b936097))
- add global adsbygoogle declaration and update AdSenseAd component ([85582c3](../../commit/85582c3))

### 🐛 Bug Fixes

- update ffmpeg chunk configuration in vite.config.ts ([f726d53](../../commit/f726d53))
- improve Blob creation for zip files and update input handler hooks ([06f8dd7](../../commit/06f8dd7))

### ♻️ Code Refactoring

- simplify URL opening logic in ToolCard component ([03b5589](../../commit/03b5589))
- update PerformanceMonitor and introduce SmartToolGrid component ([0ebea1d](../../commit/0ebea1d))
- update script loading logic in root route for improved clarity ([2fc5e78](../../commit/2fc5e78))
- streamline script loading logic in root route ([78648df](../../commit/78648df))
- simplify AdSenseAd component by removing props and hardcoding values ([fb5e232](../../commit/fb5e232))
- ensure safe Blob creation from ArrayBuffer in audio and file processing components ([49a57a2](../../commit/49a57a2))
- 移除冗余的条形码生成辅助函数 ([74a87d5](../../commit/74a87d5))

### 📚 Documentation

- enhance introduction and add English README ([5e030e7](../../commit/5e030e7))
- update changelog ([90f6c3f](../../commit/90f6c3f))
- update changelog ([e841fe6](../../commit/e841fe6))

### 🔧 Chores

- update build scripts to use cross-env for environment variable management ([bfc5f05](../../commit/bfc5f05))
- externalize FFmpeg modules in vite.config.ts ([1bc8604](../../commit/1bc8604))
- update package-lock.json to include web-vitals dependency ([4cf5eb4](../../commit/4cf5eb4))
- update dependencies and improve build scripts ([409f8c4](../../commit/409f8c4))
- 更新发布工作流以避免重复版本号 ([3eb84ae](../../commit/3eb84ae))
- 0.1.3 ([bdbf432](../../commit/bdbf432))
- 更新版本号至0.1.2 ([ebce932](../../commit/ebce932))
- 0.0.2 ([6d3b034](../../commit/6d3b034))

### 📊 统计信息

- 总提交数: 25
- 参与开发者: 1
- 新功能: 5
- 问题修复: 2
- 对比版本: [v0.1.3...v0.1.4](../../compare/v0.1.3...v0.1.4)

---

## v0.1.3

*发布日期: 2025-09-08*

### ✨ Features

- add wrangler configuration for Cloudflare Workers ([b0aa058](../../commit/b0aa058))
- **资源优化**: 实现依赖替换脚本和SVG雪碧图支持 ([0335f24](../../commit/0335f24))
- integrate qrcode library for QR code generation and update barcode generation logic ([60b81e9](../../commit/60b81e9))
- add performance and benchmark testing tools with web worker support ([b35ca96](../../commit/b35ca96))
- enhance build process and add new tools management features ([58405f0](../../commit/58405f0))
- **i18n**: 添加搜索和侧边栏的翻译文本 ([1c28762](../../commit/1c28762))
- enhance AdSenseAd component with layout support and update adSlot ([25eedfa](../../commit/25eedfa))
- add Safari detection utility and update tab styling ([8dde66c](../../commit/8dde66c))
- add Vercel configuration for URL rewrites ([4833567](../../commit/4833567))
- add TestAd route and AdSense component integration ([614155a](../../commit/614155a))
- update root route for enhanced Google Ads integration ([aa35c19](../../commit/aa35c19))
- integrate Google Ads into tool routes ([c9cadc4](../../commit/c9cadc4))
- add Google Ads script to root route ([2f08a14](../../commit/2f08a14))
- add ads.txt file for ad network configuration ([291077b](../../commit/291077b))
- 添加应用导航栏的翻译文本和更新引用 ([caeab0a](../../commit/caeab0a))

### 🐛 Bug Fixes

- update AdSense adSlot for consistency across routes ([0dc5276](../../commit/0dc5276))

### ♻️ Code Refactoring

- improve audio conversion hooks and worker management ([0362e02](../../commit/0362e02))
- update layout for tool components to improve responsiveness ([82e0553](../../commit/82e0553))
- comment out common tools preloading logic in PreloadManager ([9f59548](../../commit/9f59548))
- remove TestAd and Settings routes, update routeTree structure ([53ecf30](../../commit/53ecf30))

### 👷 Build System

- 添加 rollup-plugin-visualizer 依赖用于分析打包体积 ([0872573](../../commit/0872573))
- 添加wrangler.toml配置文件用于部署 ([04281b8](../../commit/04281b8))

### 🔧 Chores

- modify dependency installation in GitHub Actions workflow ([3990376](../../commit/3990376))
- update GitHub Actions workflow for improved dependency management and build process ([7141eac](../../commit/7141eac))
- 启用日志观察功能 ([22c3fdb](../../commit/22c3fdb))

### 📊 统计信息

- 总提交数: 25
- 参与开发者: 1
- 新功能: 15
- 问题修复: 1
- 对比版本: [v0.1.2...v0.1.3](../../compare/v0.1.2...v0.1.3)

---

## v0.1.2

*发布日期: 2025-07-30*

### ✨ Features

- enhance settings and optimization components with internationalization support ([33ecb23](../../commit/33ecb23))

### 💚 Continuous Integration

- **workflow**: 更新 macOS 平台版本至 15 feat(settings): 从 package.json 获取版本号并添加桌面版检查 ([6e21319](../../commit/6e21319))

### 📊 统计信息

- 总提交数: 2
- 参与开发者: 1
- 新功能: 1
- 问题修复: 0
- 对比版本: [v0.1.1...v0.1.2](../../compare/v0.1.1...v0.1.2)

---

## v0.1.1

*发布日期: 2025-07-29*

### ✨ Features

- 添加清除缓存翻译并优化界面 ([4cf9d86](../../commit/4cf9d86))

### 📊 统计信息

- 总提交数: 1
- 参与开发者: 1
- 新功能: 1
- 问题修复: 0
- 对比版本: [v0.1.0...v0.1.1](../../compare/v0.1.0...v0.1.1)

---

## v0.1.0

*发布日期: 2025-07-29*

### ✨ Features

- **changelog**: 添加自动更新日志生成功能 ([1145a03](../../commit/1145a03))
- **performance-monitor**: enhance performance monitor with internationalization support ([19860eb](../../commit/19860eb))
- 更新构建报告和依赖管理 ([ff434ae](../../commit/ff434ae))
- **tools**: 添加工具图标和国际化支持 ([2064da2](../../commit/2064da2))
- **settings**: 实现设置对话框功能并重构站点头部 ([34e65aa](../../commit/34e65aa))
- **tools**: 新增多个工具组件并重构工具模块结构 ([9f00238](../../commit/9f00238))
- 重构工具加载逻辑并添加性能监控组件 ([91a8b6b](../../commit/91a8b6b))
- 添加开发者工具模块及相关组件 ([ce50f9e](../../commit/ce50f9e))
- 优化构建配置并添加构建分析工具 ([88dc907](../../commit/88dc907))
- 添加音频转换工具及相关组件和钩子 ([f6e902e](../../commit/f6e902e))
- 添加主题切换、搜索栏和性能优化功能 ([a86df07](../../commit/a86df07))
- centralize file size formatting utility across tools ([32a80e1](../../commit/32a80e1))
- add type definitions for various tools and remove unused components ([5c38739](../../commit/5c38739))
- move enhanced cron types to a separate file for better organization ([ed8c114](../../commit/ed8c114))
- refactor type definitions for border radius, char case, and color picker; remove unused components ([7fc33c1](../../commit/7fc33c1))
- add project structure and component guidelines ([2b4c95a](../../commit/2b4c95a))
- integrate i18next for internationalization and enhance tool descriptions ([d2c5369](../../commit/d2c5369))
- enhance file handling and UI components across tools ([10cae2d](../../commit/10cae2d))
- add README.md for project documentation ([6eb84a7](../../commit/6eb84a7))
- add ErrorBoundary component for improved error handling ([279384b](../../commit/279384b))
- add deployment step to release workflow ([a74c961](../../commit/a74c961))
- enhance image crop tool with advanced features and error handling ([60fe438](../../commit/60fe438))
- enhance image processing tools and update release workflow ([28007f4](../../commit/28007f4))
- add updater script and integrate process plugin ([60de0f9](../../commit/60de0f9))

### 🐛 Bug Fixes

- resolve merge conflicts ([7321b5a](../../commit/7321b5a))
- enhance site header and navigation for update handling ([d89d3e4](../../commit/d89d3e4))
- update versioning and add dialog plugin support ([f7a8045](../../commit/f7a8045))
- enhance Tauri configuration for updater and Windows settings ([aba0694](../../commit/aba0694))
- update release workflow and site header for dynamic version tagging and update checks ([5ce11b2](../../commit/5ce11b2))
- update release workflow and site header for branch-based tagging and simplified update checks ([54680f8](../../commit/54680f8))
- update release workflow and site header for branch-based tagging and update checks ([5e55233](../../commit/5e55233))
- add alert for update information in site header ([9028da0](../../commit/9028da0))
- update release workflow and site header for version tagging and update checks ([fa8095a](../../commit/fa8095a))
- correct Tauri public key formatting in configuration ([19472a1](../../commit/19472a1))
- update Tauri signing keys in release workflow ([3ea49ae](../../commit/3ea49ae))
- update release workflow and Tauri configuration for draft releases ([92cdfe2](../../commit/92cdfe2))
- update release workflow and Tauri configuration ([a9d822b](../../commit/a9d822b))

### ♻️ Code Refactoring

- **git-helper**: 提取参数验证逻辑并添加实时验证 ([d42dad5](../../commit/d42dad5))
- **components**: 统一导出组件为默认导出 ([59405a5](../../commit/59405a5))
- 移除未使用的导入和冗余配置 ([8f950f8](../../commit/8f950f8))
- 调整导入语句顺序以保持一致性 ([531e4c5](../../commit/531e4c5))
- **tools**: 优化工具国际化支持和数据结构 ([54147e1](../../commit/54147e1))
- **tool-card**: 移除工具图标配置并添加首字母显示 ([01e1cbd](../../commit/01e1cbd))
- 优化代码格式和移除未使用的导入 ([1210f20](../../commit/1210f20))
- **i18n**: 重构国际化模块结构并优化翻译文件 ([c657370](../../commit/c657370))
- 清理和优化组件代码，增强可读性和一致性 ([36e3b58](../../commit/36e3b58))
- 清理未使用的导入并优化代码 ([04adbac](../../commit/04adbac))
- reorganize bcrypt types and improve file handling ([ff43ebf](../../commit/ff43ebf))
- 使用nanoid替代随机ID生成函数 ([4759c89](../../commit/4759c89))
- remove unused analysis data and format suggestion functions from image conversion tool ([a801509](../../commit/a801509))

### 📚 Documentation

- **todo**: 更新项目待办事项列表 ([b9ab9e0](../../commit/b9ab9e0))

### 💚 Continuous Integration

- 移除构建产物上传和发布信息更新步骤 ([4d7537a](../../commit/4d7537a))

### 🔧 Chores

- update app and icon assets ([69e5ea9](../../commit/69e5ea9))
- init ([ae40587](../../commit/ae40587))
- Initial commit ([31e5e58](../../commit/31e5e58))

### 📊 统计信息

- 总提交数: 55
- 参与开发者: 2
- 新功能: 24
- 问题修复: 13

---

