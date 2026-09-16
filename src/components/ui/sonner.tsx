import { Toaster as Sonner, ToasterProps } from "sonner"
import { useTheme } from "@/lib/theme"

const Toaster = ({ ...props }: ToasterProps) => {
  // 使用应用自身的主题 store（next-themes 的 Provider 从未挂载，
  // 之前这里始终解析为 "system"，用户显式选择深浅色时 toast 配色不会跟随）
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
