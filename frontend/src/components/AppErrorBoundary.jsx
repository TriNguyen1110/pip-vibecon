import { Component } from 'react'

// Last line of defense: a render error shows a calm retry, never a blank page.
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error) {
    console.error('[Pip] render error:', error)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="state" role="alert" style={{ minHeight: '80dvh', justifyContent: 'center' }}>
        <div className="state__face" aria-hidden>
          😵
        </div>
        <p className="card-title">Pip lost the thread.</p>
        <p className="muted small">Your work is saved. Reload to pick up where you left off.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn btn--primary" onClick={() => window.location.reload()}>
            Reload
          </button>
          <a className="btn btn--ghost" href="/">
            Start page
          </a>
        </div>
      </div>
    )
  }
}
