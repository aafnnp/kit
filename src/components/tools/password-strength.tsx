import { useState } from 'react'

/**
 * PasswordStrength - 密码强度检测
 * @returns 组件
 */
// 简单检测密码长度和字符种类
const PasswordStrength = () => {
  const [pw, setPw] = useState('')
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const level = ['极弱/Very Weak', '弱/Weak', '中/Medium', '强/Strong', '极强/Very Strong'][score]
  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        className="w-full border rounded px-2"
        placeholder="输入密码..."
      />
      <div className="text-sm text-muted-foreground">强度/Strength: {level}</div>
    </div>
  )
}

export default PasswordStrength
