import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled error inside component tree:', error, errorInfo);
    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('ErrorBoundary onError handler failed:', handlerError);
      }
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === 'function') {
      try {
        this.props.onReset();
        return;
      } catch (error) {
        console.error('ErrorBoundary onReset handler failed:', error);
      }
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <p>We ran into an unexpected error while rendering this page.</p>
          {this.state.error && (
            <pre style={{ textAlign: 'left', background: '#f2f2f2', padding: '1rem', overflow: 'auto' }}>
              {this.state.error.message}
            </pre>
          )}
          <button type="button" onClick={this.handleReload} style={{ marginTop: '1rem' }}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
