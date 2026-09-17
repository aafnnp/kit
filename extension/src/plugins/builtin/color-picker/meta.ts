import { definePluginMeta } from "@/plugins/define"

export const meta = definePluginMeta({
  id: "color-picker",
  name: { "zh-CN": "取色器", en: "Color picker" },
  description: {
    "zh-CN": "从当前页面截屏中吸取颜色，或调用系统吸管",
    en: "Pick colors from a screenshot of the page, or use the system eyedropper",
  },
  icon: "🎨",
  version: "1.0.0",
  order: 40,
  defaultEnabled: true,
  panel: true,
  surfaces: ["popup"],
})
