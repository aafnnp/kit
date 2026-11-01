import type { Component } from "nsh"
import type { Category, CategoryId, ToolMeta } from "../lib/types"
import JsonPretty from "./json-pretty"
import JsonToTs from "./json-to-ts"
import CsvToJson from "./csv-to-json"
import JwtDecode from "./jwt-decode"
import Base64Encode from "./base64-encode"
import UrlEncode from "./url-encode"
import WordCount from "./word-count"
import CharCase from "./char-case"
import DiffViewer from "./diff-viewer"
import RegexTester from "./regex-tester"
import LoremIpsum from "./lorem-ipsum"
import HashTool from "./hash"
import UuidGenerator from "./uuid-generator"
import PasswordGenerator from "./password-generator"
import UnixTimestamp from "./unix-timestamp"
import RomanNumeral from "./roman-numeral"
import PrimeChecker from "./prime-checker"
import QuadraticSolver from "./quadratic-solver"
import MarkdownToc from "./markdown-toc"
import JsonDiff from "./json-diff"
import HexRgb from "./hex-rgb"
import UrlParser from "./url-parser"
import TimeDiff from "./time-diff"
import CssClamp from "./css-clamp"
import BorderRadius from "./border-radius"
import GradientMaker from "./gradient-maker"
import ShadowGenerator from "./shadow-generator"
import RandomColor from "./random-color"
import TimezoneConvert from "./timezone-convert"
import MimeSearch from "./mime-search"
import HttpStatus from "./http-status"
import FakeUserGenerator from "./fake-user"
import LotteryPicker from "./lottery-picker"
import MatrixMath from "./matrix-math"
import RegexCheatsheet from "./regex-cheatsheet"
import CronParser from "./cron-parser"
import TableSorter from "./table-sorter"
import GitHelper from "./git-helper"
import LegacyMigrationTool from "./legacy-migration"
import { legacyToolMeta } from "./legacy-migration/catalog"

export interface ToolDefinition extends ToolMeta {
  component: Component
}

export const categories: Category[] = [
  { id: "data", accent: "cyan", icon: "🧩", name: { zh: "数据格式", en: "Data" } },
  { id: "encoding", accent: "cyan", icon: "🔤", name: { zh: "编码 / 解码", en: "Encoders / Decoders" } },
  { id: "text", accent: "violet", icon: "📝", name: { zh: "文本工具", en: "Text" } },
  { id: "design", accent: "violet", icon: "🎨", name: { zh: "颜色与设计", en: "Color & Design" } },
  { id: "crypto", accent: "orange", icon: "🔐", name: { zh: "加密与生成器", en: "Crypto & Generators" } },
  { id: "datetime", accent: "cyan", icon: "⏱️", name: { zh: "日期与时间", en: "Date & Time" } },
  { id: "developer", accent: "violet", icon: "🛠️", name: { zh: "开发工具", en: "Developer Tools" } },
  { id: "network", accent: "cyan", icon: "🌐", name: { zh: "网络工具", en: "Network Tools" } },
  { id: "media", accent: "orange", icon: "🖼️", name: { zh: "图像与媒体", en: "Images & Media" } },
]

