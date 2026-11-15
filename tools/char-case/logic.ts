import { reverseGraphemes } from "../../lib/text"

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
    .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
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
  return lower.replace(/(^\s*\p{Ll})|([.!?。！？]\s*\p{Ll})/gu, (match) => match.toUpperCase())
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
      return reverseGraphemes(input)
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
