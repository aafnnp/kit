import { useState } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
/**
 * ContrastChecker - 对比度检测
 * @returns 组件
 */
// 检查前景色与背景色对比度
function luminance(hex: string) {
  const rgb = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((x) => parseInt(x, 16) / 255) || [0, 0, 0]
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a: string, b: string) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05)
}
function getWcagLevel(ratio: number) {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}

const ContrastChecker = () => {
  const [fg, setFg] = useState('#222222')
  const [bg, setBg] = useState('#ffffff')
  const ratio = contrast(fg, bg)
  const wcag = getWcagLevel(ratio)
  // 复制色值
  const copy = (c: string) => navigator.clipboard.writeText(c)

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex gap-4">
        <Label className="flex flex-col items-center">
          前景色/FG
          <Input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
        </Label>
        <Label className="flex flex-col items-center">
          背景色/BG
          <Input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
        </Label>
      </div>
      <div className="w-40 h-12 flex items-center justify-center rounded border" style={{ background: bg, color: fg }}>
        示例文本/Example
      </div>
      <div className="text-sm">
        对比度/Contrast Ratio: <span className="font-mono">{ratio.toFixed(2)}</span>
        {ratio >= 4.5 ? ' ✅ 合格/Pass' : ' ❌ 不合格/Fail'}
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex flex-col items-center cursor-pointer" onClick={() => copy(fg)} title="点击复制前景色">
          <span
            className="w-10 h-10 rounded border mb-1"
            style={{ background: fg, borderColor: 'var(--color-border)' }}
          ></span>
          <span className="text-xs select-all">{fg}</span>
        </div>
        <div className="flex flex-col items-center cursor-pointer" onClick={() => copy(bg)} title="点击复制背景色">
          <span
            className="w-10 h-10 rounded border mb-1"
            style={{ background: bg, borderColor: 'var(--color-border)' }}
          ></span>
          <span className="text-xs select-all">{bg}</span>
        </div>
      </div>
      <div className="mt-2 text-sm">
        WCAG 等级: <span className="font-mono">{wcag}</span>
        {wcag === 'Fail' ? ' ❌' : ' ✅'}
      </div>
    </div>
  )
}

export default ContrastChecker
