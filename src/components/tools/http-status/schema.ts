import { z } from "zod"

/**
 * HTTP status code schema
 */
export const httpStatusCodeSchema = z.string().regex(/^\d{3}$/, "Status code must be a 3 digit value")

/**
 * HTTP status entry schema
 */
export const httpStatusEntrySchema = z.object({
  code: httpStatusCodeSchema,
  message: z.string(),
  description: z.string(),
  category: z.enum(["informational", "success", "redirect", "client-error", "server-error"]),
})

/**
 * HTTP status map schema
 */
export const httpStatusMapSchema = z.record(httpStatusCodeSchema, z.string())

/**
 * HTTP status lookup schema
 */
export const httpStatusLookupSchema = z.object({
  query: z.string(),
  result: z.string(),
})

export type HttpStatusCode = z.infer<typeof httpStatusCodeSchema>
export type HttpStatusEntry = z.infer<typeof httpStatusEntrySchema>
export type HttpStatusLookup = z.infer<typeof httpStatusLookupSchema>
