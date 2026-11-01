export type CaseKind =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "reverse"

export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function titleCase(input: string): string {
  return input.replace(/(^|\s)(\S)/g, (_match, space: string, char: string) => `${space}${char.toUpperCase()}`)
}

export function sentenceCase(input: string): string {
  const lower = input.toLowerCase()
  return lower.replace(/(^\s*[a-z])|([.!?。！？]\s*[a-z])/g, (match) => match.toUpperCase())
}

export function convertCase(input: string, kind: CaseKind): string {
  switch (kind) {
    case "upper":
      return input.toUpperCase()
    case "lower":
      return input.toLowerCase()
    case "title":
      return titleCase(input)
    case "sentence":
      return sentenceCase(input)
    case "camel": {
      const words = splitWords(input)
      return words.map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word.toLowerCase()))).join("")
    }
    case "pascal":
      return splitWords(input).map((word) => capitalize(word.toLowerCase())).join("")
    case "snake":
      return splitWords(input).map((word) => word.toLowerCase()).join("_")
    case "kebab":
      return splitWords(input).map((word) => word.toLowerCase()).join("-")
    case "constant":
      return splitWords(input).map((word) => word.toUpperCase()).join("_")
    case "reverse":
      return [...input].reverse().join("")
  }
}

export const caseOptions: { kind: CaseKind; zh: string; en: string }[] = [
  { kind: "upper", zh: "全部大写", en: "UPPER CASE" },
  { kind: "lower", zh: "全部小写", en: "lower case" },
  { kind: "title", zh: "标题格式", en: "Title Case" },
  { kind: "sentence", zh: "句子格式", en: "Sentence case" },
  { kind: "camel", zh: "驼峰命名", en: "camelCase" },
  { kind: "pascal", zh: "帕斯卡命名", en: "PascalCase" },
  { kind: "snake", zh: "蛇形命名", en: "snake_case" },
  { kind: "kebab", zh: "短横线命名", en: "kebab-case" },
  { kind: "constant", zh: "常量命名", en: "CONSTANT_CASE" },
  { kind: "reverse", zh: "反转文本", en: "Reverse" },
]
