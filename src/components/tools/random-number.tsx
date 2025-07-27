import { useState } from 'react'

/**
 * RandomNumber - 随机数生成
 * @returns 组件
 */
// 输入范围，生成随机整数
const RandomNumber = () => {
  const [min, setMin] = useState(1)
  const [max, setMax] = useState(100)
  const [val, setVal] = useState<number | null>(null)
  const gen = () => setVal(Math.floor(Math.random() * (max - min + 1)) + min)
  return (
    <div className="flex flex-col gap-4">
      <input
        type="number"
        value={min}
        onChange={(e) => setMin(Number(e.target.value))}
        className="w-20 border rounded px-2"
      />
      <input
        type="number"
        value={max}
        onChange={(e) => setMax(Number(e.target.value))}
        className="w-20 border rounded px-2"
      />
      <button className="btn" onClick={gen}>
        生成/Generate
      </button>
      <div className="text-2xl font-mono">{val !== null ? val : ''}</div>
    </div>
  )
}

export default RandomNumber
