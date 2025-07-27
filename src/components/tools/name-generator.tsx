import { useState } from 'react'
/**
 * NameGenerator - 名字生成
 * @returns 组件
 */
// 随机生成英文名
const names = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace']
const NameGenerator = () => {
  const [name, setName] = useState(names[Math.floor(Math.random() * names.length)])
  const gen = () => setName(names[Math.floor(Math.random() * names.length)])
  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="font-mono text-lg select-all">{name}</div>
      <button className="btn" onClick={gen}>
        生成/Generate
      </button>
    </div>
  )
}
export default NameGenerator
