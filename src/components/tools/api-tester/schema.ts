// ==================== API Tester Types ====================

/**
 * HTTP Method type
 */
export type httpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"

/**
 * API Header type
 */
export interface apiHeader {
  id: string,
  key: string,
  value: string,
  enabled: boolean,
}

/**
 * API Param type
 */
export interface apiParam {
  id: string,
  key: string,
  value: string,
  enabled: boolean,
}

/**
 * API Request type
 */
export interface apiRequest {
  id: string,
  name: string,
  method: httpMethod,
  url: string,
  headers: apiHeader[],
  params: apiParam[],
  body: string,
  bodyType: "json" | "form" | "text" | "xml",
  timeout: number,
  followRedirects: boolean,
}

/**
 * API Response type
 */
export interface apiResponse {
  status: number,
  statusText: string,
  headers: Record<string, string>,
  data: string,
  size: number,
  time: number,
  timestamp: number,
}

/**
 * API Test Result type
 */
export interface apiTestResult {
  id: string,
  request: apiRequest
  response?: apiResponse
  error?: string
  isLoading: boolean,
  timestamp: number,
}

/**
 * API Collection type
 */
export interface apiCollection {
  id: string,
  name: string,
  description: string,
  requests: apiRequest[],
  createdAt: number,
  updatedAt: number,
}

/**
 * API Environment type
 */
export interface apiEnvironment {
  id: string,
  name: string,
  variables: Record<string, string>,
  isActive: boolean,
}

/**
 * API Tester State type
 */
export interface apiTesterState {
  currentRequest: apiRequest,
  results: apiTestResult[],
  collections: apiCollection[],
  environments: apiEnvironment[]
  activeEnvironment?: string
  isLoading: boolean
  error?: string
}

// ==================== Type Exports ====================

export type HttpMethod = httpMethod
export type ApiHeader = apiHeader
export type ApiParam = apiParam
export type ApiRequest = apiRequest
export type ApiResponse = apiResponse
export type ApiTestResult = apiTestResult
export type ApiCollection = apiCollection
export type ApiEnvironment = apiEnvironment
export type ApiTesterState = apiTesterState

// ==================== Utilities ====================

/**
 * Common HTTP headers
 */
export const COMMON_HEADERS = [
  "Accept",
  "Accept-Charset",
  "Accept-Encoding",
  "Accept-Language",
  "Authorization",
  "Cache-Control",
  "Content-Type",
  "Cookie",
  "Origin",
  "Referer",
  "User-Agent",
  "X-Requested-With",
  "X-API-Key",
]

/**
 * Request templates
 */
export const REQUEST_TEMPLATES: Partial<ApiRequest>[] = [
  {
    method: "GET",
    name: "Example",
    url: "https://api.example.com/users",
    bodyType: "json",
  },
  {
    method: "POST",
    name: "Create",
    url: "https://api.example.com/users",
    body: JSON.stringify({ name: "John Doe", email: "john@example.com" }, null, 2),
    bodyType: "json",
  },
  {
    method: "PUT",
    name: "Update",
    url: "https://api.example.com/users/1",
    body: JSON.stringify({ name: "Jane Doe" }, null, 2),
    bodyType: "json",
  },
  {
    method: "DELETE",
    name: "Delete",
    url: "https://api.example.com/users/1",
    bodyType: "json",
  },
]

/**
 * Get status category from HTTP status code
 */
export function getStatusCategory(
  status: number
): "success" | "redirect" | "client-error" | "server-error" | "unknown" {
  if (status >= 200 && status < 300) {
    return "success"
  }
  if (status >= 300 && status < 400) {
    return "redirect"
  }
  if (status >= 400 && status < 500) {
    return "client-error"
  }
  if (status >= 500) {
    return "server-error"
  }
  return "unknown"
}
