import { useState } from "react"
import { Button, Card, EmptyState, KeyValue, Spinner } from "@/components/ui"
import { tt } from "@/lib/i18n"
import { definePlugin } from "@/plugins/define"
import type { PluginContext, PluginPanelProps } from "@/plugins/types"
import { collectPageInfo, type PageInfo } from "./extract"
import { meta } from "./meta"

function toMarkdown(info: PageInfo): string {
  const bullets: string[] = [
    `- URL: ${info.url}`,
    info.canonical ? `- Canonical: ${info.canonical}` : "",
    info.siteName ? `- Site: ${info.siteName}` : "",
    info.author ? `- Author: ${info.author}` : "",
    info.publishedTime ? `- Published: ${info.publishedTime}` : "",
    `- Stats: ${info.wordCount} words · ${info.readingMinutes} min · ${info.images} images · ${info.links} links`,
    info.jsonLdTypes.length > 0 ? `- Structured data: ${info.jsonLdTypes.join(", ")}` : "",
    info.ogImage ? `- Image: ${info.ogImage}` : "",
  ].filter(Boolean)

  const heading = `# ${info.title || info.url}`
  const quote = info.description ? `\n\n> ${info.description}` : ""

  return `${heading}${quote}\n\n${bullets.join("\n")}`
}

async function loadPageInfo(ctx: PluginContext): Promise<PageInfo | undefined> {
  if (!(await ctx.canInject())) {
    ctx.notify(tt("当前页面不允许读取内容（浏览器内部页面）", "This page cannot be read (browser internal page)"), {
      type: "error",
    })
    return undefined
  }
  return ctx.injectPage(collectPageInfo)
}

const plugin = definePlugin({
  meta,

  actions: {
    /**
     * `default` 与菜单/快捷键共用一个实现：
     * 采集 → 复制 Markdown。纯动作路径不需要打开 popup。
     */
    default: async (ctx) => {
      const info = await loadPageInfo(ctx)
      if (!info) return
      await ctx.copyText(toMarkdown(info), tt("页面信息已复制为 Markdown", "Page info copied as Markdown"))
    },

    "copy-markdown": async (ctx) => {
      const info = await loadPageInfo(ctx)
      if (!info) return
      await ctx.copyText(toMarkdown(info), tt("页面信息已复制为 Markdown", "Page info copied as Markdown"))
    },

    "copy-json": async (ctx) => {
      const info = await loadPageInfo(ctx)
      if (!info) return
      await ctx.copyText(JSON.stringify(info, null, 2), tt("页面信息已复制为 JSON", "Page info copied as JSON"))
    },
  },

  Panel: PageInfoPanel,
})

function PageInfoPanel({ ctx }: PluginPanelProps) {
  const [info, setInfo] = useState<PageInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      setInfo((await loadPageInfo(ctx)) ?? null)
    } finally {
      setLoading(false)
    }
  }

  if (!info && !loading) {
    return (
      <EmptyState
        icon="📄"
        title={tt("读取当前页面信息", "Read current page info")}
        hint={tt("不会上传任何内容，全部在本地完成", "Nothing leaves your device")}
        action={
          <Button variant="primary" size="sm" onClick={() => void refresh()}>
            {tt("开始读取", "Read page")}
          </Button>
        }
      />
    )
  }

  if (loading && !info) {
    return (
      <div className="kit-empty">
        <Spinner size={18} />
      </div>
    )
  }

  if (!info) return null

  return (
    <>
      <Card>
        <KeyValue label={tt("标题", "Title")} value={info.title || tt("（无标题）", "(untitled)")} />
        <KeyValue label="URL" value={info.url} mono />
        {info.siteName ? <KeyValue label={tt("站点", "Site")} value={info.siteName} /> : null}
        {info.author ? <KeyValue label={tt("作者", "Author")} value={info.author} /> : null}
        {info.publishedTime ? <KeyValue label={tt("发布", "Published")} value={info.publishedTime} /> : null}
        {info.description ? <KeyValue label={tt("描述", "Description")} value={info.description} /> : null}
        {info.canonical ? <KeyValue label="Canonical" value={info.canonical} mono /> : null}
        <KeyValue label={tt("语言", "Lang")} value={info.lang || "—"} />
      </Card>

      <Card>
        <KeyValue label={tt("正文", "Content")} value={`${info.wordCount} ${tt("字", "words")} · ${info.readingMinutes} min`} />
        <KeyValue label={tt("标题层级", "Headings")} value={`h1×${info.h1 ? 1 : 0} / ${info.headings}`} />
        <KeyValue
          label={tt("链接", "Links")}
          value={`${info.links} (${tt("外链", "external")} ${info.externalLinks})`}
        />
        <KeyValue
          label={tt("图片", "Images")}
          value={`${info.images}${info.imagesMissingAlt > 0 ? ` · ${info.imagesMissingAlt} ${tt("缺 alt", "missing alt")}` : ""}`}
        />
        <KeyValue label={tt("表单 / 脚本", "Forms / scripts")} value={`${info.forms} / ${info.scripts}`} />
        <KeyValue
          label={tt("结构化数据", "JSON-LD")}
          value={info.jsonLdTypes.length > 0 ? info.jsonLdTypes.join(", ") : tt("无", "none")}
        />
        {info.selectionLength > 0 ? (
          <KeyValue label={tt("选中", "Selection")} value={`${info.selectionLength} ${tt("字符", "chars")}`} />
        ) : null}
      </Card>

      <Card>
        <div className="kit-row">
          <Button size="sm" loading={loading} onClick={() => void refresh()}>
            {tt("刷新", "Refresh")}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => void ctx.copyText(toMarkdown(info), tt("已复制 Markdown", "Markdown copied"))}
          >
            {tt("复制 Markdown", "Copy Markdown")}
          </Button>
          <Button
            size="sm"
            onClick={() => void ctx.copyText(JSON.stringify(info, null, 2), tt("已复制 JSON", "JSON copied"))}
          >
            JSON
          </Button>
        </div>
      </Card>
    </>
  )
}

export default plugin
