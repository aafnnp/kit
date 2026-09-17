import { DEFAULT_ACTION, type KitPlugin, type PluginMeta } from "./types"

const ID_PATTERN = /^[a-z][a-z0-9-]*$/

/** 定义元数据（纯标记函数，不做校验，避免模块加载期抛错拖垮整个 UI） */
export function definePluginMeta(meta: PluginMeta): PluginMeta {
  return meta
}

/** 定义插件实现 */
export function definePlugin(plugin: KitPlugin): KitPlugin {
  return plugin
}

/**
 * 校验元数据并返回问题列表。
 * 由注册表在加载时收集为 pluginIssues，在「管理插件」页可见，
 * 而不是直接把 popup 打崩。
 */
export function validatePluginMeta(meta: PluginMeta | undefined, folderId: string): string[] {
  const problems: string[] = []

  if (!meta) return ["meta.ts 必须导出 meta（命名导出或默认导出）"]
  if (!meta.id) problems.push("缺少 id")
  else if (!ID_PATTERN.test(meta.id)) problems.push(`id "${meta.id}" 只能包含小写字母、数字与连字符`)
  else if (meta.id !== folderId) problems.push(`id "${meta.id}" 必须与目录名 "${folderId}" 一致`)

  if (!meta.icon) problems.push("缺少 icon")
  if (!meta.version) problems.push("缺少 version")
  if (!meta.name?.["zh-CN"] || !meta.name?.en) problems.push("name 需要同时提供 zh-CN 与 en")
  if (!meta.description?.["zh-CN"] || !meta.description?.en) {
    problems.push("description 需要同时提供 zh-CN 与 en")
  }

  if (meta.permissions?.length && meta.permissions.some((permission) => !permission.trim())) {
    problems.push("permissions 中存在空字符串")
  }

  return problems
}

/** 校验插件实现（在懒加载之后调用） */
export function validatePlugin(plugin: KitPlugin | undefined, folderId: string): string[] {
  const problems: string[] = []

  if (!plugin) return ["index.ts(x) 必须 default 导出一个插件对象"]
  if (!plugin.meta) problems.push("插件缺少 meta")
  else if (plugin.meta.id !== folderId) problems.push(`meta.id "${plugin.meta.id}" 与目录名 "${folderId}" 不一致`)
  if (!plugin.actions && !plugin.Panel) problems.push("插件至少需要提供 actions 或 Panel 之一")
  if (plugin.actions && !plugin.actions[DEFAULT_ACTION] && plugin.actions[DEFAULT_ACTION]) {
    problems.push(`${DEFAULT_ACTION} 动作重复定义`)
  }

  return problems
}
