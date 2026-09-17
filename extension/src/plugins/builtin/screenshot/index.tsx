import { tt } from "@/lib/i18n"
import { dataUrlToBlob, downloadBlob, formatTimestamp } from "@/lib/tabs"
import { definePlugin } from "@/plugins/define"
import type { PluginContext } from "@/plugins/types"
import { meta } from "./meta"

function filename(): string {
  return `kit-screenshot-${formatTimestamp()}.png`
}

async function capture(ctx: PluginContext): Promise<Blob | null> {
  const dataUrl = await ctx.captureVisibleTab()
  if (!dataUrl) {
    ctx.notify(
      tt("截图失败：当前页面不允许截取，或未授予页面权限", "Capture failed — page not allowed or permission missing"),
      { type: "error" },
    )
    return null
  }
  return dataUrlToBlob(dataUrl)
}

/**
 * 截图是"纯动作插件"的范例：
 * 没有 Panel，点击图标 / 右键菜单 / 快捷键都会走这里，包体里也不需要任何 UI 代码。
 */
export default definePlugin({
  meta,

  actions: {
    default: async (ctx) => {
      const blob = await capture(ctx)
      if (!blob) return

      const copied = await ctx.copyImage(blob, tt("截图已复制到剪贴板", "Screenshot copied"))
      if (!copied) {
        // 复制失败（部分浏览器限制图片写入剪贴板）时退化为下载，保证用户不空手而归
        downloadBlob(blob, filename())
        ctx.notify(tt("复制失败，已改为下载截图", "Copy failed, downloaded instead"), { type: "info" })
      }
    },

    download: async (ctx) => {
      const blob = await capture(ctx)
      if (!blob) return
      downloadBlob(blob, filename())
      ctx.notify(tt("截图已下载", "Screenshot downloaded"), { type: "success" })
    },
  },
})
