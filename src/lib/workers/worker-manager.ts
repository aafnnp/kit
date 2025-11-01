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

import { perfBus } from '@/lib/performance'
import { logger } from '@/lib/data'

export interface WorkerConfig {
  maxWorkers?: number
  workerScript?: string
  timeout?: number
  idleTerminateMs?: number
  backpressureQueueMax?: number
  circuitBreakerThreshold?: number // 熔断阈值：连续失败次数
  circuitBreakerTimeout?: number // 熔断恢复时间（毫秒）
  backpressureThreshold?: number // Backpressure 阈值：队列长度
}

interface WorkerIdentifier {
  scriptPath: string
  poolIndex: number
}

export class WorkerManager {
  private workers: Worker[] = []
  private taskQueue: WorkerTask[] = []
  private activeTasks: Map<string, WorkerTask> = new Map()
  private taskWorkerIndex: Map<string, number> = new Map()
  private taskWorkerInfo: Map<string, WorkerIdentifier> = new Map()
  private workerBusy: boolean[] = []
  private config: Required<WorkerConfig>
  private taskStartTime: Map<string, number> = new Map()
  private workerLastUsed: number[] = []
  private failureCountByScript: Map<string, number> = new Map()
  // Worker 复用：按脚本路径分组，复用相同脚本的 Worker
  private workerPoolByScript: Map<string, Worker[]> = new Map()
  private workerBusyByScript: Map<string, boolean[]> = new Map()
  private workerLastUsedByScript: Map<string, number[]> = new Map()
  // 熔断器：记录每个脚本的熔断状态
  private circuitBreakerState: Map<string, { isOpen: boolean; failureCount: number; lastFailureTime: number }> =
    new Map()
  // Backpressure 状态
  private backpressureActive: boolean = false
  private frameTimeMonitor: { lastFrameTime: number; frameTimeHistory: number[] } = {
    lastFrameTime: performance.now(),
    frameTimeHistory: [],
  }
  private frameMonitoringId: number | null = null

