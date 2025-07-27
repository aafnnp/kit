import { useState } from 'react'

/**
 * UnitConvert - 单位换算
 * @returns 组件
 */
// 支持长度单位换算（米/厘米/毫米/英寸/英尺）
const units = [
  { label: '米', value: 1 },
  { label: '厘米', value: 0.01 },
  { label: '毫米', value: 0.001 },
  { label: '英寸', value: 0.0254 },
  { label: '英尺', value: 0.3048 },
]
const UnitConvert = () => {
  const [from, setFrom] = useState(0)
  const [fromUnit, setFromUnit] = useState(0)
  const [toUnit, setToUnit] = useState(1)
  const to = from * (units[fromUnit].value / units[toUnit].value)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={from}
          onChange={(e) => setFrom(Number(e.target.value))}
          className="w-24 border rounded px-2"
        />
        <select value={fromUnit} onChange={(e) => setFromUnit(Number(e.target.value))} className="border rounded px-2">
          {units.map((u, i) => (
            <option value={i} key={u.label}>
              {u.label}
            </option>
          ))}
        </select>
        <span>→</span>
        <select value={toUnit} onChange={(e) => setToUnit(Number(e.target.value))} className="border rounded px-2">
          {units.map((u, i) => (
            <option value={i} key={u.label}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
      <div className="text-sm text-muted-foreground">结果/Result: {to}</div>
    </div>
  )
}

export default UnitConvert
