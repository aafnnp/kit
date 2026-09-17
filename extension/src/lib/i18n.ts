import { browser } from "wxt/browser"

/**
 * 扩展界面的语言环境。
 *
 * 这里刻意不做"中央词典"：所有文案用 `tt("中文", "English")` 就地写出，
 * 插件作者不会因为忘记补词条而漏翻译，也让插件目录自带完整文案、可以整体复制走。
 */
export type Locale = "zh-CN" | "en"

/** 插件元数据里的双语字段 */
export interface LocalizedText {
  "zh-CN": string
  en: string
}

function detectLocale(): Locale {
  try {
    const raw = browser.i18n?.getUILanguage?.() ?? globalThis.navigator?.language ?? "zh-CN"
    return raw.toLowerCase().startsWith("zh") ? "zh-CN" : "en"
  } catch {
    return "zh-CN"
  }
}

export const locale: Locale = detectLocale()

/** 内联双语：`tt("复制", "Copy")` */
export function tt(zh: string, en: string): string {
  return locale === "en" ? en : zh
}

/** 读取插件元数据里的双语字段 */
export function resolveText(text: LocalizedText): string {
  return text[locale] || text["zh-CN"]
}
