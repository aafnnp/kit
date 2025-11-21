import type { ComponentType } from 'react'
import * as LucideIcons from 'lucide-react'

const iconCache = new Map<string, ComponentType<any> | null>()

export function getLoadedIconComponent(iconName: string): ComponentType<any> | null {
  return iconCache.get(iconName) ?? null
}

export async function loadIconComponent(iconName: string): Promise<ComponentType<any> | null> {
  if (!iconName) {
    return Promise.resolve(null)
  }

  // Check cache first
  if (iconCache.has(iconName)) {
    return Promise.resolve(iconCache.get(iconName) ?? null)
  }

  // Try to get icon from LucideIcons namespace
  const IconComponent = (LucideIcons as any)[iconName] as ComponentType<any> | undefined

  if (IconComponent) {
    iconCache.set(iconName, IconComponent)
    return Promise.resolve(IconComponent)
  }

  // Icon not found, cache null to prevent retrying
  iconCache.set(iconName, null)
  return Promise.resolve(null)
}

export function preloadIcons(iconNames: string[]) {
  iconNames.forEach((iconName) => {
    loadIconComponent(iconName).catch(() => null)
  })
}
