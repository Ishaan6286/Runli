import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "white", background: "red", height: "100vh", overflow: "auto" }}>
          <h2>React Crash!</h2>
          <p style={{ fontSize: "1.1rem", fontWeight: "bold", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
            {this.state.error && this.state.error.toString()}
          </p>
          <details open style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px" }}>
            <summary style={{ cursor: "pointer", marginBottom: "0.5rem", fontWeight: "bold" }}>Component Stack</summary>
            {this.state.errorInfo?.componentStack}
            <br />
            {this.state.error?.stack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
