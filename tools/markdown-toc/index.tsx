import { signal, View } from "nsh"
import { Card, CardHeader, CopyButton, OutputBox, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { generateMarkdownToc } from "./logic"

const SAMPLE = "# Guide\n\n## Install\n\n## Usage\n\n### Examples"

export default function MarkdownToc() {
  const markdown = signal(SAMPLE)
  const toc = () => generateMarkdownToc(markdown())

  return (
    <View class="gap-4">
      <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={L("Markdown 输入", "Markdown input")}
            description={L("提取 ATX 标题并忽略围栏代码块。", "Extract ATX headings and ignore fenced code blocks.")}
          />
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
