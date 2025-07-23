// API 测试工具的类型定义

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export interface ApiHeader {
  id: string
  key: string
  value: string
  enabled: boolean
}

export interface ApiParam {
  id: string
  key: string
  value: string
  enabled: boolean
}

export interface ApiRequest {
  id: string
  name: string
  method: HttpMethod
  url: string
  headers: ApiHeader[]
  params: ApiParam[]
  body: string
  bodyType: 'json' | 'form' | 'text' | 'xml'
  timeout: number
  followRedirects: boolean
}

export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  data: string
  size: number
  time: number
  timestamp: number
}

export interface ApiTestResult {
  id: string
  request: ApiRequest
  response?: ApiResponse
  error?: string
  isLoading: boolean
  timestamp: number
}

export interface ApiCollection {
  id: string
  name: string
  description: string
  requests: ApiRequest[]
  createdAt: number
  updatedAt: number
}

export interface ApiEnvironment {
  id: string
  name: string
  variables: Record<string, string>
  isActive: boolean
}

export interface ApiTesterState {
  currentRequest: ApiRequest
  results: ApiTestResult[]
  collections: ApiCollection[]
  environments: ApiEnvironment[]
  activeEnvironment?: string
  isLoading: boolean
  error?: string
}

// 预设的请求模板
export const REQUEST_TEMPLATES: Partial<ApiRequest>[] = [
  {
    name: 'GET Request',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: [
      { id: '1', key: 'Accept', value: 'application/json', enabled: true }
    ],
    bodyType: 'json'
  },
  {
    name: 'POST Request',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
      { id: '2', key: 'Accept', value: 'application/json', enabled: true }
    ],
    body: JSON.stringify({
      title: 'foo',
      body: 'bar',
      userId: 1
    }, null, 2),
    bodyType: 'json'
  },
  {
    name: 'PUT Request',
    method: 'PUT',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true }
    ],
    body: JSON.stringify({
      id: 1,
      title: 'updated title',
      body: 'updated body',
      userId: 1
    }, null, 2),
    bodyType: 'json'
  },
  {
    name: 'DELETE Request',
    method: 'DELETE',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: [],
    bodyType: 'json'
  }
]

// HTTP 状态码分类
export const getStatusCategory = (status: number): 'success' | 'redirect' | 'client-error' | 'server-error' | 'info' => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'redirect'
  if (status >= 400 && status < 500) return 'client-error'
  if (status >= 500) return 'server-error'
  return 'info'
}

// 常用的 Content-Type
export const CONTENT_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
  'text/html',
  'application/xml',
  'text/xml'
]

// 常用的请求头
export const COMMON_HEADERS = [
  'Accept',
  'Accept-Encoding',
  'Accept-Language',
  'Authorization',
  'Cache-Control',
  'Content-Type',
  'Cookie',
  'User-Agent',
  'X-API-Key',
  'X-Requested-With'
]