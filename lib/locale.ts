import { signal } from "nsh"
import { locale } from "nsh"
import type { Lang, Localized } from "./types"

function initialLang(): Lang {
  try {
    return locale().toLowerCase().startsWith("zh") ? "zh" : "en"
  } catch {
    return "en"
  }
}

/** The UI language. `L()` and `pick()` read it, so text updates in place. */
export const language = signal<Lang>(initialLang())

export function L(zh: string, en: string): string {
  return language() === "zh" ? zh : en
}

export function pick(value: Localized): string {
  return value[language()]
}

/** A number in the current language. */
export function n(value: number): string {
  return new Intl.NumberFormat(language() === "zh" ? "zh-CN" : "en-US").format(value)
}
