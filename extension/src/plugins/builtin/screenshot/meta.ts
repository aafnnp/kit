import { definePluginMeta } from "@/plugins/define"

export const meta = definePluginMeta({
  id: "screenshot",
  name: { "zh-CN": "截图", en: "Screenshot" },
  description: {
    "zh-CN": "截取当前标签页可见区域，复制、下载或在新标签打开",
    en: "Capture the visible area, then copy, download or open it",
  },
  icon: "📸",
  version: "1.0.0",
  order: 50,
  defaultEnabled: true,
  // 纯动作插件：没有面板，点击即执行
  panel: false,
  surfaces: ["popup", "background"],
  contributes: {
    menus: [
      {
        id: "capture",
        title: { "zh-CN": "Kit：截取可见区域并复制", en: "Kit: capture visible area and copy" },
        contexts: ["page", "selection"],
        action: "default",
      },
      {
        id: "capture-download",
        title: { "zh-CN": "Kit：截取可见区域并下载", en: "Kit: capture visible area and download" },
        contexts: ["page"],
        action: "download",
      },
    ],
  },
})
