import { signal, Text, View } from "nsh"
import { Card, CardHeader, CopyButton, ErrorBanner, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { formatRoot, solveQuadratic } from "./logic"

export default function QuadraticSolver() {
  const coefficients = signal({ a: "1", b: "-3", c: "2" })
  const values = () => coefficients()
  const result = () => {
    const current = values()
    if (Object.values(current).some((value) => !value.trim() || !Number.isFinite(Number(value)))) return null
    return solveQuadratic(Number(current.a), Number(current.b), Number(current.c))
  }
  const resultError = () => {
    const solution = result()
    return solution?.kind === "invalid" ? solution.error : ""
  }
  const discriminant = () => {
    const solution = result()
    return solution?.kind === "quadratic" ? String(solution.discriminant) : ""
  }
  const rootText = () => {
    const solution = result()
    return solution && "roots" in solution ? solution.roots.map(formatRoot).join(", ") : ""
  }

  const update = (key: "a" | "b" | "c", value: string) => {
    coefficients.set({ ...values(), [key]: value })
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("二次方程求解器", "Quadratic equation solver")}
          description={L("求解 ax² + bx + c = 0；也会处理退化为一次方程的情况。", "Solve ax² + bx + c = 0, including degenerate linear equations.")}
        />
        <View class="flex-row flex-wrap items-end gap-3">
          {(["a", "b", "c"] as const).map((key) => (
            <View class="min-w-24 flex-1 gap-1">
              <Text class="text-[11px] font-medium text-muted-foreground">{key}</Text>
              <TextInput value={values()[key]} onChange={(value) => update(key, value)} mono testID={`quadratic-${key}`} />
            </View>
          ))}
        </View>
      </Card>
      <Card testID="quadratic-result">
        <CardHeader
          title={L("解", "Solution")}
          description={L("判别式 b² − 4ac", "Discriminant b² − 4ac")}
          right={rootText() ? <CopyButton value={rootText} testID="quadratic-copy" /> : undefined}
        />
        {result() === null ? (
          <Text class="text-sm text-destructive">{L("请输入有效的有限数字。", "Enter valid finite numbers.")}</Text>
        ) : result()?.kind === "invalid" ? (
          <ErrorBanner message={resultError()} />
        ) : result()?.kind === "identity" ? (
          <Text class="text-sm text-foreground">{L("所有实数都是解。", "Every real number is a solution.")}</Text>
        ) : result()?.kind === "inconsistent" ? (
          <Text class="text-sm text-foreground">{L("无解。", "No solution.")}</Text>
        ) : (
          <View class="gap-2">
            <Text class="font-mono text-sm text-foreground" testID="quadratic-roots">
              {rootText() || L("无实数解。", "No real roots.")}
            </Text>
            {result()?.kind === "quadratic" ? (
              <Text class="text-xs text-muted-foreground">
                {L("判别式", "Discriminant")}: {discriminant()}
              </Text>
            ) : null}
            {result()?.kind === "linear" ? <Text class="text-xs text-muted-foreground">{L("已化简为一次方程。", "Reduced to a linear equation.")}</Text> : null}
          </View>
        )}
      </Card>
    </View>
  )
}
