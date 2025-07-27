export default [
  {
    "type": "文本处理",
    "tools": [
      { "slug": "word-count", "name": "Word Count", "desc": "实时统计文本字数", "icon": "WholeWord" },
      { "slug": "char-case", "name": "Case Converter", "desc": "大小写转换", "icon": "CaseUpper" },
      { "slug": "slugify", "name": "Slug Generator", "desc": "生成 URL-slug", "icon": "Link" },
      { "slug": "lorem-ipsum", "name": "Lorem Ipsum", "desc": "假文生成", "icon": "Type" },
      { "slug": "markdown-preview", "name": "Markdown Preview", "desc": "MD→HTML 预览" },
      { "slug": "regex-tester", "name": "RegEx Tester", "desc": "正则实时匹配" },
      { "slug": "diff-viewer", "name": "Text Diff", "desc": "文本差异对比" },
      { "slug": "text-to-pdf", "name": "Text→PDF", "desc": "文本转 PDF" },
      { "slug": "table-sorter", "name": "Table Sorter / Filter", "desc": "表格排序/筛选" },
      { "slug": "markdown-toc", "name": "MD TOC", "desc": "Markdown 目录" }
    ]
  },
  {
    "type": "颜色/设计",
    "tools": [
      { "slug": "color-picker", "name": "Color Picker", "desc": "取色并复制十六进制" },
      { "slug": "hex-rgb", "name": "HEX↔RGB", "desc": "颜色格式互转" },
      { "slug": "gradient-maker", "name": "Gradient Maker", "desc": "CSS 渐变生成" },
      { "slug": "shadow-generator", "name": "Shadow Maker", "desc": "盒阴影调配" },
      { "slug": "border-radius", "name": "Radius Maker", "desc": "圆角可视化" },
      { "slug": "favicon-generator", "name": "Favicon Maker", "desc": "生成多尺寸 ICO" },
      { "slug": "css-clamp", "name": "CSS Clamp", "desc": "Fluid size 计算" },
      { "slug": "random-color", "name": "Random Color", "desc": "随机颜色" }
    ]
  },
  {
    "type": "图片/音视频",
    "tools": [
      { "slug": "image-compress", "name": "Image Compressor", "desc": "客户端压缩 JPG/PNG/WebP" },
      { "slug": "image-resize", "name": "Resize Image", "desc": "图像等比缩放" },
      { "slug": "image-convert", "name": "Format Convert", "desc": "PNG↔WebP↔JPG" },
      { "slug": "image-crop", "name": "Crop Image", "desc": "裁剪并导出" },
      { "slug": "exif-viewer", "name": "EXIF Viewer", "desc": "查看 / 去除元数据" },
      { "slug": "svg-minify", "name": "SVG Minifier", "desc": "压缩 SVG" },
      { "slug": "gif-split", "name": "GIF Splitter", "desc": "GIF 帧拆分" },
      { "slug": "video-trim", "name": "Video Trim", "desc": "浏览器端剪辑" },
      { "slug": "audio-convert", "name": "Audio Convert", "desc": "音频格式转换" },
      { "slug": "icon-spriter", "name": "SVG Sprite Gen", "desc": "生成雪碧图" },
      { "slug": "lorem-image", "name": "Placeholder Img", "desc": "占位图生成" },
      { "slug": "image-to-pdf", "name": "Img→PDF", "desc": "图片转 PDF" }
    ]
  },
  {
    "type": "加解密/哈希",
    "tools": [
      { "slug": "md5-hash", "name": "MD5 Hash", "desc": "计算摘要" },
      { "slug": "sha256-hash", "name": "SHA-256 Hash", "desc": "SHA-256 摘要" },
      { "slug": "bcrypt-hash", "name": "Bcrypt Hash", "desc": "Bcrypt 哈希" },
      { "slug": "file-hash", "name": "File Checksum", "desc": "文件校验码" },
      { "slug": "password-generator", "name": "Password Gen", "desc": "密码生成" }
    ]
  },
  {
    "type": "日期/时间",
    "tools": [
      { "slug": "unix-timestamp", "name": "Timestamp↔Date", "desc": "时间戳互转" },
      { "slug": "cron-parser", "name": "Cron Parser", "desc": "解析 Cron 表达式" },
      { "slug": "time-diff", "name": "Time Diff", "desc": "日期间隔" },
      { "slug": "timezone-convert", "name": "TZ Convert", "desc": "时区换算" },
    ] 
  },
  {
    "type": "数据格式转换",
    "tools": [
      { "slug": "json-pretty", "name": "JSON Formatter", "desc": "JSON 美化 / 压缩" },
      { "slug": "yaml-to-json", "name": "YAML→JSON", "desc": "格式互转" },
      { "slug": "base64-encode", "name": "Base64⇄Text", "desc": "Base64 编解码" },
      { "slug": "url-encode", "name": "URL Encode / Decode", "desc": "URL 编解码" },
      { "slug": "json-to-ts", "name": "JSON→TS Interface", "desc": "JSON 转 TS 接口" },
      { "slug": "csv-to-json", "name": "CSV→JSON", "desc": "CSV 转 JSON" },
      { "slug": "excel-to-json", "name": "XLSX→JSON", "desc": "Excel 转 JSON" },
      { "slug": "base64-image", "name": "Base64 Img Preview", "desc": "Base64 图片预览" },
      { "slug": "html-preview", "name": "Live HTML", "desc": "HTML 预览" }
    ]
  },
  {
    "type": "网络工具",
    "tools": [
      { "slug": "http-status", "name": "HTTP Status Lookup", "desc": "HTTP 状态码查询","href":"https://manon.icu/http-status" },
      { "slug": "user-agent", "name": "UA Parser", "desc": "UA 解析" },
      { "slug": "mime-search", "name": "MIME Type Search", "desc": "MIME 查询" },
      { "slug": "dns-lookup", "name": "DNS Lookup", "desc": "DNS 查询" },
      { "slug": "ip-info", "name": "IP Info", "desc": "公网 IP & whois" },
      { "slug": "url-parser", "name": "URL Inspector", "desc": "URL 解析" }
    ]
  },
  // {
  //   "type": "PDF/文档",
  //   "tools": [
  //     { "slug": "merge-pdf", "name": "PDF Merger", "desc": "PDF 合并" },
  //     { "slug": "split-pdf", "name": "PDF Split", "desc": "PDF 拆分" },
  //     { "slug": "image-to-pdf", "name": "Img→PDF", "desc": "图片转 PDF" },
  //     { "slug": "text-to-pdf", "name": "Text→PDF", "desc": "文本转 PDF" },
  //     { "slug": "csv-preview", "name": "CSV Viewer", "desc": "CSV 预览" },
  //     { "slug": "zip-extract", "name": "ZIP Extract", "desc": "ZIP 解压" }
  //   ]
  // },
  {
    "type": "随机/生成器",
    "tools": [
      { "slug": "uuid-generator", "name": "UUID v4", "desc": "UUID v4 生成" },
      { "slug": "uuid-batch", "name": "UUID Batch", "desc": "批量 UUID" },
      { "slug": "qr-generator", "name": "QR Maker", "desc": "二维码生成" },
      { "slug": "barcode-generator", "name": "Barcode Maker", "desc": "条形码生成" },
      { "slug": "fake-user", "name": "Fake User", "desc": "虚拟人资料" },
      { "slug": "lottery-picker", "name": "Lottery Pick", "desc": "抽奖器" },
    ]
  },
  {
    "type": "其它/开发辅助",
    "tools": [
      { "slug": "jwt-decode", "name": "JWT Decoder", "desc": "解析 JWT" },
      { "slug": "jwt-generator", "name": "JWT Signer", "desc": "本地 HS256" },
      { "slug": "regex-cheatsheet", "name": "RegEx 速查", "desc": "正则速查" },
      { "slug": "json-diff", "name": "JSON Diff Viewer", "desc": "JSON 差异对比" },
      { "slug": "json-plot", "name": "JSON Plot", "desc": "JSON 可视化" },
      { "slug": "markdown-mermaid", "name": "Mermaid Preview", "desc": "Mermaid 预览" },
      { "slug": "prime-checker", "name": "Prime Check", "desc": "判断质数" },
      { "slug": "quadratic-solver", "name": "Quadratic", "desc": "解一元二次方程" },
      { "slug": "matrix-math", "name": "Matrix Ops", "desc": "矩阵运算" },
      { "slug": "currency-convert", "name": "Currency FX", "desc": "静态汇率换算" },
      { "slug": "roman-numeral", "name": "Roman↔Arab", "desc": "罗马数字转换" }
    ]
  }
]
