import type { ToolsData } from '@/schemas/tool.schema'
const data: ToolsData = [
  {
    id: 'text-processing',
    tools: [
      {
        slug: 'word-count',
        name: 'Word Count',
        icon: 'WholeWord',
      },
      {
        slug: 'char-case',
        name: 'Case Converter',
        icon: 'CaseUpper',
      },
      { slug: 'lorem-ipsum', name: 'Lorem Ipsum', icon: 'Type' },
      { slug: 'markdown-preview', name: 'Markdown Preview', icon: 'Eye' },
      { slug: 'regex-tester', name: 'RegEx Tester', icon: 'Search' },
      { slug: 'diff-viewer', name: 'Text Diff', icon: 'GitCompare' },
      { slug: 'text-to-pdf', name: 'Text→PDF', icon: 'FileText' },
      { slug: 'table-sorter', name: 'Table Sorter / Filter', icon: 'Table' },
      { slug: 'markdown-toc', name: 'MD TOC', icon: 'List' },
    ],
  },
  {
    id: 'color-design',
    tools: [
      {
        slug: 'color-picker',
        name: 'Color Picker',
        icon: 'Pipette',
      },
      {
        slug: 'hex-rgb',
        name: 'HEX↔RGB',
        icon: 'Palette',
      },
      {
        slug: 'gradient-maker',
        name: 'Gradient Maker',
        icon: 'Blend',
      },
      {
        slug: 'shadow-generator',
        name: 'Shadow Maker',
        icon: 'Shadow',
      },
      {
        slug: 'border-radius',
        name: 'Radius Maker',
        icon: 'RoundedCorner',
      },
      {
        slug: 'favicon-generator',
        name: 'Favicon Maker',
        icon: 'Image',
      },
      {
        slug: 'css-clamp',
        name: 'CSS Clamp',
        icon: 'Calculator',
      },
      { slug: 'random-color', name: 'Random Color', icon: 'Shuffle' },
    ],
  },
  {
    id: 'image-audio-video',
    tools: [
      {
        slug: 'image-compress',
        name: 'Image Compressor',
        icon: 'FileImage',
      },
      {
        slug: 'image-resize',
        name: 'Resize Image',
        icon: 'Maximize',
      },
      {
        slug: 'image-convert',
        name: 'Format Convert',
        icon: 'RefreshCw',
      },
      {
        slug: 'image-crop',
        name: 'Crop Image',
        icon: 'Crop',
      },
      {
        slug: 'exif-viewer',
        name: 'EXIF Viewer',
        icon: 'Info',
      },
      { slug: 'svg-minify', name: 'SVG Minifier', icon: 'Minimize' },
      { slug: 'gif-split', name: 'GIF Splitter', icon: 'Split' },
      { slug: 'video-trim', name: 'Video Trim', icon: 'Scissors' },
      {
        slug: 'audio-convert',
        name: 'Audio Convert',
        icon: 'Music',
      },
      {
        slug: 'icon-spriter',
        name: 'SVG Sprite Gen',
        icon: 'Layers',
      },
      {
        slug: 'lorem-image',
        name: 'Placeholder Img',
        icon: 'ImageIcon',
      },
      { slug: 'image-to-pdf', name: 'Img→PDF', icon: 'FileType' },
    ],
  },
  {
    id: 'encryption-hashing',
    tools: [
      { slug: 'md5-hash', name: 'MD5 Hash', icon: 'Hash' },
      {
        slug: 'sha256-hash',
        name: 'SHA-256 Hash',
        icon: 'Hash',
      },
      { slug: 'bcrypt-hash', name: 'Bcrypt Hash', icon: 'Lock' },
      { slug: 'file-hash', name: 'File Checksum', icon: 'FileCheck' },
      {
        slug: 'password-generator',
        name: 'Password Gen',
        icon: 'Key',
      },
    ],
  },
  {
    id: 'date-time',
    tools: [
      {
        slug: 'unix-timestamp',
        name: 'Timestamp↔Date',
        icon: 'Clock',
      },
      { slug: 'cron-parser', name: 'Cron Parser', icon: 'Timer' },
      { slug: 'time-diff', name: 'Time Diff', icon: 'CalendarDays' },
      {
        slug: 'timezone-convert',
        name: 'TZ Convert',
        icon: 'Globe',
      },
    ],
  },
  {
    id: 'data-format-conversion',
    tools: [
      {
        slug: 'json-pretty',
        name: 'JSON Formatter',
        icon: 'Braces',
      },
      { slug: 'yaml-to-json', name: 'YAML→JSON', icon: 'FileCode' },
      {
        slug: 'base64-encode',
        name: 'Base64⇄Text',
        icon: 'Binary',
      },
      {
        slug: 'url-encode',
        name: 'URL Encode / Decode',
        icon: 'Link',
      },
      {
        slug: 'json-to-ts',
        name: 'JSON→TS Interface',
        icon: 'FileType2',
      },
      { slug: 'csv-to-json', name: 'CSV→JSON', icon: 'Table2' },
      {
        slug: 'excel-to-json',
        name: 'XLSX→JSON',
        icon: 'FileSpreadsheet',
      },
      {
        slug: 'base64-image',
        name: 'Base64 Img Preview',
        icon: 'ImageIcon',
      },
      {
        slug: 'html-preview',
        name: 'Live HTML',
        icon: 'Code2',
      },
    ],
  },
  {
    id: 'network-tools',
    tools: [
      {
        slug: 'http-status',
        name: 'HTTP Status Lookup',
        href: 'https://manon.icu/http-status',
      },
      { slug: 'user-agent', name: 'UA Parser', icon: 'Smartphone' },
      {
        slug: 'mime-search',
        name: 'MIME Type Search',
        icon: 'FileSearch',
      },
      { slug: 'dns-lookup', name: 'DNS Lookup', icon: 'Server' },
      { slug: 'ip-info', name: 'IP Info', icon: 'MapPin' },
      { slug: 'url-parser', name: 'URL Inspector', icon: 'ExternalLink' },
    ],
  },
  {
    id: 'random-generator',
    tools: [
      { slug: 'uuid-generator', name: 'UUID v4', icon: 'Fingerprint' },
      { slug: 'uuid-batch', name: 'UUID Batch', icon: 'Copy' },
      { slug: 'qr-generator', name: 'QR Maker', icon: 'QrCode' },
      {
        slug: 'barcode-generator',
        name: 'Barcode Maker',
        icon: 'ScanLine',
      },
      { slug: 'fake-user', name: 'Fake User', icon: 'UserCheck' },
      { slug: 'lottery-picker', name: 'Lottery Pick', icon: 'Dices' },
    ],
  },
  {
    id: 'other-development-tools',
    tools: [
      { slug: 'jwt-decode', name: 'JWT Decoder', icon: 'KeyRound' },
      { slug: 'jwt-generator', name: 'JWT Signer', icon: 'KeySquare' },
      {
        slug: 'regex-cheatsheet',
        name: 'RegEx 速查',
        icon: 'BookOpen',
      },
      {
        slug: 'json-diff',
        name: 'JSON Diff Viewer',
        icon: 'GitCompareArrows',
      },
      { slug: 'json-plot', name: 'JSON Plot', icon: 'BarChart3' },
      {
        slug: 'markdown-mermaid',
        name: 'Mermaid Preview',
        icon: 'Workflow',
      },
      {
        slug: 'prime-checker',
        name: 'Prime Check',
        icon: 'Calculator',
      },
      {
        slug: 'quadratic-solver',
        name: 'Quadratic',
        icon: 'Function',
      },
      {
        slug: 'matrix-math',
        name: 'Matrix Ops',
        icon: 'Grid3X3',
      },
      {
        slug: 'currency-convert',
        name: 'Currency FX',
        icon: 'DollarSign',
      },
      {
        slug: 'roman-numeral',
        name: 'Roman↔Arab',
        icon: 'Languages',
      },
    ],
  },
  {
    id: 'developer-tools',
    tools: [
      {
        slug: 'code-formatter',
        name: 'Code Formatter',
        icon: 'Code',
      },
      {
        slug: 'api-tester',
        name: 'API Tester',
        icon: 'Globe',
      },
      {
        slug: 'performance-analyzer',
        name: 'Performance Analyzer',
        icon: 'Activity',
      },
      {
        slug: 'performance-tester',
        name: 'Performance Tester',
        icon: 'Activity',
      },
      {
        slug: 'benchmark-tester',
        name: 'Benchmark Tester',
        icon: 'BarChart3',
      },
      {
        slug: 'git-helper',
        name: 'Git Helper',
        icon: 'GitBranch',
      },
      // {
      //   slug: 'password-strength',
      //   name: 'Password Strength',
      //   icon: 'Shield',
      // },
    ],
  },
]

export default data
