import { cleanup, effect, Storage } from "nsh"
import { hydrated, keepDrafts } from "./state"

const PREFIX = "kit.draft."
const MAX_DRAFT_LENGTH = 200_000

export type DraftSignal = {
  (): string
  set(value: string): void
}

function draftKey(slug: string): string {
  return `${PREFIX}${slug}`
}

/** Restores a saved draft only when the field still holds its initial value. */
export function restoreDraft(slug: string, initial: string, signal: DraftSignal): void {
  void Storage.getItem(draftKey(slug))
    .then((value) => {
      if (keepDrafts() && value !== null && value !== "" && signal() === initial) signal.set(value)
    })
    .catch(() => {})
}

/** Saves a draft after edits settle; call from a component body. */
export function persistDraft(slug: string, signal: DraftSignal): void {
  let timer: number | undefined
  let ready = false

  cleanup(() => {
    if (timer !== undefined) clearTimeout(timer)
  })

  effect(() => {
    const text = signal()
    if (!ready) {
      // The first run is the mount; wait for `restoreDraft` to finish.
      ready = true
      return
    }
    if (!hydrated() || !keepDrafts()) return
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      if (!text) void Storage.removeItem(draftKey(slug)).catch(() => {})
      else if (text.length <= MAX_DRAFT_LENGTH) void Storage.setItem(draftKey(slug), text).catch(() => {})
    }, 600)
  })
}

export async function clearDrafts(): Promise<void> {
  try {
    const keys = await Storage.keys()
    await Promise.all(keys.filter((key) => key.startsWith(PREFIX)).map((key) => Storage.removeItem(key)))
  } catch {
    // Storage is optional; clearing drafts never blocks the app.
  }
}
