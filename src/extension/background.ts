// Chrome Extension Service Worker (背景脚本)

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Kit extension installed:', details.reason)

  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'kit-tools',
    title: 'Kit 工具箱',
    contexts: ['page', 'selection', 'image', 'link'],
  })

  // 子菜单 - 常用工具
  chrome.contextMenus.create({
    id: 'kit-text-tools',
    parentId: 'kit-tools',
    title: '文本工具',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'kit-word-count',
    parentId: 'kit-text-tools',
    title: '字数统计',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'kit-case-convert',
    parentId: 'kit-text-tools',
    title: '大小写转换',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'kit-image-tools',
    parentId: 'kit-tools',
    title: '图片工具',
    contexts: ['image'],
  })

  chrome.contextMenus.create({
    id: 'kit-color-picker',
    parentId: 'kit-tools',
    title: '颜色工具',
    contexts: ['page'],
  })
})

// 右键菜单点击处理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return

  switch (info.menuItemId) {
    case 'kit-word-count':
      if (info.selectionText) {
        // 打开弹窗并导航到字数统计工具
        chrome.action.openPopup()
        // 可以通过 chrome.storage 传递选中的文本
        chrome.storage.local.set({
          selectedText: info.selectionText,
          targetTool: 'word-count',
        })
      }
      break

    case 'kit-case-convert':
      if (info.selectionText) {
        chrome.action.openPopup()
        chrome.storage.local.set({
          selectedText: info.selectionText,
          targetTool: 'char-case',
        })
      }
      break

    case 'kit-color-picker':
      chrome.action.openPopup()
      chrome.storage.local.set({
        targetTool: 'color-picker',
      })
      break

    default:
      // 打开主界面
      chrome.action.openPopup()
  }
})

// 扩展图标点击处理
chrome.action.onClicked.addListener((tab) => {
  // 这个事件在有 popup 时不会触发，但可以用于其他逻辑
  console.log('Extension icon clicked', tab.url)
})

// 监听来自内容脚本或弹窗的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSelectedText':
      // 获取存储的选中文本
      chrome.storage.local.get(['selectedText', 'targetTool'], (result) => {
        sendResponse(result)
        // 清除临时数据
        chrome.storage.local.remove(['selectedText', 'targetTool'])
      })
      return true // 保持消息通道开放用于异步响应

    case 'openTab':
      // 在新标签页中打开 URL
      chrome.tabs.create({ url: request.url })
      break

    case 'copyToClipboard':
      // 复制文本到剪贴板（需要在 manifest 中添加 clipboardWrite 权限）
      navigator.clipboard
        .writeText(request.text)
        .then(() => {
          sendResponse({ success: true })
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message })
        })
      return true

    default:
      console.log('Unknown message action:', request.action)
  }
})

// 扩展更新处理
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log('Extension update available:', details.version)
  // 可以显示通知提醒用户更新
})

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked, opening Kit in new tab')

  // 在新标签页中打开Kit工具箱
  chrome.tabs.create({
    url: 'https://kit.manon.icu',
    active: true, // 立即切换到新标签页
  })
})

// 扩展启动时的初始化
chrome.runtime.onStartup.addListener(() => {
  console.log('Kit extension started')
})
