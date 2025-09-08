import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import fs from 'fs'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

export default defineConfig(() => ({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react({
      jsxRuntime: 'automatic',
    }),
    tailwindcss(),
  ],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    // 添加扩展环境标识
    'import.meta.env.VITE_IS_EXTENSION': JSON.stringify(true),
  },
  build: {
    outDir: 'dist-extension',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // 扩展主要入口点（移除popup，使用新标签页模式）
        background: path.resolve(__dirname, 'src/extension/background.ts'),
        // 可选的内容脚本
        content: path.resolve(__dirname, 'src/extension/content.ts'),
      },
      output: {
        // 为扩展优化的输出配置
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js'
          }
          if (chunkInfo.name === 'content') {
            return 'content.js'
          }
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash].css'
          }
          return 'assets/[name]-[hash].[ext]'
        },
        // 手动分割适合扩展的代码块
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['@tanstack/react-router'],
          'ui-vendor': ['lucide-react', 'motion'],
          'utils-vendor': ['clsx', 'tailwind-merge'],
        },
      },
    },
    // 针对扩展环境的优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        dead_code: true,
      },
    },
    // 减小包体积警告阈值
    chunkSizeWarningLimit: 500,
    sourcemap: false, // 扩展不需要 source map
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 为扩展环境优化依赖预构建
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
    // 排除浏览器扩展不兼容的依赖
    exclude: ['@tauri-apps/api'],
  },
  // 确保适合扩展的构建环境
  esbuild: {
    drop: ['console', 'debugger'],
  },
  // 扩展特定的公共路径
  base: '/',
}))
