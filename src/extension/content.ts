// Chrome Extension Content Script (内容脚本)
// 在网页中运行，可以访问和修改页面内容

// 监听来自背景脚本的消息
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  switch (request.action) {
    case 'getPageText':
      // 获取页面文本内容
      const pageText = document.body.innerText
      sendResponse({ text: pageText })
      break

    case 'getSelectedText':
      // 获取当前选中的文本
      const selection = window.getSelection()
      const selectedText = selection ? selection.toString() : ''
      sendResponse({ text: selectedText })
      break

    case 'highlightText':
      // 高亮显示指定文本
      highlightTextInPage(request.text)
      sendResponse({ success: true })
      break

    case 'extractImages':
      // 提取页面中的图片
      const images = Array.from(document.images).map((img) => ({
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }))
      sendResponse({ images })
      break

    case 'extractLinks':
      // 提取页面中的链接
      const links = Array.from(document.links).map((link) => ({
        href: link.href,
        text: link.textContent,
        title: link.title,
      }))
      sendResponse({ links })
      break

    default:
      console.log('Unknown content script message:', request.action)
  }

  return true // 保持消息通道开放用于异步响应
})

// 高亮文本函数
function highlightTextInPage(searchText: string) {
  if (!searchText) return

  // 移除之前的高亮
  removeHighlights()

  // 创建文本节点迭代器
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)

  const textNodes: Text[] = []
  let node: Node | null

  while ((node = walker.nextNode())) {
    textNodes.push(node as Text)
  }

  // 在文本节点中查找并高亮
  textNodes.forEach((textNode) => {
    const parent = textNode.parentNode
    if (!parent || (parent as HTMLElement).tagName === 'SCRIPT' || (parent as HTMLElement).tagName === 'STYLE') {
      return
    }

    const text = textNode.textContent || ''
    const regex = new RegExp(escapeRegex(searchText), 'gi')

    if (regex.test(text)) {
      const highlightedHTML = text.replace(
        regex,
        (match) => `<mark class="kit-highlight" style="background-color: yellow; padding: 2px;">${match}</mark>`
      )

      const wrapper = document.createElement('span')
      wrapper.innerHTML = highlightedHTML
      parent.replaceChild(wrapper, textNode)
    }
  })
}

// 移除高亮
function removeHighlights() {
  const highlights = document.querySelectorAll('.kit-highlight')
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight)
      parent.normalize() // 合并相邻的文本节点
    }
  })
}

// 转义正则表达式特殊字符
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 页面加载完成后的初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript)
} else {
  initContentScript()
}

function initContentScript() {
  console.log('Kit content script loaded on:', window.location.href)

  // 可以在这里添加页面加载时的初始化逻辑
  // 比如添加快捷键监听、创建悬浮按钮等

  // 监听键盘快捷键（例如 Ctrl+K 打开工具箱）
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault()
      // 向背景脚本发送消息打开扩展
      chrome.runtime.sendMessage({ action: 'openPopup' })
    }
  })
}

// 监听页面变化（对于单页应用）
let currentUrl = window.location.href
const observer = new MutationObserver(() => {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href
    console.log('Page navigation detected:', currentUrl)
    // 页面变化时的处理逻辑
  }
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
})
