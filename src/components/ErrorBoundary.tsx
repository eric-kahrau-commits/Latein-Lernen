import { Component, type ErrorInfo, type ReactNode } from 'react'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-card">
            <h1 className="error-boundary-title">Etwas ist schiefgelaufen</h1>
            <p className="error-boundary-text">
              Ein unerwarteter Fehler ist aufgetreten. Du kannst die Seite neu laden und es erneut versuchen.
            </p>
            <button type="button" className="error-boundary-btn" onClick={this.handleReload}>
              Seite neu laden
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
