import { defineConfig } from "vitest/config"
import { WxtVitest } from "wxt/testing/vitest-plugin"

/**
 * 扩展的单元测试只覆盖纯逻辑（插件注册表、文本处理等），
 * 不引入 jsdom / Testing Library，保持依赖精简。
 *
 * WxtVitest 负责两件事：
 * 1. 提供 `fakeBrowser` 作为全局 `browser`（存储、权限等 API 在 node 下可用）
 * 2. 解析 `@/` 别名与 `#imports`
 */
export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
