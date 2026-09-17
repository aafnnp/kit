import { Component, type ErrorInfo, type ReactNode } from "react"
import { tt } from "@/lib/i18n"
import { Button } from "./ui"

interface Props {
  children: ReactNode
  /** 出错区域的标题，便于定位是哪个插件崩了 */
  title?: string
  onReset?: () => void
}

interface State {
  error: Error | null
}

/**
 * 插件隔离边界：任何一个插件面板抛错都不应该让整个 popup 白屏。
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[kit:ui] 渲染出错", error, info.componentStack)
  }

  private reset = (): void => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  override render(): ReactNode {
    const { error } = this.state

    if (!error) return this.props.children

    return (
      <div className="kit-error" role="alert">
        <p className="kit-error__title">{this.props.title ?? tt("出错了", "Something went wrong")}</p>
        <pre className="kit-error__detail">{error.message}</pre>
        <Button size="sm" onClick={this.reset}>
          {tt("重试", "Retry")}
        </Button>
      </div>
    )
  }
}
