import { L } from "./locale"

const LABELS: Record<string, string> = {
  Input: "输入",
  Token: "令牌",
  Count: "数量",
  Timestamp: "时间戳",
  Minimum: "最小值",
  Maximum: "最大值",
  "Minimum viewport": "最小视口",
  "Maximum viewport": "最大视口",
  Angle: "角度",
  "X offset": "水平偏移",
  "Y offset": "垂直偏移",
  Blur: "模糊",
  Spread: "扩展",
  Opacity: "透明度",
  Number: "数字",
  Matrix: "矩阵",
  Entries: "条目",
  "Pick count": "抽取数量",
  "Left JSON": "左侧 JSON",
  "Right JSON": "右侧 JSON",
  "Original text": "原始文本",
  "New text": "新文本",
}

const EXACT: Record<string, string> = {
  "Input is empty": "输入为空。",
  "No rows found": "没有可转换的行。",
  "Pattern is empty": "正则表达式为空。",
  "Pattern or text is too large to evaluate safely": "正则表达式或测试文本过大，无法安全求值。",
  "Regex evaluation exceeded the 250 ms safety budget.": "正则执行超过 250 ms 安全预算。",
  "Invalid Base64 input": "Base64 输入无效。",
  "A JWT has three parts separated by dots": "JWT 必须由三个以点分隔的部分组成。",
  "Header is not a JSON object": "JWT 头部不是 JSON 对象。",
  "Payload is not a JSON object": "JWT 载荷不是 JSON 对象。",
  "Enter a valid absolute URL, including its scheme.": "请输入包含协议的完整 URL。",
  "Enter a 3/6-digit HEX color or rgb(r, g, b) value.": "请输入 3/6 位 HEX 颜色或 rgb(r, g, b)。",
  "Enter a HEX, rgb(), hsl() or named CSS color.": "请输入 HEX、rgb()、hsl() 或 CSS 颜色名。",
  "Alpha must be between 0 and 1.": "透明度必须在 0 到 1 之间。",
  "RGB percentages must be between 0 and 100.": "RGB 百分比必须在 0 到 100 之间。",
  "Hue must be an angle and saturation/lightness must be percentages.": "色相必须是角度，饱和度与亮度必须是百分比。",
  "Use rgb(r, g, b) or rgba(r, g, b, a).": "请使用 rgb(r, g, b) 或 rgba(r, g, b, a)。",
  "Use hsl(h, s%, l%) or hsla(h, s%, l%, a).": "请使用 hsl(h, s%, l%) 或 hsla(h, s%, l%, a)。",
  "RGB channels must be whole numbers from 0 to 255.": "RGB 通道必须是 0 到 255 的整数。",
  "Corner values must be non-negative finite numbers.": "圆角值必须是非负有限数字。",
  "Angle must be between 0 and 360 degrees.": "角度必须在 0 到 360 度之间。",
  "Offsets must be finite, blur must be non-negative, and opacity must be 0–100.": "偏移必须是有限数字，模糊不能为负，透明度必须在 0–100。",
  "Enter a valid CSS property name.": "请输入有效的 CSS 属性名。",
  "All values must be finite numbers.": "所有值必须是有限数字。",
  "Maximum value must be greater than a non-negative minimum.": "最大值必须大于非负的最小值。",
  "Maximum viewport must be greater than the minimum viewport.": "最大视口必须大于最小视口。",
  "Enter two valid dates or timestamps.": "请输入两个有效的日期或时间戳。",
  "Enter a valid date and time.": "请输入有效的日期时间。",
  "Built-in time-zone rules support years 2008–2035.": "内置时区规则仅支持 2008–2035 年。",
  "Unterminated quoted field": "存在未闭合的引号字段。",
  "The texts are too large to compare line by line": "文本过大，无法逐行比较。",
  "Enter a whole number.": "请输入整数。",
  "Enter a whole number from 1 to 3999.": "请输入 1 到 3999 的整数。",
  "Enter a Roman numeral using I, V, X, L, C, D or M.": "请输入由 I、V、X、L、C、D、M 组成的罗马数字。",
  "Invalid Roman numeral.": "罗马数字无效。",
  "That is not a valid canonical Roman numeral.": "这不是规范写法的罗马数字。",
  "Choose between 1 and 10 occurrences.": "请选择 1 到 10 次运行。",
  "Use five fields: minute hour day-of-month month day-of-week.": "请使用五个字段：分 时 日 月 周。",
  "Cron fields cannot be empty.": "Cron 字段不能为空。",
  "Start time must be a valid date.": "开始时间必须是有效日期。",
  "No matching occurrence found within the next eight years.": "未来八年内没有匹配的运行时间。",
  "Choose a column from the header row.": "请选择表头中的一列。",
  "Include a header row and at least one data row.": "请包含表头和至少一行数据。",
  "Every row must have the same number of columns.": "每行的列数必须一致。",
  "Entries cannot be empty.": "条目不能为空。",
  "Pick count must be a positive whole number.": "抽取数量必须是正整数。",
  "Pick count cannot exceed the number of unique entries.": "抽取数量不能超过去重后的条目数。",
  "Enter at least one matrix row.": "请至少输入一行矩阵。",
  "Matrix entries must be finite numbers.": "矩阵元素必须是有限数字。",
  "Enter a second matrix.": "请输入第二个矩阵。",
  "Addition and subtraction require matrices with matching dimensions.": "加减法要求两个矩阵维度一致。",
  "The first matrix's column count must match the second matrix's row count.": "第一个矩阵的列数必须等于第二个矩阵的行数。",
}

const RISKS: Record<string, string> = {
  "nested quantifiers can backtrack exponentially": "嵌套量词可能导致指数级回溯",
  "quantified alternatives share a prefix and can backtrack exponentially": "量化的分支共享前缀，可能导致指数级回溯",
}

function translate(message: string): string {
  const exact = EXACT[message]
  if (exact) return exact

  const risk = /^Pattern rejected for safety: (.+)\.$/.exec(message)
  if (risk) return `出于安全原因拒绝该正则：${RISKS[risk[1]!] ?? risk[1]}。`

  const zone = /^Unsupported time zone: (.+)$/.exec(message)
  if (zone) return `不支持的时区：${zone[1]}`

  const row = /^Row (\d+) has (\d+) columns; the header has (\d+)$/.exec(message)
  if (row) return `第 ${row[1]} 行有 ${row[2]} 列，表头有 ${row[3]} 列。`

  const encoding = /^Invalid URL encoding: (.+)$/.exec(message)
  if (encoding) return `URL 编码无效：${encoding[1]}`

  const limit = /^(.+) exceeds the 8 MiB processing limit\.$/.exec(message)
  if (limit) return `${LABELS[limit[1]!] ?? limit[1]}超过 8 MiB 处理上限。`

  const range = /^(.+) must be a whole number from (-?\d+) to (-?\d+)\.$/.exec(message)
  if (range) return `${LABELS[range[1]!] ?? range[1]}必须是 ${range[2]} 到 ${range[3]} 的整数。`

  const finite = /^(.+) must be a finite number\.$/.exec(message)
  if (finite) return `${LABELS[finite[1]!] ?? finite[1]}必须是有限数字。`

  const numeric = /^(.+) must be a number\.$/.exec(message)
  if (numeric) return `${LABELS[numeric[1]!] ?? numeric[1]}必须是数字。`

  return message
}

/** Translates the tool error messages the UI shows, keeping English as-is. */
export function localizeMessage(message: string): string {
  return L(translate(message), message)
}
