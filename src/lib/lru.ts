export class LruCache<K, V> {
  private map: Map<K, V>
  private capacity: number

  constructor(capacity: number) {
    this.capacity = Math.max(1, capacity)
    this.map = new Map<K, V>()
  }

  get size() {
    return this.map.size
  }

  has(key: K) {
    return this.map.has(key)
  }

  get(key: K): V | undefined {
    const value = this.map.get(key)
    if (value !== undefined) {
      // 刷新最近使用
      this.map.delete(key)
      this.map.set(key, value)
    }
    return value
  }

  set(key: K, value: V) {
    if (this.map.has(key)) {
      this.map.delete(key)
    }
    this.map.set(key, value)
    if (this.map.size > this.capacity) {
      // 删除最久未使用
      const it = this.map.keys().next()
      if (!it.done) {
        this.map.delete(it.value as K)
      }
    }
  }

  delete(key: K) {
    return this.map.delete(key)
  }

  clear() {
    this.map.clear()
  }
}
