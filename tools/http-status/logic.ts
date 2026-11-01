export interface HttpStatus {
  code: number
  phrase: string
  zh: string
  category: "info" | "success" | "redirect" | "client-error" | "server-error"
}

export const httpStatuses: HttpStatus[] = [
  { code: 100, phrase: "Continue", zh: "继续", category: "info" },
  { code: 101, phrase: "Switching Protocols", zh: "切换协议", category: "info" },
  { code: 200, phrase: "OK", zh: "请求成功", category: "success" },
  { code: 201, phrase: "Created", zh: "已创建", category: "success" },
  { code: 202, phrase: "Accepted", zh: "已接受", category: "success" },
  { code: 204, phrase: "No Content", zh: "无内容", category: "success" },
  { code: 301, phrase: "Moved Permanently", zh: "永久重定向", category: "redirect" },
  { code: 302, phrase: "Found", zh: "临时重定向", category: "redirect" },
  { code: 304, phrase: "Not Modified", zh: "资源未修改", category: "redirect" },
  { code: 307, phrase: "Temporary Redirect", zh: "临时重定向（保留方法）", category: "redirect" },
  { code: 308, phrase: "Permanent Redirect", zh: "永久重定向（保留方法）", category: "redirect" },
  { code: 400, phrase: "Bad Request", zh: "请求无效", category: "client-error" },
  { code: 401, phrase: "Unauthorized", zh: "未认证", category: "client-error" },
  { code: 403, phrase: "Forbidden", zh: "禁止访问", category: "client-error" },
  { code: 404, phrase: "Not Found", zh: "未找到", category: "client-error" },
  { code: 405, phrase: "Method Not Allowed", zh: "方法不允许", category: "client-error" },
  { code: 408, phrase: "Request Timeout", zh: "请求超时", category: "client-error" },
  { code: 409, phrase: "Conflict", zh: "资源冲突", category: "client-error" },
  { code: 410, phrase: "Gone", zh: "资源已删除", category: "client-error" },
  { code: 413, phrase: "Content Too Large", zh: "请求内容过大", category: "client-error" },
  { code: 415, phrase: "Unsupported Media Type", zh: "不支持的媒体类型", category: "client-error" },
  { code: 422, phrase: "Unprocessable Content", zh: "内容无法处理", category: "client-error" },
  { code: 429, phrase: "Too Many Requests", zh: "请求过多", category: "client-error" },
  { code: 500, phrase: "Internal Server Error", zh: "服务器内部错误", category: "server-error" },
  { code: 501, phrase: "Not Implemented", zh: "尚未实现", category: "server-error" },
  { code: 502, phrase: "Bad Gateway", zh: "网关错误", category: "server-error" },
  { code: 503, phrase: "Service Unavailable", zh: "服务不可用", category: "server-error" },
  { code: 504, phrase: "Gateway Timeout", zh: "网关超时", category: "server-error" },
]

export function searchHttpStatuses(query: string): HttpStatus[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return httpStatuses
  return httpStatuses.filter((status) =>
    [String(status.code), status.phrase, status.zh, status.category]
      .some((value) => value.toLowerCase().includes(needle)),
  )
}
