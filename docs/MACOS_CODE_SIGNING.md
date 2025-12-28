# macOS 代码签名指南

## 问题说明

macOS Gatekeeper 会阻止未签名或未公证的应用运行，导致出现"已损坏，无法打开"的错误。

## 临时解决方案（开发/测试）

如果只是想在本地测试应用，可以使用以下命令移除隔离属性：

```bash
# 方法 1: 使用提供的脚本
./scripts/fix-mac-gatekeeper.sh <应用路径>

# 方法 2: 直接使用 xattr 命令
xattr -cr /path/to/Kit.app
```

**注意**: 这只是临时解决方案，仅适用于开发/测试环境。

## 正式解决方案（生产环境）

### 前提条件

1. **Apple Developer 账号** (年费 $99)
   - 访问: https://developer.apple.com/
   - 需要有效的 Apple ID

2. **创建证书**
   - 登录 Apple Developer 后台
   - 进入 "Certificates, Identifiers & Profiles"
   - 创建 "Developer ID Application" 证书（用于分发）
   - 创建 "Developer ID Installer" 证书（用于 DMG 签名）

### 配置代码签名

#### 1. 导出证书和密钥

在 Keychain Access 中导出你的证书：

```bash
# 列出可用证书
security find-identity -v -p codesigning

# 导出证书（需要输入密码）
# 证书名称格式通常是: "Developer ID Application: Your Name (XXXXXXXXXX)"
security find-identity -v -p codesigning | grep "Developer ID Application"
```

#### 2. 配置 electron-builder.yml

在 `electron-builder.yml` 的 `mac` 部分添加签名配置：

```yaml
mac:
  category: public.app-category.developer-tools
  target:
    - dmg
  icon: build/icon.png
  minimumSystemVersion: 10.13

  # 代码签名配置
  identity: "Developer ID Application: Your Name (XXXXXXXXXX)"
  hardenedRuntime: true  # 启用强化运行时
  gatekeeperAssess: true  # 启用 Gatekeeper 评估

  # Entitlements 文件（如果需要）
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
```

#### 3. 创建 Entitlements 文件（可选）

如果需要特定权限，创建 `build/entitlements.mac.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>
```

#### 4. 配置环境变量

设置代码签名所需的环境变量：

```bash
# 在 CI/CD 中设置（GitHub Actions）
export APPLE_ID="your-email@example.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="XXXXXXXXXX"

# 或者使用密钥链
export CSC_LINK="/path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"
```

#### 5. 使用环境变量配置（推荐）

在 `electron-builder.yml` 中，可以保持配置简单，使用环境变量：

```yaml
mac:
  identity: ${CSC_NAME}  # 从环境变量读取
  hardenedRuntime: true
  gatekeeperAssess: true
```

然后在构建时设置环境变量：

```bash
export CSC_NAME="Developer ID Application: Your Name (XXXXXXXXXX)"
npm run electron:build
```

### 公证（Notarization）

对于 macOS 10.14.5+，还需要对应用进行公证：

#### 1. 创建 App 专用密码

- 访问: https://appleid.apple.com/
- 登录 → 安全 → App 专用密码
- 创建新密码（用于公证）

#### 2. 配置公证

在 `electron-builder.yml` 中添加：

```yaml
mac:
  # ... 其他配置 ...

afterSign: scripts/notarize.js  # 公证脚本
```

创建 `scripts/notarize.js`:

```javascript
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'icu.manon.kit',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

安装依赖：

```bash
npm install --save-dev @electron/notarize
```

### GitHub Actions 配置

在 `.github/workflows/release.yml` 中添加签名配置：

```yaml
- name: Build Electron app (macOS)
  if: matrix.platform == 'macos-15'
  env:
    NODE_ENV: production
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    CSC_LINK: ${{ secrets.MAC_CERTIFICATE }}  # Base64 编码的 .p12 文件
    CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTIFICATE_PASSWORD }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_ID_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
  run: npm run electron:build
```

在 GitHub 仓库的 Settings → Secrets 中添加：

- `MAC_CERTIFICATE`: Base64 编码的证书文件
- `MAC_CERTIFICATE_PASSWORD`: 证书密码
- `APPLE_ID`: Apple ID 邮箱
- `APPLE_APP_PASSWORD`: App 专用密码
- `APPLE_TEAM_ID`: Team ID

### 验证签名

构建完成后，验证签名：

```bash
# 检查签名
codesign --verify --verbose --deep --strict Kit.app

# 查看签名详情
codesign -dv --verbose=4 Kit.app

# 检查公证状态
spctl --assess --verbose --type install Kit.app
```

## 参考资源

- [electron-builder 代码签名文档](https://www.electron.build/code-signing)
- [Apple 代码签名指南](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [electron-builder macOS 配置](https://www.electron.build/configuration/mac)
