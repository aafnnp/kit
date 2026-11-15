import type { Localized } from "../../lib/types"

export interface RegexTip {
  title: Localized
  pattern: string
  description: Localized
  example: string
}

export const regexTips: RegexTip[] = [
  {
    title: { zh: "任意字符", en: "Any character" },
    pattern: ".",
    description: { zh: "默认匹配除换行符以外的任意字符。", en: "Matches any character except line breaks by default." },
    example: "a.c → abc, a-c",
  },
  {
    title: { zh: "数字", en: "Digit" },
    pattern: "\\d",
    description: { zh: "匹配一个十进制数字；在 JavaScript 中等价于 [0-9]。", en: "Matches one decimal digit; equivalent to [0-9] in JavaScript." },
    example: "\\d+ → 42",
  },
  {
    title: { zh: "单词字符", en: "Word character" },
    pattern: "\\w",
    description: { zh: "匹配字母、数字或下划线。", en: "Matches letters, digits or underscore." },
    example: "\\w+ → hello_2",
  },
  {
    title: { zh: "空白字符", en: "Whitespace" },
    pattern: "\\s",
    description: { zh: "匹配空格、制表符和换行等空白字符。", en: "Matches whitespace such as spaces, tabs and line breaks." },
    example: "a\\sb → a b",
  },
  {
    title: { zh: "开头 / 结尾", en: "Start / end" },
    pattern: "^text$",
    description: { zh: "^ 锚定开头；$ 锚定输入或行的结尾。", en: "^ anchors to the start; $ anchors to the end of the input or line." },
    example: "^kit$ → kit",
  },
  {
    title: { zh: "一次或多次", en: "One or more" },
    pattern: "a+",
    description: { zh: "匹配前一个标记的一次或多次出现。", en: "Matches one or more occurrences of the preceding token." },
    example: "a+ → a, aaa",
  },
  {
    title: { zh: "零次或多次", en: "Zero or more" },
    pattern: "a*",
    description: { zh: "匹配前一个标记的零次或多次出现。", en: "Matches zero or more occurrences of the preceding token." },
    example: "a* → aaa, a, (empty)",
  },
  {
    title: { zh: "可选", en: "Optional" },
    pattern: "a?",
    description: { zh: "使前一个标记变为可选。", en: "Makes the preceding token optional." },
    example: "https? → http, https",
  },
  {
    title: { zh: "字符集合", en: "Character set" },
    pattern: "[abc]",
    description: { zh: "匹配方括号中列出的任意一个字符。", en: "Matches any one character listed inside the brackets." },
    example: "[aeiou] → one vowel",
  },
  {
    title: { zh: "否定字符集", en: "Negated set" },
    pattern: "[^abc]",
    description: { zh: "匹配未列在方括号中的任意一个字符。", en: "Matches any one character not listed inside the brackets." },
    example: "[^0-9] → non-digit",
  },
  {
    title: { zh: "捕获组", en: "Capture group" },
    pattern: "(abc)",
    description: { zh: "将标记分组并捕获匹配到的文本。", en: "Groups tokens and captures the matched text." },
    example: "(\\d{4})-(\\d{2})",
  },
  {
    title: { zh: "非捕获组", en: "Non-capturing group" },
    pattern: "(?:abc)",
    description: { zh: "将标记分组，但不创建捕获组。", en: "Groups tokens without creating a capture group." },
    example: "(?:jpg|png)",
  },
  {
    title: { zh: "或运算", en: "Alternation" },
    pattern: "cat|dog",
    description: { zh: "匹配 | 前或后的表达式。", en: "Matches either the expression before or after |." },
    example: "cat|dog → cat, dog",
  },
  {
    title: { zh: "单词边界", en: "Word boundary" },
    pattern: "\\bword\\b",
    description: { zh: "匹配标记前后的单词边界。", en: "Matches a word boundary around a token." },
    example: "\\bkit\\b → kit",
  },
  {
    title: { zh: "惰性量词", en: "Lazy quantifier" },
    pattern: ".*?",
    description: { zh: "在整体可匹配的前提下尽可能少地匹配。", en: "Matches as little as possible while allowing the full expression to match." },
    example: "<.*?> → one tag",
  },
  {
    title: { zh: "正向先行断言", en: "Positive lookahead" },
    pattern: "foo(?=bar)",
    description: { zh: "又称前瞻：仅当 foo 后面跟着 bar 时才匹配 foo。", en: "Matches foo only when it is followed by bar." },
    example: "foo(?=bar) → foo",
  },
]

export function searchRegexTips(query: string): RegexTip[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return regexTips
  return regexTips.filter((tip) =>
    [tip.title.zh, tip.title.en, tip.pattern, tip.description.zh, tip.description.en, tip.example]
      .some((value) => value.toLowerCase().includes(needle)),
  )
}
