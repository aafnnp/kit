import { useState } from 'react'
/**
 * CreditCardCheck - Luhn Validator
 * @returns 组件
 */
// 输入卡号，Luhn 校验
const CreditCardCheck = () => {
  const [num, setNum] = useState('')
  const valid = (() => {
    let sum = 0,
      alt = false
    for (let i = num.length - 1; i >= 0; i--) {
      let n = parseInt(num[i])
      if (isNaN(n)) return false
      if (alt) {
        n *= 2
        if (n > 9) n -= 9
      }
      sum += n
      alt = !alt
    }
    return num.length > 0 && sum % 10 === 0
  })()
  return (
    <div className="flex flex-col gap-4">
      <input
        className="w-full rounded border p-2"
        value={num}
        onChange={(e) => setNum(e.target.value)}
        placeholder="输入卡号..."
      />
      <div className="text-sm text-muted-foreground">{valid ? '有效/Valid' : '无效/Invalid'}</div>
    </div>
  )
}
export default CreditCardCheck
