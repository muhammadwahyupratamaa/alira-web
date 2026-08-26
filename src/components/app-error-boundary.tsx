import { Component, type ErrorInfo, type PropsWithChildren } from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  PropsWithChildren,
  AppErrorBoundaryState
> {
  public state: AppErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('Unhandled application error', error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell">
          <section className="surface" role="alert">
            <p className="eyebrow">Something went wrong</p>
            <h1>We could not load Alira.</h1>
            <p className="lede">Please refresh the page and try again.</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
