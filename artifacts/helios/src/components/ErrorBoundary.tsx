import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Helios ErrorBoundary]', error, info);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.875rem',
            }}
          >
            <div style={{ color: '#f87171', marginBottom: 8, fontWeight: 600 }}>
              Surface error
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
              {this.state.error?.message}
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
