import { useState } from 'react'

/**
 * CalendarMaker - 生成月历 PNG
 * @returns 组件
 */
// 输入年月，生成简单月历（仅文本预览）
const CalendarMaker = () => {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex gap-2">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-20 border rounded px-2"
        />
        <input
          type="number"
          value={month}
          min={1}
          max={12}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="w-12 border rounded px-2"
        />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <div key={d} className="w-8 h-8 flex items-center justify-center border rounded bg-muted">
            {d}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CalendarMaker
