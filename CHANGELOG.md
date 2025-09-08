# 更新日志

本文档记录了项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

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

- 移除冗余的条形码生成辅助函数 ([74a87d5](../../commit/74a87d5))
- improve audio conversion hooks and worker management ([0362e02](../../commit/0362e02))
- update layout for tool components to improve responsiveness ([82e0553](../../commit/82e0553))
- comment out common tools preloading logic in PreloadManager ([9f59548](../../commit/9f59548))
- remove TestAd and Settings routes, update routeTree structure ([53ecf30](../../commit/53ecf30))

### 👷 Build System

- 添加 rollup-plugin-visualizer 依赖用于分析打包体积 ([0872573](../../commit/0872573))
- 添加wrangler.toml配置文件用于部署 ([04281b8](../../commit/04281b8))

### 🔧 Chores

- 0.0.2 ([6d3b034](../../commit/6d3b034))
- modify dependency installation in GitHub Actions workflow ([3990376](../../commit/3990376))
- update GitHub Actions workflow for improved dependency management and build process ([7141eac](../../commit/7141eac))
- 启用日志观察功能 ([22c3fdb](../../commit/22c3fdb))

### 📊 统计信息

- 总提交数: 27
- 参与开发者: 1
- 新功能: 15
- 问题修复: 1
- 对比版本: [v0.1.2...[Unreleased]](../../compare/v0.1.2...[Unreleased])

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

*暂无更新内容*

## v0.0.2

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
- enhance settings and optimization components with internationalization support ([33ecb23](../../commit/33ecb23))
- 添加清除缓存翻译并优化界面 ([4cf9d86](../../commit/4cf9d86))
- **changelog**: 添加自动更新日志生成功能 ([1145a03](../../commit/1145a03))
- **performance-monitor**: enhance performance monitor with internationalization support ([19860eb](../../commit/19860eb))
- 更新构建报告和依赖管理 ([ff434ae](../../commit/ff434ae))
- **tools**: 添加工具图标和国际化支持 ([2064da2](../../commit/2064da2))
- 添加应用导航栏的翻译文本和更新引用 ([caeab0a](../../commit/caeab0a))
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

- update AdSense adSlot for consistency across routes ([0dc5276](../../commit/0dc5276))
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

- 移除冗余的条形码生成辅助函数 ([74a87d5](../../commit/74a87d5))
- improve audio conversion hooks and worker management ([0362e02](../../commit/0362e02))
- update layout for tool components to improve responsiveness ([82e0553](../../commit/82e0553))
- comment out common tools preloading logic in PreloadManager ([9f59548](../../commit/9f59548))
- remove TestAd and Settings routes, update routeTree structure ([53ecf30](../../commit/53ecf30))
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

### 👷 Build System

- 添加 rollup-plugin-visualizer 依赖用于分析打包体积 ([0872573](../../commit/0872573))
- 添加wrangler.toml配置文件用于部署 ([04281b8](../../commit/04281b8))

### 💚 Continuous Integration

- **workflow**: 更新 macOS 平台版本至 15 feat(settings): 从 package.json 获取版本号并添加桌面版检查 ([6e21319](../../commit/6e21319))
- 移除构建产物上传和发布信息更新步骤 ([4d7537a](../../commit/4d7537a))

### 🔧 Chores

- 0.0.2 ([6d3b034](../../commit/6d3b034))
- modify dependency installation in GitHub Actions workflow ([3990376](../../commit/3990376))
- update GitHub Actions workflow for improved dependency management and build process ([7141eac](../../commit/7141eac))
- 启用日志观察功能 ([22c3fdb](../../commit/22c3fdb))
- update app and icon assets ([69e5ea9](../../commit/69e5ea9))
- init ([ae40587](../../commit/ae40587))
- Initial commit ([31e5e58](../../commit/31e5e58))

### 📊 统计信息

- 总提交数: 85
- 参与开发者: 2
- 新功能: 41
- 问题修复: 14

---

