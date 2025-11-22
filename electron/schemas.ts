import { z } from "zod"

// Zod schemas for IPC validation
export const updateInfoSchema = z.object({
  version: z.string(),
  date: z.string().optional(),
  body: z.string().optional(),
})

export const updateProgressEventSchema = z.object({
  event: z.enum(["Started", "Progress", "Finished"]),
  data: z.object({
    downloaded: z.number().optional(),
    chunkLength: z.number().optional(),
    contentLength: z.number().optional(),
  }),
})

// Infer TypeScript types from Zod schemas
export type UpdateInfo = z.infer<typeof updateInfoSchema>
export type UpdateProgressEvent = z.infer<typeof updateProgressEventSchema>
