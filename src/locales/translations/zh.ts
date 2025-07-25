export default {
  switchLanguage: '切换语言',
  chinese: '中文',
  english: '英文',
  settings: '设置',
  theme: '主题',
  light: '明亮',
  dark: '暗黑',
  followSystem: '跟随系统',
  language: '语言',
  currentVersion: '当前版本',
  checkUpdate: '检查更新',
  newVersionFound: '发现新版本',
  downloading: '正在下载更新',
  downloadComplete: '下载完成',
  newVersionDetected: '检测到新版本',
  releaseDate: '发布日期',
  updateContent: '更新内容',
  downloadingPackage: '正在下载更新包，请稍候...',
  updatePackageDownloaded: '更新包已下载完成，点击下方按钮重启应用。',
  cancel: '取消',
  update: '更新',
  restartApp: '重启应用',
  noNewVersion: '没有检测到新版本',
  // 主题切换相关
  switchTheme: '切换主题',
  lightMode: '浅色',
  darkMode: '深色',
  system: '系统',
  home: '首页',
  switchToChinese: '切换到中文',
  switchToEnglish: '切换到英文',
  // 无障碍相关
  skipToContent: '跳转到内容',
  navigationMenu: '导航菜单',
  app: {
    title: 'Kit',
    description: '一系列有用的工具',
  },
  search: {
    placeholder: '搜索工具...',
    'no-results': '未找到相关工具',
    'clear-search': '清除搜索',
  },
  favorites: {
    title: '收藏',
    add: '添加到收藏',
    remove: '从收藏中移除',
    empty: '暂无收藏的工具',
    'add-some': '点击工具卡片上的心形图标来收藏工具',
  },
  recent: {
    title: '最近使用',
    clear: '清除记录',
    empty: '暂无使用记录',
    'start-using': '开始使用工具来查看最近记录',
  },
  tools: {
    'text-processing': {
      title: '文本处理',
      'word-count': {
        name: '字数统计',
        desc: '实时字数统计',
      },
      'char-case': {
        name: '大小写转换',
        desc: '大小写转换',
      },
      'lorem-ipsum': {
        name: 'Lorem Ipsum 生成器',
        desc: 'Lorem Ipsum 生成器',
      },
      'markdown-preview': {
        name: 'Markdown 预览',
        desc: 'Markdown 转 HTML 预览',
      },
      'regex-tester': {
        name: '正则测试器',
        desc: '正则实时测试器',
      },
      'diff-viewer': {
        name: '文本差异',
        desc: '文本差异查看器',
      },
      'table-sorter': {
        name: '表格排序/过滤',
        desc: '表格排序/过滤',
      },
      'text-to-pdf': {
        name: '文本转 PDF',
        desc: '文本转 PDF',
      },
      'markdown-toc': {
        name: 'Markdown 目录',
        desc: 'Markdown 目录',
      },
    },
    'color-design': {
      title: '颜色设计',
      'color-picker': {
        name: '颜色选择器',
        desc: '选择颜色并复制十六进制',
      },
      'hex-rgb': {
        name: 'HEX/RGB互转',
        desc: '十六进制转 RGB / RGB 转十六进制',
      },
      'gradient-maker': {
        name: '渐变生成器',
        desc: 'CSS 渐变生成器',
      },
      'shadow-generator': {
        name: '阴影生成器',
        desc: 'Box 阴影生成器',
      },
      'border-radius': {
        name: '圆角生成器',
        desc: '圆角可视化',
      },
      'css-gradient': {
        name: 'CSS 渐变',
        desc: 'CSS 渐变生成器',
      },
      'favicon-generator': {
        name: 'Favicon 生成器',
        desc: 'Favicon 生成器',
      },
      'css-clamp': {
        name: 'CSS Clamp',
        desc: 'CSS clamp 计算器',
      },
      'random-color': {
        name: '随机颜色',
        desc: '随机颜色生成器',
      },
    },
    'image-audio-video': {
      title: '图片/音频/视频',
      'image-compress': {
        name: '图片压缩',
        desc: '图片压缩',
      },
      'image-resize': {
        name: '图片缩放',
        desc: '图片缩放',
      },
      'image-convert': {
        name: '格式转换',
        desc: 'PNG↔WebP↔JPG',
      },
      'image-crop': {
        name: '图片裁剪',
        desc: '图片裁剪和导出',
      },
      'exif-viewer': {
        name: 'EXIF 查看器',
        desc: 'EXIF 查看器 / 元数据移除',
      },
      'svg-minify': {
        name: 'SVG 压缩',
        desc: 'SVG 压缩',
      },
      'gif-split': {
        name: 'GIF 分割',
        desc: 'GIF 分割',
      },
      'video-trim': {
        name: '视频剪辑',
        desc: '视频剪辑',
      },
      'lorem-image': {
        name: '占位图生成器',
        desc: '占位图生成器',
      },
      'image-to-pdf': {
        name: '图片转 PDF',
        desc: '图片转 PDF',
      },
      'audio-convert': {
        name: '音频转换',
        desc: '音频转换',
      },
      'icon-spriter': {
        name: '图标合成器',
        desc: '图标合成器',
      },
    },
    'encryption-hashing': {
      title: '加密/哈希',
      'md5-hash': {
        name: 'MD5 哈希',
        desc: 'MD5 哈希',
      },
      'sha256-hash': {
        name: 'SHA-256 哈希',
        desc: 'SHA-256 哈希',
      },
      'bcrypt-hash': {
        name: 'Bcrypt 哈希',
        desc: 'Bcrypt 哈希',
      },
      'file-hash': {
        name: '文件校验',
        desc: '文件校验',
      },
      'password-generator': {
        name: '密码生成器',
        desc: '密码生成器',
      },
    },
    'date-time': {
      title: '日期/时间',
      'unix-timestamp': {
        name: '时间戳↔日期',
        desc: '时间戳转日期 / 日期转时间戳',
      },
      'cron-parser': {
        name: 'Cron 解析器',
        desc: 'Cron 解析器',
      },
      'timezone-convert': {
        name: '时区转换',
        desc: '时区转换',
      },
      'time-diff': {
        name: '时间差',
        desc: '时间差',
      },
    },
    'data-format-conversion': {
      title: '数据格式转换',
      'json-pretty': {
        name: 'JSON 格式化',
        desc: 'JSON 格式化 / 压缩',
      },
      'yaml-to-json': {
        name: 'YAML→JSON',
        desc: 'YAML 转 JSON',
      },
      'base64-encode': {
        name: 'Base64⇄文本',
        desc: 'Base64 编码 / 解码',
      },
      'url-encode': {
        name: 'URL 编码 / 解码',
        desc: 'URL 编码 / 解码',
      },
      'json-to-ts': {
        name: 'JSON→TS 接口',
        desc: 'JSON 转 TS 接口',
      },
      'csv-to-json': {
        name: 'CSV→JSON',
        desc: 'CSV 转 JSON',
      },
      'excel-to-json': {
        name: 'XLSX→JSON',
        desc: 'Excel 转 JSON',
      },
      'base64-image': {
        name: 'Base64 图片预览',
        desc: 'Base64 图片预览',
      },
      'html-preview': {
        name: 'Live HTML',
        desc: '实时 HTML 预览',
      },
    },
    'network-tools': {
      title: '网络工具',
      'http-status': {
        name: 'HTTP 状态码查询',
        desc: 'HTTP 状态码查询',
      },
      'user-agent': {
        name: 'UA 解析器',
        desc: 'UA 解析器',
      },
      'mime-search': {
        name: 'MIME 类型搜索',
        desc: 'MIME 类型搜索',
      },
      'dns-lookup': {
        name: 'DNS 查询',
        desc: 'DNS 查询',
      },
      'ip-info': {
        name: 'IP 信息',
        desc: '公网 IP & whois',
      },
      'url-parser': {
        name: 'URL 检查器',
        desc: 'URL 检查器',
      },
    },
    'random-generator': {
      title: '随机生成器',
      'uuid-generator': {
        name: 'UUID v4',
        desc: 'UUID v4 生成器',
      },
      'uuid-batch': {
        name: 'UUID Batch',
        desc: 'UUID 批量生成器',
      },
      'qr-generator': {
        name: 'QR Maker',
        desc: 'QR 码生成器',
      },
      'barcode-generator': {
        name: '条码生成器',
        desc: '条码生成器',
      },
      'fake-user': {
        name: '假用户',
        desc: '假用户数据',
      },
      'lottery-picker': {
        name: '抽奖器',
        desc: '抽奖器',
      },
    },
    'other-development-tools': {
      title: '其他开发工具',
      'jwt-decode': {
        name: 'JWT 解码器',
        desc: 'JWT 解码器',
      },
      'jwt-generator': {
        name: 'JWT 签名器',
        desc: '本地 HS256',
      },
      'regex-cheatsheet': {
        name: '正则速查',
        desc: '正则速查',
      },
      'json-diff': {
        name: 'JSON 差异查看器',
        desc: 'JSON 差异查看器',
      },
      'json-plot': {
        name: 'JSON 图表',
        desc: 'JSON 图表',
      },
      'markdown-mermaid': {
        name: 'Mermaid 预览',
        desc: 'Mermaid 预览',
      },
      'prime-checker': {
        name: '质数检查器',
        desc: '质数检查器',
      },
      'quadratic-solver': {
        name: '二次方程',
        desc: '二次方程求解器',
      },
      'matrix-math': {
        name: '矩阵运算',
        desc: '矩阵运算',
      },
      'currency-convert': {
        name: '货币转换',
        desc: '静态货币转换器',
      },
      'roman-numeral': {
        name: '罗马数字↔阿拉伯数字',
        desc: '罗马数字转阿拉伯数字 / 阿拉伯数字转罗马数字',
      },
    },
    'developer-tools': {
      title: '开发者工具',
      'code-formatter': {
        name: '代码格式化',
        desc: '代码格式化 (JS/TS/CSS/HTML)',
      },
      'api-tester': {
        name: 'API 测试器',
        desc: 'HTTP API 测试工具',
      },
      'performance-analyzer': {
        name: '性能分析器',
        desc: '性能分析工具',
      },
      'git-helper': {
        name: 'Git 助手',
        desc: 'Git 操作助手',
      },
      'password-strength': {
        name: '密码强度',
        desc: '密码强度检查器',
      },
    },
  },
}
