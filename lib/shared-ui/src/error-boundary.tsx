import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  appName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const { appName = "Application" } = this.props;

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%)",
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            padding: "2rem",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "2.5rem",
              backdropFilter: "blur(12px)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
                fontSize: "28px",
              }}
            >
              ⚡
            </div>

            <h1
              style={{
                color: "#f1f5f9",
                fontSize: "1.4rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                letterSpacing: "-0.01em",
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                color: "#94a3b8",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                marginBottom: "0.5rem",
              }}
            >
              {appName} encountered an unexpected error. Our team has been notified.
            </p>

            {error && (
              <p
                style={{
                  color: "#64748b",
                  fontSize: "0.8rem",
                  fontFamily: "monospace",
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  marginBottom: "1.5rem",
                  textAlign: "left",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={error.message}
              >
                {error.message}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "linear-gradient(135deg, #8b7ac8, #8b7ac8)",
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseOver={(e) => ((e.target as HTMLButtonElement).style.opacity = "0.85")}
                onMouseOut={(e) => ((e.target as HTMLButtonElement).style.opacity = "1")}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "#94a3b8",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  const btn = e.target as HTMLButtonElement;
                  btn.style.color = "#f1f5f9";
                  btn.style.borderColor = "rgba(255,255,255,0.2)";
                }}
                onMouseOut={(e) => {
                  const btn = e.target as HTMLButtonElement;
                  btn.style.color = "#94a3b8";
                  btn.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
