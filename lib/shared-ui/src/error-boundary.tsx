import { Component, type ReactNode, useCallback, useState } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  appName?: string;
  supportEmail?: string;
  homeHref?: string;
  accentColor?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

function UserFeedbackForm({
  errorId,
  appName,
  supportEmail,
}: {
  errorId: string | null;
  appName: string;
  supportEmail: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [description, setDescription] = useState('');

  const handleSubmit = useCallback(() => {
    if (!description.trim()) return;
    try {
      const body = JSON.stringify({
        errorId,
        app: appName,
        description: description.trim(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/observability/error-feedback', blob);
      } else {
        fetch('/api/observability/error-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* silent */
    }
    setSubmitted(true);
  }, [description, errorId, appName]);

  if (submitted) {
    return (
      <p style={{ color: '#6b8f71', fontSize: '0.85rem', marginTop: '1rem' }}>
        Thank you — your feedback has been recorded.
      </p>
    );
  }

  return (
    <div style={{ marginTop: '1.25rem', textAlign: 'left' }}>
      <label
        style={{
          display: 'block',
          color: '#94a3b8',
          fontSize: '0.8rem',
          marginBottom: '0.5rem',
          fontWeight: 500,
        }}
      >
        What were you doing when this happened?
      </label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe what you were doing..."
        rows={3}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: '#e2e8f0',
          padding: '0.75rem',
          fontSize: '0.85rem',
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
        }}
      >
        <button
          onClick={handleSubmit}
          disabled={!description.trim()}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: description.trim() ? 'rgba(107,143,113,0.3)' : 'rgba(255,255,255,0.05)',
            color: description.trim() ? '#6b8f71' : '#475569',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: description.trim() ? 'pointer' : 'default',
          }}
        >
          Send Feedback
        </button>
        <a
          href={`mailto:${supportEmail}`}
          style={{
            color: '#64748b',
            fontSize: '0.75rem',
            textDecoration: 'none',
          }}
        >
          Contact support
        </a>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    return { hasError: true, error, errorId };
  }

  override componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);

    try {
      const pkg = '@sentry/react';
      import(/* @vite-ignore */ pkg)
        .then((Sentry) => {
          if (Sentry.isInitialized()) {
            Sentry.captureException(error, {
              contexts: { react: { componentStack: errorInfo.componentStack } },
            });
          }
        })
        .catch(() => {});
    } catch {
      /* Sentry not available */
    }

    try {
      const body = JSON.stringify({
        errorId: this.state.errorId,
        app: this.props.appName || 'unknown',
        message: error.message,
        stack: error.stack?.slice(0, 2000),
        componentStack: errorInfo.componentStack?.slice(0, 2000),
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/observability/client-errors', blob);
      } else {
        fetch('/api/observability/client-errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* silent */
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  handleGoHome = () => {
    const href =
      this.props.homeHref || window.location.pathname.split('/').slice(0, 2).join('/') || '/';
    window.location.href = href;
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;
      const {
        appName = 'Application',
        supportEmail = 'support@stephenl.dev',
        accentColor = '#8b7ac8',
      } = this.props;

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%)',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '2.5rem',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(196,90,74,0.15)',
                  border: '1px solid rgba(196,90,74,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  fontSize: '28px',
                }}
              >
                ⚡
              </div>

              <h1
                style={{
                  color: '#f1f5f9',
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  letterSpacing: '-0.01em',
                }}
              >
                Something went wrong
              </h1>

              <p
                style={{
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  marginBottom: '0.5rem',
                }}
              >
                {appName} encountered an unexpected error. Our team has been notified.
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1.25rem',
                  marginTop: '0.5rem',
                }}
              >
                <p
                  style={{
                    color: '#64748b',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    margin: 0,
                  }}
                  title={error.message}
                >
                  {error.message}
                </p>
                {errorId && (
                  <p
                    style={{
                      color: '#475569',
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      margin: '0.5rem 0 0',
                    }}
                  >
                    Reference: {errorId}
                  </p>
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: accentColor,
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => ((e.target as HTMLButtonElement).style.opacity = '0.85')}
                onMouseOut={(e) => ((e.target as HTMLButtonElement).style.opacity = '1')}
              >
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  const btn = e.target as HTMLButtonElement;
                  btn.style.color = '#f1f5f9';
                  btn.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseOut={(e) => {
                  const btn = e.target as HTMLButtonElement;
                  btn.style.color = '#94a3b8';
                  btn.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                Go Home
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  const btn = e.target as HTMLButtonElement;
                  btn.style.color = '#f1f5f9';
                  btn.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseOut={(e) => {
                  const btn = e.target as HTMLButtonElement;
                  btn.style.color = '#94a3b8';
                  btn.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                Reload Page
              </button>
            </div>

            <UserFeedbackForm errorId={errorId} appName={appName} supportEmail={supportEmail} />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorRef: string | null;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorRef: null };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error, errorRef: null };
  }

  override componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    const errorRef = `ref_${Date.now().toString(36).slice(-6)}`;
    this.setState({ errorRef });
    console.error(
      `[SectionErrorBoundary:${this.props.sectionName || 'unknown'}] ${errorRef}`,
      error,
      errorInfo,
    );
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorRef: null });
  };

  override render() {
    if (this.state.hasError) {
      const { sectionName = 'This section' } = this.props;
      const { errorRef } = this.state;
      return (
        <div
          style={{
            padding: '2rem',
            background: 'rgba(196,90,74,0.05)',
            border: '1px solid rgba(196,90,74,0.15)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>
            {sectionName} is temporarily unavailable
          </p>
          {errorRef && (
            <p
              style={{
                color: '#475569',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                margin: '0 0 1rem',
              }}
            >
              Reference: {errorRef}
            </p>
          )}
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#94a3b8',
              fontSize: '0.8rem',
              cursor: 'pointer',
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
