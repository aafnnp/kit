import { z } from "zod"

// ==================== Settings Schemas ====================

/**
 * Settings Step schema
 */
export const settingsStepSchema = z.enum(["idle", "confirm", "downloading", "finished"])

/**
 * Update Info schema
 * Note: downloadAndInstall is a function, so we use z.custom() for it
 */
export const updateInfoSchema = z.object({
  version: z.string(),
  date: z.string(),
  body: z.string(),
  downloadAndInstall: z.custom<(cb: (event: any) => void) => Promise<void>>(),
})

// ==================== Type Exports ====================

export type SettingsStep = z.infer<typeof settingsStepSchema>
export type UpdateInfo = z.infer<typeof updateInfoSchema>
