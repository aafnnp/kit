import { useState } from 'react'
/**
 * CsvPreview - CSV Viewer
 * @returns 组件
 */
// 输入 CSV，表格预览（仅支持逗号分隔）
const CsvPreview = () => {
  const [csv, setCsv] = useState('')
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .map((r) => r.split(','))
  return (
    <div className="flex flex-col gap-4">
      <textarea
        className="w-full min-h-[60px] rounded border p-2"
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder="输入 CSV..."
      />
      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i === 0 ? 'font-bold' : ''}>
                {row.map((cell, j) => (
                  <td key={j} className="border px-2 py-1">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default CsvPreview
