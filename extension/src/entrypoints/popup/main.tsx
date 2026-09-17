import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/assets/theme.css"
import "@/assets/popup.css"
import { activateEnabledPlugins } from "@/plugins/runtime"
import App from "./App"

const container = document.getElementById("root")

if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// 插件生命周期：popup 打开时激活已启用插件，关闭时统一清理
void activateEnabledPlugins().then((dispose) => {
  globalThis.addEventListener("pagehide", dispose, { once: true })
})
