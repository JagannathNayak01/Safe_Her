import React from 'react';

/**
 * ErrorBoundary — catches JS errors anywhere in the component tree below it
 * and renders a friendly fallback UI instead of a white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log in dev only to avoid leaking stack traces in production
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, info.componentStack);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg,#0f172a,#1e293b)',
          padding: '2rem',
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: '2.5rem 2rem',
            textAlign: 'center',
            color: '#f1f5f9',
          }}
        >
          {/* Icon */}
          <div style={{ fontSize: 52, marginBottom: '1rem' }}>⚠️</div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.6rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
            An unexpected error occurred. Your data is safe — refresh the page to continue.
          </p>

          {/* Error detail in dev */}
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre
              style={{
                background: 'rgba(0,0,0,0.35)',
                borderRadius: 10,
                padding: '1rem',
                fontSize: '0.75rem',
                color: '#fca5a5',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.toString()}
            </pre>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)',
              border: 'none',
              borderRadius: 10,
              padding: '0.8rem 2rem',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    );
  }
}