  constructor(config: WorkerConfig = {}) {
    this.config = {
      maxWorkers: config.maxWorkers || Math.min(navigator.hardwareConcurrency || 4, 8),
      workerScript: config.workerScript || '/workers/processing-worker.js',
      timeout: config.timeout || 300000, // 5 minutes
      idleTerminateMs: config.idleTerminateMs ?? 60_000,
      backpressureQueueMax: config.backpressureQueueMax ?? 200,
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? 5, // 连续5次失败触发熔断
      circuitBreakerTimeout: config.circuitBreakerTimeout ?? 30_000, // 30秒后尝试恢复
      backpressureThreshold: config.backpressureThreshold ?? 50, // 队列超过50时触发
    }

    this.initializeWorkers()
    this.startFrameTimeMonitoring()
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.config.maxWorkers; i++) {
      try {
        const worker = new Worker(this.config.workerScript)
        const workerInfo: WorkerIdentifier = { scriptPath: this.config.workerScript, poolIndex: i }
        worker.onmessage = (event) => this.handleWorkerMessage(workerInfo, event)
        worker.onerror = (error) => this.handleWorkerError(workerInfo, error)

        this.workers.push(worker)
        this.workerBusy.push(false)
        this.workerLastUsed.push(Date.now())
      } catch (error) {
        console.warn(`Failed to create worker ${i}:`, error)
      }
    }
    // 定时回收空闲 worker
    setInterval(() => this.recycleIdleWorkers(), Math.min(this.config.idleTerminateMs, 30_000))
  }

  private handleWorkerMessage(workerInfo: WorkerIdentifier, event: MessageEvent): void {
    const { taskId, type, data, result, progress, error, message } = event.data
    const task = this.activeTasks.get(taskId)

    if (!task) return

    // 判断是默认池还是脚本特定池
    const isDefaultPool = workerInfo.scriptPath === this.config.workerScript

    switch (type) {
      case 'progress':
        task.onProgress?.(progress, message)
        break

      case 'complete':
        if (isDefaultPool) {
          this.workerBusy[workerInfo.poolIndex] = false
          this.workerLastUsed[workerInfo.poolIndex] = Date.now()
        } else {
          const busy = this.workerBusyByScript.get(workerInfo.scriptPath)
          const lastUsed = this.workerLastUsedByScript.get(workerInfo.scriptPath)
          if (busy && lastUsed) {
            busy[workerInfo.poolIndex] = false
            lastUsed[workerInfo.poolIndex] = Date.now()
          }
        }
        this.activeTasks.delete(taskId)
        this.taskWorkerIndex.delete(taskId)
        this.taskWorkerInfo.delete(taskId)
        // 兼容不同 worker 的完成消息负载字段（data 或 result）
        task.onComplete?.(result !== undefined ? result : data)
        // 记录成功，重置熔断器计数
        this.recordSuccess(workerInfo.scriptPath)
        {
          const start = this.taskStartTime.get(taskId)
          if (typeof start === 'number') {
            const ms = performance.now() - start
            perfBus.emit('worker_task', { id: taskId, type: task.type, ms, ts: Date.now() })
            this.taskStartTime.delete(taskId)
          }
        }
        this.processNextTask()
        break

      case 'error':
        if (isDefaultPool) {
          this.workerBusy[workerInfo.poolIndex] = false
        } else {
          const busy = this.workerBusyByScript.get(workerInfo.scriptPath)
          if (busy) {
            busy[workerInfo.poolIndex] = false
          }
        }
        this.activeTasks.delete(taskId)
        this.taskWorkerIndex.delete(taskId)
        this.taskWorkerInfo.delete(taskId)
        task.onError?.(new Error(error))
        // 记录失败并检查熔断
        this.recordFailure(workerInfo.scriptPath)
        this.processNextTask()
        break
    }
  }

  private handleWorkerError(workerInfo: WorkerIdentifier, error: ErrorEvent): void {
    const poolLabel =
      workerInfo.scriptPath === this.config.workerScript
        ? `default pool[${workerInfo.poolIndex}]`
        : `${workerInfo.scriptPath}[${workerInfo.poolIndex}]`
    console.error(`Worker ${poolLabel} error:`, error)

    // 更新 worker 状态
    const isDefaultPool = workerInfo.scriptPath === this.config.workerScript
    if (isDefaultPool) {
      this.workerBusy[workerInfo.poolIndex] = false
    } else {
      const busy = this.workerBusyByScript.get(workerInfo.scriptPath)
      if (busy) {
        busy[workerInfo.poolIndex] = false
      }
    }

    // Find and fail any active task on this worker
    for (const [taskId, task] of this.activeTasks.entries()) {
      const taskWorkerInfo = this.taskWorkerInfo.get(taskId)
      if (
        taskWorkerInfo &&
        taskWorkerInfo.scriptPath === workerInfo.scriptPath &&
        taskWorkerInfo.poolIndex === workerInfo.poolIndex
      ) {
        this.activeTasks.delete(taskId)
        this.taskWorkerIndex.delete(taskId)
        this.taskWorkerInfo.delete(taskId)
        task.onError?.(new Error(`Worker error: ${error.message}`))
        // 记录失败并检查熔断
        this.recordFailure(workerInfo.scriptPath)
        break
      }
    }

    this.processNextTask()
  }

  /**
   * 获取可用的 Worker（优先复用同脚本的 Worker）
   */
  private getAvailableWorker(scriptPath?: string): WorkerIdentifier | null {
    // 检查熔断器状态
    const targetScript = scriptPath || this.config.workerScript
    if (this.isCircuitBreakerOpen(targetScript)) {
      logger.warn(`Circuit breaker is open for ${targetScript}, rejecting task`)
      return null
    }

    // 如果指定了脚本路径，尝试复用该脚本的 Worker 池
    if (scriptPath && scriptPath !== this.config.workerScript) {
      const pool = this.getOrCreateWorkerPool(scriptPath)
      const busy = this.workerBusyByScript.get(scriptPath)

      if (pool && busy) {
        const availableIndex = busy.findIndex((b) => !b)
        if (availableIndex !== -1) {
          return { scriptPath, poolIndex: availableIndex }
        }
      }
    }

    // 使用默认 Worker 池
    const defaultIndex = this.workerBusy.findIndex((busy) => !busy)
    if (defaultIndex === -1) return null
    return { scriptPath: this.config.workerScript, poolIndex: defaultIndex }
  }

  /**
   * 获取或创建 Worker 池（复用策略）
   */
  private getOrCreateWorkerPool(scriptPath: string): Worker[] {
    if (!this.workerPoolByScript.has(scriptPath)) {
      const pool: Worker[] = []
      const busy: boolean[] = []
      const lastUsed: number[] = []

      // 创建 Worker 池（最大数量为配置的 maxWorkers）
      for (let i = 0; i < Math.min(this.config.maxWorkers, 4); i++) {
        try {
          const worker = new Worker(scriptPath)
          const workerInfo: WorkerIdentifier = { scriptPath, poolIndex: i }
          worker.onmessage = (event) => this.handleWorkerMessage(workerInfo, event)
          worker.onerror = (error) => this.handleWorkerError(workerInfo, error)
          pool.push(worker)
          busy.push(false)
          lastUsed.push(Date.now())
        } catch (error) {
          console.warn(`Failed to create worker for ${scriptPath}:`, error)
        }
      }

      this.workerPoolByScript.set(scriptPath, pool)
      this.workerBusyByScript.set(scriptPath, busy)
      this.workerLastUsedByScript.set(scriptPath, lastUsed)
    }

    return this.workerPoolByScript.get(scriptPath)!
  }

  /**
   * 记录失败并检查熔断器
   */
  private recordFailure(scriptPath: string): void {
    const count = (this.failureCountByScript.get(scriptPath) || 0) + 1
    this.failureCountByScript.set(scriptPath, count)

    const state = this.circuitBreakerState.get(scriptPath) || {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
    }

    state.failureCount++
    state.lastFailureTime = Date.now()

    // 检查是否达到熔断阈值
    if (state.failureCount >= this.config.circuitBreakerThreshold) {
      state.isOpen = true
      logger.warn(`Circuit breaker opened for ${scriptPath} after ${state.failureCount} failures`)
    }

    this.circuitBreakerState.set(scriptPath, state)
  }

  /**
   * 检查熔断器状态
   */
  private isCircuitBreakerOpen(scriptPath: string): boolean {
    const state = this.circuitBreakerState.get(scriptPath)
    if (!state || !state.isOpen) return false

    // 检查是否超过恢复时间
    const now = Date.now()
    if (now - state.lastFailureTime > this.config.circuitBreakerTimeout) {
      // 尝试恢复：重置状态
      state.isOpen = false
      state.failureCount = 0
      this.circuitBreakerState.set(scriptPath, state)
      logger.info(`Circuit breaker closed for ${scriptPath} after recovery timeout`)
      return false
    }

    return true
  }

  /**
   * 记录成功，重置熔断器计数
   */
  private recordSuccess(scriptPath: string): void {
    const state = this.circuitBreakerState.get(scriptPath)
    if (state) {
      state.failureCount = 0
      this.circuitBreakerState.set(scriptPath, state)
    }
    this.failureCountByScript.set(scriptPath, 0)
  }

  /**
   * 监控主线程帧时长
   */
  private startFrameTimeMonitoring(): void {
    if (typeof window === 'undefined') return

    const checkFrameTime = () => {
      const now = performance.now()
      const frameTime = now - this.frameTimeMonitor.lastFrameTime
      this.frameTimeMonitor.lastFrameTime = now

      this.frameTimeMonitor.frameTimeHistory.push(frameTime)
      // 只保留最近100帧的数据
      if (this.frameTimeMonitor.frameTimeHistory.length > 100) {
        this.frameTimeMonitor.frameTimeHistory.shift()
      }

      // 计算平均帧时长
      const avgFrameTime =
        this.frameTimeMonitor.frameTimeHistory.reduce((a, b) => a + b, 0) /
        this.frameTimeMonitor.frameTimeHistory.length

      // 如果平均帧时长超过16.67ms（60fps），触发 Backpressure
      this.backpressureActive = avgFrameTime > 16.67

      // 保存 requestAnimationFrame ID 以便后续取消
      this.frameMonitoringId = requestAnimationFrame(checkFrameTime)
    }

    this.frameMonitoringId = requestAnimationFrame(checkFrameTime)
  }

  /**
   * 停止帧时长监控
   */
  private stopFrameTimeMonitoring(): void {
    if (this.frameMonitoringId !== null) {
      cancelAnimationFrame(this.frameMonitoringId)
      this.frameMonitoringId = null
    }
  }

  /**
   * 检查 Backpressure 状态
   */
  private shouldApplyBackpressure(): boolean {
    // 队列长度超过阈值
    if (this.taskQueue.length > this.config.backpressureThreshold) {
      return true
    }

    // 主线程帧时长过高
    if (this.backpressureActive) {
      return true
    }

    return false
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0) return

    // Backpressure：检查是否需要应用背压
    if (this.shouldApplyBackpressure()) {
      // 如果队列超过最大限制，丢弃最低优先级任务
      if (this.taskQueue.length > this.config.backpressureQueueMax) {
        const dropCount = Math.floor(this.taskQueue.length * 0.1)
        if (dropCount > 0) {
          this.taskQueue.splice(-dropCount, dropCount)
          logger.warn(`Backpressure: Dropped ${dropCount} low-priority tasks`)
        }
      } else {
        // 队列未超限但帧时长高，延迟处理
        setTimeout(() => this.processNextTask(), 100)
        return
      }
    }

    const availableWorkerInfo = this.getAvailableWorker()
    if (!availableWorkerInfo) return

    // Sort by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2)
    })

    const task = this.taskQueue.shift()!
    const isDefaultPool = availableWorkerInfo.scriptPath === this.config.workerScript

    // 更新 worker 状态
    if (isDefaultPool) {
      this.workerBusy[availableWorkerInfo.poolIndex] = true
    } else {
      const busy = this.workerBusyByScript.get(availableWorkerInfo.scriptPath)
      if (busy) {
        busy[availableWorkerInfo.poolIndex] = true
      }
    }

    this.activeTasks.set(task.id, task)
    this.taskWorkerIndex.set(task.id, availableWorkerInfo.poolIndex)
    this.taskWorkerInfo.set(task.id, availableWorkerInfo)

    // Set timeout for task
    setTimeout(() => {
      if (this.activeTasks.has(task.id)) {
        this.activeTasks.delete(task.id)
        this.taskWorkerIndex.delete(task.id)
        this.taskWorkerInfo.delete(task.id)
        // 更新 worker 状态
        if (isDefaultPool) {
          this.workerBusy[availableWorkerInfo.poolIndex] = false
        } else {
          const busy = this.workerBusyByScript.get(availableWorkerInfo.scriptPath)
          if (busy) {
            busy[availableWorkerInfo.poolIndex] = false
          }
        }
        task.onError?.(new Error('Task timeout'))
        this.processNextTask()
      }
    }, this.config.timeout)

    // Send task to worker
    this.taskStartTime.set(task.id, performance.now())
    const worker = isDefaultPool
      ? this.workers[availableWorkerInfo.poolIndex]
      : this.workerPoolByScript.get(availableWorkerInfo.scriptPath)?.[availableWorkerInfo.poolIndex]

    if (worker) {
      worker.postMessage({
        taskId: task.id,
        type: task.type,
        data: task.data,
      })
    } else {
      task.onError?.(new Error('Worker not available'))
      this.activeTasks.delete(task.id)
      this.taskWorkerIndex.delete(task.id)
      this.taskWorkerInfo.delete(task.id)
    }
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
    // 停止帧时长监控
    this.stopFrameTimeMonitoring()

    this.workers.forEach((worker) => worker.terminate())
    this.workers.length = 0
    this.workerBusy.length = 0
    this.taskQueue.length = 0
    this.activeTasks.clear()
    this.taskWorkerIndex.clear()
    this.taskWorkerInfo.clear()
    this.workerLastUsed.length = 0
    // 终止所有脚本特定的 worker 池
    for (const pool of this.workerPoolByScript.values()) {
      pool.forEach((worker) => worker.terminate())
    }
    this.workerPoolByScript.clear()
    this.workerBusyByScript.clear()
    this.workerLastUsedByScript.clear()
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

    const workerInfo = this.taskWorkerInfo.get(taskId)
    this.activeTasks.delete(taskId)
    this.taskWorkerIndex.delete(taskId)
    this.taskWorkerInfo.delete(taskId)

    if (workerInfo) {
      const isDefaultPool = workerInfo.scriptPath === this.config.workerScript
      if (isDefaultPool) {
        this.workerBusy[workerInfo.poolIndex] = false
        try {
          this.workers[workerInfo.poolIndex].postMessage({ type: 'cancel', taskId })
        } catch {
          // ignore posting cancel errors
        }
      } else {
        const busy = this.workerBusyByScript.get(workerInfo.scriptPath)
        if (busy) {
          busy[workerInfo.poolIndex] = false
        }
        try {
          const pool = this.workerPoolByScript.get(workerInfo.scriptPath)
          const worker = pool?.[workerInfo.poolIndex]
          if (worker) {
            worker.postMessage({ type: 'cancel', taskId })
          }
        } catch {
          // ignore posting cancel errors
        }
      }
    }

    this.processNextTask()
  }

  private recycleIdleWorkers(): void {
    const now = Date.now()
    // 回收默认池的空闲 worker
    for (let i = 0; i < this.workers.length; i++) {
      if (this.workerBusy[i]) continue
      const lastUsed = this.workerLastUsed[i] || 0
      if (now - lastUsed > this.config.idleTerminateMs) {
        try {
          this.workers[i].terminate()
        } catch {}
        // 立即用新的实例替换，保持池大小
        try {
          const worker = new Worker(this.config.workerScript)
          const workerInfo: WorkerIdentifier = { scriptPath: this.config.workerScript, poolIndex: i }
          worker.onmessage = (event) => this.handleWorkerMessage(workerInfo, event)
          worker.onerror = (error) => this.handleWorkerError(workerInfo, error)
          this.workers[i] = worker
          this.workerBusy[i] = false
          this.workerLastUsed[i] = now
        } catch (e) {
          // 如果重建失败则标记为忙，避免反复尝试
          this.workerBusy[i] = true
        }
      }
    }
    // 回收脚本特定池的空闲 worker
    for (const [scriptPath, pool] of this.workerPoolByScript.entries()) {
      const busy = this.workerBusyByScript.get(scriptPath)
      const lastUsed = this.workerLastUsedByScript.get(scriptPath)
      if (!busy || !lastUsed) continue

      for (let i = 0; i < pool.length; i++) {
        if (busy[i]) continue
        const lastUsedTime = lastUsed[i] || 0
        if (now - lastUsedTime > this.config.idleTerminateMs) {
          try {
            pool[i].terminate()
          } catch {}
          // 立即用新的实例替换，保持池大小
          try {
            const worker = new Worker(scriptPath)
            const workerInfo: WorkerIdentifier = { scriptPath, poolIndex: i }
            worker.onmessage = (event) => this.handleWorkerMessage(workerInfo, event)
            worker.onerror = (error) => this.handleWorkerError(workerInfo, error)
            pool[i] = worker
            busy[i] = false
            lastUsed[i] = now
          } catch (e) {
            // 如果重建失败则标记为忙，避免反复尝试
            busy[i] = true
          }
        }
      }
    }
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
