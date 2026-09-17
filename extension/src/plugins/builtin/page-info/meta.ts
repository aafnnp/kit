import { definePluginMeta } from "@/plugins/define"

export const meta = definePluginMeta({
  id: "page-info",
  name: { "zh-CN": "页面信息", en: "Page info" },
  description: {
    "zh-CN": "标题、描述、OG、JSON-LD 与内容统计，一键复制为 Markdown",
    en: "Title, description, OG, JSON-LD and content stats, copy as Markdown",
  },
  icon: "📄",
  version: "1.0.0",
  order: 10,
  defaultEnabled: true,
  panel: true,
  surfaces: ["popup", "background"],
  contributes: {
    menus: [
      {
        id: "copy-markdown",
        title: { "zh-CN": "Kit：复制页面信息为 Markdown", en: "Kit: copy page info as Markdown" },
        contexts: ["page", "selection"],
        action: "copy-markdown",
      },
    ],
  },
})