export const tools: ToolDefinition[] = [
  {
    slug: "json-pretty",
    category: "data",
    icon: "🧾",
    name: { zh: "JSON 格式化", en: "JSON Formatter" },
    description: { zh: "格式化、压缩并排序 JSON，快速定位结构问题。", en: "Format, minify and sort JSON with precise errors." },
    keywords: ["json", "format", "minify", "pretty", "格式化", "压缩"],
    component: JsonPretty,
  },
  {
    slug: "json-to-ts",
    category: "data",
    icon: "🪄",
    name: { zh: "JSON 转 TypeScript", en: "JSON to TypeScript" },
    description: { zh: "从 JSON 样本生成 TypeScript 接口。", en: "Generate TypeScript interfaces from a JSON sample." },
    keywords: ["json", "typescript", "interface", "type", "类型"],
    component: JsonToTs,
  },
  {
    slug: "csv-to-json",
    category: "data",
    icon: "📊",
    name: { zh: "CSV 转 JSON", en: "CSV to JSON" },
    description: { zh: "解析 CSV（含引号与换行）并输出 JSON。", en: "Parse CSV with quoted fields and newlines into JSON." },
    keywords: ["csv", "json", "table", "表格"],
    component: CsvToJson,
  },
  {
    slug: "jwt-decode",
    category: "data",
    icon: "🎫",
    name: { zh: "JWT 解码", en: "JWT Decoder" },
    description: { zh: "查看 JWT 头部、载荷与过期状态（不校验签名）。", en: "Inspect JWT header, payload and expiry without verifying." },
    keywords: ["jwt", "token", "base64", "claims", "令牌"],
    component: JwtDecode,
  },
  {
    slug: "base64-encode",
    category: "encoding",
    icon: "🔡",
    name: { zh: "Base64 编解码", en: "Base64 Encoder / Decoder" },
    description: { zh: "UTF-8 文本与 Base64 互转，支持 URL 安全格式。", en: "Convert UTF-8 text to and from Base64, URL-safe too." },
    keywords: ["base64", "encode", "decode", "编码", "解码"],
    component: Base64Encode,
  },
  {
    slug: "url-encode",
    category: "encoding",
    icon: "🔗",
    name: { zh: "URL 编解码", en: "URL Encoder / Decoder" },
    description: { zh: "对 URL 组件或完整链接进行百分号编解码。", en: "Percent-encode or decode URL components and full URLs." },
    keywords: ["url", "uri", "percent", "encode", "decode", "编码"],
    component: UrlEncode,
  },
  {
    slug: "word-count",
    category: "text",
    icon: "🔢",
    name: { zh: "字数统计", en: "Word & Character Count" },
    description: { zh: "统计字符、单词、句子、段落与阅读时间。", en: "Count characters, words, sentences, paragraphs and reading time." },
    keywords: ["word", "count", "character", "统计", "字数"],
    component: WordCount,
  },
  {
    slug: "char-case",
    category: "text",
    icon: "🔠",
    name: { zh: "大小写转换", en: "Case Converter" },
    description: { zh: "大小写、标题、驼峰、蛇形与短横线命名互转。", en: "Convert to upper, lower, title, camel, snake, kebab and more." },
    keywords: ["case", "camel", "snake", "kebab", "大小写", "命名"],
    component: CharCase,
  },
  {
    slug: "diff-viewer",
    category: "text",
    icon: "🔀",
    name: { zh: "文本差异对比", en: "Text Diff" },
    description: { zh: "逐行比较两段文本，标出新增与删除。", en: "Compare two texts line by line and mark additions and removals." },
    keywords: ["diff", "compare", "text", "对比", "差异"],
    component: DiffViewer,
  },
  {
    slug: "regex-tester",
    category: "text",
    icon: "🧪",
    name: { zh: "正则测试器", en: "Regex Tester" },
    description: { zh: "实时匹配正则、高亮结果并查看捕获组。", en: "Test regular expressions, highlight matches and inspect groups." },
    keywords: ["regex", "regexp", "match", "正则"],
    component: RegexTester,
  },
  {
    slug: "lorem-ipsum",
    category: "text",
    icon: "📄",
    name: { zh: "Lorem Ipsum 生成器", en: "Lorem Ipsum Generator" },
    description: { zh: "生成指定段落数的占位文本。", en: "Generate placeholder paragraphs for mockups." },
    keywords: ["lorem", "ipsum", "placeholder", "假文", "占位"],
    component: LoremIpsum,
  },
  {
    slug: "hash",
    category: "crypto",
    icon: "🔐",
    name: { zh: "哈希计算", en: "Hash & Checksum" },
    description: { zh: "计算 MD5、SHA-1、SHA-256/384/512 摘要。", en: "Compute MD5, SHA-1 and SHA-256/384/512 digests." },
    keywords: ["hash", "md5", "sha256", "checksum", "哈希", "摘要"],
    component: HashTool,
  },
  {
    slug: "uuid-generator",
    category: "crypto",
    icon: "🆔",
    name: { zh: "UUID 生成器", en: "UUID Generator" },
    description: { zh: "批量生成 UUID v4，可复制全部结果。", en: "Generate UUID v4 values in bulk." },
    keywords: ["uuid", "guid", "id", "生成"],
    component: UuidGenerator,
  },
  {
    slug: "password-generator",
    category: "crypto",
    icon: "🗝️",
    name: { zh: "密码生成器", en: "Password Generator" },
    description: { zh: "使用安全随机数生成强密码并评估强度。", en: "Generate strong passwords with secure randomness." },
    keywords: ["password", "passphrase", "random", "密码"],
    component: PasswordGenerator,
  },
  {
    slug: "unix-timestamp",
    category: "datetime",
    icon: "🕒",
    name: { zh: "Unix 时间戳", en: "Unix Timestamp" },
    description: { zh: "时间戳与本地/UTC 日期互转，查看当前时间。", en: "Convert between timestamps and local or UTC dates." },
    keywords: ["timestamp", "unix", "date", "time", "时间戳", "日期"],
    component: UnixTimestamp,
  },
  {
    slug: "roman-numeral",
    category: "data",
    icon: "🔢",
    name: { zh: "罗马数字转换", en: "Roman Numeral Converter" },
    description: { zh: "在 1–3999 与标准罗马数字之间互转。", en: "Convert between integers 1–3999 and canonical Roman numerals." },
    keywords: ["roman", "numeral", "罗马数字", "数字转换"],
    component: RomanNumeral,
  },
  {
    slug: "prime-checker",
    category: "data",
    icon: "🔍",
    name: { zh: "质数检查", en: "Prime Checker" },
    description: { zh: "使用确定性算法检查有符号 64 位整数。", en: "Check signed 64-bit integers with a deterministic primality test." },
    keywords: ["prime", "number", "质数", "素数"],
    component: PrimeChecker,
  },
  {
    slug: "quadratic-solver",
    category: "data",
    icon: "➗",
    name: { zh: "二次方程求解器", en: "Quadratic Solver" },
    description: { zh: "求解二次方程，支持实数根、复数根与退化情形。", en: "Solve quadratic equations with real, complex and degenerate cases." },
    keywords: ["quadratic", "equation", "math", "方程", "求根"],
    component: QuadraticSolver,
  },
  {
    slug: "markdown-toc",
    category: "text",
    icon: "📑",
    name: { zh: "Markdown 目录", en: "Markdown TOC" },
    description: { zh: "从 Markdown 标题生成带层级与锚点的目录。", en: "Generate a nested table of contents with heading anchors." },
    keywords: ["markdown", "toc", "table of contents", "目录", "标题"],
    component: MarkdownToc,
  },
  {
    slug: "json-diff",
    category: "data",
    icon: "🔀",
    name: { zh: "JSON 差异对比", en: "JSON Diff" },
    description: { zh: "递归比较两个 JSON 值并列出新增、删除与修改。", en: "Recursively compare JSON values and list additions, removals and changes." },
    keywords: ["json", "diff", "compare", "差异", "对比"],
    component: JsonDiff,
  },
  {
    slug: "hex-rgb",
    category: "design",
    icon: "🎨",
    name: { zh: "颜色格式转换", en: "Color Format Converter" },
    description: { zh: "转换 HEX、RGB、HSL、HSV 与 CMYK，并检查文字对比度。", en: "Convert HEX, RGB, HSL, HSV and CMYK with text contrast ratios." },
    keywords: ["color", "hex", "rgb", "hsl", "hsv", "cmyk", "颜色"],
    component: HexRgb,
  },
  {
    slug: "url-parser",
    category: "encoding",
    icon: "🔎",
    name: { zh: "URL 检查器", en: "URL Inspector" },
    description: { zh: "拆解 URL、路径与查询参数，不会访问目标地址。", en: "Inspect URL components, path segments and query parameters without fetching the URL." },
    keywords: ["url", "parse", "query", "inspect", "链接", "参数"],
    component: UrlParser,
  },
  {
    slug: "time-diff",
    category: "datetime",
    icon: "⏳",
    name: { zh: "时间差计算", en: "Time Difference" },
    description: { zh: "计算两个日期之间的准确经过时长。", en: "Calculate the precise elapsed time between two dates." },
    keywords: ["time", "date", "duration", "difference", "时间差", "时长"],
    component: TimeDiff,
  },
  {
    slug: "css-clamp",
    category: "design",
    icon: "↔️",
    name: { zh: "CSS clamp 生成器", en: "CSS clamp Generator" },
    description: { zh: "根据视口范围生成流体尺寸 CSS。", en: "Generate fluid CSS sizing for a chosen viewport range." },
    keywords: ["css", "clamp", "responsive", "fluid", "响应式", "尺寸"],
    component: CssClamp,
  },
  {
    slug: "border-radius",
    category: "design",
    icon: "◜",
    name: { zh: "圆角生成器", en: "Border Radius Generator" },
    description: { zh: "设置四角圆角并生成精简 CSS 简写。", en: "Set four corner radii and generate compact CSS shorthand." },
    keywords: ["css", "border", "radius", "圆角"],
    component: BorderRadius,
  },
  {
    slug: "gradient-maker",
    category: "design",
    icon: "🌈",
    name: { zh: "渐变生成器", en: "Gradient Generator" },
    description: { zh: "用两个颜色和角度生成 CSS 线性渐变。", en: "Create a CSS linear gradient from two colors and an angle." },
    keywords: ["css", "gradient", "linear", "渐变"],
    component: GradientMaker,
  },
  {
    slug: "shadow-generator",
    category: "design",
    icon: "▧",
    name: { zh: "阴影生成器", en: "Box Shadow Generator" },
    description: { zh: "生成并预览可配置的 CSS box-shadow。", en: "Generate and preview configurable CSS box shadows." },
    keywords: ["css", "shadow", "box-shadow", "阴影"],
    component: ShadowGenerator,
  },
  {
    slug: "random-color",
    category: "design",
    icon: "🎲",
    name: { zh: "随机颜色", en: "Random Color" },
    description: { zh: "生成并复制随机 HEX 颜色。", en: "Generate and copy random HEX colors." },
    keywords: ["color", "random", "hex", "颜色", "随机"],
    component: RandomColor,
  },
  {
    slug: "timezone-convert",
    category: "datetime",
    icon: "🌐",
    name: { zh: "时区转换", en: "Time Zone Converter" },
    description: { zh: "查看一个时刻在常用城市的当地时间，自动考虑夏令时。", en: "See an instant in common cities, including daylight-saving changes." },
    keywords: ["timezone", "world clock", "utc", "时区", "世界时钟"],
    component: TimezoneConvert,
  },
  {
    slug: "mime-search",
    category: "data",
    icon: "🗂️",
    name: { zh: "MIME 类型查询", en: "MIME Type Lookup" },
    description: { zh: "按扩展名或 MIME 名称查询常见文件格式。", en: "Look up common file formats by extension or MIME type." },
    keywords: ["mime", "extension", "file type", "文件类型", "扩展名"],
    component: MimeSearch,
  },
  {
    slug: "http-status",
    category: "data",
    icon: "🌐",
    name: { zh: "HTTP 状态码", en: "HTTP Status Codes" },
    description: { zh: "搜索常见 HTTP 状态码及其含义。", en: "Search common HTTP status codes and their meanings." },
    keywords: ["http", "status", "code", "response", "状态码"],
    component: HttpStatus,
  },
  {
    slug: "fake-user",
    category: "data",
    icon: "👤",
    name: { zh: "虚拟用户生成器", en: "Fake User Generator" },
    description: { zh: "生成使用保留测试域名的合成资料。", en: "Generate synthetic user data with a reserved test domain." },
    keywords: ["fake", "user", "mock", "test data", "虚拟用户", "测试数据"],
    component: FakeUserGenerator,
  },
  {
    slug: "lottery-picker",
    category: "data",
    icon: "🎯",
    name: { zh: "随机抽选", en: "Random Picker" },
    description: { zh: "从名单中随机抽取指定数量且不重复的条目。", en: "Draw a requested number of unique entries from a list." },
    keywords: ["lottery", "random", "pick", "抽选", "随机"],
    component: LotteryPicker,
  },
  {
    slug: "matrix-math",
    category: "data",
    icon: "🧮",
    name: { zh: "矩阵计算器", en: "Matrix Calculator" },
    description: { zh: "执行矩阵加法、减法、乘法与转置。", en: "Add, subtract, multiply and transpose matrices." },
    keywords: ["matrix", "math", "linear algebra", "矩阵", "线性代数"],
    component: MatrixMath,
  },
  {
    slug: "regex-cheatsheet",
    category: "text",
    icon: "📚",
    name: { zh: "正则表达式速查", en: "Regex Cheat Sheet" },
    description: { zh: "搜索 JavaScript 正则表达式语法与示例。", en: "Search JavaScript regular expression syntax and examples." },
    keywords: ["regex", "regular expression", "cheatsheet", "速查", "正则"],
    component: RegexCheatsheet,
  },
  {
    slug: "cron-parser",
    category: "datetime",
    icon: "🗓️",
    name: { zh: "Cron 表达式解析", en: "Cron Parser" },
    description: { zh: "验证五字段 Cron 表达式并列出未来运行时间。", en: "Validate five-field cron expressions and list upcoming run times." },
    keywords: ["cron", "schedule", "scheduler", "计划任务", "定时"],
    component: CronParser,
  },
  {
    slug: "table-sorter",
    category: "data",
    icon: "↕️",
    name: { zh: "表格排序", en: "Table Sorter" },
    description: { zh: "按文本或数值稳定排序 CSV 表格行。", en: "Stably sort CSV table rows as text or numbers." },
    keywords: ["table", "csv", "sort", "spreadsheet", "表格", "排序"],
    component: TableSorter,
  },
  {
    slug: "git-helper",
    category: "developer",
    icon: "🌿",
    name: { zh: "Git 命令助手", en: "Git Command Helper" },
    description: { zh: "搜索常用 Git 命令并复制到终端。", en: "Search and copy common Git commands to your terminal." },
    keywords: ["git", "command", "branch", "commit", "remote", "stash", "仓库", "分支"],
    component: GitHelper,
  },
  ...legacyToolMeta.map((meta) => ({ ...meta, component: LegacyMigrationTool })),
]

const categoryOrder = new Map<CategoryId, number>(categories.map((category, index) => [category.id, index]))

export function toolsInCategory(id: CategoryId) {
  return tools.filter((tool) => tool.category === id)
}

export function findTool(slug: string) {
  return tools.find((tool) => tool.slug === slug)
}

export function categoryOf(tool: ToolDefinition) {
  return categories.find((category) => category.id === tool.category)!
}

export function searchTools(query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return []
  return tools
    .filter((tool) => {
      const haystack = [
        tool.slug,
        tool.name.zh,
        tool.name.en,
        tool.description.zh,
        tool.description.en,
        ...tool.keywords,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(needle)
    })
    .sort((a, b) => (categoryOrder.get(a.category) ?? 0) - (categoryOrder.get(b.category) ?? 0))
}
