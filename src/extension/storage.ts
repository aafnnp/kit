// Chrome Storage API 适配层
// 替换原有的 localStorage 和 IndexedDB 实现

export interface StorageAdapter {
  get(key: string): Promise<any>
  set(key: string, value: any): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  getAll(): Promise<Record<string, any>>
}

// Chrome Extension Storage 实现
class ChromeStorageAdapter implements StorageAdapter {
  constructor(private area: 'local' | 'sync' = 'local') {}

  async get(key: string): Promise<any> {
    try {
      const result = await chrome.storage[this.area].get(key)
      return result[key]
    } catch (error) {
      console.error('Chrome storage get error:', error)
      return null
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      await chrome.storage[this.area].set({ [key]: value })
    } catch (error) {
      console.error('Chrome storage set error:', error)
      throw error
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await chrome.storage[this.area].remove(key)
    } catch (error) {
      console.error('Chrome storage remove error:', error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      await chrome.storage[this.area].clear()
    } catch (error) {
      console.error('Chrome storage clear error:', error)
      throw error
    }
  }

  async getAll(): Promise<Record<string, any>> {
    try {
      const result = await chrome.storage[this.area].get(null)
      return result
    } catch (error) {
      console.error('Chrome storage getAll error:', error)
      return {}
    }
  }
}

// 本地存储适配器（用于非扩展环境的降级）
class LocalStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<any> {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('LocalStorage get error:', error)
      return null
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('LocalStorage set error:', error)
      throw error
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('LocalStorage remove error:', error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('LocalStorage clear error:', error)
      throw error
    }
  }

  async getAll(): Promise<Record<string, any>> {
    try {
      const result: Record<string, any> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key)
          result[key] = value ? JSON.parse(value) : null
        }
      }
      return result
    } catch (error) {
      console.error('LocalStorage getAll error:', error)
      return {}
    }
  }
}

// 检测运行环境并选择合适的存储适配器
function createStorageAdapter(): StorageAdapter {
  // 检测是否在 Chrome 扩展环境中
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return new ChromeStorageAdapter('local')
  }

  // 降级到 localStorage
  return new LocalStorageAdapter()
}

// 导出统一的存储接口
export const storage = createStorageAdapter()

// 同步存储（用于用户配置等需要跨设备同步的数据）
export const syncStorage =
  typeof chrome !== 'undefined' && chrome.storage ? new ChromeStorageAdapter('sync') : new LocalStorageAdapter()

// 特定功能的存储管理器
export class FavoritesManager {
  private static readonly FAVORITES_KEY = 'kit_favorites'

  static async getFavorites(): Promise<string[]> {
    const favorites = await storage.get(this.FAVORITES_KEY)
    return Array.isArray(favorites) ? favorites : []
  }

  static async addFavorite(toolSlug: string): Promise<void> {
    const favorites = await this.getFavorites()
    if (!favorites.includes(toolSlug)) {
      favorites.push(toolSlug)
      await storage.set(this.FAVORITES_KEY, favorites)
    }
  }

  static async removeFavorite(toolSlug: string): Promise<void> {
    const favorites = await this.getFavorites()
    const updated = favorites.filter((slug) => slug !== toolSlug)
    await storage.set(this.FAVORITES_KEY, updated)
  }

  static async clearFavorites(): Promise<void> {
    await storage.remove(this.FAVORITES_KEY)
  }
}

export class RecentToolsManager {
  private static readonly RECENT_KEY = 'kit_recent_tools'
  private static readonly MAX_RECENT = 20

  static async getRecentTools(): Promise<string[]> {
    const recent = await storage.get(this.RECENT_KEY)
    return Array.isArray(recent) ? recent : []
  }

  static async addRecentTool(toolSlug: string): Promise<void> {
    const recent = await this.getRecentTools()

    // 移除已存在的项目
    const filtered = recent.filter((slug) => slug !== toolSlug)

    // 添加到开头
    filtered.unshift(toolSlug)

    // 限制数量
    const updated = filtered.slice(0, this.MAX_RECENT)

    await storage.set(this.RECENT_KEY, updated)
  }

  static async clearRecentTools(): Promise<void> {
    await storage.remove(this.RECENT_KEY)
  }
}

export class SettingsManager {
  private static readonly SETTINGS_KEY = 'kit_settings'

  static async getSettings(): Promise<Record<string, any>> {
    const settings = await syncStorage.get(this.SETTINGS_KEY)
    return typeof settings === 'object' && settings !== null ? settings : {}
  }

  static async updateSetting(key: string, value: any): Promise<void> {
    const settings = await this.getSettings()
    settings[key] = value
    await syncStorage.set(this.SETTINGS_KEY, settings)
  }

  static async getSetting(key: string, defaultValue: any = null): Promise<any> {
    const settings = await this.getSettings()
    return settings[key] !== undefined ? settings[key] : defaultValue
  }

  static async clearSettings(): Promise<void> {
    await syncStorage.remove(this.SETTINGS_KEY)
  }
}

// 导出便利函数
export const extensionStorage = {
  // 基础存储操作
  get: storage.get.bind(storage),
  set: storage.set.bind(storage),
  remove: storage.remove.bind(storage),
  clear: storage.clear.bind(storage),
  getAll: storage.getAll.bind(storage),

  // 特定功能管理器
  favorites: FavoritesManager,
  recentTools: RecentToolsManager,
  settings: SettingsManager,
}

// 监听存储变化（仅在扩展环境中可用）
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log('Storage changed:', changes, 'in namespace:', namespace)

    // 可以在这里添加存储变化的处理逻辑
    // 例如通知其他组件数据已更新
    window.dispatchEvent(
      new CustomEvent('kit-storage-changed', {
        detail: { changes, namespace },
      })
    )
  })
}
