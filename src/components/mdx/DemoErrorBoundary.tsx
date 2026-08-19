"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export class DemoErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") console.error(error, info.componentStack);
  }
  retry = () => { this.setState({ failed: false }); this.props.onRetry(); };
  render() {
    return this.state.failed
      ? <div role="alert"><p>데모를 불러오지 못했습니다.</p><button type="button" onClick={this.retry}>다시 불러오기</button></div>
      : this.props.children;
  }
}
