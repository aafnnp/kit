import { browser } from "wxt/browser"
import { defineBackground } from "wxt/utils/define-background"
import { tt, resolveText } from "@/lib/i18n"
import { createLogger } from "@/lib/log"
import { installInfoItem } from "@/lib/storage"
import { pluginCatalog } from "@/plugins/registry"
import { activateEnabledPlugins, runPluginAction } from "@/plugins/runtime"
import { getEnabledPluginIds, watchPluginStates } from "@/plugins/store"
import { DEFAULT_ACTION } from "@/plugins/types"

const log = createLogger("background")

const MENU_PREFIX = "kit:"

/**
 * 快捷键 → 插件动作的映射。
 * 快捷键本身在 wxt.config.ts 的 `commands` 里声明（manifest 静态字段），
 * 这里只负责把命令名翻译成插件动作。
 */
const COMMAND_TARGETS: Record<string, { pluginId: string; action: string }> = {
  "capture-visible": { pluginId: "screenshot", action: DEFAULT_ACTION },
  "copy-page-info": { pluginId: "page-info", action: "copy-markdown" },
}

export default defineBackground(() => {
  log.info("后台启动")

  browser.runtime.onInstalled.addListener((details) => {
    void handleInstalled(details.reason)
  })

  browser.commands.onCommand.addListener((command) => {
    const target = COMMAND_TARGETS[command]
    if (!target) return
    void runPluginAction(target.pluginId, target.action)
  })

  browser.contextMenus.onClicked.addListener((info) => {
    const menuId = String(info.menuItemId ?? "")
    if (!menuId.startsWith(MENU_PREFIX)) return

    const parsed = parseMenuId(menuId)
    if (!parsed) return
    void runPluginAction(parsed.pluginId, parsed.action)
  })

  // 启用状态变化 → 重建右键菜单（这是"插拔"在后台的落地点）
  watchPluginStates(() => {
    void rebuildContextMenus()
  })

  // 插件可以在 activate() 里注册自己的后台监听器
  void activateEnabledPlugins()

  void rebuildContextMenus()
})

function parseMenuId(menuId: string): { pluginId: string; action: string } | null {
  const [pluginId, itemId] = menuId.slice(MENU_PREFIX.length).split(":")
  if (!pluginId || !itemId) return null

  const item = pluginCatalog
    .find((meta) => meta.id === pluginId)
    ?.contributes?.menus?.find((menu) => menu.id === itemId)

  return { pluginId, action: item?.action ?? DEFAULT_ACTION }
}

/**
 * 右键菜单只能在 manifest 里静态声明权限，但菜单项本身按启用状态动态创建，
 * 因此这里是"插件注册表 → 浏览器菜单"的同步点。
 */
async function rebuildContextMenus(): Promise<void> {
  try {
    await browser.contextMenus.removeAll()
  } catch (error) {
    log.warn("清理右键菜单失败", error)
  }

  const enabledIds = new Set(await getEnabledPluginIds())

  for (const meta of pluginCatalog) {
    if (!enabledIds.has(meta.id)) continue

    for (const item of meta.contributes?.menus ?? []) {
      try {
        browser.contextMenus.create({
          id: `${MENU_PREFIX}${meta.id}:${item.id}`,
          title: resolveText(item.title),
          contexts: item.contexts,
        })
      } catch (error) {
        log.warn(`菜单项创建失败：${meta.id}/${item.id}`, error)
      }
    }
  }
}

async function handleInstalled(reason: string): Promise<void> {
  const version = browser.runtime.getManifest().version
  const info = await installInfoItem.getValue()
  const firstInstalledAt = info?.firstInstalledAt || Date.now()

  await installInfoItem.setValue({ firstInstalledAt, lastVersion: version })
  await rebuildContextMenus()

  if (reason === "install" || !info?.firstInstalledAt) {
    log.info("首次安装，打开插件管理页")
    try {
      await browser.runtime.openOptionsPage()
    } catch (error) {
      log.warn("打开管理页失败", error)
    }
    return
  }

  log.info(`已更新到 ${version}（${tt("原有插件配置保持不变", "existing config kept")}）`)
}
