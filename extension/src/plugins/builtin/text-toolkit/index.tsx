import { useEffect, useMemo, useRef, useState } from "react"
import { Button, Card, Field } from "@/components/ui"
import { cn } from "@/lib/cn"
import { tt } from "@/lib/i18n"
import { definePlugin } from "@/plugins/define"
import type { PluginPanelProps } from "@/plugins/types"
import { meta } from "./meta"
import { OP_GROUPS, TEXT_OPS, collectSelection, type TextOp } from "./ops"

export default definePlugin({
  meta,
  Panel: TextToolkitPanel,
})

function TextToolkitPanel({ ctx }: PluginPanelProps) {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [group, setGroup] = useState(OP_GROUPS[0]?.id ?? "json")
  const prefilled = useRef(false)

  // 打开面板时，若输入框为空则尝试用页面里选中的文本预填
  useEffect(() => {
    if (prefilled.current) return
    prefilled.current = true

    void (async () => {
      const selection = await ctx.injectPage(collectSelection)
      if (selection && selection.trim()) setInput(selection)
    })()
  }, [ctx])

  const visibleOps = useMemo(() => TEXT_OPS.filter((op) => op.group === group), [group])

  const apply = async (op: TextOp) => {
    setRunningId(op.id)
    setError(null)

    try {
      setOutput(await op.run(input))
    } catch (cause) {
      setOutput("")
      setError((cause as Error).message)
    } finally {
      setRunningId(null)
    }
  }

  return (
    <>
      <Card>
        <Field
          label={tt("输入", "Input")}
          value={input}
          onChange={setInput}
          multiline
          rows={5}
          placeholder={tt("粘贴或输入内容，也可以先在页面里选中文本", "Paste text here, or select text on the page first")}
        />
      </Card>

      <Card>
        <div className="kit-row" style={{ marginBottom: 8 }}>
          {OP_GROUPS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("kit-btn", "kit-btn--sm", item.id === group && "kit-btn--primary")}
              onClick={() => setGroup(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="kit-row">
          {visibleOps.map((op) => (
            <Button key={op.id} size="sm" loading={runningId === op.id} onClick={() => void apply(op)}>
              {op.label}
            </Button>
          ))}
        </div>
      </Card>

      {error ? (
        <Card>
          <p style={{ margin: 0, color: "var(--kit-danger)" }}>{error}</p>
        </Card>
      ) : null}

      {output ? (
        <Card>
          <Field label={tt("结果", "Result")} value={output} onChange={setOutput} multiline rows={6} />
          <div className="kit-row" style={{ marginTop: 8 }}>
            <Button
              size="sm"
              variant="primary"
              onClick={() => void ctx.copyText(output, tt("结果已复制", "Result copied"))}
            >
              {tt("复制结果", "Copy result")}
            </Button>
            <Button size="sm" onClick={() => setInput(output)}>
              {tt("替换输入", "Use as input")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOutput("")}>
              {tt("清空结果", "Clear result")}
            </Button>
          </div>
        </Card>
      ) : null}
    </>
  )
}
