import { useState } from 'react'
/**
 * HttpStatus - HTTP 状态码查询
 * @returns 组件
 */
// 输入状态码，输出含义
const statusMap: Record<string, string> = {
  '200': 'OK 成功',
  '301': 'Moved Permanently 永久重定向',
  '302': 'Found 临时重定向',
  '400': 'Bad Request 请求错误',
  '401': 'Unauthorized 未授权',
  '403': 'Forbidden 禁止访问',
  '404': 'Not Found 未找到',
  '500': 'Internal Server Error 服务器错误',
}
const HttpStatus = () => {
  const [code, setCode] = useState('')
  const desc = statusMap[code] || '未知/Unknown'
  return (
    <div className="flex flex-col gap-4">
      <input
        className="w-32 border rounded px-2"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="状态码..."
      />
      <div className="text-sm text-muted-foreground">{desc}</div>
    </div>
  )
}
export default HttpStatus
