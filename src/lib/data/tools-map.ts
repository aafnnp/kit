// 统一的工具组件加载映射，供路由与预加载共用

// 绝对路径映射（Vite 要求以 /src 开头才能在构建时收集）
export const toolsModules = import.meta.glob('/src/components/tools/*/index.tsx')

// slug -> loader 的便捷映射
export function getToolLoaderBySlug(slug: string) {
  const path = `/src/components/tools/${slug}/index.tsx`
  return toolsModules[path]
}

export function hasTool(slug: string) {
  return Boolean(getToolLoaderBySlug(slug))
}
