// 设置页面相关类型

export type SettingsStep = 'idle' | 'confirm' | 'downloading' | 'finished'

export interface UpdateInfo {
  version: string
  date?: string
  body?: string
  downloadAndInstall: (cb: (event: any) => void) => Promise<void>
}
