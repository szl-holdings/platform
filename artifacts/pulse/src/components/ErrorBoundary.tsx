import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo): void {
  }

  override render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          style={{
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#e05050',
              marginBottom: 4,
            }}
          >
            Error — {this.props.name ?? 'Component'}
          </div>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--pulse-text)',
              fontFamily: 'monospace',
              background: 'rgba(224,80,80,0.06)',
              border: '1px solid rgba(224,80,80,0.2)',
              borderRadius: 6,
              padding: '10px 14px',
              margin: 0,
            }}
          >
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              alignSelf: 'flex-start',
              marginTop: 8,
              padding: '6px 14px',
              borderRadius: 5,
              background: 'var(--pulse-card)',
              border: '1px solid var(--pulse-border)',
              color: 'var(--pulse-text-dim)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
