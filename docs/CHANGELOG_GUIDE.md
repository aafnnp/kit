# 更新日志自动生成指南

本项目已集成自动更新日志生成功能，基于Git提交历史自动生成结构化的更新日志。

## 🚀 功能特性

- **自动解析提交**: 支持 [Conventional Commits](https://www.conventionalcommits.org/) 格式
- **智能分类**: 自动将提交按类型分组（功能、修复、文档等）
- **多语言支持**: 生成中文更新日志
- **GitHub集成**: 自动生成发布说明
- **统计信息**: 包含提交数、开发者数等统计
- **链接生成**: 自动生成GitHub比较链接

## 📋 使用方法

### 1. 生成完整更新日志

```bash
# 生成完整的 CHANGELOG.md 文件
npm run changelog:generate
```

这将：
- 分析所有Git标签和提交历史
- 生成结构化的更新日志
- 保存到 `CHANGELOG.md` 文件

### 2. 生成特定版本的发布说明

```bash
# 为特定版本生成发布说明
npm run changelog:release v1.0.0
```

这将输出适合GitHub Release的发布说明格式。

### 3. 发布新版本（自动生成更新日志）

```bash
# 发布补丁版本
npm run release:patch

# 发布次要版本
npm run release:minor

# 发布主要版本
npm run release:major
```

这些命令会：
1. 更新版本号
2. 自动生成更新日志
3. 提交更改
4. 推送标签到远程仓库

## 📝 提交格式规范

为了获得最佳的更新日志效果，建议使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 支持的提交类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): add login functionality` |
| `fix` | 问题修复 | `fix(ui): resolve button alignment issue` |
| `docs` | 文档更新 | `docs: update installation guide` |
| `style` | 代码格式 | `style: fix indentation` |
| `refactor` | 代码重构 | `refactor: simplify user service` |
| `perf` | 性能优化 | `perf: improve image loading speed` |
| `test` | 测试相关 | `test: add unit tests for utils` |
| `build` | 构建系统 | `build: update webpack config` |
| `ci` | CI/CD | `ci: add automated testing` |
| `chore` | 其他杂项 | `chore: update dependencies` |

### 重大变更

对于包含重大变更的提交，使用 `!` 标记或在提交信息中包含 `BREAKING CHANGE:`：

```bash
# 方式1：使用 ! 标记
feat!: remove deprecated API

# 方式2：在提交信息中说明
feat: update user authentication

BREAKING CHANGE: The old auth API has been removed.
```

## 🔧 自动化集成

### GitHub Actions

项目的GitHub Actions工作流已配置为在发布时自动：

1. 生成更新日志
2. 创建发布说明
3. 发布到GitHub Releases

相关配置在 `.github/workflows/release.yml` 中。

### 本地开发

在本地开发时，可以随时运行 `npm run changelog:generate` 来预览更新日志效果。

## 📊 生成的内容

### CHANGELOG.md 结构

```markdown
# 更新日志

## [Unreleased]
- 未发布的更改

## v1.0.0
### ✨ Features
- 新功能列表

### 🐛 Bug Fixes
- 问题修复列表

### 📊 统计信息
- 提交数、开发者数等
```

### GitHub Release 说明

```markdown
## 🚀 Kit v1.0.0

### ✨ 新功能
- 功能描述

### 🐛 问题修复
- 修复描述

### 📊 本次更新
- 统计信息
```

## 🛠️ 自定义配置

如需自定义更新日志格式，可以修改 `scripts/changelog-generator.mjs` 文件中的：

- `COMMIT_TYPES`: 提交类型映射
- `generateVersionChangelog`: 版本日志格式
- `generateReleaseNotes`: 发布说明格式

## 📚 相关资源

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)

## ❓ 常见问题

### Q: 如何处理不规范的提交信息？
A: 脚本会尝试从提交信息中推断类型，不规范的提交会被归类为 "杂项" 类型。

### Q: 可以手动编辑生成的更新日志吗？
A: 可以，但建议在自动生成后进行编辑，避免下次生成时覆盖手动更改。

### Q: 如何排除某些提交？
A: 目前脚本会自动排除合并提交，其他排除规则可以在脚本中自定义。

### Q: 支持多语言吗？
A: 当前主要支持中文，可以通过修改脚本中的文本来支持其他语言。