import { expect, test } from "nsh/test"
import type { AppUpdate } from "nsh/updater"
import { createUpdateController } from "../lib/updater"
import type { UpdateClient } from "../lib/updater"

const available: AppUpdate = {
  version: "1.2.3",
  url: "https://example.com/kit-1.2.3-linux-x86_64.tar.gz",
  canInstall: true,
  notes: "Fixes and improvements.",
}

function fakeClient(overrides: Partial<UpdateClient> = {}): UpdateClient {
  return {
    checkForUpdate: async () => null,
    downloadUpdate: async () => {},
    installAndRestart: async () => {},
    openUrl: async () => {},
    ...overrides,
  }
}

test("a check reports an available update", async () => {
  const controller = createUpdateController(fakeClient({ checkForUpdate: async () => available }))

  await controller.check()

  expect(controller.phase()).toBe("available")
  expect(controller.update()?.version).toBe("1.2.3")
  expect(controller.error()).toBe(null)
})

test("a check reports the current version or a failure", async () => {
  const current = createUpdateController(fakeClient())
  await current.check()
  expect(current.phase()).toBe("current")
  expect(current.update()).toBe(null)

  const failing = createUpdateController(
    fakeClient({
      checkForUpdate: async () => {
        throw new Error("offline")
      },
    }),
  )
  await failing.check()
  expect(failing.phase()).toBe("error")
  expect(failing.error()).toBe("offline")
})

test("a quiet launch check stays idle when it fails", async () => {
  const controller = createUpdateController(
    fakeClient({
      checkForUpdate: async () => {
        throw new Error("offline")
      },
    }),
  )

  await controller.check({ quiet: true })

  expect(controller.phase()).toBe("idle")
  expect(controller.error()).toBe(null)
})

test("an update that cannot install opens its download page", async () => {
  const opened: string[] = []
  const controller = createUpdateController(
    fakeClient({
      checkForUpdate: async () => ({ ...available, canInstall: false }),
      openUrl: async (url) => {
        opened.push(url)
      },
    }),
  )

  await controller.check()
  await controller.install()

  expect(opened).toEqual([available.url])
  expect(controller.phase()).toBe("available")
})

test("installing downloads with progress and then restarts", async () => {
  let installed = false
  const controller = createUpdateController(
    fakeClient({
      checkForUpdate: async () => available,
      downloadUpdate: async (onProgress) => {
        onProgress?.({ received: 100 })
        expect(controller.progress()).toBe(0)
        onProgress?.({ received: 25, total: 100 })
        expect(controller.progress()).toBe(0.25)
        onProgress?.({ received: 100, total: 100 })
      },
      installAndRestart: async () => {
        installed = true
      },
    }),
  )

  await controller.check()
  await controller.install()

  expect(installed).toBe(true)
  expect(controller.progress()).toBe(1)
  expect(controller.phase()).toBe("installing")
})

test("a failed download keeps the error and allows another try", async () => {
  const controller = createUpdateController(
    fakeClient({
      checkForUpdate: async () => available,
      downloadUpdate: async () => {
        throw new Error("checksum mismatch")
      },
    }),
  )

  await controller.check()
  await controller.install()

  expect(controller.phase()).toBe("error")
  expect(controller.error()).toBe("checksum mismatch")
  expect(controller.busy()).toBe(false)
})

test("concurrent checks share one request", async () => {
  let calls = 0
  let release = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const controller = createUpdateController(
    fakeClient({
      checkForUpdate: async () => {
        calls += 1
        await gate
        return available
      },
    }),
  )

  const first = controller.check()
  const second = controller.check()
  release()
  await Promise.all([first, second])

  expect(calls).toBe(1)
  expect(controller.phase()).toBe("available")
})
