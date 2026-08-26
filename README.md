# Kit｜多功能工具集

<p align="center">
  <img src="./app-icon.png" width="120" alt="Kit Logo" />
</p>

> 🧰 现代化、开箱即用的多功能工具箱，支持 Web 与桌面端（Tauri）。

[中文](./README.md) | [English](./README_EN.md)

---

## ✨ 功能特性

Kit 内置数十种高频开发/生活工具，全部本地运行，数据隐私安全。

### 文本处理

- Word Count：实时统计文本字数
- Case Converter：大小写转换
- Slug Generator：生成 URL-slug
- Lorem Ipsum：假文生成
- Markdown Preview：MD→HTML 预览
- RegEx Tester：正则实时匹配
- Text Diff：文本差异对比
- Text→PDF：文本转 PDF
- Table Sorter / Filter：表格排序/筛选
- MD TOC：Markdown 目录

### 颜色/设计

- Color Picker：取色并复制十六进制
- HEX↔RGB：颜色格式互转
- Gradient Maker：CSS 渐变生成
- Shadow Maker：盒阴影调配
- Radius Maker：圆角可视化
- Favicon Maker：生成多尺寸 ICO
- CSS Clamp：Fluid size 计算
- Random Color：随机颜色

### 图片/音视频

- Image Compressor：客户端压缩 JPG/PNG/WebP
- Resize Image：图像等比缩放
- Format Convert：PNG↔WebP↔JPG
- Crop Image：裁剪并导出
- EXIF Viewer：查看 / 去除元数据
- SVG Minifier：压缩 SVG
- GIF Splitter：GIF 帧拆分
- Video Trim：浏览器端剪辑
- Audio Convert：音频格式转换
- SVG Sprite Gen：生成雪碧图
- Placeholder Img：占位图生成
- Img→PDF：图片转 PDF

### 加解密/哈希

- MD5 Hash：计算摘要
- SHA-256 Hash：SHA-256 摘要
- Bcrypt Hash：Bcrypt 哈希
- File Checksum：文件校验码
- Password Gen：密码生成

### 日期/时间

- Timestamp↔Date：时间戳互转
- Cron Parser：解析 Cron 表达式
- Time Diff：日期间隔
- TZ Convert：时区换算

### 数据格式转换

- JSON Formatter：JSON 美化 / 压缩
- YAML→JSON：格式互转
- Base64⇄Text：Base64 编解码
- URL Encode / Decode：URL 编解码
- JSON→TS Interface：JSON 转 TS 接口
- CSV→JSON：CSV 转 JSON
- XLSX→JSON：Excel 转 JSON
- Base64 Img Preview：Base64 图片预览
- Live HTML：HTML 预览

### 网络工具

- HTTP Status Lookup：HTTP 状态码查询
- UA Parser：UA 解析
- MIME Type Search：MIME 查询
- DNS Lookup：DNS 查询
- IP Info：公网 IP & whois
- URL Inspector：URL 解析

### 随机/生成器

- UUID v4：UUID v4 生成
- UUID Batch：批量 UUID
- QR Maker：二维码生成
- Barcode Maker：条形码生成
- Fake User：虚拟人资料
- Lottery Pick：抽奖器

### 其它/开发辅助

- JWT Decoder：解析 JWT
- JWT Signer：本地 HS256
- RegEx 速查：正则速查
- JSON Diff Viewer：JSON 差异对比
- JSON Plot：JSON 可视化
- Mermaid Preview：Mermaid 预览
- Prime Check：判断质数
- Quadratic：解一元二次方程
- Matrix Ops：矩阵运算
- Currency FX：静态汇率换算
- Roman↔Arab：罗马数字转换

---

## 🛠 技术栈

- React 19
- Vite 8
- TypeScript 5.9
- TailwindCSS 4
- Tauri 2（桌面端）
- @tanstack/react-router & react-query
- Radix UI, lucide-react, shadcn/ui

---

## 🚀 安装与运行

### Web 端本地开发

```bash
npm install
npm run dev
```

### 构建 Web 版本

```bash
npm run build
```

### 桌面端（Tauri）开发

需先安装 [Tauri 环境](https://tauri.app/v2/guides/getting-started/prerequisites/)

```bash
npm install
npm run tauri dev
```

### 构建桌面端安装包

```bash
npm run tauri build
```

---

## 📦 发布

### 自动更新日志

项目集成了自动更新日志生成功能：

```bash
# 生成完整更新日志
npm run changelog:generate

# 生成特定版本发布说明
npm run changelog:release v1.0.0

# 发布新版本（自动生成更新日志）
npm run release:patch   # 补丁版本
npm run release:minor   # 次要版本
npm run release:major   # 主要版本
```

详细使用说明请查看 [更新日志指南](./docs/CHANGELOG_GUIDE.md)。

### 构建产物

- Web 端构建产物位于 `dist/`
- 桌面端产物见 `src-tauri/target/`，支持 Windows/macOS/Linux

### CI 构建与分析

在 CI 中启用 bundle 可视化与报告：

```bash
# 生成生产构建并产出 stats.html 与体积优化报告
npm run ci:build:analyze
```

### Tauri 构建目录与清理

可通过环境变量定制 Tauri 目标目录（默认 `src-tauri/target`）：

```bash
# 使用自定义缓存目录（示例）
TAURI_BUILD_TARGET_DIR=/tmp/tauri-cache npm run tauri:build:ci

# 清理 Tauri 目标（选择性）
npm run tauri:clean
```

---

## 🤝 贡献

欢迎 Issue/PR，或提出新工具建议！

---

## License

MIT License © 2025 aafnnp
