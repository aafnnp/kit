import { useState } from 'react'

/**
 * TriangleSolver - 三角形求边角
 * @returns 组件
 */
// 输入两边及夹角，计算第三边
const TriangleSolver = () => {
  const [a, setA] = useState(3)
  const [b, setB] = useState(4)
  const [angle, setAngle] = useState(90)
  // 余弦定理
  const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos((angle * Math.PI) / 180)).toFixed(2)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
          className="w-20 border rounded px-2"
        />
        <input
          type="number"
          value={b}
          onChange={(e) => setB(Number(e.target.value))}
          className="w-20 border rounded px-2"
        />
        <input
          type="number"
          value={angle}
          onChange={(e) => setAngle(Number(e.target.value))}
          className="w-20 border rounded px-2"
        />
      </div>
      <div className="text-sm text-muted-foreground">第三边/Side c: {c}</div>
    </div>
  )
}

export default TriangleSolver
