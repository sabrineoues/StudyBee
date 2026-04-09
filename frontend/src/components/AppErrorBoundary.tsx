import React from "react";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
  componentStack: string | null;
};

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep console output for debugging.
    // eslint-disable-next-line no-console
    console.error("Uncaught app error", error, info);

    this.setState({ componentStack: info.componentStack ?? null });
  }

  render() {
    const { error, componentStack } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="min-h-[100dvh] bg-background text-on-background">
        <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 pb-24 pt-28 md:px-12">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Something went wrong
          </h1>
          <p className="text-on-surface-variant">
            The app crashed while rendering this page. Open DevTools → Console to see
            the full error.
          </p>

          <div className="rounded-xl bg-surface-container-low p-4 ring-1 ring-outline-variant/10">
            <div className="text-sm font-bold text-on-surface">{error.name}</div>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-on-surface-variant">
              {error.message}
              {componentStack ? `\n\n${componentStack}` : ""}
            </pre>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-surface-container-highest/70 px-5 py-3 text-sm font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant/10 transition-transform transition-colors duration-200 hover:scale-105 hover:bg-surface-container-highest active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => this.setState({ error: null, componentStack: null })}
              className="rounded-full bg-surface-container-low px-5 py-3 text-sm font-semibold text-on-surface-variant ring-1 ring-outline-variant/10 transition-colors hover:text-on-surface"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }
}
