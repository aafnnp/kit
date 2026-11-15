import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, OutputBox, Segmented, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { createLiveRun } from "../../lib/tool-run"
import { calculateMatrix, determinant, formatMatrix, invertMatrix, parseMatrix, type MatrixOperation } from "./logic"

export default function MatrixMath() {
  const left = signal("1, 2\n3, 4")
  const right = signal("5, 6\n7, 8")
  const operation = signal<MatrixOperation>("multiply")

  const compute = () => {
    const first = parseMatrix(left())
    if (operation() === "determinant") return String(Number(determinant(first).toPrecision(10)))
    if (operation() === "inverse") return formatMatrix(invertMatrix(first))
    const second = operation() === "transpose" ? null : parseMatrix(right())
    return formatMatrix(calculateMatrix(first, second, operation()))
  }
  const needsRight = () => operation() === "add" || operation() === "subtract" || operation() === "multiply"
  const outcome = createLiveRun({ initial: "", compute, inputs: [left, right, operation], delay: 250 })

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("矩阵计算器", "Matrix calculator")}
          description={L("支持加减、乘法、转置、行列式与逆矩阵；每行一行，数字以逗号或空格分隔。", "Add, subtract, multiply, transpose, take a determinant or invert. One row per line, separated by commas or spaces.")}
        />
        <Segmented
          value={operation()}
          onChange={(value) => operation.set(value)}
          testID="matrix-operation"
          label={L("运算", "Operation")}
          options={[
            { value: "add", label: L("加法", "Add") },
            { value: "subtract", label: L("减法", "Subtract") },
            { value: "multiply", label: L("乘法", "Multiply") },
            { value: "transpose", label: L("转置", "Transpose") },
            { value: "determinant", label: L("行列式", "Determinant") },
            { value: "inverse", label: L("逆矩阵", "Inverse") },
          ]}
        />
        <View class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <View class="gap-1">
            <Text class="text-xs font-medium text-muted-foreground">{L("矩阵 A", "Matrix A")}</Text>
            <TextInput value={left()} onChange={(value) => left.set(value)} multiline height={150} mono testID="matrix-left" />
          </View>
          {needsRight() ? (
            <View class="gap-1">
              <Text class="text-xs font-medium text-muted-foreground">{L("矩阵 B", "Matrix B")}</Text>
              <TextInput value={right()} onChange={(value) => right.set(value)} multiline height={150} mono testID="matrix-right" />
            </View>
          ) : null}
        </View>
        {outcome.error() ? <ErrorBanner message={outcome.error()} /> : null}
        <Button tone="primary" onPress={() => outcome.run(compute)} testID="matrix-calculate">{L("计算", "Calculate")}</Button>
      </Card>
      {outcome.output() ? (
        <Card>
          <CardHeader title={L("结果", "Result")} right={<CopyButton value={outcome.output} testID="matrix-copy" />} />
          <OutputBox value={outcome.output()} height={160} testID="matrix-output" />
        </Card>
      ) : null}
    </View>
  )
}
