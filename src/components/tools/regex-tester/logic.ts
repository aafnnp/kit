import { escapeHtml } from "@/lib/utils"
import type { RegexMatch } from "./schema"

/**
 * 把匹配结果包装为带 `<mark>` 的 HTML 片段。
 *
 * ⚠️ 返回值会被 `dangerouslySetInnerHTML` 直接渲染，因此**所有**文本
 * （未匹配部分与匹配部分）都必须先转义。否则用户粘贴的
 * `<img src=x onerror=...>` 会被当作 HTML 执行。
 */
export const highlightMatches = (text: string, matches: RegexMatch[], highlightEnabled: boolean): string => {
  if (!highlightEnabled || matches.length === 0) {
    return escapeHtml(text)
  }

  // 按起始位置升序处理：原来的降序 substring 拼接在匹配重叠时会破坏文本。
  const orderedMatches = [...matches]
    .filter(
      (match) =>
        Number.isInteger(match.index) && match.index >= 0 && match.index < text.length && match.length > 0,
    )
    .sort((a, b) => a.index - b.index)

  let highlightedText = ""
  let cursor = 0

  orderedMatches.forEach((match, index) => {
    // 跳过与上一段重叠的匹配，避免生成嵌套损坏的 HTML
    if (match.index < cursor) {
      return
    }

    const end = Math.min(match.index + match.length, text.length)

    highlightedText += escapeHtml(text.slice(cursor, match.index))
    highlightedText += `<mark class="bg-yellow-200 dark:bg-yellow-800" data-match="${index}">${escapeHtml(
      text.slice(match.index, end),
    )}</mark>`
    cursor = end
  })

  return highlightedText + escapeHtml(text.slice(cursor))
}
