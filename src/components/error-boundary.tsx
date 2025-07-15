import React from 'react'

interface ErrorBoundaryProps {
  fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode)
  children: React.ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 可以在这里上报错误日志
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary 捕获到错误:', error, errorInfo)
    }
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    const { fallback, children } = this.props
    if (error) {
      if (typeof fallback === 'function') {
        return fallback(error, this.reset)
      }
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h2>出错了</h2>
          <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error.message}</pre>
          <button onClick={this.reset} style={{ marginTop: 16 }}>
            重试
          </button>
          {fallback}
        </div>
      )
    }
    return children
  }
}
