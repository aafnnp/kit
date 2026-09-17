import { definePluginMeta } from "@/plugins/define"

export const meta = definePluginMeta({
  id: "qr-share",
  name: { "zh-CN": "二维码", en: "QR code" },
  description: {
    "zh-CN": "把当前页面地址、选中文本或任意内容生成二维码",
    en: "Turn the current URL, selected text or any content into a QR code",
  },
  icon: "▦",
  version: "1.0.0",
  order: 30,
  defaultEnabled: true,
  panel: true,
  surfaces: ["popup"],
})
