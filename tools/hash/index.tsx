import { computed, signal, Text, View } from "nsh"
import { Badge, Card, CardHeader, CopyButton, Field, OutputBox, Segmented, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { algorithmLabels, algorithms, hashText, selfCheck, type HashAlgorithm, type HashEncoding } from "./logic"

export default function HashTool() {
  const input = signal("abc")
  const algorithm = signal<HashAlgorithm>("sha256")
  const encoding = signal<HashEncoding>("hex")
  const output = computed(() => hashText(input(), algorithm(), encoding()))

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("哈希算法", "Algorithm")}
          description={L("文本在本地计算，不会离开设备。", "Hashed locally; the text never leaves the device.")}
          right={<Badge tone={selfCheck(algorithm()) ? "up" : "warn"}>{selfCheck(algorithm()) ? L("自检通过", "Self-check passed") : L("自检失败", "Self-check failed")}</Badge>}
        />
        <Segmented
          value={algorithm()}
          onChange={(value) => algorithm.set(value)}
          testID="hash-algorithm"
          options={algorithms.map((value) => ({ value, label: algorithmLabels[value] }))}
        />
        <View class="flex-row flex-wrap items-center gap-2">
          <Segmented
            value={encoding()}
            onChange={(value) => encoding.set(value)}
            testID="hash-encoding"
            options={[
              { value: "hex", label: "Hex" },
              { value: "base64", label: "Base64" },
            ]}
          />
        </View>
      </Card>

      <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={L("输入文本", "Input text")} />
          <TextInput value={input()} onChange={(value) => input.set(value)} multiline height={180} mono testID="hash-input" />
        </Card>
        <Card>
          <CardHeader title={L("摘要", "Digest")} description={algorithmLabels[algorithm()]} right={<CopyButton value={() => output()} testID="hash-copy" />} />
          <OutputBox value={output()} height={180} testID="hash-output" />
        </Card>
      </View>

      <Text class="text-[11px] text-muted-foreground">
        {L("提示：自检值为字符串 \"abc\" 的摘要，可用于确认运行时哈希实现一致。", "Tip: the self-check hashes \"abc\" to confirm the runtime's implementation.")}
      </Text>
    </View>
  )
}
