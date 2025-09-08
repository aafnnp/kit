import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from '../routeTree.gen'
import '../locales'
import '../App.css'

// 为扩展环境创建内存路由
const memoryHistory = createMemoryHistory({
  initialEntries: ['/'],
})

const router = createRouter({
  routeTree,
  history: memoryHistory,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 扩展环境下的查询配置
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 10 * 60 * 1000, // 10分钟
    },
  },
})

// 扩展环境检测
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
  // 在扩展环境中运行
  console.log('Kit extension loaded')
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)
