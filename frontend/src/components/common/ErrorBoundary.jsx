import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Ledger encountered an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-md py-24 text-center">
          <p className="font-display text-2xl text-ink">Something tore a page.</p>
          <p className="mt-2 text-sm text-muted">
            Refresh to keep reading — your progress is saved.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
