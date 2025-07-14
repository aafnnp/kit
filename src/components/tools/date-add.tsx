import { useState } from 'react'

/**
 * DateAdd - 日期加减
 * @returns 组件
 */
// 输入日期和天数，输出加减后的日期
const DateAdd = () => {
  const [date, setDate] = useState('')
  const [days, setDays] = useState(0)
  const [out, setOut] = useState('')
  const calc = () => {
    const d = new Date(date)
    if (isNaN(d.getTime())) return setOut('无效日期')
    d.setDate(d.getDate() + days)
    setOut(d.toISOString().slice(0, 10))
  }
  return (
    <div className="flex flex-col gap-4">
      <input
        className="w-full rounded border p-2"
        placeholder="日期 YYYY-MM-DD"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        type="number"
        className="w-full rounded border p-2"
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
      />
      <button className="btn" onClick={calc}>
        计算/Calc
      </button>
      <div className="text-sm text-muted-foreground">结果/Result: {out}</div>
    </div>
  )
}

export default DateAdd
