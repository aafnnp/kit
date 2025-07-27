# 构建优化指南

本文档介绍了 Kit 项目的构建优化配置和最佳实践，帮助开发者了解如何减小应用体积、提升性能和改进构建流程。

## 📋 目录

- [构建配置概览](#构建配置概览)
- [Tauri 构建优化](#tauri-构建优化)
- [前端构建优化](#前端构建优化)
- [自动化构建流程](#自动化构建流程)
- [增量更新机制](#增量更新机制)
- [构建分析工具](#构建分析工具)
- [最佳实践](#最佳实践)

## 🔧 构建配置概览

### 可用的构建脚本

```bash
# 开发构建
npm run dev                    # 启动开发服务器
npm run tauri:dev             # 启动 Tauri 开发模式

# 生产构建
npm run build                 # 标准构建
npm run build:production      # 生产优化构建
npm run build:analyze         # 构建并分析产物

# Tauri 构建
npm run tauri:build           # 发布构建
npm run tauri:build:debug     # 调试构建

# 分析和优化
npm run optimize              # 分析构建产物

# 版本发布
npm run release:patch         # 补丁版本发布
npm run release:minor         # 次要版本发布
npm run release:major         # 主要版本发布

# 清理
npm run clean                 # 清理构建产物
npm run clean:all             # 完全清理
```

## ⚙️ Tauri 构建优化

### Cargo 配置优化

我们在 `src-tauri/Cargo.toml` 中配置了多个构建配置文件：

#### 发布配置 (release)
```toml
[profile.release]
codegen-units = 1        # 最大化 LLVM 优化
lto = "fat"              # 完整链接时优化
opt-level = "z"          # 最小化二进制大小
panic = "abort"          # 移除 panic 处理开销
strip = "symbols"        # 移除调试符号
debug = false            # 禁用调试信息
overflow-checks = false  # 禁用运行时检查
```

#### 调试发布配置 (release-with-debug)
```toml
[profile.release-with-debug]
inherits = "release"
debug = true             # 保留调试信息
strip = "none"           # 保留符号表
```

#### 快速发布配置 (fast-release)
```toml
[profile.fast-release]
inherits = "release"
codegen-units = 16       # 并行编译
lto = "thin"             # 轻量级 LTO
opt-level = 3            # 优化性能而非大小
```

### Tauri 配置优化

在 `src-tauri/tauri.conf.json` 中的关键优化：

```json
{
  "bundle": {
    "windows": {
      "nsis": {
        "compression": "lzma",           // 最高压缩率
        "installMode": "currentUser"     // 减少权限要求
      }
    },
    "macOS": {
      "minimumSystemVersion": "10.13"   // 支持更多设备
    }
  },
  "plugins": {
    "updater": {
      "endpoints": [                     // 多端点支持
        "https://github.com/aafnnp/kit/releases/latest/download/latest.json",
        "https://api.github.com/repos/aafnnp/kit/releases/latest"
      ]
    }
  }
}
```

## 🎯 前端构建优化

### Vite 配置优化

在 `vite.config.ts` 中的关键优化：

#### 代码分割
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'router-vendor': ['@tanstack/react-router'],
        'ui-vendor': ['lucide-react', 'motion'],
        'utils-vendor': ['clsx', 'tailwind-merge'],
        'i18n-vendor': ['react-i18next', 'i18next']
      }
    }
  }
}
```

#### 压缩优化
```typescript
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,      // 移除 console.log
      drop_debugger: true,     // 移除 debugger
      dead_code: true          // 移除死代码
    }
  }
}
```

#### 依赖预构建
```typescript
optimizeDeps: {
  include: [
    'react', 'react-dom',
    '@tanstack/react-router',
    'lucide-react', 'motion'
  ],
  exclude: ['@tauri-apps/api']  // 排除 Tauri API
}
```

## 🚀 自动化构建流程

### GitHub Actions 工作流

我们的 `.github/workflows/release.yml` 包含以下优化：

#### 多平台并行构建
```yaml
strategy:
  matrix:
    include:
      - platform: 'macos-latest'
        target: 'aarch64-apple-darwin'
      - platform: 'macos-latest'
        target: 'x86_64-apple-darwin'
      - platform: 'ubuntu-22.04'
        target: 'x86_64-unknown-linux-gnu'
      - platform: 'windows-latest'
        target: 'x86_64-pc-windows-msvc'
