import { openUrl, signal } from "nsh"
import { checkForUpdate, downloadUpdate, installAndRestart } from "nsh/updater"
import type { AppUpdate, UpdateProgress } from "nsh/updater"

/** The parts of `nsh/updater` the update flow uses, so tests can supply them. */
export interface UpdateClient {
  checkForUpdate(): Promise<AppUpdate | null>
  downloadUpdate(onProgress?: ((progress: UpdateProgress) => void) | null): Promise<void>
  installAndRestart(): Promise<void>
  openUrl(url: string): Promise<void>
}

export type UpdatePhase = "idle" | "checking" | "current" | "available" | "downloading" | "installing" | "error"

export function createUpdateController(client: UpdateClient) {
  const phase = signal<UpdatePhase>("idle")
  const update = signal<AppUpdate | null>(null)
  const progress = signal(0)
  const error = signal<string | null>(null)
  let pendingCheck: Promise<void> | null = null
  let pendingInstall: Promise<void> | null = null

  const busy = () => phase() === "checking" || phase() === "downloading" || phase() === "installing"

  const runCheck = async (quiet: boolean) => {
    phase.set("checking")
    error.set(null)
    try {
      const found = await client.checkForUpdate()
      update.set(found)
      progress.set(0)
      phase.set(found ? "available" : "current")
    } catch (cause) {
      update.set(null)
      if (quiet) {
        // A launch-time check that cannot reach the source stays out of the way.
        phase.set("idle")
      } else {
        error.set(messageOf(cause))
        phase.set("error")
      }
    }
  }

  const check = (options?: { quiet?: boolean }) => {
    if (pendingCheck) return pendingCheck
    pendingCheck = runCheck(options?.quiet === true).finally(() => {
      pendingCheck = null
    })
    return pendingCheck
  }

  const openDownload = async (url?: string) => {
    const target = url ?? update()?.url
    if (!target) return
    try {
      await client.openUrl(target)
    } catch (cause) {
      error.set(messageOf(cause))
      phase.set("error")
    }
  }

  const runInstall = async () => {
    const found = update()
    if (!found) return
    if (!found.canInstall) {
      await openDownload(found.url)
      return
    }
    phase.set("downloading")
    progress.set(0)
    error.set(null)
    try {
      await client.downloadUpdate(({ received, total }) => {
        // Without a known total there is no fraction to show; keep the last one.
        if (total && total > 0) progress.set(fraction(received, total))
      })
      phase.set("installing")
      // Settles only when replacing the app fails; a successful install restarts it.
      await client.installAndRestart()
    } catch (cause) {
      error.set(messageOf(cause))
      phase.set("error")
    }
  }

  const install = () => {
    if (pendingInstall) return pendingInstall
    pendingInstall = runInstall().finally(() => {
      pendingInstall = null
    })
    return pendingInstall
  }

  return { phase, update, progress, error, busy, check, install, openDownload }
}

function fraction(received: number, total?: number | null): number {
  if (!total || total <= 0) return 0
  return Math.min(1, Math.max(0, received / total))
}

function messageOf(cause: unknown): string {
  if (cause instanceof Error) return cause.message
  return String(cause)
}

export const updater = createUpdateController({
  checkForUpdate,
  downloadUpdate: (onProgress) => downloadUpdate(onProgress),
  installAndRestart,
  openUrl: async (url) => {
    await openUrl(url)
  },
})

let started = false

/** Starts the launch-time check once per app run. */
export function startUpdateCheck() {
  if (started) return
  started = true
  void updater.check({ quiet: true })
}
