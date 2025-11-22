/// <reference types="vite/client" />

declare global {
  interface Window {
    adsbygoogle?: any
    desktopApi?: {
      updater?: {
        check: () => Promise<{ version: string; date: string; body: string } | null>
        downloadAndInstall: (cb: (event: any) => void) => Promise<void>
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
