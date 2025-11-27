import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import fs from "fs"
import { getToolChunkName } from "./src/lib/data/tool-chunk-rules"
// 可选体积可视化插件，按需加载避免类型报错
let visualizer: any
try {
  // @ts-ignore
  visualizer = (await import("rollup-plugin-visualizer")).visualizer
} catch {}

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"))

export default defineConfig(() => ({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react({
      // 优化JSX运行时
      jsxRuntime: "automatic",
    }),
    tailwindcss(),
  ],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 启用代码分割优化
    rollupOptions: {
      // 外部化 FFmpeg 相关模块，避免打包到构建产物中
      external: ["@ffmpeg/ffmpeg", "@ffmpeg/core", "@sentry/react"],
      plugins:
        visualizer && process.env.ANALYZE
          ? [
              visualizer({
                filename: "stats.html",
                title: "Bundle Visualizer",
                template: "treemap",
                gzipSize: true,
                brotliSize: true,
                open: false,
              }),
            ]
          : [],
      output: {
        // 手动分割代码块 - 优化版本
        manualChunks: (id) => {
          // 将 node_modules 中的依赖分离
          if (id.includes("node_modules")) {
            // React 核心
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor"
            }
            // UI 库 - 进一步拆分
            if (id.includes("@radix-ui")) {
              return "ui-vendor"
            }
            if (id.includes("lucide-react")) {
              return "ui-utils-vendor"
            }
            if (id.includes("motion")) {
              return "motion-vendor"
            }
            // 路由和状态管理
            if (id.includes("@tanstack")) {
              return "tanstack-vendor"
            }
            // 国际化库
            if (id.includes("react-i18next") || id.includes("i18next")) {
              return "i18n-vendor"
            }
            // 工具库
            if (id.includes("clsx") || id.includes("tailwind-merge") || id.includes("class-variance-authority")) {
              return "utils-vendor"
            }
            // 验证库
            if (id.includes("zod")) {
              return "zod-vendor"
            }
            // 通知库
            if (id.includes("sonner")) {
              return "sonner-vendor"
            }
            // 主题库
            if (id.includes("next-themes")) {
              return "theme-vendor"
            }
            // 抽屉组件
            if (id.includes("vaul")) {
              return "vaul-vendor"
            }
            // 性能监控
            if (id.includes("web-vitals")) {
              return "vitals-vendor"
            }
            // 图标库
            if (id.includes("@tabler/icons-react")) {
              return "icons-vendor"
            }
            // DnD 库独立分包
            if (id.includes("@dnd-kit")) {
              return "dnd-vendor"
            }
            // 重型库独立分包，避免首屏拖拽
            if (id.includes("mermaid")) {
              return "mermaid-chunk"
            }
            if (id.includes("xlsx")) {
              return "xlsx-chunk"
            }
            if (id.includes("pdf-lib")) {
              return "pdf-chunk"
            }
            // 媒体处理库
            if (id.includes("jsbarcode")) {
              return "barcode-vendor"
            }
            if (id.includes("qrcode")) {
              return "qrcode-vendor"
            }
            if (id.includes("gifuct-js") || id.includes("fflate")) {
              return "media-vendor"
            }
            // 其他第三方库 - 按大小分组
            // 小型工具库合并到 utils-vendor
            if (id.includes("nanoid") || id.includes("date-fns") || id.includes("lodash-es") || id.includes("ramda")) {
              return "utils-vendor"
            }
            // 其他第三方库
            return "vendor"
          }

          // 工具组件按分类分包
          if (id.includes("/components/tools/")) {
            const toolName = id.split("/components/tools/")[1]?.split("/")[0]
            if (toolName) {
              return getToolChunkName(toolName)
            }
          }
        },
        // 优化chunk文件名
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId && facadeModuleId.includes("/components/tools/")) {
            return `tools/[name]-[hash].js`
          }
          if (chunkInfo.name?.startsWith("tools-")) {
            return `tools/[name]-[hash].js`
          }
          return "chunks/[name]-[hash].js"
        },
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // 启用压缩
    minify: "terser",
    terserOptions: {
      compress: {
        // 移除console.log
        drop_console: true,
        // 移除debugger
        drop_debugger: true,
        // 移除未使用的代码
        dead_code: true,
        // 移除未使用的函数参数和变量
        unused: true,
        // 内联单次使用的变量
        collapse_vars: true,
        // 优化条件表达式
        conditionals: true,
        // 优化循环
        loops: true,
        // 优化函数调用
        pure_funcs: ["console.log", "console.info", "console.debug"],
        // 多次压缩以获得更好的效果
        passes: 2,
      },
      format: {
        // 移除注释
        comments: false,
      },
    },
    // 设置chunk大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 启用源码映射（仅在开发环境）
    sourcemap: process.env.NODE_ENV === "development",
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-router",
      "lucide-react",
      "motion",
      "react-i18next",
      "i18next",
      "clsx",
      "tailwind-merge",
    ],
  },
  // 启用esbuild优化
  esbuild: {
    // 移除生产环境的console和debugger
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
}))
