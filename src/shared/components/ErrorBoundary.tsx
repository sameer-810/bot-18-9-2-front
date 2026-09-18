import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : "Unknown error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-screen items-center justify-center p-8">
          <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
            <div className="text-lg font-semibold text-destructive">Something went wrong</div>
            <div className="mt-2 text-sm text-muted-foreground">{this.state.message}</div>
            <button
              className="mt-4 rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
