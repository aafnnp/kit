/// <reference types="vite/client" />

declare global {
  interface Window {
    adsbygoogle?: any
    __TAURI__?: {
      core?: {
        invoke: (cmd: string, args?: Record<string, unknown>) => Promise<any>
      }
      event?: {
        listen: (event: string, handler: (event: { payload: any }) => void) => Promise<() => void>
      }
      process?: {
        relaunch?: () => Promise<void>
      }
    }
    desktopApi?: {
      updater?: {
        check: () => Promise<{ version: string; date: string; body: string } | null>
        downloadAndInstall: (cb: (event: any) => void) => Promise<void>
        install?: () => Promise<void>
      }
      relaunch: () => Promise<void>
      openExternal?: (url: string) => Promise<void>
      window?: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
      }
    }
  }
}

export {}
