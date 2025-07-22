import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  zh: {
    translation: {
      切换语言: '切换语言',
      中文: '中文',
      英文: '英文',
      设置: '设置',
      主题: '主题',
      明亮: '明亮',
      暗黑: '暗黑',
      跟随系统: '跟随系统',
      语言: '语言',
      当前版本: '当前版本',
      检查更新: '检查更新',
      发现新版本: '发现新版本',
      正在下载更新: '正在下载更新',
      下载完成: '下载完成',
      检测到新版本: '检测到新版本',
      发布日期: '发布日期',
      更新内容: '更新内容',
      '正在下载更新包，请稍候...': '正在下载更新包，请稍候...',
      '更新包已下载完成，点击下方按钮重启应用。': '更新包已下载完成，点击下方按钮重启应用。',
      取消: '取消',
      更新: '更新',
      重启应用: '重启应用',
      没有检测到新版本: '没有检测到新版本',
      // 主题切换相关
      切换主题: '切换主题',
      浅色: '浅色',
      深色: '深色',
      系统: '系统',
      首页: '首页',
      切换到中文: '切换到中文',
      切换到英文: '切换到英文',
      // 无障碍相关
      跳转到内容: '跳转到内容',
      导航菜单: '导航菜单',
      search: {
        placeholder: '搜索工具...',
        'no-results': '未找到相关工具',
        'clear-search': '清除搜索'
      },
      favorites: {
        title: '收藏',
        add: '添加到收藏',
        remove: '从收藏中移除',
        empty: '暂无收藏的工具',
        'add-some': '点击工具卡片上的心形图标来收藏工具'
      },
      recent: {
        title: '最近使用',
        clear: '清除记录',
        empty: '暂无使用记录',
        'start-using': '开始使用工具来查看最近记录'
      },
    },
  },
  en: {
    translation: {
      切换语言: 'Switch Language',
      中文: 'Chinese',
      英文: 'English',
      设置: 'Settings',
      主题: 'Theme',
      明亮: 'Light',
      暗黑: 'Dark',
      跟随系统: 'System',
      语言: 'Language',
      当前版本: 'Current Version',
      检查更新: 'Check for Updates',
      发现新版本: 'New Version Found',
      正在下载更新: 'Downloading Update',
      下载完成: 'Download Complete',
      检测到新版本: 'New version detected',
      发布日期: 'Release Date',
      更新内容: 'Changelog',
      '正在下载更新包，请稍候...': 'Downloading update package, please wait...',
      '更新包已下载完成，点击下方按钮重启应用。': 'Update downloaded, click below to restart.',
      取消: 'Cancel',
      更新: 'Update',
      重启应用: 'Restart App',
      没有检测到新版本: 'No new version found',
      // Theme toggle related
      切换主题: 'Toggle Theme',
      浅色: 'Light',
      深色: 'Dark',
      系统: 'System',
      首页: 'Home',
      切换到中文: 'Switch to Chinese',
      切换到英文: 'Switch to English',
      // Accessibility related
      跳转到内容: 'Skip to content',
      导航菜单: 'Navigation menu',
      search: {
        placeholder: 'Search tools...',
        'no-results': 'No tools found',
        'clear-search': 'Clear search'
      },
      favorites: {
        title: 'Favorites',
        add: 'Add to favorites',
        remove: 'Remove from favorites',
        empty: 'No favorite tools',
        'add-some': 'Click the heart icon on tool cards to add favorites'
      },
      recent: {
        title: 'Recently Used',
        clear: 'Clear history',
        empty: 'No recent tools',
        'start-using': 'Start using tools to see recent history'
      },
    },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

export default i18n
