import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { defineConfig } from "wxt"

/**
 * 版本号唯一来源：仓库根 package.json。
 * 这样发布桌面端 / Web 端时，扩展版本自动跟随，不需要额外同步脚本。
 */
const appPkg = JSON.parse(readFileSync(resolve(import.meta.dirname, "../package.json"), "utf8")) as {
  version: string
  author?: string
}

/**
 * 所有浏览器统一使用 MV3（Manifest V3）。
 * - Chrome / Edge：原生 MV3（Service Worker 后台）
 * - Firefox：MV3 + gecko id（事件页后台，WXT 会自动改写 background 字段）
 * - Safari：暂不构建，代码层不依赖 Chrome 独有 API，可用
 *   `xcrun safari-web-extension-converter .output/chrome-mv3` 直接转换。
 */
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "Kit 工具箱",
    short_name: "Kit",
    description: "页面信息、取色、截图、二维码、文本工具：按需启用的浏览器工具箱。",
    version: appPkg.version,
    // 基础权限：全部为"用户点击后才生效"或本地能力，不申请任何 host 权限。
    permissions: ["storage", "activeTab", "scripting", "contextMenus", "notifications"],
    // 插件在运行期申请权限（插拔式启用的关键），而不是安装时全量索要。
    optional_permissions: ["tabs", "downloads"],
    optional_host_permissions: ["<all_urls>"],
    action: {
      default_title: "Kit 工具箱",
    },
    commands: {
      "capture-visible": {
        suggested_key: { default: "Alt+Shift+S" },
        description: "截取当前标签页可见区域",
      },
      "copy-page-info": {
        suggested_key: { default: "Alt+Shift+C" },
        description: "复制当前页面信息（Markdown）",
      },
    },
    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "kit-extension@aafnnp.dev",
              // Firefox 140+：MV3 与内建数据收集声明都已稳定
              strict_min_version: "140.0",
              // AMO 自 2025-11-03 起强制声明数据收集类型；本扩展全部在本地处理，声明为 none
              data_collection_permissions: { required: ["none"] },
            },
          },
        }
      : {}),
  }),
})
