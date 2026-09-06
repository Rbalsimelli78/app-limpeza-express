import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
          borderRadius: 'var(--radius-lg, 12px)',
          margin: '1.5rem 0',
          color: 'var(--text-primary, #fff)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            marginBottom: '1rem'
          }}>
            <AlertTriangle size={32} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            {this.props.title || 'Ocorreu um imprevisto ao exibir esta tela'}
          </h3>

          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.875rem', maxWidth: '480px', margin: '0 auto 1.25rem' }}>
            {this.props.message || 'Houve um erro temporário de carregamento de dados. Você pode recarregar para restaurar a visualização.'}
          </p>

          {this.state.error?.message && (
            <div style={{
              background: 'rgba(0,0,0,0.35)',
              padding: '0.625rem 1rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: '#fca5a5',
              maxWidth: '560px',
              margin: '0 auto 1.25rem',
              textAlign: 'left',
              wordBreak: 'break-word'
            }}>
              {this.state.error.message}
            </div>
          )}

          <button
            type="button"
            onClick={this.handleReset}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
          >
            <RefreshCw size={16} />
            <span>Recarregar Tela</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
