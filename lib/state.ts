import { effect, signal, Storage } from "nsh"
import type { YNode } from "nsh"
import type { Lang } from "./types"
import { language } from "./locale"
export { language }

export type Appearance = "system" | "light" | "dark"

export type Route =
  | { name: "home" }
  | { name: "settings" }
  | { name: "tool"; slug: string }

export const route = signal<Route>({ name: "home" })
export const search = signal("")
export const favorites = signal<string[]>([])
export const recent = signal<string[]>([])
export const appearance = signal<Appearance>("system")
export const collapsed = signal<Record<string, boolean>>({})
export const hydrated = signal(false)

let searchInput: YNode | undefined

export function registerSearchInput(ref: YNode | undefined) {
  searchInput = ref
}

export function focusSearch() {
  searchInput?.focus()
}

export function clearSearch() {
  search.set("")
}

/** The slug of the open tool, or null on the home and settings screens. */
export function activeSlug(): string | null {
  const current = route()
  return current.name === "tool" ? current.slug : null
}

export function isFavorite(slug: string) {
  return favorites().includes(slug)
}

export function toggleFavorite(slug: string) {
  const current = favorites()
  favorites.set(current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug])
}

export function toggleCategory(id: string) {
  const current = collapsed()
  collapsed.set({ ...current, [id]: !current[id] })
}

export function isCollapsed(id: string) {
  return collapsed()[id] === true
}

export function openTool(slug: string) {
  route.set({ name: "tool", slug })
  search.set("")
  const current = recent().filter((item) => item !== slug)
  recent.set([slug, ...current].slice(0, 8))
}

export function goHome() {
  route.set({ name: "home" })
  search.set("")
}

export function openSettings() {
  route.set({ name: "settings" })
  search.set("")
}

export function clearHistory() {
  recent.set([])
  favorites.set([])
}

const KEYS = {
  favorites: "kit.favorites",
  recent: "kit.recent",
  language: "kit.language",
  appearance: "kit.appearance",
} as const

function parseArray(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

/**
 * Loads persisted settings, then marks the state hydrated so the effects
 * below start writing. Called once from App.tsx.
 */
export async function hydrate() {
  try {
    const [storedFavorites, storedRecent, storedLanguage, storedAppearance] = await Promise.all([
      Storage.getItem(KEYS.favorites),
      Storage.getItem(KEYS.recent),
      Storage.getItem(KEYS.language),
      Storage.getItem(KEYS.appearance),
    ])

    favorites.set(parseArray(storedFavorites))
    recent.set(parseArray(storedRecent))
    if (storedLanguage === "zh" || storedLanguage === "en") language.set(storedLanguage as Lang)
    if (storedAppearance === "system" || storedAppearance === "light" || storedAppearance === "dark") {
      appearance.set(storedAppearance)
    }
  } catch {
    // Storage is optional: the app still works without persisted settings.
  } finally {
    hydrated.set(true)
  }
}

function persist(key: string, value: () => string) {
  effect(() => {
    const text = value()
    if (!hydrated()) return
    void Storage.setItem(key, text).catch(() => {})
  })
}

persist(KEYS.favorites, () => JSON.stringify(favorites()))
persist(KEYS.recent, () => JSON.stringify(recent()))
persist(KEYS.language, () => language())
persist(KEYS.appearance, () => appearance())
