import { computed, signal, View } from "nsh"
import { Card, CardHeader, CopyButton, OutputBox, Segmented, TextInput, Toggle } from "../../components/ui"
import { L } from "../../lib/locale"
import { persistDraft, restoreDraft } from "../../lib/drafts"
import { generateMarkdownToc } from "./logic"

const SAMPLE = "# Guide\n\n## Install\n\n## Usage\n\n### Examples"

export default function MarkdownToc() {
  const markdown = signal(SAMPLE)
  restoreDraft("markdown-toc", SAMPLE, markdown)
  persistDraft("markdown-toc", markdown)
  const maxDepth = signal<"2" | "3" | "6">("6")
  const numbered = signal(false)
  const toc = computed(() => generateMarkdownToc(markdown(), { maxDepth: Number(maxDepth()), numbered: numbered() }))

  return (
    <View class="gap-4">
      <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={L("Markdown 输入", "Markdown input")}
            description={L("提取 ATX 与 setext 标题，忽略围栏代码块，可选层级与编号。", "Extract ATX and setext headings, ignore fenced code blocks, and choose depth or numbering.")}
          />
          <View class="flex-row flex-wrap items-center gap-2">
            <Segmented
              value={maxDepth()}
              onChange={(value) => maxDepth.set(value)}
              testID="toc-depth"
              label={L("最大层级", "Maximum depth")}
              options={[
                { value: "2", label: "H2" },
                { value: "3", label: "H3" },
                { value: "6", label: "H6" },
              ]}
            />
            <Toggle label={L("编号列表", "Numbered list")} checked={numbered()} onChange={(value) => numbered.set(value)} testID="toc-numbered" />
          </View>
          <TextInput value={markdown()} onChange={(value) => markdown.set(value)} multiline height={300} mono testID="toc-input" />
        </Card>
        <Card>
          <CardHeader title={L("目录", "Table of contents")} right={<CopyButton value={toc} testID="toc-copy" />} />
          <OutputBox value={toc()} height={300} testID="toc-output" />
        </Card>
      </View>
    </View>
  )
}
