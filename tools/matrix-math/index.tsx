import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, OutputBox, Segmented, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { calculateMatrix, formatMatrix, parseMatrix, type MatrixOperation } from "./logic"

export default function MatrixMath() {
  const left = signal("1, 2\n3, 4")
  const right = signal("5, 6\n7, 8")
  const operation = signal<MatrixOperation>("multiply")
  const output = signal("")
  const error = signal("")

  const calculate = () => {
    try {
      const first = parseMatrix(left())
      const second = operation() === "transpose" ? null : parseMatrix(right())
      output.set(formatMatrix(calculateMatrix(first, second, operation())))
      error.set("")
    } catch (failure) {
      output.set("")
      error.set(failure instanceof Error ? failure.message : String(failure))
    }
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("矩阵计算器", "Matrix calculator")}
          description={L("支持加法、减法、乘法与转置；每行一行，数字以逗号或空格分隔。", "Add, subtract, multiply or transpose matrices. Enter one row per line, separated by commas or spaces.")}
        />
        <Segmented
          value={operation()}
          onChange={(value) => operation.set(value)}
          testID="matrix-operation"
          options={[
            { value: "add", label: L("加法", "Add") },
            { value: "subtract", label: L("减法", "Subtract") },
            { value: "multiply", label: L("乘法", "Multiply") },
            { value: "transpose", label: L("转置", "Transpose") },
          ]}
        />
        <View class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <View class="gap-1">
            <Text class="text-xs font-medium text-muted-foreground">{L("矩阵 A", "Matrix A")}</Text>
            <TextInput value={left()} onChange={(value) => left.set(value)} multiline height={150} mono testID="matrix-left" />
          </View>
          {operation() !== "transpose" ? (
            <View class="gap-1">
              <Text class="text-xs font-medium text-muted-foreground">{L("矩阵 B", "Matrix B")}</Text>
              <TextInput value={right()} onChange={(value) => right.set(value)} multiline height={150} mono testID="matrix-right" />
            </View>
          ) : null}
        </View>
        {error() ? <ErrorBanner message={error()} /> : null}
        <Button tone="primary" onPress={calculate} testID="matrix-calculate">{L("计算", "Calculate")}</Button>
      </Card>
      {output() ? (
        <Card>
          <CardHeader title={L("结果", "Result")} right={<CopyButton value={() => output()} testID="matrix-copy" />} />
          <OutputBox value={output()} height={160} testID="matrix-output" />
        </Card>
      ) : null}
    </View>
  )
}
