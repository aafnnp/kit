import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 语言包按需加载（不再全量打包 zh/en）
const localeModules = import.meta.glob<{ default: Record<string, unknown> }>('./translations/*.ts')

export const SUPPORTED_LOCALES = ['zh', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const normalizeLocale = (lng?: string | null): SupportedLocale => (lng && lng.startsWith('en') ? 'en' : 'zh')

/** 按需加载指定语言包 */
export async function loadLanguageBundle(lng: SupportedLocale): Promise<void> {
  if (i18n.hasResourceBundle(lng, 'translation')) return
  const mod = await localeModules[`./translations/${lng}.ts`]()
  i18n.addResourceBundle(lng, 'translation', mod.default)
}

/** 切换语言（自动按需加载语言包） */
export async function changeLocale(lng: SupportedLocale): Promise<void> {
  await loadLanguageBundle(lng)
  await i18n.changeLanguage(lng)
}

/** 初始化：加载检测语言，zh 用户不加载 en 包（fallback 语言兜底） */
export async function initI18n(): Promise<typeof i18n> {
  await i18n.use(LanguageDetector).use(initReactI18next).init({
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

  const detected = normalizeLocale(i18n.resolvedLanguage)
  await loadLanguageBundle(detected)
  // en 用户额外加载 zh 兜底，避免缺失 key 时显示 key 名
  if (detected !== 'zh') {
    await loadLanguageBundle('zh')
  }
  await i18n.changeLanguage(detected)

  return i18n
}

export default i18n
