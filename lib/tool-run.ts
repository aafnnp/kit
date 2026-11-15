import { cleanup, effect, signal } from "nsh"

export function messageOf(failure: unknown): string {
  return failure instanceof Error ? failure.message : String(failure)
}

export interface ToolRun<T> {
  output: () => T
  error: () => string
  run: (compute: () => T) => void
  reset: () => void
}

/** Keeps a tool's output, error and reset logic in one place. */
export function createToolRun<T>(initial: T): ToolRun<T> {
  const output = signal(initial)
  const error = signal("")

  const reset = () => {
    output.set(initial)
    error.set("")
  }

  const run = (compute: () => T) => {
    try {
      output.set(compute())
      error.set("")
    } catch (failure) {
      output.set(initial)
      error.set(messageOf(failure))
    }
  }

  return { output, error, run, reset }
}

export interface LiveRunOptions<T> {
  initial: T
  compute: () => T
  inputs: Array<() => unknown>
  delay?: number
}

/**
 * Recomputes after the inputs settle, so editing a field updates the result
 * without leaving a stale answer on screen.
 */
export function createLiveRun<T>(options: LiveRunOptions<T>): ToolRun<T> {
  const run = createToolRun(options.initial)
  const delay = options.delay ?? 150
  let timer: number | undefined

  cleanup(() => {
    if (timer !== undefined) clearTimeout(timer)
  })

  effect(() => {
    for (const input of options.inputs) input()
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => run.run(options.compute), delay)
  })

  return run
}

/**
 * Clears a previous result whenever one of `inputs` changes, so an old answer
 * never sits next to edited input. Call from a component body.
 */
export function resetOnChange(reset: () => void, ...inputs: Array<() => unknown>): void {
  effect(() => {
    for (const input of inputs) input()
    reset()
  })
}
