import type { ComponentType } from 'react'

const iconModules = import.meta.glob('../../node_modules/lucide-react/dist/esm/icons/*.js')

const iconCache = new Map<string, ComponentType<any> | null>()
const loadingCache = new Map<string, Promise<ComponentType<any> | null>>()

function toKebabCase(input: string) {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

export function getLoadedIconComponent(iconName: string): ComponentType<any> | null {
  return iconCache.get(iconName) ?? null
}

export async function loadIconComponent(iconName: string): Promise<ComponentType<any> | null> {
  if (!iconName) {
    return null
  }

  if (iconCache.has(iconName)) {
    return iconCache.get(iconName) ?? null
  }

  if (loadingCache.has(iconName)) {
    return loadingCache.get(iconName) ?? null
  }

  const kebabName = toKebabCase(iconName)
  const modulePath = `../../node_modules/lucide-react/dist/esm/icons/${kebabName}.js`
  const loader = iconModules[modulePath]

  if (!loader) {
    iconCache.set(iconName, null)
    return null
  }

  const promise = loader()
    .then((mod: any) => {
      const component = mod.default || mod[iconName] || null
      iconCache.set(iconName, component)
      loadingCache.delete(iconName)
      return component
    })
    .catch(() => {
      iconCache.set(iconName, null)
      loadingCache.delete(iconName)
      return null
    })

  loadingCache.set(iconName, promise)
  return promise
}

export function preloadIcons(iconNames: string[]) {
  iconNames.forEach((iconName) => {
    loadIconComponent(iconName).catch(() => null)
  })
}