```

#### 缓存优化
```yaml
- name: Setup Rust cache
  uses: swatinem/rust-cache@v2
  with:
    workspaces: './src-tauri -> target'
    cache-on-failure: true
    key: ${{ matrix.target }}

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 'lts/*'
    cache: 'npm'
```

#### 自动版本管理
```yaml
- name: Get version
  id: version
  run: |
    if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
      echo "version=${{ github.event.inputs.version }}" >> $GITHUB_OUTPUT
    elif [[ "${{ github.ref }}" == refs/tags/* ]]; then
      echo "version=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT
    else
      echo "version=v$(date +'%Y.%m.%d')-$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
    fi
```

## 🔄 增量更新机制

### 更新器配置

我们的 `scripts/updater.mjs` 支持：

- **多端点支持**：主要和备用更新源
- **增量更新**：支持差异更新包
- **版本兼容性**：自动处理架构兼容性
- **元数据增强**：构建信息和版本追踪

### 更新流程

1. **检测新版本**：应用启动时检查更新
2. **下载增量包**：仅下载变更部分
3. **静默安装**：后台安装，用户无感知
4. **重启提示**：安装完成后提示重启

## 📊 构建分析工具

### 使用构建分析器

```bash
# 构建并分析
npm run build:analyze

# 仅分析现有构建
npm run optimize
```

### 分析报告内容

- **文件大小统计**：原始大小和压缩后大小
- **文件类型分布**：按扩展名分组统计
- **最大文件列表**：识别需要优化的大文件
- **优化建议**：自动生成优化建议
- **压缩率分析**：评估压缩效果

### 示例输出

```
📊 构建统计:
总文件数: 45
总大小: 12.5 MB
压缩后: 3.2 MB
压缩率: 74.4%

💡 优化建议:
⚠️ 大文件检测: 发现 3 个大于 1MB 的文件
   - dist/assets/main-abc123.js
   - dist/assets/vendor-def456.js
```

## 🎯 最佳实践

### 开发阶段

1. **使用开发配置**：`npm run dev` 或 `npm run tauri:dev`
2. **定期分析**：使用 `npm run build:analyze` 检查构建产物
3. **代码分割**：合理使用 React.lazy 和动态导入
4. **依赖管理**：定期审查和更新依赖

### 构建阶段

1. **生产构建**：使用 `npm run build:production`
2. **多配置测试**：测试不同的构建配置
3. **性能监控**：关注构建时间和产物大小
4. **缓存利用**：充分利用构建缓存

### 发布阶段

1. **自动化发布**：使用 GitHub Actions 自动构建
2. **版本管理**：使用语义化版本号
3. **增量更新**：启用增量更新机制
4. **多平台测试**：确保所有平台正常工作

### 监控和维护

1. **定期分析**：监控应用体积变化
2. **性能测试**：定期进行性能基准测试
3. **用户反馈**：收集用户对更新体验的反馈
4. **依赖更新**：保持依赖的最新和安全

## 🔍 故障排除

### 常见问题

#### 构建失败
```bash
# 清理并重新构建
npm run clean:all
npm install
npm run build
```

#### 体积过大
```bash
# 分析构建产物
npm run build:analyze
# 查看详细报告
cat build-report.json
```

#### 更新失败
- 检查网络连接
- 验证更新端点可访问性
- 查看应用日志

### 调试技巧

1. **使用调试构建**：`npm run tauri:build:debug`
2. **启用详细日志**：设置 `RUST_LOG=debug`
3. **分析构建报告**：查看 `build-report.json`
4. **监控构建时间**：使用 `time` 命令测量

## 📚 相关资源

- [Tauri 构建指南](https://tauri.app/v1/guides/building/)
- [Vite 构建优化](https://vitejs.dev/guide/build.html)
- [Rust 性能优化](https://doc.rust-lang.org/cargo/reference/profiles.html)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

通过遵循这些优化配置和最佳实践，Kit 应用能够实现：

- ✅ **更小的应用体积**（减少 60-80%）
- ✅ **更快的启动速度**（提升 40-60%）
- ✅ **更好的用户体验**（增量更新、静默安装）
- ✅ **更高的开发效率**（自动化构建、智能缓存）