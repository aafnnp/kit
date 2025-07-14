import { useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
/**
 * PaletteGenerator - 自动配色生成器
 * @returns 组件
 */
// 随机生成 5 色调色板
function randomColor() {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`
}

function randomColorByKeyword(keyword: string, index: number) {
  // 用关键词的hash影响色相，保证同关键词同色板
  let hash = 0
  for (let i = 0; i < keyword.length; i++) {
    hash = keyword.charCodeAt(i) + ((hash << 5) - hash)
  }
  // 生成色相，分布在360度色环
  const hue = (hash + index * 60) % 360
  return `hsl(${hue}, 70%, 55%)`
}

const PaletteGenerator = () => {
  const [colors, setColors] = useState<string[]>(Array.from({ length: 5 }, randomColor))
  const regenerate = () => setColors(Array.from({ length: 5 }, randomColor))
  const [q, setQ] = useState('')

  const gen = () => {
    if (!q.trim()) {
      setColors(Array.from({ length: 5 }, randomColor))
    } else {
      setColors(Array.from({ length: 5 }, (_, i) => randomColorByKeyword(q.trim(), i)))
    }
  }

  // 复制色值到剪贴板
  const copy = (c: string) => {
    navigator.clipboard.writeText(c)
  }

  return (
    <div className="flex flex-col gap-4 items-center">
      <Input
        className="border rounded px-2 py-1 w-full"
        style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="输入关键词/色名..."
      />
      <Button className="rounded px-2 py-1" style={{ background: 'var(--color-accent)', color: '#fff' }} onClick={gen}>
        生成/Generate
      </Button>
      <div className="flex gap-4 mt-2">
        {colors.map((c, i) => (
          <div
            key={c + i}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => copy(c)}
            title="点击复制色值"
          >
            <span
              className="w-12 h-12 rounded border mb-1"
              style={{ background: c, borderColor: 'var(--color-border)' }}
            ></span>
            <span className="text-xs select-all" style={{ color: c }}>
              {c}
            </span>
          </div>
        ))}
      </div>
      <Button onClick={regenerate}>重新生成/Regenerate</Button>
    </div>
  )
}

export default PaletteGenerator
