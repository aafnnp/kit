import { definePluginMeta } from "@/plugins/define"

export const meta = definePluginMeta({
  id: "tab-manager",
  name: { "zh-CN": "标签页管理", en: "Tab manager" },
  description: {
    "zh-CN": "按域名分组查看所有标签页，导出 Markdown、关闭重复标签",
    en: "Group all tabs by domain, export as Markdown, close duplicates",
  },
  icon: "🗂",
  version: "1.0.0",
  order: 90,
  // 高级插件：默认关闭，启用时才会申请 `tabs` 权限
  defaultEnabled: false,
  panel: true,
  permissions: ["tabs"],
  surfaces: ["popup"],
})
