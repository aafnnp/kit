import { useState } from 'react'

/**
 * PercentageCalc - 百分比计算
 * @returns 组件
 */
// 输入分子分母，计算百分比
const PercentageCalc = () => {
  const [a, setA] = useState(0)
  const [b, setB] = useState(100)
  const percent = b === 0 ? '-' : ((a / b) * 100).toFixed(2)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
          className="w-24 border rounded px-2"
        />
        <span>/</span>
        <input
          type="number"
          value={b}
          onChange={(e) => setB(Number(e.target.value))}
          className="w-24 border rounded px-2"
        />
      </div>
      <div className="text-sm text-muted-foreground">百分比/Percent: {percent}%</div>
    </div>
  )
}

export default PercentageCalc
