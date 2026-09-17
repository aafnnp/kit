import { definePluginMeta } from "@/plugins/define"

export const meta = definePluginMeta({
  id: "text-toolkit",
  name: { "zh-CN": "文本工具", en: "Text toolkit" },
  description: {
    "zh-CN": "JSON、Base64、URL、时间戳、哈希、大小写与行处理",
    en: "JSON, Base64, URL, timestamps, hashing and line tools",
  },
  icon: "🔤",
  version: "1.0.0",
  order: 20,
  defaultEnabled: true,
  panel: true,
  surfaces: ["popup"],
})
