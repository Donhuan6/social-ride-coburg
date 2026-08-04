import { Component, version as reactVersion, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
  componentStack: string
}

/** Zeigt Fehler lesbar an statt eines weißen Bildschirms. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, componentStack: '' }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    this.setState({ componentStack: info.componentStack ?? '' })
  }

  render() {
    if (this.state.error) {
      const details = [
        'Fehler: ' + this.state.error.message,
        'React: ' + reactVersion,
        'Browser: ' + navigator.userAgent,
        '',
        'Komponente:',
        this.state.componentStack.split('\n').filter(Boolean).slice(0, 10).join('\n'),
      ].join('\n')
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#F8F8F8', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: 640, background: '#fff', border: '1px solid #E7E7E7', borderRadius: 18, padding: 32 }}>
            <p style={{ fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: '#F5C400', margin: 0 }}>Social Ride Coburg</p>
            <h1 style={{ fontSize: 22, margin: '8px 0 12px', color: '#111' }}>Da ist etwas schiefgelaufen</h1>
            <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>
              Die App konnte nicht geladen werden. Lade die Seite neu – falls der Fehler bleibt,
              schicke diese Meldung an das Orga-Team:
            </p>
            <pre style={{ background: '#F8F8F8', border: '1px solid #E7E7E7', borderRadius: 12, padding: 12, fontSize: 11, whiteSpace: 'pre-wrap', color: '#111', maxHeight: 260, overflow: 'auto' }}>
              {details}
            </pre>
            <button
              onClick={() => location.reload()}
              style={{ background: '#111', color: '#fff', border: 0, borderRadius: 999, padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}
            >
              Seite neu laden
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
