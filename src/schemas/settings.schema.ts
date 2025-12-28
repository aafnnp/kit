// ==================== Settings Types ====================

/**
 * Settings Step type
 */
export type SettingsStep = "idle" | "confirm" | "downloading" | "finished"

/**
 * Update Info type
 */
export interface UpdateInfo {
  version: string
  date: string
  body: string
  downloadAndInstall: (cb: (event: any) => void) => Promise<void>
}
