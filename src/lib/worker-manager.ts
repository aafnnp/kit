/**
 * Web Worker Manager for Parallel Processing
 * 通用的Web Worker管理器，支持多文件并行处理
 */

export interface WorkerTask<T = any, R = any> {
  id: string
  type: string
  data: T
  priority?: 'high' | 'medium' | 'low'
  onProgress?: (progress: number, message?: string) => void
  onComplete?: (result: R) => void
  onError?: (error: Error) => void
}

export interface WorkerConfig {
  maxWorkers?: number
  workerScript?: string
  timeout?: number
}

export class WorkerManager {
  private workers: Worker[] = []
  private taskQueue: WorkerTask[] = []
  private activeTasks: Map<string, WorkerTask> = new Map()
  private taskWorkerIndex: Map<string, number> = new Map()
  private workerBusy: boolean[] = []
  private config: Required<WorkerConfig>

  constructor(config: WorkerConfig = {}) {
    this.config = {
      maxWorkers: config.maxWorkers || Math.min(navigator.hardwareConcurrency || 4, 8),
      workerScript: config.workerScript || '/workers/processing-worker.js',
      timeout: config.timeout || 300000, // 5 minutes
    }

    this.initializeWorkers()
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.config.maxWorkers; i++) {
      try {
        const worker = new Worker(this.config.workerScript)
        worker.onmessage = (event) => this.handleWorkerMessage(i, event)
        worker.onerror = (error) => this.handleWorkerError(i, error)

        this.workers.push(worker)
        this.workerBusy.push(false)
      } catch (error) {
        console.warn(`Failed to create worker ${i}:`, error)
      }
    }
  }

  private handleWorkerMessage(workerIndex: number, event: MessageEvent): void {
    const { taskId, type, data, result, progress, error, message } = event.data
    const task = this.activeTasks.get(taskId)

    if (!task) return

    switch (type) {
      case 'progress':
        task.onProgress?.(progress, message)
        break

      case 'complete':
        this.workerBusy[workerIndex] = false
        this.activeTasks.delete(taskId)
        this.taskWorkerIndex.delete(taskId)
        // 兼容不同 worker 的完成消息负载字段（data 或 result）
        task.onComplete?.(result !== undefined ? result : data)
        this.processNextTask()
        break

      case 'error':
        this.workerBusy[workerIndex] = false
        this.activeTasks.delete(taskId)
        this.taskWorkerIndex.delete(taskId)
        task.onError?.(new Error(error))
        this.processNextTask()
        break
    }
  }

  private handleWorkerError(workerIndex: number, error: ErrorEvent): void {
    console.error(`Worker ${workerIndex} error:`, error)
    this.workerBusy[workerIndex] = false

    // Find and fail any active task on this worker
    for (const [taskId, task] of this.activeTasks.entries()) {
      if (this.getWorkerForTask(taskId) === workerIndex) {
        this.activeTasks.delete(taskId)
        this.taskWorkerIndex.delete(taskId)
        task.onError?.(new Error(`Worker error: ${error.message}`))
        break
      }
    }

    this.processNextTask()
  }

  private getWorkerForTask(taskId: string): number {
    // Simple hash-based assignment for now
    return Math.abs(taskId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % this.workers.length
  }

  private getAvailableWorker(): number {
    return this.workerBusy.findIndex((busy) => !busy)
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0) return

    const availableWorkerIndex = this.getAvailableWorker()
    if (availableWorkerIndex === -1) return

    // Sort by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2)
    })

    const task = this.taskQueue.shift()!
    this.workerBusy[availableWorkerIndex] = true
    this.activeTasks.set(task.id, task)
    this.taskWorkerIndex.set(task.id, availableWorkerIndex)

    // Set timeout for task
    setTimeout(() => {
      if (this.activeTasks.has(task.id)) {
        this.activeTasks.delete(task.id)
        this.workerBusy[availableWorkerIndex] = false
        task.onError?.(new Error('Task timeout'))
        this.processNextTask()
      }
    }, this.config.timeout)

    // Send task to worker
    this.workers[availableWorkerIndex].postMessage({
      taskId: task.id,
      type: task.type,
      data: task.data,
    })
  }

  /**
   * Add a task to the processing queue
   */
  addTask<T, R>(task: WorkerTask<T, R>): Promise<R> {
    return new Promise((resolve, reject) => {
      const enhancedTask: WorkerTask<T, R> = {
        ...task,
        onComplete: (result: R) => {
          task.onComplete?.(result)
          resolve(result)
        },
        onError: (error: Error) => {
          task.onError?.(error)
          reject(error)
        },
      }

      this.taskQueue.push(enhancedTask)
      this.processNextTask()
    })
  }

  /**
   * Process multiple tasks in parallel
   */
  async processBatch<T, R>(tasks: Omit<WorkerTask<T, R>, 'id'>[]): Promise<R[]> {
    const taskPromises = tasks.map((task, index) =>
      this.addTask({
        ...task,
        id: `batch_${Date.now()}_${index}`,
      })
    )

    return Promise.all(taskPromises)
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queueLength: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      availableWorkers: this.workerBusy.filter((busy) => !busy).length,
      totalWorkers: this.workers.length,
    }
  }

  /**
   * Clear all pending tasks
   */
  clearQueue(): void {
    this.taskQueue.length = 0
  }

  /**
   * Terminate all workers and clean up
   */
  terminate(): void {
    this.workers.forEach((worker) => worker.terminate())
    this.workers.length = 0
    this.workerBusy.length = 0
    this.taskQueue.length = 0
    this.activeTasks.clear()
    this.taskWorkerIndex.clear()
  }

  /**
   * Cancel a specific task by id
   */
  cancelTask(taskId: string): void {
    // Remove from pending queue if not yet started
    const pendingIndex = this.taskQueue.findIndex((t) => t.id === taskId)
    if (pendingIndex !== -1) {
      this.taskQueue.splice(pendingIndex, 1)
      return
    }

    // If active, mark worker as free and notify worker
    const task = this.activeTasks.get(taskId)
    if (!task) return

    const workerIndex = this.taskWorkerIndex.get(taskId)
    this.activeTasks.delete(taskId)
    this.taskWorkerIndex.delete(taskId)

    if (typeof workerIndex === 'number') {
      this.workerBusy[workerIndex] = false
      try {
        this.workers[workerIndex].postMessage({ type: 'cancel', taskId })
      } catch {
        // ignore posting cancel errors
      }
    }

    this.processNextTask()
  }
}

// Singleton instance for global use
let globalWorkerManager: WorkerManager | null = null

export function getWorkerManager(config?: WorkerConfig): WorkerManager {
  if (!globalWorkerManager) {
    globalWorkerManager = new WorkerManager(config)
  }
  return globalWorkerManager
}

export function terminateWorkerManager(): void {
  if (globalWorkerManager) {
    globalWorkerManager.terminate()
    globalWorkerManager = null
  }
}
