import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './locales'

const router = createRouter({
  routeTree,
  context: {
    queryClient: undefined!,
  },
})
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分钟内视为新鲜，降低重复请求
      gcTime: 30 * 60 * 1000, // 30 分钟缓存回收
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ queryClient }} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
)

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
