import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import fs from 'fs'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

const host = process.env.TAURI_DEV_HOST

export default defineConfig( () => ({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react({
      // 优化JSX运行时
      jsxRuntime: 'automatic',
    }),
    tailwindcss(),
  ],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // 启用代码分割优化
    rollupOptions: {
      output: {
        // 手动分割代码块
        manualChunks: {
          // 将React相关库分离到单独的chunk
          'react-vendor': ['react', 'react-dom'],
          // 将路由相关库分离
          'router-vendor': ['@tanstack/react-router'],
          // 将UI组件库分离
          'ui-vendor': ['lucide-react', 'motion'],
          // 将工具库分离
          'utils-vendor': ['clsx', 'tailwind-merge'],
          // 将国际化库分离
          'i18n-vendor': ['react-i18next', 'i18next'],
        },
        // 优化chunk文件名
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId && facadeModuleId.includes('/components/tools/')) {
            // 工具组件使用特殊命名
            const toolName = facadeModuleId.split('/').pop()?.replace('.tsx', '')
            return `tools/[name]-${toolName}-[hash].js`
          }
          return 'chunks/[name]-[hash].js'
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除console.log
        drop_console: true,
        // 移除debugger
        drop_debugger: true,
        // 移除未使用的代码
        dead_code: true,
      },
    },
    // 设置chunk大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 启用源码映射（仅在开发环境）
    sourcemap: process.env.NODE_ENV === 'development',
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-router',
      'lucide-react',
      'motion',
      'react-i18next',
      'i18next',
      'clsx',
      'tailwind-merge',
    ],
    // 排除不需要预构建的依赖
    exclude: ['@tauri-apps/api'],
  },
  // 启用esbuild优化
  esbuild: {
    // 移除生产环境的console和debugger
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
}))
