import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, Field, OutputBox, Segmented, TextInput, Toggle } from "../../components/ui"
import { L } from "../../lib/locale"
import { csvToJson, type Delimiter } from "./logic"

const SAMPLE = `name,role,active,score
Ada,Engineer,true,98
Grace,Admiral,true,100
Linus,"Maintainer, Kernel",false,87`

export default function CsvToJson() {
  const input = signal(SAMPLE)
  const delimiter = signal<Delimiter>(",")
  const hasHeader = signal(true)
  const inferTypes = signal(true)
  const output = signal("")
  const error = signal("")
  const rows = signal(0)

  const convert = () => {
    const result = csvToJson(input(), {
      delimiter: delimiter(),
      hasHeader: hasHeader(),
      inferTypes: inferTypes(),
    })
    if (result.ok) {
      output.set(result.output)
      rows.set(result.rows)
      error.set("")
    } else {
      output.set("")
      rows.set(0)
      error.set(result.error)
    }
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader title={L("CSV 选项", "CSV options")} description={L("支持引号、转义引号与字段内换行（RFC 4180）。", "Quoted fields, escaped quotes and newlines inside fields (RFC 4180).")} />
        <View class="flex-row flex-wrap items-center gap-2">
          <Segmented
            value={delimiter()}
            onChange={(value) => delimiter.set(value)}
            testID="csv-delimiter"
            options={[
              { value: ",", label: L("逗号", "Comma") },
              { value: ";", label: L("分号", "Semicolon") },
              { value: "\t", label: L("制表符", "Tab") },
              { value: "|", label: L("竖线", "Pipe") },
            ]}
          />
          <Toggle label={L("首行是表头", "First row is header")} checked={hasHeader()} onChange={(value) => hasHeader.set(value)} />
          <Toggle label={L("推断类型", "Infer types")} checked={inferTypes()} onChange={(value) => inferTypes.set(value)} />
        </View>
      </Card>

      <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={L("CSV", "CSV")} description={L("粘贴表格数据，或替换为你的数据。", "Paste tabular data or replace the sample.")} />
          <TextInput value={input()} onChange={(value) => input.set(value)} multiline height={280} mono testID="csv-input" />
          <View class="flex-row flex-wrap gap-2">
            <Button tone="primary" onPress={convert} testID="csv-convert">
              {L("转换", "Convert")}
            </Button>
            <Button tone="ghost" onPress={() => { input.set(SAMPLE); output.set(""); error.set("") }}>
              {L("示例", "Sample")}
            </Button>
          </View>
        </Card>

        <Card>
          <CardHeader
            title={L("JSON", "JSON")}
            description={rows() ? L(`已转换 ${rows()} 行数据`, `${rows()} rows converted`) : L("输出为格式化的 JSON 数组", "Formatted JSON array")}
            right={<CopyButton value={() => output()} testID="csv-copy" />}
          />
          {error() ? <ErrorBanner message={error()} /> : null}
          <OutputBox value={output()} height={320} testID="csv-output" />
        </Card>
      </View>
    </View>
  )
}
