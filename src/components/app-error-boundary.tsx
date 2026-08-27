import {
  Component,
  createRef,
  type ErrorInfo,
  type PropsWithChildren,
} from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  PropsWithChildren,
  AppErrorBoundaryState
> {
  public state: AppErrorBoundaryState = { hasError: false };
  private readonly headingRef = createRef<HTMLHeadingElement>();

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('Unhandled application error', error, errorInfo);
    }
  }

  public componentDidMount(): void {
    if (this.state.hasError) {
      this.headingRef.current?.focus();
    }
  }

  public componentDidUpdate(
    _previousProps: PropsWithChildren,
    previousState: AppErrorBoundaryState,
  ): void {
    if (!previousState.hasError && this.state.hasError) {
      this.headingRef.current?.focus();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell">
          <section className="surface app-error-surface" role="alert">
            <p className="eyebrow">Aliran terhenti</p>
            <h1 ref={this.headingRef} tabIndex={-1}>
              Alira belum dapat dibuka.
            </h1>
            <p className="lede">
              Data Anda tetap aman. Coba muat ulang atau kembali ke halaman
              masuk.
            </p>
            <div className="app-error-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                }}
              >
                Coba lagi
              </button>
              <a className="secondary-link" href="/login">
                Kembali ke halaman masuk
              </a>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
