# 🚀 Kit Chrome扩展发布指南

## 📋 自动化发布流程

本项目已配置完整的GitHub Actions自动化发布流程，支持版本管理、构建、打包和发布。

## 🛠 发布方式

### 方式一：标签发布 (推荐)

```bash
# 1. 更新版本号
npm run version:patch  # 升级补丁版本 (0.0.1 → 0.0.2)
npm run version:minor  # 升级次要版本 (0.1.0 → 0.2.0)
npm run version:major  # 升级主要版本 (1.0.0 → 2.0.0)

# 2. 提交变更
git add .
git commit -m "chore: release v0.0.2"

# 3. 创建标签并推送
git tag v0.0.2
git push origin main --tags
```

**自动触发**: 推送标签后，GitHub Actions会自动构建并创建Release

### 方式二：手动触发

1. 访问 GitHub Actions 页面
2. 选择 "🚀 Build and Release Chrome Extension" 工作流
3. 点击 "Run workflow"
4. 输入版本号和选项
5. 点击运行

## 📦 本地构建测试

### 基础构建命令

```bash
# 构建扩展
npm run build:extension

# 打包CRX文件 (需要私钥)
npm run pack:crx

# 完整发布流程
npm run release:extension
```

### 版本管理命令

```bash
# 查看当前版本
node scripts/update-version.mjs --current

# 设置指定版本
node scripts/update-version.mjs 1.2.3

# 自动增量版本
npm run version:patch  # 补丁版本
npm run version:minor  # 次要版本
npm run version:major  # 主要版本

# 同时更新package.json
node scripts/update-version.mjs 1.2.3 --package
```

## 🔧 GitHub Actions 工作流

### 工作流文件: `.github/workflows/release-crx.yml`

#### 触发条件:

- **标签推送**: `git push --tags` (格式: v*.*.\*)
- **手动触发**: GitHub Actions页面手动运行

#### 构建步骤:

1. **📥 检出代码**: 获取最新代码
2. **🔧 设置环境**: Node.js 18, 缓存依赖
3. **📦 安装依赖**: npm ci 安装
4. **🔄 更新版本**: 自动更新manifest.json版本
5. **🏗️ 构建扩展**: 生成dist-extension目录
6. **🔍 验证扩展**: 检查必要文件和格式
7. **📤 上传产物**: 保存到Artifacts
8. **🎉 创建Release**: 自动生成GitHub Release

#### 输出文件:

- `kit-extension.zip`: 扩展安装包
- `dist-extension/`: 构建文件夹
- **GitHub Release**: 包含安装说明和下载链接

## 📋 CRX签名 (可选)

### 生成私钥

```bash
# 生成私钥文件 (仅首次需要)
openssl genrsa -out private-key.pem 2048

# ⚠️ 注意: 私钥文件不要提交到Git仓库
echo "private-key.pem" >> .gitignore
```

### 使用私钥签名

```bash
# 有私钥时会自动生成签名的CRX文件
npm run pack:crx
```

**输出文件:**

- `releases/kit-extension-v1.0.0.crx` (签名版本)
- `releases/kit-extension-v1.0.0.zip` (未签名版本)
- `releases/release-info-v1.0.0.json` (发布信息)

## 🎯 发布检查清单

### 发布前检查:

- [ ] 所有功能测试通过
- [ ] 版本号已正确更新
- [ ] CHANGELOG.md 已更新
- [ ] 构建无错误和警告
- [ ] 扩展在Chrome中正常安装运行

### 发布后验证:

- [ ] GitHub Release已创建
- [ ] 下载链接正常工作
- [ ] 安装说明准确无误
- [ ] 版本号显示正确

## 📊 发布统计

### 查看构建信息

```bash
# 查看最近的构建
gh workflow view "Build and Release Chrome Extension"

# 查看运行历史
gh run list --workflow=release-crx.yml

# 下载构建产物
gh run download <run-id>
```

### 发布文件结构

```
releases/
├── kit-extension-v1.0.0.zip     # 扩展安装包
├── kit-extension-v1.0.0.crx     # 签名扩展包 (可选)
└── release-info-v1.0.0.json     # 发布信息
```

## 🔍 故障排除

### 常见问题:

#### 1. 构建失败

```bash
# 检查依赖
npm ci

# 本地测试构建
npm run build:extension
```

#### 2. 版本号问题

```bash
# 检查当前版本
node scripts/update-version.mjs --current

# 手动修复版本
node scripts/update-version.mjs 1.0.0
```

#### 3. 权限问题

- 确保GitHub仓库有Actions权限
- 检查 `GITHUB_TOKEN` 权限设置

#### 4. 私钥问题

- 私钥文件格式必须为PEM
- 确保私钥文件不在Git仓库中

### 调试命令:

```bash
# 详细构建日志
DEBUG=* npm run build:extension

# 验证manifest格式
jq empty manifest.json

# 检查扩展文件
ls -la dist-extension/
```

## 📚 相关文档

- [Chrome扩展开发文档](https://developer.chrome.com/docs/extensions/)
- [Manifest V3指南](https://developer.chrome.com/docs/extensions/mv3/)
- [GitHub Actions文档](https://docs.github.com/en/actions)
- [扩展安装指南](EXTENSION_INSTALL_GUIDE.md)

## 🎉 快速开始

```bash
# 克隆项目
git clone <your-repo-url>
cd kit

# 安装依赖
npm install

# 本地构建测试
npm run build:extension

# 发布新版本
npm run version:patch
git add . && git commit -m "chore: release v0.0.2"
git tag v0.0.2 && git push origin main --tags
```

**🎊 恭喜！你的Chrome扩展发布流程已就绪！**
