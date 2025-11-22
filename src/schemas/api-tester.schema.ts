import { z } from "zod"

// ==================== API Tester Schemas ====================

/**
 * HTTP Method schema
 */
export const httpMethodSchema = z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])

/**
 * API Header schema
 */
export const apiHeaderSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
})

/**
 * API Param schema
 */
export const apiParamSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
})

/**
 * API Request schema
 */
export const apiRequestSchema = z.object({
  id: z.string(),
  name: z.string(),
  method: httpMethodSchema,
  url: z.string(),
  headers: z.array(apiHeaderSchema),
  params: z.array(apiParamSchema),
  body: z.string(),
  bodyType: z.enum(["json", "form", "text", "xml"]),
  timeout: z.number(),
  followRedirects: z.boolean(),
})

/**
 * API Response schema
 */
export const apiResponseSchema = z.object({
  status: z.number(),
  statusText: z.string(),
  headers: z.record(z.string(), z.string()),
  data: z.string(),
  size: z.number(),
  time: z.number(),
  timestamp: z.number(),
})

/**
 * API Test Result schema
 */
export const apiTestResultSchema = z.object({
  id: z.string(),
  request: apiRequestSchema,
  response: apiResponseSchema.optional(),
  error: z.string().optional(),
  isLoading: z.boolean(),
  timestamp: z.number(),
})

/**
 * API Collection schema
 */
export const apiCollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  requests: z.array(apiRequestSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
})

/**
 * API Environment schema
 */
export const apiEnvironmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  variables: z.record(z.string(), z.string()),
  isActive: z.boolean(),
})

/**
 * API Tester State schema
 */
export const apiTesterStateSchema = z.object({
  currentRequest: apiRequestSchema,
  results: z.array(apiTestResultSchema),
  collections: z.array(apiCollectionSchema),
  environments: z.array(apiEnvironmentSchema),
  activeEnvironment: z.string().optional(),
  isLoading: z.boolean(),
  error: z.string().optional(),
})

// ==================== Type Exports ====================

export type HttpMethod = z.infer<typeof httpMethodSchema>
export type ApiHeader = z.infer<typeof apiHeaderSchema>
export type ApiParam = z.infer<typeof apiParamSchema>
export type ApiRequest = z.infer<typeof apiRequestSchema>
export type ApiResponse = z.infer<typeof apiResponseSchema>
export type ApiTestResult = z.infer<typeof apiTestResultSchema>
export type ApiCollection = z.infer<typeof apiCollectionSchema>
export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>
export type ApiTesterState = z.infer<typeof apiTesterStateSchema>

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
