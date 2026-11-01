import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, OutputBox, Segmented, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { parseCsv } from "../csv-to-json/logic"
import { formatCsvTable, sortCsvTable, type SortDirection } from "./logic"

const SAMPLE = "name,score\nAda,98\nGrace,100\nLinus,87"

export default function TableSorter() {
  const input = signal(SAMPLE)
  const selectedColumn = signal("1")
  const direction = signal<SortDirection>("ascending")
  const output = signal("")
  const error = signal("")
  const headers = () => {
    try {
      return parseCsv(input())[0] ?? []
    } catch {
      return []
    }
  }

  const sort = () => {
    try {
      output.set(formatCsvTable(sortCsvTable(input(), Number(selectedColumn()), direction())))
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
          title={L("表格排序", "Table sorter")}
          description={L("粘贴带表头的 CSV，按文本或数值稳定排序。", "Paste CSV with a header row and stably sort as text or numbers.")}
        />
        <TextInput value={input()} onChange={(value) => input.set(value)} multiline height={200} mono testID="table-input" />
        <Text class="text-xs font-medium text-muted-foreground">{L("排序列", "Sort column")}</Text>
        {headers().length ? (
          <Segmented
            value={selectedColumn()}
            onChange={(value) => selectedColumn.set(value)}
            testID="table-column"
            options={headers().map((header, index) => ({ value: String(index), label: header || `#${index + 1}` }))}
          />
        ) : null}
        <Segmented
          value={direction()}
          onChange={(value) => direction.set(value)}
          testID="table-direction"
          options={[
            { value: "ascending", label: L("升序", "Ascending") },
            { value: "descending", label: L("降序", "Descending") },
          ]}
        />
        {error() ? <ErrorBanner message={error()} /> : null}
        <Button tone="primary" onPress={sort} testID="table-sort">{L("排序", "Sort")}</Button>
      </Card>
      {output() ? (
        <Card>
          <CardHeader title={L("排序结果", "Sorted CSV")} right={<CopyButton value={() => output()} testID="table-copy" />} />
          <OutputBox value={output()} height={220} testID="table-output" />
        </Card>
      ) : null}
    </View>
  )
}
