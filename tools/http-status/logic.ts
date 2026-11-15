export interface HttpStatus {
  code: number
  phrase: string
  zh: string
  category: "info" | "success" | "redirect" | "client-error" | "server-error"
}

export const httpStatuses: HttpStatus[] = [
  { code: 100, phrase: "Continue", zh: "继续", category: "info" },
  { code: 101, phrase: "Switching Protocols", zh: "切换协议", category: "info" },
  { code: 102, phrase: "Processing", zh: "处理中", category: "info" },
  { code: 103, phrase: "Early Hints", zh: "早期提示", category: "info" },
  { code: 200, phrase: "OK", zh: "请求成功", category: "success" },
  { code: 201, phrase: "Created", zh: "已创建", category: "success" },
  { code: 202, phrase: "Accepted", zh: "已接受", category: "success" },
  { code: 203, phrase: "Non-Authoritative Information", zh: "非权威信息", category: "success" },
  { code: 204, phrase: "No Content", zh: "无内容", category: "success" },
  { code: 205, phrase: "Reset Content", zh: "重置内容", category: "success" },
  { code: 206, phrase: "Partial Content", zh: "部分内容", category: "success" },
  { code: 226, phrase: "IM Used", zh: "已使用实例操作", category: "success" },
  { code: 300, phrase: "Multiple Choices", zh: "多种选择", category: "redirect" },
  { code: 301, phrase: "Moved Permanently", zh: "永久重定向", category: "redirect" },
  { code: 302, phrase: "Found", zh: "临时重定向", category: "redirect" },
  { code: 303, phrase: "See Other", zh: "查看其他位置", category: "redirect" },
  { code: 304, phrase: "Not Modified", zh: "资源未修改", category: "redirect" },
  { code: 307, phrase: "Temporary Redirect", zh: "临时重定向（保留方法）", category: "redirect" },
  { code: 308, phrase: "Permanent Redirect", zh: "永久重定向（保留方法）", category: "redirect" },
  { code: 400, phrase: "Bad Request", zh: "请求无效", category: "client-error" },
  { code: 402, phrase: "Payment Required", zh: "需要付款", category: "client-error" },
  { code: 401, phrase: "Unauthorized", zh: "未认证", category: "client-error" },
  { code: 403, phrase: "Forbidden", zh: "禁止访问", category: "client-error" },
  { code: 404, phrase: "Not Found", zh: "未找到", category: "client-error" },
  { code: 406, phrase: "Not Acceptable", zh: "不可接受", category: "client-error" },
  { code: 407, phrase: "Proxy Authentication Required", zh: "需要代理认证", category: "client-error" },
  { code: 405, phrase: "Method Not Allowed", zh: "方法不允许", category: "client-error" },
  { code: 408, phrase: "Request Timeout", zh: "请求超时", category: "client-error" },
  { code: 409, phrase: "Conflict", zh: "资源冲突", category: "client-error" },
  { code: 410, phrase: "Gone", zh: "资源已删除", category: "client-error" },
  { code: 411, phrase: "Length Required", zh: "需要长度", category: "client-error" },
  { code: 412, phrase: "Precondition Failed", zh: "前置条件失败", category: "client-error" },
  { code: 413, phrase: "Content Too Large", zh: "请求内容过大", category: "client-error" },
  { code: 414, phrase: "URI Too Long", zh: "URI 过长", category: "client-error" },
  { code: 415, phrase: "Unsupported Media Type", zh: "不支持的媒体类型", category: "client-error" },
  { code: 416, phrase: "Range Not Satisfiable", zh: "范围无法满足", category: "client-error" },
  { code: 417, phrase: "Expectation Failed", zh: "期望失败", category: "client-error" },
  { code: 418, phrase: "I'm a Teapot", zh: "我是茶壶", category: "client-error" },
  { code: 421, phrase: "Misdirected Request", zh: "请求指向错误", category: "client-error" },
  { code: 422, phrase: "Unprocessable Content", zh: "内容无法处理", category: "client-error" },
  { code: 423, phrase: "Locked", zh: "已锁定", category: "client-error" },
  { code: 424, phrase: "Failed Dependency", zh: "依赖失败", category: "client-error" },
  { code: 425, phrase: "Too Early", zh: "请求过早", category: "client-error" },
  { code: 426, phrase: "Upgrade Required", zh: "需要升级", category: "client-error" },
  { code: 428, phrase: "Precondition Required", zh: "需要前置条件", category: "client-error" },
  { code: 429, phrase: "Too Many Requests", zh: "请求过多", category: "client-error" },
  { code: 431, phrase: "Request Header Fields Too Large", zh: "请求头字段过大", category: "client-error" },
  { code: 451, phrase: "Unavailable For Legal Reasons", zh: "因法律原因不可用", category: "client-error" },
  { code: 500, phrase: "Internal Server Error", zh: "服务器内部错误", category: "server-error" },
  { code: 501, phrase: "Not Implemented", zh: "尚未实现", category: "server-error" },
  { code: 502, phrase: "Bad Gateway", zh: "网关错误", category: "server-error" },
  { code: 503, phrase: "Service Unavailable", zh: "服务不可用", category: "server-error" },
  { code: 504, phrase: "Gateway Timeout", zh: "网关超时", category: "server-error" },
  { code: 505, phrase: "HTTP Version Not Supported", zh: "不支持 HTTP 版本", category: "server-error" },
  { code: 506, phrase: "Variant Also Negotiates", zh: "变体协商错误", category: "server-error" },
  { code: 507, phrase: "Insufficient Storage", zh: "存储不足", category: "server-error" },
  { code: 508, phrase: "Loop Detected", zh: "检测到循环", category: "server-error" },
  { code: 510, phrase: "Not Extended", zh: "未扩展", category: "server-error" },
  { code: 511, phrase: "Network Authentication Required", zh: "需要网络认证", category: "server-error" },
]

export function searchHttpStatuses(query: string): HttpStatus[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return httpStatuses
  return httpStatuses.filter((status) =>
    [String(status.code), status.phrase, status.zh, status.category]
      .some((value) => value.toLowerCase().includes(needle)),
  )
}
